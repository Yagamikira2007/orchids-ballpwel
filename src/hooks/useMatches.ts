import { useQuery } from '@tanstack/react-query';
import { footballAPI } from '@/services/api';
import { Match, MatchStatus, MatchFilters } from '@/types';

export const getMatchStatus = (score: string, time: string, matchStatus?: string): MatchStatus => {
  // Use the API-provided status directly if available
  if (matchStatus === 'live') return 'live';
  if (matchStatus === 'finished') return 'finished';
  if (matchStatus === 'upcoming') return 'upcoming';

  // Fallback: Check for explicit live indicators
  const timeLower = time.toLowerCase().trim();
  if (timeLower.includes('live') || timeLower.includes("'") || timeLower.includes('ht') || timeLower.includes('half')) {
    return 'live';
  }

  const hasRealScore = score && score !== 'vs' && score !== '-' && /\d+\s*-\s*\d+/.test(score);
  if (hasRealScore) return 'live';

  return 'upcoming';
};

export const useMatches = (filters?: Partial<MatchFilters>) => {
  return useQuery({
    queryKey: ['matches'],
    queryFn: footballAPI.getMatches,
    
    select: (data: Match[]) => {
      let filtered = [...data];
      
      if (filters?.status && filters.status !== 'all') {
        filtered = filtered.filter(
          (match) => getMatchStatus(match.score, match.time, match.match_status) === filters.status
        );
      }
      
      if (filters?.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        filtered = filtered.filter(
          (match) =>
            match.home_name.toLowerCase().includes(query) ||
            match.away_name.toLowerCase().includes(query) ||
            match.label.toLowerCase().includes(query)
        );
      }
      
      if (filters?.competition && filters.competition !== 'all') {
        filtered = filtered.filter(
          (match) => match.label === filters.competition
        );
      }
      
      return filtered;
    },
  });
};

export const useMatch = (matchId: string | undefined) => {
  const { data: matches } = useMatches();
  
  return matches?.find((match) => match.id === matchId);
};
