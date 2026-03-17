import { useState, useEffect, memo } from 'react';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Cache data URIs globally
const cache = new Map<string, string>();
const failedCache = new Set<string>();

interface ProxiedImageProps {
  src: string;
  alt: string;
  className?: string;
  loading?: 'lazy' | 'eager';
}

const ProxiedImage = memo(({ src, alt, className, loading = 'lazy' }: ProxiedImageProps) => {
  const [dataUri, setDataUri] = useState<string | null>(cache.get(src) || null);
  const [failed, setFailed] = useState(failedCache.has(src));

  useEffect(() => {
    if (!src || cache.has(src) || failedCache.has(src)) return;

    let cancelled = false;

    const fetchImage = async () => {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/functions/v1/image-proxy?url=${encodeURIComponent(src)}`,
          {
            headers: {
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            },
          }
        );
        if (!res.ok) throw new Error('Failed');
        const json = await res.json();
        const uri = `data:${json.type};base64,${json.data}`;
        cache.set(src, uri);
        if (!cancelled) setDataUri(uri);
      } catch {
        failedCache.add(src);
        if (!cancelled) setFailed(true);
      }
    };

    fetchImage();
    return () => { cancelled = true; };
  }, [src]);

  if (failed || !dataUri) return null;

  return <img src={dataUri} alt={alt} className={className} loading={loading} />;
});

ProxiedImage.displayName = 'ProxiedImage';

export default ProxiedImage;
