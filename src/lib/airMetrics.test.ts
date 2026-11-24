import { describe, expect, it } from 'vitest';
import {
  calculateCigaretteEquivalent,
  formatWhatsAppBrief,
  getAqiStatusBadge,
  getDailyActivityVerdicts,
  simulateIndoorAir,
} from './airMetrics';

describe('VayuGuard Air Metrics & Indoor Smoke Simulator', () => {
  it('calculates passive cigarette equivalents accurately', () => {
    expect(calculateCigaretteEquivalent(0)).toBe('0.0');
    expect(calculateCigaretteEquivalent(22)).toBe('1.0');
    expect(calculateCigaretteEquivalent(143)).toBe('6.5');
    expect(calculateCigaretteEquivalent(-10)).toBe('0.0');
  });

  it('returns accurate severity badges across US AQI tiers', () => {
    expect(getAqiStatusBadge(65).label).toBe('Clean Air');
    expect(getAqiStatusBadge(130).label).toBe('Moderate Smog');
    expect(getAqiStatusBadge(175).label).toBe('Poor Air');
    expect(getAqiStatusBadge(245).label).toBe('Very Poor Air');
    expect(getAqiStatusBadge(350).label).toBe('Hazardous Air');
  });

  it('simulates indoor PM2.5 spike and reduction when exhaust and HEPA are active', () => {
    const unmitigated = simulateIndoorAir(150, ['tadka', 'dhoop'], []);
    const mitigated = simulateIndoorAir(150, ['tadka', 'dhoop'], ['exhaust', 'hepa']);

    expect(unmitigated.rawIndoorPeak).toBe(483);
    expect(mitigated.mitigatedIndoorPm25).toBeLessThan(unmitigated.mitigatedIndoorPm25);
    expect(mitigated.clearanceMinutes).toBeLessThan(unmitigated.clearanceMinutes);
  });

  it('generates conservative daily verdicts during high smog vs clean air', () => {
    const smogVerdicts = getDailyActivityVerdicts(210, '14:00 (PM2.5 85 µg/m³)');
    expect(smogVerdicts.find((v) => v.id === 'walk')?.verdict).toBe('Skip Outdoor');
    expect(smogVerdicts.find((v) => v.id === 'commute')?.verdict).toBe('Wear N95 Mask');
    expect(smogVerdicts.find((v) => v.id === 'laundry')?.verdict).toBe('Dry Indoors');

    const cleanVerdicts = getDailyActivityVerdicts(70);
    expect(cleanVerdicts.find((v) => v.id === 'walk')?.verdict).toBe('Safe Before 8 AM');
    expect(cleanVerdicts.find((v) => v.id === 'commute')?.verdict).toBe('Normal Commute');
  });

  it('formats shareable WhatsApp briefing with custom plan rules when present', () => {
    const brief = formatWhatsAppBrief({
      city: 'Kolkata',
      usAqi: 185,
      outdoorPm25: 110,
      safestWindowLabel: '1:00 PM – 3:00 PM',
      plan: {
        riskSummary: 'High morning smog.',
        quantifiedImpact: {
          estimatedIndoorPm25Reduction: '50%',
          weeklyCo2SavedKg: '9 kg',
          safeVentilationWindow: '1:30 PM – 3:30 PM',
        },
        indoorAirHacks: [
          {
            title: 'Seal balcony door gap',
            description: 'Use wet towel',
            impactExplanation: 'Blocks drafts',
            effortLevel: 'Low',
          },
        ],
        lowEmissionRoutines: [
          {
            title: 'Take Metro instead of bike',
            description: 'Avoid traffic exhaust',
            impactExplanation: 'Cuts exposure',
            effortLevel: 'Low',
          },
        ],
        sustainableAlternatives: [],
      },
    });

    expect(brief).toContain('VAYUGUARD // KOLKATA FAMILY AIR BRIEFING');
    expect(brief).toContain('US AQI 185');
    expect(brief).toContain('5.0 cigarettes/day');
    expect(brief).toContain('Seal balcony door gap');
    expect(brief).toContain('Take Metro instead of bike');
  });
});