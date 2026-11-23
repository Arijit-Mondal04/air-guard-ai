'use client';

import { useEffect, useState } from 'react';
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
  Search,
  Copy,
  MessageSquare,
  Send,
  Clock,
  TrendingDown,
  CloudFog,
  Printer,
  Sparkles,
  CheckCircle2,
  Circle,
  Flame,
  Cigarette,
  Download,
  Share2,
  Footprints,
  GraduationCap,
  DoorOpen,
  Shirt,
} from 'lucide-react';
import { AirQualityPlan, LiveAqiData, UserProfile } from '@/types/air';

const CITIES = ['Kolkata', 'Delhi', 'Mumbai', 'Bengaluru', 'Patna', 'Lucknow'];

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

const INDOOR_TRIGGERS = [
  { id: 'tadka', label: 'Gas Tadka / Frying', spike: 220, desc: 'High oil & spice smoke burst' },
  { id: 'dhoop', label: 'Agarbatti / Dhoop', spike: 165, desc: 'Fine incense particulate smoke' },
  { id: 'coil', label: 'Mosquito Coil', spike: 190, desc: 'Continuous overnight smoke' },
  { id: 'draft', label: 'Morning Window Open', spike: 95, desc: '7 AM street smog entering' },
];

const INDOOR_FIXES = [
  { id: 'exhaust', label: 'Kitchen Exhaust On', reduction: 0.45, desc: 'Vents cooking smoke out' },
  { id: 'hepa', label: 'HEPA / Box Fan On', reduction: 0.6, desc: 'Traps 99% fine particles' },
  { id: 'seal', label: 'Door Gap Wet Towel', reduction: 0.25, desc: 'Blocks balcony drafts' },
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
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'indoor' | 'routines' | 'sustainable'>('all');
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState(false);
  const [waCopied, setWaCopied] = useState(false);

  const [question, setQuestion] = useState('');
  const [askingFollowUp, setAskingFollowUp] = useState(false);
  const [qaHistory, setQaHistory] = useState<{ q: string; a: string }[]>([]);

  useEffect(() => {
    syncCityTelemetry('Kolkata');
  }, []);

  const toggleSelection = (list: string[], setList: (v: string[]) => void, item: string) => {
    setList(list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);
  };

  const toggleTask = (key: string) => {
    setCompletedTasks((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleTrigger = (id: string) => {
    setActiveTriggers((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleFix = (id: string) => {
    setActiveFixes((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  async function syncCityTelemetry(targetCity: string) {
    if (!targetCity.trim()) return;
    setFetchingAqi(true);
    setAqiError('');
    try {
      const res = await fetch(`/api/aqi?city=${encodeURIComponent(targetCity.trim())}`);
      const text = await res.text();
      let data: LiveAqiData & { error?: string };
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error('Could not read weather sensor response. Please try again.');
      }
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

    let currentLive = liveAqi;
    if (!currentLive || !currentLive.resolvedName.toLowerCase().includes(cityInput.trim().toLowerCase())) {
      try {
        const res = await fetch(`/api/aqi?city=${encodeURIComponent(cityInput.trim())}`);
        if (res.ok) {
          currentLive = await res.json();
          setLiveAqi(currentLive);
        }
      } catch {
        // Proceed even if sensor lookup fails
      }
    }

    const profilePayload: UserProfile = {
      city: cityInput.trim(),
      aqiLevel: currentLive?.category ?? 'Very Poor / Severe (AQI 201–300)',
      householdMembers: selectedFamily.length > 0 ? selectedFamily.join(', ') : '2 adults',
      homeFeatures: [selectedHome.join(', '), extraNotes.trim()].filter(Boolean).join(' — ') || 'Standard flat',
      commuteMode: selectedTravel.length > 0 ? selectedTravel.join(', ') : 'Public transit',
      liveMetrics: currentLive,
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
      const msg = err instanceof Error ? err.message : 'Unable to answer right now.';
      setQaHistory((prev) => [...prev, { q: currentQ, a: msg }]);
    } finally {
      setAskingFollowUp(false);
    }
  }

  const outdoorPm25 = liveAqi?.pm25 ?? 145;
  const usAqi = liveAqi?.usAqi ?? 198;

  const getStatusBadge = (aqi: number) => {
    if (aqi > 300) return { label: 'Hazardous Air', bg: 'bg-[#DC2626] text-white' };
    if (aqi > 200) return { label: 'Very Poor Air', bg: 'bg-[#EA580C] text-white' };
    if (aqi > 150) return { label: 'Poor Air', bg: 'bg-[#D97706] text-white' };
    if (aqi > 100) return { label: 'Moderate Smog', bg: 'bg-[#CA8A04] text-white' };
    return { label: 'Clean Air', bg: 'bg-[#0284C7] text-white' };
  };

  const statusBadge = getStatusBadge(usAqi);

  const triggerSpike = INDOOR_TRIGGERS.filter((t) => activeTriggers.includes(t.id)).reduce(
    (sum, t) => sum + t.spike,
    0
  );
  const rawIndoorPeak = Math.round(outdoorPm25 * 0.65 + triggerSpike);
  const mitigationMultiplier = INDOOR_FIXES.filter((f) => activeFixes.includes(f.id)).reduce(
    (mult, f) => mult * (1 - f.reduction),
    1
  );
  const mitigatedIndoorPm25 = Math.max(14, Math.round(rawIndoorPeak * mitigationMultiplier));
  const clearanceMinutes = Math.max(15, Math.round((rawIndoorPeak / 3.5) * mitigationMultiplier));

  const unprotectedCigs = (outdoorPm25 / 22).toFixed(1);
  const protectedCigs = (mitigatedIndoorPm25 / 22).toFixed(1);

  const activityVerdicts = [
    {
      label: 'Morning Walk',
      icon: Footprints,
      verdict: usAqi > 150 ? 'Skip Outdoor' : 'Safe Before 8 AM',
      tone:
        usAqi > 150
          ? 'bg-[#FEE2E2] text-[#991B1B] border-[#FCA5A5]'
          : 'bg-[#E0F2FE] text-[#075985] border-[#7DD3FC]',
    },
    {
      label: 'School / Office',
      icon: GraduationCap,
      verdict: usAqi > 150 ? 'Wear N95 Mask' : 'Normal Commute',
      tone:
        usAqi > 150
          ? 'bg-[#FEF3C7] text-[#92400E] border-[#FCD34D]'
          : 'bg-[#E0F2FE] text-[#075985] border-[#7DD3FC]',
    },
    {
      label: 'Open Windows',
      icon: DoorOpen,
      verdict: liveAqi?.safestWindowLabel ? `Only ${liveAqi.safestWindowLabel.split(' ')[0]}` : '1 PM – 3 PM Only',
      tone: 'bg-[#E0F2FE] text-[#075985] border-[#7DD3FC]',
    },
    {
      label: 'Drying Laundry',
      icon: Shirt,
      verdict: usAqi > 180 ? 'Dry Indoors' : 'Afternoon Balcony',
      tone:
        usAqi > 180
          ? 'bg-[#FEE2E2] text-[#991B1B] border-[#FCA5A5]'
          : 'bg-[#E0F2FE] text-[#075985] border-[#7DD3FC]',
    },
  ];

  function handleCopyWhatsApp() {
    const activeCity = (liveAqi?.resolvedName ?? cityInput).toUpperCase();
    const safeWindow =
      plan?.quantifiedImpact?.safeVentilationWindow ??
      liveAqi?.safestWindowLabel ??
      '1:00 PM – 3:30 PM';
    const topRules = plan
      ? [
          ...(plan.indoorAirHacks || []).slice(0, 2).map((h) => `• ${h.title}`),
          ...(plan.lowEmissionRoutines || []).slice(0, 1).map((r) => `• ${r.title}`),
        ].join('\n')
      : '• Keep windows shut during 6–9 AM smog peak\n• Run kitchen exhaust during cooking/tadka\n• Wet-mop floors instead of dry sweeping';

    const msg = [
      `*VAYUGUARD // ${activeCity} FAMILY AIR BRIEFING*`,
      `Live Air: US AQI ${usAqi} (${outdoorPm25} µg/m³) — equals ~${unprotectedCigs} cigarettes/day unprotected`,
      `Safest Window to Air Out Home: ${safeWindow}`,
      '',
      '*Today’s Simple Rules:*',
      topRules,
    ].join('\n');

    navigator.clipboard.writeText(msg);
    setWaCopied(true);
    setTimeout(() => setWaCopied(false), 2500);
  }

  function handleDownloadFamilyCard() {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const activeCity = (cityInput.trim() || 'KOLKATA').toUpperCase();
    const safeWindow =
      plan?.quantifiedImpact?.safeVentilationWindow ??
      liveAqi?.safestWindowLabel ??
      '1:00 PM – 3:30 PM';

    // Solid Midnight Cobalt Header
    ctx.fillStyle = '#0F1E36';
    ctx.fillRect(0, 0, 1080, 390);
    // Solid Warm Ivory Body
    ctx.fillStyle = '#F7F5F0';
    ctx.fillRect(0, 390, 1080, 690);

    // Vivid Amber Accent Bar
    ctx.fillStyle = '#F59E0B';
    ctx.fillRect(72, 64, 18, 56);

    ctx.fillStyle = '#F7F5F0';
    ctx.font = 'bold 40px sans-serif';
    ctx.fillText('VAYUGUARD // FAMILY AIR GUIDE', 110, 106);

    ctx.fillStyle = '#7DD3FC';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText(`CITY: ${activeCity}  •  US AQI ${usAqi}`, 72, 185);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 58px sans-serif';
    ctx.fillText(`Equals ~${unprotectedCigs} cigarettes/day`, 72, 265);

    ctx.fillStyle = '#FBBF24';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText(`With Home Protection: drops to ~${protectedCigs} cigarettes/day`, 72, 330);

    ctx.fillStyle = '#0F1E36';
    ctx.fillRect(72, 440, 936, 130);
    ctx.fillStyle = '#FBBF24';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('BEST TIME TO OPEN WINDOWS TODAY', 104, 490);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 38px sans-serif';
    ctx.fillText(safeWindow, 104, 542);

    ctx.fillStyle = '#0F1E36';
    ctx.font = 'bold 30px sans-serif';
    ctx.fillText('4 SIMPLE RULES FOR OUR HOME:', 72, 645);

    const rules = plan
      ? [
          ...(plan.indoorAirHacks || []).slice(0, 2).map((h, i) => `${i + 1}. ${h.title}`),
          ...(plan.lowEmissionRoutines || []).slice(0, 2).map((r, i) => `${i + 3}. ${r.title}`),
        ]
      : [
          '1. Keep balcony doors & windows closed during 6–9 AM peak',
          '2. Always switch on kitchen exhaust during tadka or frying',
          '3. Wet-mop floors instead of dry broom sweeping',
          '4. Wear a snug N95 mask on two-wheeler or auto rides',
        ];

    ctx.font = '27px sans-serif';
    ctx.fillStyle = '#1E293B';
    rules.forEach((rule, i) => {
      ctx.fillText(rule.slice(0, 56), 72, 710 + i * 64);
    });

    const link = document.createElement('a');
    link.download = `VayuGuard-${activeCity}-Guide.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  function handleCopyPlan() {
    if (!plan) return;
    const lines = [
      `VAYUGUARD // HOUSEHOLD AIR PLAN (${cityInput.toUpperCase()})`,
      plan.riskSummary,
      '',
      'INDOOR AIR FIXES:',
      ...(plan.indoorAirHacks || []).map((i) => `- ${i.title}: ${i.description}`),
      '',
      'DAILY ROUTINES:',
      ...(plan.lowEmissionRoutines || []).map((i) => `- ${i.title}: ${i.description}`),
      '',
      'ECO-FRIENDLY HABITS:',
      ...(plan.sustainableAlternatives || []).map((i) => `- ${i.title}: ${i.description}`),
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

  const visibleGroups = [
    ...(categoryFilter === 'all' || categoryFilter === 'indoor'
      ? [
          {
            id: 'indoor',
            title: 'Keep Indoor Air Clean',
            badge: 'bg-[#E0F2FE] text-[#075985]',
            border: 'border-l-[#0284C7]',
            icon: Home,
            items: indoorHacks,
          },
        ]
      : []),
    ...(categoryFilter === 'all' || categoryFilter === 'routines'
      ? [
          {
            id: 'routine',
            title: 'Safer Daily Habits',
            badge: 'bg-[#FEF3C7] text-[#92400E]',
            border: 'border-l-[#D97706]',
            icon: ShieldCheck,
            items: routines,
          },
        ]
      : []),
    ...(categoryFilter === 'all' || categoryFilter === 'sustainable'
      ? [
          {
            id: 'sustainable',
            title: 'Eco-Friendly Swaps',
            badge: 'bg-[#CCFBF1] text-[#115E59]',
            border: 'border-l-[#0D9488]',
            icon: Leaf,
            items: alternatives,
          },
        ]
      : []),
  ];

  const hourlyData = liveAqi?.hourlyForecast ?? [];
  const maxHourlyPm25 = Math.max(...hourlyData.map((d) => d.pm25), 100);

  return (
    <div className="min-h-screen bg-[#F7F5F0] text-[#0F1E36] selection:bg-[#F59E0B] selection:text-[#0F1E36]">
      {/* Midnight Cobalt Top Navigation */}
      <header className="bg-[#0F1E36] text-[#F7F5F0] border-b border-[#1E3354] sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#F59E0B] text-[#0F1E36] flex items-center justify-center">
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
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-[#192D4E] hover:bg-[#233E6B] text-[#F7F5F0] border border-[#2C4B7E] transition cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 text-[#FBBF24]" />
              <span className="hidden sm:inline">{waCopied ? 'Copied for WhatsApp!' : 'Share on WhatsApp'}</span>
              <span className="sm:hidden">{waCopied ? 'Copied!' : 'Share'}</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadFamilyCard}
              className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-lg bg-[#F59E0B] hover:bg-[#D97706] text-[#0F1E36] transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Save Family Poster</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* STEP 1: INSTANT LIVE AIR CHECKER & DAILY VERDICTS */}
        <section className="bg-[#FDFCFA] border border-[#D5D8DF] rounded-xl p-5 sm:p-7 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E6E8EE] pb-5">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F1E36]">
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

            {/* Quick City Switcher + Search */}
            <div className="flex flex-col sm:items-end gap-2">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  syncCityTelemetry(cityInput);
                }}
                className="flex gap-2 w-full sm:w-auto"
              >
                <div className="relative flex-1 sm:w-56">
                  <MapPin className="w-4 h-4 text-[#0284C7] absolute left-3 top-3" />
                  <input
                    type="text"
                    value={cityInput}
                    onChange={(e) => setCityInput(e.target.value)}
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
                  <Search className="w-4 h-4" />
                  {fetchingAqi ? 'Checking...' : 'Check'}
                </button>
              </form>

              <div className="flex flex-wrap gap-1.5">
                {CITIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      setCityInput(c);
                      syncCityTelemetry(c);
                    }}
                    className={`text-xs px-2.5 py-1 rounded-md border transition cursor-pointer ${
                      cityInput.toLowerCase() === c.toLowerCase()
                        ? 'bg-[#0F1E36] text-white border-[#0F1E36] font-semibold'
                        : 'bg-[#F7F5F0] text-[#334155] border-[#D5D8DF] hover:border-[#0F1E36]'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {aqiError && (
            <p className="text-xs text-[#DC2626] font-medium bg-[#FEE2E2] px-3 py-2 rounded-lg">
              {aqiError}
            </p>
          )}

          {/* 4 Simple "Should I Do This Today?" Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {activityVerdicts.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="bg-[#F7F5F0] border border-[#DCE0E8] rounded-lg p-3.5 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#475569]">
                    <Icon className="w-4 h-4 text-[#0F1E36]" />
                    <span>{item.label}</span>
                  </div>
                  <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-md border ${item.tone}`}>
                    {item.verdict}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Easy-to-Read 24-Hour Air Chart */}
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

              <div className="h-24 flex items-end gap-1.5 pt-2">
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

        {/* STEP 2: 3-CLICK HOUSEHOLD CUSTOMIZER */}
        <section className="bg-[#0F1E36] text-[#F7F5F0] rounded-xl p-6 sm:p-8 space-y-6">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#FBBF24]">
              Personalize Your Home Defense
            </span>
            <h2 className="text-xl sm:text-2xl font-bold">
              Tap what applies to your family (No typing needed)
            </h2>
          </div>

          <form onSubmit={handleGeneratePlan} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Group 1: Family */}
              <div className="space-y-2.5">
                <label className="flex items-center gap-2 text-sm font-semibold text-[#F7F5F0]">
                  <Users className="w-4 h-4 text-[#FBBF24]" />
                  1. Who lives with you?
                </label>
                <div className="flex flex-wrap gap-2">
                  {FAMILY_OPTIONS.map((opt) => {
                    const active = selectedFamily.includes(opt);
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => toggleSelection(selectedFamily, setSelectedFamily, opt)}
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

              {/* Group 2: Home */}
              <div className="space-y-2.5">
                <label className="flex items-center gap-2 text-sm font-semibold text-[#F7F5F0]">
                  <Home className="w-4 h-4 text-[#FBBF24]" />
                  2. Your home setup
                </label>
                <div className="flex flex-wrap gap-2">
                  {HOME_OPTIONS.map((opt) => {
                    const active = selectedHome.includes(opt);
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => toggleSelection(selectedHome, setSelectedHome, opt)}
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

              {/* Group 3: Travel */}
              <div className="space-y-2.5">
                <label className="flex items-center gap-2 text-sm font-semibold text-[#F7F5F0]">
                  <Car className="w-4 h-4 text-[#FBBF24]" />
                  3. Daily travel mode
                </label>
                <div className="flex flex-wrap gap-2">
                  {TRAVEL_OPTIONS.map((opt) => {
                    const active = selectedTravel.includes(opt);
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => toggleSelection(selectedTravel, setSelectedTravel, opt)}
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
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2 border-t border-[#1E3354]">
              <input
                type="text"
                value={extraNotes}
                onChange={(e) => setExtraNotes(e.target.value)}
                placeholder="Optional: add anything specific (e.g., ground floor near main road, newborn baby)..."
                className="flex-1 rounded-lg bg-[#192D4E] border border-[#2C4B7E] px-4 py-3 text-sm text-[#F7F5F0] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#F59E0B]"
              />
              <button
                type="submit"
                disabled={loading || !cityInput.trim()}
                className="inline-flex items-center justify-center gap-2 bg-[#F59E0B] hover:bg-[#D97706] disabled:opacity-50 text-[#0F1E36] font-bold text-sm px-7 py-3.5 rounded-lg transition cursor-pointer shrink-0"
              >
                <Sparkles className="w-4 h-4" />
                <span>{loading ? 'Creating Your Plan...' : "Build My Family's Air Plan"}</span>
              </button>
            </div>
          </form>
        </section>

        {error && (
          <div
            role="alert"
            className="bg-[#FEE2E2] border border-[#FCA5A5] text-[#991B1B] p-4 rounded-xl flex items-center gap-3 text-sm font-medium"
          >
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 3: CLEAN TABBED WORKSPACE */}
        <section className="space-y-5">
          <div className="flex flex-wrap gap-2 border-b border-[#D5D8DF] pb-3">
            <button
              type="button"
              onClick={() => setWorkspaceTab('plan')}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition cursor-pointer ${
                workspaceTab === 'plan'
                  ? 'bg-[#0F1E36] text-white'
                  : 'bg-[#FDFCFA] text-[#334155] border border-[#D5D8DF] hover:border-[#0F1E36]'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-[#F59E0B]" />
              <span>My Family&apos;s Action Plan</span>
            </button>

            <button
              type="button"
              onClick={() => setWorkspaceTab('simulator')}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition cursor-pointer ${
                workspaceTab === 'simulator'
                  ? 'bg-[#0F1E36] text-white'
                  : 'bg-[#FDFCFA] text-[#334155] border border-[#D5D8DF] hover:border-[#0F1E36]'
              }`}
            >
              <Flame className="w-4 h-4 text-[#F59E0B]" />
              <span>Indoor Smoke Simulator (Tadka / Dhoop)</span>
            </button>

            <button
              type="button"
              onClick={() => setWorkspaceTab('ask')}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition cursor-pointer ${
                workspaceTab === 'ask'
                  ? 'bg-[#0F1E36] text-white'
                  : 'bg-[#FDFCFA] text-[#334155] border border-[#D5D8DF] hover:border-[#0F1E36]'
              }`}
            >
              <MessageSquare className="w-4 h-4 text-[#38BDF8]" />
              <span>Ask a Question</span>
            </button>
          </div>

          {/* TAB 1: FAMILY ACTION PLAN */}
          {workspaceTab === 'plan' && (
            <div className="space-y-6">
              {loading && (
                <div className="bg-[#FDFCFA] border border-[#D5D8DF] rounded-xl p-8 space-y-4 animate-pulse">
                  <div className="h-5 w-56 bg-[#E2E8F0] rounded" />
                  <div className="h-16 w-full bg-[#F1F5F9] rounded" />
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="h-24 bg-[#F1F5F9] rounded" />
                    <div className="h-24 bg-[#F1F5F9] rounded" />
                    <div className="h-24 bg-[#F1F5F9] rounded" />
                  </div>
                </div>
              )}

              {!plan && !loading && (
                <div className="bg-[#FDFCFA] border border-[#D5D8DF] rounded-xl p-8 text-center space-y-3">
                  <p className="text-lg font-bold text-[#0F1E36]">
                    Ready to create your personalized plan for {cityInput}
                  </p>
                  <p className="text-sm text-[#475569] max-w-lg mx-auto">
                    Select who lives in your home above and click <strong>Build My Family&apos;s Air Plan</strong>—or switch tabs to test how cooking and incense affect your room air.
                  </p>
                </div>
              )}

              {plan && !loading && (
                <>
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
                          <CloudFog className="w-4 h-4" />
                          <span>Cleaner Indoor Air</span>
                        </div>
                        <p className="text-lg font-bold text-[#0F1E36] mt-1">
                          {plan.quantifiedImpact?.estimatedIndoorPm25Reduction ?? '40%–60% less PM2.5'}
                        </p>
                      </div>

                      <div className="bg-[#F0FDFA] border border-[#99F6E4] p-4 rounded-lg">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-[#115E59]">
                          <TrendingDown className="w-4 h-4" />
                          <span>Carbon Saved</span>
                        </div>
                        <p className="text-lg font-bold text-[#0F1E36] mt-1">
                          {plan.quantifiedImpact?.weeklyCo2SavedKg ?? '8–12 kg CO₂/week'}
                        </p>
                      </div>

                      <div className="bg-[#FFFBEB] border border-[#FDE68A] p-4 rounded-lg">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-[#92400E]">
                          <Clock className="w-4 h-4" />
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
                      <div className="w-full h-2.5 bg-[#E2E8F0] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#0284C7] transition-all duration-300"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Category Filter Pills */}
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'all', label: `All Steps (${totalActions})` },
                      { id: 'indoor', label: `Indoor Air (${indoorHacks.length})` },
                      { id: 'routines', label: `Daily Habits (${routines.length})` },
                      { id: 'sustainable', label: `Eco Swaps (${alternatives.length})` },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
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

                  {/* Clean Action Cards */}
                  <div className="space-y-6">
                    {visibleGroups.map((group) => {
                      const Icon = group.icon;
                      return (
                        <div key={group.id} className="space-y-3">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold ${group.badge}`}>
                            <Icon className="w-3.5 h-3.5" />
                            {group.title}
                          </span>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                            {group.items.map((item, idx) => {
                              const key = `${group.id}-${idx}`;
                              const done = !!completedTasks[key];
                              return (
                                <div
                                  key={key}
                                  onClick={() => toggleTask(key)}
                                  className={`p-5 rounded-xl border border-l-4 ${group.border} transition cursor-pointer flex items-start gap-3.5 ${
                                    done
                                      ? 'bg-[#F0F9FF] border-[#7DD3FC]'
                                      : 'bg-[#FDFCFA] border-[#D5D8DF] hover:bg-white'
                                  }`}
                                >
                                  <div className="mt-0.5 shrink-0">
                                    {done ? (
                                      <CheckCircle2 className="w-5 h-5 text-[#0284C7]" />
                                    ) : (
                                      <Circle className="w-5 h-5 text-[#94A3B8]" />
                                    )}
                                  </div>

                                  <div className="space-y-2">
                                    <h3
                                      className={`font-bold text-base ${
                                        done ? 'line-through text-[#64748B]' : 'text-[#0F1E36]'
                                      }`}
                                    >
                                      {item.title}
                                    </h3>
                                    <p className="text-sm text-[#334155] leading-relaxed">
                                      {item.description}
                                    </p>
                                    <p className="text-xs font-medium text-[#075985] bg-[#F1F5F9] px-3 py-1.5 rounded-md">
                                      Why it helps: {item.impactExplanation}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 2: INTERACTIVE INDOOR SMOKE SIMULATOR */}
          {workspaceTab === 'simulator' && (
            <div className="bg-[#FDFCFA] border border-[#D5D8DF] rounded-xl p-6 sm:p-8 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E6E8EE] pb-4">
                <div>
                  <h3 className="text-xl font-bold text-[#0F1E36]">
                    What happens inside your room during cooking or incense?
                  </h3>
                  <p className="text-sm text-[#475569]">
                    Tap everyday activities below to see how fast indoor smoke builds up and how long it takes to clear.
                  </p>
                </div>
                <div className="bg-[#0F1E36] text-[#F7F5F0] px-4 py-2.5 rounded-lg text-right">
                  <span className="text-[11px] text-[#FBBF24] block font-semibold">Room Clears In</span>
                  <span className="text-xl font-bold">{clearanceMinutes} mins</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <p className="text-sm font-bold text-[#991B1B]">Step 1: Choose what&apos;s happening indoors</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {INDOOR_TRIGGERS.map((t) => {
                      const active = activeTriggers.includes(t.id);
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => toggleTrigger(t.id)}
                          className={`p-3.5 rounded-lg border text-left transition cursor-pointer ${
                            active
                              ? 'bg-[#FEE2E2] border-[#DC2626] text-[#7F1D1D]'
                              : 'bg-[#F7F5F0] border-[#D5D8DF] text-[#0F1E36] hover:border-[#0F1E36]'
                          }`}
                        >
                          <div className="font-bold text-sm">{t.label}</div>
                          <div className="text-xs opacity-80 mt-0.5">{t.desc}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-bold text-[#075985]">Step 2: Turn on your home protections</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {INDOOR_FIXES.map((f) => {
                      const active = activeFixes.includes(f.id);
                      return (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => toggleFix(f.id)}
                          className={`p-3.5 rounded-lg border text-left transition cursor-pointer ${
                            active
                              ? 'bg-[#E0F2FE] border-[#0284C7] text-[#0C4A6E]'
                              : 'bg-[#F7F5F0] border-[#D5D8DF] text-[#0F1E36] hover:border-[#0F1E36]'
                          }`}
                        >
                          <div className="font-bold text-sm">{f.label}</div>
                          <div className="text-xs opacity-80 mt-0.5">{f.desc}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="bg-[#FEE2E2] border border-[#FCA5A5] rounded-lg p-4">
                  <span className="text-xs font-bold text-[#991B1B]">Without Protection</span>
                  <p className="text-2xl font-bold text-[#7F1D1D] mt-1">{rawIndoorPeak} µg/m³</p>
                  <p className="text-xs text-[#991B1B] mt-0.5">Trapped smoke inside closed rooms</p>
                </div>
                <div className="bg-[#E0F2FE] border border-[#7DD3FC] rounded-lg p-4">
                  <span className="text-xs font-bold text-[#075985]">With Your Selected Controls</span>
                  <p className="text-2xl font-bold text-[#0C4A6E] mt-1">
                    {mitigatedIndoorPm25} µg/m³ (~{protectedCigs} cigs/day)
                  </p>
                  <p className="text-xs text-[#075985] mt-0.5">Safe to remove masks in ~{clearanceMinutes} minutes</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ASK A QUESTION */}
          {workspaceTab === 'ask' && (
            <div className="bg-[#FDFCFA] border border-[#D5D8DF] rounded-xl p-6 sm:p-8 space-y-5">
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
                <div className="space-y-3">
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
                  placeholder="Type your question (e.g., Which N95 mask fits kids best?)..."
                  className="flex-1 rounded-lg bg-[#F7F5F0] border border-[#CBD0DA] px-4 py-3 text-sm text-[#0F1E36] focus:outline-none focus:ring-2 focus:ring-[#0284C7] focus:bg-white"
                />
                <button
                  type="submit"
                  disabled={askingFollowUp || !question.trim()}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#0F1E36] hover:bg-[#1E3A66] disabled:opacity-45 text-white font-bold text-sm transition cursor-pointer"
                >
                  <Send className="w-4 h-4" />
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