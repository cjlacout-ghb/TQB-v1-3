import { describe, it, expect } from 'vitest';
import {
    inningsToOuts,
    outsToInnings,
    calculateTeamStats,
    calculateRankings,
    validateInningsFormat,
    generateMatchups,
    formatTQBValue,
    calculateDisplayRanks,
    reorderGame,
    isGameFilledOrLocked,
    checkContinueToGamesImpact,
    executeContinueToGamesLogic,
    getLivePanelVisibility,
    areAllGamesCompleteAndValid,
    isGroupProvisional,
    isTournamentProvisional,
    getProvisionalGames,
    getProvisionalGameIds,
    isGameIntegrityValid,
    isGameFinalAndValid,
    isGroupValidForCalculation,
    areAllGroupsValidForCalculation,
    shouldShowInPlayBadge,
} from '@/lib/calculations';
import { MAX_UNFIXED_GAMES_PER_GROUP } from '@/lib/constants';
import { GameData, TeamStats, Team } from '@/lib/types';



describe('Unit Tests: calculations.ts Engine', () => {

    // -------------------------------------------------------------
    // 1. Innings to Outs Conversion
    // -------------------------------------------------------------
    describe('1. Innings and Outs Conversions', () => {
        it('converts whole innings (X format) to outs (X * 3)', () => {
            // Manual calculation: 7 complete innings = 7 * 3 = 21 outs
            expect(inningsToOuts(7)).toBe(21);
            expect(inningsToOuts('7')).toBe(21);
        });

        it('converts X.1 format to outs (X * 3 + 1)', () => {
            // Manual calculation: 7 innings + 1 out = 7 * 3 + 1 = 22 outs
            expect(inningsToOuts(7.1)).toBe(22);
            expect(inningsToOuts('7.1')).toBe(22);
        });

        it('converts X.2 format to outs (X * 3 + 2)', () => {
            // Manual calculation: 7 innings + 2 outs = 7 * 3 + 2 = 23 outs
            expect(inningsToOuts(7.2)).toBe(23);
            expect(inningsToOuts('7.2')).toBe(23);
        });

        it('converts string representation "6.1" to outs', () => {
            // Manual calculation: 6 * 3 + 1 = 19 outs
            expect(inningsToOuts('6.1')).toBe(19);
        });

        it('handles invalid inputs gracefully (returns 0 outs)', () => {
            // Manual calculation: invalid or negative input defaults to 0
            expect(inningsToOuts('abc')).toBe(0);
            expect(inningsToOuts(-5)).toBe(0);
            expect(inningsToOuts('')).toBe(0);
        });

        it('converts outs back to display innings format (outsToInnings)', () => {
            // Manual calculations:
            // 21 outs / 3 = 7.0
            // 22 outs / 3 = 7 whole + 1 remainder -> 7.1
            // 23 outs / 3 = 7 whole + 2 remainder -> 7.2
            expect(outsToInnings(21)).toBe(7.0);
            expect(outsToInnings(22)).toBeCloseTo(7.1, 4);
            expect(outsToInnings(23)).toBeCloseTo(7.2, 4);
            expect(outsToInnings(0)).toBe(0);
        });

        it('validates innings format string accurately', () => {
            expect(validateInningsFormat('7')).toBe(true);
            expect(validateInningsFormat('7.1')).toBe(true);
            expect(validateInningsFormat('7.2')).toBe(true);
            expect(validateInningsFormat('7.3')).toBe(false); // Only .1 or .2 allowed for outs
            expect(validateInningsFormat('abc')).toBe(false);
            expect(validateInningsFormat('')).toBe(false);
        });
    });

    // -------------------------------------------------------------
    // 2. Wins, Losses, and Win Percentage
    // -------------------------------------------------------------
    describe('2. Wins, Losses, and Win Percentage', () => {
        it('calculates 1 win and 0 losses for a winning team', () => {
            // Manual calculation: Team T1 plays 1 game, scores 5 vs 2 -> Wins: 1, Losses: 0, Win% = 1/1 = 1.0
            const games: GameData[] = [
                {
                    id: 'g1', groupId: 'A',
                    teamAId: 'T1', teamBId: 'T2', teamAName: 'Team 1', teamBName: 'Team 2',
                    runsA: 5, runsB: 2,
                    inningsABatting: '7', inningsADefense: '7',
                    inningsBBatting: '7', inningsBDefense: '7',
                    earnedRunsA: 0, earnedRunsB: 0,
                },
            ];

            const statsT1 = calculateTeamStats('T1', 'Team 1', games);
            expect(statsT1.wins).toBe(1);
            expect(statsT1.losses).toBe(0);
            expect(statsT1.winPercentage).toBe(1.0);

            const statsT2 = calculateTeamStats('T2', 'Team 2', games);
            expect(statsT2.wins).toBe(0);
            expect(statsT2.losses).toBe(1);
            expect(statsT2.winPercentage).toBe(0.0);
        });

        it('calculates win percentage correctly for multiple games (2 W, 1 L)', () => {
            // Manual calculation: 2 wins out of 3 games -> winPercentage = 2 / 3 = 0.666666...
            const games: GameData[] = [
                { id: 'g1', groupId: 'A', teamAId: 'T1', teamBId: 'T2', teamAName: 'T1', teamBName: 'T2', runsA: 5, runsB: 2, inningsABatting: '7', inningsADefense: '7', inningsBBatting: '7', inningsBDefense: '7', earnedRunsA: 0, earnedRunsB: 0 },
                { id: 'g2', groupId: 'A', teamAId: 'T1', teamBId: 'T3', teamAName: 'T1', teamBName: 'T3', runsA: 4, runsB: 1, inningsABatting: '7', inningsADefense: '7', inningsBBatting: '7', inningsBDefense: '7', earnedRunsA: 0, earnedRunsB: 0 },
                { id: 'g3', groupId: 'A', teamAId: 'T1', teamBId: 'T4', teamAName: 'T1', teamBName: 'T4', runsA: 1, runsB: 3, inningsABatting: '7', inningsADefense: '7', inningsBBatting: '7', inningsBDefense: '7', earnedRunsA: 0, earnedRunsB: 0 },
            ];

            const stats = calculateTeamStats('T1', 'T1', games);
            expect(stats.wins).toBe(2);
            expect(stats.losses).toBe(1);
            expect(stats.winPercentage).toBeCloseTo(2 / 3, 4);
        });

        it('returns 0.0 win percentage for a team with 0 played games', () => {
            // Manual calculation: 0 games -> winPercentage = 0.0
            const stats = calculateTeamStats('T1', 'T1', []);
            expect(stats.wins).toBe(0);
            expect(stats.losses).toBe(0);
            expect(stats.winPercentage).toBe(0.0);
        });
    });

    // -------------------------------------------------------------
    // 3. TQB Calculation & Edge Cases
    // -------------------------------------------------------------
    describe('3. TQB Calculation & Edge Cases', () => {
        it('calculates TQB accurately with simple hand-calculable values', () => {
            // Manual calculation:
            // Team A: 10 runs scored in 7 innings (21 outs), 2 runs allowed in 7 innings (21 outs).
            // Offensive Ratio = 10 / 7 = 1.4285714...
            // Defensive Ratio = 2 / 7  = 0.2857142...
            // TQB = 1.4285714 - 0.2857142 = 1.1428571...
            const games: GameData[] = [
                {
                    id: 'g1', groupId: 'A',
                    teamAId: 'TA', teamBId: 'TB', teamAName: 'Team A', teamBName: 'Team B',
                    runsA: 10, runsB: 2,
                    inningsABatting: '7', inningsADefense: '7',
                    inningsBBatting: '7', inningsBDefense: '7',
                    earnedRunsA: 0, earnedRunsB: 0,
                },
            ];

            const statsA = calculateTeamStats('TA', 'Team A', games);
            const expectedRatioScored = 10 / 7;
            const expectedRatioAllowed = 2 / 7;
            const expectedTQB = expectedRatioScored - expectedRatioAllowed;

            expect(statsA.runsScored).toBe(10);
            expect(statsA.runsAllowed).toBe(2);
            expect(statsA.inningsAtBatOuts).toBe(21);
            expect(statsA.inningsOnDefenseOuts).toBe(21);
            expect(statsA.tqb).toBeCloseTo(expectedTQB, 4);
            expect(formatTQBValue(statsA.tqb)).toBe('+1.1429');
        });

        it('handles zero innings at bat / defense without division by zero (returns 0 TQB)', () => {
            // Manual calculation: 0 innings at bat -> division by zero prevented, TQB = 0
            const stats = calculateTeamStats('TA', 'Team A', []);
            expect(stats.tqb).toBe(0);
            expect(stats.erTqb).toBe(0);
        });

        it('skips games with null runs (incomplete/unplayed games)', () => {
            // Manual calculation: game 2 has null runs, so only game 1 (5-2) is included
            const games: GameData[] = [
                { id: 'g1', groupId: 'A', teamAId: 'TA', teamBId: 'TB', teamAName: 'TA', teamBName: 'TB', runsA: 5, runsB: 2, inningsABatting: '7', inningsADefense: '7', inningsBBatting: '7', inningsBDefense: '7', earnedRunsA: 0, earnedRunsB: 0 },
                { id: 'g2', groupId: 'A', teamAId: 'TA', teamBId: 'TB', teamAName: 'TA', teamBName: 'TB', runsA: null, runsB: null, inningsABatting: '', inningsADefense: '', inningsBBatting: '', inningsBDefense: '', earnedRunsA: null, earnedRunsB: null },
            ];

            const stats = calculateTeamStats('TA', 'TA', games);
            expect(stats.runsScored).toBe(5);
            expect(stats.wins).toBe(1);
        });
    });

    // -------------------------------------------------------------
    // 4. Linear Waterfall Tie-Breaking Engine (WBSC Rule C11)
    // -------------------------------------------------------------
    describe('4. Linear Waterfall Tie-Breaking Engine (WBSC Rule C11)', () => {
        const teams = [
            { id: 'T1', name: 'Team 1' },
            { id: 'T2', name: 'Team 2' },
            { id: 'T3', name: 'Team 3' },
        ];

        it('resolves a 2-team tie by Head-to-Head (H2H)', () => {
            // Manual calculation:
            // T1 (2-1), T2 (1-2), T3 (0-3). But let's create a 2-team tie between T1 and T2 (both 2-1).
            // T1 beat T2 (5-2) in Head-to-Head.
            // Expected: T1 ranked #1, T2 ranked #2 via HEAD_TO_HEAD.
            const games: GameData[] = [
                { id: 'g1', groupId: 'A', teamAId: 'T1', teamBId: 'T2', teamAName: 'T1', teamBName: 'T2', runsA: 5, runsB: 2, inningsABatting: '7', inningsADefense: '7', inningsBBatting: '7', inningsBDefense: '7', earnedRunsA: 0, earnedRunsB: 0 },
                { id: 'g2', groupId: 'A', teamAId: 'T1', teamBId: 'T3', teamAName: 'T1', teamBName: 'T3', runsA: 4, runsB: 1, inningsABatting: '7', inningsADefense: '7', inningsBBatting: '7', inningsBDefense: '7', earnedRunsA: 0, earnedRunsB: 0 },
                { id: 'g3', groupId: 'A', teamAId: 'T2', teamBId: 'T3', teamAName: 'T2', teamBName: 'T3', runsA: 6, runsB: 0, inningsABatting: '7', inningsADefense: '7', inningsBBatting: '7', inningsBDefense: '7', earnedRunsA: 0, earnedRunsB: 0 },
            ];

            // T1 is 2-0, T2 is 1-1, T3 is 0-2. Let's make T1 and T2 tied at 2-1 by adding game T3 beats T1.
            const gamesWithTie: GameData[] = [
                ...games,
                { id: 'g4', groupId: 'A', teamAId: 'T3', teamBId: 'T1', teamAName: 'T3', teamBName: 'T1', runsA: 3, runsB: 2, inningsABatting: '7', inningsADefense: '7', inningsBBatting: '7', inningsBDefense: '7', earnedRunsA: 0, earnedRunsB: 0 },
                { id: 'g5', groupId: 'A', teamAId: 'T2', teamBId: 'T1', teamAName: 'T2', teamBName: 'T1', runsA: 1, runsB: 4, inningsABatting: '7', inningsADefense: '7', inningsBBatting: '7', inningsBDefense: '7', earnedRunsA: 0, earnedRunsB: 0 },
            ];

            const result = calculateRankings(teams, gamesWithTie, false);
            expect(result.rankings[0].id).toBe('T1');
            expect(result.rankings[1].id).toBe('T2');
            expect(result.tieBreakMethod).toBe('HEAD_TO_HEAD');
        });

        it('resolves a 3-way circle tie using TQB', () => {
            // Manual calculation:
            // Circle tie: T1 beats T2 (10-2), T2 beats T3 (5-2), T3 beats T1 (5-2).
            // All teams are 1-1. H2H among tied teams is 1-1 for all (circle tie).
            // TQB calculation:
            // T1: RS = 12, InnBat = 14 -> 12/14 = 0.8571; RA = 7, InnDef = 14 -> 7/14 = 0.5. TQB_T1 = +0.3571.
            // T2: RS = 7, InnBat = 14 -> 0.5; RA = 12, InnDef = 14 -> 0.8571. TQB_T2 = -0.3571.
            // T3: RS = 7, InnBat = 14 -> 0.5; RA = 7, InnDef = 14 -> 0.5. TQB_T3 = 0.0000.
            // Expected order: 1) T1 (+0.3571), 2) T3 (0.0000), 3) T2 (-0.3571).
            const games: GameData[] = [
                { id: 'g1', groupId: 'A', teamAId: 'T1', teamBId: 'T2', teamAName: 'T1', teamBName: 'T2', runsA: 10, runsB: 2, inningsABatting: '7', inningsADefense: '7', inningsBBatting: '7', inningsBDefense: '7', earnedRunsA: 0, earnedRunsB: 0 },
                { id: 'g2', groupId: 'A', teamAId: 'T2', teamBId: 'T3', teamAName: 'T2', teamBName: 'T3', runsA: 5, runsB: 2, inningsABatting: '7', inningsADefense: '7', inningsBBatting: '7', inningsBDefense: '7', earnedRunsA: 0, earnedRunsB: 0 },
                { id: 'g3', groupId: 'A', teamAId: 'T3', teamBId: 'T1', teamAName: 'T3', teamBName: 'T1', runsA: 5, runsB: 2, inningsABatting: '7', inningsADefense: '7', inningsBBatting: '7', inningsBDefense: '7', earnedRunsA: 0, earnedRunsB: 0 },
            ];

            const result = calculateRankings(teams, games, false);
            expect(result.rankings[0].id).toBe('T1');
            expect(result.rankings[1].id).toBe('T3');
            expect(result.rankings[2].id).toBe('T2');
            expect(result.tieBreakMethod).toBe('TQB');
            expect(result.needsERTQB).toBe(false);
        });

        it('detects a tie that TQB cannot resolve and flags needsERTQB', () => {
            // Manual calculation:
            // T1 beats T2 (5-2), T2 beats T3 (5-2), T3 beats T1 (5-2).
            // All teams have identical RS (7 in 14 inn) and RA (7 in 14 inn).
            // TQB for T1, T2, T3 is 0.0000.
            // Expected: TQB cannot break tie -> needsERTQB = true, hasTies = true.
            const games: GameData[] = [
                { id: 'g1', groupId: 'A', teamAId: 'T1', teamBId: 'T2', teamAName: 'T1', teamBName: 'T2', runsA: 5, runsB: 2, inningsABatting: '7', inningsADefense: '7', inningsBBatting: '7', inningsBDefense: '7', earnedRunsA: 0, earnedRunsB: 0 },
                { id: 'g2', groupId: 'A', teamAId: 'T2', teamBId: 'T3', teamAName: 'T2', teamBName: 'T3', runsA: 5, runsB: 2, inningsABatting: '7', inningsADefense: '7', inningsBBatting: '7', inningsBDefense: '7', earnedRunsA: 0, earnedRunsB: 0 },
                { id: 'g3', groupId: 'A', teamAId: 'T3', teamBId: 'T1', teamAName: 'T3', teamBName: 'T1', runsA: 5, runsB: 2, inningsABatting: '7', inningsADefense: '7', inningsBBatting: '7', inningsBDefense: '7', earnedRunsA: 0, earnedRunsB: 0 },
            ];

            const result = calculateRankings(teams, games, false);
            expect(result.needsERTQB).toBe(true);
            expect(result.hasTies).toBe(true);
            expect(result.tieBreakMethod).toBe('TQB');
        });

        it('resolves a tie using ER-TQB when useERTQB is true', () => {
            // Manual calculation:
            // TQB is 0.0000 for T1, T2, T3 (all games 5-2 in 7 innings).
            // Earned runs entered:
            // g1 (T1 vs T2 5-2): ER_T1 = 4, ER_T2 = 1
            // g2 (T2 vs T3 5-2): ER_T2 = 4, ER_T3 = 1
            // g3 (T3 vs T1 5-2): ER_T3 = 3, ER_T1 = 2
            // ER-TQB:
            // T1: ER_Scored = 4 (vs T2) + 2 (vs T3) = 6. ER_Allowed = 1 (vs T2) + 3 (vs T3) = 4.
            //     erTqb_T1 = (6 / 14) - (4 / 14) = +2/14 ≈ +0.1429
            // T2: ER_Scored = 1 (vs T1) + 4 (vs T3) = 5. ER_Allowed = 4 (vs T1) + 1 (vs T3) = 5.
            //     erTqb_T2 = (5 / 14) - (5 / 14) = 0.0000
            // T3: ER_Scored = 1 (vs T2) + 3 (vs T1) = 4. ER_Allowed = 4 (vs T2) + 2 (vs T1) = 6.
            //     erTqb_T3 = (4 / 14) - (6 / 14) = -2/14 ≈ -0.1429
            // Expected order: 1) T1 (+0.1429), 2) T2 (0.0000), 3) T3 (-0.1429).
            const games: GameData[] = [
                { id: 'g1', groupId: 'A', teamAId: 'T1', teamBId: 'T2', teamAName: 'T1', teamBName: 'T2', runsA: 5, runsB: 2, inningsABatting: '7', inningsADefense: '7', inningsBBatting: '7', inningsBDefense: '7', earnedRunsA: 4, earnedRunsB: 1 },
                { id: 'g2', groupId: 'A', teamAId: 'T2', teamBId: 'T3', teamAName: 'T2', teamBName: 'T3', runsA: 5, runsB: 2, inningsABatting: '7', inningsADefense: '7', inningsBBatting: '7', inningsBDefense: '7', earnedRunsA: 4, earnedRunsB: 1 },
                { id: 'g3', groupId: 'A', teamAId: 'T3', teamBId: 'T1', teamAName: 'T3', teamBName: 'T1', runsA: 5, runsB: 2, inningsABatting: '7', inningsADefense: '7', inningsBBatting: '7', inningsBDefense: '7', earnedRunsA: 3, earnedRunsB: 2 },
            ];

            const result = calculateRankings(teams, games, true);
            expect(result.rankings[0].id).toBe('T1');
            expect(result.rankings[1].id).toBe('T2');
            expect(result.rankings[2].id).toBe('T3');
            expect(result.tieBreakMethod).toBe('ER_TQB');
            expect(result.hasTies).toBe(false);
        });

        it('marks status as UNRESOLVED if tie persists after ER-TQB', () => {
            // Manual calculation:
            // Both TQB and ER-TQB are identical for all teams (0.0000).
            // Expected: hasTies = true, tieBreakMethod = 'UNRESOLVED'.
            const games: GameData[] = [
                { id: 'g1', groupId: 'A', teamAId: 'T1', teamBId: 'T2', teamAName: 'T1', teamBName: 'T2', runsA: 5, runsB: 2, inningsABatting: '7', inningsADefense: '7', inningsBBatting: '7', inningsBDefense: '7', earnedRunsA: 0, earnedRunsB: 0 },
                { id: 'g2', groupId: 'A', teamAId: 'T2', teamBId: 'T3', teamAName: 'T2', teamBName: 'T3', runsA: 5, runsB: 2, inningsABatting: '7', inningsADefense: '7', inningsBBatting: '7', inningsBDefense: '7', earnedRunsA: 0, earnedRunsB: 0 },
                { id: 'g3', groupId: 'A', teamAId: 'T3', teamBId: 'T1', teamAName: 'T3', teamBName: 'T1', runsA: 5, runsB: 2, inningsABatting: '7', inningsADefense: '7', inningsBBatting: '7', inningsBDefense: '7', earnedRunsA: 0, earnedRunsB: 0 },
            ];

            const result = calculateRankings(teams, games, true);
            expect(result.hasTies).toBe(true);
            expect(result.tieBreakMethod).toBe('UNRESOLVED');
        });
    });

    // -------------------------------------------------------------
    // 5. Floating Point Tolerance
    // -------------------------------------------------------------
    describe('5. Floating Point Tolerance', () => {
        it('treats two TQB values within 0.0001 tolerance as equal in rank assignment', () => {
            // Manual calculation:
            // Team A has TQB 0.142857, Team B has TQB 0.142859 (diff = 0.000002 < 0.0001 tolerance).
            // Both teams have 1 win, 0 losses.
            // Expected: calculateDisplayRanks should assign rank #1 to both teams.
            const mockRankings: TeamStats[] = [
                { id: 'TA', name: 'Team A', wins: 1, losses: 0, winPercentage: 1.0, runsScored: 5, runsAllowed: 2, inningsAtBatOuts: 21, inningsOnDefenseOuts: 21, earnedRunsScored: 0, earnedRunsAllowed: 0, tqb: 0.142857, erTqb: 0 },
                { id: 'TB', name: 'Team B', wins: 1, losses: 0, winPercentage: 1.0, runsScored: 5, runsAllowed: 2, inningsAtBatOuts: 21, inningsOnDefenseOuts: 21, earnedRunsScored: 0, earnedRunsAllowed: 0, tqb: 0.142859, erTqb: 0 },
            ];

            const ranks = calculateDisplayRanks(mockRankings, false);
            expect(ranks).toEqual([1, 1]);
        });
    });

    // -------------------------------------------------------------
    // 6. Multi-group Isolation
    // -------------------------------------------------------------
    describe('6. Multi-group Isolation', () => {
        it('calculates groups independently without mixing stats or team names', () => {
            // Manual calculation:
            // Group A: Team 1 (A) vs Team 2 (A) -> Score 10-0. Team 1 (A) win% = 1.0
            // Group B: Team 1 (B) vs Team 2 (B) -> Score 0-5. Team 1 (B) win% = 0.0
            // Games from Group A must not affect Group B.
            const groupATeams = [{ id: 't1-a', name: 'Team 1' }, { id: 't2-a', name: 'Team 2' }];
            const groupBTeams = [{ id: 't1-b', name: 'Team 1' }, { id: 't2-b', name: 'Team 2' }];

            const groupAGames: GameData[] = [
                { id: 'ga1', groupId: 'A', teamAId: 't1-a', teamBId: 't2-a', teamAName: 'Team 1', teamBName: 'Team 2', runsA: 10, runsB: 0, inningsABatting: '7', inningsADefense: '7', inningsBBatting: '7', inningsBDefense: '7', earnedRunsA: 0, earnedRunsB: 0 },
            ];
            const groupBGames: GameData[] = [
                { id: 'gb1', groupId: 'B', teamAId: 't1-b', teamBId: 't2-b', teamAName: 'Team 1', teamBName: 'Team 2', runsA: 0, runsB: 5, inningsABatting: '7', inningsADefense: '7', inningsBBatting: '7', inningsBDefense: '7', earnedRunsA: 0, earnedRunsB: 0 },
            ];

            const resA = calculateRankings(groupATeams, groupAGames, false);
            const resB = calculateRankings(groupBTeams, groupBGames, false);

            expect(resA.rankings[0].id).toBe('t1-a');
            expect(resA.rankings[0].wins).toBe(1);

            expect(resB.rankings[0].id).toBe('t2-b');
            expect(resB.rankings[0].wins).toBe(1);
        });

        it('identifies per-group needsERTQB accurately when one group needs ER-TQB and the other does not', () => {
            // Group A: Circle tie where TQB cannot resolve (needsERTQB = true)
            const gATeams = [{ id: 'ta1', name: 'TA1' }, { id: 'ta2', name: 'TA2' }, { id: 'ta3', name: 'TA3' }];
            const gAGames: GameData[] = [
                { id: 'ga1', groupId: 'A', teamAId: 'ta1', teamBId: 'ta2', teamAName: 'TA1', teamBName: 'TA2', runsA: 5, runsB: 2, inningsABatting: '7', inningsADefense: '7', inningsBBatting: '7', inningsBDefense: '7', earnedRunsA: 0, earnedRunsB: 0 },
                { id: 'ga2', groupId: 'A', teamAId: 'ta2', teamBId: 'ta3', teamAName: 'TA2', teamBName: 'TA3', runsA: 5, runsB: 2, inningsABatting: '7', inningsADefense: '7', inningsBBatting: '7', inningsBDefense: '7', earnedRunsA: 0, earnedRunsB: 0 },
                { id: 'ga3', groupId: 'A', teamAId: 'ta3', teamBId: 'ta1', teamAName: 'TA3', teamBName: 'TA1', runsA: 5, runsB: 2, inningsABatting: '7', inningsADefense: '7', inningsBBatting: '7', inningsBDefense: '7', earnedRunsA: 0, earnedRunsB: 0 },
            ];

            // Group B: Clear winner (needsERTQB = false)
            const gBTeams = [{ id: 'tb1', name: 'TB1' }, { id: 'tb2', name: 'TB2' }];
            const gBGames: GameData[] = [
                { id: 'gb1', groupId: 'B', teamAId: 'tb1', teamBId: 'tb2', teamAName: 'TB1', teamBName: 'TB2', runsA: 10, runsB: 0, inningsABatting: '7', inningsADefense: '7', inningsBBatting: '7', inningsBDefense: '7', earnedRunsA: 0, earnedRunsB: 0 },
            ];

            const resA = calculateRankings(gATeams, gAGames, false);
            const resB = calculateRankings(gBTeams, gBGames, false);

            expect(resA.needsERTQB).toBe(true);
            expect(resB.needsERTQB).toBe(false);
            const globalNeedsERTQB = resA.needsERTQB || resB.needsERTQB;
            expect(globalNeedsERTQB).toBe(true);
        });
    });

    // -------------------------------------------------------------
    // 7. Round-Robin Matchup Generation
    // -------------------------------------------------------------
    describe('7. Round-Robin Matchup Generation', () => {
        it('generates correct number of unique matchups for N teams (N * (N-1) / 2)', () => {
            // Manual calculation:
            // 3 teams -> 3 * 2 / 2 = 3 matchups
            // 4 teams -> 4 * 3 / 2 = 6 matchups
            // 5 teams -> 5 * 4 / 2 = 10 matchups
            const teams3 = [{ id: 't1', name: 'T1' }, { id: 't2', name: 'T2' }, { id: 't3', name: 'T3' }];
            const teams4 = [{ id: 't1', name: 'T1' }, { id: 't2', name: 'T2' }, { id: 't3', name: 'T3' }, { id: 't4', name: 'T4' }];

            const matches3 = generateMatchups(teams3);
            expect(matches3).toHaveLength(3);

            const matches4 = generateMatchups(teams4);
            expect(matches4).toHaveLength(6);

            // Verify no team plays against itself
            for (const match of matches4) {
                expect(match.teamAId).not.toBe(match.teamBId);
            }
        });
    });

    // -------------------------------------------------------------
    // 8. FASE 5: Reordenar partidos (reorderGame logic & ranking invariance)
    // -------------------------------------------------------------
    describe('8. FASE 5: Reordenar partidos (reorderGame logic & ranking invariance)', () => {
        const sampleGames: GameData[] = [
            {
                id: 'g1', groupId: 'A', teamAId: 't1', teamBId: 't2', teamAName: 'Team 1', teamBName: 'Team 2',
                runsA: 5, runsB: 2, inningsABatting: '7', inningsADefense: '7', inningsBBatting: '7', inningsBDefense: '7',
                earnedRunsA: 4, earnedRunsB: 1,
            },
            {
                id: 'g2', groupId: 'A', teamAId: 't2', teamBId: 't3', teamAName: 'Team 2', teamBName: 'Team 3',
                runsA: 3, runsB: 1, inningsABatting: '7', inningsADefense: '7', inningsBBatting: '7', inningsBDefense: '7',
                earnedRunsA: 2, earnedRunsB: 0,
            },
            {
                id: 'g3', groupId: 'A', teamAId: 't3', teamBId: 't1', teamAName: 'Team 3', teamBName: 'Team 1',
                runsA: 4, runsB: 6, inningsABatting: '7', inningsADefense: '7', inningsBBatting: '7', inningsBDefense: '7',
                earnedRunsA: 3, earnedRunsB: 5,
            },
        ];

        it('sube y baja un partido intermedio correctamente', () => {
            // Move g2 UP (swaps with g1)
            const movedUp = reorderGame(sampleGames, 'g2', 'up');
            expect(movedUp.map(g => g.id)).toEqual(['g2', 'g1', 'g3']);

            // Move g2 DOWN (swaps back with g1)
            const movedDown = reorderGame(movedUp, 'g2', 'down');
            expect(movedDown.map(g => g.id)).toEqual(['g1', 'g2', 'g3']);
        });

        it('no realiza cambios en los extremos (primero no sube, último no baja)', () => {
            // Try moving first game UP
            const firstUp = reorderGame(sampleGames, 'g1', 'up');
            expect(firstUp).toEqual(sampleGames);

            // Try moving last game DOWN
            const lastDown = reorderGame(sampleGames, 'g3', 'down');
            expect(lastDown).toEqual(sampleGames);
        });

        it('preserva todos los datos del partido intactos cuando este se reordena', () => {
            const moved = reorderGame(sampleGames, 'g2', 'up');
            const targetGame = moved.find(g => g.id === 'g2')!;
            expect(targetGame).toEqual(sampleGames[1]);
            expect(targetGame.runsA).toBe(3);
            expect(targetGame.runsB).toBe(1);
            expect(targetGame.earnedRunsA).toBe(2);
            expect(targetGame.earnedRunsB).toBe(0);
        });

        it('garantiza el aislamiento entre grupos al reordenar', () => {
            const multiGroupGames: GameData[] = [
                { ...sampleGames[0], id: 'ga1', groupId: 'A' },
                { id: 'gb1', groupId: 'B', teamAId: 'tb1', teamBId: 'tb2', teamAName: 'Team B1', teamBName: 'Team B2', runsA: 1, runsB: 0, inningsABatting: '7', inningsADefense: '7', inningsBBatting: '7', inningsBDefense: '7', earnedRunsA: 1, earnedRunsB: 0 },
                { ...sampleGames[1], id: 'ga2', groupId: 'A' },
                { id: 'gb2', groupId: 'B', teamAId: 'tb2', teamBId: 'tb3', teamAName: 'Team B2', teamBName: 'Team B3', runsA: 2, runsB: 0, inningsABatting: '7', inningsADefense: '7', inningsBBatting: '7', inningsBDefense: '7', earnedRunsA: 2, earnedRunsB: 0 },
            ];

            // Reorder ga2 UP in Group A (should swap with ga1)
            const result = reorderGame(multiGroupGames, 'ga2', 'up');
            
            // Check Group A order: ga2, ga1
            const groupAGames = result.filter(g => g.groupId === 'A');
            expect(groupAGames.map(g => g.id)).toEqual(['ga2', 'ga1']);

            // Check Group B order: gb1, gb2 (unchanged)
            const groupBGames = result.filter(g => g.groupId === 'B');
            expect(groupBGames.map(g => g.id)).toEqual(['gb1', 'gb2']);
        });

        it('produce posiciones finales, TQB y ER-TQB idénticos antes y después de reordenar partidos', () => {
            const teams = [
                { id: 't1', name: 'Team 1' },
                { id: 't2', name: 'Team 2' },
                { id: 't3', name: 'Team 3' },
            ];

            const initialRankings = calculateRankings(teams, sampleGames, false);
            const initialERRankings = calculateRankings(teams, sampleGames, true);

            // Reorder games list
            const reorderedGames = reorderGame(sampleGames, 'g2', 'up');

            const reorderedRankings = calculateRankings(teams, reorderedGames, false);
            const reorderedERRankings = calculateRankings(teams, reorderedGames, true);

            expect(reorderedRankings).toEqual(initialRankings);
            expect(reorderedERRankings).toEqual(initialERRankings);
        });
    });

    // -------------------------------------------------------------
    // 9. FASE 7: Smart Continue to Games Impact & Name Sync
    // -------------------------------------------------------------
    describe('9. FASE 7: Smart Continue to Games Impact & Name Sync', () => {
        const teamsA: Team[] = [
            { id: 't1', name: 'Alpha', groupId: 'A' },
            { id: 't2', name: 'Beta', groupId: 'A' },
            { id: 't3', name: 'Gamma', groupId: 'A' },
        ];

        const teamsB: Team[] = [
            { id: 't4', name: 'Delta', groupId: 'B' },
            { id: 't5', name: 'Echo', groupId: 'B' },
            { id: 't6', name: 'Foxtrot', groupId: 'B' },
        ];

        const gamesA: GameData[] = [
            {
                id: 'g1', groupId: 'A', teamAId: 't1', teamBId: 't2', teamAName: 'Alpha', teamBName: 'Beta',
                runsA: 5, runsB: 2, inningsABatting: '7', inningsADefense: '7', inningsBBatting: '7', inningsBDefense: '7',
                earnedRunsA: 4, earnedRunsB: 1, isLocked: true,
            },
            {
                id: 'g2', groupId: 'A', teamAId: 't2', teamBId: 't3', teamAName: 'Beta', teamBName: 'Gamma',
                runsA: 3, runsB: 1, inningsABatting: '7', inningsADefense: '7', inningsBBatting: '7', inningsBDefense: '7',
                earnedRunsA: 2, earnedRunsB: 0, isLocked: false,
            },
        ];

        it('isGameFilledOrLocked identifies locked or filled games', () => {
            expect(isGameFilledOrLocked(gamesA[0])).toBe(true);
            expect(isGameFilledOrLocked(gamesA[1])).toBe(true);

            const emptyGame: GameData = {
                id: 'g-empty', groupId: 'A', teamAId: 't1', teamBId: 't3', teamAName: 'Alpha', teamBName: 'Gamma',
                runsA: null, runsB: null, inningsABatting: '', inningsADefense: '', inningsBBatting: '', inningsBDefense: '',
                earnedRunsA: null, earnedRunsB: null, isLocked: false,
            };
            expect(isGameFilledOrLocked(emptyGame)).toBe(false);
        });

        it('checkContinueToGamesImpact correctly flags unchanged groups and zero data loss when team set is identical', () => {
            const impact = checkContinueToGamesImpact(teamsA, gamesA, false);

            expect(impact.needsConfirmation).toBe(false);
            expect(impact.unchangedGroups).toEqual(['A']);
            expect(impact.changedGroups).toEqual([]);
            expect(impact.discardedGroups).toEqual([]);
        });

        it('checkContinueToGamesImpact flags changed group and requests confirmation if data would be lost', () => {
            const modifiedTeamsA: Team[] = [
                { id: 't1', name: 'Alpha', groupId: 'A' },
                { id: 't2', name: 'Beta', groupId: 'A' },
                { id: 't99', name: 'New Team', groupId: 'A' }, // replaced t3 with t99
            ];

            const impact = checkContinueToGamesImpact(modifiedTeamsA, gamesA, false);

            expect(impact.needsConfirmation).toBe(true);
            expect(impact.unchangedGroups).toEqual([]);
            expect(impact.changedGroups).toEqual(['A']);
            expect(impact.gamesWithResultsCount).toBe(2);
            expect(impact.lockedCount).toBe(1);
        });

        it('executeContinueToGamesLogic preserves existing games and synchronizes team names when team set is unchanged', () => {
            const renamedTeamsA: Team[] = [
                { id: 't1', name: 'Alpha Renamed', groupId: 'A' },
                { id: 't2', name: 'Beta Renamed', groupId: 'A' },
                { id: 't3', name: 'Gamma', groupId: 'A' },
            ];

            const resultGames = executeContinueToGamesLogic(renamedTeamsA, gamesA, false);

            expect(resultGames).toHaveLength(2);
            expect(resultGames[0].id).toBe('g1');
            expect(resultGames[0].teamAName).toBe('Alpha Renamed');
            expect(resultGames[0].teamBName).toBe('Beta Renamed');
            expect(resultGames[0].runsA).toBe(5); // Preserves score
            expect(resultGames[0].isLocked).toBe(true); // Preserves lock
        });

        it('going from multi-group to single-group discards group B games and flags confirmation if group B had results', () => {
            const gamesB: GameData[] = [
                {
                    id: 'gb1', groupId: 'B', teamAId: teamsB[0].id, teamBId: teamsB[1].id, teamAName: teamsB[0].name, teamBName: teamsB[1].name,
                    runsA: 1, runsB: 0, inningsABatting: '7', inningsADefense: '7', inningsBBatting: '7', inningsBDefense: '7',
                    earnedRunsA: 1, earnedRunsB: 0, isLocked: false,
                },
            ];

            const allGames = [...gamesA, ...gamesB];
            const impact = checkContinueToGamesImpact(teamsA, allGames, false); // Single group mode

            expect(impact.needsConfirmation).toBe(true);
            expect(impact.discardedGroups).toEqual(['B']);

            const resultGames = executeContinueToGamesLogic(teamsA, allGames, false);
            expect(resultGames.every(g => g.groupId === 'A')).toBe(true);
        });
    });

    // -------------------------------------------------------------
    // 10. FASE 8: Live Panel Visibility & Game Completeness Logic
    // -------------------------------------------------------------
    describe('10. FASE 8: Live Panel Visibility & Game Completeness Logic', () => {
        const mockGame = (id: string, groupId: 'A' | 'B', isLocked: boolean, complete: boolean = true): GameData => ({
            id,
            groupId,
            teamAId: 't1',
            teamBId: 't2',
            teamAName: 'Team 1',
            teamBName: 'Team 2',
            runsA: complete ? 5 : null,
            runsB: complete ? 3 : null,
            inningsABatting: complete ? '7' : '',
            inningsADefense: complete ? '7' : '',
            inningsBBatting: complete ? '7' : '',
            inningsBDefense: complete ? '7' : '',
            isLocked,
            earnedRunsA: null,
            earnedRunsB: null,
        });

        it('returns showPanel: false, showHelperText: false when 0 locked games exist', () => {
            const games = [
                mockGame('g1', 'A', false),
                mockGame('g2', 'A', false),
                mockGame('g3', 'A', false),
            ];
            const vis = getLivePanelVisibility(games, 'A');
            expect(vis.showPanel).toBe(false);
            expect(vis.showHelperText).toBe(false);
            expect(vis.unfixedGames).toHaveLength(0);
        });

        it('returns showPanel: false, showHelperText: false when 0 unfixed games exist (all locked)', () => {
            const games = [
                mockGame('g1', 'A', true),
                mockGame('g2', 'A', true),
                mockGame('g3', 'A', true),
            ];
            const vis = getLivePanelVisibility(games, 'A');
            expect(vis.showPanel).toBe(false);
            expect(vis.showHelperText).toBe(false);
        });

        it('returns showPanel: true, showHelperText: false when 1 unfixed game exists with >= 1 locked game', () => {
            // 2 locked games, 1 unfixed game
            const games = [
                mockGame('g1', 'A', true),
                mockGame('g2', 'A', true),
                mockGame('g3', 'A', false),
            ];
            const vis = getLivePanelVisibility(games, 'A');
            expect(vis.showPanel).toBe(true);
            expect(vis.showHelperText).toBe(false);
            expect(vis.unfixedGames.map(g => g.id)).toEqual(['g3']);
        });

        it('returns showPanel: false, showHelperText: true when > 1 unfixed games exist with >= 1 locked game', () => {
            // 1 locked game, 2 unfixed games
            const games = [
                mockGame('g1', 'A', true),
                mockGame('g2', 'A', false),
                mockGame('g3', 'A', false),
            ];
            const vis = getLivePanelVisibility(games, 'A');
            expect(vis.showPanel).toBe(false);
            expect(vis.showHelperText).toBe(true);
        });

        it('evaluates visibility isolated per active group in multi-group mode', () => {
            // Group A: 1 locked, 1 unfixed -> showPanel true for A
            // Group B: 0 locked, 3 unfixed -> showPanel false for B
            const games = [
                mockGame('ga1', 'A', true),
                mockGame('ga2', 'A', false),
                mockGame('gb1', 'B', false),
                mockGame('gb2', 'B', false),
                mockGame('gb3', 'B', false),
            ];

            const visA = getLivePanelVisibility(games, 'A');
            expect(visA.showPanel).toBe(true);

            const visB = getLivePanelVisibility(games, 'B');
            expect(visB.showPanel).toBe(false);
        });

        it('areAllGamesCompleteAndValid evaluates complete vs incomplete games across all groups', () => {
            const completeGames = [
                mockGame('g1', 'A', true, true),
                mockGame('g2', 'A', false, true),
            ];
            expect(areAllGamesCompleteAndValid(completeGames)).toBe(true);

            const incompleteGames = [
                mockGame('g1', 'A', true, true),
                mockGame('g2', 'A', false, false), // incomplete
            ];
            expect(areAllGamesCompleteAndValid(incompleteGames)).toBe(false);
        });
    });

    // -------------------------------------------------------------
    // 11. FASE 8b: Provisional Status Rules & PDF Marking Logic
    // -------------------------------------------------------------
    describe('11. FASE 8b: Provisional Status Rules & PDF Marking Logic', () => {
        const mockGame = (id: string, groupId: 'A' | 'B', isLocked: boolean, complete: boolean = true): GameData => ({
            id,
            groupId,
            teamAId: 't1',
            teamBId: 't2',
            teamAName: 'Team 1',
            teamBName: 'Team 2',
            runsA: complete ? 5 : null,
            runsB: complete ? 3 : null,
            inningsABatting: complete ? '7' : '',
            inningsADefense: complete ? '7' : '',
            inningsBBatting: complete ? '7' : '',
            inningsBDefense: complete ? '7' : '',
            isLocked,
            earnedRunsA: null,
            earnedRunsB: null,
        });

        it('isGroupProvisional returns false when 0 games are locked', () => {
            const games = [
                mockGame('g1', 'A', false),
                mockGame('g2', 'A', false),
            ];
            expect(isGroupProvisional(games)).toBe(false);
        });

        it('isGroupProvisional returns false when ALL games are locked', () => {
            const games = [
                mockGame('g1', 'A', true),
                mockGame('g2', 'A', true),
            ];
            expect(isGroupProvisional(games)).toBe(false);
        });

        it('isGroupProvisional returns true when group has mixed locked and unlocked games', () => {
            const games = [
                mockGame('g1', 'A', true),
                mockGame('g2', 'A', false),
            ];
            expect(isGroupProvisional(games)).toBe(true);
        });

        it('isTournamentProvisional checks groups independently in multi-group mode', () => {
            const gamesGroupAProvisional = [
                mockGame('g1', 'A', true),
                mockGame('g2', 'A', false), // group A is provisional
                mockGame('g3', 'B', true),
                mockGame('g4', 'B', true),  // group B is NOT provisional
            ];
            expect(isTournamentProvisional(gamesGroupAProvisional, true)).toBe(true);

            const gamesNeitherProvisional = [
                mockGame('g1', 'A', true),
                mockGame('g2', 'A', true),
                mockGame('g3', 'B', false),
                mockGame('g4', 'B', false),
            ];
            expect(isTournamentProvisional(gamesNeitherProvisional, true)).toBe(false);
        });

        it('getProvisionalGames returns unlocked games for a group', () => {
            const games = [
                mockGame('g1', 'A', true),
                mockGame('g2', 'A', false),
            ];
            const prov = getProvisionalGames(games, 'A');
            expect(prov.map(g => g.id)).toEqual(['g2']);
        });

        it('getProvisionalGameIds returns empty set when isProvisionalDoc is false', () => {
            const games = [
                mockGame('g1', 'A', true),
                mockGame('g2', 'A', false),
            ];
            expect(getProvisionalGameIds(games, false).size).toBe(0);
        });

        it('getProvisionalGameIds returns unlocked game IDs when group has locked games and isProvisionalDoc is true', () => {
            const games = [
                mockGame('g1', 'A', true),
                mockGame('g2', 'A', false),
            ];
            const ids = getProvisionalGameIds(games, true);
            expect(ids.has('g2')).toBe(true);
            expect(ids.has('g1')).toBe(false);
        });

        it('getProvisionalGameIds marks all scored games when user forces provisional on a tournament with 0 locked games', () => {
            const games = [
                mockGame('g1', 'A', false, true),
                mockGame('g2', 'A', false, true),
                mockGame('g3', 'A', false, false),
            ];
            const ids = getProvisionalGameIds(games, true);
            expect(ids.has('g1')).toBe(true);
            expect(ids.has('g2')).toBe(true);
            expect(ids.has('g3')).toBe(false);
        });
    });


    // Helper function for building valid mock games in FASE 9b/9c tests
    const createMockGame = (id: string, groupId: 'A' | 'B', isLocked: boolean, runsA = 5, runsB = 2, innA = '7', innADef = '7', innB = '7', innBDef = '7'): GameData => ({
        id,
        groupId,
        teamAId: 't1',
        teamBId: 't2',
        teamAName: 'Team 1',
        teamBName: 'Team 2',
        runsA,
        runsB,
        inningsABatting: innA,
        inningsADefense: innADef,
        inningsBBatting: innB,
        inningsBDefense: innBDef,
        isLocked,
        earnedRunsA: 0,
        earnedRunsB: 0,
    });

    // -------------------------------------------------------------
    // 12. FASE 9b: In-Play Calculation Rules & Validation
    // -------------------------------------------------------------
    describe('12. FASE 9b: In-Play Calculation Rules & Validation', () => {
        const mockValidGame = createMockGame;

        it('verifies MAX_UNFIXED_GAMES_PER_GROUP constant is exported and equals 1', () => {
            expect(MAX_UNFIXED_GAMES_PER_GROUP).toBe(1);
        });

        it('allows 0 unfixed games (all locked) as valid for calculation', () => {
            const games = [
                mockValidGame('g1', 'A', true),
                mockValidGame('g2', 'A', true),
            ];
            expect(isGroupValidForCalculation(games)).toBe(true);
            expect(areAllGroupsValidForCalculation(games, false)).toBe(true);
        });

        it('allows exactly 1 unfixed game per group as valid for calculation', () => {
            const games = [
                mockValidGame('g1', 'A', true),
                mockValidGame('g2', 'A', false), // 1 unfixed game
            ];
            expect(isGroupValidForCalculation(games)).toBe(true);
            expect(areAllGroupsValidForCalculation(games, false)).toBe(true);
        });

        it('blocks calculation when group has 2 or more unfixed games (> MAX_UNFIXED_GAMES_PER_GROUP)', () => {
            const games = [
                mockValidGame('g1', 'A', true),
                mockValidGame('g2', 'A', false), // unfixed 1
                mockValidGame('g3', 'A', false), // unfixed 2
            ];
            expect(isGroupValidForCalculation(games)).toBe(false);
            expect(areAllGroupsValidForCalculation(games, false)).toBe(false);
        });

        it('evaluates multi-group validity independently (both groups must have <= 1 unfixed game)', () => {
            // Group A: 1 unfixed (valid) | Group B: 2 unfixed (invalid)
            const games = [
                mockValidGame('ga1', 'A', true),
                mockValidGame('ga2', 'A', false),
                mockValidGame('gb1', 'B', true),
                mockValidGame('gb2', 'B', false),
                mockValidGame('gb3', 'B', false),
            ];

            expect(isGroupValidForCalculation(games.filter(g => g.groupId === 'A'))).toBe(true);
            expect(isGroupValidForCalculation(games.filter(g => g.groupId === 'B'))).toBe(false);
            expect(areAllGroupsValidForCalculation(games, true)).toBe(false);
        });

        it('scenario (i): 5/5/5/5 with home winning 4-0 calculates correctly as an in-play game', () => {
            // Home team B winning 4-0, both teams 5 innings at bat (5.0 = 15 outs).
            // Under strict final rules, winning home team must have fewer innings at bat.
            // But as an in-play game (!isLocked), it passes basic integrity and calculates TQB accurately.
            const inPlayGame = mockValidGame('g1', 'A', false, 0, 4, '5', '5', '5', '5');

            expect(isGameIntegrityValid(inPlayGame)).toBe(true);
            expect(isGameFinalAndValid(inPlayGame)).toBe(false); // Fails strict final rule

            const teams = [{ id: 't1', name: 'Team 1' }, { id: 't2', name: 'Team 2' }];
            const rankings = calculateRankings(teams, [inPlayGame], false);

            expect(rankings.rankings[0].id).toBe('t2'); // Team 2 (Home) won
            expect(rankings.rankings[0].tqb).toBeCloseTo((4 / 5) - (0 / 5), 4); // +0.8000
        });

        it('scenario (ii): mid-inning partial (visitor 5 at-bat / 4 defense, home 4 at-bat / 5 defense)', () => {
            // Visitor (t1) scored 2, Home (t2) scored 0. Visitor 5.0 inn at bat (15 outs), Home 4.0 inn at bat (12 outs).
            const inPlayGame = mockValidGame('g1', 'A', false, 2, 0, '5', '4', '4', '5');

            expect(isGameIntegrityValid(inPlayGame)).toBe(true);

            const teams = [{ id: 't1', name: 'Team 1' }, { id: 't2', name: 'Team 2' }];
            const result = calculateRankings(teams, [inPlayGame], false);

            const statsT1 = result.rankings.find(r => r.id === 't1')!;
            const statsT2 = result.rankings.find(r => r.id === 't2')!;

            // T1: 2 runs / 5 inn at-bat (0.4) - 0 runs / 4 inn def (0.0) = +0.4000
            expect(statsT1.tqb).toBeCloseTo(0.4, 4);
            // T2: 0 runs / 4 inn at-bat (0.0) - 2 runs / 5 inn def (0.4) = -0.4000
            expect(statsT2.tqb).toBeCloseTo(-0.4, 4);
        });

        it('scenario (iii): tie in mid-5th inning (2-2) does not grant win or loss to either team', () => {
            const inPlayTie = mockValidGame('g1', 'A', false, 2, 2, '5', '5', '5', '5');

            expect(isGameIntegrityValid(inPlayTie)).toBe(true);

            const teams = [{ id: 't1', name: 'Team 1' }, { id: 't2', name: 'Team 2' }];
            const result = calculateRankings(teams, [inPlayTie], false);

            expect(result.rankings[0].wins).toBe(0);
            expect(result.rankings[0].losses).toBe(0);
            expect(result.rankings[1].wins).toBe(0);
            expect(result.rankings[1].losses).toBe(0);
        });

        it('prevents locking a game if it fails strict final game rules', () => {
            // Home winning with equal innings (5/5)
            const invalidFinalGame = mockValidGame('g1', 'A', false, 0, 4, '5', '5', '5', '5');
            expect(isGameFinalAndValid(invalidFinalGame)).toBe(false);

            // Cannot be locked when invalid
            const lockedAttempt: GameData = { ...invalidFinalGame, isLocked: true };
            expect(isGameFinalAndValid(lockedAttempt)).toBe(false);
        });
    });

    // -------------------------------------------------------------
    // 13. FASE 9c — "En Juego" Badge Condition (4 States)
    // -------------------------------------------------------------
    describe('13. FASE 9c — In-Play Badge Rules', () => {
        const mockValidGame = createMockGame;

        it('State 1 (New load / 0 locked, 3 unfixed): should NOT show badge on any game', () => {
            const groupGames = [
                mockValidGame('g1', 'A', false),
                mockValidGame('g2', 'A', false),
                mockValidGame('g3', 'A', false),
            ];
            expect(shouldShowInPlayBadge(groupGames, 'g1')).toBe(false);
            expect(shouldShowInPlayBadge(groupGames, 'g2')).toBe(false);
            expect(shouldShowInPlayBadge(groupGames, 'g3')).toBe(false);
        });

        it('State 2 (2 or more unfixed / 1 locked, 2 unfixed): should NOT show badge on any game', () => {
            const groupGames = [
                mockValidGame('g1', 'A', true),
                mockValidGame('g2', 'A', false),
                mockValidGame('g3', 'A', false),
            ];
            expect(shouldShowInPlayBadge(groupGames, 'g1')).toBe(false); // Locked game -> false
            expect(shouldShowInPlayBadge(groupGames, 'g2')).toBe(false); // 2 unfixed -> false
            expect(shouldShowInPlayBadge(groupGames, 'g3')).toBe(false);
        });

        it('State 3 (Exactly 1 unfixed and at least 1 locked / 2 locked, 1 unfixed): SHOULD show badge on the single unfixed game', () => {
            const groupGames = [
                mockValidGame('g1', 'A', true),
                mockValidGame('g2', 'A', true),
                mockValidGame('g3', 'A', false), // 1 unfixed game
            ];
            expect(shouldShowInPlayBadge(groupGames, 'g1')).toBe(false); // Locked -> false
            expect(shouldShowInPlayBadge(groupGames, 'g2')).toBe(false); // Locked -> false
            expect(shouldShowInPlayBadge(groupGames, 'g3')).toBe(true);  // Single unfixed + 2 locked -> TRUE
        });

        it('State 4 (All locked / 3 locked, 0 unfixed): should NOT show badge on any game', () => {
            const groupGames = [
                mockValidGame('g1', 'A', true),
                mockValidGame('g2', 'A', true),
                mockValidGame('g3', 'A', true),
            ];
            expect(shouldShowInPlayBadge(groupGames, 'g1')).toBe(false);
            expect(shouldShowInPlayBadge(groupGames, 'g2')).toBe(false);
            expect(shouldShowInPlayBadge(groupGames, 'g3')).toBe(false);
        });
    });
});







