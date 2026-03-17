-- Insert new app settings for favicon and theme color if they don't exist
INSERT INTO public.app_settings (setting_key, setting_value)
VALUES 
  ('favicon_url', ''),
  ('primary_color', '142 71% 45%')
ON CONFLICT (setting_key) DO NOTHING;