import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { footballAPI } from '@/services/api';
import { getMatchStatus } from '@/hooks/useMatches';
import MatchList from '@/components/matches/MatchList';
import { Calendar, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const UpcomingMatches = () => {
  const { data: allMatches, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['matches'],
    queryFn: footballAPI.getMatches,
    
  });

  const upcomingMatches = useMemo(() => {
    if (!allMatches) return [];
    return allMatches.filter((match) => getMatchStatus(match.score, match.time, match.match_status) === 'upcoming');
  }, [allMatches]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-upcoming/20 animate-scale-in">
            <Calendar className="w-6 h-6 text-upcoming animate-float" />
          </div>
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold animate-slide-up text-foreground">
              Upcoming Matches
            </h1>
            <p className="text-muted-foreground animate-slide-up [animation-delay:100ms] [animation-fill-mode:backwards]">
              {upcomingMatches.length} match{upcomingMatches.length !== 1 ? 'es' : ''} scheduled
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
        matches={upcomingMatches}
        isLoading={isLoading}
        error={error as Error}
      />
    </div>
  );
};

export default UpcomingMatches;
