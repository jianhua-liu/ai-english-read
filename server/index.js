/**
 * 后端 API 服务：供网页与微信小程序调用，保护 GEMINI_API_KEY 不暴露在前端。
 * 运行: node server/index.js  或  npm run server
 */
import dotenv from 'dotenv';
dotenv.config();
dotenv.config({ path: '.env.local' });
import express from 'express';
import { generateStoryHandler, translateWordHandler } from './geminiHandlers.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});
app.use(express.json());

app.post('/api/generate-story', generateStoryHandler);
app.post('/api/translate-word', translateWordHandler);

app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'AI English Story API' });
});

app.listen(PORT, () => {
  console.log(`API server running at http://localhost:${PORT}`);
  if (!process.env.GEMINI_API_KEY) {
    console.warn('Warning: GEMINI_API_KEY not set. Set it in .env.local for generate/translate to work.');
  }
});
