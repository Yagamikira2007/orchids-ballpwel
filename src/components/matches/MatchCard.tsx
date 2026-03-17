import { memo, useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Play, Radio, ArrowRight, Star, Share2, MessageCircle, Send, Link2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Match, MatchStatus } from '@/types';
import { getMatchStatus } from '@/hooks/useMatches';
import { usePrediction } from '@/hooks/usePrediction';
import { useLanguage } from '@/contexts/LanguageContext';
import StatusBadge from './StatusBadge';
import PredictionBadge from '@/components/predictions/PredictionBadge';
import CountdownTimer from './CountdownTimer';
import ElapsedTime from './ElapsedTime';
import TeamLogo from '@/components/ui/TeamLogo';

interface MatchCardProps {
  match: Match;
  index?: number;
  isFavoriteHome?: boolean;
  isFavoriteAway?: boolean;
  onToggleFavorite?: (teamName: string) => void;
}

const MatchCard = memo(({ match, index = 0, isFavoriteHome, isFavoriteAway, onToggleFavorite }: MatchCardProps) => {
  const { language } = useLanguage();
  const status = getMatchStatus(match.score, match.time, match.match_status);
  const prevStatusRef = useRef<MatchStatus>(status);
  const [justWentLive, setJustWentLive] = useState(false);
  const [enablePrediction, setEnablePrediction] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false);
  const shareRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prevStatusRef.current === 'upcoming' && status === 'live') {
      setJustWentLive(true);
      const timer = setTimeout(() => setJustWentLive(false), 3000);
      return () => clearTimeout(timer);
    }
    prevStatusRef.current = status;
  }, [status]);

  useEffect(() => {
    const timer = setTimeout(() => setEnablePrediction(true), index * 5000);
    return () => clearTimeout(timer);
  }, [index]);

  // Close share menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (shareRef.current && !shareRef.current.contains(e.target as Node)) setShowShare(false);
    };
    if (showShare) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showShare]);

  const hasStreams = match.authors && match.authors.length > 0;
  const isLive = status === 'live';
  const encodedId = encodeURIComponent(match.id);
  // Live matches with streams go directly to stream player
  const cardLink = isLive && hasStreams ? `/watch/${encodedId}` : `/matches/${encodedId}`;
  const matchUrl = `${window.location.origin}/matches/${encodedId}`;
  const shareText = `${match.home_name} vs ${match.away_name}${match.score ? ' | ' + match.score : ''}`;

  const handleShare = (type: 'whatsapp' | 'telegram' | 'copy') => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (type === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(shareText + '\n' + matchUrl)}`, '_blank');
    } else if (type === 'telegram') {
      window.open(`https://t.me/share/url?url=${encodeURIComponent(matchUrl)}&text=${encodeURIComponent(shareText)}`, '_blank');
    } else {
      navigator.clipboard.writeText(matchUrl);
      setCopied(true);
      toast.success('Link copied!');
      setTimeout(() => setCopied(false), 2000);
    }
    setShowShare(false);
  };

  const { data: prediction, isLoading: predLoading } = usePrediction(
    match.home_name,
    match.away_name,
    match.label || '',
    match.score || '',
    match.time || '',
    enablePrediction,
    language
  );

  const scoreParts = match.score?.trim().match(/^(\d+)\s*-\s*(\d+)$/);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.08, 0.4), ease: [0.25, 0.46, 0.45, 0.94] }}
    >
    <Link to={cardLink} className="block group">
      <div
        className={`relative rounded-2xl border overflow-hidden transition-all duration-500 ${
          justWentLive ? 'animate-scale-in ring-2 ring-live ring-offset-2 ring-offset-background' : ''
        } ${status === 'live' ? 'border-live/30 hover:border-live/50' : 'border-[rgba(80,160,80,0.18)] hover:border-[rgba(80,160,80,0.38)]'}`}
        style={{ background: 'linear-gradient(160deg, rgba(8,28,10,0.82) 0%, rgba(5,18,7,0.88) 100%)', backdropFilter: 'blur(12px) saturate(1.3)' }}
      >
        {/* Ambient glow for live */}
        {status === 'live' && (
          <div className="absolute inset-0 bg-gradient-to-br from-live/8 via-transparent to-live/3 pointer-events-none animate-pulse" />
        )}

        {/* Top accent line */}
        <div className={`h-[1.5px] w-full ${
          status === 'live' ? 'bg-gradient-to-r from-transparent via-live to-transparent' :
          status === 'upcoming' ? 'bg-gradient-to-r from-transparent via-sky-400/50 to-transparent' :
          'bg-gradient-to-r from-transparent via-[rgba(80,180,80,0.3)] to-transparent'
        }`} />

        <div className="relative z-10 p-4">
          {/* Header row */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <StatusBadge status={status} />
              {hasStreams && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold">
                  <Radio className="w-2.5 h-2.5" />
                  {match.authors.length}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* Share button */}
              <div className="relative" ref={shareRef}>
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowShare(!showShare); }}
                  className="w-6 h-6 rounded-full bg-secondary/60 border border-border/40 flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
                >
                  <Share2 className="w-3 h-3" />
                </button>
                {showShare && (
                  <div className="absolute right-0 top-8 z-50 bg-popover border border-border rounded-xl shadow-xl p-1.5 flex flex-col gap-1 min-w-[140px] animate-in fade-in-0 zoom-in-95">
                    <button onClick={handleShare('whatsapp')} className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium hover:bg-accent transition-colors text-foreground">
                      <MessageCircle className="w-3.5 h-3.5 text-green-500" /> WhatsApp
                    </button>
                    <button onClick={handleShare('telegram')} className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium hover:bg-accent transition-colors text-foreground">
                      <Send className="w-3.5 h-3.5 text-[#0088cc]" /> Telegram
                    </button>
                    <button onClick={handleShare('copy')} className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium hover:bg-accent transition-colors text-foreground">
                      {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Link2 className="w-3.5 h-3.5 text-muted-foreground" />} Copy Link
                    </button>
                  </div>
                )}
              </div>
              <PredictionBadge prediction={prediction} isLoading={predLoading} homeName={match.home_name} awayName={match.away_name} />
              {status === 'live' ? (
                <ElapsedTime time={match.time} />
              ) : (
                <span className="text-[11px] text-muted-foreground font-medium tabular-nums">
                  {match.time}
                </span>
              )}
            </div>
          </div>

          {/* Competition label */}
          <p className="text-[10px] text-primary/70 font-bold mb-4 truncate uppercase tracking-[0.15em]">
            {match.label}
          </p>

          {/* Teams vs Score — centered layout */}
          <div className="flex items-center gap-2">
            {/* Home team */}
            <div className="flex-1 flex flex-col items-center gap-2 min-w-0">
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-secondary/60 flex items-center justify-center overflow-hidden border border-border/40 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary/10">
                  <TeamLogo src={match.home_logo} name={match.home_name} size="sm" />
                </div>
                {onToggleFavorite && (
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleFavorite(match.home_name); }}
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-background/90 border border-border/50 flex items-center justify-center transition-all hover:scale-110"
                  >
                    <Star className={`w-3 h-3 ${isFavoriteHome ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`} />
                  </button>
                )}
              </div>
              <span className="text-xs font-semibold text-center truncate w-full leading-tight">{match.home_name}</span>
            </div>

            {/* Score / VS — stadium scoreboard style */}
            <div className="flex-shrink-0 flex flex-col items-center gap-1">
              {scoreParts ? (
                <div className={`relative flex items-center gap-0 rounded-xl overflow-hidden border ${
                  status === 'live'
                    ? 'border-live/40 shadow-lg shadow-live/15'
                    : 'border-border/50'
                }`}>
                  {/* Home score cell */}
                  <div className={`flex items-center justify-center w-11 h-11 ${
                    status === 'live'
                      ? 'bg-live/15'
                      : 'bg-[rgba(20,72,20,0.25)]'
                  }`}>
                    <span className={`font-display text-2xl font-black tabular-nums leading-none ${status === 'live' ? 'text-live' : 'text-foreground'}`}>
                      {scoreParts[1]}
                    </span>
                  </div>
                  {/* Divider */}
                  <div className={`flex items-center justify-center w-5 h-11 ${
                    status === 'live' ? 'bg-live/10' : 'bg-[rgba(80,160,80,0.12)]'
                  } border-x border-border/30`}>
                    <span className="text-muted-foreground text-[10px] font-black">:</span>
                  </div>
                  {/* Away score cell */}
                  <div className={`flex items-center justify-center w-11 h-11 ${
                    status === 'live'
                      ? 'bg-live/15'
                      : 'bg-[rgba(20,72,20,0.25)]'
                  }`}>
                    <span className={`font-display text-2xl font-black tabular-nums leading-none ${status === 'live' ? 'text-live' : 'text-foreground'}`}>
                      {scoreParts[2]}
                    </span>
                  </div>
                  {/* Live pulse bar */}
                  {status === 'live' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-live to-transparent animate-pulse" />
                  )}
                </div>
              ) : (
                <div className="px-4 py-2.5 rounded-xl bg-[rgba(20,72,20,0.2)] border border-[rgba(80,160,80,0.2)]">
                  <span className="font-display text-lg font-bold text-muted-foreground">VS</span>
                </div>
              )}
            </div>

            {/* Away team */}
            <div className="flex-1 flex flex-col items-center gap-2 min-w-0">
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-secondary/60 flex items-center justify-center overflow-hidden border border-border/40 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary/10">
                  <TeamLogo src={match.away_logo} name={match.away_name} size="sm" />
                </div>
                {onToggleFavorite && (
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleFavorite(match.away_name); }}
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-background/90 border border-border/50 flex items-center justify-center transition-all hover:scale-110"
                  >
                    <Star className={`w-3 h-3 ${isFavoriteAway ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`} />
                  </button>
                )}
              </div>
              <span className="text-xs font-semibold text-center truncate w-full leading-tight">{match.away_name}</span>
            </div>
          </div>

          {/* Countdown */}
          {status === 'upcoming' && <div className="mt-3"><CountdownTimer timestamp={match.match_timestamp} /></div>}

          {/* Action row */}
          {hasStreams && (
            <div className="mt-4 flex items-center justify-between px-3 py-2 rounded-xl bg-[rgba(20,90,20,0.25)] border border-[rgba(80,200,80,0.2)] transition-all duration-300 group-hover:bg-[rgba(20,90,20,0.4)] group-hover:border-[rgba(80,200,80,0.35)] group-hover:shadow-md group-hover:shadow-green-900/20">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Play className="w-3 h-3 text-primary fill-primary" />
                </div>
                <span className="text-xs font-bold text-primary">Watch Now</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-primary transition-transform duration-300 group-hover:translate-x-1" />
            </div>
          )}
        </div>

        {/* Hover shine */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      </div>
    </Link>
    </motion.div>
  );
});

MatchCard.displayName = 'MatchCard';

export default MatchCard;
