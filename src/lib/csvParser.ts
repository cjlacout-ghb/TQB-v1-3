// CSV parsing utility for TQB Calculator
import { GameData, Team } from './types';

export interface CSVParseResult {
    success: boolean;
    teams: Team[];
    games: GameData[];
    errors: string[];
}

import { Translation } from '@/data/translations';

/**
 * Parse CSV content into teams and game data
 */
export function parseCSV(content: string, t: Translation): CSVParseResult {
    const errors: string[] = [];
    const teams = new Map<string, Team>();
    const games: GameData[] = [];

    // Split by lines and handle potential empty lines
    const lines = content.trim().split(/\r?\n/).filter(line => line.trim());

    if (lines.length < 2) {
        return {
            success: false,
            teams: [],
            games: [],
            errors: [t.teamEntry.errors.csv.empty],
        };
    }

    // Detect separator (comma or semicolon)
    const firstLine = lines[0];
    const separator = firstLine.includes(';') ? ';' : ',';

    // Parse header and normalize
    const header = lines[0].split(separator).map(h => h.trim().toLowerCase());
    
    // Mapping of expected keys to possible header aliases
    const aliases: Record<string, string[]> = {
        'team_a': ['team_a', 'team a', 'equipo_a', 'equipo a', 'team1', 'team 1'],
        'team_b': ['team_b', 'team b', 'equipo_b', 'equipo b', 'team2', 'team 2'],
        'runs_a': ['runs_a', 'runs a', 'carreras_a', 'carreras a', 'runs1', 'r1'],
        'runs_b': ['runs_b', 'runs b', 'carreras_b', 'carreras b', 'runs2', 'r2'],
        'earned_runs_a': ['earned_runs_a', 'earned runs a', 'carreras_limpias_a', 'cl_a', 'er_a'],
        'earned_runs_b': ['earned_runs_b', 'earned runs b', 'carreras_limpias_b', 'cl_b', 'er_b'],
        'innings_a_batting': ['innings_a_batting', 'innings a batting', 'entradas_a_bateo', 'iab_a'],
        'innings_a_defense': ['innings_a_defense', 'innings a defense', 'entradas_a_defensa', 'iad_a'],
        'innings_b_batting': ['innings_b_batting', 'innings b batting', 'entradas_b_bateo', 'iab_b'],
        'innings_b_defense': ['innings_b_defense', 'innings b defense', 'entradas_b_defensa', 'iad_b']
    };

    const headerIndices: Record<string, number> = {};
    for (const [key, variants] of Object.entries(aliases)) {
        let foundIndex = -1;
        for (const variant of variants) {
            const index = header.indexOf(variant.toLowerCase());
            if (index !== -1) {
                foundIndex = index;
                break;
            }
        }
        
        if (foundIndex === -1) {
            errors.push(t.teamEntry.errors.csv.missingColumn.replace('{column}', key));
        } else {
            headerIndices[key] = foundIndex;
        }
    }

    if (errors.length > 0) {
        return { success: false, teams: [], games: [], errors };
    }

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = line.split(separator).map(v => v.trim());
        const rowNum = i + 1;

        try {
            const getValue = (key: string) => values[headerIndices[key]];
            
            const teamAName = getValue('team_a');
            const teamBName = getValue('team_b');
            const runsA = parseInt(getValue('runs_a'), 10);
            const runsB = parseInt(getValue('runs_b'), 10);
            const earnedRunsA = parseInt(getValue('earned_runs_a'), 10);
            const earnedRunsB = parseInt(getValue('earned_runs_b'), 10);
            const inningsABatting = getValue('innings_a_batting');
            const inningsADefense = getValue('innings_a_defense');
            const inningsBBatting = getValue('innings_b_batting');
            const inningsBDefense = getValue('innings_b_defense');

            // Validate team names
            if (!teamAName || !teamBName) {
                errors.push(t.teamEntry.errors.csv.missingNames.replace('{row}', rowNum.toString()));
                continue;
            }

            // Validate runs
            if (isNaN(runsA) || isNaN(runsB) || runsA < 0 || runsB < 0) {
                errors.push(t.teamEntry.errors.csv.invalidRuns.replace('{row}', rowNum.toString()));
                continue;
            }

            // Validate earned runs
            if (isNaN(earnedRunsA) || isNaN(earnedRunsB) || earnedRunsA < 0 || earnedRunsB < 0) {
                errors.push(t.teamEntry.errors.csv.invalidEarnedRuns.replace('{row}', rowNum.toString()));
                continue;
            }

            // Validate innings format
            const inningsRegex = /^(\d+)(\.([12]))?$/;
            if (!inningsRegex.test(inningsABatting) ||
                !inningsRegex.test(inningsADefense) ||
                !inningsRegex.test(inningsBBatting) ||
                !inningsRegex.test(inningsBDefense)) {
                errors.push(t.teamEntry.errors.csv.invalidInnings.replace('{row}', rowNum.toString()));
                continue;
            }

            // Add teams to map
            if (!teams.has(teamAName)) {
                teams.set(teamAName, { id: `team-${teams.size + 1}`, name: teamAName });
            }
            if (!teams.has(teamBName)) {
                teams.set(teamBName, { id: `team-${teams.size + 1}`, name: teamBName });
            }

            const teamA = teams.get(teamAName)!;
            const teamB = teams.get(teamBName)!;

            // Create game data
            games.push({
                id: `game-${games.length + 1}`,
                teamAId: teamA.id,
                teamBId: teamB.id,
                teamAName: teamA.name,
                teamBName: teamB.name,
                runsA,
                runsB,
                inningsABatting,
                inningsADefense,
                inningsBBatting,
                inningsBDefense,
                earnedRunsA,
                earnedRunsB,
            });
        } catch (err) {
            errors.push(t.teamEntry.errors.csv.parseError.replace('{row}', rowNum.toString()).replace('{error}', String(err)));
        }
    }

    // Check team count
    const teamList = Array.from(teams.values());
    if (teamList.length < 3) {
        errors.push(t.teamEntry.errors.csv.minTeams);
    }
    if (teamList.length > 32) { // Allow more teams if imported
        // errors.push(t.teamEntry.errors.csv.maxTeams);
    }

    return {
        success: errors.length === 0,
        teams: teamList,
        games: games,
        errors,
    };
}

/**
 * Generate sample CSV content for the help tooltip
 */
export function getSampleCSV(): string {
    return `Team_A,Team_B,Runs_A,Runs_B,Earned_Runs_A,Earned_Runs_B,Innings_A_Batting,Innings_A_Defense,Innings_B_Batting,Innings_B_Defense
Tigers,Eagles,5,3,4,2,7,6.2,6.2,7
Eagles,Sharks,2,8,1,6,7,7,7,7
Tigers,Sharks,4,4,3,3,7,7,7,7`;
}
