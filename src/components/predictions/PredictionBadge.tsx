import { memo } from 'react';
import { Brain, Sparkles } from 'lucide-react';
import { MatchPrediction } from '@/hooks/usePrediction';

interface PredictionBadgeProps {
  prediction: MatchPrediction | undefined;
  isLoading: boolean;
  homeName: string;
  awayName: string;
}

const PredictionBadge = memo(({ prediction, isLoading, homeName, awayName }: PredictionBadgeProps) => {
  if (isLoading) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 animate-pulse backdrop-blur-sm">
        <Brain className="w-3 h-3 text-primary animate-spin" />
        <span className="text-[9px] font-bold text-primary tracking-wider">ANALYZING</span>
      </div>
    );
  }

  if (!prediction) return null;

  const winnerName = prediction.winner === 'home' ? homeName : prediction.winner === 'away' ? awayName : 'Draw';
  const confidence = prediction.confidence;
  const isHigh = confidence >= 70;
  const isMedium = confidence >= 50;

  const badgeBg = isHigh
    ? 'bg-green-500/15 border-green-500/30'
    : isMedium
    ? 'bg-yellow-500/15 border-yellow-500/30'
    : 'bg-muted/30 border-border/50';

  const confidenceColor = isHigh ? 'text-green-400' : isMedium ? 'text-yellow-400' : 'text-muted-foreground';

  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border backdrop-blur-sm ${badgeBg}`}>
      <div className="relative">
        <Brain className="w-3 h-3 text-primary" />
        {isHigh && <Sparkles className="w-2 h-2 text-primary absolute -top-1 -right-1" />}
      </div>
      <span className="text-[10px] font-bold truncate max-w-[70px]">{winnerName}</span>
      <span className={`text-[10px] font-black ${confidenceColor}`}>{confidence}%</span>
    </div>
  );
});

PredictionBadge.displayName = 'PredictionBadge';

export default PredictionBadge;
