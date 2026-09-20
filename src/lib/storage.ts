import { AppState, GameData, Team, ScreenNumber, TieBreakMethod } from './types';

const STORAGE_KEY = 'tqb_tournament_state';
export const CURRENT_SCHEMA_VERSION = 1;

export const clearState = (): void => {
    if (typeof window === 'undefined') return;
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
        console.error('Error clearing state from localStorage:', error);
    }
};

export const saveState = (state: AppState): void => {
    if (typeof window === 'undefined') return;
    try {
        const stateToSave: AppState = {
            ...state,
            version: CURRENT_SCHEMA_VERSION,
        };
        const serializedState = JSON.stringify(stateToSave);
        localStorage.setItem(STORAGE_KEY, serializedState);
    } catch (error) {
        console.error('Error saving state to localStorage:', error);
    }
};

export const loadState = (): AppState | null => {
    if (typeof window === 'undefined') return null;
    try {
        const serializedState = localStorage.getItem(STORAGE_KEY);
        if (serializedState === null) return null;

        let parsed: Record<string, unknown>;
        try {
            parsed = JSON.parse(serializedState);
        } catch {
            console.warn('Corrupt JSON in localStorage, clearing state.');
            clearState();
            return null;
        }

        // Validate top-level shape
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
            console.warn('Unusable state in localStorage (not an object), clearing state.');
            clearState();
            return null;
        }

        // Schema version check: newer version than supported is unusable
        if (typeof parsed.version === 'number' && parsed.version > CURRENT_SCHEMA_VERSION) {
            console.warn(`Saved state version (${parsed.version}) is newer than current supported version (${CURRENT_SCHEMA_VERSION}), clearing state.`);
            clearState();
            return null;
        }

        // Validate teams array and element structure
        if (!Array.isArray(parsed.teams) || !parsed.teams.every((t: unknown) => t && typeof t === 'object' && (typeof (t as Record<string, unknown>).id === 'string' || typeof (t as Record<string, unknown>).id === 'number'))) {
            console.warn('Unusable state in localStorage (invalid teams array), clearing state.');
            clearState();
            return null;
        }

        // Validate games array and element structure
        if (!Array.isArray(parsed.games) || !parsed.games.every((g: unknown) => g && typeof g === 'object' && (typeof (g as Record<string, unknown>).id === 'string' || typeof (g as Record<string, unknown>).id === 'number'))) {
            console.warn('Unusable state in localStorage (invalid games array), clearing state.');
            clearState();
            return null;
        }

        // Normalize / apply defaults for non-critical properties
        const currentScreen: ScreenNumber = [0, 1, 2, 3, 4, 5].includes(parsed.currentScreen as number)
            ? (parsed.currentScreen as ScreenNumber)
            : 1;

        const teams: Team[] = (parsed.teams as Record<string, unknown>[]).map(t => ({
            id: String(t.id),
            name: typeof t.name === 'string' ? t.name : '',
            groupId: t.groupId === 'B' ? 'B' : 'A',
        }));

        const games: GameData[] = (parsed.games as Record<string, unknown>[]).map(g => ({
            id: String(g.id),
            groupId: g.groupId === 'B' ? 'B' : 'A',
            teamAId: typeof g.teamAId === 'string' ? g.teamAId : '',
            teamBId: typeof g.teamBId === 'string' ? g.teamBId : '',
            teamAName: typeof g.teamAName === 'string' ? g.teamAName : '',
            teamBName: typeof g.teamBName === 'string' ? g.teamBName : '',
            runsA: typeof g.runsA === 'number' && !isNaN(g.runsA) ? g.runsA : null,
            runsB: typeof g.runsB === 'number' && !isNaN(g.runsB) ? g.runsB : null,
            inningsABatting: typeof g.inningsABatting === 'string' ? g.inningsABatting : '',
            inningsADefense: typeof g.inningsADefense === 'string' ? g.inningsADefense : '',
            inningsBBatting: typeof g.inningsBBatting === 'string' ? g.inningsBBatting : '',
            inningsBDefense: typeof g.inningsBDefense === 'string' ? g.inningsBDefense : '',
            earnedRunsA: typeof g.earnedRunsA === 'number' && !isNaN(g.earnedRunsA) ? g.earnedRunsA : null,
            earnedRunsB: typeof g.earnedRunsB === 'number' && !isNaN(g.earnedRunsB) ? g.earnedRunsB : null,
            isLocked: Boolean(g.isLocked),
        }));

        const tieBreakMethod: TieBreakMethod = ['WIN_LOSS', 'HEAD_TO_HEAD', 'TQB', 'ER_TQB', 'UNRESOLVED'].includes(parsed.tieBreakMethod as string)
            ? (parsed.tieBreakMethod as TieBreakMethod)
            : 'WIN_LOSS';


        return {
            version: typeof parsed.version === 'number' ? parsed.version : 0,
            currentScreen,
            teams,
            games,
            rankings: Array.isArray(parsed.rankings) ? parsed.rankings : [],
            tieBreakMethod,
            needsERTQB: Boolean(parsed.needsERTQB),
            hasUnresolvedTies: Boolean(parsed.hasUnresolvedTies),
            isMultiGroup: Boolean(parsed.isMultiGroup),
            groupTieBreakMethod: typeof parsed.groupTieBreakMethod === 'object' && parsed.groupTieBreakMethod !== null ? parsed.groupTieBreakMethod : {},
        };
    } catch (error) {
        console.error('Unexpected error loading state from localStorage:', error);
        clearState();
        return null;
    }
};

export const hasSavedState = (): boolean => {
    if (typeof window === 'undefined') return false;
    const state = loadState();
    if (!state) return false;

    const hasTeamNames = state.teams.some(t => t.name.trim().length > 0);
    const hasGames = state.games.length > 0;

    return state.currentScreen > 0 && (hasTeamNames || hasGames);
};
