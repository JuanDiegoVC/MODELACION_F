import React from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Calculator,
  CheckSquare,
  Lightbulb,
  Server,
  Square,
  UserCheck,
} from 'lucide-react';
import { IndicatorKey } from '../../../domain/entities/QueueParameters';
import { formatNum } from '../../../domain/services/QueueCalculatorCommon';
import { useApp } from '../../context/AppContext';
import { QueueLiveVisualizer } from './QueueLiveVisualizer';

const INDICATOR_META: { key: IndicatorKey; symbol: string; label: string; desc: string }[] = [
  {
    key: 'rho',
    symbol: 'ρ',
    label: 'Factor de utilización (ρ)',
    desc: 'Porcentaje de ocupación de los servidores',
  },
  {
    key: 'P0',
    symbol: 'P₀',
    label: 'Probabilidad de sistema vacío (P₀)',
    desc: 'Probabilidad de 0 pacientes en urgencias',
  },
  {
    key: 'Lq',
    symbol: 'Lq',
    label: 'Pacientes promedio en cola (Lq)',
    desc: 'Longitud media de la fila de espera',
  },
  {
    key: 'L',
    symbol: 'L',
    label: 'Pacientes promedio en el sistema (L)',
    desc: 'Pacientes en cola + pacientes siendo atendidos',
  },
  {
    key: 'Wq',
    symbol: 'Wq',
    label: 'Tiempo promedio en cola (Wq)',
    desc: 'Espera promedio antes de pasar a consulta',
  },
  {
    key: 'W',
    symbol: 'W',
    label: 'Tiempo promedio en el sistema (W)',
    desc: 'Tiempo total en urgencias (espera + atención)',
  },
  {
    key: 'Pw',
    symbol: 'Pw',
    label: 'Probabilidad de espera (Pw / Erlang C)',
    desc: 'Probabilidad de encontrar todos los puestos ocupados',
  },
  {
    key: 'Pn',
    symbol: 'Pn',
    label: 'Probabilidad de exactamente n pacientes (Pn)',
    desc: 'Para un valor n elegido por el usuario',
  },
];

export const ModelSelectionView: React.FC = () => {
  const {
    params,
    updateParams,
    updateIndicators,
    currentResult,
    runCalculationAndAdvance,
    setActiveStep,
  } = useApp();

  const selectedCount = Object.values(params.selectedIndicators).filter(Boolean).length;
  const r = currentResult.trafficIntensityR;
  const minStableS = currentResult.minStableServers;

  const toggleAllIndicators = (val: boolean) => {
    updateIndicators({
      rho: val,
      P0: val,
      L: val,
      Lq: val,
      W: val,
      Wq: val,
      Pw: val,
      Pn: val,
    });
  };

  return (
    <div className="space-y-5">
      {/* Live Queue Animation (HU-17.3) */}
      <QueueLiveVisualizer
        lambdaPerHour={params.lambdaPerHour}
        muPerHour={params.muPerHour}
        servers={params.model === 'MM1' ? 1 : params.servers}
        isStable={currentResult.isStable}
        rho={currentResult.rho}
      />

      {/* Model Selector Cards (HU-05.1) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm space-y-5">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full">
            HU-05 • Selección del Modelo de Teoría de Colas
          </span>
          <h3 className="text-lg font-bold text-slate-900 mt-1.5">
            Seleccione la Arquitectura de Atención (M/M/1 o M/M/S)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card M/M/1 */}
          <div
            onClick={() => updateParams({ model: 'MM1', servers: 1 })}
            className={`cursor-pointer rounded-2xl border-2 p-4 transition-all ${
              params.model === 'MM1'
                ? 'border-[#0033A0] bg-blue-50/40 shadow-md'
                : 'border-slate-200 hover:border-blue-300 bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-[#0033A0]" />
                <span className="font-extrabold text-base sm:text-lg text-slate-900">
                  Modelo M/M/1 (Un Servidor)
                </span>
              </div>
              <span
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  params.model === 'MM1' ? 'border-[#0033A0] bg-[#0033A0]' : 'border-slate-300'
                }`}
              >
                {params.model === 'MM1' && <span className="w-2 h-2 rounded-full bg-white" />}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 mb-3">
              Una única fila de espera atendida por un solo consultorio o puesto de registro (s = 1).
            </p>

            {/* SVG diagram representing 1 queue -> 1 server (HU-05.1) */}
            <svg
              viewBox="0 0 320 75"
              className="w-full h-16 bg-slate-50 rounded-xl border border-slate-200 p-1.5"
            >
              <text x="10" y="22" fontSize="9" fill="#475569" fontWeight="bold">
                Llegadas (λ)
              </text>
              <line x1="12" y1="38" x2="68" y2="38" stroke="#0033A0" strokeWidth="2" />
              <polygon points="68,34 76,38 68,42" fill="#0033A0" />
              {/* Queue circles */}
              <rect
                x="82"
                y="22"
                width="96"
                height="32"
                rx="6"
                fill="#e2e8f0"
                stroke="#94a3b8"
              />
              <circle cx="100" cy="38" r="8" fill="#0284c7" />
              <circle cx="122" cy="38" r="8" fill="#0284c7" />
              <circle cx="144" cy="38" r="8" fill="#0284c7" />
              <circle cx="164" cy="38" r="8" fill="#0033A0" />
              <line x1="180" y1="38" x2="215" y2="38" stroke="#0033A0" strokeWidth="2" />
              <polygon points="215,34 223,38 215,42" fill="#0033A0" />
              {/* Single Server */}
              <rect
                x="228"
                y="18"
                width="76"
                height="40"
                rx="8"
                fill="#0033A0"
              />
              <text x="266" y="36" textAnchor="middle" fontSize="10" fill="#ffffff" fontWeight="bold">
                Servidor 1
              </text>
              <text x="266" y="49" textAnchor="middle" fontSize="8.5" fill="#bae6fd">
                Tasa μ
              </text>
            </svg>
          </div>

          {/* Card M/M/S */}
          <div
            onClick={() =>
              updateParams({
                model: 'MMS',
                servers: params.servers < 2 ? Math.max(3, minStableS + 1) : params.servers,
              })
            }
            className={`cursor-pointer rounded-2xl border-2 p-4 transition-all ${
              params.model === 'MMS'
                ? 'border-[#0033A0] bg-blue-50/40 shadow-md'
                : 'border-slate-200 hover:border-blue-300 bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Server className="w-5 h-5 text-[#0033A0]" />
                <span className="font-extrabold text-base sm:text-lg text-slate-900">
                  Modelo M/M/S (Múltiples Servidores)
                </span>
              </div>
              <span
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  params.model === 'MMS' ? 'border-[#0033A0] bg-[#0033A0]' : 'border-slate-300'
                }`}
              >
                {params.model === 'MMS' && <span className="w-2 h-2 rounded-full bg-white" />}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 mb-3">
              Una fila común de urgencias atendida por S consultorios o médicos en paralelo (Erlang-C).
            </p>

            {/* SVG diagram representing 1 queue -> S parallel servers (HU-05.1) */}
            <svg
              viewBox="0 0 320 75"
              className="w-full h-16 bg-slate-50 rounded-xl border border-slate-200 p-1.5"
            >
              <text x="10" y="22" fontSize="9" fill="#475569" fontWeight="bold">
                Llegadas (λ)
              </text>
              <line x1="12" y1="38" x2="62" y2="38" stroke="#0033A0" strokeWidth="2" />
              <polygon points="62,34 70,38 62,42" fill="#0033A0" />
              <rect
                x="74"
                y="22"
                width="90"
                height="32"
                rx="6"
                fill="#e2e8f0"
                stroke="#94a3b8"
              />
              <circle cx="92" cy="38" r="8" fill="#0284c7" />
              <circle cx="116" cy="38" r="8" fill="#0284c7" />
              <circle cx="142" cy="38" r="8" fill="#0033A0" />
              {/* Branches to S servers */}
              <line x1="166" y1="38" x2="215" y2="16" stroke="#0033A0" strokeWidth="1.8" />
              <line x1="166" y1="38" x2="215" y2="38" stroke="#0033A0" strokeWidth="1.8" />
              <line x1="166" y1="38" x2="215" y2="60" stroke="#0033A0" strokeWidth="1.8" />
              <rect x="220" y="5" width="84" height="19" rx="4" fill="#0033A0" />
              <text x="262" y="18" textAnchor="middle" fontSize="8.5" fill="#ffffff" fontWeight="bold">
                Servidor 1 (μ)
              </text>
              <rect x="220" y="28" width="84" height="19" rx="4" fill="#007A99" />
              <text x="262" y="41" textAnchor="middle" fontSize="8.5" fill="#ffffff" fontWeight="bold">
                Servidor 2 (μ)
              </text>
              <rect x="220" y="51" width="84" height="19" rx="4" fill="#00AEC7" />
              <text x="262" y="64" textAnchor="middle" fontSize="8.5" fill="#0f172a" fontWeight="bold">
                Servidor S (μ)
              </text>
            </svg>
          </div>
        </div>

        {/* Number of servers s input & Stability Suggestion (HU-05.2 & HU-05.3) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-slate-50 rounded-2xl p-4 border border-slate-200">
          <div className="md:col-span-5">
            <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1">
              Número de Servidores en Paralelo (s ≥ 1):
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={50}
                disabled={params.model === 'MM1'}
                value={params.model === 'MM1' ? 1 : params.servers}
                onChange={(e) => {
                  const val = Math.max(1, Math.min(50, Math.floor(Number(e.target.value) || 1)));
                  updateParams({ servers: val });
                }}
                className="w-24 rounded-xl border border-slate-300 px-3 py-2 text-base font-extrabold text-[#0033A0] disabled:bg-slate-200"
              />
              {/* Quick buttons s=1..6 */}
              <div className="flex items-center gap-1 flex-wrap">
                {[1, 2, 3, 4, 5, 6].map((sBtn) => (
                  <button
                    key={sBtn}
                    type="button"
                    onClick={() =>
                      updateParams({
                        model: sBtn === 1 && params.model === 'MM1' ? 'MM1' : 'MMS',
                        servers: sBtn,
                      })
                    }
                    className={`w-8 h-8 rounded-lg text-xs font-extrabold transition-all ${
                      (params.model === 'MM1' ? 1 : params.servers) === sBtn
                        ? 'bg-[#0033A0] text-white shadow-sm'
                        : sBtn < minStableS
                        ? 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-blue-50'
                    }`}
                    title={
                      sBtn < minStableS
                        ? `s = ${sBtn} (Inestable: s ≤ λ/μ)`
                        : `Seleccionar s = ${sBtn} servidores`
                    }
                  >
                    {sBtn}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Minimum servers suggestion (HU-05.3) */}
          <div className="md:col-span-7 bg-blue-50/90 border border-blue-200 rounded-xl p-3.5 text-xs sm:text-sm text-blue-950 flex items-start gap-2.5">
            <Lightbulb className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">
                Sugerencia de estabilidad (HU-05.3): mínimo <span className="underline">s = {minStableS}</span> servidores
              </p>
              <p className="text-xs text-blue-900 mt-0.5">
                La intensidad de tráfico es <strong>r = λ/μ = {formatNum(r, 2)}</strong>. Para que el
                sistema alcance estado estable (ρ = λ/(s·μ) &lt; 1), se requiere el menor entero{' '}
                <strong>s &gt; {formatNum(r, 2)}</strong>, que corresponde a{' '}
                <strong>s = {minStableS}</strong> (ocupación del{' '}
                {formatNum((r / minStableS) * 100, 1)} %). Con{' '}
                <strong>s = {minStableS + 1}</strong> la ocupación baja a un cómodo{' '}
                {formatNum((r / (minStableS + 1)) * 100, 1)} %.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Indicator Selection Checkboxes (HU-08) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full">
              HU-08 • Selección de Parámetros a Estimar
            </span>
            <h3 className="text-lg font-bold text-slate-900 mt-1">
              Elija qué Indicadores Mostrar en Resultados y en el PDF
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => toggleAllIndicators(true)}
              className="text-xs font-bold text-blue-700 hover:underline px-2 py-1"
            >
              Marcar todos
            </button>
            <span className="text-slate-300">|</span>
            <button
              type="button"
              onClick={() => toggleAllIndicators(false)}
              className="text-xs font-bold text-slate-500 hover:underline px-2 py-1"
            >
              Desmarcar todos
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {INDICATOR_META.map((item) => {
            const checked = params.selectedIndicators[item.key];
            return (
              <div
                key={item.key}
                onClick={() => updateIndicators({ [item.key]: !checked })}
                className={`cursor-pointer rounded-xl border p-3 transition-all flex items-start gap-2.5 ${
                  checked
                    ? 'border-[#0033A0] bg-blue-50/40'
                    : 'border-slate-200 bg-slate-50/50 opacity-70 hover:opacity-100'
                }`}
              >
                {checked ? (
                  <CheckSquare className="w-5 h-5 text-[#0033A0] shrink-0 mt-0.5" />
                ) : (
                  <Square className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-xs sm:text-sm text-slate-900">
                    {item.label}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{item.desc}</p>

                  {/* Input for n in Pn (HU-08.3) */}
                  {item.key === 'Pn' && checked && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="mt-2 flex items-center gap-2 bg-white px-2.5 py-1.5 rounded-lg border border-blue-200"
                    >
                      <span className="text-xs font-bold text-slate-700">Valor n (≥ 0):</span>
                      <input
                        type="number"
                        min={0}
                        max={200}
                        value={params.targetN}
                        onChange={(e) =>
                          updateParams({
                            targetN: Math.max(0, Math.floor(Number(e.target.value) || 0)),
                          })
                        }
                        className="w-16 border border-slate-300 rounded px-2 py-0.5 text-xs font-bold text-[#0033A0]"
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* HU-08.2: Disable Calculate if all indicators are unchecked */}
        {selectedCount === 0 && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Debe marcar al menos un indicador para habilitar el botón "Calcular Indicadores"
              (HU-08.2).
            </span>
          </div>
        )}

        {/* Navigation Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setActiveStep(1)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-600 hover:bg-slate-100"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a Datos</span>
          </button>

          <button
            type="button"
            disabled={selectedCount === 0}
            onClick={runCalculationAndAdvance}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm sm:text-base font-extrabold shadow-md transition-all ${
              selectedCount > 0
                ? 'bg-[#0033A0] hover:bg-blue-800 text-white active:scale-95'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Calculator className="w-5 h-5" />
            <span>Calcular Indicadores ({selectedCount} seleccionados)</span>
          </button>
        </div>
      </div>
    </div>
  );
};

