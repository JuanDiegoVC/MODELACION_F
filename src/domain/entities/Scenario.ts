import { QueueCalculationResult } from './QueueResults';

export interface SavedScenario {
  id: string;
  name: string;
  servers: number;
  lambdaVariationPercent: number;   // e.g. +30%
  serviceTimeVariationPercent: number; // e.g. -15%
  effectiveLambdaPerHour: number;
  effectiveMeanServiceMin: number;
  effectiveMuPerHour: number;
  result: QueueCalculationResult;
}

export type CostBasisType = 'system_L' | 'queue_Lq';

export interface CostPoint {
  servers: number;
  isStable: boolean;
  rho: number;
  L: number | null;
  Lq: number | null;
  WqMin: number | null;
  serverCostPerHourCOP: number;     // s * Cs
  waitingCostPerHourCOP: number | null; // L * Cw or Lq * Cw
  totalCostPerHourCOP: number | null;
  isOptimal: boolean;
}

export interface CostAnalysisResult {
  costPerServerHourCOP: number;     // Cs
  costPerPatientWaitHourCOP: number;// Cw
  basis: CostBasisType;
  points: CostPoint[];
  optimalServers: number | null;
  minTotalCostPerHourCOP: number | null;
}

