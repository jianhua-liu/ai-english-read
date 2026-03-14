import { callGemini } from './lib/gemini.js';

const cors = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
};

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    cors(res);
    return res.status(204).end();
  }
  cors(res);
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.status(503).json({ error: 'GEMINI_API_KEY not configured' });

  const { grade = 'Grade 6', modelName = 'gemini-2.5-flash' } = req.body || {};
  const prompt = `Create an educational English story for a ${grade} student. Use exactly 5 pages. Each page: 2-4 sentences in English. One grammar point per page (in Chinese).

IMPORTANT: Return JSON with "title" (English) and "pages" array. Each page must have:
- "text": the English sentences ONLY (the story content in English).
- "translation": the Chinese translation of "text" ONLY.
- "grammarPoint": short grammar note in Chinese.

Do not put Chinese in "text". "text" must be English.`;
  const schema = {
    type: 'object',
    properties: {
      title: { type: 'string' },
      pages: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            text: { type: 'string' },
            translation: { type: 'string' },
            grammarPoint: { type: 'string' },
          },
          required: ['text', 'translation', 'grammarPoint'],
        },
      },
    },
    required: ['title', 'pages'],
  };

  function hasCJK(s) {
    return typeof s === 'string' && /[\u4e00-\u9fff]/.test(s);
  }
  function normalizePages(pages) {
    if (!Array.isArray(pages)) return pages;
    return pages.map((p) => {
      let text = (p && p.text) || '';
      let translation = (p && p.translation) || '';
      if (!text && translation && !hasCJK(translation)) {
        text = translation;
        translation = '';
      } else if (hasCJK(text) && translation && !hasCJK(translation)) {
        [text, translation] = [translation, text];
      }
      return { ...p, text: text || p.text, translation: translation || p.translation };
    });
  }

  try {
    const data = await callGemini(modelName, prompt, schema, key);
    if (data && data.pages) data.pages = normalizePages(data.pages);
    return res.status(200).json(data);
  } catch (e) {
    console.error('generate-story error:', e);
    const msg = e.message || 'Generate failed';
    return res.status(500).json({ error: msg, detail: String(e) });
  }
}
