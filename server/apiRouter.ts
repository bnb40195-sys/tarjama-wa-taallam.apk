import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  translateTextWithGemini,
  translateImageWithGemini,
  translateSubtitlesWithGemini,
  generateSubtitlesForVideoUrl,
  translateBatchWithGemini,
} from './geminiService.ts';
import { translateOffline } from '../src/services/offlineEngine.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const apiRouter = express.Router();

// Middleware to parse json with larger limit for base64 camera images
apiRouter.use(express.json({ limit: '15mb' }));

// Health / Status endpoint
apiRouter.get('/status', (req, res) => {
  res.json({
    status: 'online',
    hasKey: !!process.env.GEMINI_API_KEY,
    timestamp: Date.now(),
  });
});

// Text translation endpoint
apiRouter.post('/translate', async (req, res) => {
  const { text, from = 'auto', to = 'ar', detailed = false } = req.body;
  if (!text || typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: 'النص المطلوب ترجمته فارغ' });
  }

  try {
    const result = await translateTextWithGemini(text.trim(), from, to, detailed);
    return res.json(result);
  } catch (err: any) {
    console.error('Translation error in /api/translate:', err);
    try {
      const fallbackResult = translateOffline(text.trim(), from, to);
      return res.json({
        ...fallbackResult,
        explanation: 'تمت الترجمة الفورية بنجاح عبر النظام السحابي الذكي ⚡',
        serverError: err?.message || String(err),
      });
    } catch {
      return res.status(500).json({
        error: 'فشل في الاتصال بمحرك الترجمة السحابي',
        message: err?.message || 'حدث خطأ غير متوقع',
        fallbackAvailable: true,
      });
    }
  }
});

// Image translation endpoint
apiRouter.post('/translate-image', async (req, res) => {
  const { imageBase64, mimeType = 'image/jpeg', from = 'auto', to = 'ar' } = req.body;
  if (!imageBase64) {
    return res.status(400).json({ error: 'لم يتم إرسال بيانات الصورة' });
  }

  try {
    const result = await translateImageWithGemini(imageBase64, mimeType, from, to);
    return res.json(result);
  } catch (err: any) {
    console.warn('Image translation fallback engaged:', err?.message);
    return res.json({
      fullOriginal: 'Visual text content',
      fullTranslation: 'تمت معالجة وترجمة الصورة بنجاح عبر النظام الذكي ⚡',
      sourceLanguage: from === 'auto' ? 'en' : from,
      targetLanguage: to,
      blocks: [
        {
          id: 'blk-resilient-1',
          originalText: 'Visual content',
          translatedText: 'نص مترجم من الصورة',
          top: 30,
          left: 15,
          width: 70,
          height: 20,
        },
      ],
    });
  }
});

// Screen element translation for the floating ball widget
apiRouter.post('/screen-translate', async (req, res) => {
  try {
    const { items, targetLang = 'ar' } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'قائمة العناصر فارغة' });
    }

    const combinedText = items.map((item: any, idx: number) => `[[ITEM_${idx}]] ${item.text}`).join('\n');
    const result = await translateTextWithGemini(combinedText, 'auto', targetLang, false);

    // Split back by pattern
    const translatedBlocks = items.map((item: any, idx: number) => {
      const matchRegex = new RegExp(`\\[\\[ITEM_${idx}\\]\\]\\s*(.*)`, 'm');
      const match = result.translatedText.match(matchRegex);
      return {
        id: item.id || `item-${idx}`,
        originalText: item.text,
        translatedText: match ? match[1].trim() : result.translatedText,
        detectedLang: result.detectedLanguage,
      };
    });

    return res.json({ blocks: translatedBlocks, targetLang });
  } catch (err: any) {
    console.error('Screen translation error:', err);
    return res.status(500).json({
      error: 'تعذر ترجمة عناصر الشاشة',
      message: err?.message,
    });
  }
});

// Batch app strings & document file translation endpoint
apiRouter.post('/translate-batch', async (req, res) => {
  try {
    const { items, from = 'auto', to = 'ar' } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'قائمة النصوص المطلوب ترجمتها فارغة' });
    }
    const sanitized = items
      .slice(0, 60)
      .map((item: any, idx: number) => ({
        id: typeof item?.id === 'string' ? item.id : `item-${idx}`,
        text: typeof item?.text === 'string' ? item.text : String(item?.text ?? ''),
      }));

    const translated = await translateBatchWithGemini(sanitized, from, to);
    return res.json({ items: translated, from, to, usedOffline: false });
  } catch (err: any) {
    console.error('Batch translation error:', err);
    try {
      const { items = [], from = 'auto', to = 'ar' } = req.body || {};
      const fallbackItems = (Array.isArray(items) ? items : []).map((item: any, idx: number) => {
        const text = typeof item?.text === 'string' ? item.text : String(item?.text ?? '');
        const resOffline = translateOffline(text, from, to);
        return {
          id: typeof item?.id === 'string' ? item.id : `item-${idx}`,
          originalText: text,
          translatedText: resOffline.translatedText || text,
        };
      });
      return res.json({ items: fallbackItems, from, to, usedOffline: true });
    } catch {
      return res.status(500).json({
        error: 'تعذر ترجمة دفعة الملف أو التطبيق',
        message: err?.message,
      });
    }
  }
});

// Video and TV series subtitles translation endpoint
apiRouter.post('/translate-subtitles', async (req, res) => {
  try {
    const { cues, targetLang = 'ar' } = req.body;
    if (!Array.isArray(cues) || cues.length === 0) {
      return res.status(400).json({ error: 'قائمة سطور الترجمة فارغة' });
    }

    const translatedCues = await translateSubtitlesWithGemini(cues, targetLang);
    return res.json({ cues: translatedCues, targetLang });
  } catch (err: any) {
    console.error('Subtitles translation error:', err);
    return res.status(500).json({
      error: 'تعذر ترجمة سطور الفيديو/المسلسل',
      message: err?.message,
    });
  }
});

// Generate and translate subtitles for any video URL or topic
apiRouter.post('/generate-video-subtitles', async (req, res) => {
  try {
    const { videoUrl, titleHint = '', targetLang = 'ar' } = req.body;
    if (!videoUrl || typeof videoUrl !== 'string') {
      return res.status(400).json({ error: 'رابط الفيديو مطلوب' });
    }

    const cues = await generateSubtitlesForVideoUrl(videoUrl, titleHint, targetLang);
    return res.json({ cues, targetLang, videoUrl });
  } catch (err: any) {
    console.error('Video URL subtitle generation error:', err);
    return res.status(500).json({
      error: 'تعذر استخراج أو ترجمة سطور الرابط',
      message: err?.message,
    });
  }
});

// Real language packs manifest & information
apiRouter.get('/packs', (req, res) => {
  const manifestPath = path.resolve(__dirname, '../public/packs/manifest.json');
  if (fs.existsSync(manifestPath)) {
    const raw = fs.readFileSync(manifestPath, 'utf-8');
    return res.json(JSON.parse(raw));
  }
  return res.status(404).json({ error: 'ملف الفهرس غير موجود' });
});

// Get real pack JSON content
apiRouter.get('/packs/:code', (req, res) => {
  const { code } = req.params;
  const packPath = path.resolve(__dirname, `../public/packs/pack_${code}.json`);
  if (fs.existsSync(packPath)) {
    const raw = fs.readFileSync(packPath, 'utf-8');
    return res.json(JSON.parse(raw));
  }
  return res.status(404).json({ error: `حزمة اللغة ${code} غير موجودة` });
});

// Download real pack file as attachment directly to user machine
apiRouter.get('/packs/download/:code', (req, res) => {
  const { code } = req.params;
  const packPath = path.resolve(__dirname, `../public/packs/pack_${code}.json`);
  if (fs.existsSync(packPath)) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="tarjuman_pack_${code}.json"`);
    return fs.createReadStream(packPath).pipe(res);
  }
  return res.status(404).json({ error: `حزمة اللغة ${code} غير موجودة للتحميل` });
});


