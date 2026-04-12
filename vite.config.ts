import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        VitePWA({
          registerType: 'autoUpdate',
          includeAssets: ['favicon.ico', 'logo.png', 'icon-192.png', 'icon-512.png'],
          manifest: {
            name: 'Akseli — TEF Canada Prep',
            short_name: 'Akseli',
            description: 'Practice for your TEF Canada exam — speaking, writing, reading, listening.',
            theme_color: '#ffffff',
            background_color: '#ffffff',
            display: 'standalone',
            scope: '/',
            start_url: '/dashboard',
            icons: [
              {
                src: 'icon-192.png',
                sizes: '192x192',
                type: 'image/png',
              },
              {
                src: 'icon-512.png',
                sizes: '512x512',
                type: 'image/png',
              },
              {
                src: 'icon-512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable',
              },
            ],
          },
          workbox: {
            // Don't cache API calls or audio files — always fetch fresh
            navigateFallback: '/index.html',
            navigateFallbackDenylist: [/^\/api\//],
            runtimeCaching: [
              {
                urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'google-fonts',
                  expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
                },
              },
            ],
          },
        }),
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.CLERK_PUBLISHABLE_KEY': JSON.stringify(env.CLERK_PUBLISHABLE_KEY),
        'import.meta.env.VITE_BACKEND_URL': JSON.stringify(env.VITE_BACKEND_URL || 'http://localhost:3001')
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
