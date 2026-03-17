import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { footballAPI } from '@/services/api';
import { Match } from '@/types';
import { getMatchStatus } from '@/hooks/useMatches';
import { Brain, Trophy, Target, TrendingUp, Zap, ChevronDown, Loader2, ArrowLeft, Sparkles, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import TeamLogo from '@/components/ui/TeamLogo';
import { useLanguage } from '@/contexts/LanguageContext';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface AccumulatorPrediction {
  home_name: string;
  away_name: string;
  home_logo: string;
  away_logo: string;
  competition: string;
  score: string;
  time: string;
  match_id: string;
  prediction: {
    winner: 'home' | 'away' | 'draw';
    confidence: number;
    predicted_score: string;
    tips: { tip: string; confidence: string; description: string }[];
    analysis: string;
  } | null;
}

type ConfidenceLevel = 'very_high' | 'high' | 'normal' | 'low';

const CONFIDENCE_LEVELS: { key: ConfidenceLevel; label: string; labelMy: string; min: number; max: number; color: string; bg: string; border: string; icon: typeof Zap }[] = [
  { key: 'very_high', label: 'Very High', labelMy: 'အလွန်မြင့်', min: 80, max: 100, color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30', icon: Zap },
  { key: 'high', label: 'High', labelMy: 'မြင့်', min: 65, max: 79, color: 'text-green-400', bg: 'bg-green-500/15', border: 'border-green-500/30', icon: TrendingUp },
  { key: 'normal', label: 'Normal', labelMy: 'ပုံမှန်', min: 50, max: 64, color: 'text-yellow-400', bg: 'bg-yellow-500/15', border: 'border-yellow-500/30', icon: Target },
  { key: 'low', label: 'Low', labelMy: 'နိမ့်', min: 0, max: 49, color: 'text-muted-foreground', bg: 'bg-muted/30', border: 'border-border/50', icon: Shield },
];

const AccumulatorPage = () => {
  const { language } = useLanguage();
  const [activeLeague, setActiveLeague] = useState('all');
  const [expandedLevels, setExpandedLevels] = useState<Record<string, boolean>>({
    very_high: true, high: true, normal: true, low: false,
  });

  // Fetch matches
  const { data: matches, isLoading: matchesLoading } = useQuery({
    queryKey: ['matches'],
    queryFn: footballAPI.getMatches,
    
  });

  // Get non-finished matches for predictions
  const activeMatches = useMemo(() => {
    if (!matches) return [];
    return matches.filter(m => {
      const status = getMatchStatus(m.score, m.time, m.match_status);
      return status === 'live' || status === 'upcoming';
    });
  }, [matches]);

  // Fetch accumulator predictions
  const { data: accData, isLoading: predsLoading } = useQuery({
    queryKey: ['accumulator-predictions', activeMatches.map(m => m.id).join(',')],
    queryFn: async () => {
      if (activeMatches.length === 0) return { predictions: [] };
      const payload = activeMatches.map(m => ({
        home_name: m.home_name,
        away_name: m.away_name,
        home_logo: m.home_logo,
        away_logo: m.away_logo,
        competition: m.label,
        score: m.score,
        time: m.time,
        match_id: m.id,
      }));
      const res = await fetch(`${SUPABASE_URL}/functions/v1/accumulator-predictions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ matches: payload, language }),
      });
      if (!res.ok) throw new Error('Failed to fetch predictions');
      return res.json();
    },
    enabled: activeMatches.length > 0,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });

  const predictions: AccumulatorPrediction[] = accData?.predictions || [];

  // Get available leagues
  const leagues = useMemo(() => {
    const set = new Set<string>();
    predictions.forEach(p => set.add(p.competition));
    return Array.from(set).sort();
  }, [predictions]);

  // Filter by league
  const filtered = useMemo(() => {
    if (activeLeague === 'all') return predictions.filter(p => p.prediction);
    return predictions.filter(p => p.prediction && p.competition === activeLeague);
  }, [predictions, activeLeague]);

  // Group by confidence level
  const grouped = useMemo(() => {
    const groups: Record<ConfidenceLevel, AccumulatorPrediction[]> = {
      very_high: [], high: [], normal: [], low: [],
    };
    filtered.forEach(p => {
      if (!p.prediction) return;
      const c = p.prediction.confidence;
      if (c >= 80) groups.very_high.push(p);
      else if (c >= 65) groups.high.push(p);
      else if (c >= 50) groups.normal.push(p);
      else groups.low.push(p);
    });
    return groups;
  }, [filtered]);

  // Extract all correct score tips
  const correctScoreTips = useMemo(() => {
    return filtered
      .filter(p => p.prediction)
      .map(p => {
        const csTip = p.prediction!.tips?.find(t =>
          t.tip.toLowerCase().includes('correct score') || t.tip.toLowerCase().includes('exact score')
        );
        if (!csTip) return null;
        return { ...p, correctScoreTip: csTip };
      })
      .filter(Boolean) as (AccumulatorPrediction & { correctScoreTip: { tip: string; confidence: string; description: string } })[];
  }, [filtered]);

  const isLoading = matchesLoading || predsLoading;

  const toggleLevel = (key: string) => {
    setExpandedLevels(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Link to="/" className="w-9 h-9 rounded-xl bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
                <Zap className="w-5 h-5 text-white fill-white" />
              </div>
              <div>
                <h1 className="font-display font-bold text-lg leading-tight">မောင်း</h1>
                <p className="text-[11px] text-muted-foreground">AI Accumulator Tips</p>
              </div>
            </div>
            {isLoading && <Loader2 className="w-4 h-4 text-primary animate-spin ml-auto" />}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-4 space-y-4">
        {/* League Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setActiveLeague('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
              activeLeague === 'all'
                ? 'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20'
                : 'bg-muted/30 text-muted-foreground border-border/50 hover:bg-muted/50'
            }`}
          >
            All Leagues
          </button>
          {leagues.map(league => (
            <button
              key={league}
              onClick={() => setActiveLeague(league)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                activeLeague === league
                  ? 'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20'
                  : 'bg-muted/30 text-muted-foreground border-border/50 hover:bg-muted/50'
              }`}
            >
              {league}
            </button>
          ))}
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="rounded-2xl border border-border/50 bg-card/50 p-4 animate-pulse">
                <div className="h-5 w-32 bg-muted rounded-lg mb-3" />
                <div className="space-y-2">
                  <div className="h-16 bg-muted/50 rounded-xl" />
                  <div className="h-16 bg-muted/30 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Correct Score Tips - Featured Section */}
        {!isLoading && correctScoreTips.length > 0 && (
          <div className="rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent overflow-hidden">
            <div className="p-4 border-b border-primary/20 bg-primary/5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-sm flex items-center gap-1.5">
                    Correct Score Tips
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                  </h2>
                  <p className="text-[10px] text-muted-foreground">{correctScoreTips.length} predictions</p>
                </div>
              </div>
            </div>
            <div className="p-3 space-y-2">
              {correctScoreTips.map((item, i) => (
                <Link
                  key={`cs-${i}`}
                  to={`/matches/${item.match_id}`}
                  className="flex items-center gap-3 p-3 rounded-xl bg-card/60 border border-border/40 hover:border-primary/30 transition-all group"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <TeamLogo src={item.home_logo} name={item.home_name} size="sm" />
                    <span className="text-xs font-semibold truncate">{item.home_name}</span>
                    <span className="text-primary font-display font-black text-lg px-1">{item.prediction!.predicted_score}</span>
                    <span className="text-xs font-semibold truncate">{item.away_name}</span>
                    <TeamLogo src={item.away_logo} name={item.away_name} size="sm" />
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                    item.correctScoreTip.confidence === 'high' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                    item.correctScoreTip.confidence === 'medium' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                    'bg-muted/50 text-muted-foreground border-border'
                  }`}>
                    {item.correctScoreTip.confidence.toUpperCase()}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Confidence Level Sections */}
        {!isLoading && CONFIDENCE_LEVELS.map(level => {
          const items = grouped[level.key];
          if (items.length === 0) return null;
          const isExpanded = expandedLevels[level.key];
          const Icon = level.icon;

          return (
            <div key={level.key} className={`rounded-2xl border ${level.border} bg-card/80 backdrop-blur-sm overflow-hidden`}>
              <button
                onClick={() => toggleLevel(level.key)}
                className="w-full p-4 flex items-center justify-between hover:bg-muted/10 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-9 h-9 rounded-xl ${level.bg} flex items-center justify-center`}>
                    <Icon className={`w-4.5 h-4.5 ${level.color}`} />
                  </div>
                  <div className="text-left">
                    <h3 className="font-bold text-sm flex items-center gap-2">
                      {level.label}
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${level.bg} ${level.color} border ${level.border}`}>
                        {items.length}
                      </span>
                    </h3>
                    <p className="text-[10px] text-muted-foreground">
                      {level.labelMy} • Confidence {level.min}-{level.max}%
                    </p>
                  </div>
                </div>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
              </button>

              {isExpanded && (
                <div className="px-3 pb-3 space-y-2">
                  {items.map((item, i) => (
                    <MatchPredictionCard key={`${level.key}-${i}`} item={item} />
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Empty state */}
        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-16">
            <Brain className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No predictions available</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Check back when matches are scheduled</p>
          </div>
        )}

        {/* Disclaimer */}
        <p className="text-[9px] text-muted-foreground/40 text-center pb-6">
          ⚠️ AI predictions are for entertainment only. Not financial advice.
        </p>
      </div>
    </div>
  );
};

// Individual match prediction card
const MatchPredictionCard = ({ item }: { item: AccumulatorPrediction }) => {
  const [showTips, setShowTips] = useState(false);
  const pred = item.prediction!;
  const winnerName = pred.winner === 'home' ? item.home_name : pred.winner === 'away' ? item.away_name : 'Draw';
  const confidenceColor = pred.confidence >= 80 ? 'text-emerald-400' : pred.confidence >= 65 ? 'text-green-400' : pred.confidence >= 50 ? 'text-yellow-400' : 'text-muted-foreground';

  return (
    <div className="rounded-xl bg-muted/10 border border-border/30 overflow-hidden">
      <Link
        to={`/matches/${item.match_id}`}
        className="p-3 flex items-center gap-3 hover:bg-muted/10 transition-colors"
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <TeamLogo src={item.home_logo} name={item.home_name} size="sm" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold truncate">{item.home_name}</span>
              <span className="text-[10px] text-muted-foreground">vs</span>
              <span className="text-xs font-semibold truncate">{item.away_name}</span>
            </div>
            <p className="text-[9px] text-muted-foreground truncate">{item.competition}</p>
          </div>
          <TeamLogo src={item.away_logo} name={item.away_name} size="sm" />
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-xs font-bold">{winnerName}</p>
          <div className="flex items-center gap-1 justify-end">
            <span className="text-primary font-display font-black text-sm">{pred.predicted_score}</span>
            <span className={`text-[10px] font-black ${confidenceColor}`}>{pred.confidence}%</span>
          </div>
        </div>
      </Link>

      {/* Expandable tips */}
      <button
        onClick={(e) => { e.preventDefault(); setShowTips(!showTips); }}
        className="w-full px-3 py-1.5 flex items-center justify-center gap-1 text-[10px] font-semibold text-primary/70 hover:text-primary border-t border-border/20 transition-colors"
      >
        <Target className="w-3 h-3" />
        {showTips ? 'Hide Tips' : `${pred.tips?.length || 0} Tips`}
        <ChevronDown className={`w-3 h-3 transition-transform ${showTips ? 'rotate-180' : ''}`} />
      </button>

      {showTips && pred.tips && (
        <div className="px-3 pb-3 space-y-1.5">
          {pred.tips.map((tip, i) => (
            <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-muted/15">
              <span className="text-[11px] font-semibold flex-1">{tip.tip}</span>
              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full border ${
                tip.confidence === 'high' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                tip.confidence === 'medium' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                'bg-muted/50 text-muted-foreground border-border'
              }`}>
                {tip.confidence.toUpperCase()}
              </span>
            </div>
          ))}
          <p className="text-[10px] text-muted-foreground/70 leading-relaxed mt-1">{pred.analysis}</p>
        </div>
      )}
    </div>
  );
};

export default AccumulatorPage;
