import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { createApiHandler, loadEnv } from './server/api.js';

// Mounts the same /api handler the production server uses, so `npm run dev`
// is a single process with real LLM calls.
function swarmApi() {
  return {
    name: 'swarmframe-api',
    configureServer(server) {
      loadEnv();
      server.middlewares.use(createApiHandler());
    },
    configurePreviewServer(server) {
      loadEnv();
      server.middlewares.use(createApiHandler());
    },
  };
}

export default defineConfig({
  base: './', // relative asset paths: dist/ works from any host or subpath
  plugins: [react(), swarmApi()],
  server: { port: 5173 },
});
