
import type { ServerOptions } from 'vite';

export const securityConfig = {
  server: {
    headers: {
      // Security headers
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      
      // Ensure proper MIME types for JavaScript modules
      'Content-Type': 'application/javascript; charset=utf-8',
    },
    cors: {
      origin: false,
      credentials: false,
    },
    // Configure proper MIME type handling
    middlewareMode: false,
  } satisfies Partial<ServerOptions>,
  
  // MIME type configuration
  mimeTypes: {
    '.js': 'application/javascript',
    '.mjs': 'application/javascript',
    '.jsx': 'application/javascript',
    '.ts': 'application/javascript',
    '.tsx': 'application/javascript',
  },
};
