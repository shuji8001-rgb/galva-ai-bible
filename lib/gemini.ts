import { GoogleGenerativeAI } from '@google/generative-ai';

const serverApiKey = process.env.GEMINI_API_KEY || '';

export function getGeminiClient(customApiKey?: string) {
  const key = customApiKey || serverApiKey;
  if (!key) return null;
  return new GoogleGenerativeAI(key);
}

export function getGeminiModel(
  mimeTypeJson: boolean = false,
  modelName: string = 'gemini-1.5-pro',
  customApiKey?: string
) {
  const client = getGeminiClient(customApiKey);
  if (!client) {
    return null;
  }

  // モデルの優先指定（Pro最高知能モデルまたは指定モデル）
  const targetModel = modelName || 'gemini-1.5-pro';

  return client.getGenerativeModel({
    model: targetModel,
    generationConfig: mimeTypeJson
      ? {
          responseMimeType: 'application/json',
          temperature: 0.15,
        }
      : {
          temperature: 0.15,
        },
  });
}

