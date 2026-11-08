import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Edit3,
  Play,
  PlusCircle,
  Square,
  Trash2,
  UserPlus,
} from 'lucide-react';
import { PatientRecord, TriageLevel } from '../../../domain/entities/PatientRecord';
import { formatNum } from '../../../domain/services/QueueCalculatorCommon';
import { SoundEffectsService } from '../../../infrastructure/audio/SoundEffectsService';
import { useApp } from '../../context/AppContext';

const TRIAGE_OPTIONS: TriageLevel[] = ['I', 'II', 'III', 'IV', 'V'];

export const FieldObserverPanel: React.FC = () => {
  const { fieldRecords, updateFieldRecords, applyFieldRecordsToModel, settings } = useApp();

  const [selectedTriage, setSelectedTriage] = useState<TriageLevel>('III');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editServiceMin, setEditServiceMin] = useState<string>('');
  const [editTriage, setEditTriage] = useState<TriageLevel>('III');
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  const formatTimeFromMs = (ms: number): string => {
    const d = new Date(ms);
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  };

  // HU-01.1 & HU-01.4: Tap "Llegada" creates consecutive ID & precision in seconds.
  // First record has null inter-arrival time (not 0).
  const handleRegisterArrival = () => {
    const nowMs = Date.now();
    const nextId =
      fieldRecords.length > 0 ? Math.max(...fieldRecords.map((r) => r.id)) + 1 : 1;
    const prevRecord =
      fieldRecords.length > 0 ? fieldRecords[fieldRecords.length - 1] : null;

    let interArrivalMin: number | null = null;
    if (prevRecord && prevRecord.arrivalTimestampMs) {
      interArrivalMin = Number(((nowMs - prevRecord.arrivalTimestampMs) / 60000).toFixed(2));
    }

    const newRec: PatientRecord = {
      id: nextId,
      arrivalTimeStr: formatTimeFromMs(nowMs),
      arrivalTimestampMs: nowMs,
      interArrivalMin,
      serviceTimeMin: null,
      triage: selectedTriage,
    };

    updateFieldRecords([...fieldRecords, newRec]);
    SoundEffectsService.playTap(settings.soundEnabled);
  };

  // HU-01.2: Start attention
  const handleStartService = (id: number) => {
    const nowMs = Date.now();
    const updated = fieldRecords.map((r) =>
      r.id === id ? { ...r, serviceStartTimestampMs: nowMs } : r
    );
    updateFieldRecords(updated);
    SoundEffectsService.playTap(settings.soundEnabled);
  };

  // HU-01.2 & HU-01.6: End attention (cannot be marked before Start attention)
  const handleEndService = (id: number) => {
    const nowMs = Date.now();
    const updated = fieldRecords.map((r) => {
      if (r.id !== id || !r.serviceStartTimestampMs) return r;
      const durationMin = Math.max(
        0.01,
        Number(((nowMs - r.serviceStartTimestampMs) / 60000).toFixed(2))
      );
      return {
        ...r,
        serviceEndTimestampMs: nowMs,
        serviceTimeMin: durationMin,
      };
    });
    updateFieldRecords(updated);
    SoundEffectsService.playCalculateSuccess(settings.soundEnabled);
  };

  // HU-01.7: Edit or delete record
  const handleSaveEdit = (id: number) => {
    const parsedService = Number(editServiceMin.replace(',', '.'));
    const updated = fieldRecords.map((r) =>
      r.id === id
        ? {
            ...r,
            triage: editTriage,
            serviceTimeMin:
              !Number.isNaN(parsedService) && parsedService > 0
                ? Number(parsedService.toFixed(2))
                : r.serviceTimeMin,
          }
        : r
    );
    updateFieldRecords(updated);
    setEditingId(null);
  };

  const handleConfirmDelete = () => {
    if (confirmDeleteId === null) return;
    const filtered = fieldRecords.filter((r) => r.id !== confirmDeleteId);
    // Recompute first record rule if first record was deleted
    if (filtered.length > 0) {
      filtered[0] = { ...filtered[0], interArrivalMin: null };
    }
    updateFieldRecords(filtered);
    setConfirmDeleteId(null);
  };

  const completedCount = fieldRecords.filter(
    (r) => r.serviceTimeMin !== null && r.serviceTimeMin > 0
  ).length;

  return (
    <div className="space-y-5">
      {/* Control Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full">
              HU-01 • Captura de Observaciones en Campo (100 % Persistente Offline)
            </span>
            <h3 className="text-lg font-bold text-slate-900 mt-1.5">
              Cronómetro Digital de Sala de Urgencias
            </h3>
            <p className="text-sm text-slate-600">
              Registre con un toque la llegada de cada paciente y el inicio/fin de su atención. Los
              registros se guardan automáticamente en el dispositivo aunque cierre la app.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Optional Triage selector before tapping Arrival (HU-01.3) */}
            <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-2 rounded-xl">
              <span className="text-xs font-bold text-slate-700">Triage:</span>
              {TRIAGE_OPTIONS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSelectedTriage(t)}
                  className={`w-7 h-7 rounded-lg text-xs font-extrabold transition-all ${
                    selectedTriage === t
                      ? 'bg-[#0033A0] text-white shadow-sm'
                      : 'bg-white text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleRegisterArrival}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-extrabold text-sm sm:text-base px-5 py-3 rounded-xl shadow-md transition-all"
            >
              <UserPlus className="w-5 h-5" />
              <span>+ Registrar Llegada</span>
            </button>
          </div>
        </div>

        {/* Action bar to send field records to Queue Model */}
        {fieldRecords.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs sm:text-sm text-slate-700">
              <strong>{fieldRecords.length}</strong> llegadas registradas •{' '}
              <strong>{completedCount}</strong> con atención finalizada
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={completedCount < 2}
                onClick={applyFieldRecordsToModel}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  completedCount >= 2
                    ? 'bg-[#0033A0] text-white hover:bg-blue-800 shadow-sm'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Usar estos registros en el Modelo ({completedCount} pac.)</span>
              </button>

              <button
                type="button"
                onClick={() => setConfirmClearAll(true)}
                className="text-xs text-red-600 hover:bg-red-50 px-3 py-2 rounded-xl font-semibold"
              >
                Reiniciar sesión
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Field Records List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {fieldRecords.length === 0 ? (
          <div className="p-8 text-center text-slate-500 space-y-2">
            <Clock className="w-10 h-10 mx-auto text-slate-300" />
            <p className="font-semibold text-slate-700">
              Aún no hay pacientes registrados en la sesión de campo
            </p>
            <p className="text-xs max-w-md mx-auto">
              Toque el botón verde <strong>"+ Registrar Llegada"</strong> cada vez que ingrese un
              paciente a la sala de urgencias. El primer registro tendrá el tiempo entre llegadas
              vacío (HU-01.4).
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="py-2.5 px-3 font-bold">ID</th>
                  <th className="py-2.5 px-3 font-bold">Hora Llegada</th>
                  <th className="py-2.5 px-3 font-bold">Entre Llegadas (min)</th>
                  <th className="py-2.5 px-3 font-bold">Control de Atención</th>
                  <th className="py-2.5 px-3 font-bold">T. Atención (min)</th>
                  <th className="py-2.5 px-3 font-bold">Triage</th>
                  <th className="py-2.5 px-3 font-bold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {fieldRecords.map((rec, index) => {
                  const hasStarted = Boolean(rec.serviceStartTimestampMs);
                  const hasEnded = rec.serviceTimeMin !== null;
                  const isEditing = editingId === rec.id;

                  return (
                    <tr key={rec.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-bold text-slate-900">#{rec.id}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-700">
                        {rec.arrivalTimeStr}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">
                        {index === 0 || rec.interArrivalMin === null ? (
                          <span className="text-slate-400 italic">Vacío (1er paciente)</span>
                        ) : (
                          `${formatNum(rec.interArrivalMin, 2)} min`
                        )}
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={hasStarted}
                            onClick={() => handleStartService(rec.id)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              hasStarted
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                            }`}
                          >
                            <Play className="w-3 h-3" />
                            <span>
                              {hasStarted && rec.serviceStartTimestampMs
                                ? formatTimeFromMs(rec.serviceStartTimestampMs)
                                : 'Inicia atención'}
                            </span>
                          </button>

                          {/* HU-01.6: Cannot mark "Termina atención" before "Inicia atención" */}
                          <button
                            type="button"
                            disabled={!hasStarted || hasEnded}
                            onClick={() => handleEndService(rec.id)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              !hasStarted || hasEnded
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : 'bg-amber-600 hover:bg-amber-700 text-white shadow-sm'
                            }`}
                            title={
                              !hasStarted
                                ? 'Debe tocar primero "Inicia atención" (HU-01.6)'
                                : 'Finalizar y calcular tiempo de atención'
                            }
                          >
                            <Square className="w-3 h-3" />
                            <span>Termina atención</span>
                          </button>
                        </div>
                      </td>

                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editServiceMin}
                            onChange={(e) => setEditServiceMin(e.target.value)}
                            className="w-20 border border-blue-400 rounded px-2 py-1 text-xs"
                            placeholder="min"
                          />
                        ) : rec.serviceTimeMin !== null ? (
                          <span className="text-emerald-700 font-bold">
                            {formatNum(rec.serviceTimeMin, 2)} min
                          </span>
                        ) : hasStarted ? (
                          <span className="text-amber-600 text-xs animate-pulse">
                            En consulta...
                          </span>
                        ) : (
                          <span className="text-slate-400">En espera</span>
                        )}
                      </td>

                      <td className="py-2.5 px-3">
                        {isEditing ? (
                          <select
                            value={editTriage}
                            onChange={(e) => setEditTriage(e.target.value as TriageLevel)}
                            className="border border-blue-400 rounded px-1.5 py-1 text-xs"
                          >
                            {TRIAGE_OPTIONS.map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-800">
                            {rec.triage || '—'}
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-right">
                        {isEditing ? (
                          <div className="inline-flex gap-1">
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(rec.id)}
                              className="text-xs bg-emerald-600 text-white px-2 py-1 rounded font-bold"
                            >
                              Guardar
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="text-xs bg-slate-200 text-slate-700 px-2 py-1 rounded"
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingId(rec.id);
                                setEditServiceMin(
                                  rec.serviceTimeMin !== null ? String(rec.serviceTimeMin) : '10'
                                );
                                setEditTriage(rec.triage || 'III');
                              }}
                              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-blue-700"
                              title="Editar registro (HU-01.7)"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(rec.id)}
                              className="p-1.5 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600"
                              title="Borrar registro (HU-01.7)"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modal for Delete (HU-01.7) */}
      {confirmDeleteId !== null && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <h4 className="font-bold text-slate-900 text-base">
              ¿Confirmar eliminación del registro #{confirmDeleteId}?
            </h4>
            <p className="text-xs sm:text-sm text-slate-600">
              Esta acción eliminará el paciente seleccionado de la sesión de observación actual.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-red-600 text-white hover:bg-red-700"
              >
                Sí, borrar registro
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmClearAll && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <h4 className="font-bold text-slate-900 text-base">
              ¿Reiniciar toda la sesión de campo?
            </h4>
            <p className="text-xs sm:text-sm text-slate-600">
              Se borrarán todos los registros de observación tomados en campo.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmClearAll(false)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  updateFieldRecords([]);
                  setConfirmClearAll(false);
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-red-600 text-white hover:bg-red-700"
              >
                Sí, vaciar todo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

