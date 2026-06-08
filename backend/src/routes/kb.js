import { Router } from 'express';

const router = Router();

let multerPkg = null;
let pdfParse = null;
let mammoth = null;
try {
  const m = await import('multer');
  multerPkg = m?.default || m;
  const p = await import('pdf-parse');
  pdfParse = p?.default || p;
  const mm = await import('mammoth');
  mammoth = mm?.default || mm;
} catch {}

function cleanText(s) {
  return String(s || '')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

if (!multerPkg || !pdfParse || !mammoth) {
  router.post('/extract', (req, res) => {
    res.status(503).json({ error: 'Extracción de PDF/DOCX no disponible en este entorno. Inicia el backend en una carpeta local (no sincronizada) o reinstala dependencias.' });
  });
} else {
  const upload = multerPkg({
    storage: multerPkg.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
  });

  router.post('/extract', upload.single('file'), async (req, res, next) => {
    try {
      const file = req.file;
      if (!file) return res.status(400).json({ error: 'Falta el archivo' });

      const name = (file.originalname || '').toLowerCase();
      let text = '';

      if (name.endsWith('.pdf')) {
        const out = await pdfParse(file.buffer);
        text = out?.text || '';
      } else if (name.endsWith('.docx')) {
        const out = await mammoth.extractRawText({ buffer: file.buffer });
        text = out?.value || '';
      } else {
        text = file.buffer.toString('utf8');
      }

      res.json({ text: cleanText(text) });
    } catch (err) {
      next(err);
    }
  });
}

export default router;
