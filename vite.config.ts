import type { IncomingMessage, ServerResponse } from 'node:http';
import react from '@vitejs/plugin-react';
import { loadEnv, type Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vitest/config';
import { proxyNews } from './server/newsProxy';

// Sirve /api/news en dev y preview inyectando la key desde el entorno del servidor.
function newsApi(key: string | undefined): Plugin {
  const handler = async (req: IncomingMessage, res: ServerResponse) => {
    const url = new URL(req.url ?? '', 'http://localhost');
    const { status, body } = await proxyNews(url.searchParams, key);
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.end(body);
  };
  return {
    name: 'newsnow-api',
    configureServer(server) {
      server.middlewares.use('/api/news', handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/news', handler);
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [
      react(),
      newsApi(env.NEWSAPI_KEY),
      VitePWA({
        registerType: 'prompt',
        includeAssets: ['favicon.svg', 'icons/*.png'],
        manifest: {
          name: 'NewsNow — Noticias del mundo',
          short_name: 'NewsNow',
          description: 'Explora las noticias del mundo seleccionando cualquier lugar del planeta.',
          lang: 'es',
          start_url: '/',
          scope: '/',
          display: 'standalone',
          orientation: 'any',
          theme_color: '#060a18',
          background_color: '#060a18',
          categories: ['news'],
          icons: [
            { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
            { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
          shortcuts: [
            { name: 'Buscar noticias', url: '/search' },
            { name: 'Guardados', url: '/saved' },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html}', 'assets/*-latin-wght-normal-*.woff2', 'favicon.svg', 'icons/*.png'],
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [/^\/api\//],
          runtimeCaching: [
            {
              urlPattern: ({ url }) => url.pathname.startsWith('/api/news'),
              handler: 'NetworkFirst',
              options: {
                cacheName: 'news-api',
                networkTimeoutSeconds: 6,
                expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 },
                cacheableResponse: { statuses: [200] },
              },
            },
            {
              urlPattern: ({ request }) => request.destination === 'image',
              handler: 'CacheFirst',
              options: {
                cacheName: 'images',
                expiration: { maxEntries: 160, maxAgeSeconds: 60 * 60 * 24 * 7 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
          ],
        },
      }),
    ],
    // las banderas pequeñas no se incrustan en el JS: se piden (y cachean) solo las que se ven
    build: { assetsInlineLimit: 0, chunkSizeWarningLimit: 900 },
    // PORT lo asigna el lanzador cuando el puerto por defecto está ocupado
    server: { port: Number(process.env.PORT) || 5180 },
    preview: { port: Number(process.env.PORT) || 5181 },
    test: { environment: 'node', include: ['src/**/*.test.ts'] },
  };
});
