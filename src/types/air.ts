export interface UserProfile {
  city: string;
  aqiLevel: string;
  householdMembers: string;
  homeFeatures: string;
  commuteMode: string;
  liveMetrics?: LiveAqiData | null;
}

export interface HourlyForecastPoint {
  time: string;
  hourLabel: string;
  pm25: number;
  usAqi: number;
}

export interface LiveAqiData {
  resolvedName: string;
  usAqi: number;
  pm25: number;
  pm10: number;
  category: string;
  hourlyForecast: HourlyForecastPoint[];
  safestWindowLabel: string;
  peakWindowLabel: string;
}

export interface ActionItem {
  title: string;
  description: string;
  effortLevel: 'Low' | 'Medium' | 'High';
  impactExplanation: string;
}

export interface AirQualityPlan {
  riskSummary: string;
  quantifiedImpact: {
    estimatedIndoorPm25Reduction: string;
    weeklyCo2SavedKg: string;
    safeVentilationWindow: string;
  };
  indoorAirHacks: ActionItem[];
  lowEmissionRoutines: ActionItem[];
  sustainableAlternatives: ActionItem[];
}