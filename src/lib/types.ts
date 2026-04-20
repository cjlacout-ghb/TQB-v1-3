// Type definitions for TQB Calculator

export type TeamID = string;
export type GroupID = 'A' | 'B';
export type GameID = string;

export interface Team {
    id: TeamID;
    name: string;
    groupId: GroupID; // Assigned by active UI tab at moment of entry; not in any file format
}

export interface GameData {
    id: GameID;
    groupId: GroupID; // Derived from the group of the participating teams
    teamAId: TeamID;
    teamBId: TeamID;
    teamAName: string;
    teamBName: string;
    runsA: number | null;
    runsB: number | null;
    inningsABatting: string;
    inningsADefense: string;
    inningsBBatting: string;
    inningsBDefense: string;
    earnedRunsA: number | null;
    earnedRunsB: number | null;
}

export interface TeamStats {
    id: string;
    name: string;
    wins: number;
    losses: number;
    winPercentage: number;
    runsScored: number;
    runsAllowed: number;
    inningsAtBatOuts: number;  // Total outs when batting
    inningsOnDefenseOuts: number;  // Total outs when on defense
    earnedRunsScored: number;
    earnedRunsAllowed: number;
    tqb: number;
    erTqb: number;
    groupId?: GroupID; // Tagged when computed in multi-group mode; absent in single-group
}

export interface RankingResult {
    rankings: TeamStats[];
    tieBreakMethod: TieBreakMethod;
    hasTies: boolean;
    needsERTQB: boolean;
}

export type TieBreakMethod =
    | 'WIN_LOSS'
    | 'HEAD_TO_HEAD'
    | 'TQB'
    | 'ER_TQB'
    | 'UNRESOLVED';

export type ScreenNumber = 0 | 1 | 2 | 3 | 4 | 5;

export interface AppState {
    currentScreen: ScreenNumber;
    teams: Team[];
    games: GameData[];
    rankings: TeamStats[];
    tieBreakMethod: TieBreakMethod;
    needsERTQB: boolean;
    hasUnresolvedTies: boolean;
    isMultiGroup: boolean; // Persisted — defines tournament structure
    groupTieBreakMethod?: Partial<Record<GroupID, TieBreakMethod>>; // Per-group tie-break metadata
    // NOTE: activeGroupId is local UI state only — it is never persisted
}

export interface CSVRow {
    teamA: string;
    teamB: string;
    runsA: number;
    runsB: number;
    earnedRunsA: number;
    earnedRunsB: number;
    inningsABatting: number;
    inningsADefense: number;
    inningsBBatting: number;
    inningsBDefense: number;
}

export interface PDFExportData {
    tournamentName: string;
    date: string;
    rankings: TeamStats[];
    games: GameData[];
    tieBreakMethod: TieBreakMethod;
    useERTQB: boolean;
    language: Language;
    /** Multi-group mode: when true the generator renders two labeled sections */
    isMultiGroup?: boolean;
    /** Per-group tie-break methods captured at calculation time */
    groupTieBreakMethod?: Partial<Record<GroupID, TieBreakMethod>>;
}

export type Language = 'en' | 'es';

export interface UserManualSection {
    id: string;
    title: string;
    content: string;
}
