import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { handleApiRequest } from './server/apiRouter.js';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'lpu-api-middleware',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.url && req.url.startsWith('/api/')) {
            try {
              const handled = await handleApiRequest(req, res);
              if (!handled) next();
            } catch (err) {
              console.error('[API Middleware Error]', err);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: (err as any)?.message || 'Internal Server Error' }));
            }
          } else {
            next();
          }
        });
      },
    },
  ],
  server: {
    port: 5173,
    host: true,
    watch: {
      ignored: [
        '**/campus_wayfinder.db*',
        '**/*.db*',
        '**/*.db-journal*',
        '**/*.db-wal*',
        '**/*.db-shm*',
        '**/src/data/**',
        '**/buildings.json',
      ],
    },
  },
});
