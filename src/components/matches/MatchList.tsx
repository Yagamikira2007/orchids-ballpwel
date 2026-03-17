import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Match } from '@/types';
import MatchCard from './MatchCard';
import AdBanner from '../ads/AdBanner';
import LoadingSkeleton from '../ui/LoadingSkeleton';

interface MatchListProps {
  matches: Match[] | undefined;
  isLoading: boolean;
  error: Error | null;
  isFavorite?: (teamName: string) => boolean;
  onToggleFavorite?: (teamName: string) => void;
}

const MatchList = ({ matches, isLoading, error, isFavorite, onToggleFavorite }: MatchListProps) => {
  // Fetch banner frequency setting
  const { data: banners } = useQuery({
    queryKey: ['ad-banners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ad_banners')
        .select('id, frequency')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .limit(1);
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const frequency = banners?.[0]?.frequency || 3;

  // Build items list with ads interspersed
  const items = useMemo(() => {
    if (!matches || matches.length === 0) return [];
    const result: { type: 'match' | 'ad'; match?: Match; adIndex?: number; key: string }[] = [];
    let adCount = 0;
    matches.forEach((match, i) => {
      result.push({ type: 'match', match, key: match.id });
      if ((i + 1) % frequency === 0 && i < matches.length - 1) {
        result.push({ type: 'ad', adIndex: adCount, key: `ad-${adCount}` });
        adCount++;
      }
    });
    return result;
  }, [matches, frequency]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[...Array(6)].map((_, i) => (
          <LoadingSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20 animate-fade-in">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-destructive/10 border border-destructive/20 mb-4">
          <span className="text-3xl">⚠️</span>
        </div>
        <h3 className="text-lg font-semibold mb-2">Failed to load matches</h3>
        <p className="text-muted-foreground text-sm">Please try again later</p>
      </div>
    );
  }

  if (!matches || matches.length === 0) {
    return (
      <div className="text-center py-20 animate-fade-in">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-muted border border-border/50 mb-4">
          <span className="text-3xl">⚽</span>
        </div>
        <h3 className="text-lg font-semibold mb-2">No matches found</h3>
        <p className="text-muted-foreground text-sm">Try adjusting your filters</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 stagger-children">
      {items.map((item, index) =>
        item.type === 'match' ? (
          <MatchCard
            key={item.key}
            match={item.match!}
            index={index}
            isFavoriteHome={isFavorite?.(item.match!.home_name)}
            isFavoriteAway={isFavorite?.(item.match!.away_name)}
            onToggleFavorite={onToggleFavorite}
          />
        ) : (
          <div key={item.key} className="col-span-1 md:col-span-2 lg:col-span-3">
            <AdBanner index={item.adIndex!} />
          </div>
        )
      )}
    </div>
  );
};

export default MatchList;