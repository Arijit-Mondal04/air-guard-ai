import { NextRequest, NextResponse } from 'next/server';
import { generateWithFallback } from '@/lib/gemini';
import { AirQualityPlan, UserProfile } from '@/types/air';

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Server API key not configured.' }, { status: 500 });
    }

    const { question, profile, plan }: { question: string; profile: UserProfile; plan: AirQualityPlan } =
      await req.json();

    if (!question || !question.trim()) {
      return NextResponse.json({ error: 'Please enter a question.' }, { status: 400 });
    }

    const prompt = `You are VayuGuard AI, a practical urban air quality and environmental advisor.
Household Context:
- City: ${profile.city} (${profile.aqiLevel})
- Members: ${profile.householdMembers}
- Home: ${profile.homeFeatures}
- Commute: ${profile.commuteMode}
- Current Plan Summary: ${plan.riskSummary}

User Follow-Up Question: "${question.slice(0, 400).trim()}"

Answer concisely in 3–4 practical, direct sentences tailored specifically to their household setup and smog severity. Include a clear cause-and-effect impact explanation.`;

    const response = await generateWithFallback(apiKey, prompt, {
      temperature: 0.4,
    });

    return NextResponse.json({ answer: response.text || 'No response generated.' }, { status: 200 });
  } catch (error: unknown) {
    console.error('Follow-up chat error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Chat error: ${message}` }, { status: 500 });
  }
}