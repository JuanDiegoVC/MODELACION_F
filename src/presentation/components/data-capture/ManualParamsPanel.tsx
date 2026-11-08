import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Sliders } from 'lucide-react';
import { InputMethod } from '../../../domain/entities/QueueParameters';
import { formatNum } from '../../../domain/services/QueueCalculatorCommon';
import { SpreadsheetImporter } from '../../../infrastructure/importers/SpreadsheetImporter';
import { useApp } from '../../context/AppContext';

export const ManualParamsPanel: React.FC = () => {
  const { params, updateParams } = useApp();

  const [inputMethod, setInputMethod] = useState<InputMethod>('mean_times');
  const [val1Str, setVal1Str] = useState<string>(() =>
    params.meanInterArrivalMin.toFixed(3).replace('.', ',')
  );
  const [val2Str, setVal2Str] = useState<string>(() =>
    params.meanServiceMin.toFixed(3).replace('.', ',')
  );

  const [err1, setErr1] = useState<string | null>(null);
  const [err2, setErr2] = useState<string | null>(null);
  const [appliedBanner, setAppliedBanner] = useState<string | null>(null);

  useEffect(() => {
    if (inputMethod === 'mean_times') {
      setVal1Str(params.meanInterArrivalMin.toFixed(3).replace('.', ','));
      setVal2Str(params.meanServiceMin.toFixed(3).replace('.', ','));
    } else if (inputMethod === 'rates_per_hour') {
      setVal1Str(params.lambdaPerHour.toFixed(3).replace('.', ','));
      setVal2Str(params.muPerHour.toFixed(3).replace('.', ','));
    } else {
      setVal1Str((params.lambdaPerHour / 60).toFixed(4).replace('.', ','));
      setVal2Str((params.muPerHour / 60).toFixed(4).replace('.', ','));
    }
    setErr1(null);
    setErr2(null);
  }, [inputMethod, params.meanInterArrivalMin, params.meanServiceMin, params.lambdaPerHour, params.muPerHour]);

  const validateAndApply = (raw1: string, raw2: string, method: InputMethod) => {
    const n1 = SpreadsheetImporter.parseFlexibleNumber(raw1);
    const n2 = SpreadsheetImporter.parseFlexibleNumber(raw2);

    let e1: string | null = null;
    let e2: string | null = null;

    if (n1 === null || n1 <= 0) {
      e1 = 'Ingrese un valor numérico mayor que 0 (se acepta coma o punto).';
    }
    if (n2 === null || n2 <= 0) {
      e2 = 'Ingrese un valor numérico mayor que 0 (se acepta coma o punto).';
    }

    setErr1(e1);
    setErr2(e2);
    if (e1 || e2 || n1 === null || n2 === null) return;

    let lambdaHour = 0;
    let muHour = 0;
    let meanIAMin = 0;
    let meanSvMin = 0;

    if (method === 'mean_times') {
      meanIAMin = n1;
      meanSvMin = n2;
      lambdaHour = 60 / n1;
      muHour = 60 / n2;
    } else if (method === 'rates_per_hour') {
      lambdaHour = n1;
      muHour = n2;
      meanIAMin = 60 / n1;
      meanSvMin = 60 / n2;
    } else {
      lambdaHour = n1 * 60;
      muHour = n2 * 60;
      meanIAMin = 1 / n1;
      meanSvMin = 1 / n2;
    }

    updateParams({
      lambdaPerHour: lambdaHour,
      muPerHour: muHour,
      meanInterArrivalMin: meanIAMin,
      meanServiceMin: meanSvMin,
      sourceDescription: `Ingreso manual (${
        method === 'mean_times'
          ? `1/λ=${formatNum(meanIAMin, 3)} min, 1/μ=${formatNum(meanSvMin, 3)} min`
          : `λ=${formatNum(lambdaHour, 2)} /h, μ=${formatNum(muHour, 2)} /h`
      })`,
    });

    setAppliedBanner(
      `Parámetros actualizados: λ ≈ ${formatNum(lambdaHour, 2)} pacientes/h  |  μ ≈ ${formatNum(
        muHour,
        2
      )} pacientes/h`
    );
  };

  const applyPreset = (
    label: string,
    meanIAMin: number,
    meanSvMin: number,
    cvIA?: number,
    cvSv?: number
  ) => {
    setInputMethod('mean_times');
    setVal1Str(String(meanIAMin).replace('.', ','));
    setVal2Str(String(meanSvMin).replace('.', ','));
    setErr1(null);
    setErr2(null);
    updateParams({
      meanInterArrivalMin: meanIAMin,
      meanServiceMin: meanSvMin,
      lambdaPerHour: 60 / meanIAMin,
      muPerHour: 60 / meanSvMin,
      interArrivalCV: cvIA,
      serviceCV: cvSv,
      sourceDescription: label,
    });
    setAppliedBanner(
      `Caso cargado (${label}): λ ≈ ${formatNum(60 / meanIAMin, 2)} /h, μ ≈ ${formatNum(
        60 / meanSvMin,
        2
      )} /h`
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm space-y-5">
      <div>
        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full">
          HU-03 • Ingreso Manual de Parámetros
        </span>
        <h3 className="text-lg font-bold text-slate-900 mt-1.5">
          Ingresar Tiempos Promedio o Tasas de Llegada y Servicio
        </h3>
        <p className="text-sm text-slate-600">
          Puede ingresar promedios en minutos o tasas por hora/minuto usando coma (<code>,</code>) o
          punto (<code>.</code>) decimal. Las unidades se convierten de forma coherente sin mezclar
          escalas.
        </p>
      </div>

      {/* Selector of Input Mode (HU-03.1) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-100 p-1.5 rounded-xl">
        <button
          type="button"
          onClick={() => setInputMethod('mean_times')}
          className={`py-2 px-3 rounded-lg text-xs sm:text-sm font-bold transition-all ${
            inputMethod === 'mean_times'
              ? 'bg-white text-[#0033A0] shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Tiempos Promedio (min)
        </button>
        <button
          type="button"
          onClick={() => setInputMethod('rates_per_hour')}
          className={`py-2 px-3 rounded-lg text-xs sm:text-sm font-bold transition-all ${
            inputMethod === 'rates_per_hour'
              ? 'bg-white text-[#0033A0] shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Tasas por Hora (pac/h)
        </button>
        <button
          type="button"
          onClick={() => setInputMethod('rates_per_min')}
          className={`py-2 px-3 rounded-lg text-xs sm:text-sm font-bold transition-all ${
            inputMethod === 'rates_per_min'
              ? 'bg-white text-[#0033A0] shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Tasas por Minuto (pac/min)
        </button>
      </div>

      {/* Input Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1">
            {inputMethod === 'mean_times'
              ? 'Tiempo medio entre llegadas (1/λ)'
              : 'Tasa media de llegada (λ)'}
          </label>
          <div className="relative flex items-center">
            <input
              type="text"
              inputMode="decimal"
              value={val1Str}
              onChange={(e) => {
                setVal1Str(e.target.value);
                validateAndApply(e.target.value, val2Str, inputMethod);
              }}
              className={`w-full rounded-xl border px-3.5 py-2.5 pr-24 text-base font-semibold focus:outline-none focus:ring-2 ${
                err1
                  ? 'border-red-400 focus:ring-red-200 bg-red-50/40'
                  : 'border-slate-300 focus:ring-blue-200'
              }`}
              placeholder="Ej: 3,961"
            />
            <span className="absolute right-3 text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
              {inputMethod === 'mean_times'
                ? 'min / pac'
                : inputMethod === 'rates_per_hour'
                ? 'pac / hora'
                : 'pac / min'}
            </span>
          </div>
          {err1 && (
            <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{err1}</span>
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1">
            {inputMethod === 'mean_times'
              ? 'Tiempo medio de atención (1/μ)'
              : 'Tasa media de servicio por servidor (μ)'}
          </label>
          <div className="relative flex items-center">
            <input
              type="text"
              inputMode="decimal"
              value={val2Str}
              onChange={(e) => {
                setVal2Str(e.target.value);
                validateAndApply(val1Str, e.target.value, inputMethod);
              }}
              className={`w-full rounded-xl border px-3.5 py-2.5 pr-24 text-base font-semibold focus:outline-none focus:ring-2 ${
                err2
                  ? 'border-red-400 focus:ring-red-200 bg-red-50/40'
                  : 'border-slate-300 focus:ring-blue-200'
              }`}
              placeholder="Ej: 11,718"
            />
            <span className="absolute right-3 text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
              {inputMethod === 'mean_times'
                ? 'min / pac'
                : inputMethod === 'rates_per_hour'
                ? 'pac / hora'
                : 'pac / min'}
            </span>
          </div>
          {err2 && (
            <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{err2}</span>
            </p>
          )}
        </div>
      </div>

      {/* Live Equivalent Rates Banner (HU-03.2 & HU-03.3) */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <span className="text-xs text-slate-500 font-medium">Tasa de llegada (λ)</span>
          <p className="text-base sm:text-lg font-extrabold text-[#0033A0]">
            {formatNum(params.lambdaPerHour, 2)} <span className="text-xs font-normal">pac/h</span>
          </p>
          <span className="text-[11px] text-slate-500">
            ({formatNum(params.lambdaPerHour / 60, 4)} pac/min)
          </span>
        </div>

        <div>
          <span className="text-xs text-slate-500 font-medium">Tasa de servicio (μ)</span>
          <p className="text-base sm:text-lg font-extrabold text-[#0033A0]">
            {formatNum(params.muPerHour, 2)} <span className="text-xs font-normal">pac/h</span>
          </p>
          <span className="text-[11px] text-slate-500">
            ({formatNum(params.muPerHour / 60, 4)} pac/min)
          </span>
        </div>

        <div>
          <span className="text-xs text-slate-500 font-medium">Tiempo entre llegadas</span>
          <p className="text-base sm:text-lg font-extrabold text-slate-800">
            {formatNum(params.meanInterArrivalMin, 3)}{' '}
            <span className="text-xs font-normal">min</span>
          </p>
        </div>

        <div>
          <span className="text-xs text-slate-500 font-medium">Tiempo de atención</span>
          <p className="text-base sm:text-lg font-extrabold text-slate-800">
            {formatNum(params.meanServiceMin, 3)} <span className="text-xs font-normal">min</span>
          </p>
        </div>
      </div>

      {appliedBanner && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{appliedBanner}</span>
        </div>
      )}

      {/* Quick Presets for Evaluators (HU-06.2, HU-06.3, HU-07.2) */}
      <div className="pt-2 border-t border-slate-100">
        <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5 mb-2">
          <Sliders className="w-3.5 h-3.5" /> Casos de Prueba Rápidos del Documento de Especificación:
        </span>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() =>
              applyPreset(
                'Excel SURA Medellín (Hoja Estadísticas: 3,961 min / 11,718 min)',
                3.961,
                11.718,
                0.96,
                0.34
              )
            }
            className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-800 font-semibold px-3 py-1.5 rounded-lg border border-blue-200 transition-colors"
          >
            Datos SURA Hoja Estadísticas (3,961 min / 11,718 min → λ=15,15 /h, μ=5,12 /h)
          </button>

          <button
            type="button"
            onClick={() =>
              applyPreset(
                'Excel SURA Medellín sin 0 inicial (n=199: 3,981 min / 11,718 min)',
                3.981,
                11.718,
                0.96,
                0.34
              )
            }
            className="text-xs bg-cyan-50 hover:bg-cyan-100 text-cyan-900 font-semibold px-3 py-1.5 rounded-lg border border-cyan-200 transition-colors"
          >
            Datos SURA sin 0 inicial (3,981 min / 11,718 min)
          </button>

          <button
            type="button"
            onClick={() =>
              applyPreset('Caso de prueba estable HU-06.2 (λ=2 /h, μ=3 /h)', 30, 20)
            }
            className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-semibold px-3 py-1.5 rounded-lg border border-emerald-200 transition-colors"
          >
            Caso Prueba Estable M/M/1 (λ = 2 /h, μ = 3 /h)
          </button>
        </div>
      </div>
    </div>
  );
};

