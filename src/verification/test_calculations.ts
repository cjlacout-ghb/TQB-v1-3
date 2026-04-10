import { calculateRankings, inningsToOuts } from '../lib/calculations';
import { GameData, TeamStats } from '../lib/types';

function runTest() {
    console.log('--- Starting TQB Calculation Tests ---');

    // Test 1: Innings conversion
    console.log('Test 1: Innings to Outs conversion');
    const cases = [
        { in: 7, out: 21 },
        { in: 7.1, out: 22 },
        { in: 7.2, out: 23 },
        { in: '6.1', out: 19 },
    ];
    for (const c of cases) {
        const result = inningsToOuts(c.in);
        if (result !== c.out) {
            console.error(`❌ Failed: ${c.in} -> expected ${c.out}, got ${result}`);
        } else {
            console.log(`✅ Passed: ${c.in} -> ${result}`);
        }
    }

    // Test 2: Basic 3-way tie
    console.log('\nTest 2: Basic 3-way tie resolution (H2H)');
    const teams = [
        { id: 'T1', name: 'Team 1' },
        { id: 'T2', name: 'Team 2' },
        { id: 'T3', name: 'Team 3' },
    ];

    // T1 beats T2 (5-2)
    // T2 beats T3 (5-2)
    // T3 beats T1 (5-2)
    // All are 1-1, and 5-5 runs. TQB should be 0.
    const games: GameData[] = [
        {
            id: 'g1', teamAId: 'T1', teamBId: 'T2', teamAName: 'T1', teamBName: 'T2',
            runsA: 5, runsB: 2, inningsABatting: '7', inningsADefense: '7',
            inningsBBatting: '7', inningsBDefense: '7', earnedRunsA: 0, earnedRunsB: 0
        },
        {
            id: 'g2', teamAId: 'T2', teamBId: 'T3', teamAName: 'T2', teamBName: 'T3',
            runsA: 5, runsB: 2, inningsABatting: '7', inningsADefense: '7',
            inningsBBatting: '7', inningsBDefense: '7', earnedRunsA: 0, earnedRunsB: 0
        },
        {
            id: 'g3', teamAId: 'T3', teamBId: 'T1', teamAName: 'T3', teamBName: 'T1',
            runsA: 5, runsB: 2, inningsABatting: '7', inningsADefense: '7',
            inningsBBatting: '7', inningsBDefense: '7', earnedRunsA: 0, earnedRunsB: 0
        }
    ];

    const result = calculateRankings(teams, games, false);
    console.log(`TieBreak Method: ${result.tieBreakMethod}`);
    
    if (result.hasTies) {
        console.log('✅ Identified persistent tie (correct for this case)');
    }

    // Test 3: TQB Break
    console.log('\nTest 3: TQB Breaking 3-way tie');
    // Change G1: T1 beats T2 10-2 instead of 5-2
    games[0].runsA = 10;
    
    const result2 = calculateRankings(teams, games, false);
    console.log(`TieBreak Method: ${result2.tieBreakMethod}`);
    console.log('Rankings:');
    result2.rankings.forEach((r, i) => console.log(`${i+1}. ${r.name} (TQB: ${r.tqb.toFixed(4)})`));

    const topTeam = result2.rankings[0];
    if (topTeam.id === 'T1' && topTeam.tqb > 0) {
        console.log('✅ T1 correctly ranked #1 due to high TQB');
    } else {
        console.error('❌ TQB resolution failed');
    }

    console.log('\n--- Tests Completed ---');
}

runTest();
