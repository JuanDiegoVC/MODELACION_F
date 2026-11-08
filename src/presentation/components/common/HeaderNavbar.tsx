import React from 'react';
import {
  Activity,
  BookOpen,
  Calculator,
  Database,
  Download,
  FileText,
  History,
  Smartphone,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useApp, WizardStep } from '../../context/AppContext';

interface HeaderNavbarProps {
  onOpenHelp: () => void;
  onOpenHistory: () => void;
  onOpenApkModal: () => void;
}

export const HeaderNavbar: React.FC<HeaderNavbarProps> = ({
  onOpenHelp,
  onOpenHistory,
  onOpenApkModal,
}) => {
  const { activeStep, setActiveStep, settings, updateSettings, history } = useApp();

  const steps: { step: WizardStep; label: string; shortLabel: string; icon: React.ReactNode }[] = [
    {
      step: 1,
      label: '1. Captura de Datos',
      shortLabel: '1. Datos',
      icon: <Database className="w-4 h-4" />,
    },
    {
      step: 2,
      label: '2. Modelo y Parámetros',
      shortLabel: '2. Modelo',
      icon: <Calculator className="w-4 h-4" />,
    },
    {
      step: 3,
      label: '3. Resultados y Mejora',
      shortLabel: '3. Resultados',
      icon: <Activity className="w-4 h-4" />,
    },
    {
      step: 4,
      label: '4. Informe PDF',
      shortLabel: '4. PDF',
      icon: <FileText className="w-4 h-4" />,
    },
  ];

  return (
    <header className="sticky top-0 z-30 bg-[#001E62] text-white shadow-lg border-b border-blue-800">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2">
        {/* Brand */}
        <div
          onClick={() => setActiveStep(1)}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base sm:text-lg tracking-tight leading-none">
                Urgencias Colas <span className="text-cyan-300">SURA</span>
              </span>
              <span className="hidden md:inline-block text-[11px] font-semibold bg-cyan-500/20 text-cyan-200 border border-cyan-400/30 px-2 py-0.5 rounded-full">
                M/M/1 • M/M/S
              </span>
            </div>
            <p className="text-[11px] text-blue-200 hidden sm:block">
              Modelamiento de Registro y Atención Hospitalaria — Medellín
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={onOpenApkModal}
            className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm px-2.5 sm:px-3.5 py-2 rounded-xl shadow-md transition-all"
            title="Descargar aplicación Android (.APK)"
          >
            <Smartphone className="w-4 h-4" />
            <span className="hidden sm:inline">Descargar</span>
            <span>APK</span>
            <Download className="w-3.5 h-3.5 hidden md:inline" />
          </button>

          <button
            type="button"
            onClick={onOpenHistory}
            className="relative flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm px-2.5 py-2 rounded-xl transition-colors"
            title="Historial de cálculos (HU-19)"
          >
            <History className="w-4 h-4 text-cyan-300" />
            <span className="hidden lg:inline">Historial</span>
            {history.length > 0 && (
              <span className="bg-cyan-400 text-slate-950 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                {history.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={onOpenHelp}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm px-2.5 py-2 rounded-xl transition-colors"
            title="Ayuda, Glosario y Teoría (HU-18)"
          >
            <BookOpen className="w-4 h-4 text-cyan-300" />
            <span className="hidden lg:inline">Teoría</span>
          </button>

          <button
            type="button"
            onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            title={settings.soundEnabled ? 'Silenciar sonidos (HU-17)' : 'Activar sonidos (HU-17)'}
            aria-label="Alternar sonido"
          >
            {settings.soundEnabled ? (
              <Volume2 className="w-4 h-4 text-cyan-300" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-400" />
            )}
          </button>
        </div>
      </div>

      {/* 4-Step Wizard Bar (HU-17.2) */}
      <nav
        aria-label="Pasos del flujo principal"
        className="bg-[#002884] border-t border-blue-800/80 px-2 sm:px-6 py-1.5"
      >
        <div className="max-w-7xl mx-auto grid grid-cols-4 gap-1.5 sm:gap-3">
          {steps.map((item) => {
            const isActive = activeStep === item.step;
            const isCompleted = activeStep > item.step;
            return (
              <button
                key={item.step}
                type="button"
                onClick={() => setActiveStep(item.step)}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-cyan-400 text-slate-950 shadow-sm scale-[1.01]'
                    : isCompleted
                    ? 'bg-blue-900/90 text-cyan-200 hover:bg-blue-800'
                    : 'bg-blue-950/50 text-blue-200 hover:bg-blue-900/60'
                }`}
              >
                {item.icon}
                <span className="hidden md:inline">{item.label}</span>
                <span className="md:hidden">{item.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </header>
  );
};

