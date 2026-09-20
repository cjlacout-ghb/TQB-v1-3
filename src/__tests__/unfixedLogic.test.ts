import { describe, it, expect } from 'vitest';
import {
    isGameIntegrityValid,
    isGameFinalAndValid,
    areAllGroupsValidForCalculation,
    isTournamentProvisional,
    shouldShowInPlayBadge,
} from '@/lib/calculations';
import { GameData, GroupID } from '@/lib/types';
import { translations } from '@/data/translations';

describe('Unit Tests: Unfixed Match Pure Logic (FASE 10b Task 2)', () => {
    const createGame = (
        id: string,
        runsA: number | null,
        runsB: number | null,
        innA: string,
        innB: string,
        isLocked = false,
        groupId: GroupID = 'A'
    ): GameData => ({
        id,
        groupId,
        teamAId: 't-1',
        teamBId: 't-2',
        teamAName: 'Team A',
        teamBName: 'Team B',
        runsA,
        runsB,
        inningsABatting: innA,
        inningsADefense: innB,
        inningsBBatting: innB,
        inningsBDefense: innA,
        earnedRunsA: 2,
        earnedRunsB: 1,
        isLocked,
    });

    it('correctly classifies 2 unfixed games into ✓ (can lock) and ⚠ (requires fix with specific reason)', () => {
        const game1Valid = createGame('g-1', 5, 3, '7', '7');
        const game2Invalid = createGame('g-2', null, 3, '7', '7'); // missing runsA

        const games = [game1Valid, game2Invalid];

        // Group has 2 unfixed games (> MAX_UNFIXED_GAMES_PER_GROUP)
        expect(areAllGroupsValidForCalculation(games, false)).toBe(false);

        // Partition unfixed games
        const canLockGames: string[] = [];
        const needFixGames: { label: string; reason: string }[] = [];

        games.forEach((g, idx) => {
            const label = `#${idx + 1} ${g.teamAName} vs ${g.teamBName}`;
            if (isGameFinalAndValid(g)) {
                canLockGames.push(label);
            } else {
                const isIntegrity = isGameIntegrityValid(g);
                const reason = isIntegrity
                    ? translations.es.gameEntry.lockBlockedStrict
                    : translations.es.gameEntry.lockBlockedIntegrity;
                needFixGames.push({ label, reason });
            }
        });

        // 1 game can be locked (✓)
        expect(canLockGames).toHaveLength(1);
        expect(canLockGames[0]).toBe('#1 Team A vs Team B');

        // 1 game needs fix (⚠) with integrity reason
        expect(needFixGames).toHaveLength(1);
        expect(needFixGames[0].label).toBe('#2 Team A vs Team B');
        expect(needFixGames[0].reason).toBe(translations.es.gameEntry.lockBlockedIntegrity);
    });

    it('correctly classifies 3 unfixed games (2 valid ✓, 1 invalid ⚠ with strict rule reason)', () => {
        const game1Valid = createGame('g-1', 5, 3, '7', '7');
        const game2Valid = createGame('g-2', 4, 1, '7', '7');
        // Invalid due to strict WBSC end-of-game rule: home team winning (4 > 2) but batted full 7 innings
        const game3InvalidStrict = createGame('g-3', 2, 4, '7', '7');

        const games = [game1Valid, game2Valid, game3InvalidStrict];

        expect(areAllGroupsValidForCalculation(games, false)).toBe(false);

        const canLockGames: string[] = [];
        const needFixGames: { label: string; reason: string }[] = [];

        games.forEach((g, idx) => {
            const label = `#${idx + 1} ${g.teamAName} vs ${g.teamBName}`;
            if (isGameFinalAndValid(g)) {
                canLockGames.push(label);
            } else {
                const isIntegrity = isGameIntegrityValid(g);
                const reason = isIntegrity
                    ? translations.es.gameEntry.lockBlockedStrict
                    : translations.es.gameEntry.lockBlockedIntegrity;
                needFixGames.push({ label, reason });
            }
        });

        // 2 games can be locked (✓)
        expect(canLockGames).toHaveLength(2);
        expect(canLockGames).toEqual(['#1 Team A vs Team B', '#2 Team A vs Team B']);

        // 1 game needs fix (⚠) with strict rule reason
        expect(needFixGames).toHaveLength(1);
        expect(needFixGames[0].reason).toBe(translations.es.gameEntry.lockBlockedStrict);
    });

    it('evaluates calculation clearance (message dismissal) when unfixed games are reduced to <= 1', () => {
        const g1 = createGame('g-1', 5, 3, '7', '7', true); // locked
        const g2 = createGame('g-2', 4, 2, '6.2', '7', false); // 1 unfixed in progress

        const groupGames = [g1, g2];

        // Valid for calculation (1 unfixed allowed)
        expect(areAllGroupsValidForCalculation(groupGames, false)).toBe(true);

        // Tournament is marked provisional because there is 1 in-progress unfixed game
        expect(isTournamentProvisional(groupGames, false)).toBe(true);

        // Badge "En juego" should appear for the single unfixed game
        expect(shouldShowInPlayBadge(groupGames, 'g-2')).toBe(true);
        expect(shouldShowInPlayBadge(groupGames, 'g-1')).toBe(false);
    });
});
