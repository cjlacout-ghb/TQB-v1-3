import { useState, useCallback, useEffect, useMemo } from 'react';
import { Team, GameData, TeamStats, TieBreakMethod, ScreenNumber, GroupID } from '@/lib/types';
import {
    calculateRankings,
    reorderGame,
    isGameCompleteAndValid,
    areAllGamesCompleteAndValid,
    checkContinueToGamesImpact,
    executeContinueToGamesLogic,
    ContinueToGamesImpact,
} from '@/lib/calculations';
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
        pendingContinueImpact: ContinueToGamesImpact | null;
        isCalculationStale: boolean;
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
        handleConfirmContinueToGames: () => void;
        handleCancelContinueToGames: () => void;
        handleCalculateTQB: () => void;
        handleLiveGameUpdate: (gameId: string, updates: Partial<GameData>) => void;
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
    const [teams, setTeamsBase] = useState<Team[]>([
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

    // Pending impact for the "Continue to Games" confirmation modal
    const [pendingContinueImpact, setPendingContinueImpact] = useState<ContinueToGamesImpact | null>(null);

    // setTeams: propagates name changes to existing games that reference the same teamId.
    // Does NOT regenerate games — only updates teamAName/teamBName fields on existing game objects.
    const setTeams = useCallback((action: Team[] | ((prev: Team[]) => Team[])) => {
        setTeamsBase(prevTeams => {
            const nextTeams = typeof action === 'function' ? action(prevTeams) : action;

            // Build a map of id -> new name for teams whose name changed
            const prevNameMap = new Map(prevTeams.map(t => [t.id, t.name]));
            const changedNames = new Map<string, string>();
            for (const t of nextTeams) {
                const prevName = prevNameMap.get(t.id);
                if (prevName !== undefined && prevName !== t.name) {
                    changedNames.set(t.id, t.name);
                }
            }

            // If any names changed, propagate to games (including locked games — only names, not results)
            if (changedNames.size > 0) {
                setGamesBase(prevGames =>
                    prevGames.map(g => {
                        const newTeamAName = changedNames.get(g.teamAId);
                        const newTeamBName = changedNames.get(g.teamBId);
                        if (newTeamAName !== undefined || newTeamBName !== undefined) {
                            return {
                                ...g,
                                teamAName: newTeamAName !== undefined ? newTeamAName : g.teamAName,
                                teamBName: newTeamBName !== undefined ? newTeamBName : g.teamBName,
                            };
                        }
                        return g;
                    })
                );
            }

            return nextTeams;
        });
    }, []);

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
                            // Protect results and identity — but allow name updates
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
                            // teamAName / teamBName: accept whatever nextGame has — propagated by setTeams
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

    const isCalculationStale = useMemo(() => !areAllGamesCompleteAndValid(games), [games]);

    const recalculateRankingsInternal = useCallback((targetTeams: Team[], targetGames: GameData[], multiGroupFlag: boolean) => {
        if (multiGroupFlag) {
            const gATeams = targetTeams.filter(t => t.groupId === 'A');
            const gBTeams = targetTeams.filter(t => t.groupId === 'B');
            const gAGames = targetGames.filter(g => g.groupId === 'A');
            const gBGames = targetGames.filter(g => g.groupId === 'B');
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
            const result = calculateRankings(targetTeams, targetGames, false);
            setRankings(result.rankings);
            setTieBreakMethod(result.tieBreakMethod);
            setGroupTieBreakMethod({ A: result.tieBreakMethod });
            setNeedsERTQB(result.needsERTQB);
        }
    }, []);

    const handleCalculateTQB = useCallback(() => {
        recalculateRankingsInternal(teams, games, isMultiGroup);
        setCurrentScreen(3);
    }, [teams, games, isMultiGroup, recalculateRankingsInternal]);

    const handleLiveGameUpdate = useCallback((gameId: string, updates: Partial<GameData>) => {
        setGamesBase(prevGames => {
            const nextGames = prevGames.map(g => {
                if (g.id !== gameId) return g;
                if (g.isLocked) return g;
                return { ...g, ...updates };
            });
            if (areAllGamesCompleteAndValid(nextGames)) {
                recalculateRankingsInternal(teams, nextGames, isMultiGroup);
            }
            return nextGames;
        });
    }, [teams, isMultiGroup, recalculateRankingsInternal]);

    const handleToggleLockGame = useCallback((gameId: string) => {
        setGamesBase(prevGames => {
            const nextGames = prevGames.map(g => {
                if (g.id !== gameId) return g;
                if (g.isLocked) {
                    return { ...g, isLocked: false };
                } else {
                    if (isGameCompleteAndValid(g)) {
                        return { ...g, isLocked: true };
                    }
                    return g;
                }
            });
            if (areAllGamesCompleteAndValid(nextGames)) {
                recalculateRankingsInternal(teams, nextGames, isMultiGroup);
            }
            return nextGames;
        });
    }, [teams, isMultiGroup, recalculateRankingsInternal]);


    // Load state on mount — fully defensive, relies on loadState() from storage.ts
    useEffect(() => {
        try {
            const saved = loadState();
            if (saved) {
                // loadState() returns already-validated and normalized state.
                // No further migration needed here — all defaults already applied.
                setTeamsBase(saved.teams);
                setGamesBase(saved.games);
                setRankings(saved.rankings);
                setTieBreakMethod(saved.tieBreakMethod);
                setNeedsERTQB(saved.needsERTQB);
                setHasUnresolvedTies(saved.hasUnresolvedTies);
                setIsMultiGroup(saved.isMultiGroup ?? false);
                setGroupTieBreakMethod(saved.groupTieBreakMethod ?? {});
            }
        } catch (err) {
            // Safety net: if anything unexpected blows up, clear corrupt state and start fresh.
            console.error('Unexpected error restoring state from localStorage, clearing:', err);
            clearState();
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
        setTeamsBase(prev => [
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
            setTeamsBase(taggedTeams);
            setGamesBase(taggedGames);
            setCurrentScreen(2);
        }
    }, [isMultiGroup, handleGroupImport]);

    // SMART Continue to Games:
    // 1. Check if team sets changed per group vs existing games.
    // 2. If no data loss: execute immediately.
    // 3. If data will be lost: store impact and show confirmation modal.
    const handleContinueToGames = useCallback(() => {
        const impact = checkContinueToGamesImpact(teams, games, isMultiGroup);

        if (!impact.needsConfirmation) {
            // No data at risk — apply immediately (no modal)
            const nextGames = executeContinueToGamesLogic(teams, games, isMultiGroup);
            setGamesBase(nextGames);
            setCurrentScreen(2);
        } else {
            // Data will be lost — request confirmation
            setPendingContinueImpact(impact);
        }
    }, [teams, games, isMultiGroup]);

    const handleConfirmContinueToGames = useCallback(() => {
        const nextGames = executeContinueToGamesLogic(teams, games, isMultiGroup);
        setGamesBase(nextGames);
        setPendingContinueImpact(null);
        setCurrentScreen(2);
    }, [teams, games, isMultiGroup]);

    const handleCancelContinueToGames = useCallback(() => {
        setPendingContinueImpact(null);
        // Stay on current screen — don't change anything
    }, []);

    const handleSetIsMultiGroup = useCallback((value: boolean | ((prev: boolean) => boolean)) => {
        setIsMultiGroup(prev => {
            const next = typeof value === 'function' ? value(prev) : value;
            if (!next) {
                setActiveGroupId('A');
            }
            return next;
        });
    }, []);



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
        setTeamsBase([
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
        setPendingContinueImpact(null);
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
            pendingContinueImpact,
            isCalculationStale,
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
            handleConfirmContinueToGames,
            handleCancelContinueToGames,
            handleCalculateTQB,
            handleLiveGameUpdate,
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
