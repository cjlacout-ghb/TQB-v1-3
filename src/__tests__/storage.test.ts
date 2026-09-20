import { describe, it, expect, beforeEach, vi } from 'vitest';
import { saveState, loadState, clearState, hasSavedState, CURRENT_SCHEMA_VERSION } from '@/lib/storage';
import { AppState } from '@/lib/types';

describe('Unit Tests: storage.ts & Defensive Loading (Phase 7)', () => {
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

    it('saves state with current schema version and loads it back accurately', () => {
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
                    isLocked: true,
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
        expect(loaded).not.toBeNull();
        expect(loaded?.version).toBe(CURRENT_SCHEMA_VERSION);
        expect(loaded?.games[0].isLocked).toBe(true);
        expect(loaded?.teams).toHaveLength(3);
    });

    it('clears storage and returns null when teams or games is not an array', () => {
        // Bad state where teams is not an array
        localStorage.setItem('tqb_tournament_state', JSON.stringify({
            currentScreen: 2,
            teams: "not-an-array",
            games: [],
        }));

        expect(loadState()).toBeNull();
        expect(memoryStorage['tqb_tournament_state']).toBeUndefined();
        expect(hasSavedState()).toBe(false);

        // Bad state where games is not an array
        localStorage.setItem('tqb_tournament_state', JSON.stringify({
            currentScreen: 2,
            teams: [{ id: 't1', name: 'Alpha', groupId: 'A' }],
            games: null,
        }));

        expect(loadState()).toBeNull();
        expect(memoryStorage['tqb_tournament_state']).toBeUndefined();
        expect(hasSavedState()).toBe(false);
    });

    it('clears storage and returns null when team or game elements are invalid or lack id', () => {
        localStorage.setItem('tqb_tournament_state', JSON.stringify({
            currentScreen: 2,
            teams: [{ name: 'Team without ID' }],
            games: [],
        }));

        expect(loadState()).toBeNull();
        expect(memoryStorage['tqb_tournament_state']).toBeUndefined();

        localStorage.setItem('tqb_tournament_state', JSON.stringify({
            currentScreen: 2,
            teams: [{ id: 't1', name: 'Alpha' }],
            games: [null], // null element in games
        }));

        expect(loadState()).toBeNull();
        expect(memoryStorage['tqb_tournament_state']).toBeUndefined();
    });

    it('clears storage and returns null when schema version is newer than supported', () => {
        localStorage.setItem('tqb_tournament_state', JSON.stringify({
            version: 99, // Unknown future version
            currentScreen: 2,
            teams: [{ id: 't1', name: 'Alpha', groupId: 'A' }],
            games: [],
        }));

        expect(loadState()).toBeNull();
        expect(memoryStorage['tqb_tournament_state']).toBeUndefined();
        expect(hasSavedState()).toBe(false);
    });

    it('restores legacy state (version 0 / no version field) with safe defaults for missing non-critical fields', () => {
        const legacyStateJSON = JSON.stringify({
            currentScreen: 2,
            teams: [
                { id: 't1', name: 'Alpha' },
                { id: 't2', name: 'Beta' },
            ],
            games: [
                {
                    id: 'g1',
                    teamAId: 't1', teamBId: 't2', teamAName: 'Alpha', teamBName: 'Beta',
                    runsA: 5, runsB: 2,
                    inningsABatting: '7', inningsADefense: '7',
                    inningsBBatting: '7', inningsBDefense: '7',
                },
            ],
            // missing rankings, tieBreakMethod, isMultiGroup, groupTieBreakMethod, version
        });

        localStorage.setItem('tqb_tournament_state', legacyStateJSON);

        const loaded = loadState();
        expect(loaded).not.toBeNull();
        expect(loaded?.version).toBe(0);
        expect(loaded?.teams[0].groupId).toBe('A');
        expect(loaded?.games[0].groupId).toBe('A');
        expect(loaded?.games[0].isLocked).toBe(false);
        expect(loaded?.isMultiGroup).toBe(false);
        expect(loaded?.groupTieBreakMethod).toEqual({});
        expect(loaded?.rankings).toEqual([]);
    });

    it('handles corrupt JSON in localStorage without throwing errors (returns null & clears storage)', () => {
        localStorage.setItem('tqb_tournament_state', 'invalid { json corrupt');

        expect(() => loadState()).not.toThrow();
        expect(loadState()).toBeNull();
        expect(memoryStorage['tqb_tournament_state']).toBeUndefined();
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
