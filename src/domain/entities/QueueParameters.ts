export type QueueModelType = 'MM1' | 'MMS';

export type TimeUnit = 'min' | 'hour';

export type InputMethod = 'mean_times' | 'rates_per_hour' | 'rates_per_min';

export type IndicatorKey = 'rho' | 'P0' | 'L' | 'Lq' | 'W' | 'Wq' | 'Pw' | 'Pn';

export interface IndicatorSelection {
  rho: boolean;
  P0: boolean;
  L: boolean;
  Lq: boolean;
  W: boolean;
  Wq: boolean;
  Pw: boolean;
  Pn: boolean;
}

export interface QueueParameters {
  model: QueueModelType;
  servers: number;                  // s >= 1 (for MM1, s = 1)
  lambdaPerHour: number;            // Arrival rate per hour (pacientes/h)
  muPerHour: number;                // Service rate per server per hour (pacientes/h)
  meanInterArrivalMin: number;      // 60 / lambdaPerHour (min)
  meanServiceMin: number;           // 60 / muPerHour (min)
  targetN: number;                  // n >= 0 for Pn
  maxChartN: number;                // N for Pn bar chart (default 15)
  selectedIndicators: IndicatorSelection;
  sourceDescription: string;        // e.g. "Excel: registros_atencion_sura_medellin.xlsx (200 reg.)"
  interArrivalCV?: number;          // Optional CV from sample
  serviceCV?: number;               // Optional CV from sample (warns if outside 0.7 - 1.3)
}

export interface OccupancyThresholds {
  greenMaxPercent: number;          // Default 70%
  yellowMaxPercent: number;         // Default 85%
}

