import React from 'react';
import { Award, DollarSign, Info } from 'lucide-react';
import { formatNum } from '../../../domain/services/QueueCalculatorCommon';
import { useApp } from '../../context/AppContext';

export const CostAnalysisPanel: React.FC = () => {
  const {
    costPerServerHourCOP,
    setCostPerServerHourCOP,
    costPerPatientWaitHourCOP,
    setCostPerPatientWaitHourCOP,
    costBasis,
    setCostBasis,
    costAnalysis,
    updateParams,
  } = useApp();

  const formatCOP = (val: number | null): string => {
    if (val === null || Number.isNaN(val)) return 'Inestable';
    return `$ ${Math.round(val).toLocaleString('es-CO')} COP`;
  };

  const maxCost = Math.max(
    ...costAnalysis.points.map((p) => p.totalCostPerHourCOP || 0),
    1
  );

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm space-y-5">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full">
            HU-13 • Rentabilidad y Número Óptimo de Servidores (COP)
          </span>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-1.5">
            Optimización Económica: Costo de Capacidad vs. Costo de Espera
          </h3>
          <p className="text-xs sm:text-sm text-slate-600">
            Ingrese el costo horario por servidor (Cₛ) y el costo horario de espera por paciente
            (C_w) en pesos colombianos (COP) para hallar el número de servidores <strong>s*</strong>{' '}
            que minimiza el costo total por hora.
          </p>
        </div>

        {/* Inputs in COP with thousands separators (HU-13.1 & HU-13.3) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Costo por hora de 1 servidor Cₛ (COP/h)
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-xs font-bold text-slate-500">$</span>
              <input
                type="number"
                step={2000}
                min={0}
                value={costPerServerHourCOP}
                onChange={(e) => setCostPerServerHourCOP(Math.max(0, Number(e.target.value) || 0))}
                className="w-full rounded-xl border border-slate-300 pl-7 pr-14 py-2 text-sm font-extrabold text-slate-900"
              />
              <span className="absolute right-3 text-[11px] font-bold text-slate-500">COP/h</span>
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Formato: {formatCOP(costPerServerHourCOP)} / hora
            </span>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Costo por hora de espera del paciente C_w (COP/h)
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-xs font-bold text-slate-500">$</span>
              <input
                type="number"
                step={2000}
                min={0}
                value={costPerPatientWaitHourCOP}
                onChange={(e) =>
                  setCostPerPatientWaitHourCOP(Math.max(0, Number(e.target.value) || 0))
                }
                className="w-full rounded-xl border border-slate-300 pl-7 pr-14 py-2 text-sm font-extrabold text-slate-900"
              />
              <span className="absolute right-3 text-[11px] font-bold text-slate-500">COP/h</span>
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Formato: {formatCOP(costPerPatientWaitHourCOP)} / hora
            </span>
          </div>

          {/* Formula Basis Selector (HU-13.1) */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col justify-between">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Fórmula de Costo Total Horario (HU-13.1):
            </label>
            <div className="grid grid-cols-2 gap-1.5 bg-slate-200/70 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setCostBasis('system_L')}
                className={`py-1.5 px-2 rounded-md text-xs font-bold transition-all ${
                  costBasis === 'system_L'
                    ? 'bg-white text-[#0033A0] shadow-sm'
                    : 'text-slate-600'
                }`}
              >
                s·Cₛ + L·C_w
              </button>
              <button
                type="button"
                onClick={() => setCostBasis('queue_Lq')}
                className={`py-1.5 px-2 rounded-md text-xs font-bold transition-all ${
                  costBasis === 'queue_Lq'
                    ? 'bg-white text-[#0033A0] shadow-sm'
                    : 'text-slate-600'
                }`}
              >
                s·Cₛ + Lq·C_w
              </button>
            </div>
            <span className="text-[11px] text-slate-500 mt-1">
              {costBasis === 'system_L'
                ? 'Evalúa el tiempo total del paciente en el sistema (L)'
                : 'Evalúa únicamente el tiempo de espera en la fila (Lq)'}
            </span>
          </div>
        </div>

        {/* Optimal Result Banner */}
        {costAnalysis.optimalServers !== null && (
          <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-800 text-white rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
                <Award className="w-7 h-7 text-amber-300" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">
                  Punto Óptimo Económico Identificado
                </span>
                <h4 className="text-lg sm:text-xl font-extrabold">
                  Óptimo: s* = {costAnalysis.optimalServers} servidores — Costo mínimo:{' '}
                  {formatCOP(costAnalysis.minTotalCostPerHourCOP)} / hora
                </h4>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                updateParams({ model: 'MMS', servers: costAnalysis.optimalServers! })
              }
              className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow self-start sm:self-center shrink-0"
            >
              Aplicar s = {costAnalysis.optimalServers} al Modelo
            </button>
          </div>
        )}

        {/* Visual Bar Chart of Total Cost (HU-13.2) */}
        <div className="space-y-2">
          <h4 className="text-xs sm:text-sm font-bold text-slate-800">
            Gráfica de Costo Total por Hora para s = {costAnalysis.points[0]?.servers} …{' '}
            {costAnalysis.points[costAnalysis.points.length - 1]?.servers}
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-7 gap-2.5 pt-2">
            {costAnalysis.points.map((pt) => {
              const total = pt.totalCostPerHourCOP || 0;
              const barPct = Math.max(10, (total / maxCost) * 100);
              return (
                <div
                  key={pt.servers}
                  className={`rounded-xl border p-3 flex flex-col items-center justify-between ${
                    pt.isOptimal
                      ? 'border-emerald-500 bg-emerald-50/70 ring-2 ring-emerald-400 shadow-sm'
                      : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <div className="text-center mb-2">
                    <span className="text-xs font-extrabold text-slate-900 block">
                      s = {pt.servers}
                    </span>
                    {pt.isOptimal && (
                      <span className="text-[10px] font-extrabold bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                        ÓPTIMO
                      </span>
                    )}
                  </div>

                  <div className="h-28 w-full flex items-end justify-center bg-white rounded-lg p-2 border border-slate-100">
                    <div
                      className={`w-10 rounded-t-md transition-all ${
                        pt.isOptimal ? 'bg-emerald-600' : 'bg-[#0033A0]/80'
                      }`}
                      style={{ height: `${barPct}%` }}
                    />
                  </div>

                  <div className="mt-2 text-center">
                    <span className="text-[11px] font-extrabold text-slate-900 block">
                      $ {Math.round(total).toLocaleString('es-CO')}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Espera: {formatNum(pt.WqMin, 1)} min
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cost Table (HU-13.2) */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="py-2.5 px-3 font-bold">Servidores (s)</th>
                <th className="py-2.5 px-3 font-bold">Ocupación (ρ)</th>
                <th className="py-2.5 px-3 font-bold">
                  {costBasis === 'system_L' ? 'Pacientes (L)' : 'Cola (Lq)'}
                </th>
                <th className="py-2.5 px-3 font-bold">Costo Servidores (s·Cₛ)</th>
                <th className="py-2.5 px-3 font-bold">
                  Costo Espera ({costBasis === 'system_L' ? 'L·C_w' : 'Lq·C_w'})
                </th>
                <th className="py-2.5 px-3 font-bold">Costo Total / Hora (COP)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {costAnalysis.points.map((pt) => (
                <tr
                  key={pt.servers}
                  className={
                    pt.isOptimal ? 'bg-emerald-50 font-bold text-emerald-950' : 'hover:bg-slate-50'
                  }
                >
                  <td className="py-2 px-3">
                    s = {pt.servers}{' '}
                    {pt.isOptimal && (
                      <span className="ml-1.5 text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                        ÓPTIMO
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-3">{formatNum(pt.rho * 100, 1)} %</td>
                  <td className="py-2 px-3">
                    {formatNum(costBasis === 'system_L' ? pt.L : pt.Lq, 3)} pac
                  </td>
                  <td className="py-2 px-3">{formatCOP(pt.serverCostPerHourCOP)}</td>
                  <td className="py-2 px-3">{formatCOP(pt.waitingCostPerHourCOP)}</td>
                  <td className="py-2 px-3 font-extrabold">{formatCOP(pt.totalCostPerHourCOP)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Methodological Note (HU-13.4) */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <span>
            <strong>Nota metodológica (HU-13.4):</strong> Los valores de Cₛ y C_w son editables por
            el equipo según la estructura salarial del personal médico/admisiones de urgencias y el
            costo de oportunidad / penalización por congestión hospitalaria.
          </span>
        </div>
      </div>
    </div>
  );
};

