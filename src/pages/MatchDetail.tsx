import { useState, useMemo, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Clock, Trophy, Radio, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { footballAPI } from '@/services/api';
import { Author, Match } from '@/types';
import { getMatchStatus } from '@/hooks/useMatches';
import { usePrediction } from '@/hooks/usePrediction';
import { useLanguage } from '@/contexts/LanguageContext';
import StatusBadge from '@/components/matches/StatusBadge';
import ElapsedTime from '@/components/matches/ElapsedTime';
import CountdownTimer from '@/components/matches/CountdownTimer';
import VideoPlayer from '@/components/streaming/VideoPlayer';
import StreamSelector from '@/components/streaming/StreamSelector';
import PredictionPanel from '@/components/predictions/PredictionPanel';
import { Button } from '@/components/ui/button';
import TeamLogo from '@/components/ui/TeamLogo';
import { Skeleton } from '@/components/ui/skeleton';

const MatchDetail = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const [selectedStream, setSelectedStream] = useState<Author | null>(null);
  const { language } = useLanguage();
  const playerRef = useRef<HTMLDivElement>(null);
  
  const { data: matches, isLoading } = useQuery({
    queryKey: ['matches'],
    queryFn: footballAPI.getMatches,
    
  });

  const match = useMemo(() => {
    if (!matches || !matchId) return null;
    return matches.find((m: Match) => m.id === matchId);
  }, [matches, matchId]);

  const status = match ? getMatchStatus(match.score, match.time, match.match_status) : 'upcoming';
  // Auto-scroll to player when match is live
  useEffect(() => {
    if (status === 'live' && playerRef.current) {
      setTimeout(() => {
        playerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 500);
    }
  }, [status, match?.id]);

  const { data: prediction, isLoading: predLoading, error: predError, refetch: retryPrediction } = usePrediction(
    match?.home_name || '', match?.away_name || '', match?.label || '', match?.score || '', match?.time || '',
    true, language
  );

  if (isLoading) {
    return (
      <div className="space-y-4 animate-fade-in max-w-3xl mx-auto">
        <Skeleton className="h-8 w-24 rounded-xl" />
        <Skeleton className="h-56 w-full rounded-2xl" />
        <Skeleton className="aspect-video w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    );
  }

  if (!match) {
    return (
      <div className="text-center py-20 animate-fade-in">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-muted/50 border border-border mb-6">
          <span className="text-4xl">⚽</span>
        </div>
        <h2 className="text-2xl font-bold mb-3">Match not found</h2>
        <p className="text-muted-foreground mb-6 text-sm">The match you're looking for doesn't exist</p>
        <Link to="/">
          <Button className="gap-2 rounded-xl">
            <ArrowLeft className="w-4 h-4" />
            Back to matches
          </Button>
        </Link>
      </div>
    );
  }

  const scoreParts = match.score?.trim().match(/^(\d+)\s*-\s*(\d+)$/);
  const homeScore = scoreParts ? scoreParts[1] : null;
  const awayScore = scoreParts ? scoreParts[2] : null;
  const hasStreams = match.authors && match.authors.length > 0;
  const NBA_KEYWORDS = ['nba', 'kbl', 'vtbul', 'tpbl', 'basketball'];
  const isBasketball = NBA_KEYWORDS.some(k => match.label.toLowerCase().includes(k));
  const ballEmoji = isBasketball ? '🏀' : '⚽';

  return (
    <div className="space-y-5 animate-fade-in max-w-3xl mx-auto">
      {/* Back Button */}
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-all text-sm group animate-slide-up"
      >
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        <span className="font-medium">Back</span>
      </Link>

      {/* Match Header Card */}
      <div className="relative rounded-2xl border border-border/50 overflow-hidden animate-slide-up [animation-delay:50ms] [animation-fill-mode:backwards]">
        {/* Gradient background layers */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-card to-card" />
        {status === 'live' && (
          <div className="absolute inset-0 bg-gradient-to-t from-live/5 via-transparent to-live/3 animate-pulse" />
        )}

        {/* Top accent line */}
        <div className={`h-0.5 w-full ${
          status === 'live' ? 'bg-gradient-to-r from-transparent via-live to-transparent' :
          status === 'upcoming' ? 'bg-gradient-to-r from-transparent via-upcoming/60 to-transparent' :
          'bg-gradient-to-r from-transparent via-primary/40 to-transparent'
        }`} />

        <div className="relative z-10 p-5 pb-6">
          {/* Top row: status + time */}
          <div className="flex items-center justify-between mb-4 animate-fade-in [animation-delay:150ms] [animation-fill-mode:backwards]">
            <div className="flex items-center gap-2">
              <StatusBadge status={status} />
              {hasStreams && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold">
                  <Radio className="w-2.5 h-2.5" />
                  {match.authors.length} streams
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {status === 'live' ? (
                <ElapsedTime time={match.time} />
              ) : (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="text-xs font-medium tabular-nums">{match.time}</span>
                </div>
              )}
            </div>
          </div>

          {/* Competition label */}
          <div className="flex items-center gap-1.5 mb-6 animate-fade-in [animation-delay:200ms] [animation-fill-mode:backwards]">
            <Trophy className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] text-primary/80 font-bold uppercase tracking-[0.15em] truncate">{match.label}</span>
          </div>

          {/* Teams & Score — head-to-head style */}
          <div className="flex items-center gap-2 md:gap-4">
            {/* Home Team */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="flex-1 flex flex-col items-center text-center min-w-0 gap-3"
            >
              <div className="relative">
                <div className="w-20 h-20 md:w-28 md:h-28 rounded-3xl bg-gradient-to-br from-secondary/80 to-secondary/40 border-2 border-border/50 flex items-center justify-center overflow-hidden shadow-xl shadow-black/10 transition-transform duration-300 hover:scale-105">
                  <TeamLogo src={match.home_logo} name={match.home_name} size="lg" />
                </div>
                {/* Glow ring */}
                <div className={`absolute -inset-1 rounded-3xl opacity-30 blur-md -z-10 ${status === 'live' ? 'bg-live' : 'bg-primary/50'}`} />
              </div>
              <div>
                <h2 className="font-display text-sm md:text-lg font-black truncate w-full leading-tight">{match.home_name}</h2>
                <span className="text-[10px] text-primary/60 font-bold uppercase tracking-widest">Home</span>
              </div>
            </motion.div>

            {/* VS / Score Center */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.35, type: 'spring', stiffness: 200 }}
              className="flex flex-col items-center flex-shrink-0"
            >
              {homeScore !== null ? (
                <div className={`relative flex items-center gap-2.5 px-5 py-3.5 rounded-2xl border-2 ${
                  status === 'live'
                    ? 'bg-live/10 border-live/40 shadow-xl shadow-live/15'
                    : 'bg-secondary/60 border-border/50 shadow-lg'
                }`}>
                  <span className={`font-display text-4xl md:text-5xl font-black tabular-nums ${status === 'live' ? 'text-live' : 'text-foreground'}`}>
                    {homeScore}
                  </span>
                  <motion.span
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                    className="text-xl md:text-2xl"
                  >
                    {ballEmoji}
                  </motion.span>
                  <span className={`font-display text-4xl md:text-5xl font-black tabular-nums ${status === 'live' ? 'text-live' : 'text-foreground'}`}>
                    {awayScore}
                  </span>
                </div>
              ) : (
                <div className="relative flex flex-col items-center gap-1.5 px-6 py-4 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 border-2 border-primary/25 shadow-lg">
                  <motion.span
                    animate={{ 
                      y: [0, -8, 0],
                      rotate: [0, 180, 360],
                    }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    className="text-2xl md:text-3xl"
                  >
                    {ballEmoji}
                  </motion.span>
                  <span className="font-display text-lg font-black text-primary/80 tracking-wider">VS</span>
                </div>
              )}

              {status === 'live' && (
                <span className="mt-3 px-3.5 py-1 rounded-full bg-live/15 text-live text-[9px] font-black animate-pulse tracking-widest border border-live/25 shadow-sm shadow-live/10">
                  ● LIVE
                </span>
              )}
            </motion.div>

            {/* Away Team */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="flex-1 flex flex-col items-center text-center min-w-0 gap-3"
            >
              <div className="relative">
                <div className="w-20 h-20 md:w-28 md:h-28 rounded-3xl bg-gradient-to-br from-secondary/80 to-secondary/40 border-2 border-border/50 flex items-center justify-center overflow-hidden shadow-xl shadow-black/10 transition-transform duration-300 hover:scale-105">
                  <TeamLogo src={match.away_logo} name={match.away_name} size="lg" />
                </div>
                <div className={`absolute -inset-1 rounded-3xl opacity-30 blur-md -z-10 ${status === 'live' ? 'bg-live' : 'bg-primary/50'}`} />
              </div>
              <div>
                <h2 className="font-display text-sm md:text-lg font-black truncate w-full leading-tight">{match.away_name}</h2>
                <span className="text-[10px] text-live/60 font-bold uppercase tracking-widest">Away</span>
              </div>
            </motion.div>
          </div>

          {/* Countdown for upcoming */}
          {status === 'upcoming' && (
            <div className="mt-5 animate-fade-in [animation-delay:400ms] [animation-fill-mode:backwards]">
              <CountdownTimer timestamp={match.match_timestamp} />
            </div>
          )}
        </div>
      </div>

      {/* Video Player with inline stream switcher */}
      <div ref={playerRef} className="animate-slide-up [animation-delay:150ms] [animation-fill-mode:backwards]">
        <VideoPlayer
          stream={selectedStream}
          matchTitle={`${match.home_name} vs ${match.away_name}`}
          isLive={status === 'live'}
          streams={match.authors}
          onSelectStream={setSelectedStream}
        />
      </div>

      {/* Prediction Panel */}
      <div className="animate-slide-up [animation-delay:200ms] [animation-fill-mode:backwards]">
        <PredictionPanel
          prediction={prediction}
          isLoading={predLoading}
          error={predError}
          homeName={match.home_name}
          awayName={match.away_name}
          onRetry={() => retryPrediction()}
        />
      </div>
    </div>
  );
};

export default MatchDetail;
