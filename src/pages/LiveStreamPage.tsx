import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Info } from 'lucide-react';
import { footballAPI } from '@/services/api';
import { Author, Match } from '@/types';
import { getMatchStatus } from '@/hooks/useMatches';
import VideoPlayer from '@/components/streaming/VideoPlayer';
import StatusBadge from '@/components/matches/StatusBadge';
import ElapsedTime from '@/components/matches/ElapsedTime';
import TeamLogo from '@/components/ui/TeamLogo';
import { Skeleton } from '@/components/ui/skeleton';

const LiveStreamPage = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const [selectedStream, setSelectedStream] = useState<Author | null>(null);

  const { data: matches, isLoading } = useQuery({
    queryKey: ['matches'],
    queryFn: footballAPI.getMatches,
  });

  const match = useMemo(() => {
    if (!matches || !matchId) return null;
    return matches.find((m: Match) => m.id === matchId);
  }, [matches, matchId]);

  const status = match ? getMatchStatus(match.score, match.time, match.match_status) : 'upcoming';

  // Auto-select first stream
  useEffect(() => {
    if (match?.authors?.length && !selectedStream) {
      setSelectedStream(match.authors[0]);
    }
  }, [match, selectedStream]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-3 animate-fade-in">
        <Skeleton className="h-8 w-24 rounded-xl" />
        <Skeleton className="aspect-video w-full rounded-2xl" />
      </div>
    );
  }

  if (!match) {
    return (
      <div className="text-center py-20 animate-fade-in">
        <h2 className="text-xl font-bold mb-3">Match not found</h2>
        <Link to="/" className="text-primary text-sm font-medium hover:underline">← Back to matches</Link>
      </div>
    );
  }

  const scoreParts = match.score?.trim().match(/^(\d+)\s*-\s*(\d+)$/);

  return (
    <div className="max-w-4xl mx-auto space-y-3 animate-fade-in">
      {/* Compact header: back + match info */}
      <div className="flex items-center justify-between gap-2">
        <Link
          to={`/matches/${encodeURIComponent(match.id)}`}
          className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-all text-xs group"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
          <span className="font-medium">Match Info</span>
        </Link>

        {/* Mini scoreboard */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-card border border-border/50">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-md overflow-hidden bg-secondary/60 flex items-center justify-center">
              <TeamLogo src={match.home_logo} name={match.home_name} size="sm" />
            </div>
            <span className="text-[11px] font-bold truncate max-w-[60px]">{match.home_name}</span>
          </div>

          {scoreParts ? (
            <span className={`text-xs font-black tabular-nums px-1.5 py-0.5 rounded-lg ${
              status === 'live' ? 'text-live bg-live/10' : 'text-foreground bg-secondary/50'
            }`}>
              {scoreParts[1]} - {scoreParts[2]}
            </span>
          ) : (
            <span className="text-[10px] font-bold text-muted-foreground px-1.5">VS</span>
          )}

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold truncate max-w-[60px]">{match.away_name}</span>
            <div className="w-5 h-5 rounded-md overflow-hidden bg-secondary/60 flex items-center justify-center">
              <TeamLogo src={match.away_logo} name={match.away_name} size="sm" />
            </div>
          </div>

          <div className="ml-1 flex items-center gap-1.5">
            <StatusBadge status={status} />
            {status === 'live' && <ElapsedTime time={match.time} />}
          </div>
        </div>
      </div>

      {/* Full-width Video Player */}
      <VideoPlayer
        stream={selectedStream}
        matchTitle={`${match.home_name} vs ${match.away_name}`}
        isLive={status === 'live'}
        streams={match.authors}
        onSelectStream={setSelectedStream}
      />

      {/* Quick link to full match detail */}
      <Link
        to={`/matches/${encodeURIComponent(match.id)}`}
        className="flex items-center gap-2 px-4 py-3 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-all group"
      >
        <Info className="w-4 h-4 text-primary" />
        <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
          View full match details, predictions & more
        </span>
        <ArrowLeft className="w-3.5 h-3.5 text-muted-foreground ml-auto rotate-180 transition-transform group-hover:translate-x-1" />
      </Link>
    </div>
  );
};

export default LiveStreamPage;
