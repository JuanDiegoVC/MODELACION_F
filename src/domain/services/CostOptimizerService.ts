import { QueueParameters } from '../entities/QueueParameters';
import { CostAnalysisResult, CostBasisType, CostPoint } from '../entities/Scenario';
import { MMSCalculator } from './MMSCalculator';
import { computeMinStableServers } from './QueueCalculatorCommon';

export class CostOptimizerService {
  private static readonly mms = new MMSCalculator();

  /**
   * Computes total hourly cost CT(s) = s * Cs + (L or Lq) * Cw
   * for s = minStable .. minStable + 6 and identifies the optimal s*.
   */
  public static analyzeCosts(
    baseParams: QueueParameters,
    costPerServerHourCOP: number,
    costPerPatientWaitHourCOP: number,
    basis: CostBasisType
  ): CostAnalysisResult {
    const minStable = computeMinStableServers(baseParams.lambdaPerHour, baseParams.muPerHour);
    const points: CostPoint[] = [];

    let minCost = Infinity;
    let optimalServers: number | null = null;

    for (let s = minStable; s <= minStable + 6; s++) {
      if (s > 60) break;
      const calc = this.mms.calculate({ ...baseParams, model: 'MMS', servers: s }, false);
      const serverCost = s * costPerServerHourCOP;

      let waitingCost: number | null = null;
      let totalCost: number | null = null;

      if (calc.isStable && calc.L !== null && calc.Lq !== null) {
        const patientMetric = basis === 'system_L' ? calc.L : calc.Lq;
        waitingCost = patientMetric * costPerPatientWaitHourCOP;
        totalCost = serverCost + waitingCost;

        if (totalCost < minCost) {
          minCost = totalCost;
          optimalServers = s;
        }
      }

      points.push({
        servers: s,
        isStable: calc.isStable,
        rho: calc.rho,
        L: calc.L,
        Lq: calc.Lq,
        WqMin: calc.WqMin,
        serverCostPerHourCOP: serverCost,
        waitingCostPerHourCOP: waitingCost,
        totalCostPerHourCOP: totalCost,
        isOptimal: false,
      });
    }

    for (const pt of points) {
      if (optimalServers !== null && pt.servers === optimalServers) {
        pt.isOptimal = true;
      }
    }

    return {
      costPerServerHourCOP,
      costPerPatientWaitHourCOP,
      basis,
      points,
      optimalServers,
      minTotalCostPerHourCOP: optimalServers !== null ? minCost : null,
    };
  }
}

