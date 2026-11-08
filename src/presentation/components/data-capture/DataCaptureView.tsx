import React, { useState } from 'react';
import {
  ArrowRight,
  BarChart2,
  ClipboardList,
  FileSpreadsheet,
  Sliders,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DescriptiveStatsPanel } from './DescriptiveStatsPanel';
import { ExcelImportPanel } from './ExcelImportPanel';
import { FieldObserverPanel } from './FieldObserverPanel';
import { ManualParamsPanel } from './ManualParamsPanel';

type DataTab = 'excel' | 'manual' | 'field' | 'stats';

export const DataCaptureView: React.FC = () => {
  const { setActiveStep, fieldRecords } = useApp();
  const [activeTab, setActiveTab] = useState<DataTab>('excel');

  return (
    <div className="space-y-5">
      {/* Sub-navigation Tabs for Epic E1 */}
      <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-sm flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('excel')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'excel'
                ? 'bg-[#0033A0] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Importar Excel/CSV (HU-02)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'manual'
                ? 'bg-[#0033A0] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Ingreso Manual (HU-03)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('field')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'field'
                ? 'bg-[#0033A0] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>Captura en Campo (HU-01)</span>
            {fieldRecords.length > 0 && (
              <span className="bg-emerald-500 text-white text-[10px] px-1.5 py-0.2 rounded-full">
                {fieldRecords.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('stats')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'stats'
                ? 'bg-[#0033A0] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            <span>Estadística y Muestra (HU-04)</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => setActiveStep(2)}
          className="flex items-center gap-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-xs sm:text-sm px-4 py-2 rounded-xl shadow-sm transition-all ml-auto"
        >
          <span>Siguiente: Elegir Modelo</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'excel' && <ExcelImportPanel />}
      {activeTab === 'manual' && <ManualParamsPanel />}
      {activeTab === 'field' && <FieldObserverPanel />}
      {activeTab === 'stats' && <DescriptiveStatsPanel />}
    </div>
  );
};

