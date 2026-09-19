import { describe, it, expect } from 'vitest';
import { parseCSV, shouldConfirmImport } from '@/lib/csvParser';
import { MIN_TEAMS, MAX_TEAMS } from '@/lib/constants';
import { translations } from '@/data/translations';
import { Team, GameData } from '@/lib/types';

describe('Unit Tests: csvParser.ts', () => {
    const tEn = translations.en;
    const tEs = translations.es;

    describe('Delimiter Detection', () => {
        it('parses CSV with comma (,) delimiter', () => {
            const csv = [
                'Team A,Team B,Runs A,Runs B,Earned Runs A,Earned Runs B,Innings A Batting,Innings A Defense,Innings B Batting,Innings B Defense',
                'Alpha,Beta,5,2,4,1,7,7,7,7',
                'Beta,Gamma,5,2,4,1,7,7,7,7',
                'Gamma,Alpha,5,2,4,1,7,7,7,7',
            ].join('\n');

            const result = parseCSV(csv, tEn);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.teams).toHaveLength(3);
                expect(result.games).toHaveLength(3);
            }
        });

        it('parses CSV with semicolon (;) delimiter', () => {
            const csv = [
                'Team A;Team B;Runs A;Runs B;Earned Runs A;Earned Runs B;Innings A Batting;Innings A Defense;Innings B Batting;Innings B Defense',
                'Alpha;Beta;5;2;4;1;7;7;7;7',
                'Beta;Gamma;5;2;4;1;7;7;7;7',
                'Gamma;Alpha;5;2;4;1;7;7;7;7',
            ].join('\n');

            const result = parseCSV(csv, tEn);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.teams).toHaveLength(3);
                expect(result.games).toHaveLength(3);
            }
        });
    });

    describe('Header Aliases (English & Spanish)', () => {
        it('parses CSV using English headers', () => {
            const csv = [
                'Team A,Team B,Runs A,Runs B,Earned Runs A,Earned Runs B,Innings A Batting,Innings A Defense,Innings B Batting,Innings B Defense',
                'Team Red,Team Blue,3,1,2,1,7,7,7,7',
                'Team Blue,Team Green,4,2,3,2,7,7,7,7',
                'Team Green,Team Red,5,3,4,3,7,7,7,7',
            ].join('\n');

            const result = parseCSV(csv, tEn);
            expect(result.success).toBe(true);
            if (result.success) {
                const teamNames = result.teams.map(t => t.name);
                expect(teamNames).toContain('Team Red');
                expect(teamNames).toContain('Team Blue');
                expect(teamNames).toContain('Team Green');
            }
        });

        it('parses CSV using Spanish header aliases (Equipo_A, Carreras_A, Carreras_Limpias_A, Entradas_A_Bateo)', () => {
            const csv = [
                'Equipo_A,Equipo_B,Carreras_A,Carreras_B,Carreras_Limpias_A,Carreras_Limpias_B,Entradas_A_Bateo,Entradas_A_Defensa,Entradas_B_Bateo,Entradas_B_Defensa',
                'Rojos,Azules,3,1,2,1,7,7,7,7',
                'Azules,Verdes,4,2,3,2,7,7,7,7',
                'Verdes,Rojos,5,3,4,3,7,7,7,7',
            ].join('\n');

            const result = parseCSV(csv, tEs);
            expect(result.success).toBe(true);
            if (result.success) {
                const teamNames = result.teams.map(t => t.name);
                expect(teamNames).toContain('Rojos');
                expect(teamNames).toContain('Azules');
                expect(teamNames).toContain('Verdes');
            }
        });
    });

    describe('Row & Innings Validation Errors', () => {
        it('returns error when file is empty or missing headers', () => {
            const result = parseCSV('', tEn);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.errors.length).toBeGreaterThan(0);
            }
        });

        it('returns per-row error for invalid runs or innings format', () => {
            const csv = [
                'Team A,Team B,Runs A,Runs B,Earned Runs A,Earned Runs B,Innings A Batting,Innings A Defense,Innings B Batting,Innings B Defense',
                'Alpha,Beta,INVALID_RUNS,2,4,1,7,7,7,7',
                'Beta,Gamma,5,2,4,1,7.3,7,7,7', // 7.3 is invalid innings format
            ].join('\n');

            const result = parseCSV(csv, tEn);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.errors.some(err => err.includes('Row 2') || err.includes('Fila 2'))).toBe(true);
                expect(result.errors.some(err => err.includes('Row 3') || err.includes('Fila 3'))).toBe(true);
            }
        });

        it(`returns error if fewer than MIN_TEAMS (${MIN_TEAMS}) unique teams are in the file`, () => {
            const csv = [
                'Team A,Team B,Runs A,Runs B,Earned Runs A,Earned Runs B,Innings A Batting,Innings A Defense,Innings B Batting,Innings B Defense',
                'Alpha,Beta,5,2,4,1,7,7,7,7',
                'Beta,Alpha,3,4,2,3,7,7,7,7',
            ].join('\n');

            const result = parseCSV(csv, tEn);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.errors.some(err => err.includes(String(MIN_TEAMS)))).toBe(true);
            }
        });

        it(`accepts exactly MAX_TEAMS (${MAX_TEAMS}) unique teams (boundary: maximum allowed)`, () => {
            const header = 'Team A,Team B,Runs A,Runs B,Earned Runs A,Earned Runs B,Innings A Batting,Innings A Defense,Innings B Batting,Innings B Defense';
            const teamNames = Array.from({ length: MAX_TEAMS }, (_, i) => `T${i + 1}`);
            const rows = teamNames.slice(1).map(t => `T1,${t},5,2,4,1,7,7,7,7`);
            const csv = [header, ...rows].join('\n');
            const result = parseCSV(csv, tEn);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.teams).toHaveLength(MAX_TEAMS);
            }
        });

        it(`rejects MAX_TEAMS + 1 (${MAX_TEAMS + 1}) unique teams (boundary: one over maximum)`, () => {
            const header = 'Team A,Team B,Runs A,Runs B,Earned Runs A,Earned Runs B,Innings A Batting,Innings A Defense,Innings B Batting,Innings B Defense';
            const teamNames = Array.from({ length: MAX_TEAMS + 1 }, (_, i) => `T${i + 1}`);
            const rows = teamNames.slice(1).map(t => `T1,${t},5,2,4,1,7,7,7,7`);
            const csv = [header, ...rows].join('\n');
            const result = parseCSV(csv, tEn);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.errors.some(e => e.includes(String(MAX_TEAMS)))).toBe(true);
            }
        });

        it(`multi-group: group with ${MAX_TEAMS} teams accepted, group with ${MAX_TEAMS + 1} teams rejected`, () => {
            const header = 'Team A,Team B,Runs A,Runs B,Earned Runs A,Earned Runs B,Innings A Batting,Innings A Defense,Innings B Batting,Innings B Defense';

            // Group A import: MAX_TEAMS teams — should succeed
            const teamNamesA = Array.from({ length: MAX_TEAMS }, (_, i) => `T${i + 1}`);
            const groupARows = teamNamesA.slice(1).map(t => `T1,${t},5,2,4,1,7,7,7,7`);
            const csvA = [header, ...groupARows].join('\n');
            const resA = parseCSV(csvA, tEn);
            expect(resA.success).toBe(true);
            if (resA.success) {
                expect(resA.teams).toHaveLength(MAX_TEAMS);
            }

            // Group B import: MAX_TEAMS + 1 teams — should fail
            const teamNamesB = Array.from({ length: MAX_TEAMS + 1 }, (_, i) => `U${i + 1}`);
            const groupBRows = teamNamesB.slice(1).map(u => `U1,${u},5,2,4,1,7,7,7,7`);
            const csvB = [header, ...groupBRows].join('\n');
            const resB = parseCSV(csvB, tEn);
            expect(resB.success).toBe(false);
            if (!resB.success) {
                expect(resB.errors.some(e => e.includes(String(MAX_TEAMS)))).toBe(true);
            }
        });
    });

    // -------------------------------------------------------------
    // FASE 4c: Import Replacement Confirmation Decision Logic
    // -------------------------------------------------------------
    describe('FASE 4c: Import Replacement Confirmation Decision (shouldConfirmImport)', () => {
        it('returns needsConfirmation: false when target group has only blank teams and no game results', () => {
            const initialTeams: Team[] = [
                { id: 't1', name: '', groupId: 'A' },
                { id: 't2', name: '   ', groupId: 'A' },
                { id: 't3', name: '', groupId: 'A' },
            ];
            const games: GameData[] = [];

            const result = shouldConfirmImport(initialTeams, games, 'A', false);
            expect(result.needsConfirmation).toBe(false);
            expect(result.teamCount).toBe(0);
            expect(result.hasGameResults).toBe(false);
        });

        it('returns needsConfirmation: true when target group contains at least one named team', () => {
            const teamsWithOneNamed: Team[] = [
                { id: 't1', name: 'Tigres', groupId: 'A' },
                { id: 't2', name: '', groupId: 'A' },
                { id: 't3', name: '', groupId: 'A' },
            ];
            const games: GameData[] = [];

            const result = shouldConfirmImport(teamsWithOneNamed, games, 'A', false);
            expect(result.needsConfirmation).toBe(true);
            expect(result.teamCount).toBe(1);
            expect(result.hasGameResults).toBe(false);
        });

        it('returns needsConfirmation: true when target group has entered game results', () => {
            const blankTeams: Team[] = [
                { id: 't1', name: '', groupId: 'A' },
                { id: 't2', name: '', groupId: 'A' },
            ];
            const gamesWithResults: GameData[] = [
                {
                    id: 'g1', groupId: 'A',
                    teamAId: 't1', teamBId: 't2', teamAName: 'T1', teamBName: 'T2',
                    runsA: 5, runsB: 2,
                    inningsABatting: '7', inningsADefense: '7',
                    inningsBBatting: '7', inningsBDefense: '7',
                    earnedRunsA: 4, earnedRunsB: 1,
                },
            ];

            const result = shouldConfirmImport(blankTeams, gamesWithResults, 'A', false);
            expect(result.needsConfirmation).toBe(true);
            expect(result.hasGameResults).toBe(true);
        });

        it('multi-group isolation: confirmation for target group B depends only on Group B data, ignoring Group A', () => {
            const multiGroupTeams: Team[] = [
                { id: 'ta1', name: 'Group A Team 1', groupId: 'A' },
                { id: 'ta2', name: 'Group A Team 2', groupId: 'A' },
                { id: 'tb1', name: '', groupId: 'B' },
                { id: 'tb2', name: '', groupId: 'B' },
            ];
            const games: GameData[] = [];

            // Importing into Group B (targetGroupId = 'B'): Group B has no named teams -> needsConfirmation is FALSE
            const resB = shouldConfirmImport(multiGroupTeams, games, 'B', true);
            expect(resB.needsConfirmation).toBe(false);
            expect(resB.teamCount).toBe(0);

            // Importing into Group A (targetGroupId = 'A'): Group A has 2 named teams -> needsConfirmation is TRUE
            const resA = shouldConfirmImport(multiGroupTeams, games, 'A', true);
            expect(resA.needsConfirmation).toBe(true);
            expect(resA.teamCount).toBe(2);
        });
    });
});

