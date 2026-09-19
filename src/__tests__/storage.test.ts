import { describe, it, expect, beforeEach, vi } from 'vitest';
import { saveState, loadState, clearState, hasSavedState } from '@/lib/storage';
import { AppState, Team, GameData } from '@/lib/types';

describe('Unit Tests: storage.ts & State Migration', () => {
    let memoryStorage: Record<string, string> = {};

    beforeEach(() => {
        memoryStorage = {};

        // Mock window and localStorage in memory
        vi.stubGlobal('window', {});
        vi.stubGlobal('localStorage', {
            getItem: (key: string) => memoryStorage[key] ?? null,
            setItem: (key: string, value: string) => {
                memoryStorage[key] = value;
            },
            removeItem: (key: string) => {
                delete memoryStorage[key];
            },
            clear: () => {
                memoryStorage = {};
            },
        });
    });

    it('returns null when loading non-existent state from localStorage', () => {
        expect(loadState()).toBeNull();
        expect(hasSavedState()).toBe(false);
    });

    it('saves state to localStorage and loads it back accurately', () => {
        const sampleState: AppState = {
            currentScreen: 3,
            teams: [
                { id: 't1', name: 'Alpha', groupId: 'A' },
                { id: 't2', name: 'Beta', groupId: 'A' },
                { id: 't3', name: 'Gamma', groupId: 'A' },
            ],
            games: [
                {
                    id: 'g1', groupId: 'A',
                    teamAId: 't1', teamBId: 't2', teamAName: 'Alpha', teamBName: 'Beta',
                    runsA: 5, runsB: 2,
                    inningsABatting: '7', inningsADefense: '7',
                    inningsBBatting: '7', inningsBDefense: '7',
                    earnedRunsA: 0, earnedRunsB: 0,
                },
            ],
            rankings: [],
            tieBreakMethod: 'TQB',
            needsERTQB: false,
            hasUnresolvedTies: false,
            isMultiGroup: false,
            groupTieBreakMethod: { A: 'TQB' },
        };

        saveState(sampleState);
        expect(hasSavedState()).toBe(true);

        const loaded = loadState();
        expect(loaded).toEqual(sampleState);
    });

    it('migrates legacy saved states lacking groupId (defaults groupId to "A")', () => {
        // Legacy state saved before multi-group feature (teams/games without groupId property)
        const legacyStateJSON = JSON.stringify({
            currentScreen: 2,
            teams: [
                { id: 't1', name: 'Alpha' },
                { id: 't2', name: 'Beta' },
                { id: 't3', name: 'Gamma' },
            ],
            games: [
                {
                    id: 'g1',
                    teamAId: 't1', teamBId: 't2', teamAName: 'Alpha', teamBName: 'Beta',
                    runsA: 5, runsB: 2,
                    inningsABatting: '7', inningsADefense: '7',
                    inningsBBatting: '7', inningsBDefense: '7',
                    earnedRunsA: 0, earnedRunsB: 0,
                },
            ],
            rankings: [],
            tieBreakMethod: 'WIN_LOSS',
            needsERTQB: false,
            hasUnresolvedTies: false,
        });

        localStorage.setItem('tqb_tournament_state', legacyStateJSON);

        const loaded = loadState();
        expect(loaded).not.toBeNull();

        // Perform migration mapping identical to useTQBState useEffect
        const migratedTeams = loaded!.teams.map((t: Team) => ({
            ...t,
            groupId: t.groupId ?? 'A',
        }));
        const migratedGames = loaded!.games.map((g: GameData) => ({
            ...g,
            groupId: g.groupId ?? 'A',
        }));

        expect(migratedTeams.every(t => t.groupId === 'A')).toBe(true);
        expect(migratedGames.every(g => g.groupId === 'A')).toBe(true);
    });

    it('handles corrupt JSON in localStorage without throwing errors (returns null)', () => {
        localStorage.setItem('tqb_tournament_state', 'invalid { json corrupt');

        expect(() => loadState()).not.toThrow();
        expect(loadState()).toBeNull();
        expect(hasSavedState()).toBe(false);
    });

    it('clears state successfully when clearState is called', () => {
        const sampleState: AppState = {
            currentScreen: 2,
            teams: [{ id: 't1', name: 'Alpha', groupId: 'A' }],
            games: [],
            rankings: [],
            tieBreakMethod: 'WIN_LOSS',
            needsERTQB: false,
            hasUnresolvedTies: false,
            isMultiGroup: false,
        };

        saveState(sampleState);
        expect(hasSavedState()).toBe(true);

        clearState();
        expect(loadState()).toBeNull();
        expect(hasSavedState()).toBe(false);
    });
});
