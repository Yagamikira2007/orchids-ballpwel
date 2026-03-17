
CREATE TABLE public.telegram_user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id bigint NOT NULL UNIQUE,
  language text NOT NULL DEFAULT 'en',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.telegram_user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow edge functions full access" ON public.telegram_user_settings
  FOR ALL USING (true) WITH CHECK (true);
