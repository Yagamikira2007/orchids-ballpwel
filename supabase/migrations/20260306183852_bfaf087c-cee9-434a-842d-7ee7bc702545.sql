INSERT INTO public.app_settings (setting_key, setting_value)
VALUES ('ticker_text', '')
ON CONFLICT DO NOTHING;