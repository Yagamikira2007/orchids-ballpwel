import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// In-memory cache
let cachedData: { data: unknown; timestamp: number } | null = null;
const CACHE_TTL = 30 * 1000; // 30 seconds

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 60;
const RATE_WINDOW = 60 * 1000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
    return false;
  }
  if (record.count >= RATE_LIMIT) return true;
  record.count++;
  return false;
}

function formatMatchTime(timestamp: string): string {
  try {
    const ts = parseInt(timestamp) * 1000;
    const date = new Date(ts);
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    const day = date.getUTCDate().toString().padStart(2, '0');
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const year = date.getUTCFullYear();
    return `${hours}:${minutes} ${day}/${month}/${year}`;
  } catch {
    return '';
  }
}

function mapMatchStatus(status: string): string {
  switch (status) {
    case 'live': return 'live';
    case 'finished': return 'finished';
    case 'vs':
    default: return 'upcoming';
  }
}

interface RawMatch {
  match_time: string;
  match_status: string;
  home_team_name: string;
  home_team_logo: string;
  away_team_name: string;
  away_team_logo: string;
  league_name: string;
  match_score: string | null;
  servers: Array<{ name: string; stream_url: string; referer: string }>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                     req.headers.get('cf-connecting-ip') || 'unknown';
    
    if (isRateLimited(clientIP)) {
      return new Response(
        JSON.stringify({ error: 'Too many requests. Please try again later.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
      )
    }

    // Serve from cache if fresh
    const now = Date.now();
    if (cachedData && (now - cachedData.timestamp) < CACHE_TTL) {
      return new Response(JSON.stringify(cachedData.data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'HIT' },
        status: 200,
      })
    }

    const response = await fetch('https://api.myanmarlive2d3d.online/matches', {
      method: 'GET',
      headers: {
        'accept': '*/*',
        'accept-language': 'en-US,en;q=0.9',
        'origin': 'https://myanmarlive2d3d.online',
        'referer': 'https://myanmarlive2d3d.online/',
        'user-agent': 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/137.0.0.0 Mobile Safari/537.36',
      },
    })

    if (!response.ok) {
      console.error(`External API error: ${response.status}`)
      // Serve stale cache if available
      if (cachedData) {
        return new Response(JSON.stringify(cachedData.data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'STALE' },
          status: 200,
        })
      }
      throw new Error('External service unavailable')
    }

    const rawData: RawMatch[] = await response.json()

    const mapped = (rawData || []).map((m: RawMatch) => {
      const time = formatMatchTime(m.match_time);
      const statusHint = mapMatchStatus(m.match_status);
      const matchTimestamp = parseInt(m.match_time) || 0;

      let score = 'vs';
      if (m.match_score) {
        score = m.match_score;
      } else if (statusHint === 'live') {
        score = '0 - 0';
      }

      const authors = (m.servers || []).map((s) => ({
        name: s.name || 'Stream',
        url: s.stream_url || '',
        logo: '',
        referer: s.referer || '',
      }));

      return {
        view_url: '',
        label: m.league_name || '',
        time: statusHint === 'live' ? `Live ${time}` : time,
        home_logo: m.home_team_logo || '',
        home_name: m.home_team_name || '',
        score,
        away_logo: m.away_team_logo || '',
        away_name: m.away_team_name || '',
        url: '',
        authors,
        match_status: statusHint,
        match_timestamp: matchTimestamp,
      };
    });

    // Update cache
    cachedData = { data: mapped, timestamp: now };

    // Save finished matches to DB (fire-and-forget)
    const finished = mapped.filter((m: { match_status: string; score: string }) => m.match_status === 'finished' && m.score !== 'vs');
    if (finished.length > 0) {
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const sb = createClient(supabaseUrl, supabaseKey);

        const rows = finished.map((m: { home_name: string; away_name: string; match_timestamp: number; home_logo: string; away_logo: string; score: string; label: string; time: string }) => ({
          match_key: `${m.home_name}-${m.away_name}-${m.match_timestamp}`,
          home_name: m.home_name,
          away_name: m.away_name,
          home_logo: m.home_logo,
          away_logo: m.away_logo,
          score: m.score,
          league: m.label,
          match_timestamp: m.match_timestamp,
          match_time: m.time,
        }));

        await sb.from('match_results').upsert(rows, { onConflict: 'match_key', ignoreDuplicates: true });
      } catch (e) {
        console.error('Failed to save match results:', e);
      }
    }

    return new Response(JSON.stringify(mapped), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'MISS' },
      status: 200,
    })
  } catch (error: unknown) {
    console.error('Error fetching matches:', error)
    return new Response(
      JSON.stringify({ error: 'Unable to fetch matches. Please try again later.' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
