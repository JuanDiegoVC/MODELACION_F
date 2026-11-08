import React, { useEffect, useState } from 'react';
import { Activity, ShieldCheck } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setFading(true), 1350);
    const t2 = setTimeout(() => onComplete(), 1700);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onComplete]);

  return (
    <div
      onClick={onComplete}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-[#001E62] via-[#0033A0] to-[#007A99] text-white transition-opacity duration-300 cursor-pointer ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="relative flex items-center justify-center mb-6">
        <div className="absolute w-28 h-28 rounded-full bg-cyan-400/20 animate-ping" />
        <div className="relative w-24 h-24 rounded-3xl bg-white/15 backdrop-blur-md border border-white/30 shadow-2xl flex items-center justify-center">
          <Activity className="w-12 h-12 text-cyan-300 animate-pulse" />
        </div>
      </div>

      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-center px-4">
        Urgencias Colas <span className="text-cyan-300">SURA</span>
      </h1>
      <p className="mt-2 text-sm sm:text-base text-blue-100 text-center max-w-md px-6">
        Modelamiento Analítico y Simulación M/M/1 y M/M/S para Procesos de Registro y Atención en Urgencias
      </p>

      <div className="mt-8 w-48 h-1.5 bg-white/20 rounded-full overflow-hidden">
        <div className="h-full bg-cyan-300 rounded-full animate-[width_1.4s_ease-in-out]" style={{ width: '100%' }} />
      </div>

      <div className="mt-6 flex items-center gap-2 text-xs text-blue-200">
        <ShieldCheck className="w-4 h-4 text-cyan-300" />
        <span>100 % Offline • Web & Android APK • Clean Architecture</span>
      </div>
    </div>
  );
};

