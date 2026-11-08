import { EquationDetail, IndicatorKey, PnPoint, QueueCalculationResult, ServerSensitivityPoint } from '../entities/QueueResults';
import { QueueParameters } from '../entities/QueueParameters';

export interface IQueueCalculator {
  calculate(params: QueueParameters, includeSensitivity?: boolean): QueueCalculationResult;
}

export function formatNum(val: number | null | undefined, decimals = 4): string {
  if (val === null || val === undefined || Number.isNaN(val)) return '—';
  return val.toLocaleString('es-CO', {
    minimumFractionDigits: Math.min(2, decimals),
    maximumFractionDigits: decimals,
  });
}

export function computeMinStableServers(lambdaPerHour: number, muPerHour: number): number {
  if (muPerHour <= 0) return 1;
  const r = lambdaPerHour / muPerHour;
  return Math.floor(r) + 1;
}

export function buildInterpretations(
  res: {
    isStable: boolean;
    rho: number;
    servers: number;
    P0: number | null;
    Lq: number | null;
    L: number | null;
    WqMin: number | null;
    WMin: number | null;
    Pw: number | null;
    Pn: number | null;
    targetN: number;
  }
): Record<IndicatorKey, string> {
  if (!res.isStable) {
    const msg = `Sistema inestable (ρ = ${formatNum(res.rho, 2)} ≥ 1): la tasa de llegada supera la capacidad máxima de atención.`;
    return {
      rho: msg,
      P0: msg,
      L: msg,
      Lq: msg,
      W: msg,
      Wq: msg,
      Pw: msg,
      Pn: msg,
    };
  }

  const rhoPct = formatNum(res.rho * 100, 2);
  const p0Pct = formatNum((res.P0 ?? 0) * 100, 2);
  const pwPct = formatNum((res.Pw ?? 0) * 100, 2);
  const pnPct = formatNum((res.Pn ?? 0) * 100, 2);

  return {
    rho: `Cada puesto de atención está ocupado el ${rhoPct} % del tiempo (${res.servers === 1 ? '1 servidor' : `${res.servers} servidores`}).`,
    P0: `Hay un ${p0Pct} % de probabilidad de encontrar la sala de urgencias completamente vacía (0 pacientes).`,
    Lq: `En promedio hay ${formatNum(res.Lq, 3)} pacientes esperando en la fila antes de pasar a consulta.`,
    L: `En promedio hay ${formatNum(res.L, 3)} pacientes en total en urgencias (en fila más siendo atendidos).`,
    Wq: `Un paciente espera en promedio ${formatNum(res.WqMin, 2)} minutos en la sala de espera antes de ser atendido.`,
    W: `Un paciente permanece en promedio ${formatNum(res.WMin, 2)} minutos en total en urgencias (espera + atención).`,
    Pw: `Un paciente que llega tiene un ${pwPct} % de probabilidad de tener que esperar en fila (todos los servidores ocupados).`,
    Pn: `La probabilidad de que haya exactamente n = ${res.targetN} pacientes en el sistema es del ${pnPct} %.`,
  };
}

export function buildExecutiveConclusion(
  res: {
    isStable: boolean;
    model: string;
    servers: number;
    rho: number;
    minStableServers: number;
    WqMin: number | null;
    WMin: number | null;
    Lq: number | null;
    Pw: number | null;
  }
): string {
  if (!res.isStable) {
    return `ALERTA DE INESTABILIDAD: Con el modelo ${res.model} y s = ${res.servers} servidor(es), el factor de utilización es ρ = ${formatNum(res.rho, 2)} (${formatNum(res.rho * 100, 1)} %). Como llegan más pacientes de los que el sistema puede atender (ρ ≥ 1), la cola crece sin límite. Se requiere un mínimo de s = ${res.minStableServers} servidores en paralelo para estabilizar el proceso, recomendándose s = ${res.minStableServers + 1} para tiempos de espera hospitalarios aceptables.`;
  }

  const rhoPct = res.rho * 100;
  let nivelOcupacion = 'óptimo y holgado (< 70 %)';
  if (rhoPct > 85) {
    nivelOcupacion = 'crítico (> 85 %), con alto riesgo de congestión ante picos de demanda';
  } else if (rhoPct >= 70) {
    nivelOcupacion = 'moderado-alto (70 %–85 %), en equilibrio operativo';
  }

  return `El sistema de urgencias bajo el modelo ${res.model === 'MM1' ? 'M/M/1' : `M/M/${res.servers}`} opera al ${formatNum(rhoPct, 2)} % de ocupación, un nivel ${nivelOcupacion}. Un paciente espera en promedio ${formatNum(res.WqMin, 2)} min en cola (Wq) y permanece ${formatNum(res.WMin, 2)} min en total en el servicio (W), con una fila media de ${formatNum(res.Lq, 2)} pacientes y una probabilidad de espera del ${formatNum((res.Pw ?? 0) * 100, 1)} %.`;
}

