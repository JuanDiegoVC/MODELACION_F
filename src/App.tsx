import React, { useState } from 'react';
import { HeaderNavbar } from './presentation/components/common/HeaderNavbar';
import { SplashScreen } from './presentation/components/common/SplashScreen';
import { DataCaptureView } from './presentation/components/data-capture/DataCaptureView';
import { ApkDownloadModal } from './presentation/components/modals/ApkDownloadModal';
import { HelpTheoryModal } from './presentation/components/modals/HelpTheoryModal';
import { HistoryDrawer } from './presentation/components/modals/HistoryDrawer';
import { ModelSelectionView } from './presentation/components/model-config/ModelSelectionView';
import { PdfReportView } from './presentation/components/report/PdfReportView';
import { ResultsDashboardView } from './presentation/components/results/ResultsDashboardView';
import { AppProvider, useApp } from './presentation/context/AppContext';

const MainWorkspace: React.FC = () => {
  const { activeStep } = useApp();
  const [showSplash, setShowSplash] = useState(true);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const [showApkModal, setShowApkModal] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}

      <HeaderNavbar
        onOpenHelp={() => setShowHelpModal(true)}
        onOpenHistory={() => setShowHistoryDrawer(true)}
        onOpenApkModal={() => setShowApkModal(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-5">
        {activeStep === 1 && <DataCaptureView />}
        {activeStep === 2 && <ModelSelectionView />}
        {activeStep === 3 && <ResultsDashboardView />}
        {activeStep === 4 && <PdfReportView />}
      </main>

      <footer className="bg-white border-t border-slate-200 py-3 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            <strong>Urgencias Colas SURA</strong> — Sistema de Modelamiento M/M/1 y M/M/S (Clean
            Architecture • SOLID • DRY • KISS)
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowHelpModal(true)}
              className="text-[#0033A0] font-semibold hover:underline"
            >
              Glosario y Teoría
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => setShowApkModal(true)}
              className="text-emerald-700 font-bold hover:underline"
            >
              Descargar APK Android
            </button>
          </div>
        </div>
      </footer>

      {showHelpModal && <HelpTheoryModal onClose={() => setShowHelpModal(false)} />}
      {showHistoryDrawer && <HistoryDrawer onClose={() => setShowHistoryDrawer(false)} />}
      {showApkModal && <ApkDownloadModal onClose={() => setShowApkModal(false)} />}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AppProvider>
      <MainWorkspace />
    </AppProvider>
  );
};

export default App;

