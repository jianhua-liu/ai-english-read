'use strict';

const https = require('https');

const GEMINI_BASE = 'generativelanguage.googleapis.com';

function getApiKey() {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
  try {
    const s = require('./secret.js');
    if (s && s.GEMINI_API_KEY) return s.GEMINI_API_KEY;
  } catch (e) {}
  return '';
}

function request(options, postData) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) resolve(json);
          else reject(new Error(json.error?.message || data || 'Request failed'));
        } catch (e) {
          reject(new Error(data || 'Invalid response'));
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(25000, () => { req.destroy(); reject(new Error('timeout')); });
    req.write(postData);
    req.end();
  });
}

async function callGemini(model, prompt, schema) {
  const key = getApiKey();
  if (!key) throw new Error('GEMINI_API_KEY not configured. Please set it in cloudfunctions/englishApi/secret.js');
  const path = `/v1beta/models/${model}:generateContent?key=${key}`;
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: schema,
    },
  };
  const postData = JSON.stringify(body);
  const options = {
    hostname: GEMINI_BASE,
    path,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) },
  };
  const data = await request(options, postData);
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty response from Gemini');
  return JSON.parse(text);
}

exports.main = async (event, context) => {
  const { action, grade, modelName, word } = event || {};
  try {
    if (action === 'generateStory') {
      const model = modelName || 'gemini-2.5-flash';
      const gradeVal = grade || 'Grade 6';
      const prompt = `Create a SHORT English story for ${gradeVal}. Use exactly 3 pages. Each page: 1-2 sentences in ENGLISH only. One grammar point per page (in Chinese).

IMPORTANT: Return JSON: {"title":"English title","pages":[{"text":"English sentences here","translation":"中文翻译","grammarPoint":"中文语法说明"}]}.
- "text" must be the English story content only. Do NOT put Chinese in "text".
- "translation" must be the Chinese translation of "text". Keep it very brief.`;
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
      const result = await callGemini(model, prompt, schema);
      if (result && result.pages) {
        function hasCJK(s) { return typeof s === 'string' && /[\u4e00-\u9fff]/.test(s); }
        result.pages = result.pages.map(function (p) {
          var text = (p && p.text) || '';
          var translation = (p && p.translation) || '';
          if (!text && translation && !hasCJK(translation)) {
            text = translation;
            translation = '';
          } else if (hasCJK(text) && translation && !hasCJK(translation)) {
            var t = text;
            text = translation;
            translation = t;
          }
          return Object.assign({}, p, { text: text || p.text, translation: translation || p.translation });
        });
      }
      return { errMsg: 'ok', data: result };
    }
    if (action === 'translateWord') {
      if (!word || typeof word !== 'string') {
        return { errMsg: 'Missing or invalid word', data: null };
      }
      const prompt = `Translate the English word "${word}" to Chinese and provide a simple example sentence in English with its Chinese translation.
Return JSON: { "translation": "中文翻译", "example": "English example sentence. (中文翻译)" }`;
      const schema = {
        type: 'object',
        properties: {
          translation: { type: 'string' },
          example: { type: 'string' },
        },
        required: ['translation', 'example'],
      };
      const result = await callGemini('gemini-2.5-flash', prompt, schema);
      return { errMsg: 'ok', data: result };
    }
    return { errMsg: 'Unknown action', data: null };
  } catch (e) {
    console.error(e);
    return { errMsg: e.message || 'cloud function error', data: null };
  }
};
