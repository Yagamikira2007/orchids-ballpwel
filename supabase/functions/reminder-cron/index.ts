import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BOT_TOKEN = () => Deno.env.get("TELEGRAM_BOT_TOKEN")!;

const getSupabase = () =>
  createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

async function sendTelegramMessage(chatId: number, text: string) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN()}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
    }),
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const sb = getSupabase();
    const now = new Date();

    // Find reminders that are due: match_time - remind_before <= now AND not yet reminded
    const { data: reminders, error } = await sb
      .from("match_reminders")
      .select("*")
      .eq("reminded", false)
      .gte("match_time", now.toISOString()); // only future matches

    if (error) {
      console.error("Error fetching reminders:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let sentCount = 0;

    for (const reminder of reminders || []) {
      const matchTime = new Date(reminder.match_time);
      const remindAt = new Date(matchTime.getTime() - reminder.remind_before * 60000);

      if (now >= remindAt) {
        // Time to send reminder
        const minsLeft = Math.max(0, Math.round((matchTime.getTime() - now.getTime()) / 60000));

        const lang = await getUserLang(sb, reminder.chat_id);
        const text = lang === "my"
          ? `⏰ <b>ပွဲ REMINDER</b>\n━━━━━━━━━━━━━━━━━━━━━━━━\n\n🏟 <b>${reminder.home_name}</b> vs <b>${reminder.away_name}</b>\n\n⏱ ပွဲစဖို့ <b>${minsLeft} မိနစ်</b> သာ လိုပါတော့သည်!\n\n📺 အခုပဲ ကြည့်ရှုရန် ပြင်ဆင်ပါ!\n━━━━━━━━━━━━━━━━━━━━━━━━`
          : `⏰ <b>MATCH REMINDER</b>\n━━━━━━━━━━━━━━━━━━━━━━━━\n\n🏟 <b>${reminder.home_name}</b> vs <b>${reminder.away_name}</b>\n\n⏱ Match starts in <b>${minsLeft} minutes</b>!\n\n📺 Get ready to watch!\n━━━━━━━━━━━━━━━━━━━━━━━━`;

        await sendTelegramMessage(reminder.chat_id, text);

        // Mark as reminded
        await sb
          .from("match_reminders")
          .update({ reminded: true })
          .eq("id", reminder.id);

        sentCount++;
      }
    }

    // Clean up old reminders (match already started > 2 hours ago)
    const cutoff = new Date(now.getTime() - 2 * 60 * 60000).toISOString();
    await sb.from("match_reminders").delete().lt("match_time", cutoff);

    return new Response(
      JSON.stringify({ success: true, sent: sentCount }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Reminder cron error:", error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function getUserLang(sb: any, chatId: number): Promise<"en" | "my"> {
  const { data } = await sb
    .from("telegram_user_settings")
    .select("language")
    .eq("chat_id", chatId)
    .maybeSingle();
  return (data?.language as "en" | "my") || "my";
}
