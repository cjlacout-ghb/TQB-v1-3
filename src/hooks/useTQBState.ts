import { useState, useCallback, useEffect, useMemo } from 'react';
import { Team, GameData, TeamStats, TieBreakMethod, ScreenNumber } from '@/lib/types';
import { generateMatchups, calculateRankings } from '@/lib/calculations';
import { loadState, saveState, clearState } from '@/lib/storage';

export function useTQBState() {
    const [currentScreen, setCurrentScreen] = useState<ScreenNumber>(0);
    const [teams, setTeams] = useState<Team[]>([
        { id: 'team-1', name: '' },
        { id: 'team-2', name: '' },
        { id: 'team-3', name: '' },
    ]);
    const [games, setGames] = useState<GameData[]>([]);
    const [rankings, setRankings] = useState<TeamStats[]>([]);
    const [tieBreakMethod, setTieBreakMethod] = useState<TieBreakMethod>('WIN_LOSS');
    const [needsERTQB, setNeedsERTQB] = useState(false);
    const [hasUnresolvedTies, setHasUnresolvedTies] = useState(false);

    // Load state on mount
    useEffect(() => {
        const saved = loadState();
        if (saved) {
            setTeams(saved.teams);
            setGames(saved.games);
            setRankings(saved.rankings);
            setTieBreakMethod(saved.tieBreakMethod);
            setNeedsERTQB(saved.needsERTQB);
            setHasUnresolvedTies(saved.hasUnresolvedTies);
            // Don't auto-set currentScreen to 0 if we were somewhere else, 
            // the Home component handles the transition from Landing
        }
    }, []);

    // Auto-save state
    useEffect(() => {
        if (currentScreen !== 0) {
            saveState({
                currentScreen,
                teams,
                games,
                rankings,
                tieBreakMethod,
                needsERTQB,
                hasUnresolvedTies
            });
        }
    }, [currentScreen, teams, games, rankings, tieBreakMethod, needsERTQB, hasUnresolvedTies]);

    const totalSteps = useMemo(() => (needsERTQB ? 5 : 3), [needsERTQB]);

    const handleCSVImport = useCallback((importedTeams: Team[], importedGames: GameData[]) => {
        setTeams(importedTeams);
        setGames(importedGames);
        setCurrentScreen(2);
    }, []);

    const handleContinueToGames = useCallback(() => {
        const matchups = generateMatchups(teams);
        const initialGames: GameData[] = matchups.map(match => ({
            ...match,
            runsA: null,
            runsB: null,
            inningsABatting: '',
            inningsADefense: '',
            inningsBBatting: '',
            inningsBDefense: '',
            earnedRunsA: null,
            earnedRunsB: null,
        }));
        setGames(initialGames);
        setCurrentScreen(2);
    }, [teams]);

    const handleCalculateTQB = useCallback(() => {
        const result = calculateRankings(teams, games, false);
        setRankings(result.rankings);
        setTieBreakMethod(result.tieBreakMethod);
        setNeedsERTQB(result.needsERTQB);
        setCurrentScreen(3);
    }, [teams, games]);

    const handleCalculateERTQB = useCallback(() => {
        const result = calculateRankings(teams, games, true);
        setRankings(result.rankings);
        setTieBreakMethod(result.tieBreakMethod);
        setHasUnresolvedTies(result.hasTies);
        setCurrentScreen(5);
    }, [teams, games]);

    const handleStartNew = useCallback(() => {
        clearState();
        setTeams([
            { id: 'team-1', name: '' },
            { id: 'team-2', name: '' },
            { id: 'team-3', name: '' },
        ]);
        setGames([]);
        setRankings([]);
        setTieBreakMethod('WIN_LOSS');
        setNeedsERTQB(false);
        setHasUnresolvedTies(false);
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
            totalSteps
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
            setHasUnresolvedTies
        }
    };
}
