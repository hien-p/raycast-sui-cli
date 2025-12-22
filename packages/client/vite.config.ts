import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Astro blog server URL
const ASTRO_SERVER = 'http://localhost:4321';

// Track if we're in "blog mode" - set when /blog is accessed
// This is a workaround for the dual-server architecture in dev mode
let isBlogMode = false;

// Known Vite client version hashes (update if Vite cache is cleared)
// These are version hashes that Vite client uses for its own chunks
// Any chunk with a different version hash is likely from Astro
const VITE_CLIENT_HASHES = ['98232247', 'fe786e30', 'bfc48208'];

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://localhost:3002',
        changeOrigin: true,
      },
      // Blog routes - forward to Astro dev server
      '/blog': {
        target: ASTRO_SERVER,
        changeOrigin: true,
        bypass: (req) => {
          // Set blog mode when /blog HTML page is requested
          if (req.headers.accept?.includes('text/html')) {
            isBlogMode = true;
          }
          return undefined; // Always proxy /blog requests
        },
      },
      // Astro internal scripts for hydration
      '/@id/astro:': {
        target: ASTRO_SERVER,
        changeOrigin: true,
      },
      // Astro built assets
      '/_astro/': {
        target: ASTRO_SERVER,
        changeOrigin: true,
      },
      // Forward /src/ paths to Astro when request comes from blog pages
      // This handles Astro's component/style imports during dev
      '/src/components/react': {
        target: ASTRO_SERVER,
        changeOrigin: true,
        bypass: (req) => {
          // Only proxy if Referer is from blog
          const referer = req.headers.referer || '';
          if (referer.includes('/blog')) {
            return undefined; // Let proxy handle it
          }
          return req.url; // Skip proxy, let Vite handle it
        },
      },
      '/src/components/astro': {
        target: ASTRO_SERVER,
        changeOrigin: true,
      },
      '/src/components/ui/animated': {
        target: ASTRO_SERVER,
        changeOrigin: true,
      },
      '/src/styles': {
        target: ASTRO_SERVER,
        changeOrigin: true,
        bypass: (req) => {
          const referer = req.headers.referer || '';
          if (referer.includes('/blog')) {
            return undefined;
          }
          return req.url;
        },
      },
      '/src/layouts': {
        target: ASTRO_SERVER,
        changeOrigin: true,
      },
      // Forward @fs paths for Astro's node_modules (tailwind, etc)
      '/@fs': {
        target: ASTRO_SERVER,
        changeOrigin: true,
        bypass: (req) => {
          const referer = req.headers.referer || '';
          const url = req.url || '';
          // Forward to Astro if:
          // 1. Request comes from blog page
          // 2. URL contains astro-related paths
          if (referer.includes('/blog') || url.includes('astro') || url.includes('@astrojs')) {
            return undefined;
          }
          return req.url;
        },
      },
      // Forward ALL .vite/deps requests to Astro when in blog mode
      // This ensures React and other dependencies come from a single source
      // preventing "multiple copies of React" errors during hydration
      '/node_modules/.vite/deps/': {
        target: ASTRO_SERVER,
        changeOrigin: true,
        bypass: (req) => {
          const referer = req.headers.referer || '';
          const url = req.url || '';

          // Reset blog mode when navigating away from blog
          if (referer && !referer.includes('/blog') && !referer.includes('.tsx') && !referer.includes('.ts') && !referer.includes('.js')) {
            isBlogMode = false;
          }

          // Forward to Astro if in blog mode (set when /blog was accessed)
          if (isBlogMode) {
            return undefined; // Forward to Astro
          }

          // Also check version hash - forward non-Vite-client hashes to Astro
          const versionMatch = url.match(/[?&]v=([a-f0-9]+)/);
          if (versionMatch) {
            const version = versionMatch[1];
            if (!VITE_CLIENT_HASHES.includes(version)) {
              return undefined; // Forward to Astro
            }
          }
          return req.url; // Let Vite handle it
        },
      },
    },
  },
  build: {
    // Enable code splitting for better caching
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Sui SDK - large library, separate chunk
          if (id.includes('@mysten/sui') || id.includes('@mysten/bcs')) {
            return 'vendor-sui';
          }
          // Core React libraries
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/') || id.includes('node_modules/react-router-dom/')) {
            return 'vendor-react';
          }
          // UI libraries
          if (id.includes('framer-motion') || id.includes('lucide-react') || id.includes('react-hot-toast')) {
            return 'vendor-ui';
          }
          // Radix UI components
          if (id.includes('@radix-ui/react-')) {
            return 'vendor-radix';
          }
          // WebGL background
          if (id.includes('ogl')) {
            return 'background';
          }
          // State management
          if (id.includes('zustand')) {
            return 'vendor-state';
          }
          // Lenis smooth scroll
          if (id.includes('lenis')) {
            return 'lenis';
          }
        },
      },
    },
    // Improve chunk size warnings
    chunkSizeWarningLimit: 500,
    // Enable minification (using esbuild for speed, no extra deps)
    minify: 'esbuild',
    // Generate source maps for debugging (optional)
    sourcemap: false,
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'zustand'],
    // Exclude libraries with __DEFINES__ issues in dev mode
    exclude: ['@microsoft/clarity', '@statsig/js-client', '@statsig/session-replay', '@statsig/web-analytics'],
  },
});
