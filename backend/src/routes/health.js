// Endpoint de salud + estado de las keys configuradas.
import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.json({
    ok: true,
    service: 'youtube-niche-lab-backend',
    keys: {
      youtube: Boolean(process.env.YOUTUBE_API_KEY),
      gemini: Boolean(process.env.GEMINI_API_KEY),
      claude: Boolean(process.env.CLAUDE_API_KEY),
      mistral: Boolean(process.env.MISTRAL_API_KEY),
    },
    timestamp: new Date().toISOString(),
  });
});

export default router;
