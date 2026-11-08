import React from 'react';
import { AlertTriangle, BarChart3, CheckCircle2, Clock } from 'lucide-react';
import { VariableStats } from '../../../domain/entities/DescriptiveStats';
import { formatNum } from '../../../domain/services/QueueCalculatorCommon';
import { useApp } from '../../context/AppContext';

export const DescriptiveStatsPanel: React.FC = () => {
  const {
    descriptiveAnalysis,
    confidenceLevel,
    setConfidenceLevel,
    acceptableErrorMin,
    setAcceptableErrorMin,
  } = useApp();

  const { interArrivalStats, serviceStats, hourlyArrivals, peakHour, sampleValidation } =
    descriptiveAnalysis;

  const renderVariableCard = (stats: VariableStats, accentColor: string) => {
    const maxCount = Math.max(
      ...stats.histogram.map((b) => Math.max(b.observedCount, b.theoreticalExponentialDensity)),
      1
    );

    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className="font-bold text-base text-slate-900">{stats.variableName}</h4>
            <p className="text-xs text-slate-500">
              Muestra analizada: <strong>n = {stats.n}</strong> observaciones ({stats.unit})
            </p>
          </div>
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-full ${
              stats.isExponentialCompatible
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-amber-50 text-amber-800 border border-amber-300'
            }`}
          >
            CV = {formatNum(stats.cv, 2)}
          </span>
        </div>

        {/* Metrics Table (HU-04.1) */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
          <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
            <span className="text-[11px] text-slate-500 block">Media</span>
            <strong className="text-sm text-slate-900">{formatNum(stats.mean, 3)}</strong>
          </div>
          <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
            <span className="text-[11px] text-slate-500 block">Desv. Est. (σ)</span>
            <strong className="text-sm text-slate-900">{formatNum(stats.stdDev, 2)}</strong>
          </div>
          <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
            <span className="text-[11px] text-slate-500 block">Mediana</span>
            <strong className="text-sm text-slate-900">{formatNum(stats.median, 2)}</strong>
          </div>
          <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
            <span className="text-[11px] text-slate-500 block">Mínimo</span>
            <strong className="text-sm text-slate-900">{formatNum(stats.min, 2)}</strong>
          </div>
          <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
            <span className="text-[11px] text-slate-500 block">Máximo</span>
            <strong className="text-sm text-slate-900">{formatNum(stats.max, 2)}</strong>
          </div>
          <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
            <span className="text-[11px] text-slate-500 block">CV (σ/x̄)</span>
            <strong className="text-sm text-[#0033A0]">{formatNum(stats.cv, 2)}</strong>
          </div>
        </div>

        {/* Exponential Assumption Alert (HU-04.4) */}
        {stats.warningMessage ? (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block">{stats.warningMessage}</strong>
              <span>
                El Coeficiente de Variación (CV = {formatNum(stats.cv, 2)}) está fuera del rango
                teórico exponencial [0,7 – 1,3]. Debe declararse como supuesto en el informe.
              </span>
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              CV = {formatNum(stats.cv, 2)} dentro del rango [0,7 – 1,3]: compatible con
              distribución exponencial / proceso de Poisson.
            </span>
          </div>
        )}

        {/* Histogram + Superimposed Theoretical Exponential Curve (HU-04.3) */}
        <div className="pt-2">
          <div className="flex items-center justify-between text-xs text-slate-600 mb-2">
            <span className="font-bold">
              Histograma de Frecuencias + Curva Exponencial Teórica
            </span>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="inline-flex items-center gap-1">
                <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: accentColor }} />
                Observado
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-3 h-0.5 bg-rose-600 inline-block" />
                Exponencial teórica
              </span>
            </div>
          </div>

          <svg viewBox="0 0 420 185" className="w-full h-44 bg-slate-50 rounded-xl border border-slate-200 p-2">
            {/* Axes */}
            <line x1="36" y1="15" x2="36" y2="150" stroke="#94a3b8" strokeWidth="1" />
            <line x1="36" y1="150" x2="405" y2="150" stroke="#94a3b8" strokeWidth="1" />

            {stats.histogram.map((bin, idx) => {
              const barW = 350 / stats.histogram.length - 6;
              const x = 42 + idx * (barW + 6);
              const barH = (bin.observedCount / maxCount) * 125;
              const y = 150 - barH;
              return (
                <g key={idx}>
                  <rect
                    x={x}
                    y={y}
                    width={barW}
                    height={barH}
                    rx="3"
                    fill={accentColor}
                    opacity="0.82"
                  />
                  <text
                    x={x + barW / 2}
                    y={Math.max(12, y - 4)}
                    textAnchor="middle"
                    fontSize="9"
                    fill="#1e293b"
                    fontWeight="bold"
                  >
                    {bin.observedCount}
                  </text>
                  <text
                    x={x + barW / 2}
                    y="165"
                    textAnchor="middle"
                    fontSize="8.5"
                    fill="#475569"
                  >
                    {bin.binStart.toFixed(0)}-{bin.binEnd.toFixed(0)}
                  </text>
                </g>
              );
            })}

            {/* Theoretical Exponential Polyline */}
            {stats.histogram.length > 1 && (
              <polyline
                fill="none"
                stroke="#e11d48"
                strokeWidth="2.5"
                points={stats.histogram
                  .map((bin, idx) => {
                    const barW = 350 / stats.histogram.length - 6;
                    const cx = 42 + idx * (barW + 6) + barW / 2;
                    const cy = 150 - (bin.theoreticalExponentialDensity / maxCount) * 125;
                    return `${cx},${Math.max(12, cy)}`;
                  })
                  .join(' ')}
              />
            )}
            {stats.histogram.map((bin, idx) => {
              const barW = 350 / stats.histogram.length - 6;
              const cx = 42 + idx * (barW + 6) + barW / 2;
              const cy = 150 - (bin.theoreticalExponentialDensity / maxCount) * 125;
              return <circle key={idx} cx={cx} cy={Math.max(12, cy)} r="3" fill="#e11d48" />;
            })}
          </svg>
        </div>
      </div>
    );
  };

  const maxHourly = Math.max(...hourlyArrivals.map((h) => h.count), 1);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {renderVariableCard(interArrivalStats, '#0033A0')}
        {renderVariableCard(serviceStats, '#00AEC7')}
      </div>

      {/* Hourly Arrivals Chart (HU-04.5) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full">
              HU-04.5 • Distribución Horaria y Hora Pico
            </span>
            <h4 className="font-bold text-base sm:text-lg text-slate-900 mt-1">
              Llegadas de Pacientes por Hora del Día
            </h4>
          </div>
          {peakHour && (
            <div className="bg-rose-50 border border-rose-200 text-rose-900 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
              <Clock className="w-4 h-4 text-rose-600" />
              <span>
                Hora Pico Identificada: {peakHour.hourLabel} ({peakHour.count} llegadas)
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-7 sm:grid-cols-14 gap-1.5 items-end pt-4 h-44 bg-slate-50 rounded-xl p-3 border border-slate-200">
          {hourlyArrivals.map((pt) => {
            const pct = Math.max(8, (pt.count / maxHourly) * 100);
            return (
              <div
                key={pt.hourNumber}
                className="flex flex-col items-center justify-end h-full gap-1"
              >
                <span
                  className={`text-[10px] font-bold ${
                    pt.isPeak ? 'text-rose-600 font-extrabold' : 'text-slate-700'
                  }`}
                >
                  {pt.count}
                </span>
                <div
                  className={`w-full rounded-t-md transition-all ${
                    pt.isPeak
                      ? 'bg-gradient-to-t from-rose-600 to-rose-400 shadow-sm'
                      : 'bg-[#0033A0]/80 hover:bg-[#0033A0]'
                  }`}
                  style={{ height: `${pct}%` }}
                  title={`${pt.hourLabel}: ${pt.count} llegadas`}
                />
                <span className="text-[10px] text-slate-600 font-medium">
                  {String(pt.hourNumber).padStart(2, '0')}h
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Minimum Sample Size Validation (HU-04.6) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full">
              HU-04.6 • Suficiencia Estadística del Tamaño de Muestra
            </span>
            <h4 className="font-bold text-base text-slate-900">
              Cálculo del Tamaño de Muestra Mínimo Recomendado (n₀ = (Z · σ / E)²)
            </h4>
            <p className="text-xs sm:text-sm text-slate-600">
              Defina el nivel de confianza y el error máximo aceptable (E) en minutos para validar
              estadísticamente si la muestra actual es suficiente.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600">
                Nivel de Confianza
              </label>
              <select
                value={confidenceLevel}
                onChange={(e) => setConfidenceLevel(Number(e.target.value) as 90 | 95 | 99)}
                className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-bold"
              >
                <option value={90}>90 % (Z = 1,645)</option>
                <option value={95}>95 % (Z = 1,960)</option>
                <option value={99}>99 % (Z = 2,576)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600">
                Error aceptable E (min)
              </label>
              <input
                type="number"
                step="0.05"
                min="0.1"
                max="5"
                value={acceptableErrorMin}
                onChange={(e) =>
                  setAcceptableErrorMin(Math.max(0.1, Number(e.target.value) || 0.6))
                }
                className="w-24 rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-bold"
              />
            </div>
          </div>
        </div>

        <div
          className={`mt-4 p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            sampleValidation.meetsRecommendation
              ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
              : 'bg-amber-50 border-amber-300 text-amber-950'
          }`}
        >
          <div className="flex items-center gap-3">
            <BarChart3
              className={`w-6 h-6 shrink-0 ${
                sampleValidation.meetsRecommendation ? 'text-emerald-600' : 'text-amber-600'
              }`}
            />
            <div>
              <p className="font-bold text-sm">
                Muestra mínima recomendada: n₀ = {sampleValidation.recommendedMinSampleSize}{' '}
                registros | Muestra actual: n = {sampleValidation.actualSampleSize} registros
              </p>
              <p className="text-xs opacity-90">
                {sampleValidation.meetsRecommendation
                  ? `La muestra actual (${sampleValidation.actualSampleSize}) CUMPLE el tamaño mínimo requerido para un ${sampleValidation.confidenceLevelPercent} % de confianza y error ±${formatNum(sampleValidation.acceptableErrorMin, 2)} min.`
                  : `La muestra actual (${sampleValidation.actualSampleSize}) es menor que el mínimo recomendado (${sampleValidation.recommendedMinSampleSize}) para este margen de error.`}
              </p>
            </div>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-extrabold self-start sm:self-center ${
              sampleValidation.meetsRecommendation
                ? 'bg-emerald-600 text-white'
                : 'bg-amber-600 text-white'
            }`}
          >
            {sampleValidation.meetsRecommendation ? 'MUESTRA VÁLIDA' : 'AMPLIAR MUESTRA'}
          </span>
        </div>
      </div>
    </div>
  );
};

