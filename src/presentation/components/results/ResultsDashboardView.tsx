import React, { useState } from 'react';
import {
  AlertOctagon,
  ArrowRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { IndicatorKey } from '../../../domain/entities/QueueParameters';
import { formatNum } from '../../../domain/services/QueueCalculatorCommon';
import { useApp } from '../../context/AppContext';
import { CostAnalysisPanel } from './CostAnalysisPanel';
import { EquationsModal } from './EquationsModal';
import { ScenariosSimulatorPanel } from './ScenariosSimulatorPanel';
import { SystemChartsPanel } from './SystemChartsPanel';

type ResultsSubTab = 'indicators' | 'charts' | 'scenarios' | 'costs';

export const ResultsDashboardView: React.FC = () => {
  const {
    currentResult,
    params,
    timeUnit,
    setTimeUnit,
    settings,
    switchToStableMMS,
    setActiveStep,
  } = useApp();

  const [subTab, setSubTab] = useState<ResultsSubTab>('indicators');
  const [modalIndicator, setModalIndicator] = useState<IndicatorKey | null>(null);
  const [showAllEquationsModal, setShowAllEquationsModal] = useState(false);

  const selectedKeys = (Object.keys(params.selectedIndicators) as IndicatorKey[]).filter(
    (k) => params.selectedIndicators[k]
  );

  // Semaphore color for rho (HU-09.3: Green < 70%, Yellow 70-85%, Red > 85%)
  const rhoPct = currentResult.rho * 100;
  const { greenMaxPercent, yellowMaxPercent } = settings.occupancyThresholds;

  const getSemaphoreBadge = () => {
    if (!currentResult.isStable) {
      return {
        label: `Inestable (${formatNum(rhoPct, 1)} % ≥ 100 %)`,
        bg: 'bg-red-600 text-white',
        dot: 'bg-white',
      };
    }
    if (rhoPct < greenMaxPercent) {
      return {
        label: `Ocupación Baja/Holgada (${formatNum(rhoPct, 1)} % < ${greenMaxPercent} %)`,
        bg: 'bg-emerald-100 text-emerald-900 border border-emerald-300',
        dot: 'bg-emerald-600',
      };
    }
    if (rhoPct <= yellowMaxPercent) {
      return {
        label: `Ocupación Moderada (${formatNum(rhoPct, 1)} % en ${greenMaxPercent}–${yellowMaxPercent} %)`,
        bg: 'bg-amber-100 text-amber-900 border border-amber-300',
        dot: 'bg-amber-500',
      };
    }
    return {
      label: `Ocupación Crítica (${formatNum(rhoPct, 1)} % > ${yellowMaxPercent} %)`,
      bg: 'bg-red-100 text-red-900 border border-red-300',
      dot: 'bg-red-600',
    };
  };

  const semaphore = getSemaphoreBadge();

  const formatIndicatorValue = (key: IndicatorKey): { mainValue: string; unit: string } => {
    if (!currentResult.isStable && key !== 'rho') {
      return { mainValue: 'Inestable', unit: 'Sin estado estacionario' };
    }
    switch (key) {
      case 'rho':
        return {
          mainValue: `${formatNum(currentResult.rho, 4)}`,
          unit: `${formatNum(currentResult.rho * 100, 2)} % de ocupación`,
        };
      case 'P0':
        return {
          mainValue: `${formatNum(currentResult.P0, 4)}`,
          unit: `${formatNum((currentResult.P0 ?? 0) * 100, 2)} % prob. vacío`,
        };
      case 'Lq':
        return {
          mainValue: `${formatNum(currentResult.Lq, 3)}`,
          unit: 'pacientes en cola',
        };
      case 'L':
        return {
          mainValue: `${formatNum(currentResult.L, 3)}`,
          unit: 'pacientes en el sistema',
        };
      case 'Wq':
        return timeUnit === 'min'
          ? { mainValue: `${formatNum(currentResult.WqMin, 2)}`, unit: 'minutos en cola' }
          : { mainValue: `${formatNum(currentResult.WqHours, 4)}`, unit: 'horas en cola' };
      case 'W':
        return timeUnit === 'min'
          ? { mainValue: `${formatNum(currentResult.WMin, 2)}`, unit: 'minutos en el sistema' }
          : { mainValue: `${formatNum(currentResult.WHours, 4)}`, unit: 'horas en el sistema' };
      case 'Pw':
        return {
          mainValue: `${formatNum(currentResult.Pw, 4)}`,
          unit: `${formatNum((currentResult.Pw ?? 0) * 100, 2)} % prob. esperar`,
        };
      case 'Pn':
        return {
          mainValue: `${formatNum(currentResult.Pn, 4)}`,
          unit: `${formatNum((currentResult.Pn ?? 0) * 100, 2)} % (para n = ${params.targetN})`,
        };
    }
  };

  return (
    <div className="space-y-5">
      {/* Input Summary & Global Time Unit Selector Banner (HU-09.2, HU-09.3, HU-09.4) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-extrabold uppercase tracking-wider bg-[#0033A0] text-white px-2.5 py-1 rounded-lg">
                Modelo {currentResult.model === 'MM1' ? 'M/M/1' : `M/M/${currentResult.servers}`}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full ${semaphore.bg}`}
              >
                <span className={`w-2 h-2 rounded-full ${semaphore.dot}`} />
                {semaphore.label}
              </span>
              {currentResult.littleLaw?.holds && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold bg-blue-50 text-blue-800 px-2.5 py-1 rounded-full border border-blue-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                  Ley de Little verificada (L = λW, Lq = λWq)
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 pt-0.5">
              <strong>Origen:</strong> {params.sourceDescription} | <strong>λ =</strong>{' '}
              {formatNum(params.lambdaPerHour, 2)} pac/h ({formatNum(params.meanInterArrivalMin, 3)}{' '}
              min) | <strong>μ =</strong> {formatNum(params.muPerHour, 2)} pac/h (
              {formatNum(params.meanServiceMin, 3)} min) | <strong>s =</strong>{' '}
              {currentResult.servers}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Global Time Unit Selector (HU-09.2) */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <Clock className="w-3.5 h-3.5 text-slate-500 ml-2 mr-1" />
              <button
                type="button"
                onClick={() => setTimeUnit('min')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  timeUnit === 'min'
                    ? 'bg-white text-[#0033A0] shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Minutos (min)
              </button>
              <button
                type="button"
                onClick={() => setTimeUnit('hour')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  timeUnit === 'hour'
                    ? 'bg-white text-[#0033A0] shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Horas (h)
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowAllEquationsModal(true)}
              className="flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-[#0033A0] border border-blue-200 font-bold text-xs sm:text-sm px-3.5 py-2 rounded-xl"
            >
              <BookOpen className="w-4 h-4" />
              <span>Ver Todas las Ecuaciones (HU-10)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveStep(4)}
              className="flex items-center gap-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-xs sm:text-sm px-4 py-2 rounded-xl shadow-sm"
            >
              <FileText className="w-4 h-4" />
              <span>Generar Informe PDF</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sub-navigation for E3 & E4 */}
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setSubTab('indicators')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              subTab === 'indicators'
                ? 'bg-[#0033A0] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Indicadores e Interpretación (HU-09)</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('charts')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              subTab === 'charts'
                ? 'bg-[#0033A0] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Gráficas del Sistema (HU-11)</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('scenarios')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              subTab === 'scenarios'
                ? 'bg-[#0033A0] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Simulador "¿Qué pasaría si…?" (HU-12)</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('costs')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              subTab === 'costs'
                ? 'bg-[#0033A0] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Costos y s* Óptimo (HU-13)</span>
          </button>
        </div>
      </div>

      {/* UNSTABLE SYSTEM ALERT (HU-06.3 & HU-07.3) */}
      {!currentResult.isStable && (
        <div className="bg-red-50 border-2 border-red-400 rounded-2xl p-5 sm:p-6 shadow-md space-y-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-red-600 text-white flex items-center justify-center shrink-0">
              <AlertOctagon className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <span className="text-xs font-extrabold uppercase tracking-wider text-red-700 bg-red-100 px-2.5 py-0.5 rounded-full">
                Alerta de Inestabilidad Matemática (ρ ≥ 1) — HU-06.3 / HU-07.3
              </span>
              <h3 className="text-lg sm:text-xl font-extrabold text-red-950">
                Sistema inestable: llegan más pacientes (ρ = {formatNum(currentResult.rho, 2)}) de
                los que se pueden atender. La cola crece sin límite.
              </h3>
              <p className="text-xs sm:text-sm text-red-900">
                Con λ = {formatNum(params.lambdaPerHour, 2)} pacientes/h y una capacidad total s·μ ={' '}
                {formatNum(currentResult.servers * params.muPerHour, 2)} pacientes/h (s ={' '}
                {currentResult.servers}), el sistema no alcanza estado estacionario. Por rigor
                matemático, <strong>no se muestran valores numéricos negativos ni inválidos</strong>{' '}
                para L, Lq, W ni Wq.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-red-200">
            <button
              type="button"
              onClick={() => switchToStableMMS(currentResult.minStableServers)}
              className="bg-red-700 hover:bg-red-800 text-white font-extrabold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-sm transition-all"
            >
              Cambiar a M/M/S con s = {currentResult.minStableServers} (Mínimo Estable)
            </button>
            <button
              type="button"
              onClick={() => switchToStableMMS(currentResult.minStableServers + 1)}
              className="bg-[#0033A0] hover:bg-blue-800 text-white font-extrabold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-sm transition-all"
            >
              Cambiar a M/M/S con s = {currentResult.minStableServers + 1} (Recomendado Operativo)
            </button>
          </div>
        </div>
      )}

      {/* SUBTAB 1: INDICATORS & INTERPRETATION (HU-09) */}
      {subTab === 'indicators' && (
        <div className="space-y-5">
          {currentResult.isStable && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {selectedKeys.map((key) => {
                const eq = currentResult.equations[key];
                const interp = currentResult.interpretations[key];
                const formatted = formatIndicatorValue(key);

                return (
                  <div
                    key={key}
                    className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col justify-between hover:border-blue-300 transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-[#0033A0] font-serif font-extrabold text-base border border-blue-200">
                          {eq.symbol}
                        </span>
                        <button
                          type="button"
                          onClick={() => setModalIndicator(key)}
                          className="text-xs font-bold text-blue-700 hover:text-blue-900 hover:underline flex items-center gap-1"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>Ver ecuación</span>
                        </button>
                      </div>

                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                        {eq.name}
                      </h4>

                      <div className="mt-2 flex items-baseline gap-1.5">
                        <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                          {formatted.mainValue}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-[#0033A0] block mt-0.5">
                        {formatted.unit}
                      </span>
                    </div>

                    <p className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600 leading-relaxed">
                      {interp}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Executive Conclusion Card */}
          <div className="bg-gradient-to-r from-[#001E62] to-[#0033A0] text-white rounded-2xl p-5 shadow-md">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">
              Síntesis Ejecutiva para Sustentación
            </span>
            <p className="text-sm sm:text-base font-medium mt-1 leading-relaxed">
              {currentResult.executiveConclusion}
            </p>
          </div>
        </div>
      )}

      {/* SUBTAB 2: CHARTS (HU-11) */}
      {subTab === 'charts' && <SystemChartsPanel />}

      {/* SUBTAB 3: SCENARIOS (HU-12) */}
      {subTab === 'scenarios' && <ScenariosSimulatorPanel />}

      {/* SUBTAB 4: COSTS (HU-13) */}
      {subTab === 'costs' && <CostAnalysisPanel />}

      {/* Equations Modal (HU-10) */}
      {(modalIndicator !== null || showAllEquationsModal) && (
        <EquationsModal
          result={currentResult}
          focusedIndicator={modalIndicator}
          onClose={() => {
            setModalIndicator(null);
            setShowAllEquationsModal(false);
          }}
        />
      )}
    </div>
  );
};

