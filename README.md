# VayuGuard AI — Urban Air Telemetry & Household Smog Defense Workbench

[![Next.js](https://img.shields.io/badge/Next.js-16_App_Router-0B211A?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-0B211A?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Google GenAI](https://img.shields.io/badge/Google_GenAI-Gemini_3.5_Flash_Lite-22C58B?style=flat-square&logo=google-gemini&logoColor=071A14)](https://ai.google.dev/)
[![Vitest](https://img.shields.io/badge/Tested_with-Vitest-0B211A?style=flat-square&logo=vitest&logoColor=22C58B)](https://vitest.dev/)

**VayuGuard AI** is a real-time urban air quality telemetry and household smog defense workbench built for **PromptWars Challenge 06**. Instead of offering generic pollution tips, it grounds household recommendations in live $\text{PM}_{2.5}$ / $\text{PM}_{10}$ atmospheric sensor readings, home architecture, and occupant vulnerability profiles—generating actionable indoor filtration steps, low-emission routines, quantified impact metrics, and an interactive follow-up advisory terminal.

---

## Key Capabilities

- **Live Atmospheric Telemetry Sync (`/api/aqi`)**
  - Integrates the **Open-Meteo Geocoding & Air Quality API** to fetch live city/locality US AQI, $\text{PM}_{2.5}$ ($\mu\text{g/m}^3$), and $\text{PM}_{10}$ ($\mu\text{g/m}^3$) readings and automatically classify smog severity across 6 tiers.
- **Structured Household Action Protocols (`/api/generate`)**
  - Uses `@google/genai` **Structured Outputs** (`responseSchema` + `responseMimeType: 'application/json'`) to compile deterministic, type-safe action plans divided into:
    1. **Indoor Filtration & Sealing** (zero-cost draft containment, wet-mopping, purifier placement)
    2. **Low-Emission Daily Routines** (safe ventilation timing, commute & cooking adjustments)
    3. **Sustainable Community Alternatives** (shared mobility, neighborhood green buffers)
- **Quantified Health & Carbon Telemetry**
  - Estimates indoor $\text{PM}_{2.5}$ reduction percentage, weekly $\text{CO}_2$ avoided ($\text{kg/week}$), and the safest daily ventilation window tailored to the user's city and home setup.
- **Interactive Readiness Ledger & Advisory Console (`/api/chat`)**
  - Track adopted household habits with live readiness progress scoring, export/print checklists, and query a context-aware Q&A terminal grounded in your active profile and protocol.
- **Multi-Model GenAI Resilience**
  - Automatic server-side fallback chain (`gemini-3.5-flash-lite` → `gemini-2.5-flash` → `gemini-2.0-flash`) handles transient `503` high-demand or `429` rate-limit spikes seamlessly.

---

## Architecture & Tech Stack

| Layer | Technology | Role |
| :--- | :--- | :--- |
| **Framework** | Next.js 16 (App Router), React, TypeScript | Split-screen workbench UI & isolated server-side Route Handlers |
| **Styling & Typography** | Tailwind CSS, Space Grotesk, JetBrains Mono, Lucide Icons | High-contrast Deep Forest (`#0B211A`) & Warm Bone (`#F5F1E8`) editorial UI |
| **GenAI Engine** | Google GenAI SDK (`@google/genai`) | Structured JSON protocol synthesis & grounded household Q&A |
| **Environmental Data** | Open-Meteo Geocoding & Air Quality APIs | Real-time US AQI, $\text{PM}_{2.5}$, and $\text{PM}_{10}$ station telemetry |
| **Testing** | Vitest | Unit tests for AQI tier classification & prompt input sanitization |

### Project Structure

```text
air-guard-ai/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── aqi/route.ts        # Live Open-Meteo geocoding & PM2.5/PM10 sensor sync
│   │   │   ├── chat/route.ts       # Context-aware household Q&A endpoint
│   │   │   └── generate/route.ts   # Structured Gemini action protocol generator
│   │   ├── globals.css             # Tailwind v4 theme tokens & print styles
│   │   ├── layout.tsx              # Space Grotesk & JetBrains Mono font configuration
│   │   └── page.tsx                # 12-column split-screen workbench UI
│   ├── lib/
│   │   ├── gemini.ts               # Server-side GoogleGenAI client & model fallback chain
│   │   ├── validation.ts           # US AQI tier classifier & input sanitization helpers
│   │   └── validation.test.ts      # Vitest unit test suite
│   └── types/
│       └── air.ts                  # Shared TypeScript interfaces for telemetry & protocols
├── .env.local                      # Local environment variables (gitignored)
└── package.json