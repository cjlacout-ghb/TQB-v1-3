import { useState, useCallback, useEffect, useMemo } from 'react';
import { Team, GameData, TeamStats, TieBreakMethod, ScreenNumber, GroupID } from '@/lib/types';
import { generateMatchups, calculateRankings } from '@/lib/calculations';
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
    };
    actions: {
        setCurrentScreen: (screen: ScreenNumber | ((prev: ScreenNumber) => ScreenNumber)) => void;
        setTeams: (teams: Team[] | ((prev: Team[]) => Team[])) => void;
        setGames: (games: GameData[] | ((prev: GameData[]) => GameData[])) => void;
        handleCSVImport: (importedTeams: Team[], importedGames: GameData[], groupId?: GroupID) => void;
        handleContinueToGames: () => void;
        handleCalculateTQB: () => void;
        handleCalculateERTQB: () => void;
        handleStartNew: () => void;
        handleBack: () => void;
        setNeedsERTQB: (needs: boolean | ((prev: boolean) => boolean)) => void;
        setHasUnresolvedTies: (has: boolean | ((prev: boolean) => boolean)) => void;
        setIsMultiGroup: (value: boolean | ((prev: boolean) => boolean)) => void;
    };
}

export function useTQBState(): TQBStateReturn {
    const [currentScreen, setCurrentScreen] = useState<ScreenNumber>(0);
    const [teams, setTeams] = useState<Team[]>([
        { id: 'team-1', name: '', groupId: 'A' },
        { id: 'team-2', name: '', groupId: 'A' },
        { id: 'team-3', name: '', groupId: 'A' },
    ]);
    const [games, setGames] = useState<GameData[]>([]);
    const [rankings, setRankings] = useState<TeamStats[]>([]);
    const [tieBreakMethod, setTieBreakMethod] = useState<TieBreakMethod>('WIN_LOSS');
    const [needsERTQB, setNeedsERTQB] = useState(false);
    const [hasUnresolvedTies, setHasUnresolvedTies] = useState(false);
    const [isMultiGroup, setIsMultiGroup] = useState(false);
    const [groupTieBreakMethod, setGroupTieBreakMethod] = useState<Partial<Record<GroupID, TieBreakMethod>>>({}); // Per-group tie-break metadata

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
            setGames(migratedGames);
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

    const handleCSVImport = useCallback((importedTeams: Team[], importedGames: GameData[], groupId: GroupID = 'A') => {
        // Inject the active group from the UI tab — the CSV format itself is group-agnostic
        const taggedTeams = importedTeams.map(t => ({ ...t, groupId }));
        const taggedGames = importedGames.map(g => ({ ...g, groupId }));
        setTeams(taggedTeams);
        setGames(taggedGames);
        setCurrentScreen(2);
    }, []);

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

        setGames(allInitialGames);
        setCurrentScreen(2);
    }, [teams, isMultiGroup]);

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
            setTieBreakMethod(resultA.tieBreakMethod);
            setGroupTieBreakMethod({ A: resultA.tieBreakMethod, B: resultB.tieBreakMethod });
            setNeedsERTQB(resultA.needsERTQB || resultB.needsERTQB);
        } else {
            const result = calculateRankings(teams, games, false);
            setRankings(result.rankings);
            setTieBreakMethod(result.tieBreakMethod);
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
            setTieBreakMethod(resultA.tieBreakMethod);
            setGroupTieBreakMethod({ A: resultA.tieBreakMethod, B: resultB.tieBreakMethod });
            setHasUnresolvedTies(resultA.hasTies || resultB.hasTies);
        } else {
            const result = calculateRankings(teams, games, true);
            setRankings(result.rankings);
            setTieBreakMethod(result.tieBreakMethod);
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
        setGames([]);
        setRankings([]);
        setTieBreakMethod('WIN_LOSS');
        setNeedsERTQB(false);
        setHasUnresolvedTies(false);
        setIsMultiGroup(false);
        setGroupTieBreakMethod({});
        setCurrentScreen(1);
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
        },
        actions: {
            setCurrentScreen,
            setTeams,
            setGames,
            handleCSVImport,
            handleContinueToGames,
            handleCalculateTQB,
            handleCalculateERTQB,
            handleStartNew,
            handleBack,
            setNeedsERTQB,
            setHasUnresolvedTies,
            setIsMultiGroup,
        }
    };
}
