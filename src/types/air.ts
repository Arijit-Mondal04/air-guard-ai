export interface LiveAqiData {
  resolvedName: string;
  country: string;
  usAqi: number;
  pm25: number;
  pm10: number;
  category: string;
  fetchedAt: string;
}

export interface UserProfile {
  city: string;
  aqiLevel: string;
  householdMembers: string;
  homeFeatures: string;
  commuteMode: string;
  liveMetrics?: LiveAqiData | null;
}

export interface ActionItem {
  title: string;
  description: string;
  impactExplanation: string;
  effortLevel: 'Low' | 'Medium' | 'High';
}

export interface QuantifiedImpact {
  estimatedIndoorPm25Reduction: string;
  weeklyCo2SavedKg: string;
  safeVentilationWindow: string;
}

export interface AirQualityPlan {
  riskSummary: string;
  quantifiedImpact: QuantifiedImpact;
  lowEmissionRoutines: ActionItem[];
  indoorAirHacks: ActionItem[];
  sustainableAlternatives: ActionItem[];
}