import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { footballAPI } from '@/services/api';
import { getMatchStatus } from '@/hooks/useMatches';
import MatchList from '@/components/matches/MatchList';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const NBA_KEYWORDS = ['nba', 'kbl', 'vtbul', 'tpbl', 'basketball'];

const NBAMatches = () => {
  const { data: allMatches, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['matches'],
    queryFn: footballAPI.getMatches,
    
  });

  const nbaMatches = useMemo(() => {
    if (!allMatches) return [];
    return allMatches
      .filter(match =>
        NBA_KEYWORDS.some(k => match.label.toLowerCase().includes(k))
      )
      .sort((a, b) => {
        const order = { live: 0, upcoming: 1, finished: 2 };
        const sa = order[getMatchStatus(a.score, a.time, a.match_status)] ?? 2;
        const sb = order[getMatchStatus(b.score, b.time, b.match_status)] ?? 2;
        return sa - sb;
      });
  }, [allMatches]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/20 animate-scale-in">
            <span className="text-2xl">🏀</span>
          </div>
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold animate-slide-up text-foreground">
              Basketball
            </h1>
            <p className="text-muted-foreground animate-slide-up [animation-delay:100ms] [animation-fill-mode:backwards]">
              {nbaMatches.length} match{nbaMatches.length !== 1 ? 'es' : ''} available
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <MatchList
        matches={nbaMatches}
        isLoading={isLoading}
        error={error as Error}
      />
    </div>
  );
};

export default NBAMatches;
