import React from 'react';
import { AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { IndicatorKey } from '../../../domain/entities/QueueParameters';
import { QueueCalculationResult } from '../../../domain/entities/QueueResults';
import { formatNum } from '../../../domain/services/QueueCalculatorCommon';
import { MathFormula } from '../common/MathFormula';

interface EquationsModalProps {
  result: QueueCalculationResult;
  focusedIndicator: IndicatorKey | null;
  onClose: () => void;
}

export const EquationsModal: React.FC<EquationsModalProps> = ({
  result,
  focusedIndicator,
  onClose,
}) => {
  const keysToDisplay: IndicatorKey[] = focusedIndicator
    ? [focusedIndicator]
    : ((Object.keys(result.params.selectedIndicators) as IndicatorKey[]).filter(
        (k) => result.params.selectedIndicators[k]
      ));

  const serviceCV = result.params.serviceCV;
  const hasNonExpWarning =
    serviceCV !== undefined && (serviceCV < 0.7 || serviceCV > 1.3);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 bg-[#001E62] text-white flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-300">
              HU-10 • Demostración Matemática y Supuestos
            </span>
            <h3 className="text-base sm:text-lg font-extrabold">
              {focusedIndicator
                ? `Ecuación Detallada: ${result.equations[focusedIndicator].name}`
                : `Ecuaciones del Modelo ${
                    result.model === 'MM1' ? 'M/M/1' : `M/M/${result.servers}`
                  }`}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {keysToDisplay.map((key) => {
            const eq = result.equations[key];
            return (
              <div
                key={key}
                className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-3"
              >
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-[#0033A0] text-white font-serif font-bold text-sm">
                      {eq.symbol}
                    </span>
                    <h4 className="font-bold text-sm sm:text-base text-slate-900">{eq.name}</h4>
                  </div>
                  <span className="text-xs sm:text-sm font-extrabold text-[#0033A0] bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                    {eq.resultFormatted}
                  </span>
                </div>

                {/* (a) General Formula in Mathematical Notation */}
                <div className="bg-white rounded-xl p-3 border border-slate-200">
                  <span className="text-[11px] font-bold uppercase text-slate-400 block mb-1">
                    (a) Fórmula General en Notación Matemática:
                  </span>
                  <MathFormula
                    indicator={key}
                    model={result.model}
                    servers={result.servers}
                    targetN={result.params.targetN}
                  />
                </div>

                {/* (b) Substituted Formula */}
                <div className="bg-white rounded-xl p-3 border border-slate-200">
                  <span className="text-[11px] font-bold uppercase text-slate-400 block mb-1">
                    (b) Sustitución con los Valores de Entrada:
                  </span>
                  <code className="text-xs sm:text-sm font-mono font-semibold text-slate-800 break-all">
                    {eq.substitutedFormulaText}
                  </code>
                </div>

                {/* (c) Final Result */}
                <div className="flex items-center justify-between text-xs sm:text-sm px-1">
                  <span className="font-bold text-slate-600">(c) Resultado Calculado:</span>
                  <span className="font-extrabold text-slate-900">{eq.resultFormatted}</span>
                </div>
              </div>
            );
          })}

          {/* Model Assumptions (HU-10.3 & HU-10.4) */}
          <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 space-y-2.5">
            <h4 className="font-bold text-sm text-blue-950 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-blue-700" />
              Supuestos Teóricos Declarados del Modelo (HU-10.3)
            </h4>
            <ul className="text-xs text-slate-700 space-y-1.5 list-disc list-inside">
              <li>
                <strong>Llegadas de Poisson:</strong> El número de pacientes que llegan por hora
                sigue una distribución de Poisson con tasa media λ ={' '}
                {formatNum(result.params.lambdaPerHour, 2)} pac/h (tiempos entre llegadas
                exponenciales).
              </li>
              <li>
                <strong>Servicio Exponencial:</strong> El tiempo de atención por servidor se asume
                distribuido exponencialmente con tasa media μ ={' '}
                {formatNum(result.params.muPerHour, 2)} pac/h.
              </li>
              <li>
                <strong>Disciplina FIFO (First-In, First-Out):</strong> Los pacientes se atienden en
                estricto orden de llegada en una fila única.
              </li>
              <li>
                <strong>Población y Capacidad Infinitas:</strong> La fuente de pacientes potenciales
                y la capacidad física de la sala de espera no truncan la cola.
              </li>
              <li>
                <strong>Estado Estable (ρ &lt; 1):</strong> La tasa total de servicio s·μ debe
                superar a λ para alcanzar equilibrio estadístico.
              </li>
            </ul>

            {/* HU-10.4: Service exponential warning when applicable */}
            {hasNonExpWarning && (
              <div className="mt-2 p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Aviso de Validación Empírica (HU-04 / HU-10.4):</strong> En los datos
                  cargados, el Tiempo de Atención tiene un Coeficiente de Variación{' '}
                  <strong>CV = {formatNum(serviceCV, 2)}</strong> (fuera del rango [0,7 – 1,3]).
                  Esta variable no se comporta estrictamente como exponencial; por tanto, el modelo{' '}
                  {result.model === 'MM1' ? 'M/M/1' : 'M/M/S'} constituye una aproximación analítica
                  conservadora.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#0033A0] text-white text-xs sm:text-sm font-bold hover:bg-blue-800"
          >
            Cerrar ventana
          </button>
        </div>
      </div>
    </div>
  );
};

