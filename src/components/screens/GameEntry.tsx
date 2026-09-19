'use client';

import React, { useState, useCallback, useMemo, memo } from 'react';
import { Calculator, AlertCircle, HelpCircle, ArrowLeftRight, ArrowLeft, ChevronUp, ChevronDown, Lock, Unlock } from 'lucide-react';
import { Team, GameData, GroupID } from '@/lib/types';
import { validateInningsFormat, inningsToOuts, isGameCompleteAndValid } from '@/lib/calculations';
import StepIndicator from '../StepIndicator';
import { useLanguage } from '@/contexts/LanguageContext';

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
    const [showInningsHelp, setShowInningsHelp] = useState(false);

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

    const validateGames = useCallback((): boolean => {
        const newErrors: Record<string, Record<string, string>> = {};
        let hasErrors = false;

        for (const game of games) {
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

            // Logic Restrictions:
            const visitorOuts = inningsToOuts(game.inningsABatting);
            const homeOuts = inningsToOuts(game.inningsBBatting);
            const visitorRuns = game.runsA ?? 0;
            const homeRuns = game.runsB ?? 0;

            if (homeRuns > visitorRuns) {
                // Home team won
                if (homeOuts >= visitorOuts) {
                    gameErrors.inningsBBatting = t.gameEntry.errors.winningHome;
                    hasErrors = true;
                }
            } else if (homeRuns < visitorRuns) {
                // Visitor team won
                if (homeOuts !== visitorOuts) {
                    gameErrors.inningsBBatting = t.gameEntry.errors.losingHome;
                    hasErrors = true;
                }
            }

            if (Object.keys(gameErrors).length > 0) {
                newErrors[game.id] = gameErrors;
            }
        }

        setErrors(newErrors);
        return !hasErrors;
    }, [games, t]);

    const handleCalculate = useCallback(() => {
        if (validateGames()) {
            onCalculate();
        }
    }, [validateGames, onCalculate]);

    // Calculate is enabled only when ALL games (both groups) are complete
    const allFieldsFilled = useMemo(() => {
        return games.every(game =>
            game.runsA !== null && game.runsA !== undefined &&
            game.runsB !== null && game.runsB !== undefined &&
            game.inningsABatting && validateInningsFormat(game.inningsABatting) &&
            game.inningsADefense && validateInningsFormat(game.inningsADefense) &&
            game.inningsBBatting && validateInningsFormat(game.inningsBBatting) &&
            game.inningsBDefense && validateInningsFormat(game.inningsBDefense)
        );
    }, [games]);

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

    return (
        <div className="max-w-4xl mx-auto animate-fade-in">
            <StepIndicator currentStep={2} totalSteps={totalSteps} />

            <div className="card">
                <div className="card-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        {onBack && (
                            <button
                                onClick={onBack}
                                className="group flex items-center justify-center w-10 h-10 rounded-full bg-dark-600 text-gray-400 hover:text-white hover:bg-dark-500 transition-all duration-200"
                                aria-label={t.common.back}
                            >
                                <ArrowLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
                            </button>
                        )}
                        <div>
                            <h2 className="text-2xl font-bold text-white">{t.gameEntry.title}</h2>
                            <p className="text-sm text-gray-400 mt-1">
                                {t.gameEntry.description.replace('{games}', gamesCount.toString()).replace('{teams}', teamsCount.toString())}
                            </p>
                        </div>
                    </div>

                    {/* Innings Help Toggle */}
                    <button
                        onClick={() => setShowInningsHelp(!showInningsHelp)}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm text-primary-400 
              hover:bg-primary-500/10 rounded-lg transition-colors"
                    >
                        <HelpCircle size={16} />
                        {t.gameEntry.inningsHelp}
                    </button>
                </div>

                {/* Group A / B tab strip — only in multi-group mode.
                    Inner GameCard rows and all update/swap handlers are NOT modified. */}
                {isMultiGroup && (
                    <div className="px-6 pt-2">
                        <div className="flex p-1 bg-dark-900/50 rounded-xl border border-dark-600">
                            {(['A', 'B'] as GroupID[]).map(gId => {
                                const ready = isGroupFilled(gId);
                                const isActive = activeGroupId === gId;
                                return (
                                    <button
                                        key={gId}
                                        onClick={() => { onSetActiveGroupId(gId); setErrors({}); }}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all
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
                            />
                        ))}
                    </div>

                    {/* Error Summary */}
                    {Object.keys(errors).length > 0 && (
                        <div className="p-4 bg-error-500/10 border border-error-500/30 rounded-xl flex items-start gap-3">
                            <AlertCircle size={20} className="text-error-400 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-error-400">
                                    {t.gameEntry.errors.summary}
                                </p>
                                <p className="text-xs text-error-300 mt-1">
                                    {t.gameEntry.errors.detail}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Calculate Button */}
                    <div className="pt-4">
                        <button
                            onClick={handleCalculate}
                            disabled={!allFieldsFilled}
                            className="w-full btn-success py-4 text-xl shadow-xl shadow-success-500/20"
                        >
                            <Calculator size={22} className="mr-1" />
                            {t.gameEntry.calculateButton}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
});

export default GameEntry;

// Subcomponent for each game card
interface GameCardProps {
    game: GameData;
    gameNumber: number;
    isFirst: boolean;
    isLast: boolean;
    errors: Record<string, string>;
    onUpdate: (gameId: string, updates: Partial<GameData>) => void;
    onSwap: (gameId: string) => void;
    onToggleLock: (gameId: string) => void;
    onMoveUp: () => void;
    onMoveDown: () => void;
}

const GameCard = memo(function GameCard({ game, gameNumber, isFirst, isLast, errors, onUpdate, onSwap, onToggleLock, onMoveUp, onMoveDown }: GameCardProps) {
    const { t } = useLanguage();
    const canLock = isGameCompleteAndValid(game);

    const handleRunsChange = (field: 'runsA' | 'runsB', value: string) => {
        if (game.isLocked) return;
        const num = value === '' ? null : parseInt(value, 10);
        if (value === '' || (!isNaN(num!) && num! >= 0)) {
            onUpdate(game.id, { [field]: num });
        }
    };

    const handleInningsChange = (field: keyof GameData, value: string) => {
        if (game.isLocked) return;
        // Allow empty, digits, and single decimal point
        if (value === '' || /^\d*\.?[012]?$/.test(value)) {
            const updates: Partial<GameData> = { [field]: value };

            // Softball Rule: At Bat for Team A = Defense for Team B
            if (field === 'inningsABatting') updates.inningsBDefense = value;
            if (field === 'inningsADefense') updates.inningsBBatting = value;
            if (field === 'inningsBBatting') updates.inningsADefense = value;
            if (field === 'inningsBDefense') updates.inningsABatting = value;

            onUpdate(game.id, updates);
        }
    };

    return (
        <div className={`game-card animate-slide-up transition-all ${game.isLocked ? 'border-primary-500/40 bg-dark-800/90 shadow-md shadow-primary-500/5' : ''}`}>
            {/* Game Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-dark-600">
                <div className="flex items-center gap-3">
                    {/* Controls: Reorder + Lock */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                        <div className="flex flex-col gap-1">
                            <button
                                type="button"
                                onClick={onMoveUp}
                                disabled={isFirst}
                                aria-label={t.gameEntry.moveUp}
                                className="flex items-center justify-center w-7 h-5 rounded bg-dark-700 hover:bg-dark-600 text-gray-300 hover:text-white disabled:opacity-25 disabled:hover:bg-dark-700 disabled:hover:text-gray-300 disabled:cursor-not-allowed border border-dark-500 transition-colors"
                            >
                                <ChevronUp size={14} />
                            </button>
                            <button
                                type="button"
                                onClick={onMoveDown}
                                disabled={isLast}
                                aria-label={t.gameEntry.moveDown}
                                className="flex items-center justify-center w-7 h-5 rounded bg-dark-700 hover:bg-dark-600 text-gray-300 hover:text-white disabled:opacity-25 disabled:hover:bg-dark-700 disabled:hover:text-gray-300 disabled:cursor-not-allowed border border-dark-500 transition-colors"
                            >
                                <ChevronDown size={14} />
                            </button>
                        </div>

                        <button
                            type="button"
                            onClick={() => onToggleLock(game.id)}
                            disabled={!game.isLocked && !canLock}
                            aria-label={game.isLocked ? t.gameEntry.unlockGame : (canLock ? t.gameEntry.lockGame : t.gameEntry.lockDisabledTooltip)}
                            title={game.isLocked ? t.gameEntry.unlockGame : (canLock ? t.gameEntry.lockGame : t.gameEntry.lockDisabledTooltip)}
                            className={`flex items-center justify-center w-8 h-11 rounded-lg border transition-all ${
                                game.isLocked
                                    ? 'bg-primary-500/20 text-primary-400 border-primary-500/40 hover:bg-primary-500/30 shadow-sm'
                                    : canLock
                                        ? 'bg-dark-700 hover:bg-dark-600 text-gray-400 hover:text-white border-dark-500'
                                        : 'bg-dark-700/50 text-gray-600 border-dark-600 cursor-not-allowed opacity-40'
                            }`}
                        >
                            {game.isLocked ? <Lock size={16} /> : <Unlock size={16} />}
                        </button>
                    </div>

                    <span className="flex items-center justify-center w-12 h-12 bg-dark-700/50 rounded-xl text-sm font-mono text-primary-400 border border-dark-500 shadow-inner flex-shrink-0">
                        #{gameNumber}
                    </span>

                    <div>
                        <div className="flex items-center gap-3">
                            <h3 className="text-xl font-bold text-white tracking-tight">
                                {game.teamAName}
                                <span className="mx-2 text-gray-600 font-light">vs</span>
                                {game.teamBName}
                            </h3>
                            {game.isLocked && (
                                <span className="text-[10px] font-bold text-primary-400 tracking-widest uppercase bg-primary-500/10 px-2 py-0.5 rounded border border-primary-500/20">
                                    {t.gameEntry.locked}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => onSwap(game.id)}
                    disabled={game.isLocked}
                    className="flex items-center gap-2 px-4 py-2 bg-dark-600/50 hover:bg-primary-500/10 text-gray-400 hover:text-primary-400 border border-dark-500 hover:border-primary-500/30 rounded-lg transition-all text-xs font-bold uppercase tracking-wider disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-dark-600/50 disabled:hover:text-gray-400"
                >
                    <ArrowLeftRight size={14} />
                    {t.gameEntry.swapSides}
                </button>
            </div>

            {/* Two Column Layout for Teams */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Team A - Visitor */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-primary-500" />
                            <span className="font-semibold text-white">{game.teamAName}</span>
                        </div>
                        <span className="text-[10px] font-bold text-primary-400 tracking-widest uppercase bg-primary-500/10 px-2 py-0.5 rounded border border-primary-500/20">
                            {t.gameEntry.visitor}
                        </span>
                    </div>

                    <div>
                        <label className="block text-xs text-gray-400 mb-1">{t.gameEntry.runsScored}</label>
                        <input
                            type="number"
                            min="0"
                            value={game.runsA ?? ''}
                            onChange={(e) => handleRunsChange('runsA', e.target.value)}
                            disabled={game.isLocked}
                            className={`input font-mono ${errors.runsA ? 'input-error' : ''} ${game.isLocked ? 'opacity-60 cursor-not-allowed bg-dark-800' : ''}`}
                            placeholder="0"
                        />
                        {errors.runsA && (
                            <p className="mt-1 text-xs text-error-400">{errors.runsA}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">{t.gameEntry.inningsBatting}</label>
                            <input
                                type="text"
                                value={game.inningsABatting}
                                onChange={(e) => handleInningsChange('inningsABatting', e.target.value)}
                                disabled={game.isLocked}
                                className={`input font-mono ${errors.inningsABatting ? 'input-error' : ''} ${game.isLocked ? 'opacity-60 cursor-not-allowed bg-dark-800' : ''}`}
                                placeholder="0"
                            />
                            {errors.inningsABatting && (
                                <p className="mt-1 text-xs text-error-400">{errors.inningsABatting}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">{t.gameEntry.inningsDefense}</label>
                            <input
                                type="text"
                                value={game.inningsADefense}
                                onChange={(e) => handleInningsChange('inningsADefense', e.target.value)}
                                disabled={game.isLocked}
                                className={`input font-mono ${errors.inningsADefense ? 'input-error' : ''} ${game.isLocked ? 'opacity-60 cursor-not-allowed bg-dark-800' : ''}`}
                                placeholder="0"
                            />
                            {errors.inningsADefense && (
                                <p className="mt-1 text-xs text-error-400">{errors.inningsADefense}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Team B - Home */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-success-500" />
                            <span className="font-semibold text-white">{game.teamBName}</span>
                        </div>
                        <span className="text-[10px] font-bold text-success-400 tracking-widest uppercase bg-success-500/10 px-2 py-0.5 rounded border border-success-500/20">
                            {t.gameEntry.home}
                        </span>
                    </div>

                    <div>
                        <label className="block text-xs text-gray-400 mb-1">{t.gameEntry.runsScored}</label>
                        <input
                            type="number"
                            min="0"
                            value={game.runsB ?? ''}
                            onChange={(e) => handleRunsChange('runsB', e.target.value)}
                            disabled={game.isLocked}
                            className={`input font-mono ${errors.runsB ? 'input-error' : ''} ${game.isLocked ? 'opacity-60 cursor-not-allowed bg-dark-800' : ''}`}
                            placeholder="0"
                        />
                        {errors.runsB && (
                            <p className="mt-1 text-xs text-error-400">{errors.runsB}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">{t.gameEntry.inningsBatting}</label>
                            <input
                                type="text"
                                value={game.inningsBBatting}
                                onChange={(e) => handleInningsChange('inningsBBatting', e.target.value)}
                                disabled={game.isLocked}
                                className={`input font-mono ${errors.inningsBBatting ? 'input-error' : ''} ${game.isLocked ? 'opacity-60 cursor-not-allowed bg-dark-800' : ''}`}
                                placeholder="0"
                            />
                            {errors.inningsBBatting && (
                                <p className="mt-1 text-xs text-error-400">{errors.inningsBBatting}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">{t.gameEntry.inningsDefense}</label>
                            <input
                                type="text"
                                value={game.inningsBDefense}
                                onChange={(e) => handleInningsChange('inningsBDefense', e.target.value)}
                                disabled={game.isLocked}
                                className={`input font-mono ${errors.inningsBDefense ? 'input-error' : ''} ${game.isLocked ? 'opacity-60 cursor-not-allowed bg-dark-800' : ''}`}
                                placeholder="0"
                            />
                            {errors.inningsBDefense && (
                                <p className="mt-1 text-xs text-error-400">{errors.inningsBDefense}</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});
