'use client';

import { FileDown, RotateCcw, AlertTriangle, Trophy, Info, ArrowLeft, ChevronDown, ChevronUp, Activity } from 'lucide-react';
import { TeamStats, TieBreakMethod, GameData, GroupID } from '@/lib/types';
import { formatTQBValue, getTieBreakMethodText, calculateDisplayRanks, calculateRankings, getLivePanelVisibility, isGroupProvisional } from '@/lib/calculations';
import StepIndicator from '../StepIndicator';
import GameCard from '../GameCard';
import TQBExplanationTable from '../TQBExplanationTable';
import { useLanguage } from '@/contexts/LanguageContext';
import { Tooltip } from '@/components/ui/Tooltip';
import React, { memo, useMemo, useState, useCallback } from 'react';

interface TQBRankingsProps {
    rankings: TeamStats[];
    tieBreakMethod: TieBreakMethod;
    needsERTQB: boolean;
    onProceedToERTQB: () => void;
    onExportPDF: () => void;
    onStartNew: () => void;
    onBack?: () => void;
    totalSteps: number;
    games: GameData[];
    onOpenManual?: (section?: string) => void;
    isMultiGroup: boolean;
    groupTieBreakMethod: Partial<Record<GroupID, TieBreakMethod>>;
    activeGroupId: GroupID;
    onSetActiveGroupId: (id: GroupID) => void;
    onLiveGameUpdate?: (gameId: string, updates: Partial<GameData>) => void;
    onToggleLockGame?: (gameId: string) => void;
    isCalculationStale?: boolean;
}

const TQBRankings = memo(function TQBRankings({
    rankings,
    tieBreakMethod,
    needsERTQB,
    onProceedToERTQB,
    onExportPDF,
    onStartNew,
    onBack,
    totalSteps,
    games,
    isMultiGroup,
    groupTieBreakMethod,
    activeGroupId,
    onSetActiveGroupId,
    onLiveGameUpdate,
    onToggleLockGame,
    isCalculationStale = false,
}: TQBRankingsProps) {
    const { t, language } = useLanguage();
    const [isPanelExpanded, setIsPanelExpanded] = useState(true);

    // Active group's tie-break method for the status banner
    const activeTieBreakMethod: TieBreakMethod =
        (isMultiGroup && groupTieBreakMethod[activeGroupId])
            ? groupTieBreakMethod[activeGroupId]!
            : tieBreakMethod;

    // Filter rankings and games to the active group tab
    const displayRankings = isMultiGroup
        ? rankings.filter(r => r.groupId === activeGroupId)
        : rankings;
    const displayGames = isMultiGroup
        ? games.filter(g => g.groupId === activeGroupId)
        : games;

    // Active group's ER-TQB requirement status for the banner warning
    const activeGroupNeedsERTQB = useMemo(() => {
        if (!isMultiGroup) return needsERTQB;
        const groupTeams = displayRankings.map(r => ({ id: r.id, name: r.name }));
        return calculateRankings(groupTeams, displayGames, false).needsERTQB;
    }, [isMultiGroup, needsERTQB, displayRankings, displayGames]);

    // Live panel visibility status for the active group
    const panelVis = useMemo(() =>
        getLivePanelVisibility(games, activeGroupId),
        [games, activeGroupId]
    );

    // Provisional status: active group has at least one locked AND one unlocked game
    const isActiveGroupProvisional = useMemo(() => {
        const activeGroupGames = games.filter(g => (g.groupId ?? 'A') === activeGroupId);
        return isGroupProvisional(activeGroupGames);
    }, [games, activeGroupId]);

    const handleSwapSides = useCallback((gameId: string) => {
        const target = games.find(g => g.id === gameId);
        if (!target || target.isLocked) return;
        onLiveGameUpdate?.(gameId, {
            teamAId: target.teamBId,
            teamBId: target.teamAId,
            teamAName: target.teamBName,
            teamBName: target.teamAName,
            runsA: target.runsB,
            runsB: target.runsA,
            inningsABatting: target.inningsBBatting,
            inningsADefense: target.inningsBDefense,
            inningsBBatting: target.inningsABatting,
            inningsBDefense: target.inningsADefense,
            earnedRunsA: target.earnedRunsB,
            earnedRunsB: target.earnedRunsA,
        });
    }, [games, onLiveGameUpdate]);

    const handleUpdateGame = useCallback((gameId: string, updates: Partial<GameData>) => {
        onLiveGameUpdate?.(gameId, updates);
    }, [onLiveGameUpdate]);

    const handleLockToggle = useCallback((gameId: string) => {
        onToggleLockGame?.(gameId);
    }, [onToggleLockGame]);

    return (
        <div className="max-w-4xl mx-auto animate-fade-in">
            <StepIndicator currentStep={3} totalSteps={totalSteps} />

            <div className="card">
                <div className="card-header">
                    <div className="flex items-center gap-4">
                        {onBack && (
                            <Tooltip text={t.tooltips.tqbBack}>
                                <button
                                    onClick={onBack}
                                    className="group flex items-center justify-center w-10 h-10 rounded-full bg-dark-600 text-gray-400 hover:text-white hover:bg-dark-500 transition-all duration-200"
                                    aria-label={t.tooltips.tqbBack}
                                >
                                    <ArrowLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
                                </button>
                            </Tooltip>
                        )}
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 
                  flex items-center justify-center shadow-lg shadow-primary-500/30">
                                <Trophy size={24} className="text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">{t.rankings.tqbTitle}</h2>
                                {t.rankings.tqbSubtitle && (
                                    <p className="text-sm text-gray-400">
                                        {t.rankings.tqbSubtitle}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Group A / B tab strip — only in multi-group mode */}
                {isMultiGroup && (
                    <div className="px-6 pt-2">
                        <div className="flex p-1 bg-dark-900/50 rounded-xl border border-dark-600">
                            {(['A', 'B'] as GroupID[]).map(gId => (
                                <Tooltip key={gId} text={t.tooltips.tqbGroupTab.replace('{gId}', gId)} className="flex-1">
                                    <button
                                        onClick={() => onSetActiveGroupId(gId)}
                                        className={`w-full flex items-center justify-center py-2 text-sm font-medium rounded-lg transition-all
                                            ${activeGroupId === gId ? 'bg-primary-500 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                                    >
                                        {t.common.groupTab.replace('{gId}', gId)}
                                    </button>
                                </Tooltip>
                            ))}
                        </div>
                    </div>
                )}

                <div className="card-body space-y-6">
                    {/* Tie-Break Method Indicator */}
                    <div className={`p-4 rounded-xl border flex items-start gap-3 ${activeGroupNeedsERTQB
                        ? 'bg-warning-500/10 border-warning-500/30'
                        : 'bg-success-500/10 border-success-500/30'
                        }`}>
                        {activeGroupNeedsERTQB ? (
                            <AlertTriangle size={20} className="text-warning-400 flex-shrink-0 mt-0.5" />
                        ) : (
                            <Info size={20} className="text-success-400 flex-shrink-0 mt-0.5" />
                        )}
                        <div>
                            <p className={`text-sm font-medium ${activeGroupNeedsERTQB ? 'text-warning-400' : 'text-success-400'}`}>
                                {activeGroupNeedsERTQB
                                    ? t.rankings.needsERTQB
                                    : getTieBreakMethodText(activeTieBreakMethod, language)
                                }
                            </p>
                            {!activeGroupNeedsERTQB && (
                                <p className="text-xs text-gray-400 mt-1">
                                    {t.rankings.tieBreakNote}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* PROVISIONAL BANNER — shown when active group has mixed locked/unlocked games */}
                    {isActiveGroupProvisional && (
                        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5">
                            <AlertTriangle size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-300 leading-relaxed font-medium">
                                {t.rankings.provisionalBanner}
                            </p>
                        </div>
                    )}

                    {/* LIVE PANEL: >4 Unfixed Helper Tip */}
                    {panelVis.showHelperText && (
                        <div className="p-4 rounded-xl bg-dark-700/60 border border-dark-500 flex items-start gap-3">
                            <Info size={18} className="text-primary-400 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-gray-300 leading-relaxed">
                                {t.rankings.livePanel.helperTip}
                            </p>
                        </div>
                    )}

                    {/* LIVE PANEL: "Partido en Juego" (1 to 4 unfixed games) */}
                    {panelVis.showPanel && (
                        <div className="rounded-2xl border border-primary-500/30 bg-dark-900/60 overflow-hidden shadow-xl">
                            {/* Panel Header */}
                            <div className="p-4 bg-gradient-to-r from-primary-900/40 via-dark-800 to-dark-800 border-b border-dark-600 flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="relative flex items-center justify-center">
                                        <Activity size={18} className="text-primary-400 animate-pulse" />
                                    </div>
                                    <h3 className="text-sm font-bold text-white tracking-wide uppercase">
                                        {isMultiGroup
                                            ? t.rankings.livePanel.title.replace('{group}', activeGroupId)
                                            : t.rankings.livePanel.titleSingle
                                        }
                                    </h3>
                                    <span className="text-[11px] font-semibold text-primary-400 bg-primary-500/10 px-2 py-0.5 rounded-full border border-primary-500/20">
                                        {panelVis.unfixedCount}
                                    </span>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setIsPanelExpanded(prev => !prev)}
                                    className="p-1.5 rounded-lg bg-dark-700 hover:bg-dark-600 text-gray-300 hover:text-white transition-colors"
                                    aria-label={isPanelExpanded ? t.rankings.livePanel.hidePanel : t.rankings.livePanel.showPanel}
                                >
                                    {isPanelExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </button>
                            </div>

                            {/* Panel Content (Collapsible) */}
                            {isPanelExpanded && (
                                <div className="p-4 space-y-4">
                                    {/* Stale Warning Banner if calculation is outdated */}
                                    {isCalculationStale && (
                                        <div className="p-3 rounded-xl bg-warning-500/10 border border-warning-500/30 flex items-start gap-2.5">
                                            <AlertTriangle size={16} className="text-warning-400 flex-shrink-0 mt-0.5" />
                                            <p className="text-xs text-warning-300 leading-relaxed font-medium">
                                                {t.rankings.livePanel.staleWarning}
                                            </p>
                                        </div>
                                    )}

                                    {/* Game Cards List */}
                                    {panelVis.unfixedGames.map(game => {
                                        const gameIndexInGroup = displayGames.findIndex(g => g.id === game.id);
                                        const gameNum = gameIndexInGroup !== -1 ? gameIndexInGroup + 1 : 1;

                                        return (
                                            <GameCard
                                                key={game.id}
                                                game={game}
                                                gameNumber={gameNum}
                                                showReorderButtons={false}
                                                errors={{}}
                                                onUpdate={handleUpdateGame}
                                                onSwap={handleSwapSides}
                                                onToggleLock={handleLockToggle}
                                            />
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Rankings Table */}
                    <div className="overflow-x-auto">
                        <table className="table-dark w-full text-[15px]">
                            <thead>
                                <tr>
                                    <th className="w-20 text-center text-[15px]">{t.rankings.rank}</th>
                                    <th className="text-[15px]">{t.rankings.team}</th>
                                    <th className="text-center w-24 text-[15px]">{t.rankings.wl}</th>
                                    <th className="text-right w-32 text-[15px]">{t.rankings.tqb}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(() => {
                                    const displayRanks = calculateDisplayRanks(displayRankings, false);
                                    return displayRankings.map((team, index) => (
                                        <tr key={team.id} className="animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
                                            <td className="text-center">
                                                <div className="flex justify-center">
                                                    <RankBadge rank={displayRanks[index]} />
                                                </div>
                                            </td>
                                            <td>
                                                <span className="font-medium text-white">{team.name}</span>
                                            </td>
                                            <td className="text-center">
                                                <span className="font-mono">
                                                    <span className="text-success-400">{team.wins}</span>
                                                    <span className="text-gray-500">-</span>
                                                    <span className="text-error-400">{team.losses}</span>
                                                </span>
                                            </td>
                                            <td className="text-right">
                                                <span className={`font-mono ${team.tqb >= 0 ? 'text-success-400' : 'text-error-400'
                                                    }`}>
                                                    {formatTQBValue(team.tqb)}
                                                </span>
                                            </td>
                                        </tr>
                                    ));
                                })()}
                            </tbody>
                        </table>
                    </div>

                    {/* TQB Formula & Detail Explanation Component */}
                    <TQBExplanationTable
                        rankings={displayRankings}
                        isERTQB={false}
                    />

                    {/* Actions footer */}
                    <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-dark-600">
                        {activeGroupNeedsERTQB ? (
                            <Tooltip text={t.tooltips.tqbProceedERTQB} className="flex-1">
                                <button
                                    onClick={onProceedToERTQB}
                                    className="w-full btn-primary py-3 text-base font-bold shadow-lg shadow-primary-500/20"
                                >
                                    {t.rankings.proceedToER}
                                </button>
                            </Tooltip>
                        ) : (
                            <Tooltip text={t.tooltips.tqbExportPDF} className="flex-1">
                                <button
                                    onClick={onExportPDF}
                                    className="w-full btn-primary py-3 text-base font-bold shadow-lg shadow-primary-500/20"
                                >
                                    <FileDown size={18} className="mr-2" />
                                    {t.common.exportPDF}
                                </button>
                            </Tooltip>
                        )}

                        <Tooltip text={t.tooltips.tqbBack}>
                            <button
                                onClick={onStartNew}
                                className="btn-secondary py-3 text-base font-semibold"
                            >
                                <RotateCcw size={18} className="mr-2" />
                                {t.common.reset}
                            </button>
                        </Tooltip>
                    </div>
                </div>
            </div>
        </div>
    );
});

export default TQBRankings;

// Rank Badge helper component
function RankBadge({ rank }: { rank: number }) {
    if (rank === 1) {
        return (
            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-warning-500/20 text-warning-400 font-bold text-sm border border-warning-500/40">
                1
            </span>
        );
    }
    if (rank === 2) {
        return (
            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-gray-400/20 text-gray-300 font-bold text-sm border border-gray-400/40">
                2
            </span>
        );
    }
    if (rank === 3) {
        return (
            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-amber-700/20 text-amber-500 font-bold text-sm border border-amber-700/40">
                3
            </span>
        );
    }
    return (
        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-dark-700 text-gray-400 font-medium text-sm border border-dark-600">
            {rank}
        </span>
    );
}
