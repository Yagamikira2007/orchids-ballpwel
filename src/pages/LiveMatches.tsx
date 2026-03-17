import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { footballAPI } from '@/services/api';
import { getMatchStatus } from '@/hooks/useMatches';
import MatchList from '@/components/matches/MatchList';
import { Zap, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const LiveMatches = () => {
  const { data: allMatches, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['matches'],
    queryFn: footballAPI.getMatches,
    
  });

  const liveMatches = useMemo(() => {
    if (!allMatches) return [];
    return allMatches.filter((match) => getMatchStatus(match.score, match.time, match.match_status) === 'live');
  }, [allMatches]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-live/20 animate-scale-in">
            <Zap className="w-6 h-6 text-live animate-pulse" />
          </div>
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold animate-slide-up text-foreground">
              Live Matches
            </h1>
            <p className="text-muted-foreground animate-slide-up [animation-delay:100ms] [animation-fill-mode:backwards]">
              {liveMatches.length} match{liveMatches.length !== 1 ? 'es' : ''} happening now
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

      {/* Match List */}
      <MatchList
        matches={liveMatches}
        isLoading={isLoading}
        error={error as Error}
      />
    </div>
  );
};

export default LiveMatches;
