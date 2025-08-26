
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
    // CSS optimization for better LCP
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        // Optimize asset loading
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) {
            return 'assets/css/[name]-[hash][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
  },
  css: {
    // Enable CSS optimization
    devSourcemap: true,
  },
});
