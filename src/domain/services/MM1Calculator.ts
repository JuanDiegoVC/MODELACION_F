import { QueueParameters } from '../entities/QueueParameters';
import { EquationDetail, IndicatorKey, PnPoint, QueueCalculationResult } from '../entities/QueueResults';
import {
  buildExecutiveConclusion,
  buildInterpretations,
  computeMinStableServers,
  formatNum,
  IQueueCalculator,
} from './QueueCalculatorCommon';

export class MM1Calculator implements IQueueCalculator {
  public calculate(params: QueueParameters): QueueCalculationResult {
    const lambda = params.lambdaPerHour;
    const mu = params.muPerHour;
    const r = mu > 0 ? lambda / mu : Infinity;
    const rho = r; // s = 1
    const minStableServers = computeMinStableServers(lambda, mu);
    const isStable = lambda > 0 && mu > 0 && rho < 1;
    const n = Math.max(0, Math.floor(params.targetN));
    const maxN = Math.max(5, Math.min(50, Math.floor(params.maxChartN || 15)));

    const lStr = formatNum(lambda, 3);
    const mStr = formatNum(mu, 3);
    const rhoStr = formatNum(rho, 4);

    if (!isStable) {
      const instabilityMessage = `Sistema inestable: llegan más pacientes (ρ = ${formatNum(rho, 2)}) de los que se pueden atender. La cola crece sin límite.`;
      const equations = this.buildEquations(lambda, mu, rho, n, null, null, null, null, null, null);
      return {
        id: `calc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        timestampIso: new Date().toISOString(),
        params: { ...params, servers: 1 },
        model: 'MM1',
        servers: 1,
        trafficIntensityR: r,
        rho,
        minStableServers,
        isStable: false,
        instabilityMessage,
        P0: null,
        Lq: null,
        L: null,
        WqHours: null,
        WqMin: null,
        WHours: null,
        WMin: null,
        Pw: null,
        Pn: null,
        pnDistribution: [],
        sensitivitySeries: [],
        littleLaw: null,
        interpretations: buildInterpretations({
          isStable: false,
          rho,
          servers: 1,
          P0: null,
          Lq: null,
          L: null,
          WqMin: null,
          WMin: null,
          Pw: null,
          Pn: null,
          targetN: n,
        }),
        equations,
        executiveConclusion: buildExecutiveConclusion({
          isStable: false,
          model: 'M/M/1',
          servers: 1,
          rho,
          minStableServers,
          WqMin: null,
          WMin: null,
          Lq: null,
          Pw: null,
        }),
      };
    }

    const P0 = 1 - rho;
    const L = lambda / (mu - lambda);
    const Lq = (lambda * lambda) / (mu * (mu - lambda));
    const WHours = 1 / (mu - lambda);
    const WMin = WHours * 60;
    const WqHours = lambda / (mu * (mu - lambda));
    const WqMin = WqHours * 60;
    const Pw = rho;
    const Pn = (1 - rho) * Math.pow(rho, n);

    const pnDistribution: PnPoint[] = [];
    let cumulative = 0;
    for (let k = 0; k <= maxN; k++) {
      const prob = (1 - rho) * Math.pow(rho, k);
      cumulative += prob;
      pnDistribution.push({ n: k, probability: prob, cumulative });
    }

    const lDiff = Math.abs(L - lambda * WHours);
    const lqDiff = Math.abs(Lq - lambda * WqHours);

    const equations = this.buildEquations(lambda, mu, rho, n, P0, L, Lq, WHours, WqHours, Pn);

    return {
      id: `calc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestampIso: new Date().toISOString(),
      params: { ...params, servers: 1 },
      model: 'MM1',
      servers: 1,
      trafficIntensityR: r,
      rho,
      minStableServers,
      isStable: true,
      P0,
      Lq,
      L,
      WqHours,
      WqMin,
      WHours,
      WMin,
      Pw,
      Pn,
      pnDistribution,
      sensitivitySeries: [],
      littleLaw: {
        holds: lDiff < 0.001 && lqDiff < 0.001,
        lDiff,
        lqDiff,
      },
      interpretations: buildInterpretations({
        isStable: true,
        rho,
        servers: 1,
        P0,
        Lq,
        L,
        WqMin,
        WMin,
        Pw,
        Pn,
        targetN: n,
      }),
      equations,
      executiveConclusion: buildExecutiveConclusion({
        isStable: true,
        model: 'M/M/1',
        servers: 1,
        rho,
        minStableServers,
        WqMin,
        WMin,
        Lq,
        Pw,
      }),
    };
  }

  private buildEquations(
    lambda: number,
    mu: number,
    rho: number,
    n: number,
    P0: number | null,
    L: number | null,
    Lq: number | null,
    WHours: number | null,
    WqHours: number | null,
    Pn: number | null
  ): Record<IndicatorKey, EquationDetail> {
    const lStr = formatNum(lambda, 3);
    const mStr = formatNum(mu, 3);
    const rhoStr = formatNum(rho, 4);
    const unstableTxt = 'No aplica (ρ ≥ 1, sistema inestable)';

    return {
      rho: {
        indicator: 'rho',
        symbol: 'ρ',
        name: 'Factor de utilización del sistema',
        generalFormulaLatex: 'ρ = \\frac{λ}{μ}',
        substitutedFormulaText: `ρ = ${lStr} / ${mStr}`,
        resultFormatted: `${rhoStr} (${formatNum(rho * 100, 2)} %)`,
      },
      P0: {
        indicator: 'P0',
        symbol: 'P₀',
        name: 'Probabilidad de sistema vacío',
        generalFormulaLatex: 'P_0 = 1 - ρ',
        substitutedFormulaText: P0 !== null ? `P₀ = 1 − ${rhoStr}` : unstableTxt,
        resultFormatted: P0 !== null ? `${formatNum(P0, 4)} (${formatNum(P0 * 100, 2)} %)` : unstableTxt,
      },
      Lq: {
        indicator: 'Lq',
        symbol: 'Lq',
        name: 'Número promedio de pacientes en la cola',
        generalFormulaLatex: 'L_q = \\frac{λ^2}{μ(μ - λ)}',
        substitutedFormulaText: Lq !== null ? `Lq = (${lStr})² / [${mStr} × (${mStr} − ${lStr})]` : unstableTxt,
        resultFormatted: Lq !== null ? `${formatNum(Lq, 3)} pacientes` : unstableTxt,
      },
      L: {
        indicator: 'L',
        symbol: 'L',
        name: 'Número promedio de pacientes en el sistema',
        generalFormulaLatex: 'L = \\frac{λ}{μ - λ}',
        substitutedFormulaText: L !== null ? `L = ${lStr} / (${mStr} − ${lStr})` : unstableTxt,
        resultFormatted: L !== null ? `${formatNum(L, 3)} pacientes` : unstableTxt,
      },
      Wq: {
        indicator: 'Wq',
        symbol: 'Wq',
        name: 'Tiempo promedio de espera en la cola',
        generalFormulaLatex: 'W_q = \\frac{λ}{μ(μ - λ)} = \\frac{L_q}{λ}',
        substitutedFormulaText: WqHours !== null ? `Wq = ${lStr} / [${mStr} × (${mStr} − ${lStr})]` : unstableTxt,
        resultFormatted:
          WqHours !== null
            ? `${formatNum(WqHours * 60, 2)} min (${formatNum(WqHours, 4)} h)`
            : unstableTxt,
      },
      W: {
        indicator: 'W',
        symbol: 'W',
        name: 'Tiempo promedio total en el sistema',
        generalFormulaLatex: 'W = \\frac{1}{μ - λ} = W_q + \\frac{1}{μ}',
        substitutedFormulaText: WHours !== null ? `W = 1 / (${mStr} − ${lStr})` : unstableTxt,
        resultFormatted:
          WHours !== null
            ? `${formatNum(WHours * 60, 2)} min (${formatNum(WHours, 4)} h)`
            : unstableTxt,
      },
      Pw: {
        indicator: 'Pw',
        symbol: 'Pw',
        name: 'Probabilidad de que un paciente deba esperar',
        generalFormulaLatex: 'P_w = P(N ≥ 1) = ρ',
        substitutedFormulaText: P0 !== null ? `Pw = ${rhoStr}` : unstableTxt,
        resultFormatted: P0 !== null ? `${formatNum(rho, 4)} (${formatNum(rho * 100, 2)} %)` : unstableTxt,
      },
      Pn: {
        indicator: 'Pn',
        symbol: `P${n}`,
        name: `Probabilidad de exactamente n = ${n} pacientes`,
        generalFormulaLatex: 'P_n = (1 - ρ)ρ^n',
        substitutedFormulaText: Pn !== null ? `P_${n} = (1 − ${rhoStr}) × (${rhoStr})^${n}` : unstableTxt,
        resultFormatted: Pn !== null ? `${formatNum(Pn, 4)} (${formatNum(Pn * 100, 2)} %)` : unstableTxt,
      },
    };
  }
}

