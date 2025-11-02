
import { defineConfig } from 'vite';
import { SECURITY_CONFIG } from './src/utils/securityConfig';

// Convert CSP object to string
const cspString = Object.entries(SECURITY_CONFIG.CONTENT_SECURITY_POLICY)
  .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
  .join('; ');

export const securityConfig = defineConfig({
  server: {
    headers: {
      // Content Security Policy
      'Content-Security-Policy': cspString,
      
      // Security headers
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
      
      // HSTS (only for HTTPS)
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      
      // Remove server information
      'X-Powered-By': '',
      'Server': '',
    },
  },
});
