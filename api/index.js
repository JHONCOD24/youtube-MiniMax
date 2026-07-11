// Entry serverless para Vercel.
// Reexporta la app Express del backend para que todas las rutas /api/*
// lleguen al mismo proxy (YouTube, Gemini, Claude, Mistral, health, KB).
import app from '../backend/src/server.js';

export default app;
