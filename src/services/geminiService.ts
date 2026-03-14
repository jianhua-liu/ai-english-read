import { GoogleGenAI, Type } from "@google/genai";
import type { Grade } from "../types";

const apiBase = typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL
  ? (import.meta.env.VITE_API_URL as string).replace(/\/$/, "")
  : "";

async function generateStoryViaApi(grade: Grade, modelName: string): Promise<{ title: string; pages: { text: string; translation: string; grammarPoint: string }[] }> {
  const res = await fetch(`${apiBase}/api/generate-story`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ grade, modelName }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || `API error ${res.status}`);
  }
  return res.json();
}

async function translateWordViaApi(word: string): Promise<{ translation: string; example: string }> {
  const res = await fetch(`${apiBase}/api/translate-word`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ word }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || `API error ${res.status}`);
  }
  return res.json();
}

const ai = new GoogleGenAI({ apiKey: typeof process !== "undefined" ? (process.env?.GEMINI_API_KEY || "") : "" });

export async function generateStory(grade: Grade, modelName: string = "gemini-3.1-pro-preview"): Promise<{ title: string; pages: { text: string; translation: string; grammarPoint: string }[] }> {
  if (apiBase) return generateStoryViaApi(grade, modelName);

  const model = ai.models.generateContent({
    model: modelName,
    contents: `Create an educational English story for a ${grade} student, focusing on English reading and grammar. 
    The story should have 5 pages. Each page should have 2-4 sentences.
    Each page should target a specific grammar point suitable for ${grade} level.
    Return the result in JSON format with a title and an array of pages, where each page has:
    1. 'text': the English story text.
    2. 'translation': the full Chinese translation of the English text on this page.
    3. 'grammarPoint': a brief explanation of the grammar focus on this page in Chinese.`,
    config: {
      responseMimeType: "application/json",
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
                grammarPoint: { type: Type.STRING }
              },
              required: ["text", "translation", "grammarPoint"]
            }
          }
        },
        required: ["title", "pages"]
      }
    }
  });

  const response = await model;
  return JSON.parse(response.text || "{}");
}

export async function translateWord(word: string): Promise<{ translation: string; example: string }> {
  if (apiBase) return translateWordViaApi(word);

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Translate the English word "${word}" to Chinese and provide a simple example sentence in English with its Chinese translation.
    Return JSON: { "translation": "中文翻译", "example": "English example sentence. (中文翻译)" }`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          translation: { type: Type.STRING },
          example: { type: Type.STRING }
        },
        required: ["translation", "example"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
}
