// Router de YouTube: encapsula todas las llamadas a la Data API v3.
// - Reenvía las queries del frontend
// - Cachea respuestas simples en memoria (TTL configurable)
// - Lleva un contador de cuota estimada para mostrarla en la UI
import { Router } from 'express';
import { youtubeGet, cache, getQuotaUsage, resetQuotaUsage } from '../services/youtubeService.js';

const router = Router();

// Búsqueda de videos por término (costosa: 100 unidades).
// POST /api/youtube/search  { q, maxResults, order, publishedAfter }
router.post('/search', async (req, res, next) => {
  try {
    const { q, maxResults = 12, order = 'viewCount', publishedAfter } = req.body;
    if (!q) return res.status(400).json({ error: 'Falta el término de búsqueda (q)' });

    const cacheKey = `search:${q}:${maxResults}:${order}:${publishedAfter || ''}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json({ cached: true, items: cached, quota: getQuotaUsage() });
    }

    const params = {
      part: 'snippet',
      q,
      type: 'video',
      maxResults: Math.min(50, Number(maxResults) || 12),
      order,
      relevanceLanguage: 'es',
      safeSearch: 'none',
    };
    if (publishedAfter) params.publishedAfter = publishedAfter;

    const clientKey = req.headers['x-youtube-key'];
    const data = await youtubeGet('/search', params, clientKey);
    const items = (data.items || []).map((it) => ({
      videoId: it.id?.videoId,
      channelId: it.snippet?.channelId,
      channelTitle: it.snippet?.channelTitle,
      title: it.snippet?.title,
      description: it.snippet?.description,
      publishedAt: it.snippet?.publishedAt,
      thumbnail: it.snippet?.thumbnails?.high?.url || it.snippet?.thumbnails?.default?.url,
    })).filter((v) => v.videoId);

    cache.set(cacheKey, items, 6 * 60 * 60 * 1000); // 6h
    res.json({ cached: false, items, quota: getQuotaUsage() });
  } catch (err) {
    next(err);
  }
});

// Estadísticas en lote de hasta 50 videos (1 unidad por llamada).
// POST /api/youtube/videos  { ids: ["abc","def",...] }
router.post('/videos', async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Debes enviar un array "ids"' });
    }
    const cleanIds = ids.filter(Boolean).slice(0, 50);
    if (cleanIds.length === 0) return res.json({ items: [], quota: getQuotaUsage() });

    const cacheKey = `videos:${cleanIds.sort().join(',')}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json({ cached: true, items: cached, quota: getQuotaUsage() });

    const clientKey = req.headers['x-youtube-key'];
    const data = await youtubeGet('/videos', {
      part: 'snippet,statistics,contentDetails',
      id: cleanIds.join(','),
    }, clientKey);

    const items = (data.items || []).map((v) => ({
      videoId: v.id,
      title: v.snippet?.title,
      channelId: v.snippet?.channelId,
      channelTitle: v.snippet?.channelTitle,
      publishedAt: v.snippet?.publishedAt,
      thumbnail: v.snippet?.thumbnails?.high?.url || v.snippet?.thumbnails?.default?.url,
      tags: v.snippet?.tags || [],
      categoryId: v.snippet?.categoryId,
      duration: v.contentDetails?.duration,
      views: Number(v.statistics?.viewCount || 0),
      likes: Number(v.statistics?.likeCount || 0),
      comments: Number(v.statistics?.commentCount || 0),
    }));

    cache.set(cacheKey, items, 12 * 60 * 60 * 1000); // 12h
    res.json({ cached: false, items, quota: getQuotaUsage() });
  } catch (err) {
    next(err);
  }
});

// Info de canales en lote (1 unidad por llamada, hasta 50 ids).
// POST /api/youtube/channels  { ids: ["UCxxx", ...] }
router.post('/channels', async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Debes enviar un array "ids"' });
    }
    const cleanIds = [...new Set(ids.filter(Boolean))].slice(0, 50);

    const cacheKey = `channels:${cleanIds.sort().join(',')}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json({ cached: true, items: cached, quota: getQuotaUsage() });

    const clientKey = req.headers['x-youtube-key'];
    const data = await youtubeGet('/channels', {
      part: 'snippet,statistics',
      id: cleanIds.join(','),
    }, clientKey);

    const items = (data.items || []).map((c) => ({
      channelId: c.id,
      title: c.snippet?.title,
      description: c.snippet?.description,
      thumbnail: c.snippet?.thumbnails?.medium?.url || c.snippet?.thumbnails?.default?.url,
      customUrl: c.snippet?.customUrl,
      country: c.snippet?.country,
      publishedAt: c.snippet?.publishedAt,
      views: Number(c.statistics?.viewCount || 0),
      subscribers: Number(c.statistics?.subscriberCount || 0),
      videos: Number(c.statistics?.videoCount || 0),
    }));

    cache.set(cacheKey, items, 12 * 60 * 60 * 1000);
    res.json({ cached: false, items, quota: getQuotaUsage() });
  } catch (err) {
    next(err);
  }
});

// Estado de la cuota estimada (para mostrar en la UI).
router.get('/quota', (req, res) => {
  res.json(getQuotaUsage());
});

// Resetea el contador (útil si reinicias manualmente).
router.post('/quota/reset', (req, res) => {
  resetQuotaUsage();
  res.json(getQuotaUsage());
});

export default router;
