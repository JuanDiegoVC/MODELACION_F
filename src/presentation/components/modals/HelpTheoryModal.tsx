import React, { useState } from 'react';
import { BookOpen, CheckCircle2, HelpCircle, Layers, X } from 'lucide-react';

interface HelpTheoryModalProps {
  onClose: () => void;
}

const GLOSSARY_ITEMS = [
  {
    symbol: 'λ (Lambda)',
    name: 'Tasa media de llegada',
    unit: 'pacientes / hora',
    desc: 'Número promedio de pacientes que ingresan al servicio de urgencias por unidad de tiempo. Se calcula como λ = 60 / (Tiempo medio entre llegadas en min).',
  },
  {
    symbol: 'μ (Mu)',
    name: 'Tasa media de servicio por servidor',
    unit: 'pacientes / hora',
    desc: 'Número promedio de pacientes que 1 puesto de atención puede atender por hora si trabaja de forma continua. Se calcula como μ = 60 / (Tiempo medio de atención en min).',
  },
  {
    symbol: 's',
    name: 'Número de servidores en paralelo',
    unit: 'puestos / consultorios',
    desc: 'Cantidad de médicos, taquillas de registro o consultorios atendiendo una misma fila de urgencias.',
  },
  {
    symbol: 'ρ (Rho)',
    name: 'Factor de utilización del sistema',
    unit: 'adimensional o %',
    desc: 'Fracción del tiempo que cada servidor permanece ocupado: ρ = λ / (s·μ). Para que el sistema sea estable debe cumplirse ρ < 1 (100 %).',
  },
  {
    symbol: 'L',
    name: 'Pacientes promedio en el sistema',
    unit: 'pacientes',
    desc: 'Cantidad promedio total de pacientes en urgencias en cualquier instante (los que esperan en sala + los que están siendo atendidos).',
  },
  {
    symbol: 'Lq',
    name: 'Pacientes promedio en la cola',
    unit: 'pacientes',
    desc: 'Cantidad promedio de pacientes esperando en la fila antes de pasar a consulta.',
  },
  {
    symbol: 'W',
    name: 'Tiempo promedio en el sistema',
    unit: 'minutos u horas',
    desc: 'Tiempo total promedio que un paciente permanece en urgencias (espera en fila + tiempo de atención). Cumple la Ley de Little: L = λ·W.',
  },
  {
    symbol: 'Wq',
    name: 'Tiempo promedio de espera en la cola',
    unit: 'minutos u horas',
    desc: 'Tiempo promedio que un paciente aguarda en la sala de espera antes de ser llamado. Cumple Lq = λ·Wq.',
  },
  {
    symbol: 'P₀',
    name: 'Probabilidad de sistema vacío',
    unit: 'probabilidad (0 a 1)',
    desc: 'Probabilidad estacionaria de que no haya ningún paciente en urgencias (todos los servidores libres).',
  },
  {
    symbol: 'Pw',
    name: 'Probabilidad de esperar (Fórmula Erlang-C)',
    unit: 'probabilidad (0 a 1)',
    desc: 'Probabilidad de que un paciente que acaba de llegar encuentre todos los s servidores ocupados y deba hacer fila.',
  },
  {
    symbol: 'Pn',
    name: 'Probabilidad de n pacientes en el sistema',
    unit: 'probabilidad (0 a 1)',
    desc: 'Probabilidad estacionaria de encontrar exactamente n pacientes dentro del servicio de urgencias.',
  },
];

export const HelpTheoryModal: React.FC<HelpTheoryModalProps> = ({ onClose }) => {
  const [tab, setTab] = useState<'glossary' | 'kendall' | 'example'>('glossary');

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 bg-[#001E62] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-6 h-6 text-cyan-300" />
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-300">
                HU-18 • Centro de Ayuda y Fundamentación Teórica
              </span>
              <h3 className="text-base sm:text-lg font-extrabold">
                Glosario de Símbolos, Notación de Kendall y Caso Resuelto de Urgencias
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

        {/* Tabs */}
        <div className="px-5 py-2.5 bg-slate-100 border-b border-slate-200 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTab('glossary')}
            className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              tab === 'glossary'
                ? 'bg-[#0033A0] text-white shadow-sm'
                : 'text-slate-600 hover:bg-white'
            }`}
          >
            1. Glosario de Símbolos (HU-18.1)
          </button>
          <button
            type="button"
            onClick={() => setTab('kendall')}
            className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              tab === 'kendall'
                ? 'bg-[#0033A0] text-white shadow-sm'
                : 'text-slate-600 hover:bg-white'
            }`}
          >
            2. Notación de Kendall A/B/s (HU-18.2)
          </button>
          <button
            type="button"
            onClick={() => setTab('example')}
            className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              tab === 'example'
                ? 'bg-[#0033A0] text-white shadow-sm'
                : 'text-slate-600 hover:bg-white'
            }`}
          >
            3. Ejemplo Resuelto: Urgencias SURA (HU-18.3)
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-700">
          {tab === 'glossary' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {GLOSSARY_ITEMS.map((item) => (
                <div
                  key={item.symbol}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-serif font-extrabold text-base text-[#0033A0]">
                      {item.symbol}
                    </span>
                    <span className="text-[11px] font-semibold bg-blue-50 text-blue-800 px-2 py-0.5 rounded-full">
                      {item.unit}
                    </span>
                  </div>
                  <div className="font-bold text-slate-900">{item.name}</div>
                  <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          )}

          {tab === 'kendall' && (
            <div className="space-y-4">
              <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 space-y-2">
                <h4 className="font-extrabold text-base text-[#001E62] flex items-center gap-2">
                  <Layers className="w-5 h-5 text-[#0033A0]" />
                  ¿Qué significa la Notación de Kendall (A / B / s / K / N / D)?
                </h4>
                <p>
                  Propuesta por David G. Kendall (1953), describe de forma estandarizada cualquier
                  sistema de líneas de espera mediante tres parámetros principales{' '}
                  <strong>A / B / s</strong>:
                </p>
                <ul className="list-disc list-inside space-y-1.5 pt-1">
                  <li>
                    <strong>A (Distribución de llegadas):</strong> <code>M</code> indica{' '}
                    <em>Markoviana / Memoryless</em> (llegadas según proceso de Poisson, tiempos
                    entre llegadas exponenciales).
                  </li>
                  <li>
                    <strong>B (Distribución del tiempo de servicio):</strong> <code>M</code> indica
                    tiempos de atención exponenciales; <code>G</code> indica distribución general;{' '}
                    <code>D</code> determinística.
                  </li>
                  <li>
                    <strong>s (Número de servidores):</strong> Cantidad de estaciones de servicio en
                    paralelo (<code>1</code> en M/M/1, <code>S</code> en M/M/S).
                  </li>
                </ul>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2">
                  <h5 className="font-extrabold text-slate-900 text-sm">
                    ¿Cuándo usar M/M/1?
                  </h5>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Cuando existe <strong>un único puesto de atención</strong> (por ejemplo, una
                    sola ventanilla de admisión o un único médico de triage) y la tasa de llegada λ
                    es estrictamente menor que la tasa de servicio μ (ρ = λ/μ &lt; 1).
                  </p>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2">
                  <h5 className="font-extrabold text-slate-900 text-sm">
                    ¿Cuándo usar M/M/S?
                  </h5>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Cuando los pacientes esperan en una fila común y pasan al primer consultorio o
                    puesto libre entre <strong>s servidores idénticos en paralelo</strong>. Es
                    indispensable cuando λ ≥ μ (como ocurre en urgencias hospitalarias donde r =
                    λ/μ ≈ 2,96).
                  </p>
                </div>
              </div>
            </div>
          )}

          {tab === 'example' && (
            <div className="space-y-4">
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 space-y-2">
                <h4 className="font-extrabold text-base text-emerald-950 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  Caso Resuelto Paso a Paso: Urgencias SURA Medellín (200 Registros)
                </h4>
                <p className="text-xs text-emerald-900">
                  A partir del archivo <code>registros_atencion_sura_medellin.xlsx</code> (jornada
                  07:00–20:12):
                </p>
              </div>

              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <p>
                  <strong>Paso 1 — Estimación de tasas (λ y μ):</strong>
                  <br />• Tiempo medio entre llegadas = <strong>3,961 min</strong> →{' '}
                  <code>λ = 60 / 3,961 = 15,15 pacientes/hora</code>.
                  <br />• Tiempo medio de atención = <strong>11,718 min</strong> →{' '}
                  <code>μ = 60 / 11,718 = 5,12 pacientes/hora por servidor</code>.
                  <br />• Intensidad de tráfico: <code>r = λ / μ = 15,15 / 5,12 = 2,96 Erlangs</code>.
                </p>

                <p>
                  <strong>Paso 2 — Análisis de estabilidad:</strong>
                  <br />• Con <strong>s = 1 (M/M/1)</strong> o <strong>s = 2</strong>, ρ = 2,96 / s
                  &gt; 1 → <strong>Sistema Inestable</strong> (la cola crece sin límite).
                  <br />• El mínimo entero con s &gt; 2,96 es <strong>s = 3 servidores</strong>.
                </p>

                <p>
                  <strong>Paso 3 — Comparación entre s = 3, s = 4 y s = 5 (Modelo M/M/S):</strong>
                  <br />• Con <strong>s = 3:</strong> ρ = 98,62 % (casi saturado), Lq = 69,36
                  pacientes en fila y Wq = <strong>274,74 min</strong> (4,5 horas de espera).
                  <br />• Con <strong>s = 4:</strong> ρ = 73,96 % (equilibrio saludable), Lq cae a{' '}
                  <strong>1,398 pacientes</strong> y la espera en cola baja a{' '}
                  <strong>Wq = 5,54 min</strong> (tiempo total W = 17,26 min, Pw = 49,2 %).
                  <br />• Con <strong>s = 5:</strong> ρ = 59,17 %, Lq = 0,327 pacientes y{' '}
                  <strong>Wq = 1,30 min</strong> (Pw = 22,6 %).
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#0033A0] text-white text-xs sm:text-sm font-bold"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};

