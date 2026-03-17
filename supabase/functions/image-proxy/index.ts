import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Allowlisted image hostnames
const ALLOWED_HOSTS = [
  "myanmarlive2d3d.online",
  "api.myanmarlive2d3d.online",
  "img.myanmarlive2d3d.online",
  "cdn.myanmarlive2d3d.online",
  "i.imgur.com",
  "upload.wikimedia.org",
  "crests.football-data.org",
  "media.api-sports.io",
  "tmssl.akamaized.net",
  "flagcdn.com",
];

function isAllowedHost(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  return ALLOWED_HOSTS.some(
    (allowed) => lower === allowed || lower.endsWith(`.${allowed}`)
  );
}

function isPrivateIP(hostname: string): boolean {
  // Block private/internal IPs
  const privatePatterns = [
    /^127\./,
    /^10\./,
    /^172\.(1[6-9]|2\d|3[01])\./,
    /^192\.168\./,
    /^169\.254\./,
    /^0\./,
    /^localhost$/i,
    /^\[::1\]$/,
    /^metadata\.google\.internal$/i,
  ];
  return privatePatterns.some((p) => p.test(hostname));
}

function isImageContentType(contentType: string | null): boolean {
  if (!contentType) return false;
  return contentType.startsWith("image/");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const imageUrl = url.searchParams.get("url");

    if (!imageUrl) {
      return new Response(JSON.stringify({ error: "Missing url" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate URL
    let parsed: URL;
    try {
      parsed = new URL(imageUrl);
    } catch {
      return new Response(JSON.stringify({ error: "Invalid URL" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Only allow http/https
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return new Response(JSON.stringify({ error: "Forbidden protocol" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Block private/internal IPs
    if (isPrivateIP(parsed.hostname)) {
      return new Response(JSON.stringify({ error: "Forbidden host" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check allowlisted hosts
    if (!isAllowedHost(parsed.hostname)) {
      return new Response(JSON.stringify({ error: "Host not allowed" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch(imageUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "image/webp,image/avif,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        Referer: imageUrl,
        "Sec-Fetch-Dest": "image",
        "Sec-Fetch-Mode": "no-cors",
        "Sec-Fetch-Site": "same-origin",
      },
    });

    if (!response.ok) {
      return new Response(JSON.stringify({ error: "Failed" }), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate response content type is an image
    const contentType = response.headers.get("content-type") || "";
    if (!isImageContentType(contentType)) {
      return new Response(
        JSON.stringify({ error: "Response is not an image" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64 = base64Encode(new Uint8Array(arrayBuffer));

    return new Response(
      JSON.stringify({ data: base64, type: contentType }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=86400",
        },
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: "Proxy error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
