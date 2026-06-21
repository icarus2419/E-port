import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { PORT, PUBLIC_DIR, LANDING_DIR, SESSION_TTL_MS } from './lib/config.js';
import { loadDb } from './lib/db.js';
import { securityHeaders, corsOptions } from './lib/middleware.js';
import authRouter from './routes/auth.js';
import documentsRouter from './routes/documents.js';
import auditStatsRouter from './routes/audit-stats.js';

const app = express();
app.disable('x-powered-by');
app.use(securityHeaders);
app.use('/api', (_req, res, next) => { res.setHeader('Cache-Control', 'no-store, max-age=0'); next(); });
app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));
app.use('/app', express.static(PUBLIC_DIR));
app.use(express.static(LANDING_DIR));

app.get('/api/health', (_req, res) => res.json({ ok: true, app: 'SecureDoc Approval' }));
app.use('/api', authRouter);
app.use('/api/documents', documentsRouter);
app.use('/api', auditStatsRouter);

app.use('/api', (err, _req, res, _next) => {
  console.error(err);
  const status = err?.status || err?.statusCode || (err?.code === 'LIMIT_FILE_SIZE' ? 400 : 500);
  let message = 'Unexpected server error.';
  if (err?.code === 'LIMIT_FILE_SIZE') message = 'File exceeds the 10 MB upload limit.';
  else if (status < 500 && err?.message) message = err.message;
  res.status(status).json({ error: message });
});
app.use('/api', (_req, res) => res.status(404).json({ error: 'API route not found.' }));

app.get(/^\/app(\/.*)?$/, (_req, res) => res.sendFile(path.join(PUBLIC_DIR, 'index.html')));
app.get(/.*/, (_req, res) => res.sendFile(path.join(LANDING_DIR, 'index.html')));
app.use((err, _req, res, _next) => { console.error(err); res.status(500).json({ error: 'Unexpected server error.' }); });

app.listen(PORT, (error) => {
  if (error) { console.error('SecureDoc failed to start:', error.message); process.exitCode = 1; return; }
  loadDb();
  console.log(`SecureDoc Approval is running at http://localhost:${PORT}`);
  console.log('Demo-only accounts: employee@demo.com / reviewer@demo.com / admin@demo.com, password demo123');
  console.log(`Demo sessions expire after ${Math.round(SESSION_TTL_MS / 60000)} minutes.`);
});
