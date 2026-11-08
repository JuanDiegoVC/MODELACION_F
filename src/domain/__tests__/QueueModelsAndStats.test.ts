import { describe, expect, it } from 'vitest';
import { QueueParameters } from '../entities/QueueParameters';
import { CostOptimizerService } from '../services/CostOptimizerService';
import { QueueCalculatorFactory } from '../services/QueueCalculatorFactory';
import { StatisticsService } from '../services/StatisticsService';
import { SURA_MEDELLIN_RECORDS } from '../../infrastructure/data/suraDefaultDataset';

const BASE_PARAMS: QueueParameters = {
  model: 'MM1',
  servers: 1,
  lambdaPerHour: 15.14769, // 60 / 3.961
  muPerHour: 5.1203277,    // 60 / 11.718
  meanInterArrivalMin: 3.961,
  meanServiceMin: 11.718,
  targetN: 5,
  maxChartN: 15,
  selectedIndicators: {
    rho: true,
    P0: true,
    L: true,
    Lq: true,
    W: true,
    Wq: true,
    Pw: true,
    Pn: true,
  },
  sourceDescription: 'Test',
};

describe('Pruebas de Aceptación Matemática — Historias de Usuario Teoría de Colas', () => {
  it('HU-06.2: Caso de prueba estable M/M/1 (λ = 2 /h, μ = 3 /h)', () => {
    const res = QueueCalculatorFactory.calculate({
      ...BASE_PARAMS,
      model: 'MM1',
      servers: 1,
      lambdaPerHour: 2,
      muPerHour: 3,
      meanInterArrivalMin: 30,
      meanServiceMin: 20,
    });

    expect(res.isStable).toBe(true);
    expect(res.rho).toBeCloseTo(0.6667, 3);
    expect(res.L!).toBeCloseTo(2.0, 3);
    expect(res.Lq!).toBeCloseTo(1.3333, 3);
    expect(res.WHours!).toBeCloseTo(1.0, 3);
    expect(res.WqHours!).toBeCloseTo(0.6667, 3);
    expect(res.littleLaw?.holds).toBe(true);
  });

  it('HU-06.3 & HU-06.4: Caso de prueba inestable M/M/1 con datos reales (ρ = 2.96) y ρ = 1 exacto', () => {
    const resReal = QueueCalculatorFactory.calculate({
      ...BASE_PARAMS,
      model: 'MM1',
      servers: 1,
    });
    expect(resReal.isStable).toBe(false);
    expect(resReal.rho).toBeCloseTo(2.958, 2);
    expect(resReal.Lq).toBeNull();
    expect(resReal.L).toBeNull();
    expect(resReal.WqMin).toBeNull();
    expect(resReal.WMin).toBeNull();
    expect(resReal.minStableServers).toBe(3);

    const resRho1 = QueueCalculatorFactory.calculate({
      ...BASE_PARAMS,
      model: 'MM1',
      servers: 1,
      lambdaPerHour: 5,
      muPerHour: 5,
    });
    expect(resRho1.isStable).toBe(false);
    expect(resRho1.L).toBeNull();
  });

  it('HU-05.2: M/M/S con s = 1 produce resultados idénticos a M/M/1', () => {
    const mm1 = QueueCalculatorFactory.calculate({
      ...BASE_PARAMS,
      model: 'MM1',
      servers: 1,
      lambdaPerHour: 2,
      muPerHour: 3,
    });
    const mms1 = QueueCalculatorFactory.calculate({
      ...BASE_PARAMS,
      model: 'MMS',
      servers: 1,
      lambdaPerHour: 2,
      muPerHour: 3,
    });

    expect(mms1.rho).toBeCloseTo(mm1.rho, 6);
    expect(mms1.P0!).toBeCloseTo(mm1.P0!, 6);
    expect(mms1.Lq!).toBeCloseTo(mm1.Lq!, 6);
    expect(mms1.L!).toBeCloseTo(mm1.L!, 6);
    expect(mms1.WqMin!).toBeCloseTo(mm1.WqMin!, 6);
    expect(mms1.WMin!).toBeCloseTo(mm1.WMin!, 6);
  });

  it('HU-07.2: Casos de prueba M/M/S con datos del Excel (s = 3, 4, 5) dentro de tolerancia ±1%', () => {
    // s = 3
    const s3 = QueueCalculatorFactory.calculate({
      ...BASE_PARAMS,
      model: 'MMS',
      servers: 3,
    });
    expect(s3.isStable).toBe(true);
    expect(Math.abs(s3.rho - 0.9862) / 0.9862).toBeLessThan(0.01);
    expect(Math.abs(s3.P0! - 0.0031) / 0.0031).toBeLessThan(0.02);
    expect(Math.abs(s3.Lq! - 69.36) / 69.36).toBeLessThan(0.01);
    expect(Math.abs(s3.WqMin! - 274.74) / 274.74).toBeLessThan(0.01);
    expect(Math.abs(s3.WMin! - 286.45) / 286.45).toBeLessThan(0.01);
    expect(Math.abs(s3.Pw! - 0.974) / 0.974).toBeLessThan(0.01);
    expect(s3.littleLaw?.holds).toBe(true);

    // s = 4
    const s4 = QueueCalculatorFactory.calculate({
      ...BASE_PARAMS,
      model: 'MMS',
      servers: 4,
    });
    expect(s4.isStable).toBe(true);
    expect(Math.abs(s4.rho - 0.7396) / 0.7396).toBeLessThan(0.01);
    expect(Math.abs(s4.P0! - 0.0401) / 0.0401).toBeLessThan(0.01);
    expect(Math.abs(s4.Lq! - 1.398) / 1.398).toBeLessThan(0.01);
    expect(Math.abs(s4.L! - 4.356) / 4.356).toBeLessThan(0.01);
    expect(Math.abs(s4.WqMin! - 5.54) / 5.54).toBeLessThan(0.01);
    expect(Math.abs(s4.WMin! - 17.26) / 17.26).toBeLessThan(0.01);
    expect(Math.abs(s4.Pw! - 0.492) / 0.492).toBeLessThan(0.01);
    expect(s4.littleLaw?.holds).toBe(true);

    // s = 5
    const s5 = QueueCalculatorFactory.calculate({
      ...BASE_PARAMS,
      model: 'MMS',
      servers: 5,
    });
    expect(s5.isStable).toBe(true);
    expect(Math.abs(s5.rho - 0.5917) / 0.5917).toBeLessThan(0.01);
    expect(Math.abs(s5.P0! - 0.0489) / 0.0489).toBeLessThan(0.01);
    expect(Math.abs(s5.Lq! - 0.327) / 0.327).toBeLessThan(0.01);
    expect(Math.abs(s5.L! - 3.286) / 3.286).toBeLessThan(0.01);
    expect(Math.abs(s5.WqMin! - 1.3) / 1.3).toBeLessThan(0.01);
    expect(Math.abs(s5.WMin! - 13.02) / 13.02).toBeLessThan(0.01);
    expect(Math.abs(s5.Pw! - 0.226) / 0.226).toBeLessThan(0.01);
    expect(s5.littleLaw?.holds).toBe(true);
  });

  it('HU-07.4: Sin desbordamiento ni pérdida de precisión para s = 50 servidores', () => {
    const s50 = QueueCalculatorFactory.calculate({
      ...BASE_PARAMS,
      model: 'MMS',
      servers: 50,
      lambdaPerHour: 200,
      muPerHour: 5,
    });
    expect(s50.isStable).toBe(true);
    expect(Number.isFinite(s50.P0!)).toBe(true);
    expect(Number.isFinite(s50.Lq!)).toBe(true);
    expect(s50.littleLaw?.holds).toBe(true);
  });

  it('HU-02, HU-03.6 & HU-04: Estadísticas descriptivas del dataset SURA Medellín (200 registros)', () => {
    expect(SURA_MEDELLIN_RECORDS.length).toBe(200);
    expect(SURA_MEDELLIN_RECORDS[0].arrivalTimeStr).toBe('07:00');
    expect(SURA_MEDELLIN_RECORDS[199].arrivalTimeStr).toBe('20:12');

    // Con el 0 del primer registro (n = 200): media = 3.961 min
    const stats200 = StatisticsService.analyzeDataset(SURA_MEDELLIN_RECORDS, {
      excludeFirstZeroInterArrival: false,
      confidenceLevelPercent: 95,
      acceptableErrorMin: 0.6,
    });
    expect(stats200.interArrivalStats.n).toBe(200);
    expect(stats200.interArrivalStats.mean).toBeCloseTo(3.961, 2);
    expect(stats200.serviceStats.mean).toBeCloseTo(11.718, 2);

    // Excluyendo el 0 del primer registro (n = 199, HU-03.6): media = 3.981 min
    const stats199 = StatisticsService.analyzeDataset(SURA_MEDELLIN_RECORDS, {
      excludeFirstZeroInterArrival: true,
      confidenceLevelPercent: 95,
      acceptableErrorMin: 0.6,
    });
    expect(stats199.interArrivalStats.n).toBe(199);
    expect(stats199.interArrivalStats.mean).toBeCloseTo(3.981, 2);
    expect(stats199.interArrivalStats.isExponentialCompatible).toBe(true);
    expect(stats199.serviceStats.cv).toBeCloseTo(0.34, 1);
    expect(stats199.serviceStats.isExponentialCompatible).toBe(false);
    expect(stats199.serviceStats.warningMessage).toContain('no se comporta como exponencial');

    // Hora pico 08:00–09:00 con 22 llegadas (HU-04.5)
    expect(stats199.peakHour?.hourLabel).toBe('08:00–09:00');
    expect(stats199.peakHour?.count).toBe(22);
  });

  it('HU-13: Optimización económica de costos encuentra s* óptimo', () => {
    const costRes = CostOptimizerService.analyzeCosts(BASE_PARAMS, 48000, 32000, 'system_L');
    expect(costRes.points.length).toBeGreaterThanOrEqual(5);
    expect(costRes.optimalServers).toBeGreaterThanOrEqual(4);
  });
});

