// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTQBState } from '@/hooks/useTQBState';
import { Team, GameData, GroupID } from '@/lib/types';
import { saveState } from '@/lib/storage';

// Helper functions for creating test data
function createMockTeams(count: number, groupId: GroupID = 'A'): Team[] {
    return Array.from({ length: count }, (_, i) => ({
        id: `t-${groupId.toLowerCase()}-${i + 1}`,
        name: `Team ${groupId} ${i + 1}`,
        groupId,
    }));
}

function createCircleTieGames(teams: Team[], groupId: GroupID = 'A'): GameData[] {
    // 3 teams: T1 beats T2 (5-2), T2 beats T3 (5-2), T3 beats T1 (5-2)
    // Results in circle tie where TQB = 0.0000 for all teams -> needsERTQB = true
    const [t1, t2, t3] = teams;
    return [
        {
            id: `g-${groupId.toLowerCase()}-1`,
            groupId,
            teamAId: t1.id, teamBId: t2.id, teamAName: t1.name, teamBName: t2.name,
            runsA: 5, runsB: 2,
            inningsABatting: '7', inningsADefense: '7',
            inningsBBatting: '7', inningsBDefense: '7',
            earnedRunsA: 4, earnedRunsB: 1,
        },
        {
            id: `g-${groupId.toLowerCase()}-2`,
            groupId,
            teamAId: t2.id, teamBId: t3.id, teamAName: t2.name, teamBName: t3.name,
            runsA: 5, runsB: 2,
            inningsABatting: '7', inningsADefense: '7',
            inningsBBatting: '7', inningsBDefense: '7',
            earnedRunsA: 4, earnedRunsB: 1,
        },
        {
            id: `g-${groupId.toLowerCase()}-3`,
            groupId,
            teamAId: t3.id, teamBId: t1.id, teamAName: t3.name, teamBName: t1.name,
            runsA: 5, runsB: 2,
            inningsABatting: '7', inningsADefense: '7',
            inningsBBatting: '7', inningsBDefense: '7',
            earnedRunsA: 4, earnedRunsB: 1,
        },
    ];
}

function createClearWinnerGames(teams: Team[], groupId: GroupID = 'A'): GameData[] {
    // T1 (2-0), T2 (1-1), T3 (0-2) -> Clean WIN_LOSS resolution
    const [t1, t2, t3] = teams;
    return [
        {
            id: `g-${groupId.toLowerCase()}-1`,
            groupId,
            teamAId: t1.id, teamBId: t2.id, teamAName: t1.name, teamBName: t2.name,
            runsA: 10, runsB: 0,
            inningsABatting: '7', inningsADefense: '7',
            inningsBBatting: '7', inningsBDefense: '7',
            earnedRunsA: 8, earnedRunsB: 0,
        },
        {
            id: `g-${groupId.toLowerCase()}-2`,
            groupId,
            teamAId: t1.id, teamBId: t3.id, teamAName: t1.name, teamBName: t3.name,
            runsA: 10, runsB: 0,
            inningsABatting: '7', inningsADefense: '7',
            inningsBBatting: '7', inningsBDefense: '7',
            earnedRunsA: 8, earnedRunsB: 0,
        },
        {
            id: `g-${groupId.toLowerCase()}-3`,
            groupId,
            teamAId: t2.id, teamBId: t3.id, teamAName: t2.name, teamBName: t3.name,
            runsA: 5, runsB: 1,
            inningsABatting: '7', inningsADefense: '7',
            inningsBBatting: '7', inningsBDefense: '7',
            earnedRunsA: 4, earnedRunsB: 1,
        },
    ];
}

describe('Unit Tests: useTQBState Hook (State Management & Multi-Group Consistency)', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    // -------------------------------------------------------------
    // 1. Initial State & Navigation
    // -------------------------------------------------------------
    describe('1. Initial State & Screen Navigation', () => {
        it('initializes with screen 0, 3 default blank teams in Group A, and empty games/rankings', () => {
            const { result } = renderHook(() => useTQBState());

            expect(result.current.state.currentScreen).toBe(0);
            expect(result.current.state.teams).toHaveLength(3);
            expect(result.current.state.teams.every(t => t.groupId === 'A')).toBe(true);
            expect(result.current.state.teams.every(t => t.name === '')).toBe(true);
            expect(result.current.state.games).toHaveLength(0);
            expect(result.current.state.rankings).toHaveLength(0);
            expect(result.current.state.isMultiGroup).toBe(false);
            expect(result.current.state.activeGroupId).toBe('A');
        });

        it('navigates screens correctly via setCurrentScreen', () => {
            const { result } = renderHook(() => useTQBState());

            act(() => {
                result.current.actions.setCurrentScreen(2);
            });
            expect(result.current.state.currentScreen).toBe(2);

            act(() => {
                result.current.actions.setCurrentScreen(3);
            });
            expect(result.current.state.currentScreen).toBe(3);
        });

        it('navigates backwards correctly using handleBack()', () => {
            const { result } = renderHook(() => useTQBState());

            // Navigate to screen 2, then back to 1
            act(() => { result.current.actions.setCurrentScreen(2); });
            act(() => { result.current.actions.handleBack(); });
            expect(result.current.state.currentScreen).toBe(1);

            // Navigate to screen 3, then back to 2
            act(() => { result.current.actions.setCurrentScreen(3); });
            act(() => { result.current.actions.handleBack(); });
            expect(result.current.state.currentScreen).toBe(2);

            // Navigate to screen 4, then back to 3
            act(() => { result.current.actions.setCurrentScreen(4); });
            act(() => { result.current.actions.handleBack(); });
            expect(result.current.state.currentScreen).toBe(3);

            // Navigate to screen 5, then back to 4
            act(() => { result.current.actions.setCurrentScreen(5); });
            act(() => { result.current.actions.handleBack(); });
            expect(result.current.state.currentScreen).toBe(4);
        });
    });

    // -------------------------------------------------------------
    // 2. Active Group Behavior & Tab Retention
    // -------------------------------------------------------------
    describe('2. Active Group & Multi-Group Tab Retention', () => {
        it('preserves activeGroupId when navigating between screens', () => {
            const { result } = renderHook(() => useTQBState());

            act(() => {
                result.current.actions.setIsMultiGroup(true);
                result.current.actions.setActiveGroupId('B');
            });
            expect(result.current.state.activeGroupId).toBe('B');

            act(() => {
                result.current.actions.setCurrentScreen(2);
            });
            expect(result.current.state.activeGroupId).toBe('B');

            act(() => {
                result.current.actions.setCurrentScreen(3);
            });
            expect(result.current.state.activeGroupId).toBe('B');
        });

        it('resets activeGroupId to "A" when disabling multi-group mode', () => {
            const { result } = renderHook(() => useTQBState());

            act(() => {
                result.current.actions.setIsMultiGroup(true);
                result.current.actions.setActiveGroupId('B');
            });
            expect(result.current.state.activeGroupId).toBe('B');

            act(() => {
                result.current.actions.setIsMultiGroup(false);
            });
            expect(result.current.state.activeGroupId).toBe('A');
            expect(result.current.state.isMultiGroup).toBe(false);
        });

        it('resets activeGroupId to "A" on handleStartNew()', () => {
            const { result } = renderHook(() => useTQBState());

            act(() => {
                result.current.actions.setIsMultiGroup(true);
                result.current.actions.setActiveGroupId('B');
                result.current.actions.handleStartNew();
            });

            expect(result.current.state.activeGroupId).toBe('A');
            expect(result.current.state.isMultiGroup).toBe(false);
            expect(result.current.state.currentScreen).toBe(1);
        });
    });

    // -------------------------------------------------------------
    // 3. Multi-Group Calculation Handlers (TQB & ER-TQB)
    // -------------------------------------------------------------
    describe('3. Multi-Group Calculation Handlers (TQB & ER-TQB)', () => {
        it('populates groupTieBreakMethod map per group and sets global tieBreakMethod to common method when both groups match', () => {
            const { result } = renderHook(() => useTQBState());

            const teamsA = createMockTeams(3, 'A');
            const teamsB = createMockTeams(3, 'B');
            const gamesA = createClearWinnerGames(teamsA, 'A'); // WIN_LOSS
            const gamesB = createClearWinnerGames(teamsB, 'B'); // WIN_LOSS

            act(() => {
                result.current.actions.setIsMultiGroup(true);
                result.current.actions.setTeams([...teamsA, ...teamsB]);
                result.current.actions.setGames([...gamesA, ...gamesB]);
            });

            act(() => {
                result.current.actions.handleCalculateTQB();
            });

            expect(result.current.state.groupTieBreakMethod.A).toBe('WIN_LOSS');
            expect(result.current.state.groupTieBreakMethod.B).toBe('WIN_LOSS');
            expect(result.current.state.tieBreakMethod).toBe('WIN_LOSS');
            expect(result.current.state.needsERTQB).toBe(false);
            expect(result.current.state.currentScreen).toBe(3);
        });

        it('sets global tieBreakMethod to UNRESOLVED when groups differ in tie-break method', () => {
            const { result } = renderHook(() => useTQBState());

            const teamsA = createMockTeams(3, 'A');
            const teamsB = createMockTeams(3, 'B');
            const gamesA = createClearWinnerGames(teamsA, 'A'); // WIN_LOSS
            const gamesB = createCircleTieGames(teamsB, 'B');    // TQB (needs ER-TQB)

            act(() => {
                result.current.actions.setIsMultiGroup(true);
                result.current.actions.setTeams([...teamsA, ...teamsB]);
                result.current.actions.setGames([...gamesA, ...gamesB]);
            });

            act(() => {
                result.current.actions.handleCalculateTQB();
            });

            expect(result.current.state.groupTieBreakMethod.A).toBe('WIN_LOSS');
            expect(result.current.state.groupTieBreakMethod.B).toBe('TQB');
            expect(result.current.state.tieBreakMethod).toBe('UNRESOLVED');
            expect(result.current.state.needsERTQB).toBe(true); // Group B needs ER-TQB
        });

        it('sets needsERTQB to true if ANY group needs ER-TQB in multi-group mode', () => {
            const { result } = renderHook(() => useTQBState());

            const teamsA = createMockTeams(3, 'A');
            const teamsB = createMockTeams(3, 'B');
            const gamesA = createCircleTieGames(teamsA, 'A');   // needs ER-TQB
            const gamesB = createClearWinnerGames(teamsB, 'B'); // clear winner

            act(() => {
                result.current.actions.setIsMultiGroup(true);
                result.current.actions.setTeams([...teamsA, ...teamsB]);
                result.current.actions.setGames([...gamesA, ...gamesB]);
            });

            act(() => {
                result.current.actions.handleCalculateTQB();
            });

            expect(result.current.state.needsERTQB).toBe(true);
        });

        it('sets hasUnresolvedTies to true in handleCalculateERTQB if ANY group retains unresolved ties', () => {
            const { result } = renderHook(() => useTQBState());

            const teamsA = createMockTeams(3, 'A');
            const teamsB = createMockTeams(3, 'B');

            // Create games where ER-TQB for Group A still leaves unresolved ties (identical ER stats)
            const gamesA = createCircleTieGames(teamsA, 'A');
            const gamesB = createClearWinnerGames(teamsB, 'B');

            act(() => {
                result.current.actions.setIsMultiGroup(true);
                result.current.actions.setTeams([...teamsA, ...teamsB]);
                result.current.actions.setGames([...gamesA, ...gamesB]);
            });

            act(() => {
                result.current.actions.handleCalculateERTQB();
            });

            expect(result.current.state.groupTieBreakMethod.A).toBe('UNRESOLVED');
            expect(result.current.state.groupTieBreakMethod.B).toBe('WIN_LOSS');
            expect(result.current.state.hasUnresolvedTies).toBe(true);
            expect(result.current.state.currentScreen).toBe(5);
        });
    });

    // -------------------------------------------------------------
    // 4. Single-Group Calculation Handlers
    // -------------------------------------------------------------
    describe('4. Single-Group Calculation Handlers', () => {
        it('sets global tieBreakMethod directly to single group result without change from legacy behavior', () => {
            const { result } = renderHook(() => useTQBState());

            const teams = createMockTeams(3, 'A');
            const games = createClearWinnerGames(teams, 'A');

            act(() => {
                result.current.actions.setIsMultiGroup(false);
                result.current.actions.setTeams(teams);
                result.current.actions.setGames(games);
            });

            act(() => {
                result.current.actions.handleCalculateTQB();
            });

            expect(result.current.state.tieBreakMethod).toBe('WIN_LOSS');
            expect(result.current.state.groupTieBreakMethod).toEqual({ A: 'WIN_LOSS' });
            expect(result.current.state.needsERTQB).toBe(false);
            expect(result.current.state.currentScreen).toBe(3);
        });
    });

    // -------------------------------------------------------------
    // 5. Auto-Save & Non-Persistence of activeGroupId
    // -------------------------------------------------------------
    describe('5. Auto-Save & Non-Persistence of activeGroupId', () => {
        it('saves state when screen != 0 and teams have names, but does NOT persist activeGroupId', () => {
            const { result } = renderHook(() => useTQBState());

            const teams = [
                { id: 't1', name: 'Alpha', groupId: 'A' as GroupID },
                { id: 't2', name: 'Beta', groupId: 'A' as GroupID },
                { id: 't3', name: 'Gamma', groupId: 'A' as GroupID },
            ];

            act(() => {
                result.current.actions.setTeams(teams);
                result.current.actions.setIsMultiGroup(true);
                result.current.actions.setActiveGroupId('B');
            });
            act(() => {
                result.current.actions.setCurrentScreen(1);
            });

            const savedRaw = localStorage.getItem('tqb_tournament_state');
            expect(savedRaw).not.toBeNull();
            if (savedRaw) {
                const parsed = JSON.parse(savedRaw);
                expect(parsed.currentScreen).toBe(1);
                expect(parsed.teams).toHaveLength(3);
                expect(parsed.isMultiGroup).toBe(true);
                // CRITICAL REQUIREMENT: activeGroupId must NOT be persisted in storage
                expect(parsed.activeGroupId).toBeUndefined();
            }
        });
    });

    // -------------------------------------------------------------
    // 6. Continue Tournament & Legacy State Restoration
    // -------------------------------------------------------------
    describe('6. Continue Tournament & Legacy State Migration', () => {
        it('restores saved state and migrates legacy teams/games without groupId smoothly', () => {
            const legacyState = {
                currentScreen: 2,
                teams: [
                    { id: 't1', name: 'Legacy Team 1' },
                    { id: 't2', name: 'Legacy Team 2' },
                    { id: 't3', name: 'Legacy Team 3' },
                ],
                games: [
                    {
                        id: 'g1',
                        teamAId: 't1', teamBId: 't2', teamAName: 'Legacy Team 1', teamBName: 'Legacy Team 2',
                        runsA: 5, runsB: 2,
                        inningsABatting: '7', inningsADefense: '7',
                        inningsBBatting: '7', inningsBDefense: '7',
                        earnedRunsA: 4, earnedRunsB: 1,
                    },
                ],
                rankings: [],
                tieBreakMethod: 'WIN_LOSS',
                needsERTQB: false,
                hasUnresolvedTies: false,
            };

            saveState(legacyState as unknown as Parameters<typeof saveState>[0]);

            const { result } = renderHook(() => useTQBState());

            expect(result.current.state.teams).toHaveLength(3);
            expect(result.current.state.teams[0].groupId).toBe('A');
            expect(result.current.state.games[0].groupId).toBe('A');
            expect(result.current.state.isMultiGroup).toBe(false);
            expect(result.current.state.activeGroupId).toBe('A');
        });
    });

    // -------------------------------------------------------------
    // 7. Reset Data (handleStartNew)
    // -------------------------------------------------------------
    describe('7. Data Reset (handleStartNew)', () => {
        it('clears state, storage, and resets hook state to clean default values', () => {
            const { result } = renderHook(() => useTQBState());

            act(() => {
                result.current.actions.setIsMultiGroup(true);
                result.current.actions.setActiveGroupId('B');
                result.current.actions.setTeams(createMockTeams(4, 'B'));
                result.current.actions.setCurrentScreen(2);
            });

            act(() => {
                result.current.actions.handleStartNew();
            });

            expect(result.current.state.currentScreen).toBe(1);
            expect(result.current.state.teams).toHaveLength(3);
            expect(result.current.state.teams.every(t => t.name === '')).toBe(true);
            expect(result.current.state.games).toHaveLength(0);
            expect(result.current.state.rankings).toHaveLength(0);
            expect(result.current.state.tieBreakMethod).toBe('WIN_LOSS');
            expect(result.current.state.needsERTQB).toBe(false);
            expect(result.current.state.hasUnresolvedTies).toBe(false);
            expect(result.current.state.isMultiGroup).toBe(false);
            expect(result.current.state.activeGroupId).toBe('A');
            expect(result.current.state.groupTieBreakMethod).toEqual({});
        });
    });

    // -------------------------------------------------------------
    // PARTE C: CSV Import Behavior over Group with Existing Teams
    // -------------------------------------------------------------
    // -------------------------------------------------------------
    // FASE 4d: Centralized Resets & Group Import Actions in Hook
    // -------------------------------------------------------------
    describe('FASE 4d: Centralized Resets & Group Import Actions in Hook', () => {
        // PARTE A: VOLVER AL INICIO
        describe('PARTE A: handleGoToLanding()', () => {
            it('resets screen to 0 and activeGroupId to "A" from Group B', () => {
                const { result } = renderHook(() => useTQBState());

                act(() => {
                    result.current.actions.setIsMultiGroup(true);
                    result.current.actions.setActiveGroupId('B');
                    result.current.actions.setCurrentScreen(2);
                });
                expect(result.current.state.activeGroupId).toBe('B');
                expect(result.current.state.currentScreen).toBe(2);

                act(() => {
                    result.current.actions.handleGoToLanding();
                });

                expect(result.current.state.currentScreen).toBe(0);
                expect(result.current.state.activeGroupId).toBe('A');
            });

            it('preserves existing tournament data (teams & games) in state when returning to landing', () => {
                const { result } = renderHook(() => useTQBState());

                const teamsA = createMockTeams(3, 'A');
                const gamesA = createClearWinnerGames(teamsA, 'A');

                act(() => {
                    result.current.actions.setTeams(teamsA);
                    result.current.actions.setGames(gamesA);
                    result.current.actions.setCurrentScreen(2);
                });

                act(() => {
                    result.current.actions.handleGoToLanding();
                });

                // Returning to landing does NOT wipe state data
                expect(result.current.state.teams).toHaveLength(3);
                expect(result.current.state.games).toHaveLength(3);
            });
        });

        // PARTE B: IMPORTACIÓN POR GRUPO EN EL HOOK
        describe('PARTE B: handleGroupImport action in hook', () => {
            it('importing into Group B does not alter teams or games of Group A', () => {
                const { result } = renderHook(() => useTQBState());

                const groupATeams = createMockTeams(3, 'A');
                const groupAGames = createClearWinnerGames(groupATeams, 'A');

                act(() => {
                    result.current.actions.setIsMultiGroup(true);
                    result.current.actions.setTeams(groupATeams);
                    result.current.actions.setGames(groupAGames);
                });

                const newGroupBTeams: Team[] = [
                    { id: 'b-1', name: 'Team B1', groupId: 'B' },
                    { id: 'b-2', name: 'Team B2', groupId: 'B' },
                    { id: 'b-3', name: 'Team B3', groupId: 'B' },
                ];
                const newGroupBGames = createClearWinnerGames(newGroupBTeams, 'B');

                act(() => {
                    result.current.actions.handleGroupImport(newGroupBTeams, newGroupBGames, 'B');
                });

                const teamsA = result.current.state.teams.filter(t => t.groupId === 'A');
                const gamesA = result.current.state.games.filter(g => g.groupId === 'A');

                expect(teamsA).toHaveLength(3);
                expect(teamsA.map(t => t.name)).toEqual(groupATeams.map(t => t.name));
                expect(gamesA).toHaveLength(3);
            });

            it('importing into Group A does not alter teams or games of Group B', () => {
                const { result } = renderHook(() => useTQBState());

                const groupBTeams = createMockTeams(3, 'B');
                const groupBGames = createClearWinnerGames(groupBTeams, 'B');

                act(() => {
                    result.current.actions.setIsMultiGroup(true);
                    result.current.actions.setTeams(groupBTeams);
                    result.current.actions.setGames(groupBGames);
                });

                const newGroupATeams: Team[] = [
                    { id: 'a-1', name: 'Team A1', groupId: 'A' },
                    { id: 'a-2', name: 'Team A2', groupId: 'A' },
                    { id: 'a-3', name: 'Team A3', groupId: 'A' },
                ];
                const newGroupAGames = createClearWinnerGames(newGroupATeams, 'A');

                act(() => {
                    result.current.actions.handleGroupImport(newGroupATeams, newGroupAGames, 'A');
                });

                const teamsB = result.current.state.teams.filter(t => t.groupId === 'B');
                const gamesB = result.current.state.games.filter(g => g.groupId === 'B');

                expect(teamsB).toHaveLength(3);
                expect(teamsB.map(t => t.name)).toEqual(groupBTeams.map(t => t.name));
                expect(gamesB).toHaveLength(3);
            });

            it('after replacement, all games of the imported group reference only teams from that group (no orphan games)', () => {
                const { result } = renderHook(() => useTQBState());

                const groupATeams = createMockTeams(3, 'A');
                const groupAGames = createClearWinnerGames(groupATeams, 'A');

                act(() => {
                    result.current.actions.setIsMultiGroup(true);
                    result.current.actions.setTeams(groupATeams);
                    result.current.actions.setGames(groupAGames);
                });

                const newGroupATeams: Team[] = [
                    { id: 'new-a1', name: 'New Alpha 1', groupId: 'A' },
                    { id: 'new-a2', name: 'New Alpha 2', groupId: 'A' },
                    { id: 'new-a3', name: 'New Alpha 3', groupId: 'A' },
                ];
                const newGroupAGames = createClearWinnerGames(newGroupATeams, 'A');

                act(() => {
                    result.current.actions.handleGroupImport(newGroupATeams, newGroupAGames, 'A');
                });

                const validTeamIds = new Set(result.current.state.teams.map(t => t.id));
                const groupAGamesInState = result.current.state.games.filter(g => g.groupId === 'A');

                for (const game of groupAGamesInState) {
                    expect(validTeamIds.has(game.teamAId)).toBe(true);
                    expect(validTeamIds.has(game.teamBId)).toBe(true);
                }
            });

            it('replacement discards previous games of the target group', () => {
                const { result } = renderHook(() => useTQBState());

                const groupATeams = createMockTeams(3, 'A');
                const groupAGames = createClearWinnerGames(groupATeams, 'A');

                act(() => {
                    result.current.actions.setIsMultiGroup(true);
                    result.current.actions.setTeams(groupATeams);
                    result.current.actions.setGames(groupAGames);
                });

                const oldGameIds = groupAGames.map(g => g.id);

                const newGroupATeams: Team[] = [
                    { id: 'new-a1', name: 'New Alpha 1', groupId: 'A' },
                    { id: 'new-a2', name: 'New Alpha 2', groupId: 'A' },
                    { id: 'new-a3', name: 'New Alpha 3', groupId: 'A' },
                ];
                const newGroupAGames = createClearWinnerGames(newGroupATeams, 'A').map(g => ({
                    ...g,
                    id: `new-${g.id}`,
                }));

                act(() => {
                    result.current.actions.handleGroupImport(newGroupATeams, newGroupAGames, 'A');
                });

                const currentGroupAGameIds = result.current.state.games
                    .filter(g => g.groupId === 'A')
                    .map(g => g.id);

                for (const oldId of oldGameIds) {
                    expect(currentGroupAGameIds).not.toContain(oldId);
                }
                expect(currentGroupAGameIds).toHaveLength(3);
            });
        });

        // PARTE C: PROTEGER handleCSVImport EN MULTI-GRUPO
        describe('PARTE C: Protected handleCSVImport in multi-group mode', () => {
            it('with multi-group active, invoking handleCSVImport for a group leaves the other group intact and does NOT change screen', () => {
                const { result } = renderHook(() => useTQBState());

                const groupATeams = createMockTeams(3, 'A');
                const groupBTeams = createMockTeams(3, 'B');
                const groupAGames = createClearWinnerGames(groupATeams, 'A');
                const groupBGames = createClearWinnerGames(groupBTeams, 'B');

                act(() => {
                    result.current.actions.setIsMultiGroup(true);
                    result.current.actions.setTeams([...groupATeams, ...groupBTeams]);
                    result.current.actions.setGames([...groupAGames, ...groupBGames]);
                    result.current.actions.setCurrentScreen(1);
                });

                const importedTeamsForA: Team[] = [
                    { id: 'imp-a1', name: 'Imported A1', groupId: 'A' },
                    { id: 'imp-a2', name: 'Imported A2', groupId: 'A' },
                    { id: 'imp-a3', name: 'Imported A3', groupId: 'A' },
                ];
                const importedGamesForA = createClearWinnerGames(importedTeamsForA, 'A');

                act(() => {
                    result.current.actions.handleCSVImport(importedTeamsForA, importedGamesForA, 'A');
                });

                // Group B teams & games remain completely intact
                const teamsB = result.current.state.teams.filter(t => t.groupId === 'B');
                const gamesB = result.current.state.games.filter(g => g.groupId === 'B');
                expect(teamsB).toHaveLength(3);
                expect(gamesB).toHaveLength(3);

                // Screen remains at 1 (does NOT advance to 2)
                expect(result.current.state.currentScreen).toBe(1);
            });

            it('in single-group mode, handleCSVImport replaces all state and advances to screen 2', () => {
                const { result } = renderHook(() => useTQBState());

                const existingTeams = createMockTeams(3, 'A');
                act(() => {
                    result.current.actions.setTeams(existingTeams);
                    result.current.actions.setCurrentScreen(1);
                });

                const csvTeams: Team[] = [
                    { id: 'csv-1', name: 'CSV Alpha', groupId: 'A' },
                    { id: 'csv-2', name: 'CSV Beta', groupId: 'A' },
                    { id: 'csv-3', name: 'CSV Gamma', groupId: 'A' },
                    { id: 'csv-4', name: 'CSV Delta', groupId: 'A' },
                ];
                const csvGames = createClearWinnerGames(csvTeams, 'A');

                act(() => {
                    result.current.actions.handleCSVImport(csvTeams, csvGames, 'A');
                });

                expect(result.current.state.teams).toHaveLength(4);
                expect(result.current.state.games).toHaveLength(3);
                expect(result.current.state.currentScreen).toBe(2);
            });
        });

        // Retained check from 4b
        describe('FASE 4b: Centralized Active Group Resets', () => {
            it('resets activeGroupId to "A" when handleContinueTournament() is invoked', () => {
                const { result } = renderHook(() => useTQBState());

                act(() => {
                    result.current.actions.setIsMultiGroup(true);
                    result.current.actions.setActiveGroupId('B');
                });
                expect(result.current.state.activeGroupId).toBe('B');

                act(() => {
                    result.current.actions.handleContinueTournament();
                });

                expect(result.current.state.activeGroupId).toBe('A');
                expect(result.current.state.currentScreen).toBe(1);
            });
        });
    });

    // -------------------------------------------------------------
    // FASE 5: Reordenamiento de partidos, localStorage y reinicio
    // -------------------------------------------------------------
    describe('FASE 5: Reordenamiento de partidos en useTQBState, localStorage y reinicio', () => {
        it('permite reordenar partidos a través de handleReorderGame', () => {
            const { result } = renderHook(() => useTQBState());

            const teams = createMockTeams(3, 'A');
            const games = createClearWinnerGames(teams, 'A');

            act(() => {
                result.current.actions.setTeams(teams);
                result.current.actions.setGames(games);
            });

            expect(result.current.state.games.map(g => g.id)).toEqual(['g-a-1', 'g-a-2', 'g-a-3']);

            act(() => {
                result.current.actions.handleReorderGame('g-a-2', 'up');
            });

            expect(result.current.state.games.map(g => g.id)).toEqual(['g-a-2', 'g-a-1', 'g-a-3']);
        });

        it('guarda y carga desde localStorage conservando el orden personalizado de partidos', () => {
            const { result } = renderHook(() => useTQBState());

            const teams = createMockTeams(3, 'A');
            const games = createClearWinnerGames(teams, 'A');

            act(() => {
                result.current.actions.setTeams(teams);
                result.current.actions.setGames(games);
                result.current.actions.setCurrentScreen(2);
            });

            // Reorder
            act(() => {
                result.current.actions.handleReorderGame('g-a-2', 'up');
            });

            // Verify auto-saved to localStorage
            const savedRaw = localStorage.getItem('tqb_tournament_state');
            expect(savedRaw).not.toBeNull();
            const parsed = JSON.parse(savedRaw!);
            expect(parsed.games.map((g: GameData) => g.id)).toEqual(['g-a-2', 'g-a-1', 'g-a-3']);

            // Re-render hook (simulating page reload)
            const { result: reloadResult } = renderHook(() => useTQBState());
            expect(reloadResult.current.state.games.map(g => g.id)).toEqual(['g-a-2', 'g-a-1', 'g-a-3']);
        });

        it('carga torneos guardados sin orden personalizado sin errores (compatibilidad hacia atrás)', () => {
            const legacySavedState = {
                currentScreen: 2,
                teams: createMockTeams(3, 'A'),
                games: createClearWinnerGames(createMockTeams(3, 'A'), 'A'),
                rankings: [],
                tieBreakMethod: 'WIN_LOSS',
                needsERTQB: false,
                hasUnresolvedTies: false,
                isMultiGroup: false,
            };

            saveState(legacySavedState as unknown as Parameters<typeof saveState>[0]);

            const { result } = renderHook(() => useTQBState());

            expect(result.current.state.games).toHaveLength(3);
            expect(result.current.state.games.map(g => g.id)).toEqual(['g-a-1', 'g-a-2', 'g-a-3']);
        });

        it('cuando los equipos NO cambian, handleContinueToGames conserva el orden manual existente (no regenera)', () => {
            const { result } = renderHook(() => useTQBState());

            const teams = [
                { id: 't1', name: 'Alpha', groupId: 'A' as GroupID },
                { id: 't2', name: 'Beta', groupId: 'A' as GroupID },
                { id: 't3', name: 'Gamma', groupId: 'A' as GroupID },
            ];

            act(() => {
                result.current.actions.setTeams(teams);
            });
            act(() => {
                result.current.actions.handleContinueToGames();
            });

            const initialIds = result.current.state.games.map(g => g.id);

            // Reorder
            act(() => {
                result.current.actions.handleReorderGame(initialIds[1], 'up');
            });

            const reorderedIds = result.current.state.games.map(g => g.id);
            expect(reorderedIds).not.toEqual(initialIds);

            // Call handleContinueToGames again with same teams — should preserve reordered games
            act(() => {
                result.current.actions.handleContinueToGames();
            });

            // Order is preserved because teams didn't change
            expect(result.current.state.games.map(g => g.id)).toEqual(reorderedIds);
        });


        it('reinicia el orden al importar CSV/Texto (handleCSVImport / handleGroupImport)', () => {
            const { result } = renderHook(() => useTQBState());

            const teams = createMockTeams(3, 'A');
            const games = createClearWinnerGames(teams, 'A');

            act(() => {
                result.current.actions.setTeams(teams);
                result.current.actions.setGames(games);
                result.current.actions.handleReorderGame('g-a-2', 'up');
            });

            expect(result.current.state.games.map(g => g.id)).toEqual(['g-a-2', 'g-a-1', 'g-a-3']);

            const importedTeams = [
                { id: 'imp-1', name: 'Imp 1', groupId: 'A' as GroupID },
                { id: 'imp-2', name: 'Imp 2', groupId: 'A' as GroupID },
                { id: 'imp-3', name: 'Imp 3', groupId: 'A' as GroupID },
            ];
            const importedGames = createClearWinnerGames(importedTeams, 'A');

            act(() => {
                result.current.actions.handleCSVImport(importedTeams, importedGames, 'A');
            });

            expect(result.current.state.games.map(g => g.id)).toEqual(['g-a-1', 'g-a-2', 'g-a-3']);
        });

        it('reinicia el orden al iniciar un nuevo torneo (handleStartNew)', () => {
            const { result } = renderHook(() => useTQBState());

            const teams = createMockTeams(3, 'A');
            const games = createClearWinnerGames(teams, 'A');

            act(() => {
                result.current.actions.setTeams(teams);
                result.current.actions.setGames(games);
                result.current.actions.handleReorderGame('g-a-2', 'up');
            });

            act(() => {
                result.current.actions.handleStartNew();
            });

            expect(result.current.state.games).toHaveLength(0);
        });
    });

    // -------------------------------------------------------------
    // 9. Game Locking & Fast Recalculation (Fijar resultados de partidos)
    // -------------------------------------------------------------
    describe('9. Game Locking & Fast Recalculation (Fijar resultados de partidos)', () => {
        it('fijar y desbloquear un partido completo', () => {
            const { result } = renderHook(() => useTQBState());
            const teams = createMockTeams(3, 'A');
            const games = createClearWinnerGames(teams, 'A');

            act(() => {
                result.current.actions.setTeams(teams);
                result.current.actions.setGames(games);
            });

            // Lock game 1
            act(() => {
                result.current.actions.handleToggleLockGame('g-a-1');
            });
            expect(result.current.state.games.find(g => g.id === 'g-a-1')?.isLocked).toBe(true);

            // Unlock game 1
            act(() => {
                result.current.actions.handleToggleLockGame('g-a-1');
            });
            expect(result.current.state.games.find(g => g.id === 'g-a-1')?.isLocked).toBe(false);
        });

        it('no se puede fijar un partido incompleto o invalido', () => {
            const { result } = renderHook(() => useTQBState());
            const teams = createMockTeams(3, 'A');
            const incompleteGames: GameData[] = [
                {
                    id: 'g-inc-1',
                    groupId: 'A',
                    teamAId: teams[0].id, teamBId: teams[1].id,
                    teamAName: teams[0].name, teamBName: teams[1].name,
                    runsA: null, runsB: 5,
                    inningsABatting: '7', inningsADefense: '7',
                    inningsBBatting: '7', inningsBDefense: '7',
                    earnedRunsA: null, earnedRunsB: null,
                },
            ];

            act(() => {
                result.current.actions.setTeams(teams);
                result.current.actions.setGames(incompleteGames);
            });

            act(() => {
                result.current.actions.handleToggleLockGame('g-inc-1');
            });

            expect(result.current.state.games.find(g => g.id === 'g-inc-1')?.isLocked).toBeFalsy();
        });

        it('una edición a un partido fijado se ignora a nivel del hook (carreras, entradas al bate, entradas a la defensa)', () => {
            const { result } = renderHook(() => useTQBState());
            const teams = createMockTeams(3, 'A');
            const games = createClearWinnerGames(teams, 'A');

            act(() => {
                result.current.actions.setTeams(teams);
                result.current.actions.setGames(games);
                result.current.actions.handleToggleLockGame('g-a-1');
            });

            // Attempt to edit runsA, inningsABatting, and inningsADefense of locked game g-a-1
            act(() => {
                result.current.actions.setGames(prev =>
                    prev.map(g => g.id === 'g-a-1' ? {
                        ...g,
                        runsA: 99,
                        inningsABatting: '1',
                        inningsADefense: '1',
                        earnedRunsA: 50,
                    } : g)
                );
            });

            const lockedGame = result.current.state.games.find(g => g.id === 'g-a-1');
            expect(lockedGame?.runsA).toBe(10);
            expect(lockedGame?.inningsABatting).toBe('7');
            expect(lockedGame?.inningsADefense).toBe('7');
            expect(lockedGame?.earnedRunsA).toBe(8);
        });

        it('las flechas de orden siguen funcionando con partidos fijados', () => {
            const { result } = renderHook(() => useTQBState());
            const teams = createMockTeams(3, 'A');
            const games = createClearWinnerGames(teams, 'A');

            act(() => {
                result.current.actions.setTeams(teams);
                result.current.actions.setGames(games);
                result.current.actions.handleToggleLockGame('g-a-2');
            });

            // Move locked game g-a-2 up
            act(() => {
                result.current.actions.handleReorderGame('g-a-2', 'up');
            });

            expect(result.current.state.games.map(g => g.id)).toEqual(['g-a-2', 'g-a-1', 'g-a-3']);
            expect(result.current.state.games.find(g => g.id === 'g-a-2')?.isLocked).toBe(true);
        });

        it('aislamiento entre grupos', () => {
            const { result } = renderHook(() => useTQBState());
            const teamsA = createMockTeams(3, 'A');
            const teamsB = createMockTeams(3, 'B');
            const gamesA = createClearWinnerGames(teamsA, 'A');
            const gamesB = createClearWinnerGames(teamsB, 'B');

            act(() => {
                result.current.actions.setIsMultiGroup(true);
                result.current.actions.setTeams([...teamsA, ...teamsB]);
                result.current.actions.setGames([...gamesA, ...gamesB]);
            });

            // Lock game in Group A
            act(() => {
                result.current.actions.handleToggleLockGame('g-a-1');
            });

            expect(result.current.state.games.find(g => g.id === 'g-a-1')?.isLocked).toBe(true);
            expect(result.current.state.games.filter(g => g.groupId === 'B').every(g => !g.isLocked)).toBe(true);
        });

        it('guardado y carga desde localStorage con partidos fijados, y compatibilidad sin ese dato', () => {
            const { result: r1 } = renderHook(() => useTQBState());
            const teams = createMockTeams(3, 'A');
            const games = createClearWinnerGames(teams, 'A');

            act(() => {
                r1.current.actions.setTeams(teams);
                r1.current.actions.setGames(games);
                r1.current.actions.handleToggleLockGame('g-a-1');
                r1.current.actions.setCurrentScreen(2);
            });

            // Verify loaded state includes lock status
            const { result: r2 } = renderHook(() => useTQBState());
            expect(r2.current.state.games.find(g => g.id === 'g-a-1')?.isLocked).toBe(true);

            // Backward compatibility: load legacy saved state without isLocked
            const legacyState = {
                currentScreen: 2 as const,
                teams,
                games: games.map(g => {
                    const c = { ...g };
                    delete c.isLocked;
                    return c;
                }),
                rankings: [],
                tieBreakMethod: 'WIN_LOSS' as const,
                needsERTQB: false,
                hasUnresolvedTies: false,
                isMultiGroup: false,
            };
            saveState(legacyState);

            const { result: r3 } = renderHook(() => useTQBState());
            expect(r3.current.state.games).toHaveLength(3);
            expect(r3.current.state.games.every(g => !g.isLocked)).toBe(true);
        });

        it('conservación de lo fijado cuando equipos no cambian, y reinicio al cambiar equipos (tras confirmar) o al importar CSV', () => {
            const { result } = renderHook(() => useTQBState());
            const teams = createMockTeams(3, 'A');
            const games = createClearWinnerGames(teams, 'A');

            act(() => {
                result.current.actions.setTeams(teams);
                result.current.actions.setGames(games);
                result.current.actions.handleToggleLockGame('g-a-1');
            });

            expect(result.current.state.games.find(g => g.id === 'g-a-1')?.isLocked).toBe(true);

            // Calling handleContinueToGames with UNCHANGED teams preserves lock status
            act(() => {
                result.current.actions.handleContinueToGames();
            });
            expect(result.current.state.games.find(g => g.id === 'g-a-1')?.isLocked).toBe(true);

            // Adding a new team and confirming regeneration resets lock status
            act(() => {
                result.current.actions.setTeams([
                    ...teams,
                    { id: 't-a-4', name: 'Team A 4', groupId: 'A' },
                ]);
            });
            act(() => {
                result.current.actions.handleContinueToGames();
            });
            act(() => {
                result.current.actions.handleConfirmContinueToGames();
            });
            expect(result.current.state.games.every(g => !g.isLocked)).toBe(true);

            // Relock and test CSV import reset
            act(() => {
                result.current.actions.setTeams(teams);
                result.current.actions.setGames(games);
                result.current.actions.handleToggleLockGame('g-a-1');
            });
            expect(result.current.state.games.find(g => g.id === 'g-a-1')?.isLocked).toBe(true);

            act(() => {
                result.current.actions.handleCSVImport(teams, games, 'A');
            });
            expect(result.current.state.games.every(g => !g.isLocked)).toBe(true);
        });


        it('cambiar solo el partido no fijado actualiza las posiciones sin alterar los datos de los partidos fijados', () => {
            const { result } = renderHook(() => useTQBState());
            const teams = createMockTeams(3, 'A');
            const games = createClearWinnerGames(teams, 'A');

            act(() => {
                result.current.actions.setTeams(teams);
                result.current.actions.setGames(games);
                // Lock games 1 and 2
                result.current.actions.handleToggleLockGame('g-a-1');
                result.current.actions.handleToggleLockGame('g-a-2');
            });

            // Modify game 3 (unfixed game in play)
            act(() => {
                result.current.actions.setGames(prev =>
                    prev.map(g => g.id === 'g-a-3' ? { ...g, runsA: 20, runsB: 0 } : g)
                );
            });

            // Locked games retain original scores
            const g1 = result.current.state.games.find(g => g.id === 'g-a-1');
            const g2 = result.current.state.games.find(g => g.id === 'g-a-2');
            expect(g1?.runsA).toBe(10);
            expect(g2?.runsA).toBe(10);

            // Calculate rankings
            act(() => {
                result.current.actions.handleCalculateTQB();
            });

            expect(result.current.state.rankings).toHaveLength(3);
        });

        it('cambiar solo las entradas al bate o a la defensa del partido no fijado también actualiza las posiciones', () => {
            const { result } = renderHook(() => useTQBState());
            const teams = createMockTeams(3, 'A');
            const games = createCircleTieGames(teams, 'A');

            act(() => {
                result.current.actions.setTeams(teams);
                result.current.actions.setGames(games);
                result.current.actions.handleToggleLockGame('g-a-1');
                result.current.actions.handleToggleLockGame('g-a-2');
            });

            // Modify only innings at bat for game 3
            act(() => {
                result.current.actions.setGames(prev =>
                    prev.map(g => g.id === 'g-a-3' ? { ...g, inningsABatting: '6.2', inningsBDefense: '6.2' } : g)
                );
            });

            act(() => {
                result.current.actions.handleCalculateTQB();
            });

            // TQB calculation should reflect modified innings
            expect(result.current.state.rankings).toHaveLength(3);
            const t3Stats = result.current.state.rankings.find(r => r.id === teams[2].id);
            expect(t3Stats?.inningsAtBatOuts).toBe(41); // 7 innings (21 outs) + 6.2 innings (20 outs) = 41 outs
        });

        it('posiciones finales idénticas con y sin partidos fijados', () => {
            const teams = createMockTeams(3, 'A');
            const games = createClearWinnerGames(teams, 'A');

            // Scenario 1: No games locked
            const { result: rUnlocked } = renderHook(() => useTQBState());
            act(() => {
                rUnlocked.current.actions.setTeams(teams);
                rUnlocked.current.actions.setGames(games);
            });
            act(() => {
                rUnlocked.current.actions.handleCalculateTQB();
            });

            // Scenario 2: Some games locked
            const { result: rLocked } = renderHook(() => useTQBState());
            act(() => {
                rLocked.current.actions.setTeams(teams);
                rLocked.current.actions.setGames(games);
                rLocked.current.actions.handleToggleLockGame('g-a-1');
                rLocked.current.actions.handleToggleLockGame('g-a-2');
            });
            act(() => {
                rLocked.current.actions.handleCalculateTQB();
            });

            expect(rLocked.current.state.rankings).toEqual(rUnlocked.current.state.rankings);
            expect(rLocked.current.state.tieBreakMethod).toEqual(rUnlocked.current.state.tieBreakMethod);
        });
    });

    // -------------------------------------------------------------
    // 10. FASE 7: Propagation of Team Name Changes & Confirmation Modal
    // -------------------------------------------------------------
    describe('10. FASE 7: Team Name Propagation & Smart Continue Confirmation', () => {
        it('renombrar un equipo propaga de inmediato a partidos normales y bloqueados sin modificar carreras ni entradas', () => {
            const { result } = renderHook(() => useTQBState());
            const teams = createMockTeams(3, 'A');
            const games = createClearWinnerGames(teams, 'A');

            act(() => {
                result.current.actions.setTeams(teams);
                result.current.actions.setGames(games);
                result.current.actions.handleToggleLockGame(games[0].id); // Lock game 1
            });

            // Lock check
            expect(result.current.state.games[0].isLocked).toBe(true);

            // Rename team 1 from 'Team A 1' to 'Renamed Alpha'
            act(() => {
                result.current.actions.setTeams(prev =>
                    prev.map(t => t.id === teams[0].id ? { ...t, name: 'Renamed Alpha' } : t)
                );
            });

            // Check game 1 (locked) and game 2 (unlocked) where team 1 plays
            const g1 = result.current.state.games.find(g => g.id === games[0].id);
            const g2 = result.current.state.games.find(g => g.id === games[1].id);

            expect(g1?.teamAName).toBe('Renamed Alpha');
            expect(g1?.runsA).toBe(10); // Runs preserved
            expect(g1?.isLocked).toBe(true); // Lock preserved

            expect(g2?.teamAName).toBe('Renamed Alpha');
            expect(g2?.runsA).toBe(10);
        });

        it('agregar un equipo nuevo cuando hay partidos con resultados activa la confirmación; cancelar no modifica nada', () => {
            const { result } = renderHook(() => useTQBState());
            const teams = createMockTeams(3, 'A');
            const games = createClearWinnerGames(teams, 'A');

            act(() => {
                result.current.actions.setTeams(teams);
                result.current.actions.setGames(games);
                result.current.actions.setCurrentScreen(1);
            });

            // Add a 4th team to group A
            act(() => {
                result.current.actions.setTeams(prev => [
                    ...prev,
                    { id: 't-a-4', name: 'Team A 4', groupId: 'A' },
                ]);
            });

            // Try to continue to games
            act(() => {
                result.current.actions.handleContinueToGames();
            });

            // Should set pendingContinueImpact and stay on screen 1
            expect(result.current.state.pendingContinueImpact).not.toBeNull();
            expect(result.current.state.pendingContinueImpact?.needsConfirmation).toBe(true);
            expect(result.current.state.currentScreen).toBe(1);

            // Cancel confirmation
            act(() => {
                result.current.actions.handleCancelContinueToGames();
            });

            expect(result.current.state.pendingContinueImpact).toBeNull();
            expect(result.current.state.currentScreen).toBe(1);
            expect(result.current.state.games).toHaveLength(3); // Games preserved
        });

        it('confirmar la regeneración recalcula solo el grupo afectado dejando el otro intacto', () => {
            const { result } = renderHook(() => useTQBState());
            const teamsA = createMockTeams(3, 'A');
            const teamsB = createMockTeams(3, 'B');
            const gamesA = createClearWinnerGames(teamsA, 'A');
            const gamesB = createClearWinnerGames(teamsB, 'B');

            act(() => {
                result.current.actions.setIsMultiGroup(true);
                result.current.actions.setTeams([...teamsA, ...teamsB]);
                result.current.actions.setGames([...gamesA, ...gamesB]);
                result.current.actions.setCurrentScreen(1);
            });

            // Add a team to Group A only
            act(() => {
                result.current.actions.setTeams(prev => [
                    ...prev,
                    { id: 't-a-4', name: 'Team A 4', groupId: 'A' },
                ]);
            });

            act(() => {
                result.current.actions.handleContinueToGames();
            });

            expect(result.current.state.pendingContinueImpact?.changedGroups).toEqual(['A']);
            expect(result.current.state.pendingContinueImpact?.unchangedGroups).toEqual(['B']);

            // Confirm regeneration
            act(() => {
                result.current.actions.handleConfirmContinueToGames();
            });

            expect(result.current.state.currentScreen).toBe(2);

            // Group A games regenerated (4 teams -> 6 games)
            const newGamesA = result.current.state.games.filter(g => g.groupId === 'A');
            expect(newGamesA).toHaveLength(6);

            // Group B games preserved intact (3 teams -> 3 games with scores preserved)
            const newGamesB = result.current.state.games.filter(g => g.groupId === 'B');
            expect(newGamesB).toHaveLength(3);
            expect(newGamesB[0].runsA).toBe(10); // Scores preserved in group B!
        });

        it('la restauración con estado corrupto en localStorage no lanza excepción en el hook y resetea a estado inicial', () => {
            localStorage.setItem('tqb_tournament_state', JSON.stringify({
                version: 1,
                currentScreen: 2,
                teams: "invalid-non-array",
                games: [],
            }));

            // renderHook should not throw an unhandled error
            expect(() => {
                renderHook(() => useTQBState());
            }).not.toThrow();

            const { result } = renderHook(() => useTQBState());
            expect(result.current.state.currentScreen).toBe(0);
        });
    });

    // -------------------------------------------------------------
    // 11. FASE 8: Live Game Update & Stale Indicator in Hook
    // -------------------------------------------------------------
    describe('11. FASE 8: Live Game Update & Stale Indicator in Hook', () => {
        it('handleLiveGameUpdate actualiza los partidos y recalcula rankings cuando todos los partidos son válidos sin cambiar currentScreen', () => {
            const { result } = renderHook(() => useTQBState());
            const teams = createMockTeams(3, 'A');
            const games = createClearWinnerGames(teams, 'A');

            act(() => {
                result.current.actions.setTeams(teams);
                result.current.actions.setGames(games);
                result.current.actions.handleCalculateTQB(); // Go to screen 3
            });

            expect(result.current.state.currentScreen).toBe(3);
            const initialRankings = result.current.state.rankings;

            // Live edit game 3 from score 5-1 to score 20-1
            act(() => {
                result.current.actions.handleLiveGameUpdate('g-a-3', { runsA: 20, runsB: 1 });
            });

            // currentScreen must remain at 3
            expect(result.current.state.currentScreen).toBe(3);
            // rankings must be updated automatically
            expect(result.current.state.rankings).not.toEqual(initialRankings);
            // games in state must be updated
            expect(result.current.state.games.find(g => g.id === 'g-a-3')?.runsA).toBe(20);
            // isCalculationStale should be false because all games are complete & valid
            expect(result.current.state.isCalculationStale).toBe(false);
        });

        it('handleLiveGameUpdate en partido bloqueado es rechazado por el guardián de bloqueo', () => {
            const { result } = renderHook(() => useTQBState());
            const teams = createMockTeams(3, 'A');
            const games = createClearWinnerGames(teams, 'A');

            act(() => {
                result.current.actions.setTeams(teams);
                result.current.actions.setGames(games);
                result.current.actions.handleToggleLockGame('g-a-1');
            });

            expect(result.current.state.games.find(g => g.id === 'g-a-1')?.isLocked).toBe(true);

            // Attempt live update on locked game 1
            act(() => {
                result.current.actions.handleLiveGameUpdate('g-a-1', { runsA: 99 });
            });

            // Score of locked game 1 must NOT change
            expect(result.current.state.games.find(g => g.id === 'g-a-1')?.runsA).toBe(10);
        });

        it('cuando un partido queda incompleto, handleLiveGameUpdate no recalcula rankings e isCalculationStale pasa a ser true', () => {
            const { result } = renderHook(() => useTQBState());
            const teams = createMockTeams(3, 'A');
            const games = createClearWinnerGames(teams, 'A');

            act(() => {
                result.current.actions.setTeams(teams);
                result.current.actions.setGames(games);
                result.current.actions.handleCalculateTQB();
            });

            const initialValidRankings = result.current.state.rankings;

            // Edit game 3 to set runsA to null (incomplete)
            act(() => {
                result.current.actions.handleLiveGameUpdate('g-a-3', { runsA: null });
            });

            // Rankings must retain last valid calculation
            expect(result.current.state.rankings).toEqual(initialValidRankings);
            // isCalculationStale must be true
            expect(result.current.state.isCalculationStale).toBe(true);
        });

        it('needsERTQB se actualiza cuando la edición en vivo provoca o resuelve un empate que requiere ER-TQB', () => {
            const { result } = renderHook(() => useTQBState());
            const teams = createMockTeams(3, 'A');
            const circleTieGames = createCircleTieGames(teams, 'A'); // Circle tie -> needsERTQB true

            act(() => {
                result.current.actions.setTeams(teams);
                result.current.actions.setGames(circleTieGames);
                result.current.actions.handleCalculateTQB();
            });

            expect(result.current.state.needsERTQB).toBe(true);

            // Turn games into clear winner games via live update
            const clearWinnerGames = createClearWinnerGames(teams, 'A');
            act(() => {
                result.current.actions.handleLiveGameUpdate(clearWinnerGames[0].id, {
                    runsA: clearWinnerGames[0].runsA,
                    runsB: clearWinnerGames[0].runsB,
                });
            });
            act(() => {
                result.current.actions.handleLiveGameUpdate(clearWinnerGames[1].id, {
                    runsA: clearWinnerGames[1].runsA,
                    runsB: clearWinnerGames[1].runsB,
                });
            });
            act(() => {
                result.current.actions.handleLiveGameUpdate(clearWinnerGames[2].id, {
                    runsA: clearWinnerGames[2].runsA,
                    runsB: clearWinnerGames[2].runsB,
                });
            });

            expect(result.current.state.needsERTQB).toBe(false);
        });

    });
});




