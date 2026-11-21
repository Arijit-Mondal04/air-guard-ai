'use client';

import { useState } from 'react';
import {
  Wind,
  ShieldCheck,
  Leaf,
  Home,
  AlertTriangle,
  Check,
  MapPin,
  Users,
  Car,
  Activity,
  Radio,
  Copy,
  MessageSquare,
  Send,
  Clock,
  TrendingDown,
  CloudFog,
  Printer,
  ArrowUpRight,
  CheckSquare,
  Square,
  RotateCcw,
  Gauge,
} from 'lucide-react';
import { AirQualityPlan, LiveAqiData, UserProfile } from '@/types/air';

const PRESETS = [
  {
    label: 'Delhi NCR',
    aqi: '300+',
    city: 'Delhi',
    aqiLevel: 'Hazardous (AQI 300+)',
    householdMembers: '2 adults, 1 elderly parent, 1 school child',
    homeFeatures: '3BHK apartment, balcony, 1 HEPA purifier in bedroom',
    commuteMode: 'Metro + short e-rickshaw commute',
  },
  {
    label: 'Kolkata',
    aqi: '240',
    city: 'Kolkata',
    aqiLevel: 'Very Poor / Severe (AQI 201–300)',
    householdMembers: '2 adults, 1 elderly parent, 1 child',
    homeFeatures: '2BHK flat, cross-ventilated balcony, no purifier',
    commuteMode: 'Metro + local bus / auto',
  },
  {
    label: 'Mumbai',
    aqi: '165',
    city: 'Mumbai',
    aqiLevel: 'Poor (AQI 151–200)',
    householdMembers: '2 working adults, 1 toddler',
    homeFeatures: '2BHK high-rise flat, sea breeze, AC',
    commuteMode: 'Suburban train + cab',
  },
];

const QUICK_TAGS = {
  members: ['Elderly parent', 'School child', 'Asthma / respiratory condition', 'Infant'],
  home: ['No purifier', '1 HEPA purifier', 'Open balcony', 'Gas stove'],
  commute: ['Metro / rail', 'Two-wheeler', 'Car / cab', 'Morning walk'],
};

const SUGGESTED_QUESTIONS = [
  'Is a 7 AM outdoor walk safe for a senior with respiratory sensitivity?',
  'How can we seal window drafts without permanent fixtures?',
  'Which low-light indoor plants actually filter winter particulates?',
];

const INITIAL_FORM: UserProfile = {
  city: '',
  aqiLevel: 'Very Poor / Severe (AQI 201–300)',
  householdMembers: '',
  homeFeatures: '',
  commuteMode: '',
};

export default function AirQualityAssistant() {
  const [form, setForm] = useState<UserProfile>(INITIAL_FORM);

  const [liveAqi, setLiveAqi] = useState<LiveAqiData | null>(null);
  const [fetchingAqi, setFetchingAqi] = useState(false);
  const [aqiError, setAqiError] = useState('');

  const [plan, setPlan] = useState<AirQualityPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'indoor' | 'routines' | 'sustainable'>('all');
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState(false);

  const [question, setQuestion] = useState('');
  const [askingFollowUp, setAskingFollowUp] = useState(false);
  const [qaHistory, setQaHistory] = useState<{ q: string; a: string }[]>([]);

  const toggleTask = (key: string) => {
    setCompletedTasks((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const appendChip = (field: 'householdMembers' | 'homeFeatures' | 'commuteMode', tag: string) => {
    setForm((prev) => {
      const current = prev[field].trim();
      if (current.toLowerCase().includes(tag.toLowerCase())) return prev;
      return {
        ...prev,
        [field]: current ? `${current}, ${tag.toLowerCase()}` : tag,
      };
    });
  };

  const handleReset = () => {
    setForm(INITIAL_FORM);
    setLiveAqi(null);
    setAqiError('');
    setError('');
  };

  const getSeverityMeta = (level: string) => {
    if (level.includes('Hazardous') || level.includes('300+')) {
      return {
        pill: 'bg-[#DC2626] text-white border-[#B91C1C]',
        dot: 'bg-white',
        code: 'CRITICAL SMOG • 300+',
        barColor: 'bg-[#DC2626]',
        barWidth: 'w-[94%]',
      };
    }
    if (level.includes('Very Poor') || level.includes('Poor')) {
      return {
        pill: 'bg-[#D97706] text-white border-[#B45309]',
        dot: 'bg-white',
        code: 'ELEVATED PM2.5 • ALERT',
        barColor: 'bg-[#D97706]',
        barWidth: 'w-[68%]',
      };
    }
    return {
      pill: 'bg-[#22C58B] text-[#071A14] border-[#16A370]',
      dot: 'bg-[#071A14]',
      code: 'NOMINAL AIR • SAFE',
      barColor: 'bg-[#22C58B]',
      barWidth: 'w-[28%]',
    };
  };

  const meta = getSeverityMeta(form.aqiLevel);

  async function handleFetchLiveAqi() {
    if (!form.city.trim()) return;
    setFetchingAqi(true);
    setAqiError('');
    try {
      const res = await fetch(`/api/aqi?city=${encodeURIComponent(form.city.trim())}`);
      const text = await res.text();
      let data: LiveAqiData & { error?: string };
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error('Telemetry service returned an unexpected format. Please retry.');
      }
      if (!res.ok) throw new Error(data.error || 'Could not fetch live AQI');

      setLiveAqi(data);
      const normalizedCategory = data.category.replace(/-/g, '–');
      setForm((prev) => ({ ...prev, aqiLevel: normalizedCategory }));
    } catch (err: unknown) {
      setAqiError(err instanceof Error ? err.message : 'Failed to fetch live sensor data');
    } finally {
      setFetchingAqi(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setCompletedTasks({});
    setQaHistory([]);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, liveMetrics: liveAqi }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      setPlan(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to generate protocol');
    } finally {
      setLoading(false);
    }
  }

  async function handleAskFollowUp(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim() || !plan) return;
    const currentQ = question.trim();
    setQuestion('');
    setAskingFollowUp(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: currentQ, profile: form, plan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to answer');
      setQaHistory((prev) => [...prev, { q: currentQ, a: data.answer }]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to fetch an answer right now.';
      setQaHistory((prev) => [...prev, { q: currentQ, a: msg }]);
    } finally {
      setAskingFollowUp(false);
    }
  }

  function handleCopyPlan() {
    if (!plan) return;
    const pm25Drop = plan.quantifiedImpact?.estimatedIndoorPm25Reduction ?? '40%–60% reduction';
    const co2Saved = plan.quantifiedImpact?.weeklyCo2SavedKg ?? '8–12 kg CO₂/week';
    const ventWindow = plan.quantifiedImpact?.safeVentilationWindow ?? '1:00 PM – 3:30 PM';

    const lines = [
      `VAYUGUARD // HOUSEHOLD AIR PROTOCOL (${form.city.toUpperCase()})`,
      `Summary: ${plan.riskSummary}`,
      `Indoor PM2.5 Reduction: ${pm25Drop} | Weekly CO₂ Avoided: ${co2Saved} | Safe Ventilation: ${ventWindow}`,
      '',
      '01. INDOOR FILTRATION & SEALING:',
      ...(plan.indoorAirHacks || []).map(
        (i) => `- ${i.title}: ${i.description} [Impact: ${i.impactExplanation}]`
      ),
      '',
      '02. LOW-EMISSION DAILY ROUTINES:',
      ...(plan.lowEmissionRoutines || []).map(
        (i) => `- ${i.title}: ${i.description} [Impact: ${i.impactExplanation}]`
      ),
      '',
      '03. SUSTAINABLE COMMUNITY ALTERNATIVES:',
      ...(plan.sustainableAlternatives || []).map(
        (i) => `- ${i.title}: ${i.description} [Impact: ${i.impactExplanation}]`
      ),
    ];
    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  const indoorHacks = plan?.indoorAirHacks ?? [];
  const routines = plan?.lowEmissionRoutines ?? [];
  const alternatives = plan?.sustainableAlternatives ?? [];

  const totalActions = indoorHacks.length + routines.length + alternatives.length;
  const completedCount = Object.values(completedTasks).filter(Boolean).length;
  const progressPct = totalActions > 0 ? Math.round((completedCount / totalActions) * 100) : 0;

  const getEffortTag = (effort: string) => {
    switch (effort) {
      case 'Low':
        return 'text-[#065F46] bg-[#D1FAE5] border-[#6EE7B7]';
      case 'Medium':
        return 'text-[#92400E] bg-[#FEF3C7] border-[#FCD34D]';
      default:
        return 'text-[#991B1B] bg-[#FEE2E2] border-[#FCA5A5]';
    }
  };

  const visibleGroups = [
    ...(activeTab === 'all' || activeTab === 'indoor'
      ? [
          {
            id: 'indoor',
            code: '01',
            title: 'Indoor Filtration & Sealing',
            accentBorder: 'border-l-[#16A34A]',
            badgeBg: 'bg-[#DCFCE7] text-[#14532D]',
            icon: Home,
            items: indoorHacks,
          },
        ]
      : []),
    ...(activeTab === 'all' || activeTab === 'routines'
      ? [
          {
            id: 'routine',
            code: '02',
            title: 'Low-Emission Daily Routines',
            accentBorder: 'border-l-[#D97706]',
            badgeBg: 'bg-[#FEF3C7] text-[#78350F]',
            icon: ShieldCheck,
            items: routines,
          },
        ]
      : []),
    ...(activeTab === 'all' || activeTab === 'sustainable'
      ? [
          {
            id: 'sustainable',
            code: '03',
            title: 'Sustainable Community Alternatives',
            accentBorder: 'border-l-[#0D9488]',
            badgeBg: 'bg-[#CCFBF1] text-[#134E4A]',
            icon: Leaf,
            items: alternatives,
          },
        ]
      : []),
  ];

  const hasAnyInput = Boolean(
    form.city.trim() ||
      form.householdMembers.trim() ||
      form.homeFeatures.trim() ||
      form.commuteMode.trim()
  );

  return (
    <div className="min-h-screen bg-[#F5F1E8] text-[#0B211A] selection:bg-[#22C58B] selection:text-[#071A14]">
      {/* Rich Forest Top Header */}
      <header className="bg-[#0B211A] text-[#F5F1E8] border-b border-[#193B30] sticky top-0 z-30">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-[#22C58B] text-[#071A14] flex items-center justify-center">
              <Wind className="w-4 h-4 stroke-[2.5]" aria-hidden="true" />
            </div>
            <div className="flex items-center gap-2.5">
              <span className="font-bold tracking-tight text-lg text-[#F5F1E8]">VayuGuard</span>
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] px-2 py-0.5 rounded bg-[#14362B] text-[#6EE7B7] border border-[#245948] hidden sm:inline">
                Air Intelligence
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-1.5">
              {PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setLiveAqi(null);
                    setForm({
                      city: preset.city,
                      aqiLevel: preset.aqiLevel,
                      householdMembers: preset.householdMembers,
                      homeFeatures: preset.homeFeatures,
                      commuteMode: preset.commuteMode,
                    });
                  }}
                  className="font-mono text-[10px] uppercase tracking-wider px-2.5 py-1.5 rounded bg-[#133329] hover:bg-[#1D4B3D] text-[#E6E0D4] border border-[#235243] transition cursor-pointer"
                >
                  {preset.label} <span className="text-[#6EE7B7] font-semibold">• {preset.aqi}</span>
                </button>
              ))}
            </div>

            <div
              className={`inline-flex items-center gap-2 px-3 py-1 rounded border font-mono text-[10px] font-bold tracking-[0.12em] ${meta.pill}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${meta.dot} animate-pulse`} />
              <span>{meta.code}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main 12-Column Split-Screen Workbench */}
      <main className="max-w-[1360px] mx-auto px-4 sm:px-8 py-8 sm:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN (5 Cols): Deep Forest Control Deck with Warm Bone Inputs */}
          <aside className="lg:col-span-5 lg:sticky lg:top-22 space-y-4">
            <div className="bg-[#0B211A] text-[#F5F1E8] border border-[#1B3D32] rounded-md p-6 sm:p-7 space-y-6">
              <div className="flex items-start justify-between gap-3 border-b border-[#1A3B30] pb-4">
                <div className="space-y-1">
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#6EE7B7]">
                    Parameter Console
                  </p>
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F5F1E8]">
                    Household Smog Defense
                  </h1>
                </div>

                {hasAnyInput && (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="shrink-0 inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider px-2.5 py-1.5 rounded bg-[#14362B] hover:bg-[#1F4E3E] text-[#D4CEC2] hover:text-white border border-[#265A49] transition cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Clear
                  </button>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* 01. Location & Live Sensor */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6EE7B7]">
                      01 / Locality & Live Telemetry
                    </span>
                    {liveAqi && (
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 bg-[#22C58B] text-[#071A14] rounded">
                        US AQI {liveAqi.usAqi}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <div className="relative w-full">
                      <MapPin className="w-4 h-4 text-[#166534] absolute left-3 top-3" />
                      <input
                        id="city"
                        type="text"
                        required
                        value={form.city}
                        onChange={(e) => {
                          setLiveAqi(null);
                          setForm({ ...form, city: e.target.value });
                        }}
                        className="w-full rounded bg-[#F5F1E8] border border-[#C7BFB0] pl-9 pr-3 py-2.5 text-sm font-medium text-[#0B211A] placeholder:text-[#6B7C75] focus:outline-none focus:ring-2 focus:ring-[#22C58B] transition"
                        placeholder="Enter city (e.g., Kolkata, Delhi, Pune)"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleFetchLiveAqi}
                      disabled={fetchingAqi || !form.city.trim()}
                      className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded bg-[#163B2F] hover:bg-[#1F5241] disabled:opacity-45 text-[11px] font-mono uppercase tracking-wider font-semibold text-[#6EE7B7] border border-[#2A6652] transition cursor-pointer"
                    >
                      <Radio className={`w-3.5 h-3.5 ${fetchingAqi ? 'animate-spin' : ''}`} />
                      {fetchingAqi ? 'Sync...' : 'Sync AQI'}
                    </button>
                  </div>
                  {aqiError && <p className="text-xs text-[#FCA5A5] font-medium">{aqiError}</p>}

                  <div className="space-y-1.5">
                    <label htmlFor="aqiLevel" className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-[#A8C2B8]">
                      <Activity className="w-3 h-3 text-[#FBBF24]" />
                      Smog Severity Tier
                    </label>
                    <select
                      id="aqiLevel"
                      value={form.aqiLevel}
                      onChange={(e) => {
                        setLiveAqi(null);
                        setForm({ ...form, aqiLevel: e.target.value });
                      }}
                      className="w-full rounded bg-[#F5F1E8] border border-[#C7BFB0] px-3 py-2.5 text-sm font-medium text-[#0B211A] focus:outline-none focus:ring-2 focus:ring-[#22C58B] transition"
                    >
                      <option value="Good (AQI 0–50)">Good (AQI 0–50)</option>
                      <option value="Moderate (AQI 51–100)">Moderate (AQI 51–100)</option>
                      <option value="Unhealthy for Sensitive Groups (AQI 101–150)">
                        Unhealthy for Sensitive Groups (AQI 101–150)
                      </option>
                      <option value="Poor (AQI 151–200)">Poor (AQI 151–200)</option>
                      <option value="Very Poor / Severe (AQI 201–300)">
                        Very Poor / Severe (AQI 201–300)
                      </option>
                      <option value="Hazardous (AQI 300+)">Hazardous (AQI 300+)</option>
                    </select>
                  </div>

                  {liveAqi && (
                    <div className="bg-[#133329] border border-[#255948] rounded px-3.5 py-2.5 text-[11px] font-mono flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[#6EE7B7] font-semibold">{liveAqi.resolvedName}</span>
                      <span className="text-[#E6E0D4]">
                        PM2.5: <strong className="text-white">{liveAqi.pm25}</strong> µg/m³ • PM10:{' '}
                        <strong className="text-white">{liveAqi.pm10}</strong> µg/m³
                      </span>
                    </div>
                  )}
                </div>

                {/* 02. Occupants & Sensitivities */}
                <div className="space-y-2.5 pt-1 border-t border-[#1A3B30]">
                  <span className="block font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6EE7B7]">
                    02 / Occupants & Health Profile
                  </span>
                  <div className="relative">
                    <Users className="w-4 h-4 text-[#166534] absolute left-3 top-3" />
                    <input
                      id="householdMembers"
                      type="text"
                      value={form.householdMembers}
                      onChange={(e) => setForm({ ...form, householdMembers: e.target.value })}
                      className="w-full rounded bg-[#F5F1E8] border border-[#C7BFB0] pl-9 pr-3 py-2.5 text-sm font-medium text-[#0B211A] placeholder:text-[#6B7C75] focus:outline-none focus:ring-2 focus:ring-[#22C58B] transition"
                      placeholder="e.g., 2 adults, 1 elderly parent, asthma..."
                    />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_TAGS.members.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => appendChip('householdMembers', tag)}
                        className="text-[11px] px-2.5 py-1 rounded bg-[#14362B] hover:bg-[#22C58B] text-[#D8E6E0] hover:text-[#071A14] font-medium border border-[#245948] transition cursor-pointer"
                      >
                        + {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 03. Structure & Mobility */}
                <div className="space-y-3 pt-1 border-t border-[#1A3B30]">
                  <span className="block font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6EE7B7]">
                    03 / Structure & Mobility
                  </span>

                  <div className="space-y-2">
                    <div className="relative">
                      <Home className="w-4 h-4 text-[#166534] absolute left-3 top-3" />
                      <input
                        id="homeFeatures"
                        type="text"
                        value={form.homeFeatures}
                        onChange={(e) => setForm({ ...form, homeFeatures: e.target.value })}
                        aria-label="Home ventilation and filtration"
                        placeholder="e.g., 2BHK flat, balcony, no purifier..."
                        className="w-full rounded bg-[#F5F1E8] border border-[#C7BFB0] pl-9 pr-3 py-2.5 text-sm font-medium text-[#0B211A] placeholder:text-[#6B7C75] focus:outline-none focus:ring-2 focus:ring-[#22C58B] transition"
                      />
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {QUICK_TAGS.home.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => appendChip('homeFeatures', tag)}
                          className="text-[11px] px-2.5 py-1 rounded bg-[#14362B] hover:bg-[#22C58B] text-[#D8E6E0] hover:text-[#071A14] font-medium border border-[#245948] transition cursor-pointer"
                        >
                          + {tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2 pt-1">
                    <div className="relative">
                      <Car className="w-4 h-4 text-[#166534] absolute left-3 top-3" />
                      <input
                        id="commuteMode"
                        type="text"
                        value={form.commuteMode}
                        onChange={(e) => setForm({ ...form, commuteMode: e.target.value })}
                        aria-label="Daily commute mode"
                        placeholder="e.g., Metro, two-wheeler, morning walk..."
                        className="w-full rounded bg-[#F5F1E8] border border-[#C7BFB0] pl-9 pr-3 py-2.5 text-sm font-medium text-[#0B211A] placeholder:text-[#6B7C75] focus:outline-none focus:ring-2 focus:ring-[#22C58B] transition"
                      />
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {QUICK_TAGS.commute.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => appendChip('commuteMode', tag)}
                          className="text-[11px] px-2.5 py-1 rounded bg-[#14362B] hover:bg-[#22C58B] text-[#D8E6E0] hover:text-[#071A14] font-medium border border-[#245948] transition cursor-pointer"
                        >
                          + {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !form.city.trim()}
                  className="w-full inline-flex items-center justify-center gap-2 bg-[#22C58B] hover:bg-[#1EB07B] disabled:opacity-45 text-[#071A14] font-bold text-sm py-3.5 rounded transition cursor-pointer"
                >
                  <span>{loading ? 'Building Action Protocol...' : 'Generate Action Protocol'}</span>
                  <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                </button>
              </form>
            </div>
          </aside>

          {/* RIGHT COLUMN (7 Cols): Daylight Bone Diagnostic Workspace */}
          <section className="lg:col-span-7 space-y-6" aria-live="polite">
            {error && (
              <div
                role="alert"
                className="bg-[#FEE2E2] border border-[#FCA5A5] text-[#991B1B] p-4 rounded-md flex items-center gap-3 text-sm font-medium"
              >
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Empty / Standby Diagnostic Preview */}
            {!plan && !loading && (
              <div className="bg-[#FAF8F4] border border-[#D4CEC0] rounded-md p-7 sm:p-10 space-y-7">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E5DFD2] pb-4">
                  <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.16em] text-[#15803D] font-bold">
                    <Gauge className="w-4 h-4" />
                    <span>Diagnostic Workspace • Ready</span>
                  </div>
                  <span className="font-mono text-[11px] text-[#5C6E67]">
                    LIVE OPEN-METEO + STRUCTURED AI
                  </span>
                </div>

                <div className="space-y-3">
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0B211A]">
                    Breathe cleaner indoors{form.city.trim() ? ` in ${form.city.trim()}` : ''}.
                  </h2>
                  <p className="text-sm sm:text-base text-[#445750] leading-relaxed">
                    Enter your locality on the left and sync live PM2.5 sensor readings—or pick a quick city preset from the top bar—to generate a tailored household smog defense & carbon-saving protocol.
                  </p>
                </div>

                {/* Live Severity Visual Bar Preview */}
                <div className="bg-[#F5F1E8] border border-[#D8D1C3] rounded p-4 space-y-2">
                  <div className="flex items-center justify-between font-mono text-[11px]">
                    <span className="text-[#445750] font-semibold">SELECTED SEVERITY TIER</span>
                    <span className="font-bold text-[#0B211A]">{form.aqiLevel}</span>
                  </div>
                  <div className="w-full h-2.5 bg-[#E2DBD0] rounded-full overflow-hidden">
                    <div className={`h-full ${meta.barColor} ${meta.barWidth} transition-all duration-300`} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-[#F5F1E8] border border-[#D8D1C3] border-t-4 border-t-[#16A34A] p-4 rounded-sm space-y-1.5">
                    <span className="font-mono text-[10px] font-bold text-[#15803D]">01 • INDOOR</span>
                    <p className="text-sm font-bold text-[#0B211A]">Filtration & Sealing</p>
                    <p className="text-xs text-[#4A5E56] leading-relaxed">
                      Zero-cost cross-draft control, wet-mopping & purifier placement.
                    </p>
                  </div>
                  <div className="bg-[#F5F1E8] border border-[#D8D1C3] border-t-4 border-t-[#D97706] p-4 rounded-sm space-y-1.5">
                    <span className="font-mono text-[10px] font-bold text-[#B45309]">02 • ROUTINES</span>
                    <p className="text-sm font-bold text-[#0B211A]">Daily Exposure Timing</p>
                    <p className="text-xs text-[#4A5E56] leading-relaxed">
                      Safe afternoon ventilation windows & low-emission commute swaps.
                    </p>
                  </div>
                  <div className="bg-[#F5F1E8] border border-[#D8D1C3] border-t-4 border-t-[#0D9488] p-4 rounded-sm space-y-1.5">
                    <span className="font-mono text-[10px] font-bold text-[#0F766E]">03 • IMPACT</span>
                    <p className="text-sm font-bold text-[#0B211A]">Quantified Savings</p>
                    <p className="text-xs text-[#4A5E56] leading-relaxed">
                      Estimated indoor PM2.5 drop & weekly household CO₂ avoided.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Loading Skeleton State */}
            {loading && (
              <div className="border border-[#D4CEC0] bg-[#FAF8F4] rounded-md p-8 space-y-4 animate-pulse">
                <div className="h-4 w-48 bg-[#E5DFD2] rounded" />
                <div className="h-16 w-full bg-[#EFECE4] rounded" />
                <div className="grid grid-cols-3 gap-3">
                  <div className="h-20 bg-[#EFECE4] rounded" />
                  <div className="h-20 bg-[#EFECE4] rounded" />
                  <div className="h-20 bg-[#EFECE4] rounded" />
                </div>
              </div>
            )}

            {/* Active Protocol Output */}
            {plan && !loading && (
              <>
                {/* Rich Forest Executive Summary Banner */}
                <div className="bg-[#0B211A] text-[#F5F1E8] border border-[#1B3D32] rounded-md p-6 space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1A3B30] pb-3">
                    <div className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[#6EE7B7]">
                      <span>PROTOCOL BRIEF • {form.city.toUpperCase()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleCopyPlan}
                        className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider px-3 py-1 rounded bg-[#14362B] hover:bg-[#22C58B] text-[#F5F1E8] hover:text-[#071A14] border border-[#245948] transition cursor-pointer"
                      >
                        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copied ? 'Copied' : 'Copy'}
                      </button>
                      <button
                        type="button"
                        onClick={() => window.print()}
                        className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider px-3 py-1 rounded bg-[#14362B] hover:bg-[#22C58B] text-[#F5F1E8] hover:text-[#071A14] border border-[#245948] transition cursor-pointer"
                      >
                        <Printer className="w-3 h-3" />
                        Print
                      </button>
                    </div>
                  </div>

                  <p className="text-sm sm:text-base text-[#F5F1E8] leading-relaxed">{plan.riskSummary}</p>

                  {/* 3-Column Color-Accented Metric Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div className="bg-[#133329] border border-[#245948] p-3.5 rounded">
                      <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-[#6EE7B7]">
                        <CloudFog className="w-3.5 h-3.5" />
                        <span>Indoor PM2.5 Drop</span>
                      </div>
                      <p className="text-sm sm:text-base font-bold text-white mt-1">
                        {plan.quantifiedImpact?.estimatedIndoorPm25Reduction ?? '40%–60% reduction'}
                      </p>
                    </div>

                    <div className="bg-[#133329] border border-[#245948] p-3.5 rounded">
                      <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-[#38BDF8]">
                        <TrendingDown className="w-3.5 h-3.5" />
                        <span>Weekly CO₂ Avoided</span>
                      </div>
                      <p className="text-sm sm:text-base font-bold text-white mt-1">
                        {plan.quantifiedImpact?.weeklyCo2SavedKg ?? '8–12 kg CO₂/week'}
                      </p>
                    </div>

                    <div className="bg-[#133329] border border-[#245948] p-3.5 rounded">
                      <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-[#FBBF24]">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Ventilation Window</span>
                      </div>
                      <p className="text-sm sm:text-base font-bold text-white mt-1">
                        {plan.quantifiedImpact?.safeVentilationWindow ?? '1:00 PM – 3:30 PM'}
                      </p>
                    </div>
                  </div>

                  {/* Vivid Mint Readiness Progress Bar */}
                  <div className="pt-2 space-y-1.5">
                    <div className="flex items-center justify-between font-mono text-[11px]">
                      <span className="text-[#A8C2B8]">HOUSEHOLD READINESS SCORE</span>
                      <span className="text-[#6EE7B7] font-bold">
                        {progressPct}% ({completedCount}/{totalActions} ADOPTED)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-[#14362B] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#22C58B] transition-all duration-300"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Filter Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#D6CFC2] pb-3">
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { id: 'all', label: `All (${totalActions})` },
                      { id: 'indoor', label: `Indoor (${indoorHacks.length})` },
                      { id: 'routines', label: `Routines (${routines.length})` },
                      { id: 'sustainable', label: `Community (${alternatives.length})` },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id as typeof activeTab)}
                        className={`px-3.5 py-1.5 rounded font-mono text-[11px] uppercase tracking-wider transition cursor-pointer ${
                          activeTab === tab.id
                            ? 'bg-[#0B211A] text-[#F5F1E8] font-bold'
                            : 'bg-[#FAF8F4] text-[#4A6158] hover:text-[#0B211A] border border-[#CFC7B8]'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                  <span className="font-mono text-[10px] text-[#5C6E67]">CLICK CARD TO MARK ADOPTED</span>
                </div>

                {/* Color-Coded Action Ledger */}
                <div className="space-y-6">
                  {visibleGroups.map((group) => {
                    const Icon = group.icon;
                    return (
                      <div key={group.id} className="space-y-3">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded font-mono text-[11px] font-bold uppercase tracking-wider ${group.badgeBg}`}>
                            <Icon className="w-3.5 h-3.5" />
                            {group.code} • {group.title}
                          </span>
                        </div>

                        <div className="space-y-2.5">
                          {group.items.map((item, idx) => {
                            const key = `${group.id}-${idx}`;
                            const done = !!completedTasks[key];
                            return (
                              <div
                                key={key}
                                onClick={() => toggleTask(key)}
                                className={`p-4 sm:p-5 rounded-md border border-l-4 ${group.accentBorder} transition cursor-pointer flex items-start gap-3.5 ${
                                  done
                                    ? 'bg-[#ECFDF5] border-[#A7F3D0]'
                                    : 'bg-[#FAF8F4] border-[#D4CEC0] hover:bg-white'
                                }`}
                              >
                                <button
                                  type="button"
                                  aria-label={`Mark ${item.title} as ${done ? 'incomplete' : 'complete'}`}
                                  className="mt-0.5 shrink-0"
                                >
                                  {done ? (
                                    <CheckSquare className="w-4 h-4 text-[#059669]" />
                                  ) : (
                                    <Square className="w-4 h-4 text-[#788780]" />
                                  )}
                                </button>

                                <div className="flex-1 space-y-2">
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <h3
                                      className={`font-bold text-sm sm:text-base ${
                                        done ? 'line-through text-[#4A6158]' : 'text-[#0B211A]'
                                      }`}
                                    >
                                      {item.title}
                                    </h3>
                                    <span
                                      className={`font-mono text-[10px] uppercase tracking-wider font-bold px-2.5 py-0.5 rounded border ${getEffortTag(item.effortLevel)}`}
                                    >
                                      {item.effortLevel} Effort
                                    </span>
                                  </div>

                                  <p className="text-xs sm:text-sm text-[#354A42] leading-relaxed">
                                    {item.description}
                                  </p>

                                  <div className="text-xs bg-[#F0ECE1] border border-[#DFD8C8] rounded px-3 py-2 text-[#0B211A]">
                                    <span className="font-mono text-[10px] uppercase tracking-wider font-bold text-[#15803D] mr-1.5">
                                      Direct Impact:
                                    </span>
                                    {item.impactExplanation}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Contextual Household Q&A */}
                <div className="bg-[#FAF8F4] border border-[#D4CEC0] rounded-md p-5 sm:p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-[#E5DFD2] pb-2.5">
                    <div className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[#0B211A]">
                      <MessageSquare className="w-4 h-4 text-[#15803D]" />
                      <span>Ask VayuGuard About Your Home</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {SUGGESTED_QUESTIONS.map((sq) => (
                      <button
                        key={sq}
                        type="button"
                        onClick={() => setQuestion(sq)}
                        className="text-xs px-3 py-1.5 rounded bg-[#F5F1E8] hover:bg-[#0B211A] text-[#0B211A] hover:text-[#F5F1E8] border border-[#CFC7B8] transition cursor-pointer text-left"
                      >
                        {sq}
                      </button>
                    ))}
                  </div>

                  {qaHistory.length > 0 && (
                    <div className="space-y-2.5">
                      {qaHistory.map((item, idx) => (
                        <div
                          key={idx}
                          className="bg-[#F5F1E8] text-[#0B211A] border border-[#D4CEC0] rounded p-4 space-y-1.5 text-xs"
                        >
                          <p className="font-bold text-[#15803D]">Q: {item.q}</p>
                          <p className="text-[#263B33] leading-relaxed">{item.a}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <form onSubmit={handleAskFollowUp} className="flex gap-2">
                    <input
                      type="text"
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      aria-label="Ask a follow-up air quality question"
                      placeholder="Ask about masks, ventilation timing, or indoor air..."
                      className="w-full rounded bg-[#F5F1E8] border border-[#C8C0B0] px-3.5 py-2.5 text-xs sm:text-sm text-[#0B211A] placeholder:text-[#788780] focus:outline-none focus:border-[#0B211A] focus:bg-white transition"
                    />
                    <button
                      type="submit"
                      disabled={askingFollowUp || !question.trim()}
                      className="shrink-0 inline-flex items-center gap-1.5 px-5 py-2.5 rounded bg-[#0B211A] hover:bg-[#1F4E3D] disabled:opacity-45 text-[#F5F1E8] font-mono uppercase tracking-wider font-bold text-xs transition cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {askingFollowUp ? 'Wait' : 'Ask'}
                    </button>
                  </form>
                </div>
              </>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}