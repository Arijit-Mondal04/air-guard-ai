import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

process.env.GEMINI_API_KEY = 'test-gemini-key';

const mockGenerateWithFallback = vi.fn();

vi.mock('@/lib/gemini', () => ({
  getGeminiClient: () => ({}),
  generateWithFallback: (...args: unknown[]) => mockGenerateWithFallback(...args),
}));

import { GET as getAqi } from './aqi/route';
import { POST as postGenerate } from './generate/route';
import { POST as postChat } from './chat/route';

describe('VayuGuard API Routes Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET /api/aqi rejects missing city parameter with 400', async () => {
    const req = new NextRequest('http://localhost:3000/api/aqi');
    const res = await getAqi(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it('GET /api/aqi returns normalized live telemetry and 24h forecast', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch');
    fetchSpy
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            results: [{ name: 'Kolkata', admin1: 'West Bengal', country: 'India', latitude: 22.57, longitude: 88.36 }],
          }),
          { status: 200 }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            current: { us_aqi: 172, pm2_5: 96.4, pm10: 148.2 },
            hourly: {
              time: ['2026-11-24T08:00', '2026-11-24T14:00'],
              pm2_5: [160, 72],
              us_aqi: [210, 158],
            },
          }),
          { status: 200 }
        )
      );

    const req = new NextRequest('http://localhost:3000/api/aqi?city=Kolkata');
    const res = await getAqi(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.resolvedName).toBe('Kolkata, West Bengal, India');
    expect(data.usAqi).toBe(172);
    expect(data.hourlyForecast).toHaveLength(2);
    fetchSpy.mockRestore();
  });

  it('POST /api/generate returns structured household action plan JSON', async () => {
    mockGenerateWithFallback.mockResolvedValueOnce({
      text: JSON.stringify({
        riskSummary: 'Elevated particulate matter requires morning window closure.',
        quantifiedImpact: {
          estimatedIndoorPm25Reduction: '45%–60%',
          weeklyCo2SavedKg: '11 kg/week',
          safeVentilationWindow: '1:00 PM – 3:30 PM',
        },
        indoorAirHacks: [{ title: 'Run kitchen exhaust', description: 'Vent tadka smoke', impactExplanation: 'Prevents PM2.5 spike' }],
        lowEmissionRoutines: [{ title: 'Use Metro transit', description: 'Skip scooter commute', impactExplanation: 'Reduces inhalation' }],
        sustainableAlternatives: [{ title: 'Electric kettle', description: 'Reduce LPG burn time', impactExplanation: 'Cleaner indoor air' }],
      }),
    });

    const req = new NextRequest('http://localhost:3000/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        city: 'Kolkata',
        aqiLevel: 'Poor / Unhealthy (AQI 151–200)',
        householdMembers: '2 Adults, Elderly Parent',
        homeFeatures: 'No Air Purifier, Gas Stove Cooking',
        commuteMode: 'Metro / Train',
      }),
    });

    const res = await postGenerate(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.indoorAirHacks).toHaveLength(1);
    expect(data.quantifiedImpact.safeVentilationWindow).toBe('1:00 PM – 3:30 PM');
  });

  it('POST /api/chat validates empty questions and returns grounded answers', async () => {
    const badReq = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: '   ' }),
    });
    const badRes = await postChat(badReq);
    expect(badRes.status).toBe(400);

    mockGenerateWithFallback.mockResolvedValueOnce({
      text: 'Wait until 1:00 PM when surface inversion lifts before taking your parent for a short walk.',
    });

    const validReq = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: 'Is a 7 AM walk safe?',
        profile: { city: 'Kolkata', aqiLevel: 'Poor', householdMembers: 'Elderly Parent', homeFeatures: 'Flat', commuteMode: 'Walk' },
        plan: { riskSummary: 'Morning smog peak.', quantifiedImpact: { estimatedIndoorPm25Reduction: '50%', weeklyCo2SavedKg: '8 kg', safeVentilationWindow: '1:00 PM' }, indoorAirHacks: [], lowEmissionRoutines: [], sustainableAlternatives: [] },
      }),
    });

    const validRes = await postChat(validReq);
    expect(validRes.status).toBe(200);
    const body = await validRes.json();
    expect(body.answer).toContain('1:00 PM');
  });
});