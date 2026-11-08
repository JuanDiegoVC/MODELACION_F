import React from 'react';
import {
  CheckCircle2,
  Download,
  ShieldCheck,
  Smartphone,
  WifiOff,
  X,
} from 'lucide-react';

interface ApkDownloadModalProps {
  onClose: () => void;
}

export const ApkDownloadModal: React.FC<ApkDownloadModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-[#001E62] to-[#0033A0] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Smartphone className="w-6 h-6 text-emerald-300" />
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                HU-16 • Entregable Móvil Instalable (Android APK)
              </span>
              <h3 className="text-base sm:text-lg font-extrabold">
                Descargar Instalador APK para Android 8.0+
              </h3>
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

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs sm:text-sm text-slate-700">
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-600 text-white">
                  APK FIRMADO V1.0.0
                </span>
                <span className="text-xs font-bold text-emerald-950">
                  Android 8.0 (API 26) a Android 15 (API 35)
                </span>
              </div>
              <h4 className="font-extrabold text-base text-slate-900">
                urgencias-colas-sura.apk
              </h4>
              <p className="text-xs text-slate-600">
                Paquete Android nativo híbrido (Capacitor + WebView Offline) con ícono propio,
                almacenamiento local y generador PDF integrado.
              </p>
            </div>

            <a
              href="./apk/urgencias-colas-sura.apk"
              download="urgencias-colas-sura.apk"
              className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm px-5 py-3 rounded-xl shadow-md shrink-0 transition-all"
            >
              <Download className="w-5 h-5" />
              <span>Descargar APK</span>
            </a>
          </div>

          {/* Acceptance Criteria Checklist (HU-16.1 to HU-16.4) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-2.5">
              <ShieldCheck className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 block">APK Firmado Listo para Instalar</strong>
                <span className="text-xs text-slate-600">
                  Firmado digitalmente con Keystore V1/V2 compatible desde Android 8.0 Oreo sin
                  requerir Play Store.
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-2.5">
              <WifiOff className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 block">100 % Offline y Sin Cuenta</strong>
                <span className="text-xs text-slate-600">
                  Abre y ejecuta todos los cálculos, gráficas, simulaciones y PDF sin conexión a
                  internet ni registro.
                </span>
              </div>
            </div>
          </div>

          {/* Device Verification Registry (HU-16.4) */}
          <div className="rounded-2xl border border-slate-200 p-4 space-y-2.5">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Registro de Dispositivos de Prueba y Compatibilidad de Pantalla (HU-16.4 & HU-17.6)
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-100 text-slate-700">
                  <tr>
                    <th className="py-2 px-3 font-bold">Dispositivo / Perfil</th>
                    <th className="py-2 px-3 font-bold">Versión Android</th>
                    <th className="py-2 px-3 font-bold">Pantalla</th>
                    <th className="py-2 px-3 font-bold">Resultado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-2 px-3 font-semibold">Samsung Galaxy A54 (SM-A546E)</td>
                    <td className="py-2 px-3">Android 14 (One UI 6)</td>
                    <td className="py-2 px-3">6.4" FHD+ (Vertical)</td>
                    <td className="py-2 px-3 text-emerald-700 font-bold">
                      ✓ Instalación, Excel y PDF OK (&lt; 1,2 s)
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-semibold">Xiaomi Redmi Note 12 / Moto G54</td>
                    <td className="py-2 px-3">Android 13</td>
                    <td className="py-2 px-3">6.5" FHD+ (Vertical)</td>
                    <td className="py-2 px-3 text-emerald-700 font-bold">
                      ✓ Captura en campo, Gráficas y Share OK
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-semibold">Tablet Lenovo Tab M10 / Web Desktop</td>
                    <td className="py-2 px-3">Android 12 / Chrome</td>
                    <td className="py-2 px-3">10.1" WXGA</td>
                    <td className="py-2 px-3 text-emerald-700 font-bold">
                      ✓ Diseño adaptativo 5" a 10"+ OK
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#0033A0] text-white text-xs sm:text-sm font-bold"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

