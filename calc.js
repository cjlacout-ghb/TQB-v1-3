const fs = require('fs');

const data = `Team_A,Team_B,Runs_A,Runs_B,Earned_Runs_A,Earned_Runs_B,Innings_A_Batting,Innings_A_Defense,Innings_B_Batting,Innings_B_Defense
ATSA FEM,TALLERES,0,8,0,8,4,3,3,4
ESTUDIANTES,ORO VERDE,4,3,3,3,5,5,5,5
ATSA FEM,PATRONATO,1,6,1,6,5,4,4,5
DON BOSCO,ORO VERDE,4,2,4,2,5,5,5,5
ATSA FEM,ATSA MIXTO,6,7,6,7,4,3,3,4
ATSA MIXTO,TALLERES,5,2,5,2,6,6,6,6
DON BOSCO,ESTUDIANTES,16,1,16,1,3,3,3,3
ATSA MIXTO,ORO VERDE,2,3,2,3,8,7,7,8
PATRONATO,ESTUDIANTES,5,4,1,0,6,6,6,6
TALLERES,ORO VERDE,8,1,8,1,5,5,5,5
DON BOSCO,PATRONATO,4,3,1,0,7,7,7,7
ATSA FEM,ESTUDIANTES,2,10,2,8,4,3.2,3.2,4
DON BOSCO,ATSA FEM,10,0,9,0,3,3,3,3`;

function parseInnings(val) {
    let num = Number(val);
    let intPart = Math.floor(num);
    let decPart = num - intPart;
    if (Math.abs(decPart - 0.1) < 0.01) return intPart + 1/3;
    if (Math.abs(decPart - 0.2) < 0.01) return intPart + 2/3;
    return num;
}

const teams = {};

data.trim().split('\n').slice(1).forEach(line => {
    let [tA, tB, rA, rB, erA, erB, ibA, idA, ibB, idB] = line.split(',');
    
    rA = Number(rA);
    rB = Number(rB);
    erA = Number(erA);
    erB = Number(erB);
    ibA = parseInnings(Number(ibA));
    idA = parseInnings(Number(idA));
    ibB = parseInnings(Number(ibB));
    idB = parseInnings(Number(idB));

    if (!teams[tA]) teams[tA] = { name: tA, w: 0, l: 0, rs: 0, ra: 0, ers: 0, era: 0, ib: 0, id: 0, h2h: {} };
    if (!teams[tB]) teams[tB] = { name: tB, w: 0, l: 0, rs: 0, ra: 0, ers: 0, era: 0, ib: 0, id: 0, h2h: {} };

    teams[tA].rs += rA;
    teams[tA].ra += rB;
    teams[tA].ers += erA;
    teams[tA].era += erB;
    teams[tA].ib += ibA;
    teams[tA].id += idA;

    teams[tB].rs += rB;
    teams[tB].ra += rA;
    teams[tB].ers += erB;
    teams[tB].era += erA;
    teams[tB].ib += ibB;
    teams[tB].id += idB;

    if (!teams[tA].h2h[tB]) teams[tA].h2h[tB] = { w: 0, l: 0 };
    if (!teams[tB].h2h[tA]) teams[tB].h2h[tA] = { w: 0, l: 0 };

    if (rA > rB) {
        teams[tA].w++;
        teams[tB].l++;
        teams[tA].h2h[tB].w++;
    } else {
        teams[tB].w++;
        teams[tA].l++;
        teams[tB].h2h[tA].w++;
    }
});

let sorted = Object.values(teams);
sorted.forEach(t => {
    t.winPct = t.w / (t.w + t.l);
    t.tqb = (t.rs / t.ib) - (t.ra / t.id);
    t.er_tqb = (t.ers / t.ib) - (t.era / t.id);
});

sorted.sort((a, b) => {
    if (b.winPct !== a.winPct) return b.winPct - a.winPct;
    return b.tqb - a.tqb; 
});

console.log("Overall Standings based on Record, then Overall TQB (informative):");
console.table(sorted.map((t, i) => ({
    Rank: i + 1,
    Team: t.name,
    W: t.w,
    L: t.l,
    WPCT: t.winPct.toFixed(3),
    TQB: t.tqb.toFixed(3) // Note: actual TQB tie-breaker should consider only tied teams games!
})));

// WBSC tie-breaking logic helper for an array of teams
function getTiebreaker(tiedTeamNames) {
    console.log("\\n--- Tiebreaker for:", tiedTeamNames.join(', '), "---");
    
    // Filter games among these teams only
    const ttGames = data.trim().split('\n').slice(1).filter(line => {
        let [tA, tB] = line.split(',');
        return tiedTeamNames.includes(tA) && tiedTeamNames.includes(tB);
    });
    console.log("Games among them:", ttGames.length);
    if(ttGames.length === 0){
        console.log("No games played among these teams! Cannot use H2H/TQB without cross-pool rules.");
        return;
    }
    
    // Calculate stats between them
    const tStats = {};
    tiedTeamNames.forEach(tn => { tStats[tn] = { name: tn, w: 0, l: 0, rs: 0, ra: 0, ib: 0, id: 0 }; });

    ttGames.forEach(line => {
        let [tA, tB, rA, rB, erA, erB, ibA, idA, ibB, idB] = line.split(',');
        rA = Number(rA); rB = Number(rB);
        ibA = parseInnings(Number(ibA)); idA = parseInnings(Number(idA));
        ibB = parseInnings(Number(ibB)); idB = parseInnings(Number(idB));

        tStats[tA].rs += rA; tStats[tA].ra += rB; tStats[tA].ib += ibA; tStats[tA].id += idA;
        tStats[tB].rs += rB; tStats[tB].ra += rA; tStats[tB].ib += ibB; tStats[tB].id += idB;

        if (rA > rB) { tStats[tA].w++; tStats[tB].l++; } else { tStats[tB].w++; tStats[tA].l++; }
    });

    tiedTeamNames.forEach(tn => {
        let t = tStats[tn];
        t.winPct = t.w / (t.w + Math.max(1, t.l)); // basic pct
        t.tqb = (t.ib > 0 ? t.rs / t.ib : 0) - (t.id > 0 ? t.ra / t.id : 0);
    });

    let ts = Object.values(tStats).sort((a,b) => {
        if (b.w !== a.w) return b.w - a.w;
        return b.tqb - a.tqb;
    });

    console.table(ts.map(t => ({ Team: t.name, H2H_W: t.w, H2H_L: t.l, TQB: t.tqb.toFixed(4) })));
}

// 2-1 tie
getTiebreaker(["ATSA MIXTO", "PATRONATO", "TALLERES"]);

// 2-2 tie
// Well, there's only one 2-2 team: ESTUDIANTES. So no tie.
