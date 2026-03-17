
CREATE TABLE public.match_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_key text NOT NULL UNIQUE,
  home_name text NOT NULL,
  away_name text NOT NULL,
  home_logo text DEFAULT '',
  away_logo text DEFAULT '',
  score text NOT NULL,
  league text DEFAULT '',
  match_timestamp bigint DEFAULT 0,
  match_time text DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.match_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view match results"
  ON public.match_results FOR SELECT
  USING (true);

CREATE POLICY "Allow edge functions to insert results"
  ON public.match_results FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow edge functions to update results"
  ON public.match_results FOR UPDATE
  USING (true);
