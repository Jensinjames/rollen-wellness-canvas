
/**
 * Enhanced security headers configuration
 */

export const ENHANCED_SECURITY_CONFIG = {
  // Tightened Content Security Policy with Lovable domain support
  CONTENT_SECURITY_POLICY: {
    'default-src': ["'self'"],
    'script-src': ["'self'", "https://*.supabase.co"],
    'style-src': ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    'font-src': ["'self'", "https://fonts.gstatic.com"],
    'img-src': ["'self'", "data:", "https://*.supabase.co"],
    'connect-src': [
      "'self'", 
      "https://*.supabase.co", 
      "wss://*.supabase.co",
      "https://*.lovableproject.com",
      "https://*.lovable.app",
      "wss://*.lovableproject.com"
    ],
    'frame-ancestors': ["'none'"],
    'form-action': ["'self'"],
    'base-uri': ["'self'"],
    'object-src': ["'none'"],
  },
  
  // Additional security headers
  SECURITY_HEADERS: {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  },

  // Session security settings
  SESSION_SECURITY: {
    WARNING_TIME: 25 * 60 * 1000, // 25 minutes
    TIMEOUT_TIME: 30 * 60 * 1000, // 30 minutes
    REFRESH_THRESHOLD: 5 * 60 * 1000, // 5 minutes before expiry
  }
} as const;

// Generate CSP header string
export const generateCSPHeader = (): string => {
  const csp = ENHANCED_SECURITY_CONFIG.CONTENT_SECURITY_POLICY;
  return Object.entries(csp)
    .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
    .join('; ');
};

// Security headers middleware for development
export const applySecurityHeaders = () => {
  if (typeof document !== 'undefined') {
    // Apply meta tags for security headers in development
    const metaTags = [
      { name: 'Content-Security-Policy', content: generateCSPHeader() },
      { name: 'X-Frame-Options', content: 'DENY' },
      { name: 'X-Content-Type-Options', content: 'nosniff' },
      { name: 'Referrer-Policy', content: 'strict-origin-when-cross-origin' },
    ];

    metaTags.forEach(({ name, content }) => {
      const existing = document.querySelector(`meta[http-equiv="${name}"]`);
      if (!existing) {
        const meta = document.createElement('meta');
        meta.setAttribute('http-equiv', name);
        meta.setAttribute('content', content);
        document.head.appendChild(meta);
      }
    });
  }
};
