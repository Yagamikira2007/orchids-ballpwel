import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ExternalLink } from 'lucide-react';

interface AdBannerProps {
  index: number;
}

interface BannerAd {
  id: string;
  name: string;
  image_url: string;
  link_url: string | null;
  sort_order: number;
}

const AdBanner = ({ index }: AdBannerProps) => {
  const { data: banners } = useQuery({
    queryKey: ['ad-banners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ad_banners')
        .select('id, name, image_url, link_url, sort_order')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data as BannerAd[];
    },
    staleTime: 5 * 60 * 1000,
  });

  if (!banners || banners.length === 0) return null;

  // Pick banner based on index (rotate through available banners)
  const banner = banners[index % banners.length];

  const content = (
    <div className="relative group rounded-xl overflow-hidden border border-border/40 bg-card/50 backdrop-blur transition-all hover:border-primary/30 hover:shadow-lg">
      <img
        src={banner.image_url}
        alt={banner.name}
        className="w-full h-auto object-cover max-h-32 sm:max-h-40"
        loading="lazy"
      />
      {/* Subtle ad label */}
      <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-background/70 backdrop-blur-sm">
        <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider">Ad</span>
      </div>
      {banner.link_url && (
        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="p-1.5 rounded-full bg-primary/90 text-primary-foreground">
            <ExternalLink className="w-3 h-3" />
          </div>
        </div>
      )}
    </div>
  );

  if (banner.link_url) {
    return (
      <a href={banner.link_url} target="_blank" rel="noopener noreferrer nofollow" className="block">
        {content}
      </a>
    );
  }

  return content;
};

export default AdBanner;
