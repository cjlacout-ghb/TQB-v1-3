import { useState, useCallback, useEffect, useMemo } from 'react';
import { Team, GameData, TeamStats, TieBreakMethod, ScreenNumber, GroupID } from '@/lib/types';
import { generateMatchups, calculateRankings, reorderGame, isGameCompleteAndValid } from '@/lib/calculations';
import { loadState, saveState, clearState } from '@/lib/storage';

export interface TQBStateReturn {
    state: {
        currentScreen: ScreenNumber;
        teams: Team[];
        games: GameData[];
        rankings: TeamStats[];
        tieBreakMethod: TieBreakMethod;
        needsERTQB: boolean;
        hasUnresolvedTies: boolean;
        totalSteps: number;
        isMultiGroup: boolean;
        groupTieBreakMethod: Partial<Record<GroupID, TieBreakMethod>>;
        activeGroupId: GroupID;
    };
    actions: {
        setCurrentScreen: (screen: ScreenNumber | ((prev: ScreenNumber) => ScreenNumber)) => void;
        setTeams: (teams: Team[] | ((prev: Team[]) => Team[])) => void;
        setGames: (games: GameData[] | ((prev: GameData[]) => GameData[])) => void;
        handleToggleLockGame: (gameId: string) => void;
        handleReorderGame: (gameId: string, direction: 'up' | 'down') => void;
        handleCSVImport: (importedTeams: Team[], importedGames: GameData[], groupId?: GroupID) => void;
        handleGroupImport: (importedTeams: Team[], importedGames: GameData[], groupId: GroupID) => void;
        handleGoToLanding: () => void;
        handleContinueToGames: () => void;
        handleCalculateTQB: () => void;
        handleCalculateERTQB: () => void;
        handleStartNew: () => void;
        handleContinueTournament: () => void;
        handleBack: () => void;
        setNeedsERTQB: (needs: boolean | ((prev: boolean) => boolean)) => void;
        setHasUnresolvedTies: (has: boolean | ((prev: boolean) => boolean)) => void;
        setIsMultiGroup: (value: boolean | ((prev: boolean) => boolean)) => void;
        setActiveGroupId: (id: GroupID) => void;
    };
}

export function useTQBState(): TQBStateReturn {
    const [currentScreen, setCurrentScreen] = useState<ScreenNumber>(0);
    const [teams, setTeams] = useState<Team[]>([
        { id: 'team-1', name: '', groupId: 'A' },
        { id: 'team-2', name: '', groupId: 'A' },
        { id: 'team-3', name: '', groupId: 'A' },
    ]);
    const [games, setGamesBase] = useState<GameData[]>([]);
    const [rankings, setRankings] = useState<TeamStats[]>([]);
    // Global tieBreakMethod: In single-group mode, stores the tie-break method for the tournament.
    // In multi-group mode, stores the common method if both groups match, or 'UNRESOLVED' if they differ.
    // Per-group tie-break methods are tracked in groupTieBreakMethod.
    const [tieBreakMethod, setTieBreakMethod] = useState<TieBreakMethod>('WIN_LOSS');
    const [needsERTQB, setNeedsERTQB] = useState(false);
    const [hasUnresolvedTies, setHasUnresolvedTies] = useState(false);
    const [isMultiGroup, setIsMultiGroup] = useState(false);
    const [groupTieBreakMethod, setGroupTieBreakMethod] = useState<Partial<Record<GroupID, TieBreakMethod>>>({}); // Per-group tie-break metadata
    const [activeGroupId, setActiveGroupId] = useState<GroupID>('A'); // Global UI state for active group identification

    const setGames = useCallback((action: GameData[] | ((prev: GameData[]) => GameData[])) => {
        setGamesBase(prevGames => {
            const nextGames = typeof action === 'function' ? action(prevGames) : action;
            const prevGamesMap = new Map(prevGames.map(g => [g.id, g]));

            return nextGames.map(nextGame => {
                const prevGame = prevGamesMap.get(nextGame.id);
                if (!prevGame) return nextGame;

                // Lock enforcement: if prevGame was locked
                if (prevGame.isLocked) {
                    // If nextGame stays locked (or didn't explicitly request isLocked: false)
                    if (nextGame.isLocked !== false) {
                        return {
                            ...nextGame,
                            isLocked: true,
                            runsA: prevGame.runsA,
                            runsB: prevGame.runsB,
                            inningsABatting: prevGame.inningsABatting,
                            inningsADefense: prevGame.inningsADefense,
                            inningsBBatting: prevGame.inningsBBatting,
                            inningsBDefense: prevGame.inningsBDefense,
                            earnedRunsA: prevGame.earnedRunsA,
                            earnedRunsB: prevGame.earnedRunsB,
                            teamAId: prevGame.teamAId,
                            teamBId: prevGame.teamBId,
                            teamAName: prevGame.teamAName,
                            teamBName: prevGame.teamBName,
                        };
                    }
                } else {
                    // If prevGame was NOT locked, but nextGame attempts to set isLocked: true
                    if (nextGame.isLocked) {
                        if (!isGameCompleteAndValid(nextGame)) {
                            return { ...nextGame, isLocked: false };
                        }
                    }
                }
                return nextGame;
            });
        });
    }, []);

    const handleToggleLockGame = useCallback((gameId: string) => {
        setGamesBase(prevGames => prevGames.map(g => {
            if (g.id !== gameId) return g;
            if (g.isLocked) {
                return { ...g, isLocked: false };
            } else {
                if (isGameCompleteAndValid(g)) {
                    return { ...g, isLocked: true };
                }
                return g;
            }
        }));
    }, []);

    // Load state on mount
    useEffect(() => {
        const saved = loadState();
        if (saved) {
            // Migrate legacy teams that lack groupId (backward compatibility)
            const migratedTeams = saved.teams.map((t: Team) => ({
                ...t,
                groupId: t.groupId ?? 'A',
            }));
            // Migrate legacy games that lack groupId
            const migratedGames = saved.games.map((g: GameData) => ({
                ...g,
                groupId: g.groupId ?? 'A',
            }));
            setTeams(migratedTeams);
            setGamesBase(migratedGames);
            setRankings(saved.rankings);
            setTieBreakMethod(saved.tieBreakMethod);
            setNeedsERTQB(saved.needsERTQB);
            setHasUnresolvedTies(saved.hasUnresolvedTies);
            setIsMultiGroup(saved.isMultiGroup ?? false);
            setGroupTieBreakMethod(saved.groupTieBreakMethod ?? {});
        }
    }, []);

    // Auto-save state
    useEffect(() => {
        const hasTeamNames = teams.some(t => t.name.trim().length > 0);
        const hasGames = games.length > 0;

        if (currentScreen !== 0 && (hasTeamNames || hasGames)) {
            saveState({
                currentScreen,
                teams,
                games,
                rankings,
                tieBreakMethod,
                needsERTQB,
                hasUnresolvedTies,
                isMultiGroup,
                groupTieBreakMethod,
            });
        }
    }, [currentScreen, teams, games, rankings, tieBreakMethod, needsERTQB, hasUnresolvedTies, isMultiGroup, groupTieBreakMethod]);


    const totalSteps = useMemo(() => (needsERTQB ? 5 : 3), [needsERTQB]);

    // Multi-group import: replaces only the target group's teams and games, preserving the other group.
    // Does NOT navigate — the user must click Continue when both groups are ready.
    const handleGroupImport = useCallback((importedTeams: Team[], importedGames: GameData[], groupId: GroupID) => {
        const taggedTeams = importedTeams.map(t => ({ ...t, groupId }));
        const taggedGames = importedGames.map(g => ({ ...g, groupId, isLocked: false }));
        setTeams(prev => [
            ...prev.filter(t => t.groupId !== groupId),
            ...taggedTeams,
        ]);
        setGamesBase(prev => [
            ...prev.filter(g => g.groupId !== groupId),
            ...taggedGames,
        ]);
    }, []);

    const handleCSVImport = useCallback((importedTeams: Team[], importedGames: GameData[], groupId: GroupID = 'A') => {
        // Inject the active group from the UI tab — the CSV format itself is group-agnostic.
        // In multi-group mode, delegate to handleGroupImport to preserve the other group's data.
        // In single-group mode, replace all state and advance to the game-entry screen.
        if (isMultiGroup) {
            handleGroupImport(importedTeams, importedGames, groupId);
        } else {
            const taggedTeams = importedTeams.map(t => ({ ...t, groupId }));
            const taggedGames = importedGames.map(g => ({ ...g, groupId, isLocked: false }));
            setTeams(taggedTeams);
            setGamesBase(taggedGames);
            setCurrentScreen(2);
        }
    }, [isMultiGroup, handleGroupImport]);

    const handleContinueToGames = useCallback(() => {
        let allInitialGames: GameData[] = [];

        const makeGames = (groupTeams: { id: string; name: string }[], groupId: GroupID): GameData[] => {
            const matchups = generateMatchups(groupTeams);
            return matchups.map(match => ({
                ...match,
                groupId,
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
        };

        if (isMultiGroup) {
            const groupATeams = teams.filter(t => t.groupId === 'A');
            const groupBTeams = teams.filter(t => t.groupId === 'B');
            allInitialGames = [
                ...makeGames(groupATeams, 'A'),
                ...makeGames(groupBTeams, 'B'),
            ];
        } else {
            allInitialGames = makeGames(teams, 'A');
        }

        setGamesBase(allInitialGames);
        setCurrentScreen(2);
    }, [teams, isMultiGroup]);

    const handleSetIsMultiGroup = useCallback((value: boolean | ((prev: boolean) => boolean)) => {
        setIsMultiGroup(prev => {
            const next = typeof value === 'function' ? value(prev) : value;
            if (!next) {
                setActiveGroupId('A');
            }
            return next;
        });
    }, []);

    const handleCalculateTQB = useCallback(() => {
        if (isMultiGroup) {
            const gATeams = teams.filter(t => t.groupId === 'A');
            const gBTeams = teams.filter(t => t.groupId === 'B');
            const gAGames = games.filter(g => g.groupId === 'A');
            const gBGames = games.filter(g => g.groupId === 'B');
            const resultA = calculateRankings(gATeams, gAGames, false);
            const resultB = calculateRankings(gBTeams, gBGames, false);
            setRankings([
                ...resultA.rankings.map(r => ({ ...r, groupId: 'A' as GroupID })),
                ...resultB.rankings.map(r => ({ ...r, groupId: 'B' as GroupID })),
            ]);
            const globalMethod = resultA.tieBreakMethod === resultB.tieBreakMethod ? resultA.tieBreakMethod : 'UNRESOLVED';
            setTieBreakMethod(globalMethod);
            setGroupTieBreakMethod({ A: resultA.tieBreakMethod, B: resultB.tieBreakMethod });
            setNeedsERTQB(resultA.needsERTQB || resultB.needsERTQB);
        } else {
            const result = calculateRankings(teams, games, false);
            setRankings(result.rankings);
            setTieBreakMethod(result.tieBreakMethod);
            setGroupTieBreakMethod({ A: result.tieBreakMethod });
            setNeedsERTQB(result.needsERTQB);
        }
        setCurrentScreen(3);
    }, [teams, games, isMultiGroup]);

    const handleCalculateERTQB = useCallback(() => {
        if (isMultiGroup) {
            const gATeams = teams.filter(t => t.groupId === 'A');
            const gBTeams = teams.filter(t => t.groupId === 'B');
            const gAGames = games.filter(g => g.groupId === 'A');
            const gBGames = games.filter(g => g.groupId === 'B');
            const resultA = calculateRankings(gATeams, gAGames, true);
            const resultB = calculateRankings(gBTeams, gBGames, true);
            setRankings([
                ...resultA.rankings.map(r => ({ ...r, groupId: 'A' as GroupID })),
                ...resultB.rankings.map(r => ({ ...r, groupId: 'B' as GroupID })),
            ]);
            const globalMethod = resultA.tieBreakMethod === resultB.tieBreakMethod ? resultA.tieBreakMethod : 'UNRESOLVED';
            setTieBreakMethod(globalMethod);
            setGroupTieBreakMethod({ A: resultA.tieBreakMethod, B: resultB.tieBreakMethod });
            setHasUnresolvedTies(resultA.hasTies || resultB.hasTies);
        } else {
            const result = calculateRankings(teams, games, true);
            setRankings(result.rankings);
            setTieBreakMethod(result.tieBreakMethod);
            setGroupTieBreakMethod({ A: result.tieBreakMethod });
            setHasUnresolvedTies(result.hasTies);
        }
        setCurrentScreen(5);
    }, [teams, games, isMultiGroup]);

    const handleStartNew = useCallback(() => {
        clearState();
        setTeams([
            { id: 'team-1', name: '', groupId: 'A' },
            { id: 'team-2', name: '', groupId: 'A' },
            { id: 'team-3', name: '', groupId: 'A' },
        ]);
        setGamesBase([]);
        setRankings([]);
        setTieBreakMethod('WIN_LOSS');
        setNeedsERTQB(false);
        setHasUnresolvedTies(false);
        setIsMultiGroup(false);
        setActiveGroupId('A');
        setGroupTieBreakMethod({});
        setCurrentScreen(1);
    }, []);

    const handleContinueTournament = useCallback(() => {
        const saved = loadState();
        setActiveGroupId('A');
        if (saved) {
            setCurrentScreen(saved.currentScreen || 1);
        } else {
            setCurrentScreen(1);
        }
    }, []);

    const handleGoToLanding = useCallback(() => {
        setActiveGroupId('A');
        setCurrentScreen(0);
    }, []);

    const handleBack = useCallback(() => {
        const backMap: Record<number, ScreenNumber> = {
            2: 1,
            3: 2,
            4: 3,
            5: 4
        };
        if (currentScreen in backMap) {
            setCurrentScreen(backMap[currentScreen as keyof typeof backMap]);
        }
    }, [currentScreen]);

    const handleReorderGame = useCallback((gameId: string, direction: 'up' | 'down') => {
        setGamesBase(prev => reorderGame(prev, gameId, direction));
    }, []);

    return {
        state: {
            currentScreen,
            teams,
            games,
            rankings,
            tieBreakMethod,
            needsERTQB,
            hasUnresolvedTies,
            totalSteps,
            isMultiGroup,
            groupTieBreakMethod,
            activeGroupId,
        },
        actions: {
            setCurrentScreen,
            setTeams,
            setGames,
            handleToggleLockGame,
            handleReorderGame,
            handleCSVImport,
            handleGroupImport,
            handleGoToLanding,
            handleContinueToGames,
            handleCalculateTQB,
            handleCalculateERTQB,
            handleStartNew,
            handleContinueTournament,
            handleBack,
            setNeedsERTQB,
            setHasUnresolvedTies,
            setIsMultiGroup: handleSetIsMultiGroup,
            setActiveGroupId,
        }
    };
}

