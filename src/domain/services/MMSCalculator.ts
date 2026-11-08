import { QueueParameters } from '../entities/QueueParameters';
import {
  EquationDetail,
  IndicatorKey,
  PnPoint,
  QueueCalculationResult,
  ServerSensitivityPoint,
} from '../entities/QueueResults';
import {
  buildExecutiveConclusion,
  buildInterpretations,
  computeMinStableServers,
  formatNum,
  IQueueCalculator,
} from './QueueCalculatorCommon';

export class MMSCalculator implements IQueueCalculator {
  public calculate(params: QueueParameters, includeSensitivity = true): QueueCalculationResult {
    const lambda = params.lambdaPerHour;
    const mu = params.muPerHour;
    const s = Math.max(1, Math.min(100, Math.floor(params.servers || 1)));
    const r = mu > 0 ? lambda / mu : Infinity;
    const rho = s > 0 && mu > 0 ? lambda / (s * mu) : Infinity;
    const minStableServers = computeMinStableServers(lambda, mu);
    const isStable = lambda > 0 && mu > 0 && rho < 1;
    const n = Math.max(0, Math.floor(params.targetN));
    const maxN = Math.max(5, Math.min(50, Math.floor(params.maxChartN || 15)));

    // Compute sensitivity series s = minStableServers .. minStableServers + 4
    const sensitivitySeries: ServerSensitivityPoint[] = [];
    if (includeSensitivity && lambda > 0 && mu > 0) {
      for (let sTest = minStableServers; sTest <= minStableServers + 4; sTest++) {
        if (sTest > 80) break;
        const subResult = this.calculateCoreMetrics(lambda, mu, sTest, 0, 5);
        sensitivitySeries.push({
          servers: sTest,
          rho: subResult.rho,
          isStable: subResult.isStable,
          Lq: subResult.Lq,
          L: subResult.L,
          WqMin: subResult.WqMin,
          WMin: subResult.WMin,
          Pw: subResult.Pw,
          P0: subResult.P0,
        });
      }
    }

    if (!isStable) {
      const instabilityMessage = `Sistema inestable: llegan más pacientes (ρ = ${formatNum(rho, 2)}, r = λ/μ = ${formatNum(r, 2)}) de los que ${s === 1 ? '1 servidor puede' : `${s} servidores pueden`} atender. La cola crece sin límite. Se requieren al menos s = ${minStableServers} servidores.`;
      const equations = this.buildEquations(lambda, mu, s, r, rho, n, null, null, null, null, null, null, null);

      return {
        id: `calc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        timestampIso: new Date().toISOString(),
        params: { ...params, servers: s },
        model: params.model,
        servers: s,
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
        sensitivitySeries,
        littleLaw: null,
        interpretations: buildInterpretations({
          isStable: false,
          rho,
          servers: s,
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
          model: `M/M/${s}`,
          servers: s,
          rho,
          minStableServers,
          WqMin: null,
          WMin: null,
          Lq: null,
          Pw: null,
        }),
      };
    }

    const core = this.calculateCoreMetrics(lambda, mu, s, n, maxN);
    const lDiff = Math.abs(core.L! - lambda * core.WHours!);
    const lqDiff = Math.abs(core.Lq! - lambda * core.WqHours!);

    const equations = this.buildEquations(
      lambda,
      mu,
      s,
      r,
      rho,
      n,
      core.P0,
      core.L,
      core.Lq,
      core.WHours,
      core.WqHours,
      core.Pw,
      core.Pn
    );

    return {
      id: `calc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestampIso: new Date().toISOString(),
      params: { ...params, servers: s },
      model: params.model,
      servers: s,
      trafficIntensityR: r,
      rho,
      minStableServers,
      isStable: true,
      P0: core.P0,
      Lq: core.Lq,
      L: core.L,
      WqHours: core.WqHours,
      WqMin: core.WqMin,
      WHours: core.WHours,
      WMin: core.WMin,
      Pw: core.Pw,
      Pn: core.Pn,
      pnDistribution: core.pnDistribution,
      sensitivitySeries,
      littleLaw: {
        holds: lDiff < 0.001 && lqDiff < 0.001,
        lDiff,
        lqDiff,
      },
      interpretations: buildInterpretations({
        isStable: true,
        rho,
        servers: s,
        P0: core.P0,
        Lq: core.Lq,
        L: core.L,
        WqMin: core.WqMin,
        WMin: core.WMin,
        Pw: core.Pw,
        Pn: core.Pn,
        targetN: n,
      }),
      equations,
      executiveConclusion: buildExecutiveConclusion({
        isStable: true,
        model: `M/M/${s}`,
        servers: s,
        rho,
        minStableServers,
        WqMin: core.WqMin,
        WMin: core.WMin,
        Lq: core.Lq,
        Pw: core.Pw,
      }),
    };
  }

  /**
   * Overflow-safe recurrence t_k = r^k / k! = t_{k-1} * (r / k).
   * Prevents overflow for s up to 100+.
   */
  private calculateCoreMetrics(
    lambda: number,
    mu: number,
    s: number,
    targetN: number,
    maxChartN: number
  ) {
    const r = lambda / mu;
    const rho = r / s;
    if (rho >= 1 || lambda <= 0 || mu <= 0) {
      return {
        isStable: false,
        rho,
        P0: null,
        Pw: null,
        Lq: null,
        L: null,
        WqHours: null,
        WqMin: null,
        WHours: null,
        WMin: null,
        Pn: null,
        pnDistribution: [] as PnPoint[],
      };
    }

    // Compute terms t_k = r^k / k! for k = 0..s
    const terms: number[] = new Array(s + 1);
    terms[0] = 1;
    let sumBeforeS = 1; // k = 0
    for (let k = 1; k < s; k++) {
      terms[k] = terms[k - 1] * (r / k);
      sumBeforeS += terms[k];
    }
    terms[s] = terms[s - 1] * (r / s);

    const tailTerm = terms[s] / (1 - rho);
    const P0 = 1 / (sumBeforeS + tailTerm);
    const Pw = tailTerm * P0; // Erlang C probability of waiting
    const Lq = (Pw * rho) / (1 - rho);
    const L = Lq + r;
    const WqHours = Lq / lambda;
    const WqMin = WqHours * 60;
    const WHours = WqHours + 1 / mu;
    const WMin = WHours * 60;

    const computePnForK = (k: number): number => {
      if (k < s) {
        return P0 * terms[k];
      }
      return P0 * terms[s] * Math.pow(rho, k - s);
    };

    const Pn = computePnForK(targetN);
    const pnDistribution: PnPoint[] = [];
    let cumulative = 0;
    for (let k = 0; k <= maxChartN; k++) {
      const prob = computePnForK(k);
      cumulative += prob;
      pnDistribution.push({ n: k, probability: prob, cumulative });
    }

    return {
      isStable: true,
      rho,
      P0,
      Pw,
      Lq,
      L,
      WqHours,
      WqMin,
      WHours,
      WMin,
      Pn,
      pnDistribution,
    };
  }

  private buildEquations(
    lambda: number,
    mu: number,
    s: number,
    r: number,
    rho: number,
    n: number,
    P0: number | null,
    L: number | null,
    Lq: number | null,
    WHours: number | null,
    WqHours: number | null,
    Pw: number | null,
    Pn: number | null
  ): Record<IndicatorKey, EquationDetail> {
    const lStr = formatNum(lambda, 3);
    const mStr = formatNum(mu, 3);
    const rStr = formatNum(r, 3);
    const rhoStr = formatNum(rho, 4);
    const p0Str = P0 !== null ? formatNum(P0, 4) : '—';
    const lqStr = Lq !== null ? formatNum(Lq, 3) : '—';
    const wqHStr = WqHours !== null ? formatNum(WqHours, 4) : '—';
    const unstableTxt = 'No aplica (ρ ≥ 1, sistema inestable)';

    return {
      rho: {
        indicator: 'rho',
        symbol: 'ρ',
        name: 'Factor de utilización por servidor',
        generalFormulaLatex: 'ρ = \\frac{λ}{s \\cdot μ}',
        substitutedFormulaText: `ρ = ${lStr} / (${s} × ${mStr})`,
        resultFormatted: `${rhoStr} (${formatNum(rho * 100, 2)} %)`,
      },
      P0: {
        indicator: 'P0',
        symbol: 'P₀',
        name: 'Probabilidad de sistema vacío (0 pacientes)',
        generalFormulaLatex:
          'P_0 = \\left[ \\sum_{k=0}^{s-1} \\frac{(λ/μ)^k}{k!} + \\frac{(λ/μ)^s}{s!(1 - ρ)} \\right]^{-1}',
        substitutedFormulaText:
          P0 !== null
            ? `P₀ = [ Σ(k=0..${s - 1}) (${rStr})^k / k! + (${rStr})^${s} / (${s}! × (1 − ${rhoStr})) ]⁻¹`
            : unstableTxt,
        resultFormatted: P0 !== null ? `${p0Str} (${formatNum(P0 * 100, 2)} %)` : unstableTxt,
      },
      Pw: {
        indicator: 'Pw',
        symbol: 'Pw',
        name: 'Probabilidad de esperar en cola (Fórmula Erlang-C)',
        generalFormulaLatex: 'P_w = \\frac{(λ/μ)^s}{s!(1 - ρ)} P_0',
        substitutedFormulaText:
          Pw !== null
            ? `Pw = [ (${rStr})^${s} / (${s}! × (1 − ${rhoStr})) ] × ${p0Str}`
            : unstableTxt,
        resultFormatted: Pw !== null ? `${formatNum(Pw, 4)} (${formatNum(Pw * 100, 2)} %)` : unstableTxt,
      },
      Lq: {
        indicator: 'Lq',
        symbol: 'Lq',
        name: 'Número promedio de pacientes en la cola',
        generalFormulaLatex: 'L_q = \\frac{P_0 (λ/μ)^s ρ}{s!(1 - ρ)^2}',
        substitutedFormulaText:
          Lq !== null
            ? `Lq = [ ${p0Str} × (${rStr})^${s} × ${rhoStr} ] / [ ${s}! × (1 − ${rhoStr})² ]`
            : unstableTxt,
        resultFormatted: Lq !== null ? `${lqStr} pacientes` : unstableTxt,
      },
      L: {
        indicator: 'L',
        symbol: 'L',
        name: 'Número promedio de pacientes en el sistema',
        generalFormulaLatex: 'L = L_q + \\frac{λ}{μ}',
        substitutedFormulaText: L !== null ? `L = ${lqStr} + (${lStr} / ${mStr})` : unstableTxt,
        resultFormatted: L !== null ? `${formatNum(L, 3)} pacientes` : unstableTxt,
      },
      Wq: {
        indicator: 'Wq',
        symbol: 'Wq',
        name: 'Tiempo promedio de espera en la cola',
        generalFormulaLatex: 'W_q = \\frac{L_q}{λ}',
        substitutedFormulaText: WqHours !== null ? `Wq = ${lqStr} / ${lStr}` : unstableTxt,
        resultFormatted:
          WqHours !== null
            ? `${formatNum(WqHours * 60, 2)} min (${wqHStr} h)`
            : unstableTxt,
      },
      W: {
        indicator: 'W',
        symbol: 'W',
        name: 'Tiempo promedio total en el sistema',
        generalFormulaLatex: 'W = W_q + \\frac{1}{μ}',
        substitutedFormulaText: WHours !== null ? `W = ${wqHStr} + (1 / ${mStr})` : unstableTxt,
        resultFormatted:
          WHours !== null
            ? `${formatNum(WHours * 60, 2)} min (${formatNum(WHours, 4)} h)`
            : unstableTxt,
      },
      Pn: {
        indicator: 'Pn',
        symbol: `P${n}`,
        name: `Probabilidad de exactamente n = ${n} pacientes`,
        generalFormulaLatex:
          n < s
            ? 'P_n = \\frac{(λ/μ)^n}{n!} P_0 \\quad (n < s)'
            : 'P_n = \\frac{(λ/μ)^n}{s! \\cdot s^{n-s}} P_0 \\quad (n ≥ s)',
        substitutedFormulaText:
          Pn !== null
            ? n < s
              ? `P_${n} = [(${rStr})^${n} / ${n}!] × ${p0Str}`
              : `P_${n} = [(${rStr})^${n} / (${s}! × ${s}^(${n - s}))] × ${p0Str}`
            : unstableTxt,
        resultFormatted: Pn !== null ? `${formatNum(Pn, 4)} (${formatNum(Pn * 100, 2)} %)` : unstableTxt,
      },
    };
  }
}

