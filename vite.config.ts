import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon-192.png', 'icon-512.png', 'avatars/*.png'],
      manifest: {
        name: 'MetroBuilder',
        short_name: 'MetroBuilder',
        description: 'Baue deine eigene Metropole — Städtebau-Simulation',
        theme_color: '#050d12',
        background_color: '#050d12',
        display: 'standalone',
        orientation: 'any',
        start_url: './',
        lang: 'de',
        categories: ['games', 'entertainment'],
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  server: {
    host: true,
    port: 5173,
  },
});
