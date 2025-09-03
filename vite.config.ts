
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { securityConfig } from "./vite.security.config";
import viteCompression from 'vite-plugin-compression';

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
    ...securityConfig.server, // Include security headers
    // Add cache headers for development
    headers: {
      ...securityConfig.server?.headers,
      // Cache static assets for better performance
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
    // Ensure proper MIME types for JavaScript modules
    middlewareMode: false,
    fs: {
      strict: true,
    },
  },
  plugins: [
    react(),
    process.env.NODE_ENV === "development" &&
      componentTagger(),
    // Enable gzip compression for better performance
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 1024, // Only compress files larger than 1KB
      deleteOriginFile: false
    }),
    // Enable brotli compression as fallback
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 1024,
      deleteOriginFile: false
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Target modern browsers to avoid unnecessary transpilation
    target: ['chrome89', 'firefox88', 'safari14', 'edge89'],
    // CSS optimization for better LCP
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        // Optimize asset loading with proper hashing for cache busting
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) {
            return 'assets/css/[name]-[hash][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
        // Ensure JS files have .js extension for proper MIME type detection
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        // Force .js extension for all module outputs to prevent MIME type issues
        manualChunks: undefined,
      },
    },
    // Ensure proper MIME types in production build
    assetsInlineLimit: 4096,
  },
  css: {
    // Enable CSS optimization
    devSourcemap: true,
  },
  esbuild: {
    // Target modern ES syntax to reduce bundle size
    target: 'es2020',
  },
  // Configure proper MIME types for module scripts
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },
  // Ensure proper module resolution and MIME types
  optimizeDeps: {
    include: ['react', 'react-dom', '@tanstack/react-query'],
  },
});
