/**
 * Production server: serves the built app from dist/ and the /api routes.
 *   npm run build && npm start
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApiHandler, loadEnv } from './api.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
loadEnv(path.join(root, '.env'));

const dist = path.join(root, 'dist');
const port = Number(process.env.PORT) || 8787;
const api = createApiHandler();

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json', '.ico': 'image/x-icon',
};

function serveStatic(req, res) {
  const rel = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  let file = path.join(dist, rel);
  if (!file.startsWith(dist)) { res.writeHead(403); return res.end(); }
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(dist, 'index.html');
  if (!fs.existsSync(file)) {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    return res.end('dist/ is missing — run `npm run build` first.');
  }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
}

http
  .createServer((req, res) => api(req, res, () => serveStatic(req, res)))
  .listen(port, () => console.log(`[swarmframe] http://localhost:${port}`));
