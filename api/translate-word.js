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

  const { word } = req.body || {};
  if (!word || typeof word !== 'string') return res.status(400).json({ error: 'Missing word' });

  const prompt = `Translate the English word "${word}" to Chinese and provide a simple example sentence in English with its Chinese translation. Return JSON: { "translation": "中文翻译", "example": "English example. (中文)" }`;
  const schema = {
    type: 'object',
    properties: {
      translation: { type: 'string' },
      example: { type: 'string' },
    },
    required: ['translation', 'example'],
  };

  try {
    const data = await callGemini('gemini-1.5-flash', prompt, schema, key);
    return res.status(200).json(data);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message || 'Translate failed' });
  }
}
