import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function getSupabase() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

async function getCachedPrediction(sb: any, cacheKey: string) {
  try {
    const { data } = await sb
      .from("prediction_cache")
      .select("prediction")
      .eq("cache_key", cacheKey)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();
    return data?.prediction ?? null;
  } catch { return null; }
}

async function setCachedPrediction(sb: any, cacheKey: string, prediction: unknown) {
  try {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    await sb.from("prediction_cache").upsert(
      { cache_key: cacheKey, prediction, expires_at: expiresAt },
      { onConflict: "cache_key" }
    );
  } catch {}
}

function buildBatchPrompt(matches: any[], language: string = 'en'): string {
  const matchList = matches.map((m: any, i: number) =>
    `${i + 1}. ${m.home_name} vs ${m.away_name} (${m.competition}) Score: ${m.score} Time: ${m.time}`
  ).join("\n");

  const langInstruction = language === 'my' 
    ? `\nCRITICAL: Write "analysis" and tip "description" fields in Burmese (Myanmar) language. Keep "tip" names, "winner" values in English.`
    : '';

  return `You are an elite football betting analyst. Analyze these matches and provide predictions for EACH.

Matches:
${matchList}

For EACH match provide:
- winner: "home" or "away" or "draw"
- confidence: number 0-100
- predicted_score: "HomeGoals-AwayGoals"
- tips: array of 3 tips with {tip, confidence: "high"|"medium"|"low", description}
- analysis: under 40 words

Betting formats: Handicap, Over/Under, BTTS, 1X2, Correct Score, Double Chance, HT/FT

IMPORTANT: Include at least one "Correct Score" tip per match.
${langInstruction}

Respond with ONLY valid JSON array:
[{"match_index":1,"winner":"home","confidence":72,"predicted_score":"2-1","tips":[...],"analysis":"..."},...]`;
}

async function getAIResponse(prompt: string): Promise<string> {
  // Try Groq first
  const groqKey = Deno.env.get("GROQ_API_KEY");
  if (groqKey) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${groqKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: "You are a football betting analyst. Respond with ONLY valid JSON. No markdown." },
            { role: "user", content: prompt },
          ],
          temperature: 0.3,
          max_tokens: 8192,
          response_format: { type: "json_object" },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) return content;
      }
    } catch (e) { console.warn("Groq failed:", e.message); }
  }

  // Fallback: Lovable AI
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  if (lovableKey) {
    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${lovableKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: "You are a football betting analyst. Respond with ONLY valid JSON. No markdown." },
            { role: "user", content: prompt },
          ],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) return content;
      }
    } catch (e) { console.warn("Lovable AI failed:", e.message); }
  }

  throw new Error("All AI providers failed");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { matches, language } = await req.json();
    const lang = (language || 'en').trim();
    if (!matches || !Array.isArray(matches) || matches.length === 0) {
      return new Response(JSON.stringify({ error: "No matches provided" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sb = getSupabase();
    const results: any[] = [];
    const uncached: any[] = [];

    // Check cache for each match
    for (const match of matches) {
      const cacheKey = `${lang}-${match.home_name.trim()}-${match.away_name.trim()}-${(match.score || "vs").trim()}`;
      const cached = await getCachedPrediction(sb, cacheKey);
      if (cached) {
        results.push({
          ...match,
          prediction: cached,
          cached: true,
        });
      } else {
        uncached.push({ ...match, cacheKey });
      }
    }

    // Process uncached in batches of 5
    if (uncached.length > 0) {
      const batchSize = 5;
      for (let i = 0; i < uncached.length; i += batchSize) {
        const batch = uncached.slice(i, i + batchSize);
        try {
          const prompt = buildBatchPrompt(batch, lang);
          const content = await getAIResponse(prompt);
          
          let cleaned = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
          // Try to find array or object with predictions array
          let predictions: any[];
          const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
          if (arrayMatch) {
            predictions = JSON.parse(arrayMatch[0]);
          } else {
            const objMatch = cleaned.match(/\{[\s\S]*\}/);
            if (objMatch) {
              const obj = JSON.parse(objMatch[0]);
              predictions = obj.predictions || obj.matches || [obj];
            } else {
              throw new Error("No JSON found");
            }
          }

          for (let j = 0; j < batch.length; j++) {
            const pred = predictions[j] || predictions.find((p: any) => p.match_index === j + 1);
            if (pred) {
              // Fix winner consistency
              if (pred.predicted_score) {
                const parts = pred.predicted_score.split("-").map(Number);
                if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
                  if (parts[0] > parts[1]) pred.winner = "home";
                  else if (parts[0] < parts[1]) pred.winner = "away";
                  else pred.winner = "draw";
                }
              }
              delete pred.match_index;
              results.push({ ...batch[j], prediction: pred, cached: false });
              // Cache async
              setCachedPrediction(sb, batch[j].cacheKey, pred);
            }
          }
        } catch (e) {
          console.error("Batch prediction error:", e.message);
          // Add matches without predictions
          for (const m of batch) {
            results.push({ ...m, prediction: null, cached: false });
          }
        }
      }
    }

    return new Response(JSON.stringify({ predictions: results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Accumulator error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate accumulator predictions" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
