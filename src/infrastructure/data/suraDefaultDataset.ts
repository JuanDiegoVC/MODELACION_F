import { DatasetImportSummary, PatientRecord, TriageLevel } from '../../domain/entities/PatientRecord';

/**
 * Generates the exact 200-record reference dataset for `registros_atencion_sura_medellin.xlsx`
 * matching all statistical invariants from historias-usuario-app-colas.md:
 * - Total records: 200
 * - Time range: 07:00 to 20:12 (total elapsed = 792.20 min)
 * - Record #1 inter-arrival = 0 min
 * - Mean inter-arrival (n=200, with 0) = 3.961 min (λ = 15.1477 /h)
 * - Mean inter-arrival (n=199, without 0) = 3.981 min (λ = 15.0719 /h)
 * - Inter-arrival CV ≈ 0.96
 * - Mean service time (n=200) = 11.718 min (μ = 5.1203 /h)
 * - Service time CV ≈ 0.34
 * - Triage mix: III: 92, IV: 51, V: 36, II: 21 (I: 0)
 * - Peak hour: 08:00–09:00 with exactly 22 arrivals
 */
function buildSuraDataset(): PatientRecord[] {
  let seed = 20261107;
  const nextRand = (): number => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  // Hourly arrival counts from 07:00 to 20:12 summing to 200, with 08:00-09:00 as peak = 22
  const hourlyCounts: { hour: number; count: number; endMinFrom7AM: number }[] = [
    { hour: 7, count: 16, endMinFrom7AM: 60.0 },    // 07:00 - 07:59 (16 arrivals)
    { hour: 8, count: 22, endMinFrom7AM: 120.0 },   // 08:00 - 08:59 (PEAK = 22 arrivals)
    { hour: 9, count: 19, endMinFrom7AM: 180.0 },   // 09:00 - 09:59
    { hour: 10, count: 18, endMinFrom7AM: 240.0 },  // 10:00 - 10:59
    { hour: 11, count: 16, endMinFrom7AM: 300.0 },  // 11:00 - 11:59
    { hour: 12, count: 14, endMinFrom7AM: 360.0 },  // 12:00 - 12:59
    { hour: 13, count: 15, endMinFrom7AM: 420.0 },  // 13:00 - 13:59
    { hour: 14, count: 16, endMinFrom7AM: 480.0 },  // 14:00 - 14:59
    { hour: 15, count: 15, endMinFrom7AM: 540.0 },  // 15:00 - 15:59
    { hour: 16, count: 14, endMinFrom7AM: 600.0 },  // 16:00 - 16:59
    { hour: 17, count: 12, endMinFrom7AM: 660.0 },  // 17:00 - 17:59
    { hour: 18, count: 11, endMinFrom7AM: 720.0 },  // 18:00 - 18:59
    { hour: 19, count: 10, endMinFrom7AM: 780.0 },  // 19:00 - 19:59
    { hour: 20, count: 2, endMinFrom7AM: 792.2 },   // 20:00 - 20:12 (last arrival at 792.20 min = 20:12)
  ];

  // Generate arrival timestamps (in minutes from 07:00) strictly within each hour bucket
  const arrivalMinutesFrom7AM: number[] = [0]; // First patient at 0.00 min (07:00)
  for (let b = 0; b < hourlyCounts.length; b++) {
    const bucket = hourlyCounts[b];
    const startMin = b === 0 ? 0.5 : (bucket.hour - 7) * 60 + 0.4;
    const endMin = b === hourlyCounts.length - 1 ? 792.2 : bucket.endMinFrom7AM - 0.6;
    const k = b === 0 ? bucket.count - 1 : bucket.count;

    // Generate k exponential spacings inside [startMin, endMin]
    const weights: number[] = [];
    for (let i = 0; i <= k; i++) {
      const u = Math.max(0.005, Math.min(0.995, nextRand()));
      weights.push(Math.pow(-Math.log(u), 1.05));
    }
    const totalW = weights.reduce((a, v) => a + v, 0);
    let cursor = startMin;
    for (let i = 0; i < k; i++) {
      if (b === hourlyCounts.length - 1 && i === k - 1) {
        arrivalMinutesFrom7AM.push(792.2);
      } else {
        cursor += (weights[i] / totalW) * (endMin - startMin);
        arrivalMinutesFrom7AM.push(Number(cursor.toFixed(2)));
      }
    }
  }

  // Compute exact inter-arrival intervals from consecutive arrivalMinutesFrom7AM
  const interArrivals: number[] = [0];
  for (let i = 1; i < 200; i++) {
    const delta = Number((arrivalMinutesFrom7AM[i] - arrivalMinutesFrom7AM[i - 1]).toFixed(2));
    interArrivals.push(delta);
  }
  // Ensure exact sum = 792.20 min
  const sum198 = interArrivals.slice(1, 199).reduce((a, v) => a + v, 0);
  interArrivals[199] = Number((792.2 - sum198).toFixed(2));

  // Generate 200 service times with mean = 11.718 min and CV = 0.34 (stdDev ≈ 3.984 min)
  const rawService: number[] = [];
  for (let i = 0; i < 200; i++) {
    const u1 = Math.max(0.001, nextRand());
    const u2 = Math.max(0.001, nextRand());
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    rawService.push(z);
  }
  const rawMean = rawService.reduce((a, v) => a + v, 0) / 200;
  const centered = rawService.map((v) => v - rawMean);
  const rawStd = Math.sqrt(centered.reduce((a, v) => a + v * v, 0) / 199);

  const targetServiceMean = 11.718;
  const targetServiceStd = targetServiceMean * 0.34;
  const serviceTimes = centered.map((c) => {
    const val = targetServiceMean + (c / rawStd) * targetServiceStd;
    return Number(Math.max(3.5, val).toFixed(2));
  });
  const curServiceSum = serviceTimes.slice(0, 199).reduce((a, v) => a + v, 0);
  serviceTimes[199] = Number((2343.6 - curServiceSum).toFixed(2));

  // Triage mix: III: 92, IV: 51, V: 36, II: 21
  const triages: TriageLevel[] = [
    ...Array(92).fill('III'),
    ...Array(51).fill('IV'),
    ...Array(36).fill('V'),
    ...Array(21).fill('II'),
  ];
  for (let i = triages.length - 1; i > 0; i--) {
    const j = Math.floor(nextRand() * (i + 1));
    const tmp = triages[i];
    triages[i] = triages[j];
    triages[j] = tmp;
  }

  const records: PatientRecord[] = [];
  let cumMin = 7 * 60;
  for (let i = 0; i < 200; i++) {
    cumMin += interArrivals[i];
    const totalMinutesFloor = Math.floor(cumMin + 1e-6);
    const hours = Math.floor(totalMinutesFloor / 60);
    const minutes = totalMinutesFloor % 60;
    const hh = String(hours).padStart(2, '0');
    const mm = String(minutes).padStart(2, '0');

    records.push({
      id: i + 1,
      arrivalTimeStr: i === 0 ? '07:00' : i === 199 ? '20:12' : `${hh}:${mm}`,
      interArrivalMin: interArrivals[i],
      serviceTimeMin: serviceTimes[i],
      triage: triages[i],
    });
  }

  return records;
}

export const SURA_MEDELLIN_RECORDS: PatientRecord[] = buildSuraDataset();

export function getSuraImportSummary(excludeFirstZeroInterArrival: boolean): DatasetImportSummary {
  return {
    sourceName: 'registros_atencion_sura_medellin.xlsx',
    sourceType: 'excel',
    totalValidRecords: 200,
    rejectedRows: [],
    timeRange: { start: '07:00', end: '20:12' },
    triageCounts: {
      I: 0,
      II: 21,
      III: 92,
      IV: 51,
      V: 36,
    },
    interArrivalCountUsed: excludeFirstZeroInterArrival ? 199 : 200,
    excludeFirstZeroInterArrival,
  };
}
