import { NextRequest, NextResponse } from 'next/server';
import { LiveAqiData } from '@/types/air';

function classifyUsAqi(aqi: number): string {
  if (aqi <= 50) return 'Good (AQI 0–50)';
  if (aqi <= 100) return 'Moderate (AQI 51–100)';
  if (aqi <= 150) return 'Unhealthy for Sensitive Groups (AQI 101–150)';
  if (aqi <= 200) return 'Poor (AQI 151–200)';
  if (aqi <= 300) return 'Very Poor / Severe (AQI 201–300)';
  return 'Hazardous (AQI 300+)';
}

export async function GET(req: NextRequest) {
  try {
    const city = req.nextUrl.searchParams.get('city')?.trim();
    if (!city || city.length > 100) {
      return NextResponse.json({ error: 'Please enter a valid city name.' }, { status: 400 });
    }

    // 1. Geocode city name to coordinates
    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`,
      { next: { revalidate: 3600 } }
    );
    const geoData = await geoRes.json();

    if (!geoData.results || geoData.results.length === 0) {
      return NextResponse.json({ error: `Could not find coordinates for "${city}".` }, { status: 404 });
    }

    const place = geoData.results[0];

    // 2. Fetch live Air Quality metrics
    const aqiRes = await fetch(
      `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${place.latitude}&longitude=${place.longitude}&current=us_aqi,pm2_5,pm10`,
      { cache: 'no-store' }
    );
    const aqiData = await aqiRes.json();

    if (!aqiData.current) {
      return NextResponse.json({ error: 'Live air quality sensor data unavailable right now.' }, { status: 502 });
    }

    const usAqi = Math.round(aqiData.current.us_aqi ?? 0);
    const payload: LiveAqiData = {
      resolvedName: place.admin1 ? `${place.name}, ${place.admin1}` : place.name,
      country: place.country || '',
      usAqi,
      pm25: Number((aqiData.current.pm2_5 ?? 0).toFixed(1)),
      pm10: Number((aqiData.current.pm10 ?? 0).toFixed(1)),
      category: classifyUsAqi(usAqi),
      fetchedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    console.error('Live AQI fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch live air quality data.' }, { status: 500 });
  }
}