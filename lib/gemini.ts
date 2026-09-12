import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY || '';

export const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export function getGeminiModel(mimeTypeJson: boolean = false) {
  if (!genAI) {
    return null;
  }
  return genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: mimeTypeJson
      ? {
          responseMimeType: 'application/json',
          temperature: 0.2,
        }
      : {
          temperature: 0.2,
        },
  });
}
