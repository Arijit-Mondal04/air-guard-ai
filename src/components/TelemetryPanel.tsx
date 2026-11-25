'use client';

import { DoorOpen, Footprints, GraduationCap, MapPin, Search, Shirt } from 'lucide-react';
import { LiveAqiData } from '@/types/air';
import { ActivityVerdict, StatusBadge } from '@/lib/airMetrics';

const PRESET_CITIES = ['Kolkata', 'Delhi', 'Mumbai', 'Bengaluru', 'Patna', 'Lucknow'];

const VERDICT_ICONS = {
  walk: Footprints,
  commute: GraduationCap,
  windows: DoorOpen,
  laundry: Shirt,
};

interface TelemetryPanelProps {
  cityInput: string;
  onCityInputChange: (city: string) => void;
  onSyncCity: (city: string) => void;
  liveAqi: LiveAqiData | null;
  fetchingAqi: boolean;
  aqiError: string;
  usAqi: number;
  outdoorPm25: number;
  statusBadge: StatusBadge;
  unprotectedCigs: string;
  activityVerdicts: ActivityVerdict[];
}

export function TelemetryPanel({
  cityInput,
  onCityInputChange,
  onSyncCity,
  liveAqi,
  fetchingAqi,
  aqiError,
  usAqi,
  outdoorPm25,
  statusBadge,
  unprotectedCigs,
  activityVerdicts,
}: TelemetryPanelProps) {
  const hourlyData = liveAqi?.hourlyForecast ?? [];
  const maxHourlyPm25 = Math.max(...hourlyData.map((d) => d.pm25), 100);

  return (
    <section aria-labelledby="telemetry-heading" className="bg-[#FDFCFA] border border-[#D5D8DF] rounded-xl p-5 sm:p-7 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E6E8EE] pb-5">
        <div aria-live="polite">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 id="telemetry-heading" className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F1E36]">
              {liveAqi?.resolvedName ?? cityInput}
            </h1>
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${statusBadge.bg}`}>
              US AQI {usAqi} • {statusBadge.label}
            </span>
          </div>
          <p className="text-sm text-[#475569] mt-1">
            Live outdoor PM2.5 is <strong className="text-[#0F1E36]">{outdoorPm25} µg/m³</strong> — breathing this unprotected all day equals{' '}
            <strong className="text-[#DC2626]">~{unprotectedCigs} cigarettes</strong>.
          </p>
        </div>

        <div className="flex flex-col sm:items-end gap-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSyncCity(cityInput);
            }}
            className="flex gap-2 w-full sm:w-auto"
          >
            <div className="relative flex-1 sm:w-56">
              <MapPin className="w-4 h-4 text-[#0284C7] absolute left-3 top-3" aria-hidden="true" />
              <input
                type="text"
                value={cityInput}
                onChange={(e) => onCityInputChange(e.target.value)}
                placeholder="Search any city..."
                aria-label="Search city"
                className="w-full rounded-lg bg-[#F7F5F0] border border-[#CBD0DA] pl-9 pr-3 py-2 text-sm font-medium text-[#0F1E36] focus:outline-none focus:ring-2 focus:ring-[#0284C7]"
              />
            </div>
            <button
              type="submit"
              disabled={fetchingAqi || !cityInput.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0F1E36] hover:bg-[#1E3A66] text-white text-sm font-semibold transition cursor-pointer"
            >
              <Search className="w-4 h-4" aria-hidden="true" />
              {fetchingAqi ? 'Checking...' : 'Check'}
            </button>
          </form>

          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Quick city presets">
            {PRESET_CITIES.map((city) => {
              const selected = cityInput.toLowerCase() === city.toLowerCase();
              return (
                <button
                  key={city}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => {
                    onCityInputChange(city);
                    onSyncCity(city);
                  }}
                  className={`text-xs px-2.5 py-1 rounded-md border transition cursor-pointer ${
                    selected
                      ? 'bg-[#0F1E36] text-white border-[#0F1E36] font-semibold'
                      : 'bg-[#F7F5F0] text-[#334155] border-[#D5D8DF] hover:border-[#0F1E36]'
                  }`}
                >
                  {city}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {aqiError && (
        <p role="alert" className="text-xs text-[#DC2626] font-medium bg-[#FEE2E2] px-3 py-2 rounded-lg">
          {aqiError}
        </p>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {activityVerdicts.map((item) => {
          const Icon = VERDICT_ICONS[item.id];
          return (
            <div key={item.id} className="bg-[#F7F5F0] border border-[#DCE0E8] rounded-lg p-3.5 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#475569]">
                <Icon className="w-4 h-4 text-[#0F1E36]" aria-hidden="true" />
                <span>{item.label}</span>
              </div>
              <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-md border ${item.tone}`}>
                {item.verdict}
              </span>
            </div>
          );
        })}
      </div>

      {hourlyData.length > 0 && (
        <div className="bg-[#F7F5F0] border border-[#DCE0E8] rounded-lg p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-[#0F1E36]">
              Next 24 Hours Air Quality (Hover any bar to see exact hour)
            </span>
            <div className="flex items-center gap-3 text-[11px] font-medium">
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#0284C7]" /> Best to open windows
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#F59E0B]" /> Moderate
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#DC2626]" /> Heavy smog
              </span>
            </div>
          </div>

          <div className="h-24 flex items-end gap-1.5 pt-2" role="img" aria-label="24-hour PM2.5 air quality forecast bar chart">
            {hourlyData.map((pt, idx) => {
              const heightPct = Math.max(15, Math.min(100, Math.round((pt.pm25 / maxHourlyPm25) * 100)));
              const barColor =
                pt.pm25 >= 150 ? 'bg-[#DC2626]' : pt.pm25 >= 90 ? 'bg-[#F59E0B]' : 'bg-[#0284C7]';
              return (
                <div
                  key={`${pt.time}-${idx}`}
                  title={`${pt.time} — PM2.5: ${pt.pm25} µg/m³ (AQI ${pt.usAqi})`}
                  className="flex-1 flex flex-col items-center justify-end h-full group cursor-pointer"
                >
                  <div
                    style={{ height: `${heightPct}%` }}
                    className={`w-full rounded-t ${barColor} opacity-85 group-hover:opacity-100 transition-all`}
                  />
                </div>
              );
            })}
          </div>

          <div className="flex justify-between text-[11px] font-medium text-[#64748B]">
            <span>{hourlyData[0]?.hourLabel}</span>
            <span>{hourlyData[6]?.hourLabel}</span>
            <span>{hourlyData[12]?.hourLabel}</span>
            <span>{hourlyData[18]?.hourLabel}</span>
            <span>{hourlyData[23]?.hourLabel}</span>
          </div>
        </div>
      )}
    </section>
  );
}