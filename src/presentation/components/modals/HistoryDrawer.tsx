import React from 'react';
import { Clock, FileText, FolderOpen, History, Trash2, X } from 'lucide-react';
import { QueueCalculationResult } from '../../../domain/entities/QueueResults';
import { formatNum } from '../../../domain/services/QueueCalculatorCommon';
import { useApp } from '../../context/AppContext';

interface HistoryDrawerProps {
  onClose: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({ onClose }) => {
  const { history, loadFromHistory, deleteFromHistory, clearHistory, setActiveStep } = useApp();

  const handleOpenAndPdf = (item: QueueCalculationResult) => {
    loadFromHistory(item);
    setActiveStep(4);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex justify-end">
      <div className="bg-white w-full max-w-lg h-full flex flex-col shadow-2xl border-l border-slate-200">
        {/* Header */}
        <div className="px-5 py-4 bg-[#001E62] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-cyan-300" />
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-300">
                HU-19 • Persistencia Local
              </span>
              <h3 className="text-base font-extrabold">Historial de Cálculos Guardados</h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List */}
        <div className="p-4 flex-1 overflow-y-auto space-y-3">
          {history.length === 0 ? (
            <div className="text-center py-12 text-slate-500 space-y-2">
              <Clock className="w-10 h-10 mx-auto text-slate-300" />
              <p className="font-bold text-slate-700 text-sm">
                Aún no hay cálculos guardados en el historial
              </p>
              <p className="text-xs max-w-xs mx-auto">
                Cada vez que presione "Calcular Indicadores", el resultado quedará almacenado aquí
                incluso si cierra la aplicación.
              </p>
            </div>
          ) : (
            history.map((item) => {
              const dt = new Date(item.timestampIso);
              const dateFormatted = dt.toLocaleString('es-CO', {
                month: 'short',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 space-y-2.5 hover:border-blue-300 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-lg bg-[#0033A0] text-white text-xs font-extrabold">
                        {item.model === 'MM1' ? 'M/M/1' : `M/M/${item.servers}`}
                      </span>
                      <span className="text-xs text-slate-500">{dateFormatted}</span>
                    </div>

                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        item.isStable
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      ρ = {formatNum(item.rho * 100, 1)}%
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 grid grid-cols-3 gap-2 bg-white p-2.5 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Llegadas (λ)</span>
                      <strong className="text-slate-800">
                        {formatNum(item.params.lambdaPerHour, 2)} /h
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Servicio (μ)</span>
                      <strong className="text-slate-800">
                        {formatNum(item.params.muPerHour, 2)} /h
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Espera (Wq)</span>
                      <strong className="text-[#0033A0]">
                        {item.isStable ? `${formatNum(item.WqMin, 2)} min` : 'Inestable'}
                      </strong>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          loadFromHistory(item);
                          onClose();
                        }}
                        className="inline-flex items-center gap-1 bg-[#0033A0] hover:bg-blue-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg"
                      >
                        <FolderOpen className="w-3.5 h-3.5" />
                        <span>Abrir</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenAndPdf(item)}
                        className="inline-flex items-center gap-1 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Regenerar PDF</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => deleteFromHistory(item.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"
                      title="Borrar cálculo (HU-19.2)"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          {history.length > 0 ? (
            <button
              type="button"
              onClick={clearHistory}
              className="text-xs font-bold text-red-600 hover:underline"
            >
              Vaciar todo el historial
            </button>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

