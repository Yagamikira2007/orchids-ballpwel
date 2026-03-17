CREATE TABLE public.prediction_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key text NOT NULL UNIQUE,
  prediction jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);

CREATE INDEX idx_prediction_cache_key ON public.prediction_cache (cache_key);
CREATE INDEX idx_prediction_cache_expires ON public.prediction_cache (expires_at);

ALTER TABLE public.prediction_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow edge functions full access" ON public.prediction_cache
  FOR ALL USING (true) WITH CHECK (true);