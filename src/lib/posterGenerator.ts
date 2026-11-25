import { AirQualityPlan } from '@/types/air';

export function downloadFamilyPoster(params: {
  city: string;
  usAqi: number;
  unprotectedCigs: string;
  protectedCigs: string;
  safestWindowLabel?: string;
  plan: AirQualityPlan | null;
}): void {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1080;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const activeCity = (params.city.trim() || 'KOLKATA').toUpperCase();
  const safeWindow =
    params.plan?.quantifiedImpact?.safeVentilationWindow ??
    params.safestWindowLabel ??
    '1:00 PM – 3:30 PM';

  ctx.fillStyle = '#0F1E36';
  ctx.fillRect(0, 0, 1080, 390);
  ctx.fillStyle = '#F7F5F0';
  ctx.fillRect(0, 390, 1080, 690);

  ctx.fillStyle = '#F59E0B';
  ctx.fillRect(72, 64, 18, 56);

  ctx.fillStyle = '#F7F5F0';
  ctx.font = 'bold 40px sans-serif';
  ctx.fillText('VAYUGUARD // FAMILY AIR GUIDE', 110, 106);

  ctx.fillStyle = '#7DD3FC';
  ctx.font = 'bold 28px sans-serif';
  ctx.fillText(`CITY: ${activeCity}  •  US AQI ${params.usAqi}`, 72, 185);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 58px sans-serif';
  ctx.fillText(`Equals ~${params.unprotectedCigs} cigarettes/day`, 72, 265);

  ctx.fillStyle = '#FBBF24';
  ctx.font = 'bold 28px sans-serif';
  ctx.fillText(`With Home Protection: drops to ~${params.protectedCigs} cigarettes/day`, 72, 330);

  ctx.fillStyle = '#0F1E36';
  ctx.fillRect(72, 440, 936, 130);
  ctx.fillStyle = '#FBBF24';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText('BEST TIME TO OPEN WINDOWS TODAY', 104, 490);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 38px sans-serif';
  ctx.fillText(safeWindow, 104, 542);

  ctx.fillStyle = '#0F1E36';
  ctx.font = 'bold 30px sans-serif';
  ctx.fillText('4 SIMPLE RULES FOR OUR HOME:', 72, 645);

  const rules = params.plan
    ? [
        ...(params.plan.indoorAirHacks || []).slice(0, 2).map((h, i) => `${i + 1}. ${h.title}`),
        ...(params.plan.lowEmissionRoutines || []).slice(0, 2).map((r, i) => `${i + 3}. ${r.title}`),
      ]
    : [
        '1. Keep balcony doors & windows closed during 6–9 AM peak',
        '2. Always switch on kitchen exhaust during tadka or frying',
        '3. Wet-mop floors instead of dry broom sweeping',
        '4. Wear a snug N95 mask on two-wheeler or auto rides',
      ];

  ctx.font = '27px sans-serif';
  ctx.fillStyle = '#1E293B';
  rules.forEach((rule, i) => {
    ctx.fillText(rule.slice(0, 56), 72, 710 + i * 64);
  });

  const link = document.createElement('a');
  link.download = `VayuGuard-${activeCity}-Guide.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}