import React from 'react';
import { BarChart3, TrendingDown } from 'lucide-react';
import { formatNum } from '../../../domain/services/QueueCalculatorCommon';
import { useApp } from '../../context/AppContext';

export const SystemChartsPanel: React.FC = () => {
  const { currentResult, params, updateParams, timeUnit } = useApp();

  const maxProb = Math.max(
    ...currentResult.pnDistribution.map((p) => p.probability),
    0.05
  );

  const stableSensitivity = currentResult.sensitivitySeries.filter(
    (s) => s.isStable && s.WqMin !== null && s.Lq !== null
  );
  const maxWq = Math.max(
    ...stableSensitivity.map((s) =>
      timeUnit === 'min' ? s.WqMin || 0 : (s.WqMin || 0) / 60
    ),
    0.1
  );
  const maxLq = Math.max(...stableSensitivity.map((s) => s.Lq || 0), 0.1);

  return (
    <div className="space-y-5">
      {/* Chart 1: Pn Distribution (HU-11.1) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full">
              HU-11.1 • Distribución de Probabilidad de Estados
            </span>
            <h4 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
              Probabilidad Pₙ de Encontrar n Pacientes en el Sistema (n = 0 … {params.maxChartN})
            </h4>
          </div>

          <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl">
            <label className="text-xs font-bold text-slate-700">Máximo N:</label>
            <input
              type="number"
              min={5}
              max={40}
              value={params.maxChartN}
              onChange={(e) =>
                updateParams({
                  maxChartN: Math.max(5, Math.min(40, Number(e.target.value) || 15)),
                })
              }
              className="w-16 rounded-lg border border-slate-300 px-2 py-1 text-xs font-bold text-[#0033A0]"
            />
          </div>
        </div>

        {!currentResult.isStable ? (
          <div className="p-6 rounded-xl bg-red-50 border border-red-200 text-center text-red-800 text-sm font-medium">
            El sistema actual es inestable (ρ = {formatNum(currentResult.rho, 2)} ≥ 1). No existe
            distribución estacionaria Pₙ hasta que s ≥ {currentResult.minStableServers}.
          </div>
        ) : (
          <div className="space-y-3">
            <div className="overflow-x-auto pb-2">
              <div className="min-w-[520px] h-56 bg-slate-50 rounded-xl border border-slate-200 p-4 flex items-end gap-1.5">
                {currentResult.pnDistribution.map((pt) => {
                  const pctHeight = Math.max(3, (pt.probability / maxProb) * 100);
                  const isTargetN = pt.n === params.targetN;
                  return (
                    <div
                      key={pt.n}
                      className="flex-1 flex flex-col items-center justify-end h-full gap-1"
                    >
                      <span className="text-[10px] font-bold text-slate-700">
                        {(pt.probability * 100).toFixed(1)}%
                      </span>
                      <div
                        className={`w-full rounded-t-md transition-all ${
                          isTargetN
                            ? 'bg-cyan-500 ring-2 ring-cyan-300'
                            : 'bg-[#0033A0] hover:bg-blue-700'
                        }`}
                        style={{ height: `${pctHeight}%` }}
                        title={`P(${pt.n}) = ${(pt.probability * 100).toFixed(2)}% | Acumulado = ${(
                          pt.cumulative * 100
                        ).toFixed(1)}%`}
                      />
                      <span
                        className={`text-[10px] font-semibold ${
                          isTargetN ? 'text-cyan-700 font-extrabold' : 'text-slate-600'
                        }`}
                      >
                        n={pt.n}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 px-1">
              <span>Eje X: Número de pacientes en el sistema (n)</span>
              <span>Eje Y: Probabilidad estacionaria Pₙ (%)</span>
            </div>
          </div>
        )}
      </div>

      {/* Chart 2: Wq and Lq vs Number of Servers s (HU-11.2) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full">
              HU-11.2 • Curva de Sensibilidad Operativa
            </span>
            <h4 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
              Impacto del Número de Servidores (s = {currentResult.minStableServers} …{' '}
              {currentResult.minStableServers + 4}) sobre Wq y Lq
            </h4>
          </div>
          <div className="flex items-center gap-3 text-xs font-bold">
            <span className="inline-flex items-center gap-1.5 text-[#0033A0]">
              <span className="w-3 h-3 rounded-sm bg-[#0033A0] inline-block" />
              Espera en cola Wq ({timeUnit === 'min' ? 'min' : 'horas'})
            </span>
            <span className="inline-flex items-center gap-1.5 text-cyan-600">
              <span className="w-3 h-3 rounded-sm bg-cyan-500 inline-block" />
              Pacientes en fila Lq (pac)
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {stableSensitivity.map((pt) => {
            const wqVal =
              timeUnit === 'min' ? pt.WqMin || 0 : (pt.WqMin || 0) / 60;
            const lqVal = pt.Lq || 0;
            const wqBarPct = Math.max(6, (wqVal / maxWq) * 100);
            const lqBarPct = Math.max(6, (lqVal / maxLq) * 100);
            const isCurrent = pt.servers === currentResult.servers;

            return (
              <div
                key={pt.servers}
                onClick={() => updateParams({ model: 'MMS', servers: pt.servers })}
                className={`cursor-pointer rounded-xl border p-3.5 transition-all flex flex-col justify-between ${
                  isCurrent
                    ? 'border-[#0033A0] bg-blue-50/50 shadow-sm ring-1 ring-[#0033A0]'
                    : 'border-slate-200 bg-slate-50 hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-extrabold text-sm text-slate-900">
                    s = {pt.servers} serv.
                  </span>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      pt.rho > 0.85
                        ? 'bg-red-100 text-red-800'
                        : pt.rho >= 0.7
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    ρ = {formatNum(pt.rho * 100, 1)}%
                  </span>
                </div>

                {/* Vertical Twin Bars */}
                <div className="h-32 flex items-end justify-center gap-4 bg-white rounded-lg p-2.5 border border-slate-100">
                  <div className="flex flex-col items-center justify-end h-full w-10">
                    <span className="text-[10px] font-bold text-[#0033A0] mb-1">
                      {formatNum(wqVal, 2)}
                    </span>
                    <div
                      className="w-full bg-[#0033A0] rounded-t-md"
                      style={{ height: `${wqBarPct}%` }}
                    />
                  </div>
                  <div className="flex flex-col items-center justify-end h-full w-10">
                    <span className="text-[10px] font-bold text-cyan-700 mb-1">
                      {formatNum(lqVal, 2)}
                    </span>
                    <div
                      className="w-full bg-cyan-500 rounded-t-md"
                      style={{ height: `${lqBarPct}%` }}
                    />
                  </div>
                </div>

                <div className="mt-2.5 text-[11px] text-slate-600 space-y-0.5">
                  <div className="flex justify-between">
                    <span>Espera (Wq):</span>
                    <strong className="text-slate-900">
                      {formatNum(wqVal, 2)} {timeUnit === 'min' ? 'min' : 'h'}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Cola (Lq):</span>
                    <strong className="text-slate-900">{formatNum(lqVal, 3)} pac</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Prob. esperar (Pw):</span>
                    <strong className="text-slate-900">
                      {formatNum((pt.Pw || 0) * 100, 1)}%
                    </strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-950 flex items-center gap-2">
          <TrendingDown className="w-4 h-4 text-blue-700 shrink-0" />
          <span>
            Observe el efecto no lineal de la teoría de colas: al pasar de{' '}
            <strong>s = {currentResult.minStableServers}</strong> a{' '}
            <strong>s = {currentResult.minStableServers + 1}</strong> servidores, el tiempo de
            espera en cola cae drásticamente. Toque cualquier tarjeta para aplicar ese valor de s.
          </span>
        </div>
      </div>
    </div>
  );
};

