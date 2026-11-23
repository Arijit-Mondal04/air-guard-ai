import { GoogleGenAI, GenerateContentConfig } from '@google/genai';

export function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in environment variables.');
  }
  return new GoogleGenAI({ apiKey });
}

export async function generateWithFallback(
  contents: string,
  systemOrConfig?: string | GenerateContentConfig,
  configOrModel?: GenerateContentConfig | string
) {
  const ai = getGeminiClient();

  let config: GenerateContentConfig | undefined;
  let primaryModel = 'gemini-3.5-flash-lite';

  if (typeof systemOrConfig === 'string') {
    config =
      typeof configOrModel === 'object'
        ? { systemInstruction: systemOrConfig, ...configOrModel }
        : { systemInstruction: systemOrConfig };
  } else {
    config = systemOrConfig;
    if (typeof configOrModel === 'string') {
      primaryModel = configOrModel;
    }
  }

  const candidates = [
    primaryModel,
    'gemini-3.8-flash',
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
  ].filter((model, index, arr) => model !== 'gemini-2.0-flash' && arr.indexOf(model) === index);

  let lastError: unknown;

  for (const model of candidates) {
    try {
      return await ai.models.generateContent({
        model,
        contents,
        config,
      });
    } catch (error: unknown) {
      lastError = error;
      const errObj = error as { status?: number; message?: string };
      const status = errObj?.status;
      const msg = errObj?.message || '';
      const isRetryable =
        status === 503 ||
        status === 429 ||
        status === 404 ||
        msg.includes('503') ||
        msg.includes('429') ||
        msg.includes('404') ||
        msg.includes('UNAVAILABLE') ||
        msg.includes('NOT_FOUND') ||
        msg.includes('high demand');

      if (!isRetryable) {
        throw error;
      }
      console.warn(`Model ${model} unavailable (${status || 'retryable'}), switching to next fallback model...`);
    }
  }

  throw lastError;
}