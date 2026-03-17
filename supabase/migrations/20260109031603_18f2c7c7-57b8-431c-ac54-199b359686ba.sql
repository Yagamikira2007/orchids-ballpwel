-- Create table for overlay ads
CREATE TABLE public.overlay_ads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  link_url TEXT,
  position TEXT NOT NULL DEFAULT 'bottom-right',
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_duration INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.overlay_ads ENABLE ROW LEVEL SECURITY;

-- Anyone can view active ads
CREATE POLICY "Anyone can view active ads" 
ON public.overlay_ads 
FOR SELECT 
USING (is_active = true);

-- Only admins can manage ads
CREATE POLICY "Only admins can insert ads" 
ON public.overlay_ads 
FOR INSERT 
WITH CHECK (is_admin());

CREATE POLICY "Only admins can update ads" 
ON public.overlay_ads 
FOR UPDATE 
USING (is_admin());

CREATE POLICY "Only admins can delete ads" 
ON public.overlay_ads 
FOR DELETE 
USING (is_admin());

-- Add trigger for updated_at
CREATE TRIGGER update_overlay_ads_updated_at
BEFORE UPDATE ON public.overlay_ads
FOR EACH ROW
EXECUTE FUNCTION public.update_app_settings_updated_at();