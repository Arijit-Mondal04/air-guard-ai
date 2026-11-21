export function classifyUsAqi(aqi: number): string {
  if (aqi <= 50) return 'Good (AQI 0–50)';
  if (aqi <= 100) return 'Moderate (AQI 51–100)';
  if (aqi <= 150) return 'Unhealthy for Sensitive Groups (AQI 101–150)';
  if (aqi <= 200) return 'Poor (AQI 151–200)';
  if (aqi <= 300) return 'Very Poor / Severe (AQI 201–300)';
  return 'Hazardous (AQI 300+)';
}

export function sanitizeAndValidateProfile(input: {
  city?: string;
  aqiLevel?: string;
}) {
  if (!input.city || !input.city.trim()) {
    return { valid: false, error: 'City is required' };
  }
  if (!input.aqiLevel || !input.aqiLevel.trim()) {
    return { valid: false, error: 'AQI severity is required' };
  }
  return {
    valid: true,
    sanitizedCity: input.city.slice(0, 100).trim(),
  };
}