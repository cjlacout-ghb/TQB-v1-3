// TQB and ER-TQB calculation utilities
import { GameData, TeamStats, RankingResult, TieBreakMethod, TeamID, GroupID } from './types';

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
    teamId: TeamID,
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

        // Skip games with missing runs (unplayed)
        if (game.runsA === null || game.runsB === null) continue;

        const myRuns = isTeamA ? game.runsA : game.runsB;
        const oppRuns = isTeamA ? game.runsB : game.runsA;
        const myInningsBat = isTeamA ? game.inningsABatting : game.inningsBBatting;
        const myInningsDef = isTeamA ? game.inningsADefense : game.inningsBDefense;
        const myEarnedRuns = isTeamA ? (game.earnedRunsA ?? 0) : (game.earnedRunsB ?? 0);
        const oppEarnedRuns = isTeamA ? (game.earnedRunsB ?? 0) : (game.earnedRunsA ?? 0);

        if (myRuns > oppRuns) {
            wins++;
        } else if (myRuns < oppRuns) {
            losses++;
        }

        runsScored += myRuns;
        runsAllowed += oppRuns;
        inningsAtBatOuts += inningsToOuts(myInningsBat);
        inningsOnDefenseOuts += inningsToOuts(myInningsDef);
        earnedRunsScored += myEarnedRuns;
        earnedRunsAllowed += oppEarnedRuns;
    }

    const batInnings = inningsAtBatOuts / 3;
    const defInnings = inningsOnDefenseOuts / 3;

    const winPercentage = (wins + losses) > 0 ? wins / (wins + losses) : 0;

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
        winPercentage,
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
    },
    inheritedGames?: GameData[]
): TeamStats[] {
    if (tiedTeams.length <= 1) return tiedTeams;

    // Safety break if we ran out of criteria
    if (criteriaLevel > 3 || (criteriaLevel === 3 && !context.allowERTQB)) {
        context.hasUnresolvedTies = true;
        return tiedTeams;
    }

    // Rule C11.2 & C11.3: Use ONLY results of games played between the tied teams.
    // By passing inheritedGames, we ensure we don't "restart" the tie block if a
    // partial resolution occurred, strictly following WBSC Linear Waterfall logic.
    const tiedIds = new Set(tiedTeams.map(t => t.id));
    const relevantGames = inheritedGames || allGames.filter(
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
        return resolveTieWaterfall(tiedTeams, allGames, criteriaLevel + 1, context, relevantGames);
    }

    // IF SEPARATED: Narrow the tie group and move to NEXT criteria level
    // CRITICAL (Softball C11): We move to criteriaLevel + 1 for each subgroup.
    // We NEVER go back to Step 1 (Head-to-Head) once we've reached a higher level.
    // We also pass down `relevantGames` so that the statistical calculation at the next
    // level is based on the original tied group, not just the remaining subset.
    const result: TeamStats[] = [];
    for (const group of subgroups) {
        if (group.length > 1) {
            result.push(...resolveTieWaterfall(group, allGames, criteriaLevel + 1, context, relevantGames));
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

    // Step 2: Sort by overall win percentage, then TQB, then ER-TQB (descending)
    allStats.sort((a, b) => {
        if (Math.abs(b.winPercentage - a.winPercentage) > TIE_TOLERANCE) 
            return b.winPercentage - a.winPercentage;
        
        // Secondary: Global TQB
        if (Math.abs(b.tqb - a.tqb) > TIE_TOLERANCE) return b.tqb - a.tqb;
        
        // Tertiary: Global ER-TQB
        return b.erTqb - a.erTqb;
    });

    // Step 3: Group teams by win percentage
    const rankGroups: Map<string, TeamStats[]> = new Map();
    for (const team of allStats) {
        // Use fixed precision for map key to handle floating point issues
        const key = team.winPercentage.toFixed(4);
        if (!rankGroups.has(key)) {
            rankGroups.set(key, []);
        }
        rankGroups.get(key)!.push(team);
    }

    const context = {
        maxMethodUsed: 'WIN_LOSS' as TieBreakMethod,
        allowERTQB: useERTQB,
        hasUnresolvedTies: false
    };

    // Step 4: Process each group of teams with same win percentage
    const finalRankings: TeamStats[] = [];
    const sortedKeys = Array.from(rankGroups.keys()).sort((a, b) => parseFloat(b) - parseFloat(a));

    for (const key of sortedKeys) {
        const group = rankGroups.get(key)!;

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
 * Check if a game has complete and valid data according to all game rules
 */
export function isGameCompleteAndValid(game: GameData): boolean {
    if (game.runsA === null || game.runsA === undefined || game.runsA < 0) return false;
    if (game.runsB === null || game.runsB === undefined || game.runsB < 0) return false;

    if (!game.inningsABatting || !validateInningsFormat(game.inningsABatting)) return false;
    if (!game.inningsADefense || !validateInningsFormat(game.inningsADefense)) return false;
    if (!game.inningsBBatting || !validateInningsFormat(game.inningsBBatting)) return false;
    if (!game.inningsBDefense || !validateInningsFormat(game.inningsBDefense)) return false;

    const visitorOuts = inningsToOuts(game.inningsABatting);
    const homeOuts = inningsToOuts(game.inningsBBatting);
    const visitorRuns = game.runsA;
    const homeRuns = game.runsB;

    if (homeRuns > visitorRuns) {
        if (homeOuts >= visitorOuts) return false;
    } else if (homeRuns < visitorRuns) {
        if (homeOuts !== visitorOuts) return false;
    }

    return true;
}

/**
 * Generate all round-robin matchups
 */
export function generateMatchups(
    teams: { id: string; name: string; groupId?: string }[]
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
                groupId: (teams[i].groupId as 'A' | 'B') || 'A',
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

            // They share a rank if win percentages are the same AND their TQB/ER-TQB are essentially equal
            if (Math.abs(rankings[i].winPercentage - rankings[i - 1].winPercentage) >= TIE_TOLERANCE || Math.abs(currentVal - prevVal) >= TIE_TOLERANCE) {
                currentRank = i + 1;
            }
        }
        ranks.push(currentRank);
    }
    return ranks;
}

/**
 * Reorder a game within its group in the games array by swapping it with its adjacent neighbor in that group.
 */
export function reorderGame(
    games: GameData[],
    gameId: string,
    direction: 'up' | 'down'
): GameData[] {
    const targetGame = games.find(g => g.id === gameId);
    if (!targetGame) return games;

    const groupId = targetGame.groupId ?? 'A';

    // Find all indices of games belonging to the same group
    const groupIndices: number[] = [];
    games.forEach((g, idx) => {
        if ((g.groupId ?? 'A') === groupId) {
            groupIndices.push(idx);
        }
    });

    const posInGroup = groupIndices.findIndex(idx => games[idx].id === gameId);
    if (posInGroup === -1) return games;

    if (direction === 'up') {
        if (posInGroup === 0) return games; // Already top of group, no-op
        const idx1 = groupIndices[posInGroup];
        const idx2 = groupIndices[posInGroup - 1];
        const nextGames = [...games];
        nextGames[idx1] = games[idx2];
        nextGames[idx2] = games[idx1];
        return nextGames;
    } else {
        if (posInGroup === groupIndices.length - 1) return games; // Already bottom of group, no-op
        const idx1 = groupIndices[posInGroup];
        const idx2 = groupIndices[posInGroup + 1];
        const nextGames = [...games];
        nextGames[idx1] = games[idx2];
        nextGames[idx2] = games[idx1];
        return nextGames;
    }
}

/**
 * Check if a game has any user-entered data (scores, innings, earned runs) or is locked
 */
export function isGameFilledOrLocked(game: GameData): boolean {
    if (game.isLocked) return true;
    if (game.runsA !== null && game.runsA !== undefined) return true;
    if (game.runsB !== null && game.runsB !== undefined) return true;
    if (game.inningsABatting && game.inningsABatting !== '') return true;
    if (game.inningsADefense && game.inningsADefense !== '') return true;
    if (game.inningsBBatting && game.inningsBBatting !== '') return true;
    if (game.inningsBDefense && game.inningsBDefense !== '') return true;
    if (game.earnedRunsA !== null && game.earnedRunsA !== undefined) return true;
    if (game.earnedRunsB !== null && game.earnedRunsB !== undefined) return true;
    return false;
}

export interface ContinueToGamesImpact {
    needsConfirmation: boolean;
    gamesWithResultsCount: number;
    lockedCount: number;
    activeGroups: GroupID[];
    unchangedGroups: GroupID[];
    changedGroups: GroupID[];
    discardedGroups: GroupID[];
}

/**
 * Compare current group team sets vs existing game team sets by group
 */
export function checkContinueToGamesImpact(
    teams: { id: string; name: string; groupId?: GroupID }[],
    games: GameData[],
    isMultiGroup: boolean
): ContinueToGamesImpact {
    const activeGroups: GroupID[] = isMultiGroup ? ['A', 'B'] : ['A'];
    const existingGroupIds = Array.from(new Set(games.map(g => g.groupId ?? 'A')));
    const discardedGroups = existingGroupIds.filter(gId => !activeGroups.includes(gId));

    const unchangedGroups: GroupID[] = [];
    const changedGroups: GroupID[] = [];

    for (const gId of activeGroups) {
        const currentGroupTeams = teams.filter(t => (t.groupId ?? 'A') === gId);
        const currentTeamIds = new Set(currentGroupTeams.map(t => t.id));
        const existingGroupGames = games.filter(g => (g.groupId ?? 'A') === gId);

        if (existingGroupGames.length === 0) {
            changedGroups.push(gId);
            continue;
        }

        const existingTeamIds = new Set<string>();
        existingGroupGames.forEach(g => {
            existingTeamIds.add(g.teamAId);
            existingTeamIds.add(g.teamBId);
        });

        if (
            currentTeamIds.size === existingTeamIds.size &&
            Array.from(currentTeamIds).every(id => existingTeamIds.has(id))
        ) {
            unchangedGroups.push(gId);
        } else {
            changedGroups.push(gId);
        }
    }

    const affectedGames = games.filter(g =>
        changedGroups.includes(g.groupId ?? 'A') || discardedGroups.includes(g.groupId ?? 'A')
    );

    let gamesWithResultsCount = 0;
    let lockedCount = 0;

    for (const g of affectedGames) {
        if (isGameFilledOrLocked(g)) {
            gamesWithResultsCount++;
            if (g.isLocked) {
                lockedCount++;
            }
        }
    }

    return {
        needsConfirmation: gamesWithResultsCount > 0,
        gamesWithResultsCount,
        lockedCount,
        activeGroups,
        unchangedGroups,
        changedGroups,
        discardedGroups,
    };
}

/**
 * Execute Continue to Games: preserves unchanged group games (syncing team names),
 * regenerates changed/new group games, and discards obsolete group games.
 */
export function executeContinueToGamesLogic(
    teams: { id: string; name: string; groupId?: GroupID }[],
    games: GameData[],
    isMultiGroup: boolean
): GameData[] {
    const impact = checkContinueToGamesImpact(teams, games, isMultiGroup);
    const teamNameMap = new Map(teams.map(t => [t.id, t.name]));

    const nextGames: GameData[] = [];

    for (const gId of impact.activeGroups) {
        if (impact.unchangedGroups.includes(gId)) {
            const existingGroupGames = games.filter(g => (g.groupId ?? 'A') === gId);
            // Safety net: sync team names with current teams list while preserving results & locks
            const syncedGames = existingGroupGames.map(g => ({
                ...g,
                teamAName: teamNameMap.get(g.teamAId) ?? g.teamAName,
                teamBName: teamNameMap.get(g.teamBId) ?? g.teamBName,
            }));
            nextGames.push(...syncedGames);
        } else {
            const groupTeams = teams.filter(t => (t.groupId ?? 'A') === gId);
            const matchups = generateMatchups(groupTeams);
            const newGames: GameData[] = matchups.map(match => ({
                ...match,
                groupId: gId,
                runsA: null,
                runsB: null,
                inningsABatting: '',
                inningsADefense: '',
                inningsBBatting: '',
                inningsBDefense: '',
                earnedRunsA: null,
                earnedRunsB: null,
                isLocked: false,
            }));
            nextGames.push(...newGames);
        }
    }

    return nextGames;
}

export interface LivePanelVisibilityResult {
    showPanel: boolean;
    showHelperText: boolean;
    unfixedGames: GameData[];
    lockedCount: number;
    unfixedCount: number;
}

/**
 * Determine live panel visibility for the active group on Screen 3
 */
export function getLivePanelVisibility(
    games: GameData[],
    activeGroupId: GroupID
): LivePanelVisibilityResult {
    const activeGroupGames = games.filter(g => (g.groupId ?? 'A') === activeGroupId);
    const lockedCount = activeGroupGames.filter(g => g.isLocked).length;
    const unfixedGames = activeGroupGames.filter(g => !g.isLocked);
    const unfixedCount = unfixedGames.length;

    if (lockedCount >= 1 && unfixedCount >= 1 && unfixedCount <= 4) {
        return {
            showPanel: true,
            showHelperText: false,
            unfixedGames,
            lockedCount,
            unfixedCount,
        };
    }

    if (lockedCount >= 1 && unfixedCount > 4) {
        return {
            showPanel: false,
            showHelperText: true,
            unfixedGames: [],
            lockedCount,
            unfixedCount,
        };
    }

    return {
        showPanel: false,
        showHelperText: false,
        unfixedGames: [],
        lockedCount,
        unfixedCount,
    };
}

/**
 * Check if ALL games across ALL groups are complete and valid according to WBSC/baseball rules
 */
export function areAllGamesCompleteAndValid(games: GameData[]): boolean {
    if (games.length === 0) return false;
    return games.every(g => isGameCompleteAndValid(g));
}

// ───────────────────────────────────────────────────────────────
// FASE 8b: PROVISIONAL STATUS — pure, state-free, testable
// ───────────────────────────────────────────────────────────────

/**
 * A group is provisional when it has at least one locked game AND at least one
 * unlocked game. Groups with zero locked games (lock not used) or all games
 * locked (complete tournament) are NOT provisional.
 *
 * @param groupGames  All games belonging to exactly one group
 */
export function isGroupProvisional(groupGames: GameData[]): boolean {
    if (groupGames.length === 0) return false;
    const lockedCount   = groupGames.filter(g => g.isLocked).length;
    const unlockedCount = groupGames.length - lockedCount;
    return lockedCount >= 1 && unlockedCount >= 1;
}

/**
 * Returns true if ANY active group is provisional.
 * In single-group mode pass all games; in multi-group mode pass all games from
 * both groups — the function checks each groupId independently.
 */
export function isTournamentProvisional(
    games: GameData[],
    isMultiGroup: boolean,
): boolean {
    const groups: GroupID[] = isMultiGroup ? ['A', 'B'] : ['A'];
    return groups.some(gId => {
        const groupGames = games.filter(g => (g.groupId ?? 'A') === gId);
        return isGroupProvisional(groupGames);
    });
}

/**
 * Returns the unlocked games for a given group.
 * These are the games that must receive a provisional marker in the PDF.
 * If `forceAll` is true, all games with scores are returned instead
 * (used when the user forces a provisional mark on a tournament that has no
 * locked games — we mark every game that has results).
 */
export function getProvisionalGames(
    games: GameData[],
    groupId: GroupID,
    forceAll: boolean = false,
): GameData[] {
    const groupGames = games.filter(g => (g.groupId ?? 'A') === groupId);
    if (forceAll) {
        return groupGames.filter(g => g.runsA !== null || g.runsB !== null);
    }
    return groupGames.filter(g => !g.isLocked);
}

/**
 * Determines which game IDs within a group should receive a provisional mark in PDF output.
 *
 * @param groupGames Games for a single group
 * @param isProvisionalDoc Whether the PDF document as a whole is marked provisional
 */
export function getProvisionalGameIds(
    groupGames: GameData[],
    isProvisionalDoc: boolean
): Set<string> {
    if (!isProvisionalDoc || groupGames.length === 0) return new Set();

    const hasLocked = groupGames.some(g => g.isLocked);
    const markedIds = new Set<string>();

    for (const g of groupGames) {
        if (hasLocked) {
            // If group has locked games, mark unlocked ones
            if (!g.isLocked) {
                markedIds.add(g.id);
            }
        } else {
            // If no games are locked (e.g. user forced provisional flag), mark all games with results
            if (g.runsA !== null && g.runsB !== null) {
                markedIds.add(g.id);
            }
        }
    }

    return markedIds;
}






