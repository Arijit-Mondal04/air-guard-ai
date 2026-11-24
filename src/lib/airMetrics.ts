import { AirQualityPlan } from '@/types/air';

export interface IndoorTrigger {
  id: string;
  label: string;
  spike: number;
  desc: string;
}

export interface IndoorFix {
  id: string;
  label: string;
  reduction: number;
  desc: string;
}

export interface StatusBadge {
  label: string;
  bg: string;
}

export interface ActivityVerdict {
  id: 'walk' | 'commute' | 'windows' | 'laundry';
  label: string;
  verdict: string;
  tone: string;
}

export const INDOOR_TRIGGERS: IndoorTrigger[] = [
  { id: 'tadka', label: 'Gas Tadka / Frying', spike: 220, desc: 'High oil & spice smoke burst' },
  { id: 'dhoop', label: 'Agarbatti / Dhoop', spike: 165, desc: 'Fine incense particulate smoke' },
  { id: 'coil', label: 'Mosquito Coil', spike: 190, desc: 'Continuous overnight smoke' },
  { id: 'draft', label: 'Morning Window Open', spike: 95, desc: '7 AM street smog entering' },
];

export const INDOOR_FIXES: IndoorFix[] = [
  { id: 'exhaust', label: 'Kitchen Exhaust On', reduction: 0.45, desc: 'Vents cooking smoke out' },
  { id: 'hepa', label: 'HEPA / Box Fan On', reduction: 0.6, desc: 'Traps 99% fine particles' },
  { id: 'seal', label: 'Door Gap Wet Towel', reduction: 0.25, desc: 'Blocks balcony drafts' },
];

export function calculateCigaretteEquivalent(pm25: number): string {
  const safePm25 = Math.max(0, pm25);
  return (safePm25 / 22).toFixed(1);
}

export function getAqiStatusBadge(usAqi: number): StatusBadge {
  if (usAqi > 300) return { label: 'Hazardous Air', bg: 'bg-[#DC2626] text-white' };
  if (usAqi > 200) return { label: 'Very Poor Air', bg: 'bg-[#EA580C] text-white' };
  if (usAqi > 150) return { label: 'Poor Air', bg: 'bg-[#D97706] text-white' };
  if (usAqi > 100) return { label: 'Moderate Smog', bg: 'bg-[#CA8A04] text-white' };
  return { label: 'Clean Air', bg: 'bg-[#0284C7] text-white' };
}

export function simulateIndoorAir(
  outdoorPm25: number,
  activeTriggerIds: string[],
  activeFixIds: string[]
) {
  const triggerSpike = INDOOR_TRIGGERS.filter((t) => activeTriggerIds.includes(t.id)).reduce(
    (sum, t) => sum + t.spike,
    0
  );
  const rawIndoorPeak = Math.round(Math.max(0, outdoorPm25) * 0.65 + triggerSpike);

  const mitigationMultiplier = INDOOR_FIXES.filter((f) => activeFixIds.includes(f.id)).reduce(
    (mult, f) => mult * (1 - f.reduction),
    1
  );

  const mitigatedIndoorPm25 = Math.max(14, Math.round(rawIndoorPeak * mitigationMultiplier));
  const clearanceMinutes = Math.max(15, Math.round((rawIndoorPeak / 3.5) * mitigationMultiplier));

  return {
    rawIndoorPeak,
    mitigatedIndoorPm25,
    clearanceMinutes,
    protectedCigarettes: calculateCigaretteEquivalent(mitigatedIndoorPm25),
  };
}

export function getDailyActivityVerdicts(usAqi: number, safestWindowLabel?: string): ActivityVerdict[] {
  const dangerTone = 'bg-[#FEE2E2] text-[#991B1B] border-[#FCA5A5]';
  const cautionTone = 'bg-[#FEF3C7] text-[#92400E] border-[#FCD34D]';
  const safeTone = 'bg-[#E0F2FE] text-[#075985] border-[#7DD3FC]';

  return [
    {
      id: 'walk',
      label: 'Morning Walk',
      verdict: usAqi > 150 ? 'Skip Outdoor' : 'Safe Before 8 AM',
      tone: usAqi > 150 ? dangerTone : safeTone,
    },
    {
      id: 'commute',
      label: 'School / Office',
      verdict: usAqi > 150 ? 'Wear N95 Mask' : 'Normal Commute',
      tone: usAqi > 150 ? cautionTone : safeTone,
    },
    {
      id: 'windows',
      label: 'Open Windows',
      verdict: safestWindowLabel ? `Only ${safestWindowLabel.split(' ')[0]}` : '1 PM – 3 PM Only',
      tone: safeTone,
    },
    {
      id: 'laundry',
      label: 'Drying Laundry',
      verdict: usAqi > 180 ? 'Dry Indoors' : 'Afternoon Balcony',
      tone: usAqi > 180 ? dangerTone : safeTone,
    },
  ];
}

export function formatWhatsAppBrief(params: {
  city: string;
  usAqi: number;
  outdoorPm25: number;
  safestWindowLabel?: string;
  plan: AirQualityPlan | null;
}): string {
  const activeCity = params.city.trim().toUpperCase() || 'KOLKATA';
  const safeWindow =
    params.plan?.quantifiedImpact?.safeVentilationWindow ??
    params.safestWindowLabel ??
    '1:00 PM – 3:30 PM';
  const cigs = calculateCigaretteEquivalent(params.outdoorPm25);

  const topRules = params.plan
    ? [
        ...(params.plan.indoorAirHacks || []).slice(0, 2).map((h) => `• ${h.title}`),
        ...(params.plan.lowEmissionRoutines || []).slice(0, 1).map((r) => `• ${r.title}`),
      ].join('\n')
    : '• Keep windows shut during 6–9 AM smog peak\n• Run kitchen exhaust during cooking/tadka\n• Wet-mop floors instead of dry sweeping';

  return [
    `*VAYUGUARD // ${activeCity} FAMILY AIR BRIEFING*`,
    `Live Air: US AQI ${params.usAqi} (${params.outdoorPm25} µg/m³) — equals ~${cigs} cigarettes/day unprotected`,
    `Safest Window to Air Out Home: ${safeWindow}`,
    '',
    '*Today’s Simple Rules:*',
    topRules,
  ].join('\n');
}