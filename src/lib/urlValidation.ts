/**
 * URL validation utilities for security
 */

// List of trusted stream provider domains
const TRUSTED_DOMAINS = [
  // Add trusted streaming domains here
  'youtube.com',
  'youtu.be',
  'twitch.tv',
  'dailymotion.com',
  'vimeo.com',
  'facebook.com',
  'streamable.com',
];

/**
 * Validates that a URL uses a safe protocol (http/https only)
 */
export function isValidUrlScheme(url: string): boolean {
  if (!url) return false;
  
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Checks if a URL is from a trusted domain
 * Note: For now, we allow all http/https URLs but log unknown domains
 */
export function isFromTrustedDomain(url: string): boolean {
  if (!url) return false;
  
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    
    // Check if domain matches any trusted domain
    const isTrusted = TRUSTED_DOMAINS.some(domain => 
      hostname === domain || hostname.endsWith(`.${domain}`)
    );
    
    if (!isTrusted) {
      console.warn(`Stream from non-trusted domain: ${hostname}`);
    }
    
    // Still allow, but log for monitoring
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates a stream URL for embedding
 * Returns true if the URL is safe to embed
 */
export function isValidStreamUrl(url: string): boolean {
  if (!url) return false;
  
  // Must be http/https
  if (!isValidUrlScheme(url)) {
    console.error(`Invalid URL scheme for: ${url}`);
    return false;
  }
  
  // Block javascript: and data: URLs that might bypass protocol check
  const lowerUrl = url.toLowerCase().trim();
  if (lowerUrl.startsWith('javascript:') || 
      lowerUrl.startsWith('data:') ||
      lowerUrl.startsWith('vbscript:')) {
    console.error(`Blocked dangerous URL scheme: ${url}`);
    return false;
  }
  
  return true;
}

/**
 * Sanitizes a URL for safe display (not for embedding)
 */
export function sanitizeUrlForDisplay(url: string): string {
  if (!url) return '';
  
  try {
    const parsed = new URL(url);
    // Only allow http/https
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return '';
    }
    return parsed.href;
  } catch {
    return '';
  }
}
