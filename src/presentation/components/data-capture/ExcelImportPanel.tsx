import React, { useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  RefreshCw,
  Table,
  Upload,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { formatNum } from '../../../domain/services/QueueCalculatorCommon';
import { SURA_MEDELLIN_RECORDS } from '../../../infrastructure/data/suraDefaultDataset';
import {
  ColumnMapping,
  ParsedSheetPreview,
  SpreadsheetImporter,
} from '../../../infrastructure/importers/SpreadsheetImporter';
import { useApp } from '../../context/AppContext';

export const ExcelImportPanel: React.FC = () => {
  const {
    importedRecords,
    importSummary,
    loadSuraDefaultDataset,
    setImportedDataset,
    settings,
    updateSettings,
  } = useApp();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<ParsedSheetPreview | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping>({
    arrivalTimeCol: '',
    interArrivalCol: '',
    serviceTimeCol: '',
    triageCol: '',
  });
  const [showMappingModal, setShowMappingModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPreviewTable, setShowPreviewTable] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg(null);

    try {
      const parsed = await SpreadsheetImporter.parseFilePreview(file);
      setPreview(parsed);

      if (parsed.autoDetectedMapping) {
        const result = SpreadsheetImporter.importWithMapping(
          parsed,
          parsed.autoDetectedMapping,
          settings.excludeFirstZeroInterArrival
        );
        if (result.records.length > 0) {
          setImportedDataset(result.records, result.summary);
        } else {
          // Open manual mapping if 0 valid rows
          setMapping(parsed.autoDetectedMapping);
          setShowMappingModal(true);
        }
      } else {
        // HU-02.3: Manual column mapping when columns differ
        const h = parsed.headers;
        setMapping({
          arrivalTimeCol: h[0] || '',
          interArrivalCol: h[1] || h[0] || '',
          serviceTimeCol: h[2] || h[1] || '',
          triageCol: h[3] || '',
        });
        setShowMappingModal(true);
      }
    } catch (err) {
      setErrorMsg(
        `No se pudo leer el archivo (${err instanceof Error ? err.message : 'Formato inválido'}). Asegúrese de subir un archivo .xlsx o .csv válido.`
      );
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleApplyManualMapping = () => {
    if (!preview) return;
    if (!mapping.interArrivalCol || !mapping.serviceTimeCol) {
      setErrorMsg('Debe seleccionar al menos las columnas de Tiempo entre Llegadas y Tiempo de Atención.');
      return;
    }
    const result = SpreadsheetImporter.importWithMapping(
      preview,
      mapping,
      settings.excludeFirstZeroInterArrival
    );
    setImportedDataset(result.records, result.summary);
    setShowMappingModal(false);
  };

  const handleDownloadSampleExcel = () => {
    const wb = XLSX.utils.book_new();
    const sheetRows: unknown[][] = [
      ['REGISTROS SIMULADOS - PROCESO DE REGISTRO Y ATENCIÓN EN URGENCIAS SURA MEDELLÍN'],
      [
        'ID',
        'Hora de Llegada',
        'Tiempo Entre Llegadas (min)',
        'Tiempo de Atención (min)',
        'Clasificación Triage',
      ],
      ...SURA_MEDELLIN_RECORDS.map((r) => [
        r.id,
        r.arrivalTimeStr,
        r.interArrivalMin ?? 0,
        r.serviceTimeMin ?? 0,
        r.triage ?? 'III',
      ]),
    ];
    const ws = XLSX.utils.aoa_to_sheet(sheetRows);
    XLSX.utils.book_append_sheet(wb, ws, 'Registros Urgencias');
    XLSX.writeFile(wb, 'registros_atencion_sura_medellin.xlsx');
  };

  return (
    <div className="space-y-5">
      {/* Top Action Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full">
              HU-02 • Importación Excel / CSV
            </span>
            <h3 className="text-lg font-bold text-slate-900 mt-1.5">
              Cargar Base de Datos de Registros de Atención
            </h3>
            <p className="text-sm text-slate-600 mt-0.5">
              Importe un archivo <code className="bg-slate-100 px-1.5 py-0.5 rounded">.xlsx</code> o{' '}
              <code className="bg-slate-100 px-1.5 py-0.5 rounded">.csv</code>. El sistema ignora filas de
              título automáticamente, detecta encabezados y valida valores numéricos.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 bg-[#0033A0] hover:bg-[#002677] text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow-sm transition-all"
            >
              <Upload className="w-4 h-4" />
              <span>Subir Excel / CSV</span>
            </button>

            <button
              type="button"
              onClick={() => loadSuraDefaultDataset(true)}
              className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold text-sm px-3.5 py-2.5 rounded-xl shadow-sm transition-all"
              title="Restaurar los 200 registros oficiales de SURA Medellín"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Cargar SURA Medellín (200 reg.)</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadSampleExcel}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs sm:text-sm px-3 py-2.5 rounded-xl transition-colors"
              title="Descargar archivo registros_atencion_sura_medellin.xlsx"
            >
              <Download className="w-4 h-4 text-blue-700" />
              <span>Descargar .xlsx</span>
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Post-import Summary (HU-02.5 & HU-03.6) */}
      <div className="bg-gradient-to-br from-blue-950 via-[#002884] to-[#0033A0] text-white rounded-2xl p-4 sm:p-6 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/15 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-cyan-400/20 border border-cyan-300/30 flex items-center justify-center">
              <FileSpreadsheet className="w-6 h-6 text-cyan-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                  Resumen de Muestra Cargada
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-400/20 text-emerald-200 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3" /> Activo
                </span>
              </div>
              <h4 className="font-bold text-base sm:text-lg truncate">{importSummary.sourceName}</h4>
            </div>
          </div>

          {/* Rule of First Record Toggle (HU-03.6 / Alerta 4) */}
          <div className="bg-white/10 rounded-xl p-2.5 border border-white/15 flex flex-col gap-1">
            <span className="text-[11px] text-cyan-200 font-semibold">
              Regla del primer registro (HU-03.6):
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => loadSuraDefaultDataset(false)}
                className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  settings.excludeFirstZeroInterArrival
                    ? 'bg-cyan-400 text-slate-950 font-bold'
                    : 'bg-white/10 text-blue-100 hover:bg-white/20'
                }`}
              >
                Excluir 0 inicial (n=199 → 3,981 min)
              </button>
              <button
                type="button"
                onClick={() => loadSuraDefaultDataset(true)}
                className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  !settings.excludeFirstZeroInterArrival
                    ? 'bg-cyan-400 text-slate-950 font-bold'
                    : 'bg-white/10 text-blue-100 hover:bg-white/20'
                }`}
              >
                Hoja Estadísticas (n=200 → 3,961 min)
              </button>
            </div>
          </div>
        </div>

        {/* Summary Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <div className="bg-white/10 rounded-xl p-3 border border-white/10">
            <span className="text-xs text-blue-200">Registros Válidos</span>
            <p className="text-xl sm:text-2xl font-extrabold mt-0.5">
              {importSummary.totalValidRecords}
            </p>
            <span className="text-[11px] text-cyan-200">
              Usados en interllegada: {settings.excludeFirstZeroInterArrival ? 199 : 200}
            </span>
          </div>

          <div className="bg-white/10 rounded-xl p-3 border border-white/10">
            <span className="text-xs text-blue-200">Rango Horario</span>
            <p className="text-xl sm:text-2xl font-extrabold mt-0.5">
              {importSummary.timeRange.start}–{importSummary.timeRange.end}
            </p>
            <span className="text-[11px] text-cyan-200">Jornada de observación (13,2 h)</span>
          </div>

          <div className="bg-white/10 rounded-xl p-3 border border-white/10 col-span-2">
            <span className="text-xs text-blue-200">Distribución por Clasificación de Triage</span>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <span className="px-2.5 py-1 rounded-lg bg-amber-400/20 border border-amber-300/40 text-amber-200 text-xs font-bold">
                Triage III: {importSummary.triageCounts.III}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-400/20 border border-emerald-300/40 text-emerald-200 text-xs font-bold">
                Triage IV: {importSummary.triageCounts.IV}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-cyan-400/20 border border-cyan-300/40 text-cyan-200 text-xs font-bold">
                Triage V: {importSummary.triageCounts.V}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-orange-400/20 border border-orange-300/40 text-orange-200 text-xs font-bold">
                Triage II: {importSummary.triageCounts.II}
              </span>
              {importSummary.triageCounts.I > 0 && (
                <span className="px-2.5 py-1 rounded-lg bg-red-400/20 border border-red-300/40 text-red-200 text-xs font-bold">
                  Triage I: {importSummary.triageCounts.I}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Rejected rows report (HU-02.4) */}
        {importSummary.rejectedRows.length > 0 && (
          <div className="mt-4 bg-amber-500/20 border border-amber-300/40 rounded-xl p-3 text-xs text-amber-100">
            <p className="font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-300" />
              Se rechazaron {importSummary.rejectedRows.length} filas con datos inválidos:
            </p>
            <ul className="list-disc list-inside mt-1 space-y-0.5 max-h-28 overflow-y-auto">
              {importSummary.rejectedRows.slice(0, 10).map((rej, i) => (
                <li key={i}>
                  Fila {rej.rowNumber}: {rej.reason}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={() => setShowPreviewTable(!showPreviewTable)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-200 hover:text-white underline"
          >
            <Table className="w-4 h-4" />
            <span>
              {showPreviewTable
                ? 'Ocultar tabla de registros cargados'
                : `Ver tabla de registros (${importedRecords.length} filas)`}
            </span>
          </button>

          {preview && (
            <button
              type="button"
              onClick={() => setShowMappingModal(true)}
              className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1 rounded-lg"
            >
              Mapeo manual de columnas
            </button>
          )}
        </div>
      </div>

      {/* Preview Table */}
      {showPreviewTable && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase">
              Vista previa de registros ({importedRecords.length} pacientes)
            </span>
          </div>
          <div className="max-h-72 overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead className="bg-slate-100 text-slate-700 sticky top-0">
                <tr>
                  <th className="py-2 px-3 font-bold"># ID</th>
                  <th className="py-2 px-3 font-bold">Hora Llegada</th>
                  <th className="py-2 px-3 font-bold">T. Entre Llegadas (min)</th>
                  <th className="py-2 px-3 font-bold">T. Atención (min)</th>
                  <th className="py-2 px-3 font-bold">Triage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {importedRecords.slice(0, 60).map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="py-1.5 px-3 font-medium text-slate-900">{r.id}</td>
                    <td className="py-1.5 px-3 text-slate-700">{r.arrivalTimeStr}</td>
                    <td className="py-1.5 px-3 text-slate-700">
                      {r.id === 1 && r.interArrivalMin === 0 ? (
                        <span className="text-amber-700 font-medium">
                          0 (1er reg. {settings.excludeFirstZeroInterArrival ? 'excluido' : 'incluido'})
                        </span>
                      ) : (
                        formatNum(r.interArrivalMin, 2)
                      )}
                    </td>
                    <td className="py-1.5 px-3 text-slate-700">{formatNum(r.serviceTimeMin, 2)}</td>
                    <td className="py-1.5 px-3">
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-800">
                        {r.triage || '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Manual Column Mapping Modal (HU-02.3) */}
      {showMappingModal && preview && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">
              Mapeo Manual de Columnas (HU-02.3)
            </h3>
            <p className="text-xs sm:text-sm text-slate-600">
              Indique a qué columna del archivo <strong>{preview.fileName}</strong> corresponde cada
              variable del modelo:
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tiempo entre Llegadas (min) *
                </label>
                <select
                  value={mapping.interArrivalCol}
                  onChange={(e) => setMapping({ ...mapping, interArrivalCol: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="">-- Seleccionar columna --</option>
                  {preview.headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tiempo de Atención (min) *
                </label>
                <select
                  value={mapping.serviceTimeCol}
                  onChange={(e) => setMapping({ ...mapping, serviceTimeCol: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="">-- Seleccionar columna --</option>
                  {preview.headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Hora de Llegada (opcional)
                </label>
                <select
                  value={mapping.arrivalTimeCol}
                  onChange={(e) => setMapping({ ...mapping, arrivalTimeCol: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="">-- Sin columna de hora --</option>
                  {preview.headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Clasificación Triage (opcional)
                </label>
                <select
                  value={mapping.triageCol}
                  onChange={(e) => setMapping({ ...mapping, triageCol: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="">-- Sin columna de Triage --</option>
                  {preview.headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowMappingModal(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleApplyManualMapping}
                className="px-4 py-2 rounded-xl text-sm font-bold bg-[#0033A0] text-white hover:bg-blue-800"
              >
                Importar Registros
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

