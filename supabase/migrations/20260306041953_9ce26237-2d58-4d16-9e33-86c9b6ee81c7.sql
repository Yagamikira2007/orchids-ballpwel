
CREATE TABLE public.match_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id bigint NOT NULL,
  match_id text NOT NULL,
  home_name text NOT NULL,
  away_name text NOT NULL,
  match_time timestamp with time zone NOT NULL,
  remind_before integer NOT NULL DEFAULT 15,
  reminded boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(chat_id, match_id)
);

ALTER TABLE public.match_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow edge functions full access on match_reminders"
ON public.match_reminders FOR ALL
USING (true)
WITH CHECK (true);

CREATE INDEX idx_match_reminders_due ON public.match_reminders (reminded, match_time);
