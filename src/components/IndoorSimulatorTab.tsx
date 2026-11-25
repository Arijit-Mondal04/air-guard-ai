'use client';

import { INDOOR_FIXES, INDOOR_TRIGGERS } from '@/lib/airMetrics';

interface IndoorSimulatorTabProps {
  activeTriggers: string[];
  activeFixes: string[];
  onToggleTrigger: (id: string) => void;
  onToggleFix: (id: string) => void;
  simulation: {
    rawIndoorPeak: number;
    mitigatedIndoorPm25: number;
    clearanceMinutes: number;
    protectedCigarettes: string;
  };
}

export function IndoorSimulatorTab({
  activeTriggers,
  activeFixes,
  onToggleTrigger,
  onToggleFix,
  simulation,
}: IndoorSimulatorTabProps) {
  return (
    <div role="tabpanel" className="bg-[#FDFCFA] border border-[#D5D8DF] rounded-xl p-6 sm:p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E6E8EE] pb-4">
        <div>
          <h3 className="text-xl font-bold text-[#0F1E36]">
            What happens inside your room during cooking or incense?
          </h3>
          <p className="text-sm text-[#475569]">
            Tap everyday activities below to see how fast indoor smoke builds up and how long it takes to clear.
          </p>
        </div>
        <div className="bg-[#0F1E36] text-[#F7F5F0] px-4 py-2.5 rounded-lg text-right" aria-live="polite">
          <span className="text-[11px] text-[#FBBF24] block font-semibold">Room Clears In</span>
          <span className="text-xl font-bold">{simulation.clearanceMinutes} mins</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <p className="text-sm font-bold text-[#991B1B]">Step 1: Choose what&apos;s happening indoors</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5" role="group" aria-label="Indoor smoke triggers">
            {INDOOR_TRIGGERS.map((trigger) => {
              const active = activeTriggers.includes(trigger.id);
              return (
                <button
                  key={trigger.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onToggleTrigger(trigger.id)}
                  className={`p-3.5 rounded-lg border text-left transition cursor-pointer ${
                    active
                      ? 'bg-[#FEE2E2] border-[#DC2626] text-[#7F1D1D]'
                      : 'bg-[#F7F5F0] border-[#D5D8DF] text-[#0F1E36] hover:border-[#0F1E36]'
                  }`}
                >
                  <div className="font-bold text-sm">{trigger.label}</div>
                  <div className="text-xs opacity-80 mt-0.5">{trigger.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-bold text-[#075985]">Step 2: Turn on your home protections</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5" role="group" aria-label="Indoor air protections">
            {INDOOR_FIXES.map((fix) => {
              const active = activeFixes.includes(fix.id);
              return (
                <button
                  key={fix.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onToggleFix(fix.id)}
                  className={`p-3.5 rounded-lg border text-left transition cursor-pointer ${
                    active
                      ? 'bg-[#E0F2FE] border-[#0284C7] text-[#0C4A6E]'
                      : 'bg-[#F7F5F0] border-[#D5D8DF] text-[#0F1E36] hover:border-[#0F1E36]'
                  }`}
                >
                  <div className="font-bold text-sm">{fix.label}</div>
                  <div className="text-xs opacity-80 mt-0.5">{fix.desc}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2" aria-live="polite">
        <div className="bg-[#FEE2E2] border border-[#FCA5A5] rounded-lg p-4">
          <span className="text-xs font-bold text-[#991B1B]">Without Protection</span>
          <p className="text-2xl font-bold text-[#7F1D1D] mt-1">{simulation.rawIndoorPeak} µg/m³</p>
          <p className="text-xs text-[#991B1B] mt-0.5">Trapped smoke inside closed rooms</p>
        </div>
        <div className="bg-[#E0F2FE] border border-[#7DD3FC] rounded-lg p-4">
          <span className="text-xs font-bold text-[#075985]">With Your Selected Controls</span>
          <p className="text-2xl font-bold text-[#0C4A6E] mt-1">
            {simulation.mitigatedIndoorPm25} µg/m³ (~{simulation.protectedCigarettes} cigs/day)
          </p>
          <p className="text-xs text-[#075985] mt-0.5">
            Safe to remove masks in ~{simulation.clearanceMinutes} minutes
          </p>
        </div>
      </div>
    </div>
  );
}