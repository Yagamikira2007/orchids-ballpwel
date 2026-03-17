import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, startOfDay, isToday, isYesterday, subDays } from 'date-fns';
import { CalendarIcon, Trophy, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { footballAPI } from '@/services/api';
import { getMatchStatus } from '@/hooks/useMatches';
import { Match } from '@/types';
import MatchList from '@/components/matches/MatchList';
import { Button } from '@/components/ui/button';

const Results = () => {
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()));

  // Live API data for today's finished matches
  const { data: apiMatches, isLoading: apiLoading } = useQuery({
    queryKey: ['matches'],
    queryFn: footballAPI.getMatches,
    
  });

  // DB data for historical results
  const selectedDayStart = Math.floor(selectedDate.getTime() / 1000);
  const selectedDayEnd = selectedDayStart + 86400;

  const { data: dbResults, isLoading: dbLoading } = useQuery({
    queryKey: ['match-results', selectedDayStart],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('match_results')
        .select('*')
        .gte('match_timestamp', selectedDayStart)
        .lt('match_timestamp', selectedDayEnd)
        .order('match_timestamp', { ascending: false });
      if (error) throw error;
      return data;
    },
    staleTime: 60 * 1000,
  });

  // Merge: API finished matches for today + DB results, deduplicated
  const mergedMatches = useMemo(() => {
    const matchMap = new Map<string, Match>();

    // Add DB results first
    (dbResults || []).forEach(r => {
      const key = `${r.home_name}-${r.away_name}-${r.match_timestamp}`;
      matchMap.set(key, {
        id: key,
        view_url: '',
        label: r.league || '',
        time: r.match_time || '',
        home_logo: r.home_logo || '',
        home_name: r.home_name,
        score: r.score,
        away_logo: r.away_logo || '',
        away_name: r.away_name,
        url: '',
        authors: [],
        match_status: 'finished',
        match_timestamp: Number(r.match_timestamp) || 0,
      });
    });

    // Override with API data if today (has more info like streams)
    if (isToday(selectedDate) && apiMatches) {
      apiMatches
        .filter(m => getMatchStatus(m.score, m.time, m.match_status) === 'finished')
        .forEach(m => {
          const key = `${m.home_name}-${m.away_name}-${m.match_timestamp || 0}`;
          matchMap.set(key, m);
        });
    }

    return Array.from(matchMap.values()).sort((a, b) =>
      (b.match_timestamp || 0) - (a.match_timestamp || 0)
    );
  }, [apiMatches, dbResults, selectedDate]);

  const isLoading = apiLoading || dbLoading;

  // Date navigation
  const goToPreviousDay = () => setSelectedDate(prev => subDays(prev, 1));
  const goToNextDay = () => {
    if (selectedDate < startOfDay(new Date())) {
      setSelectedDate(prev => subDays(prev, -1));
    }
  };
  const goToToday = () => setSelectedDate(startOfDay(new Date()));
  const canGoNext = selectedDate < startOfDay(new Date());

  const getDateLabel = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'dd MMM yyyy');
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="pt-2">
        <h1 className="font-display text-2xl md:text-3xl font-bold animate-slide-up text-foreground">
          Results
        </h1>
        <p className="text-muted-foreground text-sm animate-slide-up [animation-delay:100ms] [animation-fill-mode:backwards]">
          Match results and final scores
          {mergedMatches.length > 0 && (
            <span className="ml-2 inline-flex items-center gap-1 text-xs font-bold text-muted-foreground">
              <Trophy className="w-3 h-3" />
              {mergedMatches.length} finished
            </span>
          )}
        </p>
      </div>

      {/* Date Navigator */}
      <div className="flex items-center justify-between gap-2 p-2 rounded-2xl bg-card border border-border/50 animate-slide-up [animation-delay:200ms] [animation-fill-mode:backwards]">
        <Button
          variant="ghost"
          size="icon"
          onClick={goToPreviousDay}
          className="rounded-xl h-9 w-9 text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        <button
          onClick={goToToday}
          className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-secondary/60 border border-border/40 hover:bg-secondary transition-colors"
        >
          <CalendarIcon className="w-3.5 h-3.5 text-primary" />
          <span className="text-sm font-semibold">{getDateLabel(selectedDate)}</span>
        </button>

        <Button
          variant="ghost"
          size="icon"
          onClick={goToNextDay}
          disabled={!canGoNext}
          className="rounded-xl h-9 w-9 text-muted-foreground hover:text-foreground disabled:opacity-30"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {!isLoading && (
        <p className="text-xs text-muted-foreground font-medium px-1">
          {mergedMatches.length} match{mergedMatches.length !== 1 ? 'es' : ''} on {getDateLabel(selectedDate)}
        </p>
      )}

      <MatchList
        matches={mergedMatches}
        isLoading={isLoading}
        error={null}
      />
    </div>
  );
};

export default Results;
