import { IndicatorKey, QueueModelType, QueueParameters } from './QueueParameters';
export type { IndicatorKey };

export interface EquationDetail {
  indicator: IndicatorKey;
  symbol: string;
  name: string;
  generalFormulaLatex: string;      // Structured representation for clean rendering
  substitutedFormulaText: string;   // With actual numbers substituted
  resultFormatted: string;
}

export interface PnPoint {
  n: number;
  probability: number;
  cumulative: number;
}

export interface ServerSensitivityPoint {
  servers: number;
  rho: number;
  isStable: boolean;
  Lq: number | null;
  L: number | null;
  WqMin: number | null;
  WMin: number | null;
  Pw: number | null;
  P0: number | null;
}

export interface LittleLawCheck {
  holds: boolean;
  lDiff: number;                    // |L - lambda * W|
  lqDiff: number;                   // |Lq - lambda * Wq|
}

export interface QueueCalculationResult {
  id: string;
  timestampIso: string;
  params: QueueParameters;
  model: QueueModelType;
  servers: number;
  trafficIntensityR: number;        // r = lambda / mu
  rho: number;                      // rho = lambda / (s * mu)
  minStableServers: number;         // smallest integer s > lambda / mu
  isStable: boolean;
  instabilityMessage?: string;
  // Metrics (defined when isStable === true)
  P0: number | null;
  Lq: number | null;                // pacientes en cola
  L: number | null;                 // pacientes en el sistema
  WqHours: number | null;           // horas en cola
  WqMin: number | null;             // minutos en cola
  WHours: number | null;            // horas en el sistema
  WMin: number | null;              // minutos en el sistema
  Pw: number | null;                // Probabilidad de esperar (Erlang C o rho en M/M/1)
  Pn: number | null;                // Probabilidad de exactamente n pacientes
  pnDistribution: PnPoint[];
  sensitivitySeries: ServerSensitivityPoint[];
  littleLaw: LittleLawCheck | null;
  interpretations: Record<IndicatorKey, string>;
  equations: Record<IndicatorKey, EquationDetail>;
  executiveConclusion: string;
}

