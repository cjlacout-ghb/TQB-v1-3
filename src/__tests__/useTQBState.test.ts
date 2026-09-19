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
});
