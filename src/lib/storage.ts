import { AppState } from './types';

const STORAGE_KEY = 'tqb_tournament_state';

export const saveState = (state: AppState): void => {
    if (typeof window === 'undefined') return;
    try {
        const serializedState = JSON.stringify(state);
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
        return JSON.parse(serializedState) as AppState;
    } catch (error) {
        console.error('Error loading state from localStorage:', error);
        return null;
    }
};

export const clearState = (): void => {
    if (typeof window === 'undefined') return;
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
        console.error('Error clearing state from localStorage:', error);
    }
};

export const hasSavedState = (): boolean => {
    if (typeof window === 'undefined') return false;
    const item = localStorage.getItem(STORAGE_KEY);
    if (!item) return false;
    
    try {
        const state = JSON.parse(item) as AppState;
        // Consider a state "continuable" only if it's past the landing screen
        // AND has either team names filled or games entered
        const hasTeamNames = state.teams && state.teams.some(t => t.name.trim().length > 0);
        const hasGames = state.games && state.games.length > 0;
        
        return state.currentScreen > 0 && (hasTeamNames || hasGames);
    } catch (error) {
        return false;
    }
};

