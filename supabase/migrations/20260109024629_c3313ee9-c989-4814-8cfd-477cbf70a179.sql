-- Create app_settings table for storing app configuration
CREATE TABLE public.app_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read settings (public app config)
CREATE POLICY "Anyone can view app settings" 
ON public.app_settings 
FOR SELECT 
USING (true);

-- Allow authenticated users to manage settings (admin functionality)
CREATE POLICY "Authenticated users can insert settings" 
ON public.app_settings 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update settings" 
ON public.app_settings 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

-- Insert default settings
INSERT INTO public.app_settings (setting_key, setting_value) VALUES
  ('app_name', 'Live Sports TV'),
  ('app_logo_url', ''),
  ('stream_dialog_logo_url', '');

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_app_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_app_settings_updated_at
BEFORE UPDATE ON public.app_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_app_settings_updated_at();

-- Create storage bucket for app assets
INSERT INTO storage.buckets (id, name, public) VALUES ('app-assets', 'app-assets', true);

-- Create policies for app assets uploads
CREATE POLICY "App assets are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'app-assets');

CREATE POLICY "Authenticated users can upload app assets" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'app-assets' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update app assets" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'app-assets' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete app assets" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'app-assets' AND auth.uid() IS NOT NULL);