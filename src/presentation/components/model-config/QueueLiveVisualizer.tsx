import React, { useEffect, useState } from 'react';
import { Activity, Pause, Play, Users } from 'lucide-react';
import { formatNum } from '../../../domain/services/QueueCalculatorCommon';

interface QueueLiveVisualizerProps {
  lambdaPerHour: number;
  muPerHour: number;
  servers: number;
  isStable: boolean;
  rho: number;
}

interface SimPatient {
  id: number;
  triageColor: string;
}

const TRIAGE_COLORS = ['#f59e0b', '#10b981', '#06b6d4', '#f97316'];

/**
 * Interactive real-time visual simulation of the emergency waiting room queue (HU-17.3):
 * Shows patients arriving proportionally to λ and being attended by s servers proportionally to μ.
 */
export const QueueLiveVisualizer: React.FC<QueueLiveVisualizerProps> = ({
  lambdaPerHour,
  muPerHour,
  servers,
  isStable,
  rho,
}) => {
  const [running, setRunning] = useState(true);
  const [waitingQueue, setWaitingQueue] = useState<SimPatient[]>([
    { id: 1, triageColor: '#f59e0b' },
    { id: 2, triageColor: '#10b981' },
  ]);
  const [busyServers, setBusyServers] = useState<boolean[]>(() =>
    Array.from({ length: Math.min(8, servers) }, (_, i) => i < Math.ceil(servers * Math.min(1, rho)))
  );
  const [servedCount, setServedCount] = useState(14);

  useEffect(() => {
    setBusyServers(
      Array.from({ length: Math.min(8, servers) }, (_, i) =>
        i < Math.ceil(Math.min(8, servers) * Math.min(1, rho))
      )
    );
  }, [servers, rho]);

  useEffect(() => {
    if (!running) return;
    // Proportional arrival interval (scaled for smooth UI animation)
    const arrivalMs = Math.max(450, Math.min(3500, Math.round(18000 / Math.max(1, lambdaPerHour))));
    const serviceMs = Math.max(
      450,
      Math.min(3500, Math.round(18000 / Math.max(1, muPerHour * servers)))
    );

    const arrTimer = setInterval(() => {
      setWaitingQueue((prev) => {
        if (prev.length >= 16) return prev;
        const nextId = Date.now() + Math.floor(Math.random() * 1000);
        const color = TRIAGE_COLORS[nextId % TRIAGE_COLORS.length];
        return [...prev, { id: nextId, triageColor: color }];
      });
    }, arrivalMs);

    const srvTimer = setInterval(() => {
      setWaitingQueue((prev) => {
        if (prev.length === 0) return prev;
        setServedCount((c) => c + 1);
        return prev.slice(1);
      });
      setBusyServers((prev) =>
        prev.map((_, idx) =>
          isStable ? idx < Math.max(1, Math.round(prev.length * rho)) : true
        )
      );
    }, serviceMs);

    return () => {
      clearInterval(arrTimer);
      clearInterval(srvTimer);
    };
  }, [running, lambdaPerHour, muPerHour, servers, isStable, rho]);

  const visibleServers = Math.min(8, Math.max(1, servers));

  return (
    <div className="bg-gradient-to-r from-slate-900 via-[#001E62] to-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-md border border-blue-800/60">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-cyan-300 animate-pulse" />
          <div>
            <h4 className="text-sm sm:text-base font-bold">
              Simulación Visual en Vivo de la Sala de Urgencias (HU-17.3)
            </h4>
            <p className="text-[11px] text-blue-200">
              Velocidad proporcional a λ = {formatNum(lambdaPerHour, 2)} pac/h y s·μ ={' '}
              {formatNum(servers * muPerHour, 2)} pac/h ({servers}{' '}
              {servers === 1 ? 'servidor' : 'servidores'})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs bg-white/10 px-2.5 py-1 rounded-lg text-cyan-200">
            Atendidos (demo): <strong>{servedCount}</strong>
          </span>
          <button
            type="button"
            onClick={() => setRunning(!running)}
            className="flex items-center gap-1 bg-white/15 hover:bg-white/25 text-xs font-bold px-2.5 py-1.5 rounded-lg"
          >
            {running ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{running ? 'Pausar' : 'Reanudar'}</span>
          </button>
        </div>
      </div>

      {/* Animated Flow Diagram */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center bg-slate-950/50 rounded-xl p-3.5 border border-white/10">
        {/* Arrivals */}
        <div className="md:col-span-3 flex flex-col items-center justify-center p-2 bg-white/5 rounded-xl border border-white/10">
          <span className="text-[11px] uppercase tracking-wider text-cyan-300 font-bold">
            Entrada (Poisson)
          </span>
          <p className="text-sm font-extrabold mt-0.5">λ = {formatNum(lambdaPerHour, 2)} /h</p>
          <div className="mt-2 flex items-center gap-1 text-xs text-blue-200">
            <Users className="w-4 h-4 text-cyan-400" />
            <span>1 pac cada {formatNum(60 / Math.max(0.1, lambdaPerHour), 1)} min</span>
          </div>
        </div>

        {/* Waiting Queue FIFO */}
        <div className="md:col-span-5 flex flex-col justify-center p-3 bg-white/5 rounded-xl border border-white/10 min-h-[88px]">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-bold text-amber-300">Fila de Espera (Disciplina FIFO)</span>
            <span className="text-[11px] bg-white/10 px-2 py-0.5 rounded-full">
              {waitingQueue.length} en espera visual
            </span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap min-h-[32px]">
            {waitingQueue.length === 0 ? (
              <span className="text-xs text-emerald-300 italic">
                Sala de espera libre — atención inmediata
              </span>
            ) : (
              waitingQueue.map((p) => (
                <div
                  key={p.id}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-extrabold text-slate-950 shadow transition-transform animate-bounce"
                  style={{ backgroundColor: p.triageColor }}
                  title="Paciente en cola"
                >
                  P
                </div>
              ))
            )}
          </div>
          {!isStable && (
            <span className="mt-1.5 text-[11px] text-rose-300 font-semibold">
              ⚠️ Sistema saturado (ρ ≥ 1): la fila se acumula indefinidamente
            </span>
          )}
        </div>

        {/* Parallel Servers */}
        <div className="md:col-span-4 flex flex-col justify-center p-3 bg-white/5 rounded-xl border border-white/10">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-bold text-emerald-300">
              Consultorios / Servidores (s = {servers})
            </span>
            <span className="text-[11px] text-blue-200">μ = {formatNum(muPerHour, 2)} /h c/u</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {Array.from({ length: visibleServers }).map((_, idx) => {
              const busy = busyServers[idx] ?? true;
              return (
                <div
                  key={idx}
                  className={`p-1.5 rounded-lg border text-center transition-all ${
                    busy
                      ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-200'
                      : 'bg-slate-800/60 border-slate-700 text-slate-400'
                  }`}
                >
                  <div className="text-[10px] font-bold">Puesto #{idx + 1}</div>
                  <div className="text-[9px] mt-0.5">{busy ? 'Atendiendo' : 'Libre'}</div>
                </div>
              );
            })}
          </div>
          {servers > 8 && (
            <span className="text-[10px] text-blue-200 mt-1 text-center">
              + {servers - 8} servidores adicionales activos
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

