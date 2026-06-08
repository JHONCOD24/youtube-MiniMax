// Punto de entrada del backend (proxy ligero).
// Su único trabajo: ocultar API keys y hablar con YouTube + Gemini.
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

// Seguridad y parsing
app.use(helmet());
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

// CORS
app.use(cors({
  origin: CORS_ORIGIN.split(',').map((o) => o.trim()),
  credentials: true,
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

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error('[ERROR]', err);
  const body = { error: err.message || 'Error interno del servidor' };
  if (err.detail) body.detail = err.detail;
  if (err.rawLength) body.rawLength = err.rawLength;
  res.status(err.status || 500).json(body);
});

app.listen(PORT, () => {
  console.log(`✅ Backend escuchando en http://localhost:${PORT}`);
  console.log(`   CORS habilitado para: ${CORS_ORIGIN}`);
});
