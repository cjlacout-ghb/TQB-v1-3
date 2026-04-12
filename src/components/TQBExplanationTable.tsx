'use client';

import { TeamStats } from '@/lib/types';
import { formatTQBValue, outsToInnings, calculateDisplayRanks } from '@/lib/calculations';
import { useLanguage } from '@/contexts/LanguageContext';

interface TQBExplanationTableProps {
    rankings: TeamStats[];
    isERTQB?: boolean;
}

export default function TQBExplanationTable({ rankings, isERTQB = false }: TQBExplanationTableProps) {
    const { t } = useLanguage();
    // Determine if it's a multi-way tie for the title
    const tiedCount = rankings.length;
    const method = isERTQB ? 'ER-TQB' : 'TQB';

    const title = t.rankings.summary.title
        .replace('{method}', method)
        .replace('{count}', tiedCount.toString());

    const displayRanks = calculateDisplayRanks(rankings, isERTQB);

    return (
        <div className="space-y-4 animate-fade-in">
            <div className="space-y-2">
                <h3 className="text-lg font-bold text-white">{title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                    {t.rankings.summary.description.replace('{method}', method)}
                </p>
            </div>

            <div className="overflow-x-auto rounded-xl border border-dark-600 bg-dark-800/50">
                <table className="w-full text-[15px] text-left border-collapse">
                    <thead className="bg-dark-700 text-gray-400 uppercase text-xs tracking-wider font-bold">
                        <tr>
                            <th className="px-2 py-3 border-b border-dark-600 text-center w-12">{t.rankings.rank}</th>
                            <th className="px-2 py-3 border-b border-dark-600 min-w-[120px]">{t.rankings.team}</th>
                            <th className="px-2 py-3 border-b border-dark-600 text-center">
                                {isERTQB
                                    ? (t.earnedRuns?.inputLabel || 'Earned Runs')
                                    : t.gameEntry.runsScored
                                }
                            </th>
                            <th className="px-2 py-3 border-b border-dark-600 text-center">{t.gameEntry.inningsBatting}</th>
                            <th className="px-2 py-3 border-b border-dark-600 text-center text-gray-500 whitespace-nowrap">
                                {t.rankings.summary.offensiveRatio}
                            </th>
                            <th className="px-2 py-3 border-b border-dark-600 text-center">
                                {isERTQB ? t.rankings.summary.erAllowed : t.rankings.summary.runsAllowed}
                            </th>
                            <th className="px-2 py-3 border-b border-dark-600 text-center">{t.gameEntry.inningsDefense}</th>
                            <th className="px-2 py-3 border-b border-dark-600 text-center text-gray-500 whitespace-nowrap">
                                {t.rankings.summary.defensiveRatio}
                            </th>
                            <th className="px-2 py-3 border-b border-dark-600 text-right">
                                {t.rankings.summary.finalValue.replace('{method}', method)}
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-600 text-gray-300">
                        {rankings.map((team, index) => {
                            const runsS = isERTQB ? team.earnedRunsScored : team.runsScored;
                            const runsA = isERTQB ? team.earnedRunsAllowed : team.runsAllowed;
                            const innBat = team.inningsAtBatOuts / 3;
                            const innDef = team.inningsOnDefenseOuts / 3;

                            const ratioS = innBat > 0 ? runsS / innBat : 0;
                            const ratioA = innDef > 0 ? runsA / innDef : 0;
                            const finalVal = isERTQB ? team.erTqb : team.tqb;
                            const rank = displayRanks[index];

                            return (
                                <tr key={team.id} className="hover:bg-dark-700/30 transition-colors">
                                    <td className="px-2 py-3 text-center font-mono text-gray-400">#{rank}</td>
                                    <td className="px-2 py-3 font-medium text-white whitespace-nowrap">{team.name}</td>
                                    <td className="px-2 py-3 text-center font-mono">{runsS}</td>
                                    <td className="px-2 py-3 text-center font-mono">{outsToInnings(team.inningsAtBatOuts).toFixed(1)}</td>
                                    <td className="px-2 py-3 text-center font-mono text-gray-500 whitespace-nowrap">→ {ratioS.toFixed(4)}</td>
                                    <td className="px-2 py-3 text-center font-mono">{runsA}</td>
                                    <td className="px-2 py-3 text-center font-mono">{outsToInnings(team.inningsOnDefenseOuts).toFixed(1)}</td>
                                    <td className="px-2 py-3 text-center font-mono text-gray-500 whitespace-nowrap">→ {ratioA.toFixed(4)}</td>
                                    <td className={`px-2 py-3 text-right font-mono ${finalVal >= 0 ? 'text-success-400' : 'text-error-400'}`}>
                                        {formatTQBValue(finalVal)}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
