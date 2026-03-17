import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

function getSupabase() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

async function getCachedPrediction(cacheKey: string): Promise<unknown | null> {
  try {
    const sb = getSupabase();
    const { data } = await sb
      .from("prediction_cache")
      .select("prediction")
      .eq("cache_key", cacheKey)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();
    return data?.prediction ?? null;
  } catch (e) {
    console.warn("Cache read error:", e.message);
    return null;
  }
}

async function setCachedPrediction(cacheKey: string, prediction: unknown): Promise<void> {
  try {
    const sb = getSupabase();
    const expiresAt = new Date(Date.now() + CACHE_TTL_MS).toISOString();
    await sb.from("prediction_cache").upsert(
      { cache_key: cacheKey, prediction, expires_at: expiresAt },
      { onConflict: "cache_key" }
    );
  } catch (e) {
    console.warn("Cache write error:", e.message);
  }
}

function isLiveMatch(matchScore: string, matchTime: string): boolean {
  const timeLower = matchTime.toLowerCase();
  const hasScore = /\d+\s*-\s*\d+/.test(matchScore) && matchScore.trim() !== 'vs';
  return timeLower.includes('live') || timeLower.includes("'") || timeLower.includes('ht') || hasScore;
}

function buildPrompt(homeName: string, awayName: string, comp: string, matchScore: string, matchTime: string, language: string = 'en'): string {
  const live = isLiveMatch(matchScore, matchTime);
  const scoreParts = matchScore.match(/(\d+)\s*-\s*(\d+)/);
  
  let liveContext = '';
  if (live && scoreParts) {
    const [, homeGoals, awayGoals] = scoreParts;
    const hg = parseInt(homeGoals), ag = parseInt(awayGoals);
    const totalGoals = hg + ag;
    const timeMatch = matchTime.match(/(\d+)/);
    const minute = timeMatch ? parseInt(timeMatch[0]) : 45;
    const remainingMin = Math.max(90 - minute, 0);
    const goalRate = totalGoals / Math.max(minute, 1);
    const projectedTotal = (goalRate * 90).toFixed(1);
    
    liveContext = `
═══ LIVE MATCH DATA ═══
Current Score: ${homeName} ${homeGoals} - ${awayGoals} ${awayName}
Minute: ${minute}' | Remaining: ~${remainingMin} min
Goals So Far: ${totalGoals} | Rate: ${goalRate.toFixed(3)}/min → projected ${projectedTotal}/90min
State: ${hg > ag ? homeName + ' LEADING' : ag > hg ? awayName + ' LEADING' : 'LEVEL'}
${minute > 75 ? '⚠️ LATE GAME: Results tend to hold' : ''}
${minute < 30 && totalGoals >= 2 ? '⚠️ EARLY HIGH-SCORING: Pace may slow' : ''}
${minute > 60 && totalGoals === 0 ? '⚠️ LATE 0-0: Under trend strong' : ''}

CRITICAL LIVE RULES:
- The score is REAL and HAPPENING NOW. Predict the FINAL result from here.
- A team leading 2-0 after 70' wins ~95% of the time.
- Adjust Over/Under based on CURRENT goals + remaining time.`;
  }

  const langInstruction = language === 'my' 
    ? `\n═══ BURMESE LANGUAGE ═══\nWrite "analysis" and tip "description" fields in Burmese. Keep "tip" names and "winner" in English.`
    : '';

  return `You are an elite football analyst AI. You MUST use Google Search to look up REAL-TIME data before making predictions. This is CRITICAL.

═══ MATCH INFO ═══
Home: ${homeName}
Away: ${awayName}
Competition: ${comp}
Score: ${matchScore}
Time: ${matchTime}
${liveContext}

═══ MANDATORY RESEARCH STEPS (USE GOOGLE SEARCH FOR EACH) ═══

🔍 STEP 1 — SEARCH FOR CURRENT LINEUPS & SQUADS
- Search: "${homeName} lineup today" OR "${homeName} squad 2025"
- Search: "${awayName} lineup today" OR "${awayName} squad 2025"
- Find out which players are currently in each team's squad
- Identify key players, recent transfers IN and OUT
- Note: Players transfer between clubs frequently. Make sure you have the CURRENT squad.

🔍 STEP 2 — SEARCH FOR INJURIES & SUSPENSIONS
- Search: "${homeName} injuries" and "${awayName} injuries"
- Find currently injured/suspended players
- Note which key players are MISSING from the lineup

🔍 STEP 3 — SEARCH FOR CURRENT FORM (Last 5-10 matches)
- Search: "${homeName} recent results 2025" and "${awayName} recent results 2025"
- Get actual recent match results, not guesses
- Note home/away form specifically

🔍 STEP 4 — SEARCH FOR HEAD-TO-HEAD
- Search: "${homeName} vs ${awayName} head to head"
- Get actual historical results between these teams

🔍 STEP 5 — SEARCH FOR LEAGUE TABLE POSITION
- Search: "${comp} table standings 2025"
- Find current league positions and motivation context

═══ AFTER RESEARCH, ANALYZE ═══

STEP 6 — REALISTIC SCORELINE
Common scorelines: 1-0 ~17% | 0-0 ~8% | 2-1 ~12% | 1-1 ~12% | 2-0 ~10%
Scores like 4-3, 5-2 are VERY RARE (<1%).

═══ ACCURACY RULES ═══
🔴 DO NOT:
- Make up player names or injury reports — USE SEARCH
- Claim a player is at a club without verifying — USE SEARCH
- Give generic analysis without real data
- Default to 2-1 for every match

🟢 YOU MUST:
- Cite specific player names from your search results
- Mention actual recent results you found
- Name injured/suspended players specifically
- Reference actual league positions

═══ CONFIDENCE CALIBRATION ═══
- 80-84: Slight edge, could go either way
- 85-89: Clear form/quality advantage
- 90-94: Dominant vs weak with strong evidence
- 95-100: ONLY extreme mismatches

═══ BETTING TIPS (3-5 tips, all HIGH confidence) ═══
Different markets: 1X2, Over/Under, BTTS, Asian Handicap, Correct Score, etc.
Each tip MUST have specific reasoning with real data from your search.

═══ ANALYSIS ═══
Write 4-6 detailed sentences with SPECIFIC facts: player names, recent scores, injury names, league positions.
${langInstruction}

═══ RESPOND WITH ONLY THIS JSON ═══
{
  "winner": "home|away|draw",
  "confidence": 83,
  "predicted_score": "1-0",
  "tips": [
    {"tip": "Market Name", "confidence": "high", "description": "Specific reasoning with real data..."}
  ],
  "analysis": "Detailed analysis with real player names, actual recent results, verified injuries..."
}`;
}

// Provider 1: Gemini with Google Search grounding (PRIMARY - has real-time data)
async function tryGeminiGrounded(prompt: string): Promise<string> {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ 
          role: "user",
          parts: [{ text: prompt }] 
        }],
        tools: [{ google_search: {} }],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 8000,
        },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    console.error("Gemini grounded error:", res.status, err);
    throw new Error(`Gemini grounded error: ${res.status}`);
  }

  const data = await res.json();
  const parts = data.candidates?.[0]?.content?.parts;
  if (!parts) throw new Error("No content in Gemini response");
  
  // Extract text from parts (may include grounding metadata)
  let textContent = "";
  for (const part of parts) {
    if (part.text) textContent += part.text;
  }
  
  console.log("Gemini grounded search used:", 
    data.candidates?.[0]?.groundingMetadata ? "YES" : "NO");
  
  return textContent;
}

// Provider 2: Lovable AI Gateway (fallback - no real-time search but good reasoning)
async function tryLovableAI(prompt: string): Promise<string> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) throw new Error("LOVABLE_API_KEY not set");

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-pro",
      messages: [
        { role: "system", content: "You are an elite football prediction analyst. Respond with ONLY valid JSON, no markdown." },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("Lovable AI error:", res.status, err);
    throw new Error(`Lovable AI error: ${res.status}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

// Provider 3: Groq (last resort)
async function tryGroq(prompt: string): Promise<string> {
  const apiKey = Deno.env.get("GROQ_API_KEY");
  if (!apiKey) throw new Error("GROQ_API_KEY not set");

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: "You are an elite football prediction analyst. Respond with ONLY valid JSON." },
        { role: "user", content: prompt },
      ],
      temperature: 0.4,
      max_tokens: 4000,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("Groq error:", res.status, err);
    throw new Error(`Groq error: ${res.status}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

async function getAIResponse(prompt: string): Promise<string> {
  const providers = [
    { name: "Gemini Grounded (Search)", fn: () => tryGeminiGrounded(prompt) },
    { name: "Lovable AI (Pro)", fn: () => tryLovableAI(prompt) },
    { name: "Groq", fn: () => tryGroq(prompt) },
  ];

  for (const provider of providers) {
    try {
      console.log(`Trying ${provider.name}...`);
      const result = await provider.fn();
      if (result) {
        console.log(`${provider.name} succeeded`);
        return result;
      }
    } catch (e) {
      console.warn(`${provider.name} failed:`, e.message);
    }
  }

  throw new Error("All AI providers failed");
}

function validateAndFixPrediction(prediction: any): any {
  if (prediction.predicted_score) {
    const scoreStr = String(prediction.predicted_score).trim();
    const parts = scoreStr.split("-").map((s: string) => parseInt(s.trim()));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      const [h, a] = parts;
      if (h > a) prediction.winner = "home";
      else if (h < a) prediction.winner = "away";
      else prediction.winner = "draw";
      prediction.predicted_score = `${h}-${a}`;
    }
  }

  if (prediction.confidence) {
    prediction.confidence = Math.max(80, Math.min(100, Math.round(prediction.confidence)));
  } else {
    prediction.confidence = 82;
  }

  if (!["home", "away", "draw"].includes(prediction.winner)) {
    prediction.winner = "home";
  }

  if (!Array.isArray(prediction.tips)) {
    prediction.tips = [];
  }

  prediction.tips = prediction.tips
    .filter((tip: any) => tip.tip && tip.description)
    .slice(0, 5)
    .map((tip: any) => ({
      tip: tip.tip,
      confidence: "high" as const,
      description: tip.description,
    }));

  if (!prediction.analysis || typeof prediction.analysis !== 'string' || prediction.analysis.length < 30) {
    prediction.analysis = "Detailed analysis could not be generated. Prediction is based on available statistical data and team form.";
  }

  return prediction;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { home_name, away_name, competition, score, time, language } = await req.json();

    if (!home_name || !away_name) {
      return new Response(JSON.stringify({ error: "Missing team names" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const homeName = home_name.trim();
    const awayName = away_name.trim();
    const comp = (competition || "Unknown").trim();
    const matchScore = (score || "Not started").trim();
    const matchTime = (time || "Unknown").trim();
    const lang = (language || "en").trim();

    const live = isLiveMatch(matchScore, matchTime);
    
    // v5 cache key - grounded with real-time search
    const cacheKey = live 
      ? `v5-live-${lang}-${homeName}-${awayName}-${matchScore}` 
      : `v5-pre-${lang}-${homeName}-${awayName}`;
    
    const cached = await getCachedPrediction(cacheKey);
    if (cached) {
      console.log("Cache hit:", cacheKey);
      return new Response(JSON.stringify(cached), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Cache miss:", cacheKey, live ? "(LIVE)" : "(PRE-MATCH)", `lang=${lang}`);
    const prompt = buildPrompt(homeName, awayName, comp, matchScore, matchTime, lang);
    const content = await getAIResponse(prompt);

    // Robust JSON extraction
    let prediction: any = null;
    const rawContent = content.trim();
    
    try {
      prediction = JSON.parse(rawContent);
    } catch {
      let cleaned = rawContent.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          prediction = JSON.parse(jsonMatch[0]);
        } catch {
          let fixed = jsonMatch[0]
            .replace(/,\s*}/g, "}")
            .replace(/,\s*]/g, "]")
            .replace(/[\x00-\x1F\x7F]/g, " ");
          try {
            prediction = JSON.parse(fixed);
          } catch (e) {
            console.error("JSON parse failed. Raw:", rawContent.substring(0, 500));
            throw new Error("Failed to parse AI response");
          }
        }
      } else {
        console.error("No JSON found. Raw:", rawContent.substring(0, 500));
        throw new Error("No JSON in response");
      }
    }

    prediction = validateAndFixPrediction(prediction);
    setCachedPrediction(cacheKey, prediction);

    return new Response(JSON.stringify(prediction), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Prediction error:", error);
    return new Response(
      JSON.stringify({ error: "Unable to generate prediction. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
