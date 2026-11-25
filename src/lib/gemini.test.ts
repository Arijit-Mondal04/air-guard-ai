import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGenerateContent = vi.fn();

vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn().mockImplementation(function () {
    return {
      models: {
        generateContent: (...args: unknown[]) => mockGenerateContent(...args),
      },
    };
  }),
}));

import { generateWithFallback } from './gemini';

describe('Gemini Multi-Model Resilience Fallback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GEMINI_API_KEY = 'test-gemini-key';
  });

  it('succeeds on the primary model without retrying when healthy', async () => {
    mockGenerateContent.mockResolvedValueOnce({ text: 'Clean air response' });

    const result = await generateWithFallback('Test prompt');
    expect(result.text).toBe('Clean air response');
    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
  });

  it('automatically falls back to secondary model on transient 503 overload', async () => {
    mockGenerateContent
      .mockRejectedValueOnce(new Error('503 Service Unavailable: high demand'))
      .mockResolvedValueOnce({ text: 'Fallback model succeeded' });

    const result = await generateWithFallback('Test prompt');
    expect(result.text).toBe('Fallback model succeeded');
    expect(mockGenerateContent).toHaveBeenCalledTimes(2);
  });

  it('throws immediately on non-transient client errors without burning quota', async () => {
    mockGenerateContent.mockRejectedValueOnce(new Error('400 Invalid API key'));

    await expect(generateWithFallback('Test prompt')).rejects.toThrow('400 Invalid API key');
    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
  });

  it('throws a clear error when GEMINI_API_KEY is missing', async () => {
    delete process.env.GEMINI_API_KEY;
    await expect(generateWithFallback('Test prompt')).rejects.toThrow('GEMINI_API_KEY');
  });
});