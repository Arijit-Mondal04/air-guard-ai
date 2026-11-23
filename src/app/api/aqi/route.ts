import { NextResponse } from 'next/server';
import { classifyUsAqi } from '@/lib/validation';
import { HourlyForecastPoint } from '@/types/air';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const city = searchParams.get('city')?.trim();

    if (!city) {
      return NextResponse.json({ error: 'City parameter is required' }, { status: 400 });
    }

    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`,
      { cache: 'no-store' }
    );
    const geoData = await geoRes.json();

    if (!geoData.results || geoData.results.length === 0) {
      return NextResponse.json(
        { error: `Could not locate "${city}". Try a major nearby city.` },
        { status: 404 }
      );
    }

    const location = geoData.results[0];
    const { latitude, longitude, name, admin1, country } = location;

    const aqiRes = await fetch(
      `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&current=us_aqi,pm2_5,pm10&hourly=pm2_5,us_aqi&forecast_hours=24&timezone=auto`,
      { cache: 'no-store' }
    );
    const aqiData = await aqiRes.json();

    if (!aqiData.current) {
      return NextResponse.json(
        { error: 'Live air quality sensor data unavailable for this location.' },
        { status: 502 }
      );
    }

    const usAqi = Math.round(aqiData.current.us_aqi ?? 0);
    const pm25 = Number((aqiData.current.pm2_5 ?? 0).toFixed(1));
    const pm10 = Number((aqiData.current.pm10 ?? 0).toFixed(1));

    const times: string[] = aqiData.hourly?.time ?? [];
    const hourlyPm25: number[] = aqiData.hourly?.pm2_5 ?? [];
    const hourlyAqi: number[] = aqiData.hourly?.us_aqi ?? [];

    const hourlyForecast: HourlyForecastPoint[] = times.slice(0, 24).map((iso, i) => {
      const hourPart = iso.split('T')[1]?.slice(0, 5) ?? `${String(i).padStart(2, '0')}:00`;
      const hourNum = parseInt(hourPart.split(':')[0], 10);
      const ampm = hourNum === 0 ? '12a' : hourNum < 12 ? `${hourNum}a` : hourNum === 12 ? '12p' : `${hourNum - 12}p`;
      return {
        time: hourPart,
        hourLabel: ampm,
        pm25: Math.round(hourlyPm25[i] ?? pm25),
        usAqi: Math.round(hourlyAqi[i] ?? usAqi),
      };
    });

    // Identify lowest PM2.5 window (daytime 09:00–18:00 preferred) & peak exposure hour
    let safestPoint = hourlyForecast[0];
    let peakPoint = hourlyForecast[0];

    for (const pt of hourlyForecast) {
      if (pt.pm25 > (peakPoint?.pm25 ?? -1)) peakPoint = pt;
      const hr = parseInt(pt.time.split(':')[0], 10);
      const isDaytime = hr >= 10 && hr <= 17;
      const safestIsDaytime = safestPoint
        ? parseInt(safestPoint.time.split(':')[0], 10) >= 10 &&
          parseInt(safestPoint.time.split(':')[0], 10) <= 17
        : false;

      if (isDaytime && !safestIsDaytime) {
        safestPoint = pt;
      } else if (isDaytime === safestIsDaytime && pt.pm25 < (safestPoint?.pm25 ?? Infinity)) {
        safestPoint = pt;
      }
    }

    const resolvedName = [name, admin1, country].filter(Boolean).join(', ');

    return NextResponse.json({
      resolvedName,
      usAqi,
      pm25,
      pm10,
      category: classifyUsAqi(usAqi),
      hourlyForecast,
      safestWindowLabel: safestPoint ? `${safestPoint.time} (${safestPoint.pm25} µg/m³)` : '13:00–15:30',
      peakWindowLabel: peakPoint ? `${peakPoint.time} (${peakPoint.pm25} µg/m³)` : '07:00–09:00',
    });
  } catch (error) {
    console.error('Live AQI route error:', error);
    return NextResponse.json({ error: 'Failed to fetch live AQI data' }, { status: 500 });
  }
}