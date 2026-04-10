'use client';

import { FileDown, RotateCcw, AlertTriangle, Trophy, Info, CheckCircle, ArrowLeft } from 'lucide-react';
import { TeamStats, TieBreakMethod, GameData } from '@/lib/types';
import { formatTQBValue, getTieBreakMethodText, calculateDisplayRanks } from '@/lib/calculations';
import StepIndicator from '../StepIndicator';
import TQBExplanationTable from '../TQBExplanationTable';
import { useLanguage } from '@/contexts/LanguageContext';
import React, { memo } from 'react';

interface ERTQBRankingsProps {
    rankings: TeamStats[];
    tieBreakMethod: TieBreakMethod;
    hasUnresolvedTies: boolean;
    onExportPDF: () => void;
    onStartNew: () => void;
    onBack?: () => void;
    games: GameData[];
    onOpenManual?: (section?: string) => void;
}

const ERTQBRankings = memo(function ERTQBRankings({
    rankings,
    tieBreakMethod,
    hasUnresolvedTies,
    onExportPDF,
    onStartNew,
    onBack,
    games,
    onOpenManual,
}: ERTQBRankingsProps) {
    const { t, language } = useLanguage();


    return (
        <div className="max-w-4xl mx-auto animate-fade-in">
            <StepIndicator currentStep={5} totalSteps={5} />

            <div className="card">
                <div className="card-header">
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
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 
                  flex items-center justify-center shadow-lg shadow-primary-500/30">
                                <Trophy size={24} className="text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">{t.rankings.ertqbTitle}</h2>
                                {t.rankings.ertqbSubtitle && (
                                    <p className="text-sm text-gray-400">
                                        {t.rankings.ertqbSubtitle}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card-body space-y-6">
                    {/* Tie-Break Method Indicator */}
                    <div className={`p-4 rounded-xl border flex items-start gap-3 ${hasUnresolvedTies
                        ? 'bg-warning-500/10 border-warning-500/30'
                        : 'bg-success-500/10 border-success-500/30'
                        }`}>
                        {hasUnresolvedTies ? (
                            <AlertTriangle size={20} className="text-warning-400 flex-shrink-0 mt-0.5" />
                        ) : (
                            <CheckCircle size={20} className="text-success-400 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <p className={`text-sm font-medium ${hasUnresolvedTies ? 'text-warning-400' : 'text-success-400'}`}>
                                    {getTieBreakMethodText(tieBreakMethod, language)}
                                </p>
                                {hasUnresolvedTies && onOpenManual && (
                                    <button
                                        onClick={() => onOpenManual('official-rule-c11')}
                                        className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-primary-400 bg-primary-500/10 hover:bg-primary-500/20 border border-primary-500/30 rounded-lg transition-all group"
                                    >
                                        <Info size={14} className="text-primary-400 group-hover:scale-110 transition-transform" />
                                        <span>{t.common.viewOfficialRule}</span>
                                    </button>
                                )}
                            </div>
                            {!hasUnresolvedTies && (
                                <p className="text-xs text-gray-400 mt-1">
                                    {t.rankings.tieBreakNote}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Rankings Table */}
                    <div className="overflow-x-auto">
                        <table className="table-dark w-full">
                            <thead>
                                <tr>
                                    <th className="w-20 text-center">{t.rankings.rank}</th>
                                    <th>{t.rankings.team}</th>
                                    <th className="text-center w-24">{t.rankings.wl}</th>
                                    <th className="text-right w-32">{t.rankings.ertqb}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(() => {
                                    const displayRanks = calculateDisplayRanks(rankings, true);
                                    return rankings.map((team, index) => (
                                        <tr key={team.id} className="animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
                                            <td className="text-center">
                                                <div className="flex justify-center">
                                                    <RankBadge rank={displayRanks[index]} />
                                                </div>
                                            </td>
                                            <td>
                                                <span className="font-semibold text-white">{team.name}</span>
                                            </td>
                                            <td className="text-center">
                                                <span className="font-mono">
                                                    <span className="text-success-400">{team.wins}</span>
                                                    <span className="text-gray-500">-</span>
                                                    <span className="text-error-400">{team.losses}</span>
                                                </span>
                                            </td>
                                            <td className="text-right">
                                                <span className={`font-mono font-bold ${team.erTqb >= 0 ? 'text-success-400' : 'text-error-400'
                                                    }`}>
                                                    {formatTQBValue(team.erTqb)}
                                                </span>
                                            </td>
                                        </tr>
                                    ));
                                })()}
                            </tbody>
                        </table>
                    </div>

                    {/* ER-TQB Explanation Summary */}
                    <TQBExplanationTable rankings={rankings} isERTQB={true} />

                    {/* ER-TQB Formula */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-dark-700/50 rounded-xl border border-dark-500">
                        <div>
                            <h4 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                                <Info size={14} />
                                {t.rankings.formula.erTitle}
                            </h4>
                            <p className="font-mono text-sm text-primary-400">
                                {t.rankings.formula.erText}
                            </p>
                        </div>
                        <button
                            onClick={() => onOpenManual?.('official-rule-c11')}
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-500/10 border border-primary-500/20 rounded-full hover:bg-primary-500/20 transition-all group"
                        >
                            <span className="text-[11px] font-bold text-primary-400 uppercase tracking-wider">
                                {t.common.ruleC11}
                            </span>
                            <Info size={14} className="text-primary-400" />
                        </button>
                    </div>

                    {/* Comparison: TQB vs ER-TQB */}
                    <details className="group">
                        <summary className="cursor-pointer text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-2">
                            <span className="group-open:rotate-90 transition-transform">▶</span>
                            {t.rankings.compare.title}
                        </summary>
                        <div className="mt-3 overflow-x-auto rounded-xl border border-dark-600 bg-dark-800/50">
                            <table className="table-dark w-full border-collapse">
                                <thead className="bg-dark-700 text-gray-400 uppercase text-[10px] tracking-wider font-bold">
                                    <tr>
                                        <th className="px-4 py-3 border-b border-dark-600">{t.rankings.team}</th>
                                        <th className="px-4 py-3 border-b border-dark-600 text-right">{t.rankings.tqb}</th>
                                        <th className="px-4 py-3 border-b border-dark-600 text-right">{t.rankings.ertqb}</th>
                                        <th className="px-4 py-3 border-b border-dark-600 text-right">{t.rankings.compare.diff}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-dark-600">
                                    {rankings.map((team) => {
                                        const diff = team.erTqb - team.tqb;
                                        return (
                                            <tr key={team.id} className="hover:bg-dark-700/30">
                                                <td className="px-4 py-3 font-bold text-white">{team.name}</td>
                                                <td className="px-4 py-3 text-right font-mono text-gray-400">
                                                    {formatTQBValue(team.tqb)}
                                                </td>
                                                <td className="px-4 py-3 text-right font-mono text-primary-400">
                                                    {formatTQBValue(team.erTqb)}
                                                </td>
                                                <td className={`px-4 py-3 text-right font-mono ${diff >= 0 ? 'text-success-400' : 'text-error-400'
                                                    }`}>
                                                    {formatTQBValue(diff)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </details>

                    {/* Game Results Summary */}
                    <details className="group">
                        <summary className="cursor-pointer text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-2">
                            <span className="group-open:rotate-90 transition-transform">▶</span>
                            {t.rankings.viewGameResults}
                        </summary>
                        <div className="mt-3 p-4 bg-dark-700/30 rounded-xl divide-y divide-dark-600">
                            {games.map((game, index) => (
                                <div key={game.id} className="grid grid-cols-[80px_1fr_60px_20px_60px_1fr] items-center gap-2 py-3 first:pt-0 last:pb-0">
                                    <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">{t.rankings.game} {index + 1}</span>

                                    <span className="text-right font-medium text-white truncate">{game.teamAName}</span>

                                    <div className="flex flex-col items-center">
                                        <div className={`w-full text-center font-mono font-bold text-lg rounded-t-lg py-0.5 ${(game.runsA ?? 0) > (game.runsB ?? 0) ? 'bg-success-500/20 text-success-400' :
                                            (game.runsA ?? 0) < (game.runsB ?? 0) ? 'bg-dark-600 text-gray-500' : 'bg-warning-500/20 text-warning-400'
                                            }`}>
                                            {game.runsA}
                                        </div>
                                        <div className="w-full text-center font-mono text-[10px] bg-dark-800 text-gray-500 rounded-b-lg py-0.5 border-t border-dark-600">
                                            ER: {game.earnedRunsA}
                                        </div>
                                    </div>

                                    <span className="text-gray-600 text-center font-bold">:</span>

                                    <div className="flex flex-col items-center">
                                        <div className={`w-full text-center font-mono font-bold text-lg rounded-t-lg py-0.5 ${(game.runsB ?? 0) > (game.runsA ?? 0) ? 'bg-success-500/20 text-success-400' :
                                            (game.runsB ?? 0) < (game.runsA ?? 0) ? 'bg-dark-600 text-gray-500' : 'bg-warning-500/20 text-warning-400'
                                            }`}>
                                            {game.runsB}
                                        </div>
                                        <div className="w-full text-center font-mono text-[10px] bg-dark-800 text-gray-500 rounded-b-lg py-0.5 border-t border-dark-600">
                                            ER: {game.earnedRunsB}
                                        </div>
                                    </div>

                                    <span className="text-left font-medium text-white truncate">{game.teamBName}</span>
                                </div>
                            ))}
                            <p className="text-[10px] text-gray-500 pt-3 italic text-center uppercase tracking-widest">
                                {t.rankings.gameDetail.erNote}
                            </p>
                        </div>
                    </details>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                        <button
                            onClick={onExportPDF}
                            className="flex-1 btn-primary py-4 shadow-xl shadow-primary-500/20"
                        >
                            <FileDown size={20} className="mr-1" />
                            {t.common.exportPDF}
                        </button>
                        <button
                            onClick={onStartNew}
                            className="flex-1 btn-ghost border border-dark-500 hover:border-gray-400 py-4"
                        >
                            <RotateCcw size={20} className="mr-1" />
                            {t.common.startNew}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
});

export default ERTQBRankings;

const RankBadge = memo(function RankBadge({ rank }: { rank: number }) {
    const getClass = () => {
        switch (rank) {
            case 1: return 'rank-1';
            case 2: return 'rank-2';
            case 3: return 'rank-3';
            default: return 'rank-default';
        }
    };

    return (
        <div className={getClass()}>
            #{rank}
        </div>
    );
});
