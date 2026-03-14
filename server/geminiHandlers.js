import { GoogleGenAI, Type } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export async function generateStoryHandler(req, res) {
  try {
    if (!apiKey) {
      return res.status(503).json({ error: 'GEMINI_API_KEY not configured' });
    }
    const { grade, modelName } = req.body || {};
    const model = modelName || 'gemini-3.1-pro-preview';
    const gradeVal = grade || 'Grade 6';

    const response = await ai.models.generateContent({
      model,
      contents: `Create an educational English story for a ${gradeVal} student, focusing on English reading and grammar. 
    The story should have 5 pages. Each page should have 2-4 sentences.
    Each page should target a specific grammar point suitable for ${gradeVal} level.
    Return the result in JSON format with a title and an array of pages, where each page has:
    1. 'text': the English story text.
    2. 'translation': the full Chinese translation of the English text on this page.
    3. 'grammarPoint': a brief explanation of the grammar focus on this page in Chinese.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            pages: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING },
                  translation: { type: Type.STRING },
                  grammarPoint: { type: Type.STRING },
                },
                required: ['text', 'translation', 'grammarPoint'],
              },
            },
          },
          required: ['title', 'pages'],
        },
      },
    });

    const data = JSON.parse(response.text || '{}');
    res.json(data);
  } catch (e) {
    console.error('generateStory error:', e);
    res.status(500).json({ error: e?.message || 'Generate story failed' });
  }
}

export async function translateWordHandler(req, res) {
  try {
    if (!apiKey) {
      return res.status(503).json({ error: 'GEMINI_API_KEY not configured' });
    }
    const { word } = req.body || {};
    if (!word || typeof word !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid "word"' });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Translate the English word "${word}" to Chinese and provide a simple example sentence in English with its Chinese translation.
    Return JSON: { "translation": "中文翻译", "example": "English example sentence. (中文翻译)" }`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            translation: { type: Type.STRING },
            example: { type: Type.STRING },
          },
          required: ['translation', 'example'],
        },
      },
    });

    const data = JSON.parse(response.text || '{}');
    res.json(data);
  } catch (e) {
    console.error('translateWord error:', e);
    res.status(500).json({ error: e?.message || 'Translate failed' });
  }
}
