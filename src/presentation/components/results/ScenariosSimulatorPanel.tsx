import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BookmarkPlus,
  RotateCcw,
  Sliders,
  Trash2,
} from 'lucide-react';
import { QueueCalculatorFactory } from '../../../domain/services/QueueCalculatorFactory';
import { formatNum } from '../../../domain/services/QueueCalculatorCommon';
import { useApp } from '../../context/AppContext';

export const ScenariosSimulatorPanel: React.FC = () => {
  const {
    params,
    currentResult,
    savedScenarios,
    saveScenario,
    deleteScenario,
    clearScenarios,
    timeUnit,
  } = useApp();

  const [simServers, setSimServers] = useState<number>(() =>
    Math.max(currentResult.minStableServers + 1, currentResult.servers)
  );
  const [lambdaVarPct, setLambdaVarPct] = useState<number>(0); // e.g. +30% peak hour
  const [serviceVarPct, setServiceVarPct] = useState<number>(-15); // e.g. -15% faster process
  const [scenarioName, setScenarioName] = useState<string>('Plan Mejora: Triage Ágil (-15%)');

  // HU-12.2: Instant reactive recalculation without touching "Calcular"
  const liveSimulatedResult = useMemo(() => {
    const effLambda = params.lambdaPerHour * (1 + lambdaVarPct / 100);
    const effServiceMin = Math.max(0.2, params.meanServiceMin * (1 + serviceVarPct / 100));
    const effMu = 60 / effServiceMin;

    return QueueCalculatorFactory.calculate({
      ...params,
      model: simServers === 1 ? 'MM1' : 'MMS',
      servers: simServers,
      lambdaPerHour: effLambda,
      muPerHour: effMu,
      meanInterArrivalMin: 60 / effLambda,
      meanServiceMin: effServiceMin,
    });
  }, [params, simServers, lambdaVarPct, serviceVarPct]);

  const handleSaveCurrentScenario = () => {
    saveScenario(scenarioName, simServers, lambdaVarPct, serviceVarPct);
    setScenarioName(`Escenario #${savedScenarios.length + 2}`);
  };

  const renderDeltaCell = (
    baseVal: number | null,
    scenVal: number | null,
    unitLabel: string,
    decimals = 2
  ) => {
    if (scenVal === null) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-extrabold bg-red-100 text-red-800">
          Inestable
        </span>
      );
    }
    if (baseVal === null) {
      // Base was unstable, scenario is stable -> improvement!
      return (
        <div className="text-emerald-700 font-bold">
          <span>
            {formatNum(scenVal, decimals)} {unitLabel}
          </span>
          <span className="block text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded inline-block ml-1">
            Estabilizado
          </span>
        </div>
      );
    }

    const diff = scenVal - baseVal;
    const isImproved = diff < -0.0005;
    const isWorse = diff > 0.0005;

    return (
      <div className="flex flex-col">
        <span
          className={`font-bold ${
            isImproved
              ? 'text-emerald-700'
              : isWorse
              ? 'text-red-700'
              : 'text-slate-800'
          }`}
        >
          {formatNum(scenVal, decimals)} {unitLabel}
        </span>
        {(isImproved || isWorse) && (
          <span
            className={`inline-flex items-center gap-0.5 text-[10px] font-bold ${
              isImproved ? 'text-emerald-600' : 'text-red-600'
            }`}
          >
            {isImproved ? (
              <ArrowDownRight className="w-3 h-3" />
            ) : (
              <ArrowUpRight className="w-3 h-3" />
            )}
            {diff > 0 ? '+' : ''}
            {formatNum(diff, decimals)} {unitLabel}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* Interactive Sliders Card (HU-12.1 & HU-12.2) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full">
              HU-12 • Simulador Interactivo "¿Qué pasaría si…?"
            </span>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
              Simulación en Tiempo Real de Planes de Mejora en Urgencias
            </h3>
            <p className="text-xs sm:text-sm text-slate-600">
              Mueva los deslizadores para evaluar cambios en el número de servidores (s), demanda en
              hora pico (λ) o reducción del tiempo de atención (1/μ).
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setSimServers(currentResult.servers);
              setLambdaVarPct(0);
              setServiceVarPct(0);
            }}
            className="self-start sm:self-center flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Igualar al Base</span>
          </button>
        </div>

        {/* 3 Sliders */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Slider 1: Servers s */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">
                1. Puestos de Atención (s)
              </label>
              <span className="text-sm font-extrabold text-[#0033A0] bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200">
                s = {simServers}
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={12}
              step={1}
              value={simServers}
              onChange={(e) => setSimServers(Number(e.target.value))}
              className="w-full accent-[#0033A0]"
            />
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>1 serv.</span>
              <span>Base: s={currentResult.servers}</span>
              <span>12 serv.</span>
            </div>
          </div>

          {/* Slider 2: Lambda variation % */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">
                2. Variación Demanda (λ)
              </label>
              <span className="text-sm font-extrabold text-[#0033A0] bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200">
                {lambdaVarPct >= 0 ? `+${lambdaVarPct}%` : `${lambdaVarPct}%`} (
                {formatNum(liveSimulatedResult.params.lambdaPerHour, 2)} /h)
              </span>
            </div>
            <input
              type="range"
              min={-40}
              max={60}
              step={5}
              value={lambdaVarPct}
              onChange={(e) => setLambdaVarPct(Number(e.target.value))}
              className="w-full accent-[#0033A0]"
            />
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>-40% (Valle)</span>
              <span>0% (Base)</span>
              <span>+30% (Hora Pico)</span>
            </div>
          </div>

          {/* Slider 3: Mean Service Time variation % */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">
                3. Tiempo Medio Atención (1/μ)
              </label>
              <span className="text-sm font-extrabold text-[#0033A0] bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200">
                {serviceVarPct >= 0 ? `+${serviceVarPct}%` : `${serviceVarPct}%`} (
                {formatNum(liveSimulatedResult.params.meanServiceMin, 2)} min)
              </span>
            </div>
            <input
              type="range"
              min={-40}
              max={40}
              step={5}
              value={serviceVarPct}
              onChange={(e) => setServiceVarPct(Number(e.target.value))}
              className="w-full accent-[#0033A0]"
            />
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>-15% (Mejora registro)</span>
              <span>0% (Base)</span>
              <span>+40%</span>
            </div>
          </div>
        </div>

        {/* Live Preview Bar */}
        <div
          className={`rounded-2xl p-4 border flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
            liveSimulatedResult.isStable
              ? 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200'
              : 'bg-red-50 border-red-300'
          }`}
        >
          {liveSimulatedResult.isStable ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1">
              <div>
                <span className="text-xs text-slate-500 block">Ocupación Simulada (ρ)</span>
                <strong className="text-base sm:text-lg font-extrabold text-slate-900">
                  {formatNum(liveSimulatedResult.rho * 100, 1)} %
                </strong>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Espera en Cola (Wq)</span>
                <strong className="text-base sm:text-lg font-extrabold text-[#0033A0]">
                  {formatNum(liveSimulatedResult.WqMin, 2)} min
                </strong>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Pacientes en Cola (Lq)</span>
                <strong className="text-base sm:text-lg font-extrabold text-slate-900">
                  {formatNum(liveSimulatedResult.Lq, 3)} pac
                </strong>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Prob. de Esperar (Pw)</span>
                <strong className="text-base sm:text-lg font-extrabold text-slate-900">
                  {formatNum((liveSimulatedResult.Pw ?? 0) * 100, 1)} %
                </strong>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 text-red-800 text-xs sm:text-sm font-bold flex-1">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
              <span>
                Escenario Inestable (ρ = {formatNum(liveSimulatedResult.rho, 2)} ≥ 1): se requieren
                al menos s = {liveSimulatedResult.minStableServers} servidores para esta demanda.
              </span>
            </div>
          )}

          {/* Save Scenario Controls (HU-12.3: up to 5 scenarios) */}
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={scenarioName}
              onChange={(e) => setScenarioName(e.target.value)}
              placeholder="Nombre del escenario..."
              className="rounded-xl border border-slate-300 px-3 py-2 text-xs sm:text-sm bg-white w-52"
            />
            <button
              type="button"
              onClick={handleSaveCurrentScenario}
              className="flex items-center gap-1.5 bg-[#0033A0] hover:bg-blue-800 text-white font-bold text-xs sm:text-sm px-4 py-2 rounded-xl shadow-sm"
            >
              <BookmarkPlus className="w-4 h-4" />
              <span>Guardar Escenario ({savedScenarios.length}/5)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Comparative Scenarios Table (HU-12.3, HU-12.4, HU-12.5) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-bold text-base text-slate-900">
              Tabla Comparativa frente al Escenario Base (HU-12.3 / HU-12.4)
            </h4>
            <p className="text-xs text-slate-500">
              En <span className="text-emerald-700 font-bold">verde</span> se resaltan las mejoras y
              en <span className="text-red-700 font-bold">rojo</span> los empeoramientos respecto al
              escenario base.
            </p>
          </div>

          {savedScenarios.length > 0 && (
            <button
              type="button"
              onClick={clearScenarios}
              className="text-xs text-red-600 hover:underline font-semibold"
            >
              Limpiar tabla
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="py-2.5 px-3 font-bold">Escenario</th>
                <th className="py-2.5 px-3 font-bold">Servidores (s)</th>
                <th className="py-2.5 px-3 font-bold">Llegadas (λ)</th>
                <th className="py-2.5 px-3 font-bold">T. Atención</th>
                <th className="py-2.5 px-3 font-bold">Ocupación (ρ)</th>
                <th className="py-2.5 px-3 font-bold">Cola (Lq)</th>
                <th className="py-2.5 px-3 font-bold">
                  Espera Wq ({timeUnit === 'min' ? 'min' : 'h'})
                </th>
                <th className="py-2.5 px-3 font-bold">Prob. Espera (Pw)</th>
                <th className="py-2.5 px-3 font-bold text-right">Quitar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {/* Base Scenario Row */}
              <tr className="bg-blue-50/60">
                <td className="py-2.5 px-3 font-extrabold text-[#0033A0]">
                  Escenario Base (Actual)
                </td>
                <td className="py-2.5 px-3 font-bold">s = {currentResult.servers}</td>
                <td className="py-2.5 px-3">{formatNum(params.lambdaPerHour, 2)} /h</td>
                <td className="py-2.5 px-3">{formatNum(params.meanServiceMin, 2)} min</td>
                <td className="py-2.5 px-3 font-bold">
                  {currentResult.isStable
                    ? `${formatNum(currentResult.rho * 100, 1)} %`
                    : 'Inestable'}
                </td>
                <td className="py-2.5 px-3 font-bold">
                  {currentResult.isStable ? `${formatNum(currentResult.Lq, 2)} pac` : 'Inestable'}
                </td>
                <td className="py-2.5 px-3 font-bold">
                  {currentResult.isStable
                    ? timeUnit === 'min'
                      ? `${formatNum(currentResult.WqMin, 2)} min`
                      : `${formatNum(currentResult.WqHours, 3)} h`
                    : 'Inestable'}
                </td>
                <td className="py-2.5 px-3 font-bold">
                  {currentResult.isStable
                    ? `${formatNum((currentResult.Pw ?? 0) * 100, 1)} %`
                    : 'Inestable'}
                </td>
                <td className="py-2.5 px-3 text-right text-slate-400">Base</td>
              </tr>

              {savedScenarios.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-6 text-center text-slate-500 text-xs">
                    Ajuste los deslizadores arriba y pulse <strong>"Guardar Escenario"</strong> para
                    comparar hasta 5 alternativas en esta tabla y en el informe PDF.
                  </td>
                </tr>
              ) : (
                savedScenarios.map((sc) => {
                  const baseWq =
                    currentResult.isStable && currentResult.WqMin !== null
                      ? timeUnit === 'min'
                        ? currentResult.WqMin
                        : currentResult.WqHours
                      : null;
                  const scenWq =
                    sc.result.isStable && sc.result.WqMin !== null
                      ? timeUnit === 'min'
                        ? sc.result.WqMin
                        : sc.result.WqHours
                      : null;

                  return (
                    <tr key={sc.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-bold text-slate-900">{sc.name}</td>
                      <td className="py-2.5 px-3 font-semibold">s = {sc.servers}</td>
                      <td className="py-2.5 px-3">
                        {formatNum(sc.effectiveLambdaPerHour, 2)} /h{' '}
                        <span className="text-[11px] text-slate-500">
                          ({sc.lambdaVariationPercent >= 0 ? '+' : ''}
                          {sc.lambdaVariationPercent}%)
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        {formatNum(sc.effectiveMeanServiceMin, 2)} min{' '}
                        <span className="text-[11px] text-slate-500">
                          ({sc.serviceTimeVariationPercent >= 0 ? '+' : ''}
                          {sc.serviceTimeVariationPercent}%)
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        {renderDeltaCell(
                          currentResult.isStable ? currentResult.rho * 100 : null,
                          sc.result.isStable ? sc.result.rho * 100 : null,
                          '%',
                          1
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        {renderDeltaCell(
                          currentResult.isStable ? currentResult.Lq : null,
                          sc.result.isStable ? sc.result.Lq : null,
                          'pac',
                          2
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        {renderDeltaCell(
                          baseWq,
                          scenWq,
                          timeUnit === 'min' ? 'min' : 'h',
                          2
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        {renderDeltaCell(
                          currentResult.isStable && currentResult.Pw !== null
                            ? currentResult.Pw * 100
                            : null,
                          sc.result.isStable && sc.result.Pw !== null
                            ? sc.result.Pw * 100
                            : null,
                          '%',
                          1
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => deleteScenario(sc.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"
                          title="Eliminar escenario"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

