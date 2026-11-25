'use client';

import { useState } from 'react';
import {
  Check,
  CheckCircle2,
  Circle,
  Clock,
  CloudFog,
  Copy,
  Home,
  Leaf,
  Printer,
  ShieldCheck,
  TrendingDown,
} from 'lucide-react';
import { AirQualityPlan } from '@/types/air';

interface ActionPlanTabProps {
  cityInput: string;
  plan: AirQualityPlan | null;
  loading: boolean;
  completedTasks: Record<string, boolean>;
  onToggleTask: (key: string) => void;
}

export function ActionPlanTab({
  cityInput,
  plan,
  loading,
  completedTasks,
  onToggleTask,
}: ActionPlanTabProps) {
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'indoor' | 'routines' | 'sustainable'>('all');
  const [copied, setCopied] = useState(false);

  if (loading) {
    return (
      <div role="tabpanel" className="bg-[#FDFCFA] border border-[#D5D8DF] rounded-xl p-8 space-y-4 animate-pulse" aria-busy="true">
        <div className="h-5 w-56 bg-[#E2E8F0] rounded" />
        <div className="h-16 w-full bg-[#F1F5F9] rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="h-24 bg-[#F1F5F9] rounded" />
          <div className="h-24 bg-[#F1F5F9] rounded" />
          <div className="h-24 bg-[#F1F5F9] rounded" />
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div role="tabpanel" className="bg-[#FDFCFA] border border-[#D5D8DF] rounded-xl p-8 text-center space-y-3">
        <p className="text-lg font-bold text-[#0F1E36]">
          Ready to create your personalized plan for {cityInput}
        </p>
        <p className="text-sm text-[#475569] max-w-lg mx-auto">
          Select who lives in your home above and click <strong>Build My Family&apos;s Air Plan</strong>—or switch tabs to test how cooking and incense affect your room air.
        </p>
      </div>
    );
  }

  const indoorHacks = plan.indoorAirHacks ?? [];
  const routines = plan.lowEmissionRoutines ?? [];
  const alternatives = plan.sustainableAlternatives ?? [];
  const totalActions = indoorHacks.length + routines.length + alternatives.length;
  const completedCount = Object.values(completedTasks).filter(Boolean).length;
  const progressPct = totalActions > 0 ? Math.round((completedCount / totalActions) * 100) : 0;

  function handleCopyPlan() {
    if (!plan) return;
    const lines = [
      `VAYUGUARD // HOUSEHOLD AIR PLAN (${cityInput.toUpperCase()})`,
      plan.riskSummary,
      '',
      'INDOOR AIR FIXES:',
      ...indoorHacks.map((i) => `- ${i.title}: ${i.description}`),
      '',
      'DAILY ROUTINES:',
      ...routines.map((i) => `- ${i.title}: ${i.description}`),
      '',
      'ECO-FRIENDLY HABITS:',
      ...alternatives.map((i) => `- ${i.title}: ${i.description}`),
    ];
    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  const visibleGroups = [
    ...(categoryFilter === 'all' || categoryFilter === 'indoor'
      ? [{ id: 'indoor', title: 'Keep Indoor Air Clean', badge: 'bg-[#E0F2FE] text-[#075985]', border: 'border-l-[#0284C7]', icon: Home, items: indoorHacks }]
      : []),
    ...(categoryFilter === 'all' || categoryFilter === 'routines'
      ? [{ id: 'routine', title: 'Safer Daily Habits', badge: 'bg-[#FEF3C7] text-[#92400E]', border: 'border-l-[#D97706]', icon: ShieldCheck, items: routines }]
      : []),
    ...(categoryFilter === 'all' || categoryFilter === 'sustainable'
      ? [{ id: 'sustainable', title: 'Eco-Friendly Swaps', badge: 'bg-[#CCFBF1] text-[#115E59]', border: 'border-l-[#0D9488]', icon: Leaf, items: alternatives }]
      : []),
  ];

  return (
    <div role="tabpanel" className="space-y-6">
      <div className="bg-[#FDFCFA] border border-[#D5D8DF] rounded-xl p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E6E8EE] pb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-[#0284C7]">
            Your Custom Plan • {cityInput}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyPlan}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#F7F5F0] hover:bg-[#0F1E36] text-[#0F1E36] hover:text-white border border-[#CBD0DA] transition cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy Plan'}
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#F7F5F0] hover:bg-[#0F1E36] text-[#0F1E36] hover:text-white border border-[#CBD0DA] transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Print
            </button>
          </div>
        </div>

        <p className="text-base text-[#0F1E36] leading-relaxed">{plan.riskSummary}</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#F0F9FF] border border-[#BAE6FD] p-4 rounded-lg">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#075985]">
              <CloudFog className="w-4 h-4" aria-hidden="true" />
              <span>Cleaner Indoor Air</span>
            </div>
            <p className="text-lg font-bold text-[#0F1E36] mt-1">
              {plan.quantifiedImpact?.estimatedIndoorPm25Reduction ?? '40%–60% less PM2.5'}
            </p>
          </div>

          <div className="bg-[#F0FDFA] border border-[#99F6E4] p-4 rounded-lg">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#115E59]">
              <TrendingDown className="w-4 h-4" aria-hidden="true" />
              <span>Carbon Saved</span>
            </div>
            <p className="text-lg font-bold text-[#0F1E36] mt-1">
              {plan.quantifiedImpact?.weeklyCo2SavedKg ?? '8–12 kg CO₂/week'}
            </p>
          </div>

          <div className="bg-[#FFFBEB] border border-[#FDE68A] p-4 rounded-lg">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#92400E]">
              <Clock className="w-4 h-4" aria-hidden="true" />
              <span>Best Time to Open Windows</span>
            </div>
            <p className="text-lg font-bold text-[#0F1E36] mt-1">
              {plan.quantifiedImpact?.safeVentilationWindow ?? '1:00 PM – 3:30 PM'}
            </p>
          </div>
        </div>

        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-[#475569]">Checklist Progress (Tap items below as you complete them)</span>
            <span className="text-[#0284C7]">
              {completedCount} of {totalActions} Done ({progressPct}%)
            </span>
          </div>
          <div
            className="w-full h-2.5 bg-[#E2E8F0] rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={progressPct}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="h-full bg-[#0284C7] transition-all duration-300" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter action steps">
        {[
          { id: 'all', label: `All Steps (${totalActions})` },
          { id: 'indoor', label: `Indoor Air (${indoorHacks.length})` },
          { id: 'routines', label: `Daily Habits (${routines.length})` },
          { id: 'sustainable', label: `Eco Swaps (${alternatives.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            aria-pressed={categoryFilter === tab.id}
            onClick={() => setCategoryFilter(tab.id as typeof categoryFilter)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
              categoryFilter === tab.id
                ? 'bg-[#0F1E36] text-white'
                : 'bg-[#FDFCFA] text-[#334155] border border-[#D5D8DF] hover:border-[#0F1E36]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {visibleGroups.map((group) => {
          const Icon = group.icon;
          return (
            <div key={group.id} className="space-y-3">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold ${group.badge}`}>
                <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                {group.title}
              </span>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {group.items.map((item, idx) => {
                  const key = `${group.id}-${idx}`;
                  const done = !!completedTasks[key];
                  return (
                    <button
                      key={key}
                      type="button"
                      aria-pressed={done}
                      onClick={() => onToggleTask(key)}
                      className={`p-5 rounded-xl border border-l-4 ${group.border} text-left transition cursor-pointer flex items-start gap-3.5 ${
                        done ? 'bg-[#F0F9FF] border-[#7DD3FC]' : 'bg-[#FDFCFA] border-[#D5D8DF] hover:bg-white'
                      }`}
                    >
                      <div className="mt-0.5 shrink-0" aria-hidden="true">
                        {done ? <CheckCircle2 className="w-5 h-5 text-[#0284C7]" /> : <Circle className="w-5 h-5 text-[#94A3B8]" />}
                      </div>

                      <div className="space-y-2">
                        <h3 className={`font-bold text-base ${done ? 'line-through text-[#64748B]' : 'text-[#0F1E36]'}`}>
                          {item.title}
                        </h3>
                        <p className="text-sm text-[#334155] leading-relaxed">{item.description}</p>
                        <p className="text-xs font-medium text-[#075985] bg-[#F1F5F9] px-3 py-1.5 rounded-md">
                          Why it helps: {item.impactExplanation}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}