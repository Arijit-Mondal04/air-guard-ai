'use client';

import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Car,
  Download,
  Flame,
  Home,
  MessageSquare,
  Send,
  Share2,
  ShieldCheck,
  Sparkles,
  Users,
  Wind,
} from 'lucide-react';
import { AirQualityPlan, LiveAqiData, UserProfile } from '@/types/air';
import {
  calculateCigaretteEquivalent,
  formatWhatsAppBrief,
  getAqiStatusBadge,
  getDailyActivityVerdicts,
  simulateIndoorAir,
} from '@/lib/airMetrics';
import { downloadFamilyPoster } from '@/lib/posterGenerator';
import { TelemetryPanel } from '@/components/TelemetryPanel';
import { ActionPlanTab } from '@/components/ActionPlanTab';
import { IndoorSimulatorTab } from '@/components/IndoorSimulatorTab';

const FAMILY_OPTIONS = [
  '2 Adults',
  'Elderly Parent',
  'School Child',
  'Infant / Toddler',
  'Asthma / Breathing Sensitivity',
];

const HOME_OPTIONS = [
  '2BHK / 3BHK Flat',
  'No Air Purifier',
  '1 HEPA Purifier',
  'Open Balcony',
  'Gas Stove Cooking',
];

const TRAVEL_OPTIONS = [
  'Metro / Train',
  'Two-Wheeler / Bike',
  'Auto / E-Rickshaw',
  'Car / Cab',
  'Morning / Evening Walk',
];

const SUGGESTED_QUESTIONS = [
  'Is a 7 AM walk safe for my elderly parent today?',
  'How do I seal window gaps cheaply without drilling?',
  'Which indoor plants actually help in winter smog?',
];

export default function AirQualityAssistant() {
  const [cityInput, setCityInput] = useState('Kolkata');
  const [selectedFamily, setSelectedFamily] = useState<string[]>(['2 Adults', 'Elderly Parent']);
  const [selectedHome, setSelectedHome] = useState<string[]>([
    '2BHK / 3BHK Flat',
    'No Air Purifier',
    'Gas Stove Cooking',
  ]);
  const [selectedTravel, setSelectedTravel] = useState<string[]>(['Metro / Train']);
  const [extraNotes, setExtraNotes] = useState('');

  const [liveAqi, setLiveAqi] = useState<LiveAqiData | null>(null);
  const [fetchingAqi, setFetchingAqi] = useState(false);
  const [aqiError, setAqiError] = useState('');

  const [workspaceTab, setWorkspaceTab] = useState<'plan' | 'simulator' | 'ask'>('plan');
  const [activeTriggers, setActiveTriggers] = useState<string[]>(['tadka']);
  const [activeFixes, setActiveFixes] = useState<string[]>(['exhaust']);

  const [plan, setPlan] = useState<AirQualityPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({});
  const [waCopied, setWaCopied] = useState(false);

  const [question, setQuestion] = useState('');
  const [askingFollowUp, setAskingFollowUp] = useState(false);
  const [qaHistory, setQaHistory] = useState<{ q: string; a: string }[]>([]);

  useEffect(() => {
    syncCityTelemetry('Kolkata');
  }, []);

  const toggleItem = (list: string[], setList: (v: string[]) => void, item: string) => {
    setList(list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);
  };

  async function syncCityTelemetry(targetCity: string) {
    if (!targetCity.trim()) return;
    setFetchingAqi(true);
    setAqiError('');
    try {
      const res = await fetch(`/api/aqi?city=${encodeURIComponent(targetCity.trim())}`);
      const data: LiveAqiData & { error?: string } = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not find that city');
      setLiveAqi(data);
    } catch (err: unknown) {
      setAqiError(err instanceof Error ? err.message : 'Unable to fetch live air data');
    } finally {
      setFetchingAqi(false);
    }
  }

  async function handleGeneratePlan(e: React.FormEvent) {
    e.preventDefault();
    if (!cityInput.trim()) return;

    setLoading(true);
    setError('');
    setCompletedTasks({});
    setWorkspaceTab('plan');

    const profilePayload: UserProfile = {
      city: cityInput.trim(),
      aqiLevel: liveAqi?.category ?? 'Very Poor / Severe (AQI 201–300)',
      householdMembers: selectedFamily.join(', ') || '2 adults',
      homeFeatures: [selectedHome.join(', '), extraNotes.trim()].filter(Boolean).join(' — ') || 'Standard flat',
      commuteMode: selectedTravel.join(', ') || 'Public transit',
      liveMetrics: liveAqi,
    };

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profilePayload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not generate plan');
      setPlan(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to build your household plan');
    } finally {
      setLoading(false);
    }
  }

  async function handleAskFollowUp(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim()) return;
    const currentQ = question.trim();
    setQuestion('');
    setAskingFollowUp(true);

    const activeProfile: UserProfile = {
      city: cityInput.trim() || 'Kolkata',
      aqiLevel: liveAqi?.category ?? 'Very Poor / Severe (AQI 201–300)',
      householdMembers: selectedFamily.join(', ') || '2 adults',
      homeFeatures: selectedHome.join(', ') || 'Apartment',
      commuteMode: selectedTravel.join(', ') || 'Public transit',
    };

    const fallbackPlan: AirQualityPlan = plan ?? {
      riskSummary: `Current PM2.5 in ${activeProfile.city} is ${liveAqi?.pm25 ?? 140} µg/m³.`,
      quantifiedImpact: {
        estimatedIndoorPm25Reduction: '45%–60%',
        weeklyCo2SavedKg: '10 kg/week',
        safeVentilationWindow: liveAqi?.safestWindowLabel ?? '1:00 PM – 3:30 PM',
      },
      indoorAirHacks: [],
      lowEmissionRoutines: [],
      sustainableAlternatives: [],
    };

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: currentQ, profile: activeProfile, plan: fallbackPlan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to answer');
      setQaHistory((prev) => [...prev, { q: currentQ, a: data.answer }]);
    } catch (err: unknown) {
      setQaHistory((prev) => [
        ...prev,
        { q: currentQ, a: err instanceof Error ? err.message : 'Unable to answer right now.' },
      ]);
    } finally {
      setAskingFollowUp(false);
    }
  }

  const outdoorPm25 = liveAqi?.pm25 ?? 145;
  const usAqi = liveAqi?.usAqi ?? 198;
  const statusBadge = getAqiStatusBadge(usAqi);
  const unprotectedCigs = calculateCigaretteEquivalent(outdoorPm25);
  const simulation = simulateIndoorAir(outdoorPm25, activeTriggers, activeFixes);
  const activityVerdicts = getDailyActivityVerdicts(usAqi, liveAqi?.safestWindowLabel);

  function handleCopyWhatsApp() {
    navigator.clipboard.writeText(
      formatWhatsAppBrief({
        city: liveAqi?.resolvedName ?? cityInput,
        usAqi,
        outdoorPm25,
        safestWindowLabel: liveAqi?.safestWindowLabel,
        plan,
      })
    );
    setWaCopied(true);
    setTimeout(() => setWaCopied(false), 2500);
  }

  return (
    <div className="min-h-screen bg-[#F7F5F0] text-[#0F1E36] selection:bg-[#F59E0B] selection:text-[#0F1E36]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:bg-[#F59E0B] focus:text-[#0F1E36] focus:px-4 focus:py-2 focus:rounded-lg focus:font-bold"
      >
        Skip to main content
      </a>

      <header className="bg-[#0F1E36] text-[#F7F5F0] border-b border-[#1E3354] sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#F59E0B] text-[#0F1E36] flex items-center justify-center" aria-hidden="true">
              <Wind className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight block leading-none">VayuGuard</span>
              <span className="text-[11px] text-[#93C5FD]">Clean Air Guide for Indian Homes</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyWhatsApp}
              aria-label="Copy WhatsApp air quality briefing"
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-[#192D4E] hover:bg-[#233E6B] text-[#F7F5F0] border border-[#2C4B7E] transition cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 text-[#FBBF24]" aria-hidden="true" />
              <span className="hidden sm:inline">{waCopied ? 'Copied for WhatsApp!' : 'Share on WhatsApp'}</span>
              <span className="sm:hidden">{waCopied ? 'Copied!' : 'Share'}</span>
            </button>
            <button
              type="button"
              onClick={() =>
                downloadFamilyPoster({
                  city: cityInput,
                  usAqi,
                  unprotectedCigs,
                  protectedCigs: simulation.protectedCigarettes,
                  safestWindowLabel: liveAqi?.safestWindowLabel,
                  plan,
                })
              }
              aria-label="Download family air quality guide image"
              className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-lg bg-[#F59E0B] hover:bg-[#D97706] text-[#0F1E36] transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Save Family Poster</span>
            </button>
          </div>
        </div>
      </header>

      <main id="main-content" className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <TelemetryPanel
          cityInput={cityInput}
          onCityInputChange={setCityInput}
          onSyncCity={syncCityTelemetry}
          liveAqi={liveAqi}
          fetchingAqi={fetchingAqi}
          aqiError={aqiError}
          usAqi={usAqi}
          outdoorPm25={outdoorPm25}
          statusBadge={statusBadge}
          unprotectedCigs={unprotectedCigs}
          activityVerdicts={activityVerdicts}
        />

        <section aria-labelledby="customizer-heading" className="bg-[#0F1E36] text-[#F7F5F0] rounded-xl p-6 sm:p-8 space-y-6">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#FBBF24]">
              Personalize Your Home Defense
            </span>
            <h2 id="customizer-heading" className="text-xl sm:text-2xl font-bold">
              Tap what applies to your family (No typing needed)
            </h2>
          </div>

          <form onSubmit={handleGeneratePlan} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: '1. Who lives with you?', aria: 'Household members', icon: Users, options: FAMILY_OPTIONS, selected: selectedFamily, setter: setSelectedFamily },
                { label: '2. Your home setup', aria: 'Home setup', icon: Home, options: HOME_OPTIONS, selected: selectedHome, setter: setSelectedHome },
                { label: '3. Daily travel mode', aria: 'Daily travel mode', icon: Car, options: TRAVEL_OPTIONS, selected: selectedTravel, setter: setSelectedTravel },
              ].map((group) => {
                const Icon = group.icon;
                return (
                  <div key={group.label} className="space-y-2.5">
                    <span className="flex items-center gap-2 text-sm font-semibold text-[#F7F5F0]">
                      <Icon className="w-4 h-4 text-[#FBBF24]" aria-hidden="true" />
                      {group.label}
                    </span>
                    <div className="flex flex-wrap gap-2" role="group" aria-label={group.aria}>
                      {group.options.map((opt) => {
                        const active = group.selected.includes(opt);
                        return (
                          <button
                            key={opt}
                            type="button"
                            aria-pressed={active}
                            onClick={() => toggleItem(group.selected, group.setter, opt)}
                            className={`text-xs px-3 py-2 rounded-lg font-medium border transition cursor-pointer ${
                              active
                                ? 'bg-[#0284C7] text-white border-[#38BDF8] font-bold'
                                : 'bg-[#192D4E] text-[#E2E8F0] border-[#2C4B7E] hover:border-[#7DD3FC]'
                            }`}
                          >
                            {active ? '✓ ' : '+ '}
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2 border-t border-[#1E3354]">
              <input
                type="text"
                value={extraNotes}
                onChange={(e) => setExtraNotes(e.target.value)}
                aria-label="Additional household notes"
                placeholder="Optional: add anything specific (e.g., ground floor near main road, newborn baby)..."
                className="flex-1 rounded-lg bg-[#192D4E] border border-[#2C4B7E] px-4 py-3 text-sm text-[#F7F5F0] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#F59E0B]"
              />
              <button
                type="submit"
                disabled={loading || !cityInput.trim()}
                className="inline-flex items-center justify-center gap-2 bg-[#F59E0B] hover:bg-[#D97706] disabled:opacity-50 text-[#0F1E36] font-bold text-sm px-7 py-3.5 rounded-lg transition cursor-pointer shrink-0"
              >
                <Sparkles className="w-4 h-4" aria-hidden="true" />
                <span>{loading ? 'Creating Your Plan...' : "Build My Family's Air Plan"}</span>
              </button>
            </div>
          </form>
        </section>

        {error && (
          <div role="alert" className="bg-[#FEE2E2] border border-[#FCA5A5] text-[#991B1B] p-4 rounded-xl flex items-center gap-3 text-sm font-medium">
            <AlertTriangle className="w-5 h-5 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <section className="space-y-5">
          <div role="tablist" aria-label="Workspace tools" className="flex flex-wrap gap-2 border-b border-[#D5D8DF] pb-3">
            {[
              { id: 'plan', label: "My Family's Action Plan", icon: ShieldCheck, color: 'text-[#F59E0B]' },
              { id: 'simulator', label: 'Indoor Smoke Simulator (Tadka / Dhoop)', icon: Flame, color: 'text-[#F59E0B]' },
              { id: 'ask', label: 'Ask a Question', icon: MessageSquare, color: 'text-[#38BDF8]' },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = workspaceTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setWorkspaceTab(tab.id as typeof workspaceTab)}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition cursor-pointer ${
                    active ? 'bg-[#0F1E36] text-white' : 'bg-[#FDFCFA] text-[#334155] border border-[#D5D8DF] hover:border-[#0F1E36]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${tab.color}`} aria-hidden="true" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {workspaceTab === 'plan' && (
            <ActionPlanTab
              cityInput={cityInput}
              plan={plan}
              loading={loading}
              completedTasks={completedTasks}
              onToggleTask={(key) => setCompletedTasks((prev) => ({ ...prev, [key]: !prev[key] }))}
            />
          )}

          {workspaceTab === 'simulator' && (
            <IndoorSimulatorTab
              activeTriggers={activeTriggers}
              activeFixes={activeFixes}
              onToggleTrigger={(id) => toggleItem(activeTriggers, setActiveTriggers, id)}
              onToggleFix={(id) => toggleItem(activeFixes, setActiveFixes, id)}
              simulation={simulation}
            />
          )}

          {workspaceTab === 'ask' && (
            <div role="tabpanel" className="bg-[#FDFCFA] border border-[#D5D8DF] rounded-xl p-6 sm:p-8 space-y-5">
              <div>
                <h3 className="text-xl font-bold text-[#0F1E36]">Ask anything about your home&apos;s air</h3>
                <p className="text-sm text-[#475569]">
                  Get instant, practical answers tailored to {cityInput} and your family profile.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {SUGGESTED_QUESTIONS.map((sq) => (
                  <button
                    key={sq}
                    type="button"
                    onClick={() => setQuestion(sq)}
                    className="text-xs font-medium px-3.5 py-2 rounded-lg bg-[#F7F5F0] hover:bg-[#0F1E36] text-[#0F1E36] hover:text-white border border-[#CBD0DA] transition cursor-pointer text-left"
                  >
                    {sq}
                  </button>
                ))}
              </div>

              {qaHistory.length > 0 && (
                <div className="space-y-3" aria-live="polite">
                  {qaHistory.map((item, idx) => (
                    <div key={idx} className="bg-[#F7F5F0] border border-[#D5D8DF] rounded-lg p-4 space-y-1.5">
                      <p className="text-sm font-bold text-[#0284C7]">You: {item.q}</p>
                      <p className="text-sm text-[#0F1E36] leading-relaxed">{item.a}</p>
                    </div>
                  ))}
                </div>
              )}

              <form onSubmit={handleAskFollowUp} className="flex gap-2">
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  aria-label="Ask a question about indoor air quality"
                  placeholder="Type your question (e.g., Which N95 mask fits kids best?)..."
                  className="flex-1 rounded-lg bg-[#F7F5F0] border border-[#CBD0DA] px-4 py-3 text-sm text-[#0F1E36] focus:outline-none focus:ring-2 focus:ring-[#0284C7] focus:bg-white"
                />
                <button
                  type="submit"
                  disabled={askingFollowUp || !question.trim()}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#0F1E36] hover:bg-[#1E3A66] disabled:opacity-45 text-white font-bold text-sm transition cursor-pointer"
                >
                  <Send className="w-4 h-4" aria-hidden="true" />
                  {askingFollowUp ? 'Thinking...' : 'Ask'}
                </button>
              </form>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}