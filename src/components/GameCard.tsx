'use client';

import React, { memo, useState, useRef } from 'react';
import { ArrowLeftRight, ChevronUp, ChevronDown, Lock, Unlock, X } from 'lucide-react';
import { GameData } from '@/lib/types';
import { isGameFinalAndValid, isGameIntegrityValid } from '@/lib/calculations';
import { useLanguage } from '@/contexts/LanguageContext';
import { Tooltip } from '@/components/ui/Tooltip';

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
    /** Show "In Play" badge: true only when group has exactly 1 unfixed and ≥1 locked */
    showInPlayBadge?: boolean;
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
    showInPlayBadge = false,
}: GameCardProps) {
    const { t } = useLanguage();
    const canLock = isGameFinalAndValid(game);
    const isIntegrityValid = isGameIntegrityValid(game);

    // Inline message shown when user clicks the lock button while it's blocked
    const [lockBlockedMsg, setLockBlockedMsg] = useState<string | null>(null);
    const lockBlockedRef = useRef<HTMLDivElement>(null);
    const lockBlockedShakeRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const lockTitle = game.isLocked
        ? t.gameEntry.unlockGame
        : canLock
            ? t.gameEntry.lockGame
            : isIntegrityValid
                ? t.gameEntry.lockDisabledStrict
                : (t.gameEntry.lockDisabledIntegrity || t.gameEntry.lockDisabledTooltip);

    const handleLockClick = () => {
        if (game.isLocked || canLock) {
            // Normal toggle
            onToggleLock(game.id);
            setLockBlockedMsg(null);
            return;
        }
        // Blocked — show inline explanation
        const msg = isIntegrityValid
            ? t.gameEntry.lockBlockedStrict
            : t.gameEntry.lockBlockedIntegrity;

        if (lockBlockedMsg !== null) {
            // Repeat click: shake the existing message
            if (lockBlockedRef.current) {
                lockBlockedRef.current.classList.remove('animate-shake');
                // Force reflow
                void lockBlockedRef.current.offsetWidth;
                lockBlockedRef.current.classList.add('animate-shake');
            }
            if (lockBlockedShakeRef.current) clearTimeout(lockBlockedShakeRef.current);
            lockBlockedShakeRef.current = setTimeout(() => {
                lockBlockedRef.current?.classList.remove('animate-shake');
            }, 400);
        } else {
            setLockBlockedMsg(msg);
        }
    };

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
                <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                    {/* 1. Reorder buttons */}
                    {showReorderButtons && onMoveUp && onMoveDown && (
                        <div className="flex flex-col gap-1 flex-shrink-0">
                            <Tooltip text={t.tooltips.gameCardMoveUp}>
                                <button
                                    type="button"
                                    onClick={onMoveUp}
                                    disabled={isFirst}
                                    aria-label={t.tooltips.gameCardMoveUp}
                                    className="flex items-center justify-center w-7 h-5 rounded bg-dark-700 hover:bg-dark-600 text-gray-300 hover:text-white disabled:opacity-25 disabled:hover:bg-dark-700 disabled:hover:text-gray-300 disabled:cursor-not-allowed border border-dark-500 transition-colors"
                                >
                                    <ChevronUp size={14} />
                                </button>
                            </Tooltip>
                            <Tooltip text={t.tooltips.gameCardMoveDown}>
                                <button
                                    type="button"
                                    onClick={onMoveDown}
                                    disabled={isLast}
                                    aria-label={t.tooltips.gameCardMoveDown}
                                    className="flex items-center justify-center w-7 h-5 rounded bg-dark-700 hover:bg-dark-600 text-gray-300 hover:text-white disabled:opacity-25 disabled:hover:bg-dark-700 disabled:hover:text-gray-300 disabled:cursor-not-allowed border border-dark-500 transition-colors"
                                >
                                    <ChevronDown size={14} />
                                </button>
                            </Tooltip>
                        </div>
                    )}

                    {/* 2. Game number badge */}
                    <span className="flex items-center justify-center w-12 h-12 bg-dark-700/50 rounded-xl text-sm font-mono text-primary-400 border border-dark-500 shadow-inner flex-shrink-0">
                        #{gameNumber}
                    </span>

                    {/* 3. Lock button */}
                    <Tooltip text={game.isLocked ? t.tooltips.gameCardUnlock : canLock ? t.tooltips.gameCardLock : t.tooltips.gameCardLockDisabled}>
                        <button
                            type="button"
                            onClick={handleLockClick}
                            aria-label={lockTitle}
                            aria-disabled={!game.isLocked && !canLock}
                            className={`flex items-center justify-center w-8 h-11 rounded-lg border transition-all flex-shrink-0 ${
                                game.isLocked
                                    ? 'bg-crimson-500/20 text-crimson-400 border-crimson-500/40 hover:bg-crimson-500/30 shadow-sm'
                                    : canLock
                                        ? 'bg-dark-700 hover:bg-dark-600 text-gray-400 hover:text-white border-dark-500'
                                        : 'bg-dark-700/50 text-gray-600 border-dark-600 opacity-40'
                            }`}
                        >
                            {game.isLocked ? <Lock size={16} /> : <Unlock size={16} />}
                        </button>
                    </Tooltip>

                    {/* 4. Team names & status badges */}
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight break-words min-w-0">
                                {game.teamAName}
                                <span className="mx-1.5 sm:mx-2 text-gray-600 font-light inline-block">vs</span>
                                {game.teamBName}
                            </h3>
                            {game.isLocked ? (
                                <span className="text-[10px] font-bold text-crimson-400 tracking-widest uppercase bg-crimson-500/10 px-2 py-0.5 rounded border border-crimson-500/20 flex-shrink-0 inline-flex items-center">
                                    {t.gameEntry.locked}
                                </span>
                            ) : (
                                showInPlayBadge && (
                                    <span
                                        title={t.gameEntry.inPlayTooltip}
                                        className="text-[10px] font-bold text-gold-400 tracking-widest uppercase bg-gold-500/10 px-2 py-0.5 rounded border border-gold-500/20 inline-flex items-center gap-1 cursor-help flex-shrink-0"
                                    >
                                        <span className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-pulse" />
                                        {t.gameEntry.inPlay}
                                    </span>
                                )
                            )}
                        </div>

                        {/* Inline lock-blocked message */}
                        {lockBlockedMsg && (
                            <div
                                ref={lockBlockedRef}
                                className="mt-1.5 flex items-center gap-1.5 text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded px-2 py-1"
                                role="alert"
                            >
                                <span className="flex-1">{lockBlockedMsg}</span>
                                <Tooltip text={t.tooltips.gameCardCloseNotice}>
                                    <button
                                        type="button"
                                        onClick={() => setLockBlockedMsg(null)}
                                        aria-label={t.tooltips.gameCardCloseNotice}
                                        className="text-amber-400 hover:text-amber-200 flex-shrink-0"
                                    >
                                        <X size={12} />
                                    </button>
                                </Tooltip>
                            </div>
                        )}
                    </div>
                </div>

                <Tooltip text={game.isLocked ? t.tooltips.gameCardSwapDisabled : t.tooltips.gameCardSwap} className="self-start sm:self-center flex-shrink-0">
                    <button
                        type="button"
                        onClick={() => onSwap(game.id)}
                        disabled={game.isLocked}
                        className="flex items-center gap-2 px-4 py-2 bg-dark-600/50 hover:bg-primary-500/10 text-gray-400 hover:text-primary-400 border border-dark-500 hover:border-primary-500/30 rounded-lg transition-all text-xs font-bold uppercase tracking-wider disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-dark-600/50 disabled:hover:text-gray-400"
                    >
                        <ArrowLeftRight size={14} />
                        {t.gameEntry.swapSides}
                    </button>
                </Tooltip>
            </div>

            {/* Two Column Layout for Teams */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Team A - Visitor */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                            <div className="w-3 h-3 rounded-full bg-primary-500 flex-shrink-0" />
                            <span className="font-semibold text-white break-words min-w-0">{game.teamAName}</span>
                        </div>
                        <span className="text-[10px] font-bold text-primary-400 tracking-widest uppercase bg-primary-500/10 px-2 py-0.5 rounded border border-primary-500/20 flex-shrink-0">
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
                    <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                            <div className="w-3 h-3 rounded-full bg-success-500 flex-shrink-0" />
                            <span className="font-semibold text-white break-words min-w-0">{game.teamBName}</span>
                        </div>
                        <span className="text-[10px] font-bold text-success-400 tracking-widest uppercase bg-success-500/10 px-2 py-0.5 rounded border border-success-500/20 flex-shrink-0">
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
