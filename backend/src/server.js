// Punto de entrada del backend (proxy ligero).
// Su único trabajo: ocultar API keys y hablar con YouTube + Gemini/Claude/Mistral.
// En Vercel se exporta como serverless (ver /api/index.js). En local usa app.listen.
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import youtubeRouter from './routes/youtube.js';
import geminiRouter from './routes/gemini.js';
import claudeRouter from './routes/claude.js';
import mistralRouter from './routes/mistral.js';
import healthRouter from './routes/health.js';
import kbRouter from './routes/kb.js';

const app = express();
const PORT = process.env.PORT || 4000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

// Obligatorio detrás del proxy de Vercel: sin esto express-rate-limit v7
// lanza error 500 al ver el header X-Forwarded-For.
app.set('trust proxy', 1);

// Seguridad y parsing
app.use(helmet({
  // La API la consume el mismo origen o localhost; no bloqueamos assets del SPA.
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(express.json({ limit: '1mb' }));

// En serverless de Vercel el log por request es ruidoso; en local sí ayuda.
if (!process.env.VERCEL) {
  app.use(morgan('dev'));
}

// CORS: permite origen configurado + todo en local/preview.
app.use(cors({
  origin: (origin, callback) => {
    callback(null, true);
  },
  credentials: true,
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'x-youtube-key',
    'x-gemini-key',
    'x-claude-key',
    'x-mistral-key',
  ],
}));

// Rate limit global (defensa básica contra abuso)
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Rutas
app.use('/api/health', healthRouter);
app.use('/api/youtube', youtubeRouter);
app.use('/api/gemini', geminiRouter);
app.use('/api/claude', claudeRouter);
app.use('/api/mistral', mistralRouter);
app.use('/api/kb', kbRouter);

// 404 JSON (nunca devolver HTML del SPA en rutas /api)
app.use('/api', (req, res) => {
  res.status(404).json({
    error: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
  });
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error('[ERROR]', err?.message || err);
  // express-rate-limit u otros a veces mandan status en err.statusCode
  const status = err.status || err.statusCode || 500;
  const body = { error: err.message || 'Error interno del servidor' };
  if (err.detail) body.detail = err.detail;
  if (err.rawLength) body.rawLength = err.rawLength;
  // Evitar filtrar stacks al cliente
  if (status >= 500 && process.env.VERCEL) {
    body.error = body.error || 'Error interno del servidor';
  }
  res.status(status).json(body);
});

// Solo escuchar puerto fuera de Vercel (local / Render / etc.)
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`✅ Backend escuchando en http://localhost:${PORT}`);
    console.log(`   CORS habilitado para: ${CORS_ORIGIN}`);
  });
}

export default app;
