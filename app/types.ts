export interface TeamStats {
  name: string;
  league: string;
  country: string;
  leaguePosition: number;
  wins: number;
  draws: number;
  losses: number;
  goalsScored: number;
  goalsConceded: number;
  goalDiff: number;
  points: number;
  logoUrl: string;
  clubUrl: string;
  clubId: string;
}

export interface QualifiedTeam {
  name: string;
  league: string;
  country: string;
  leaguePosition: number;
  criteria: string[];
  stats: {
    points: number;
    goalDiff: number;
    goalsScored: number;
    goalsConceded: number;
  };
  logoUrl: string;
  clubUrl: string;
  clubId: string;
}

export interface PeriodAnalysis {
  period: number;
  teamsAnalyzed: number;
  leaders: {
    top: {
      points: { value: number; teams: string[] };
      goalDiff: { value: number; teams: string[] };
      goalsScored: { value: number; teams: string[] };
      goalsConceded: { value: number; teams: string[] };
    };
    bottom: {
      points: { value: number; teams: string[] };
      goalDiff: { value: number; teams: string[] };
      goalsScored: { value: number; teams: string[] };
      goalsConceded: { value: number; teams: string[] };
    };
  };
  topTeams: QualifiedTeam[];
  bottomTeams: QualifiedTeam[];
  hasMatch: boolean;
}

export interface AnalysisResult {
  success: boolean;
  matchedPeriod: number | null;
  analysis: PeriodAnalysis[];
}

export interface ManagerTrivia {
  name: string;
  profileUrl: string;
  ppg: number;
  matches: number;
  years: string; // e.g., "2015-2018"
}

export interface ManagerInfo {
  name: string;
  profileUrl: string;
  appointedDate?: string;
  matches: number;
  ppg: number | null; // null if no matches or "-" in data
  isCurrentManager: boolean;
  ppgRank?: number; // rank among managers with >= matches since 1995 (1 = best)
  totalComparableManagers?: number; // how many managers qualify for comparison
  bestManager?: ManagerTrivia; // best PPG among comparable managers
  worstManager?: ManagerTrivia; // worst PPG among comparable managers
}

export interface InjuredPlayer {
  name: string;
  position: string;
  club: string;
  clubLogoUrl: string;
  injury: string;
  returnDate: string;
  marketValue: string;
  marketValueNum: number;
  imageUrl: string;
  profileUrl: string;
  league: string;
}

export interface TeamFormEntry {
  name: string;
  league: string;
  leaguePosition: number;
  points: number;
  marketValue: string;
  marketValueNum: number;
  marketValueRank: number;
  expectedPoints: number;
  deltaPts: number;
  logoUrl: string;
  clubUrl: string;
  clubId: string;
  manager?: ManagerInfo | null;
}

export interface PlayerStats {
  name: string;
  position: string;
  age: number;
  club: string;
  league: string;
  matches: number;
  goals: number;
  assists: number;
  points: number;
  marketValue: number;
  marketValueDisplay: string;
  profileUrl: string;
  imageUrl: string;
  playerId: string;
  minutes?: number;
  isNewSigning?: boolean;
}

export interface MinutesValuePlayer {
  name: string;
  position: string;
  age: number;
  club: string;
  league: string;
  nationality: string;
  marketValue: number;
  marketValueDisplay: string;
  minutes: number;
  clubMatches: number;
  intlMatches: number;
  totalMatches: number;
  goals: number;
  assists: number;
  imageUrl: string;
  profileUrl: string;
  playerId: string;
  isNewSigning?: boolean;
}

export interface PlayerStatsResult {
  minutes: number;
  appearances: number;
  goals: number;
  assists: number;
  club: string;
  league: string;
  isNewSigning: boolean;
}
