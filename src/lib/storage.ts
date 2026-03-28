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
    return localStorage.getItem(STORAGE_KEY) !== null;
};
