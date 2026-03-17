import { Brain, TrendingUp, Target, Loader2, Trophy, Sparkles, ChevronDown } from 'lucide-react';
import { MatchPrediction } from '@/hooks/usePrediction';
import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface PredictionPanelProps {
  prediction: MatchPrediction | undefined;
  isLoading: boolean;
  error: Error | null;
  homeName: string;
  awayName: string;
  onRetry?: () => void;
}

const confidenceBadge = {
  high: 'bg-green-500/20 text-green-400 border-green-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  low: 'bg-muted/50 text-muted-foreground border-border',
};

const PredictionPanel = ({ prediction, isLoading, error, homeName, awayName, onRetry }: PredictionPanelProps) => {
  const [showTips, setShowTips] = useState(true);
  const { t } = useLanguage();

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-primary/20 bg-card/80 backdrop-blur-sm overflow-hidden">
        <div className="bg-gradient-to-r from-primary/15 via-primary/5 to-transparent p-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center animate-pulse">
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
            </div>
            <div className="space-y-1.5">
              <div className="h-4 w-28 rounded-md bg-muted animate-pulse" />
              <div className="h-3 w-36 rounded-md bg-muted/60 animate-pulse" />
            </div>
          </div>
        </div>
        <div className="p-4 space-y-3">
          <div className="h-24 rounded-xl bg-muted/30 animate-pulse" />
          <div className="h-16 rounded-xl bg-muted/20 animate-pulse" />
          <div className="h-16 rounded-xl bg-muted/20 animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-destructive/20 bg-card/80 backdrop-blur-sm p-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-destructive/15 flex items-center justify-center">
            <Brain className="w-5 h-5 text-destructive" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-sm">{t('aiPredictionUnavailable')}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{t('couldNotAnalyze')}</p>
          </div>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-3 w-full py-2 rounded-xl bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors border border-primary/20"
          >
            {t('tryAgain')}
          </button>
        )}
      </div>
    );
  }

  if (!prediction) return null;

  const winnerLabel = prediction.winner === 'home' ? homeName : prediction.winner === 'away' ? awayName : 'Draw';
  const confidence = prediction.confidence;
  const confidenceLevel = confidence >= 70 ? 'high' : confidence >= 50 ? 'medium' : 'low';
  const confidenceLevelColor = confidence >= 70 ? 'text-green-400' : confidence >= 50 ? 'text-yellow-400' : 'text-muted-foreground';

  return (
    <div className="rounded-2xl border border-primary/20 bg-card/80 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/15 via-primary/5 to-transparent p-4 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center relative">
              <Brain className="w-5 h-5 text-primary" />
              <Sparkles className="w-3 h-3 text-primary absolute -top-1 -right-1" />
            </div>
            <div>
              <h3 className="font-bold text-sm flex items-center gap-1.5">
                {t('aiPrediction')}
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 uppercase tracking-wider">
                  {t('aiPredictionBeta')}
                </span>
              </h3>
              <p className="text-[11px] text-muted-foreground">{t('poweredByAI')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Winner & Score */}
      <div className="p-4 space-y-4">
        <div className="relative rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/15 p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">{t('predictedWinner')}</p>
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-primary" />
                <p className="font-display font-bold text-lg">{winnerLabel}</p>
              </div>
            </div>
            <div className="text-right space-y-1">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">{t('predictedScore')}</p>
              <p className="font-display font-bold text-2xl text-primary">{prediction.predicted_score}</p>
            </div>
          </div>

          {/* Confidence */}
          <div className="mt-4 pt-3 border-t border-border/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-muted-foreground font-medium">{t('confidenceLevel')}</span>
              <span className={`text-sm font-bold ${confidenceLevelColor}`}>{confidence}%</span>
            </div>
            <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${
                  confidenceLevel === 'high' ? 'bg-green-500' : confidenceLevel === 'medium' ? 'bg-yellow-500' : 'bg-muted-foreground'
                }`}
                style={{ width: `${confidence}%` }}
              />
            </div>
          </div>
        </div>

        {/* Analysis */}
        <div className="rounded-xl bg-muted/20 border border-border/50 p-3.5">
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium mb-2">{t('analysis')}</p>
          <p className="text-sm text-foreground/80 leading-relaxed">{prediction.analysis}</p>
        </div>

        {/* Betting Tips */}
        <div>
          <button
            onClick={() => setShowTips(!showTips)}
            className="flex items-center justify-between w-full mb-3 group"
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <h4 className="font-semibold text-sm">{t('bettingTips')}</h4>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/15 text-primary">
                {prediction.tips.length}
              </span>
            </div>
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${showTips ? 'rotate-180' : ''}`} />
          </button>

          {showTips && (
            <div className="space-y-2">
              {prediction.tips.map((tip, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3 rounded-xl bg-muted/15 border border-border/40 hover:border-primary/20 transition-colors"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className="mt-0.5 w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Target className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-[13px]">{tip.tip}</span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${confidenceBadge[tip.confidence]}`}>
                        {tip.confidence.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{tip.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Disclaimer */}
        <p className="text-[9px] text-muted-foreground/50 text-center pt-1">
          {t('predictionDisclaimer')}
        </p>
      </div>
    </div>
  );
};

export default PredictionPanel;
