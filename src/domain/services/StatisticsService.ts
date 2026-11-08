import {
  DatasetDescriptiveAnalysis,
  HistogramBin,
  HourlyArrivalPoint,
  SampleValidationResult,
  VariableStats,
} from '../entities/DescriptiveStats';
import { PatientRecord } from '../entities/PatientRecord';

export class StatisticsService {
  /**
   * Computes full descriptive statistics for a dataset of PatientRecords.
   * Implements HU-03.6 (First record rule: excludes first record's 0/null inter-arrival time when configured)
   * and HU-04 (CV check in 0.7-1.3, histogram + theoretical exponential density, hourly arrivals, sample size).
   */
  public static analyzeDataset(
    records: PatientRecord[],
    options: {
      excludeFirstZeroInterArrival: boolean;
      confidenceLevelPercent: 90 | 95 | 99;
      acceptableErrorMin: number;
    }
  ): DatasetDescriptiveAnalysis {
    const interArrivalValues: number[] = [];
    const serviceValues: number[] = [];

    records.forEach((rec, index) => {
      if (rec.interArrivalMin !== null && rec.interArrivalMin !== undefined && !Number.isNaN(rec.interArrivalMin)) {
        const isFirstZero = index === 0 && rec.interArrivalMin === 0;
        if (!(options.excludeFirstZeroInterArrival && isFirstZero)) {
          if (rec.interArrivalMin >= 0) {
            interArrivalValues.push(rec.interArrivalMin);
          }
        }
      }
      if (rec.serviceTimeMin !== null && rec.serviceTimeMin !== undefined && !Number.isNaN(rec.serviceTimeMin) && rec.serviceTimeMin > 0) {
        serviceValues.push(rec.serviceTimeMin);
      }
    });

    const interArrivalStats = this.computeVariableStats(
      'Tiempo entre llegadas',
      'min',
      interArrivalValues
    );
    const serviceStats = this.computeVariableStats(
      'Tiempo de atención',
      'min',
      serviceValues
    );

    const hourlyArrivals = this.computeHourlyArrivals(records);
    const peakHour = hourlyArrivals.find((h) => h.isPeak) ?? null;

    // Sample size validation using max(stdDev) or service/inter-arrival stdDev
    const targetStdDev = Math.max(interArrivalStats.stdDev, serviceStats.stdDev);
    const sampleValidation = this.validateSampleSize(
      records.length,
      targetStdDev,
      options.confidenceLevelPercent,
      options.acceptableErrorMin
    );

    return {
      interArrivalStats,
      serviceStats,
      hourlyArrivals,
      peakHour,
      sampleValidation,
    };
  }

  public static computeVariableStats(
    variableName: string,
    unit: string,
    values: number[],
    numBins = 8
  ): VariableStats {
    const n = values.length;
    if (n === 0) {
      return {
        variableName,
        unit,
        n: 0,
        mean: 0,
        stdDev: 0,
        min: 0,
        max: 0,
        median: 0,
        cv: 0,
        isExponentialCompatible: false,
        warningMessage: null,
        histogram: [],
      };
    }

    const sorted = [...values].sort((a, b) => a - b);
    const sum = sorted.reduce((acc, v) => acc + v, 0);
    const mean = sum / n;

    // Sample standard deviation (n - 1 denominator)
    const variance =
      n > 1
        ? sorted.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / (n - 1)
        : 0;
    const stdDev = Math.sqrt(variance);
    const min = sorted[0];
    const max = sorted[n - 1];
    const median =
      n % 2 === 1
        ? sorted[Math.floor(n / 2)]
        : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;

    const cv = mean > 0 ? stdDev / mean : 0;
    const isExponentialCompatible = cv >= 0.7 && cv <= 1.3;
    const warningMessage = !isExponentialCompatible
      ? 'Esta variable no se comporta como exponencial; el modelo M/M es una aproximación'
      : null;

    // Build histogram with theoretical exponential curve f(t) = rate * exp(-rate * t)
    const histogram = this.buildHistogram(sorted, mean, numBins);

    return {
      variableName,
      unit,
      n,
      mean,
      stdDev,
      min,
      max,
      median,
      cv,
      isExponentialCompatible,
      warningMessage,
      histogram,
    };
  }

  private static buildHistogram(
    sortedValues: number[],
    mean: number,
    numBins: number
  ): HistogramBin[] {
    const n = sortedValues.length;
    if (n === 0 || mean <= 0) return [];
    const minVal = 0; // Time starts at 0
    const maxVal = Math.max(sortedValues[n - 1], mean * 2.5);
    const binWidth = (maxVal - minVal) / numBins || 1;
    const rate = 1 / mean;

    const counts = new Array(numBins).fill(0);
    for (const v of sortedValues) {
      let idx = Math.floor((v - minVal) / binWidth);
      if (idx < 0) idx = 0;
      if (idx >= numBins) idx = numBins - 1;
      counts[idx]++;
    }

    const bins: HistogramBin[] = [];
    for (let i = 0; i < numBins; i++) {
      const binStart = minVal + i * binWidth;
      const binEnd = binStart + binWidth;
      const binCenter = (binStart + binEnd) / 2;
      const observedCount = counts[i];
      // Expected count under exponential distribution in [binStart, binEnd]: n * (e^(-rate*binStart) - e^(-rate*binEnd))
      const expProbInBin = Math.exp(-rate * binStart) - Math.exp(-rate * binEnd);
      const expectedCount = n * expProbInBin;

      bins.push({
        binStart,
        binEnd,
        binCenter,
        observedCount,
        observedDensity: observedCount / n,
        theoreticalExponentialDensity: expectedCount, // Scaled to count for direct visual comparison on bar chart
      });
    }
    return bins;
  }

  private static computeHourlyArrivals(records: PatientRecord[]): HourlyArrivalPoint[] {
    const hourMap = new Map<number, number>();
    for (let h = 7; h <= 20; h++) {
      hourMap.set(h, 0);
    }

    for (const r of records) {
      if (!r.arrivalTimeStr) continue;
      const parts = r.arrivalTimeStr.trim().split(':');
      const hour = parseInt(parts[0], 10);
      if (!Number.isNaN(hour)) {
        hourMap.set(hour, (hourMap.get(hour) ?? 0) + 1);
      }
    }

    let maxCount = 0;
    for (const count of hourMap.values()) {
      if (count > maxCount) maxCount = count;
    }

    const points: HourlyArrivalPoint[] = [];
    const sortedHours = Array.from(hourMap.keys()).sort((a, b) => a - b);
    for (const h of sortedHours) {
      const count = hourMap.get(h) ?? 0;
      const hStart = String(h).padStart(2, '0') + ':00';
      const hEnd = String((h + 1) % 24).padStart(2, '0') + ':00';
      points.push({
        hourLabel: `${hStart}–${hEnd}`,
        hourNumber: h,
        count,
        isPeak: maxCount > 0 && count === maxCount,
      });
    }

    return points;
  }

  public static validateSampleSize(
    actualSampleSize: number,
    stdDev: number,
    confidenceLevelPercent: 90 | 95 | 99,
    acceptableErrorMin: number
  ): SampleValidationResult {
    const zMap: Record<90 | 95 | 99, number> = {
      90: 1.645,
      95: 1.96,
      99: 2.576,
    };
    const zScore = zMap[confidenceLevelPercent] ?? 1.96;
    const error = Math.max(0.05, acceptableErrorMin);
    const rawN = stdDev > 0 ? Math.pow((zScore * stdDev) / error, 2) : 30;
    const recommendedMinSampleSize = Math.max(30, Math.ceil(rawN));

    return {
      confidenceLevelPercent,
      zScore,
      acceptableErrorMin: error,
      recommendedMinSampleSize,
      actualSampleSize,
      meetsRecommendation: actualSampleSize >= recommendedMinSampleSize,
    };
  }
}

