// Router de Mistral: genera texto con la API de Mistral AI.
// Por defecto usa mistral-large-latest.
import { Router } from 'express';
import { generateText, generateJSON } from '../services/mistralService.js';

const router = Router();

// POST /api/mistral/text
// body: { prompt, system?, temperature?, model? }
router.post('/text', async (req, res, next) => {
  try {
    const { prompt, system, temperature = 0.8, model } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Falta el prompt' });
    const clientKey = req.headers['x-mistral-key'];
    const text = await generateText({ prompt, system, temperature, model }, clientKey);
    res.json({ text });
  } catch (err) {
    next(err);
  }
});

// POST /api/mistral/json
// body: { prompt, system?, temperature?, model?, schemaHint? }
router.post('/json', async (req, res, next) => {
  try {
    const { prompt, system, temperature = 0.7, model, schemaHint } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Falta el prompt' });
    const clientKey = req.headers['x-mistral-key'];
    const data = await generateJSON({ prompt, system, temperature, model, schemaHint }, clientKey);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

export default router;
