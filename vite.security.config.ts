
import { defineConfig } from 'vite';
import { SECURITY_CONFIG } from './src/utils/securityConfig';

// Build base CSP from security config
const baseCspString = Object.entries(SECURITY_CONFIG.CONTENT_SECURITY_POLICY)
  .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
  .join('; ');

const isProd = process.env.NODE_ENV === 'production';

// Development CSP: allow embedding in iframe and Vite HMR (ws), keep reasonable defaults
const devCspString = [
  "default-src 'self' blob: data:",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://*.supabase.co",
  "connect-src * ws: wss:",
  "frame-ancestors *",
].join('; ');

// Production CSP: strict policy from SECURITY_CONFIG + explicit frame-ancestors none
const prodCspString = `${baseCspString}; frame-ancestors 'none'`;

export const securityConfig = defineConfig({
  server: {
    headers: {
      // Use environment-aware CSP
      'Content-Security-Policy': isProd ? prodCspString : devCspString,

      // Security headers
      // NOTE: We intentionally omit X-Frame-Options and rely on frame-ancestors in CSP
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',

      // HSTS (only effective over HTTPS)
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',

      // Remove server information
      'X-Powered-By': '',
      'Server': '',
    },
  },
});
