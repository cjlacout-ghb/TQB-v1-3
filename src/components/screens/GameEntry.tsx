'use client';

import React, { useState, useCallback, useMemo, memo, useRef, useEffect } from 'react';
import { Calculator, AlertCircle, HelpCircle, ArrowLeft } from 'lucide-react';
import { Team, GameData, GroupID } from '@/lib/types';
import { isGameFinalAndValid, validateInningsFormat, inningsToOuts, areAllGroupsValidForCalculation } from '@/lib/calculations';
import { MAX_UNFIXED_GAMES_PER_GROUP } from '@/lib/constants';
import StepIndicator from '../StepIndicator';
import GameCard from '../GameCard';
import { useLanguage } from '@/contexts/LanguageContext';
import { Tooltip } from '@/components/ui/Tooltip';


interface GameEntryProps {
    teams: Team[];
    games: GameData[];
    onGamesChange: (games: GameData[] | ((prev: GameData[]) => GameData[])) => void;
    onToggleLockGame: (gameId: string) => void;
    onReorderGame: (gameId: string, direction: 'up' | 'down') => void;
    onCalculate: () => void;
    onBack?: () => void;
    totalSteps: number;
    isMultiGroup: boolean;
    activeGroupId: GroupID;
    onSetActiveGroupId: (id: GroupID) => void;
}

interface UnfixedGroupWarning {
    groupId: GroupID;
    canLockGames: Array<{ label: string }>;
    needFixGames: Array<{ label: string; reason: string }>;
}

const GameEntry = memo(function GameEntry({
    teams,
    games,
    onGamesChange,
    onToggleLockGame,
    onReorderGame,
    onCalculate,
    onBack,
    totalSteps,
    isMultiGroup,
    activeGroupId,
    onSetActiveGroupId,
}: GameEntryProps) {
    const { t } = useLanguage();
    const [errors, setErrors] = useState<Record<string, Record<string, string>>>({});
    const [unfixedWarnings, setUnfixedWarnings] = useState<UnfixedGroupWarning[]>([]);
    const [showInningsHelp, setShowInningsHelp] = useState(false);
    const errorSummaryRef = useRef<HTMLDivElement>(null);
    const errorSummaryShakeRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Clear unfixedWarnings when the games data changes such that the condition is no longer met
    useEffect(() => {
        const canCalc = areAllGroupsValidForCalculation(games, isMultiGroup);
        if (canCalc) {
            setUnfixedWarnings([]);
            setErrors({});
        }
    }, [games, isMultiGroup]);

    const updateGame = useCallback((
        gameId: string,
        updates: Partial<GameData>
    ) => {
        onGamesChange(prevGames =>
            prevGames.map(g => g.id === gameId ? { ...g, ...updates } : g)
        );

        // Clear errors for updated fields
        setErrors(prevErrors => {
            if (!prevErrors[gameId]) return prevErrors;

            const nextGameErrors = { ...prevErrors[gameId] };
            let changed = false;
            Object.keys(updates).forEach(key => {
                if (nextGameErrors[key]) {
                    nextGameErrors[key] = '';
                    changed = true;
                }
            });

            if (changed) {
                return {
                    ...prevErrors,
                    [gameId]: nextGameErrors,
                };
            }
            return prevErrors;
        });
    }, [onGamesChange]);

    const swapTeams = useCallback((gameId: string) => {
        onGamesChange(prevGames => prevGames.map(game => {
            if (game.id === gameId) {
                return {
                    ...game,
                    teamAId: game.teamBId,
                    teamBId: game.teamAId,
                    teamAName: game.teamBName,
                    teamBName: game.teamAName,
                    runsA: game.runsB,
                    runsB: game.runsA,
                    inningsABatting: game.inningsBBatting,
                    inningsADefense: game.inningsBDefense,
                    inningsBBatting: game.inningsABatting,
                    inningsBDefense: game.inningsADefense,
                    earnedRunsA: game.earnedRunsB,
                    earnedRunsB: game.earnedRunsA,
                };
            }
            return game;
        }));
    }, [onGamesChange]);

    /** Returns true if all games are valid; always sets errors and unfixedWarnings as a side effect. */
    const validateGames = useCallback((currentGames: GameData[]): boolean => {
        const newErrors: Record<string, Record<string, string>> = {};
        const warnings: UnfixedGroupWarning[] = [];
        let hasErrors = false;

        // 1. Validate individual games
        for (const game of currentGames) {
            const gameErrors: Record<string, string> = {};

            // Validate runs (required, non-negative)
            if (game.runsA === null || game.runsA === undefined || game.runsA < 0) {
                gameErrors.runsA = t.common.required;
                hasErrors = true;
            }
            if (game.runsB === null || game.runsB === undefined || game.runsB < 0) {
                gameErrors.runsB = t.common.required;
                hasErrors = true;
            }

            // Validate innings format (X, X.1, or X.2)
            const inningsFields: (keyof GameData)[] = [
                'inningsABatting', 'inningsADefense',
                'inningsBBatting', 'inningsBDefense'
            ];

            for (const field of inningsFields) {
                const value = game[field] as string;
                if (!value || !validateInningsFormat(value)) {
                    gameErrors[field] = t.gameEntry.errors.invalidFormat;
                    hasErrors = true;
                }
            }

            // Strict End-of-Game Logic Restrictions ONLY apply to locked games
            if (game.isLocked) {
                const visitorOuts = inningsToOuts(game.inningsABatting);
                const homeOuts = inningsToOuts(game.inningsBBatting);
                const visitorRuns = game.runsA ?? 0;
                const homeRuns = game.runsB ?? 0;

                if (homeRuns > visitorRuns) {
                    if (homeOuts >= visitorOuts) {
                        gameErrors.inningsBBatting = t.gameEntry.errors.winningHome;
                        hasErrors = true;
                    }
                } else if (homeRuns < visitorRuns) {
                    if (homeOuts !== visitorOuts) {
                        gameErrors.inningsBBatting = t.gameEntry.errors.losingHome;
                        hasErrors = true;
                    }
                }
            }

            if (Object.keys(gameErrors).length > 0) {
                newErrors[game.id] = gameErrors;
            }
        }

        // 2. Validate max unfixed games per group rule
        const activeGroups: GroupID[] = isMultiGroup ? ['A', 'B'] : ['A'];
        for (const gId of activeGroups) {
            const groupGames = currentGames.filter(g => (g.groupId ?? 'A') === gId);
            const unfixed = groupGames.filter(g => !g.isLocked);

            if (unfixed.length > MAX_UNFIXED_GAMES_PER_GROUP) {
                hasErrors = true;
                const canLockGames: UnfixedGroupWarning['canLockGames'] = [];
                const needFixGames: UnfixedGroupWarning['needFixGames'] = [];

                unfixed.forEach((g, idx) => {
                    const label = `#${idx + 1} ${g.teamAName} vs ${g.teamBName}`;
                    if (isGameFinalAndValid(g)) {
                        canLockGames.push({ label });
                    } else {
                        // Determine specific reason
                        const missingData = (
                            g.runsA === null || g.runsA === undefined || g.runsA < 0 ||
                            g.runsB === null || g.runsB === undefined || g.runsB < 0 ||
                            !validateInningsFormat(g.inningsABatting) ||
                            !validateInningsFormat(g.inningsADefense) ||
                            !validateInningsFormat(g.inningsBBatting) ||
                            !validateInningsFormat(g.inningsBDefense)
                        );
                        const reason = missingData
                            ? t.gameEntry.lockBlockedIntegrity
                            : t.gameEntry.lockBlockedStrict;
                        needFixGames.push({ label, reason });
                    }
                });

                warnings.push({ groupId: gId, canLockGames, needFixGames });
            }
        }

        setErrors(newErrors);
        setUnfixedWarnings(warnings);
        return !hasErrors;
    }, [games, isMultiGroup, t]); // eslint-disable-line react-hooks/exhaustive-deps

    const canCalculate = useMemo(() => {
        return areAllGroupsValidForCalculation(games, isMultiGroup);
    }, [games, isMultiGroup]);

    const handleCalculate = useCallback(() => {
        const valid = validateGames(games);
        if (valid) {
            onCalculate();
        } else {
            // Scroll error summary into view
            setTimeout(() => {
                if (errorSummaryRef.current) {
                    errorSummaryRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    // Shake on repeat click
                    errorSummaryRef.current.classList.remove('animate-shake');
                    void errorSummaryRef.current.offsetWidth;
                    errorSummaryRef.current.classList.add('animate-shake');
                    if (errorSummaryShakeRef.current) clearTimeout(errorSummaryShakeRef.current);
                    errorSummaryShakeRef.current = setTimeout(() => {
                        errorSummaryRef.current?.classList.remove('animate-shake');
                    }, 400);
                }
            }, 50);
        }
    }, [validateGames, games, onCalculate]);

    // Tab-filtered display subset — update ops still target the full games array by ID
    const displayGames = useMemo(() =>
        isMultiGroup ? games.filter(g => g.groupId === activeGroupId) : games,
        [games, isMultiGroup, activeGroupId]);

    const gamesCount = isMultiGroup ? displayGames.length : games.length;
    const teamsCount = isMultiGroup
        ? teams.filter(t => t.groupId === activeGroupId).length
        : teams.length;

    // Per-group readiness: green dot when every game in that group is fully filled
    const isGroupFilled = useCallback((gId: GroupID): boolean =>
        games.filter(g => g.groupId === gId).every(game =>
            game.runsA !== null && game.runsA !== undefined &&
            game.runsB !== null && game.runsB !== undefined &&
            game.inningsABatting && validateInningsFormat(game.inningsABatting) &&
            game.inningsADefense && validateInningsFormat(game.inningsADefense) &&
            game.inningsBBatting && validateInningsFormat(game.inningsBBatting) &&
            game.inningsBDefense && validateInningsFormat(game.inningsBDefense)
        ), [games]);

    /**
     * Compute whether a given game's group qualifies for the "In Play" badge:
     * exactly 1 unfixed game in the group AND at least 1 locked game.
     */
    const inPlayBadgeGameIds = useMemo((): Set<string> => {
        const activeGroups: GroupID[] = isMultiGroup ? ['A', 'B'] : ['A'];
        const ids = new Set<string>();
        for (const gId of activeGroups) {
            const groupGames = games.filter(g => (g.groupId ?? 'A') === gId);
            const lockedCount = groupGames.filter(g => g.isLocked).length;
            const unfixed = groupGames.filter(g => !g.isLocked);
            if (lockedCount >= 1 && unfixed.length === 1) {
                ids.add(unfixed[0].id);
            }
        }
        return ids;
    }, [games, isMultiGroup]);

    const hasErrors = Object.keys(errors).length > 0 || unfixedWarnings.length > 0;

    return (
        <div className="max-w-4xl mx-auto animate-fade-in">
            <StepIndicator currentStep={2} totalSteps={totalSteps} />

            <div className="card">
                <div className="card-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        {onBack && (
                            <Tooltip text={t.tooltips.gameEntryBack}>
                                <button
                                    onClick={onBack}
                                    className="group flex items-center justify-center w-10 h-10 rounded-full bg-dark-600 text-gray-400 hover:text-white hover:bg-dark-500 transition-all duration-200"
                                    aria-label={t.tooltips.gameEntryBack}
                                >
                                    <ArrowLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
                                </button>
                            </Tooltip>
                        )}
                        <div>
                            <h2 className="text-2xl font-bold text-white">{t.gameEntry.title}</h2>
                            <p className="text-sm text-gray-400 mt-1">
                                {t.gameEntry.description.replace('{games}', gamesCount.toString()).replace('{teams}', teamsCount.toString())}
                            </p>
                        </div>
                    </div>

                    {/* Innings Help Toggle */}
                    <Tooltip text={t.gameEntry.inningsHelp}>
                        <button
                            onClick={() => setShowInningsHelp(!showInningsHelp)}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm text-primary-400 
                  hover:bg-primary-500/10 rounded-lg transition-colors"
                        >
                            <HelpCircle size={16} />
                            {t.gameEntry.inningsHelp}
                        </button>
                    </Tooltip>
                </div>

                {/* Group A / B tab strip — only in multi-group mode. */}
                {isMultiGroup && (
                    <div className="px-6 pt-2">
                        <div className="flex p-1 bg-dark-900/50 rounded-xl border border-dark-600">
                            {(['A', 'B'] as GroupID[]).map(gId => {
                                const ready = isGroupFilled(gId);
                                const isActive = activeGroupId === gId;
                                return (
                                    <Tooltip key={gId} text={t.tooltips.gameEntryGroupTab.replace('{gId}', gId)} className="flex-1">
                                        <button
                                            onClick={() => { onSetActiveGroupId(gId); setErrors({}); }}
                                            className={`w-full flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all
                                                ${isActive ? 'bg-primary-500 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                                        >
                                            {t.common.groupTab.replace('{gId}', gId)}
                                            <span
                                                title={ready ? 'Completo' : 'Pendiente'}
                                                className={`w-2 h-2 rounded-full transition-colors ${
                                                    ready ? 'bg-green-400' : 'bg-yellow-500/70'
                                                }`}
                                            />
                                        </button>
                                    </Tooltip>
                                );
                            })}
                        </div>
                    </div>
                )}

                <div className="card-body space-y-6">
                    {/* Innings Help Panel */}
                    {showInningsHelp && (
                        <div className="p-4 bg-primary-500/10 border border-primary-500/30 rounded-xl animate-slide-up">
                            <h4 className="text-sm font-semibold text-primary-400 mb-2">
                                {t.gameEntry.howToEnter}
                            </h4>
                            <ul className="text-sm text-gray-300 space-y-1">
                                {t.gameEntry.inningsExamples.map((ex, i) => (
                                    <li key={i}><span className="font-mono text-primary-300">{ex.val}</span> = {ex.desc}</li>
                                ))}
                            </ul>
                            {t.gameEntry.softballNote && (
                                <p className="text-xs text-gray-400 mt-2">
                                    {t.gameEntry.softballNote}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Games List */}
                    <div className="space-y-4">
                        {displayGames.map((game, index) => (
                            <GameCard
                                key={game.id}
                                game={game}
                                gameNumber={index + 1}
                                isFirst={index === 0}
                                isLast={index === displayGames.length - 1}
                                errors={errors[game.id] || {}}
                                onUpdate={updateGame}
                                onSwap={swapTeams}
                                onToggleLock={onToggleLockGame}
                                onMoveUp={() => onReorderGame(game.id, 'up')}
                                onMoveDown={() => onReorderGame(game.id, 'down')}
                                showInPlayBadge={inPlayBadgeGameIds.has(game.id)}
                            />
                        ))}
                    </div>

                    {/* Error Summary & Unfixed Games Warnings — aria-live so screen readers announce it */}
                    {hasErrors && (
                        <div
                            ref={errorSummaryRef}
                            role="alert"
                            aria-live="polite"
                            className="p-4 bg-error-500/10 border border-error-500/30 rounded-xl flex items-start gap-3"
                        >
                            <AlertCircle size={20} className="text-error-400 flex-shrink-0 mt-0.5" />
                            <div className="space-y-2 flex-1">
                                <p className="text-sm font-medium text-error-400">
                                    {t.gameEntry.errors.summary}
                                </p>
                                {/* Individual field errors */}
                                {Object.keys(errors).length > 0 && unfixedWarnings.length === 0 && (
                                    <p className="text-xs text-error-300">
                                        {t.gameEntry.errors.detail}
                                    </p>
                                )}
                                {/* Too-many-unfixed warnings */}
                                {unfixedWarnings.map(w => (
                                    <div key={w.groupId} className="pt-2 border-t border-error-500/20 text-xs space-y-1.5">
                                        <p className="font-semibold text-warning-400">
                                            {isMultiGroup ? `[${t.common.groupTab.replace('{gId}', w.groupId)}] ` : ''}{t.gameEntry.errors.tooManyUnfixed}
                                        </p>
                                        <p className="text-gray-300 text-[11px]">
                                            {t.gameEntry.calculateBlockedInstruction}
                                        </p>
                                        {w.canLockGames.length > 0 && (
                                            <ul className="space-y-0.5">
                                                {w.canLockGames.map((g, i) => (
                                                    <li key={i} className="text-emerald-300 flex items-start gap-1">
                                                        <span className="mt-0.5">✓</span>
                                                        <span>{g.label} — {t.gameEntry.errors.unfixedCanLockList.replace('{games}', '').trim()}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                        {w.needFixGames.length > 0 && (
                                            <ul className="space-y-0.5">
                                                {w.needFixGames.map((g, i) => (
                                                    <li key={i} className="text-amber-300 flex items-start gap-1">
                                                        <span className="mt-0.5">⚠</span>
                                                        <span>{g.label} — {g.reason}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Calculate Button — never truly disabled; always fires handleCalculate */}
                    <div className="pt-4">
                        <Tooltip text={canCalculate ? t.tooltips.gameEntryCalculate : t.tooltips.gameEntryCalculateDisabled} className="w-full">
                            <button
                                onClick={handleCalculate}
                                aria-disabled={!canCalculate}
                                className={`w-full btn-success py-4 text-xl shadow-xl shadow-success-500/20 ${
                                    !canCalculate ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                            >
                                <Calculator size={22} className="mr-1" />
                                {t.gameEntry.calculateButton}
                            </button>
                        </Tooltip>
                    </div>

                </div>
            </div>
        </div>
    );
});

export default GameEntry;


