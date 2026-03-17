
CREATE TABLE public.ad_banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  image_url text NOT NULL,
  link_url text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  frequency integer NOT NULL DEFAULT 3,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ad_banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active banners" ON public.ad_banners
  FOR SELECT USING (is_active = true);

CREATE POLICY "Only admins can insert banners" ON public.ad_banners
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Only admins can update banners" ON public.ad_banners
  FOR UPDATE USING (is_admin());

CREATE POLICY "Only admins can delete banners" ON public.ad_banners
  FOR DELETE USING (is_admin());
