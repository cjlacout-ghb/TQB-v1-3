// TQB and ER-TQB calculation utilities
import { GameData, TeamStats, RankingResult, TieBreakMethod } from './types';

const TIE_TOLERANCE = 0.0001;

/**
 * Convert innings display format (e.g., 7.2) to total outs
 * 7.2 means 7 complete innings + 2 outs = 23 outs
 */
export function inningsToOuts(innings: string | number): number {
    const value = typeof innings === 'string' ? parseFloat(innings) : innings;
    if (isNaN(value) || value < 0) return 0;

    const whole = Math.floor(value);
    const decimal = value - whole;
    // Round to handle floating point issues (0.1 or 0.2)
    const outs = Math.round(decimal * 10);

    return whole * 3 + outs;
}

/**
 * Convert total outs back to innings display format
 */
export function outsToInnings(outs: number): number {
    if (outs <= 0) return 0;
    const whole = Math.floor(outs / 3);
    const remainder = outs % 3;
    return whole + remainder * 0.1;
}

/**
 * Calculate team statistics from game data
 */
export function calculateTeamStats(
    teamId: string,
    teamName: string,
    games: GameData[]
): TeamStats {
    let wins = 0;
    let losses = 0;
    let runsScored = 0;
    let runsAllowed = 0;
    let inningsAtBatOuts = 0;
    let inningsOnDefenseOuts = 0;
    let earnedRunsScored = 0;
    let earnedRunsAllowed = 0;

    for (const game of games) {
        const isTeamA = game.teamAId === teamId;
        const isTeamB = game.teamBId === teamId;

        if (!isTeamA && !isTeamB) continue;

        const myRuns = isTeamA ? (game.runsA ?? 0) : (game.runsB ?? 0);
        const oppRuns = isTeamA ? (game.runsB ?? 0) : (game.runsA ?? 0);
        const myInningsBat = isTeamA ? game.inningsABatting : game.inningsBBatting;
        const myInningsDef = isTeamA ? game.inningsADefense : game.inningsBDefense;
        const myEarnedRuns = isTeamA ? (game.earnedRunsA ?? 0) : (game.earnedRunsB ?? 0);
        const oppEarnedRuns = isTeamA ? (game.earnedRunsB ?? 0) : (game.earnedRunsA ?? 0);

        if (myRuns > oppRuns) {
            wins++;
        } else if (myRuns < oppRuns) {
            losses++;
        }
        // Ties count as neither win nor loss

        runsScored += myRuns;
        runsAllowed += oppRuns;
        inningsAtBatOuts += inningsToOuts(myInningsBat);
        inningsOnDefenseOuts += inningsToOuts(myInningsDef);
        earnedRunsScored += myEarnedRuns;
        earnedRunsAllowed += oppEarnedRuns;
    }

    // Calculate TQB
    const batInnings = inningsAtBatOuts / 3;
    const defInnings = inningsOnDefenseOuts / 3;

    const tqb = batInnings > 0 && defInnings > 0
        ? (runsScored / batInnings) - (runsAllowed / defInnings)
        : 0;

    const erTqb = batInnings > 0 && defInnings > 0
        ? (earnedRunsScored / batInnings) - (earnedRunsAllowed / defInnings)
        : 0;

    return {
        id: teamId,
        name: teamName,
        wins,
        losses,
        runsScored,
        runsAllowed,
        inningsAtBatOuts,
        inningsOnDefenseOuts,
        earnedRunsScored,
        earnedRunsAllowed,
        tqb,
        erTqb,
    };
}



/**
 * Linear Waterfall (Sequential) tie-breaking engine following WBSC Softball regulations
 * Criteria (H2H -> TQB -> ER-TQB) are applied in order. Once a tie moves to the next
 * level, it never returns to Step 1.
 */
function resolveTieWaterfall(
    tiedTeams: TeamStats[],
    allGames: GameData[],
    criteriaLevel: number, // 1: H2H, 2: TQB, 3: ER-TQB
    context: {
        maxMethodUsed: TieBreakMethod,
        allowERTQB: boolean,
        hasUnresolvedTies: boolean,
    }
): TeamStats[] {
    if (tiedTeams.length <= 1) return tiedTeams;

    // Safety break if we ran out of criteria
    if (criteriaLevel > 3 || (criteriaLevel === 3 && !context.allowERTQB)) {
        context.hasUnresolvedTies = true;
        return tiedTeams;
    }

    // Rule C11.2 & C11.3: Use ONLY results of games played between the tied teams
    const tiedIds = new Set(tiedTeams.map(t => t.id));
    const relevantGames = allGames.filter(
        g => tiedIds.has(g.teamAId) && tiedIds.has(g.teamBId)
    );

    let subgroups: TeamStats[][] = [];
    let currentMethod: TieBreakMethod = 'WIN_LOSS';

    if (criteriaLevel === 1) {
        // Step 1: Head-to-Head
        const h2h = tiedTeams.map(team => {
            let wins = 0;
            let losses = 0;
            for (const game of relevantGames) {
                const isA = game.teamAId === team.id;
                const isB = game.teamBId === team.id;
                if (!isA && !isB) continue;

                const myRuns = isA ? (game.runsA ?? 0) : (game.runsB ?? 0);
                const oppRuns = isA ? (game.runsB ?? 0) : (game.runsA ?? 0);

                if (myRuns > oppRuns) wins++;
                else if (myRuns < oppRuns) losses++;
            }
            return { team, wins, losses };
        });

        const groups: Map<string, TeamStats[]> = new Map();
        for (const record of h2h) {
            const key = `${record.wins}-${record.losses}`;
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key)!.push(record.team);
        }

        const sortedKeys = Array.from(groups.keys()).sort((a, b) => {
            const [aw, al] = a.split('-').map(Number);
            const [bw, bl] = b.split('-').map(Number);
            if (bw !== aw) return bw - aw;
            return al - bl;
        });

        subgroups = sortedKeys.map(k => groups.get(k)!);
        currentMethod = 'HEAD_TO_HEAD';
    }
    else {
        // Step 2 or 3: TQB or ER-TQB
        const useERTQB = criteriaLevel === 3;
        const targetMethod: TieBreakMethod = useERTQB ? 'ER_TQB' : 'TQB';

        // Calculate localized stats for these teams based on relevant games
        const localStats = tiedTeams.map(t => calculateTeamStats(t.id, t.name, relevantGames));

        const sorted = [...localStats].sort((a, b) => {
            const valA = useERTQB ? a.erTqb : a.tqb;
            const valB = useERTQB ? b.erTqb : b.tqb;
            return valB - valA;
        });

        const groups: TeamStats[][] = [];
        if (sorted.length > 0) {
            let currentGroup: TeamStats[] = [sorted[0]];
            for (let i = 1; i < sorted.length; i++) {
                const prevVal = useERTQB ? sorted[i - 1].erTqb : sorted[i - 1].tqb;
                const currVal = useERTQB ? sorted[i].erTqb : sorted[i].tqb;

                if (Math.abs(prevVal - currVal) < TIE_TOLERANCE) {
                    currentGroup.push(sorted[i]);
                } else {
                    groups.push(currentGroup);
                    currentGroup = [sorted[i]];
                }
            }
            groups.push(currentGroup);
        }

        // Map localized stats back into the ranking, but preserve global wins/losses for UI
        subgroups = groups.map(group => group.map(ls => {
            const original = tiedTeams.find(t => t.id === ls.id)!;
            return {
                ...ls,
                wins: original.wins, // Global win record
                losses: original.losses, // Global loss record
            };
        }));
        currentMethod = targetMethod;
    }

    // Update global context if separation occurred
    if (subgroups.length > 1) {
        const methodOrder: TieBreakMethod[] = ['WIN_LOSS', 'HEAD_TO_HEAD', 'TQB', 'ER_TQB', 'UNRESOLVED'];
        if (methodOrder.indexOf(currentMethod) > methodOrder.indexOf(context.maxMethodUsed)) {
            context.maxMethodUsed = currentMethod;
        }
    }

    // IF NOT SEPARATED: Try next criteria level on the SAME group
    if (subgroups.length === 1) {
        return resolveTieWaterfall(tiedTeams, allGames, criteriaLevel + 1, context);
    }

    // IF SEPARATED: Narrow the tie group and move to NEXT criteria level
    // CRITICAL (Softball C11): We move to criteriaLevel + 1 for each subgroup.
    // We NEVER go back to Step 1 (Head-to-Head) once we've reached a higher level.
    const result: TeamStats[] = [];
    for (const group of subgroups) {
        if (group.length > 1) {
            // Move to next level (e.g., TQB -> ER-TQB)
            // The "relevantGames" will be naturally re-filtered inside the recursive call
            // because tiedIds will now only contain IDs from this specific subgroup.
            result.push(...resolveTieWaterfall(group, allGames, criteriaLevel + 1, context));
        } else {
            result.push(group[0]);
        }
    }

    return result;
}

/**
 * Main ranking calculation function
 */
export function calculateRankings(
    teams: { id: string; name: string }[],
    games: GameData[],
    useERTQB: boolean = false
): RankingResult {
    // Step 1: Calculate global stats for all teams
    const allStats = teams.map(team =>
        calculateTeamStats(team.id, team.name, games)
    );

    // Step 2: Sort by overall wins (descending)
    allStats.sort((a, b) => b.wins - a.wins);

    // Step 3: Group teams by win count
    const rankGroups: Map<number, TeamStats[]> = new Map();
    for (const team of allStats) {
        if (!rankGroups.has(team.wins)) {
            rankGroups.set(team.wins, []);
        }
        rankGroups.get(team.wins)!.push(team);
    }

    const context = {
        maxMethodUsed: 'WIN_LOSS' as TieBreakMethod,
        allowERTQB: useERTQB,
        hasUnresolvedTies: false
    };

    // Step 4: Process each group of teams with same wins
    const finalRankings: TeamStats[] = [];
    const sortedWins = Array.from(rankGroups.keys()).sort((a, b) => b - a);

    for (const wins of sortedWins) {
        const group = rankGroups.get(wins)!;

        if (group.length === 1) {
            finalRankings.push(group[0]);
            continue;
        }

        // Multiple teams with same record - apply Waterfall tie-breakers
        finalRankings.push(...resolveTieWaterfall(group, games, 1, context));
    }

    // needsERTQB is true if unresolved ties exist and we haven't used ER-TQB yet
    const needsERTQB = !useERTQB && context.hasUnresolvedTies;

    return {
        rankings: finalRankings,
        tieBreakMethod: context.hasUnresolvedTies && !useERTQB ? 'TQB' : (context.hasUnresolvedTies ? 'UNRESOLVED' : context.maxMethodUsed),
        hasTies: context.hasUnresolvedTies,
        needsERTQB,
    };
}

/**
 * Validate innings format (X, X.1, or X.2 only)
 */
export function validateInningsFormat(value: string): boolean {
    if (!value || value === '') return false;
    const regex = /^(\d+)(\.([12]))?$/;
    return regex.test(value);
}

/**
 * Generate all round-robin matchups
 */
export function generateMatchups(
    teams: { id: string; name: string }[]
): Omit<GameData, 'runsA' | 'runsB' | 'inningsABatting' | 'inningsADefense' | 'inningsBBatting' | 'inningsBDefense' | 'earnedRunsA' | 'earnedRunsB'>[] {
    const matchups: Omit<GameData, 'runsA' | 'runsB' | 'inningsABatting' | 'inningsADefense' | 'inningsBBatting' | 'inningsBDefense' | 'earnedRunsA' | 'earnedRunsB'>[] = [];

    for (let i = 0; i < teams.length; i++) {
        for (let j = i + 1; j < teams.length; j++) {
            matchups.push({
                id: `${teams[i].id}-${teams[j].id}`,
                teamAId: teams[i].id,
                teamBId: teams[j].id,
                teamAName: teams[i].name,
                teamBName: teams[j].name,
            });
        }
    }

    return matchups;
}

/**
 * Format TQB/ER-TQB value with sign for display
 */
export function formatTQBValue(value: number): string {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(4)}`;
}

/**
 * Get tie-break method display text
 */
export function getTieBreakMethodText(method: TieBreakMethod, lang: 'en' | 'es' = 'en'): string {
    const texts = {
        en: {
            WIN_LOSS: '1) Rankings determined by Win-Loss Record',
            HEAD_TO_HEAD: '1) Ties resolved using Head-to-Head Results',
            TQB: '2) Ties resolved using TQB (Team Quality Balance)',
            ER_TQB: '3) Ties resolved using ER-TQB (Earned Runs Team Quality Balance)',
            UNRESOLVED: 'ER-TQB did not resolve all ties. Manual review needed for 4) Batting Average or 5) Coin Toss.',
        },
        es: {
            WIN_LOSS: '1) Clasificación determinada por Récord de Victorias-Derrotas',
            HEAD_TO_HEAD: '1) Empates resueltos usando Resultados Directos',
            TQB: '2) Empates resueltos usando TQB (Balance de Calidad del Equipo)',
            ER_TQB: '3) Empates resueltos usando ER-TQB (Balance de Calidad por Carreras Limpias)',
            UNRESOLVED: 'ER-TQB no resolvió todos los empates. Se requiere revisión manual para 4) Promedio de Bateo o 5) Lanzamiento de Moneda.',
        },
    };

    return texts[lang][method];
}

/**
 * Calculate display ranks handling ties (teams with same record/TQB get same rank)
 */
export function calculateDisplayRanks(rankings: TeamStats[], isERTQB: boolean = false): number[] {
    const ranks: number[] = [];
    let currentRank = 1;

    for (let i = 0; i < rankings.length; i++) {
        if (i > 0) {
            const currentVal = isERTQB ? rankings[i].erTqb : rankings[i].tqb;
            const prevVal = isERTQB ? rankings[i - 1].erTqb : rankings[i - 1].tqb;

            // They share a rank if wins are the same AND their TQB/ER-TQB are essentially equal
            if (rankings[i].wins !== rankings[i - 1].wins || Math.abs(currentVal - prevVal) >= TIE_TOLERANCE) {
                currentRank = i + 1;
            }
        }
        ranks.push(currentRank);
    }
    return ranks;
}



