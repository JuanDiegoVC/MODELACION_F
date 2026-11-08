export interface HistogramBin {
  binStart: number;
  binEnd: number;
  binCenter: number;
  observedCount: number;
  observedDensity: number;
  theoreticalExponentialDensity: number;
}

export interface VariableStats {
  variableName: string;
  unit: string;
  n: number;
  mean: number;
  stdDev: number;
  min: number;
  max: number;
  median: number;
  cv: number;                       // Coefficient of variation = stdDev / mean
  isExponentialCompatible: boolean; // true if 0.7 <= cv <= 1.3
  warningMessage: string | null;
  histogram: HistogramBin[];
}

export interface HourlyArrivalPoint {
  hourLabel: string;                // e.g. "08:00–09:00"
  hourNumber: number;               // 7..20
  count: number;
  isPeak: boolean;
}

export interface SampleValidationResult {
  confidenceLevelPercent: 90 | 95 | 99;
  zScore: number;
  acceptableErrorMin: number;
  recommendedMinSampleSize: number;
  actualSampleSize: number;
  meetsRecommendation: boolean;
}

export interface DatasetDescriptiveAnalysis {
  interArrivalStats: VariableStats;
  serviceStats: VariableStats;
  hourlyArrivals: HourlyArrivalPoint[];
  peakHour: HourlyArrivalPoint | null;
  sampleValidation: SampleValidationResult;
}

