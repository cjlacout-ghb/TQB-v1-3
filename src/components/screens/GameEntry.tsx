'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Calculator, AlertCircle, HelpCircle, ArrowLeftRight, ArrowLeft } from 'lucide-react';
import { Team, GameData } from '@/lib/types';
import { validateInningsFormat, inningsToOuts } from '@/lib/calculations';
import StepIndicator from '../StepIndicator';
import { useLanguage } from '@/contexts/LanguageContext';

interface GameEntryProps {
    teams: Team[];
    games: GameData[];
    onGamesChange: (games: GameData[]) => void;
    onCalculate: () => void;
    onBack?: () => void;
    totalSteps: number;
}

export default function GameEntry({
    teams,
    games,
    onGamesChange,
    onCalculate,
    onBack,
    totalSteps
}: GameEntryProps) {
    const { t } = useLanguage();
    const [errors, setErrors] = useState<Record<string, Record<string, string>>>({});
    const [showInningsHelp, setShowInningsHelp] = useState(false);

    const updateGame = useCallback((
        gameId: string,
        updates: Partial<GameData>
    ) => {
        onGamesChange(
            games.map(g => g.id === gameId ? { ...g, ...updates } : g)
        );

        // Clear errors for updated fields
        if (errors[gameId]) {
            const nextErrors = { ...errors[gameId] };
            let changed = false;
            Object.keys(updates).forEach(key => {
                if (nextErrors[key]) {
                    nextErrors[key] = '';
                    changed = true;
                }
            });

            if (changed) {
                setErrors(prev => ({
                    ...prev,
                    [gameId]: nextErrors,
                }));
            }
        }
    }, [games, onGamesChange, errors]);

    const swapTeams = useCallback((gameId: string) => {
        const game = games.find(g => g.id === gameId);
        if (!game) return;

        updateGame(gameId, {
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
        });
    }, [games, updateGame]);

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

    const gamesCount = games.length;
    const teamsCount = teams.length;

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
                        {games.map((game, index) => (
                            <GameCard
                                key={game.id}
                                game={game}
                                gameNumber={index + 1}
                                errors={errors[game.id] || {}}
                                onUpdate={updateGame}
                                onSwap={swapTeams}
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
}

// Subcomponent for each game card
interface GameCardProps {
    game: GameData;
    gameNumber: number;
    errors: Record<string, string>;
    onUpdate: (gameId: string, updates: Partial<GameData>) => void;
    onSwap: (gameId: string) => void;
}

const GameCard = React.memo(function GameCard({ game, gameNumber, errors, onUpdate, onSwap }: GameCardProps) {
    const { t } = useLanguage();

    const handleRunsChange = (field: 'runsA' | 'runsB', value: string) => {
        const num = value === '' ? null : parseInt(value, 10);
        if (value === '' || (!isNaN(num!) && num! >= 0)) {
            onUpdate(game.id, { [field]: num });
        }
    };

    const handleInningsChange = (field: keyof GameData, value: string) => {
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
        <div className="game-card animate-slide-up">
            {/* Game Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-dark-600">
                <div className="flex items-center gap-4">
                    <span className="flex items-center justify-center w-12 h-12 bg-dark-700/50 rounded-xl text-sm font-mono text-primary-400 border border-dark-500 shadow-inner">
                        #{gameNumber}
                    </span>
                    <div>
                        <div className="flex items-center gap-3">
                            <h3 className="text-xl font-bold text-white tracking-tight">
                                {game.teamAName}
                                <span className="mx-2 text-gray-600 font-light">vs</span>
                                {game.teamBName}
                            </h3>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 uppercase tracking-widest font-semibold font-mono">
                            {t.gameEntry.tieBreakerMatchup}
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => onSwap(game.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-dark-600/50 hover:bg-primary-500/10 text-gray-400 hover:text-primary-400 border border-dark-500 hover:border-primary-500/30 rounded-lg transition-all text-xs font-bold uppercase tracking-wider"
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
                            className={`input font-mono ${errors.runsA ? 'input-error' : ''}`}
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
                                className={`input font-mono ${errors.inningsABatting ? 'input-error' : ''}`}
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
                                className={`input font-mono ${errors.inningsADefense ? 'input-error' : ''}`}
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
                            className={`input font-mono ${errors.runsB ? 'input-error' : ''}`}
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
                                className={`input font-mono ${errors.inningsBBatting ? 'input-error' : ''}`}
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
                                className={`input font-mono ${errors.inningsBDefense ? 'input-error' : ''}`}
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
