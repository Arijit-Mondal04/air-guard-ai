import { describe, it, expect } from 'vitest';
import { classifyUsAqi, sanitizeAndValidateProfile } from './validation';

describe('VayuGuard AI Telemetry & Input Validation', () => {
  it('classifies US AQI values accurately across severity tiers', () => {
    expect(classifyUsAqi(35)).toBe('Good (AQI 0–50)');
    expect(classifyUsAqi(175)).toBe('Poor (AQI 151–200)');
    expect(classifyUsAqi(265)).toBe('Very Poor / Severe (AQI 201–300)');
    expect(classifyUsAqi(410)).toBe('Hazardous (AQI 300+)');
  });

  it('accepts valid city and AQI severity', () => {
    const result = sanitizeAndValidateProfile({
      city: 'Kolkata',
      aqiLevel: 'Very Poor / Severe (AQI 201–300)',
    });
    expect(result.valid).toBe(true);
    expect(result.sanitizedCity).toBe('Kolkata');
  });

  it('rejects empty city input', () => {
    const result = sanitizeAndValidateProfile({
      city: '   ',
      aqiLevel: 'Hazardous (AQI 300+)',
    });
    expect(result.valid).toBe(false);
  });

  it('truncates overly long city strings for prompt safety', () => {
    const result = sanitizeAndValidateProfile({
      city: 'D'.repeat(150),
      aqiLevel: 'Hazardous (AQI 300+)',
    });
    expect(result.valid).toBe(true);
    expect(result.sanitizedCity?.length).toBe(100);
  });
});