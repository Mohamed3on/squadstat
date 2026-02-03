export interface TeamStats {
  name: string;
  league: string;
  country: string;
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

export interface ManagerInfo {
  name: string;
  profileUrl: string;
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
}
