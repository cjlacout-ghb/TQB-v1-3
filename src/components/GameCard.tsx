'use client';

import React, { memo } from 'react';
import { ArrowLeftRight, ChevronUp, ChevronDown, Lock, Unlock } from 'lucide-react';
import { GameData } from '@/lib/types';
import { isGameCompleteAndValid } from '@/lib/calculations';
import { useLanguage } from '@/contexts/LanguageContext';

export interface GameCardProps {
    game: GameData;
    gameNumber: number;
    isFirst?: boolean;
    isLast?: boolean;
    errors: Record<string, string>;
    onUpdate: (gameId: string, updates: Partial<GameData>) => void;
    onSwap: (gameId: string) => void;
    onToggleLock: (gameId: string) => void;
    onMoveUp?: () => void;
    onMoveDown?: () => void;
    showReorderButtons?: boolean;
}

export const GameCard = memo(function GameCard({
    game,
    gameNumber,
    isFirst = false,
    isLast = false,
    errors,
    onUpdate,
    onSwap,
    onToggleLock,
    onMoveUp,
    onMoveDown,
    showReorderButtons = true,
}: GameCardProps) {
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
                        {showReorderButtons && onMoveUp && onMoveDown && (
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
                        )}

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

export default GameCard;
