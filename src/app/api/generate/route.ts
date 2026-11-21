import { NextRequest, NextResponse } from 'next/server';
import { Type, Schema } from '@google/genai';
import { generateWithFallback } from '@/lib/gemini';
import { UserProfile } from '@/types/air';

const planSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    riskSummary: {
      type: Type.STRING,
      description: 'Concise 2-sentence risk brief tailored to this household and their current AQI/PM2.5.',
    },
    quantifiedImpact: {
      type: Type.OBJECT,
      properties: {
        estimatedIndoorPm25Reduction: {
          type: Type.STRING,
          description: 'Estimated indoor PM2.5 drop if hacks are followed, e.g. "45%–65% reduction"',
        },
        weeklyCo2SavedKg: {
          type: Type.STRING,
          description: 'Estimated weekly CO2 emissions avoided, e.g. "8.5–12 kg CO₂/week"',
        },
        safeVentilationWindow: {
          type: Type.STRING,
          description: 'Best time of day to briefly air out the home during winter smog, e.g. "1:00 PM – 3:30 PM"',
        },
      },
      required: ['estimatedIndoorPm25Reduction', 'weeklyCo2SavedKg', 'safeVentilationWindow'],
    },
    lowEmissionRoutines: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          impactExplanation: { type: Type.STRING },
          effortLevel: { type: Type.STRING, enum: ['Low', 'Medium', 'High'] },
        },
        required: ['title', 'description', 'impactExplanation', 'effortLevel'],
      },
    },
    indoorAirHacks: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          impactExplanation: { type: Type.STRING },
          effortLevel: { type: Type.STRING, enum: ['Low', 'Medium', 'High'] },
        },
        required: ['title', 'description', 'impactExplanation', 'effortLevel'],
      },
    },
    sustainableAlternatives: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          impactExplanation: { type: Type.STRING },
          effortLevel: { type: Type.STRING, enum: ['Low', 'Medium', 'High'] },
        },
        required: ['title', 'description', 'impactExplanation', 'effortLevel'],
      },
    },
  },
  required: [
    'riskSummary',
    'quantifiedImpact',
    'lowEmissionRoutines',
    'indoorAirHacks',
    'sustainableAlternatives',
  ],
};

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_actual_api_key_here') {
      return NextResponse.json({ error: 'Server API key not configured.' }, { status: 500 });
    }

    const body: UserProfile = await req.json();
    if (!body.city || !body.aqiLevel) {
      return NextResponse.json({ error: 'City and AQI severity are required.' }, { status: 400 });
    }

    const sensorContext = body.liveMetrics
      ? `Live Telemetry (${body.liveMetrics.resolvedName}): US AQI ${body.liveMetrics.usAqi}, PM2.5 ${body.liveMetrics.pm25} µg/m³, PM10 ${body.liveMetrics.pm10} µg/m³`
      : `Reported Smog Level: ${body.aqiLevel}`;

    const prompt = `You are VayuGuard AI, an Urban Air Quality & Environmental Health Assistant.
Generate a personalized winter smog survival and emission-reduction plan for this household:
- Location: ${body.city.slice(0, 100).trim()}
- Air Quality Data: ${sensorContext}
- Household Members & Sensitivities: ${(body.householdMembers || 'General family').slice(0, 200)}
- Home Ventilation & Equipment: ${(body.homeFeatures || 'Standard apartment').slice(0, 200)}
- Daily Commute & Habits: ${(body.commuteMode || 'Mixed transport').slice(0, 200)}

Provide 3 practical indoor air quality hacks, 3 low-emission daily routines, and 3 sustainable community alternatives tailored to Indian urban winter smog conditions. Clearly quantify and explain the direct health or emission impact for each item.`;

    const response = await generateWithFallback(apiKey, prompt, {
      responseMimeType: 'application/json',
      responseSchema: planSchema,
      temperature: 0.4,
    });

    const data = JSON.parse(response.text || '{}');
    return NextResponse.json(data, { status: 200 });
  } catch (error: unknown) {
    console.error('Gemini Generate Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Failed to generate plan: ${message}` }, { status: 500 });
  }
}