// Router de Claude: genera texto con la API de Anthropic.
// Por defecto usa claude-3-5-sonnet-latest.
import { Router } from 'express';
import { generateText, generateJSON } from '../services/claudeService.js';

const router = Router();

// POST /api/claude/text
// body: { prompt, system?, temperature?, model? }
router.post('/text', async (req, res, next) => {
  try {
    const { prompt, system, temperature = 0.8, model } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Falta el prompt' });
    const clientKey = req.headers['x-claude-key'];
    const text = await generateText({ prompt, system, temperature, model }, clientKey);
    res.json({ text });
  } catch (err) {
    next(err);
  }
});

// POST /api/claude/json
// body: { prompt, system?, temperature?, model?, schemaHint? }
router.post('/json', async (req, res, next) => {
  try {
    const { prompt, system, temperature = 0.7, model, schemaHint } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Falta el prompt' });
    const clientKey = req.headers['x-claude-key'];
    const data = await generateJSON({ prompt, system, temperature, model, schemaHint }, clientKey);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

export default router;
