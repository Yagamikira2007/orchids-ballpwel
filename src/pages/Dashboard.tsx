import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { footballAPI } from '@/services/api';
import { Match, MatchFilters } from '@/types';
import { getMatchStatus } from '@/hooks/useMatches';
import { useFavoriteTeams } from '@/hooks/useFavoriteTeams';
import MatchList from '@/components/matches/MatchList';
import { RefreshCw, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DashboardProps {
  filters: MatchFilters;
  onFilterChange: (filters: Partial<MatchFilters>) => void;
}

// Popular leagues shown as tabs - order matters for priority display
const POPULAR_LEAGUES = [
  { key: 'all', label: 'All' },
  { key: 'premier|eng pr|epl|english premier', label: 'EPL' },
  { key: 'champion|ucl', label: 'UCL' },
  { key: 'spa d1|la liga|spanish', label: 'La Liga' },
  { key: 'ita d1|serie a|italian', label: 'Serie A' },
  { key: 'ger d1|bundesliga|german', label: 'Bundesliga' },
  { key: 'fra d1|ligue 1|french', label: 'Ligue 1' },
  { key: 'europa', label: 'Europa' },
  { key: 'eng fac|eng lch|eng', label: 'England' },
  { key: 'hol d1|eredivisie|dutch', label: 'Eredivisie' },
  { key: 'ksa|saudi|arab', label: 'Saudi' },
  { key: 'jpn|j-league|japanese', label: 'J-League' },
  { key: 'kor d1|korean', label: 'K-League' },
  { key: 'aus d1|australian|a-league', label: 'Australia' },
  { key: 'mex d1|liga mx|mexican', label: 'Mexico' },
  { key: 'cha sl|chinese', label: 'China' },
  { key: 'tha|thai', label: 'Thailand' },
  { key: 'vie d1|vietnam', label: 'Vietnam' },
];

const matchesLeague = (label: string, key: string): boolean => {
  if (key === 'all') return true;
  return key.split('|').some(k => label.toLowerCase().includes(k));
};

// Priority order for sorting: popular leagues first
const getLeaguePriority = (label: string): number => {
  for (let i = 1; i < POPULAR_LEAGUES.length; i++) {
    if (matchesLeague(label, POPULAR_LEAGUES[i].key)) return i;
  }
  return 999; // Unknown leagues go last
};

const Dashboard = ({ filters, onFilterChange }: DashboardProps) => {
  const [activeLeague, setActiveLeague] = useState('all');
  const { favorites, toggleFavorite, isFavorite, hasFavoriteTeam } = useFavoriteTeams();

  const { data: allMatches, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['matches'],
    queryFn: footballAPI.getMatches,
    
  });

  const filteredMatches = useMemo(() => {
    if (!allMatches) return [];

    let result = [...allMatches];

    // Filter by selected league tab
    if (activeLeague !== 'all') {
      result = result.filter(match => matchesLeague(match.label, activeLeague));
    }

    // Apply search filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      result = result.filter(
        match =>
          match.home_name.toLowerCase().includes(query) ||
          match.away_name.toLowerCase().includes(query) ||
          match.label.toLowerCase().includes(query)
      );
    }

    // Sort: favorites first, then live, upcoming, finished; within each group, popular leagues first
    return result.sort((a, b) => {
      const aFav = hasFavoriteTeam(a.home_name, a.away_name) ? 0 : 1;
      const bFav = hasFavoriteTeam(b.home_name, b.away_name) ? 0 : 1;
      if (aFav !== bFav) return aFav - bFav;

      const statusOrder = { live: 0, upcoming: 1, finished: 2 };
      const sa = statusOrder[getMatchStatus(a.score, a.time, a.match_status)] ?? 2;
      const sb = statusOrder[getMatchStatus(b.score, b.time, b.match_status)] ?? 2;
      if (sa !== sb) return sa - sb;
      return getLeaguePriority(a.label) - getLeaguePriority(b.label);
    });
  }, [allMatches, activeLeague, filters.searchQuery, favorites]);

  // Only show tabs that have matches
  const availableLeagues = useMemo(() => {
    if (!allMatches) return POPULAR_LEAGUES.slice(0, 1);
    return POPULAR_LEAGUES.filter(league => {
      if (league.key === 'all') return true;
      return allMatches.some(match => matchesLeague(match.label, league.key));
    });
  }, [allMatches]);

  const liveCount = useMemo(() => {
    return filteredMatches.filter(m => getMatchStatus(m.score, m.time, m.match_status) === 'live').length;
  }, [filteredMatches]);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-1">
          <h1 className="font-display text-2xl md:text-3xl font-bold animate-slide-up text-foreground">
            Live Arena
          </h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => refetch()}
            disabled={isFetching}
            className="rounded-xl h-9 w-9 text-muted-foreground animate-fade-in"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <p className="text-muted-foreground text-sm animate-slide-up [animation-delay:100ms] [animation-fill-mode:backwards]">
          Watch the current fixtures and kickoff flow.
          {liveCount > 0 && (
            <span className="ml-2 inline-flex items-center gap-1.5 text-xs font-bold text-destructive animate-scale-in [animation-delay:300ms] [animation-fill-mode:backwards]">
              <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-count-pulse" />
              {liveCount} LIVE
            </span>
          )}
          {favorites.length > 0 && (
            <span className="ml-2 inline-flex items-center gap-1 text-xs font-bold text-yellow-400">
              <Star className="w-3 h-3 fill-yellow-400" />
              {favorites.length}
            </span>
          )}
        </p>
      </div>

      {/* League Tabs - horizontal scroll */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 animate-slide-up [animation-delay:200ms] [animation-fill-mode:backwards]">
        {availableLeagues.map((league, index) => (
          <button
            key={league.key}
            onClick={() => setActiveLeague(league.key)}
            className={`league-tab transition-all duration-300 animate-scale-in ${activeLeague === league.key ? 'active' : ''}`}
            style={{ animationDelay: `${250 + index * 50}ms`, animationFillMode: 'backwards' }}
          >
            {league.label}
          </button>
        ))}
      </div>

      {/* Match List */}
      <MatchList
        matches={filteredMatches}
        isLoading={isLoading}
        error={error as Error}
        isFavorite={isFavorite}
        onToggleFavorite={toggleFavorite}
      />
    </div>
  );
};

export default Dashboard;
