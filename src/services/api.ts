import { Match } from '@/types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Generate a stable ID from match data (team names + time)
const generateStableId = (match: Match): string => {
  const raw = `${(match.home_name || '').trim()}-${(match.away_name || '').trim()}-${(match.time || '').trim()}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return `m${Math.abs(hash).toString(36)}`;
};

export const footballAPI = {
  getMatches: async (): Promise<Match[]> => {
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/matches-proxy`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch matches');
      }
      const data = await response.json();
      
      // Add stable unique IDs based on team names + time
      return (data || []).map((match: Match) => ({
        ...match,
        id: generateStableId(match),
      }));
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },
};
