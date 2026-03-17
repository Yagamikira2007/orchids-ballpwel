export interface Author {
  name: string;
  url: string;
  logo: string;
  referer?: string;
}

export interface Match {
  id: string;
  view_url: string;
  label: string;
  time: string;
  home_logo: string;
  home_name: string;
  score: string;
  away_logo: string;
  away_name: string;
  url: string;
  authors: Author[];
  match_status?: string;
  match_timestamp?: number;
}

export type MatchStatus = 'live' | 'upcoming' | 'finished';

export interface MatchFilters {
  status: 'all' | MatchStatus;
  searchQuery: string;
  competition: string;
}
