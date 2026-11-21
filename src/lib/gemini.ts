import { GoogleGenAI, GenerateContentConfig } from '@google/genai';

const FALLBACK_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-2.5-flash',
  'gemini-2.0-flash',
];

export async function generateWithFallback(
  apiKey: string,
  contents: string,
  config?: GenerateContentConfig
) {
  const ai = new GoogleGenAI({ apiKey });
  let lastError: unknown;

  for (const model of FALLBACK_MODELS) {
    try {
      return await ai.models.generateContent({
        model,
        contents,
        config,
      });
    } catch (error: unknown) {
      lastError = error;
      const msg = error instanceof Error ? error.message : String(error);
      // Retry on next model if overloaded (503), rate-limited (429), or unavailable (404)
      if (msg.includes('503') || msg.includes('429') || msg.includes('404') || msg.includes('UNAVAILABLE')) {
        continue;
      }
      throw error;
    }
  }

  throw lastError;
}