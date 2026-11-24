# VayuGuard — Urban Air Telemetry & Household Smog Defense

**VayuGuard** is a real-time air quality telemetry and household smog defense web application built for Indian urban homes. Instead of displaying a static AQI number, it translates live particulate readings into plain-English daily decisions, passive cigarette equivalents, 24-hour safe ventilation windows, an interactive indoor smoke simulator, and AI-synthesized family action protocols.

- **Live Production App:** [air-guard-ai-arijit25.vercel.app](https://air-guard-ai-arijit25.vercel.app)
- **GitHub Repository:** [github.com/Arijit-Mondal04/air-guard-ai](https://github.com/Arijit-Mondal04/air-guard-ai)

---

## Key Features

1. **Zero-Friction Live Telemetry & Daily Verdicts:** Automatically fetches live `US AQI`, `PM2.5`, and `PM10` readings via Open-Meteo upon load, converting outdoor `PM2.5` into passive cigarette equivalents ($\approx 22\ \mu\text{g/m}^3 \approx 1\text{ passive cigarette/day}$) and generating instant **Go / Caution / Avoid** verdicts for *Morning Walks*, *School/Office Commutes*, *Opening Windows*, and *Drying Laundry*.
2. **24-Hour Smog Dispersion Forecast:** Interactive hourly bar chart highlighting morning temperature-inversion peaks versus the safest afternoon window to ventilate indoor rooms.
3. **3-Click Household Customizer & AI Action Plan:** Users select household members (*Elderly Parent*, *School Child*, *Asthma Sensitivity*), home setup (*No Air Purifier*, *1 HEPA Purifier*, *Gas Stove Cooking*), and commute modes to generate a structured, checkable defense plan powered by Google Gemini.
4. **Interactive Indoor Smoke Simulator (*Tadka / Dhoop / Coil*):** Models real-world Indian indoor micro-events (gas stove *tadka*/frying, *agarbatti/dhoop*, mosquito coils, morning drafts) against active countermeasures (kitchen exhaust, HEPA/box fan, wet-towel door seals) to calculate peak indoor `PM2.5` and room clearance time in minutes.
5. **Shareable Family & RWA Briefing Poster:** One-click WhatsApp text brief copy and HTML5 `<canvas>` PNG poster generator for family and housing society groups.
6. **Contextual Household Q&A:** Follow-up assistant grounded in the user's live city telemetry, home profile, and active plan.

---

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack) & React 19
- **Language:** TypeScript
- **Styling & Typography:** Tailwind CSS, Space Grotesk & JetBrains Mono
- **Generative AI:** Google GenAI SDK (`@google/genai`) with multi-model resilience fallback (`gemini-3.5-flash-lite`, `gemini-3.8-flash`, `gemini-2.5-flash`, `gemini-2.5-flash-lite`)
- **Live Telemetry:** Open-Meteo Air Quality & Geocoding APIs (zero-key real-time + 24h hourly forecast)
- **Testing & Deployment:** Vitest & Vercel

---

## Architecture & Prompt Flow

```text
[Browser UI (Next.js 16 + Tailwind CSS)]
       │
       ├──► GET /api/aqi?city=Kolkata
       │      └─► Open-Meteo Geocoding + Air Quality API (Current + 24h Hourly PM2.5)
       │
       ├──► POST /api/generate  (Live Metrics + 3-Click Household Profile)
       │      └─► @google/genai (Strict JSON Schema + Multi-Model Fallback Chain)
       │
       └──► POST /api/chat      (Follow-Up Question + Active Plan Context)
              └─► @google/genai (Grounded Concise Household Guidance)
```

### Prompt Evolution
- **V1 (Open-Ended Generation):** Initial prompts produced unstructured paragraphs with generic tips ("use an air purifier") that caused inconsistent UI rendering.
- **V2 (Telemetry-Grounded JSON Schema):** Enforced strict `responseMimeType: "application/json"` output (`riskSummary`, `quantifiedImpact`, categorized `indoorAirHacks`, `lowEmissionRoutines`, and `sustainableAlternatives` with effort levels) and injected live `PM2.5` and safe ventilation window telemetry directly into the prompt context.
- **V3 (Production Resilience & Parameter Normalization):** Built `generateWithFallback` in `src/lib/gemini.ts` to cycle seamlessly across active Gemini models whenever transient `503` or `429` rate limits occur.

---

## GenAI vs. Human Engineering Split

- **Handled by GenAI (`@google/genai`):** Synthesizing tailored household protection steps from multi-variable family/home/commute combinations, quantifying expected indoor `PM2.5` and weekly $\text{CO}_2$ reductions, and answering open-ended follow-up questions.
- **Designed & Engineered by Human:**
  - Progressive 3-step UX architecture and **Midnight Cobalt (`#0F1E36`), Warm Ivory (`#F7F5F0`) & Vivid Amber (`#F59E0B`)** solid-surface design system.
  - Real-time Open-Meteo telemetry integration, safe ventilation window detection, and Berkeley Earth cigarette-equivalent dose calculations.
  - Client-side indoor smoke spike & clearance physics simulator and HTML5 Canvas Family Briefing PNG exporter.
  - Server-side API route isolation (`GEMINI_API_KEY` never exposed to the browser) and Vitest unit test suite.

---

## Project Structure

```text
air-guard-ai/
├── public/
│   └── icon.svg                  # Custom Midnight Cobalt & Amber VayuGuard favicon
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── aqi/route.ts      # Live city geocoding + 24h hourly PM2.5 endpoint
│   │   │   ├── chat/route.ts     # Grounded household Q&A endpoint
│   │   │   └── generate/route.ts # Structured JSON protocol generator
│   │   ├── globals.css           # Tailwind theme & print styles
│   │   ├── icon.tsx              # Dynamic PNG favicon generator
│   │   ├── layout.tsx            # Fonts & metadata configuration
│   │   └── page.tsx              # 3-step telemetry dashboard, simulator & workspace
│   ├── lib/
│   │   ├── gemini.ts             # @google/genai client & multi-model fallback wrapper
│   │   ├── validation.ts         # Input sanitization & US AQI severity classifier
│   │   └── validation.test.ts    # Vitest unit tests
│   └── types/
│       └── air.ts                # TypeScript interfaces for telemetry & AI plans
└── README.md
```

---

## Local Setup & Testing

1. **Clone and install dependencies:**
   ```bash
   git clone [https://github.com/Arijit-Mondal04/air-guard-ai.git](https://github.com/Arijit-Mondal04/air-guard-ai.git)
   cd air-guard-ai
   npm install
   ```

2. **Configure environment variables:**
   Create a `.env.local` file in the root directory:
   ```env
   GEMINI_API_KEY=your_google_gemini_api_key
   ```

3. **Run unit tests, production build, and local server:**
   ```bash
   npm test
   npm run build
   npm run dev
   ```