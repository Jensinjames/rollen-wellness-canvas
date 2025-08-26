
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { securityConfig } from "./vite.security.config";

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
  },
  plugins: [
    react(),
    process.env.NODE_ENV === "development" &&
      componentTagger(),
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
        // Add content hash to JS files for better caching
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
      },
    },
  },
  css: {
    // Enable CSS optimization
    devSourcemap: true,
  },
  esbuild: {
    // Target modern ES syntax to reduce bundle size
    target: 'es2020',
  },
});
