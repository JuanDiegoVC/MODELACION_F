import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  ExternalLink,
  FileText,
  RefreshCw,
  Share2,
} from 'lucide-react';
import { SoundEffectsService } from '../../../infrastructure/audio/SoundEffectsService';
import {
  PdfOutputHandle,
  PdfReportGenerator,
} from '../../../infrastructure/pdf/PdfReportGenerator';
import { useApp } from '../../context/AppContext';

export const PdfReportView: React.FC = () => {
  const {
    currentResult,
    descriptiveAnalysis,
    savedScenarios,
    costAnalysis,
    timeUnit,
    settings,
    setActiveStep,
  } = useApp();

  const [pdfHandle, setPdfHandle] = useState<PdfOutputHandle | null>(null);
  const [generating, setGenerating] = useState(false);
  const [savedNotification, setSavedNotification] = useState<string | null>(null);
  const [generationMs, setGenerationMs] = useState<number>(0);

  const buildPdfNow = async () => {
    setGenerating(true);
    const t0 = performance.now();
    try {
      const handle = await PdfReportGenerator.generateReport({
        result: currentResult,
        descriptiveAnalysis,
        savedScenarios,
        costAnalysis,
        timeUnit,
      });
      setPdfHandle(handle);
      setGenerationMs(Math.round(performance.now() - t0));
      SoundEffectsService.playPdfGenerated(settings.soundEnabled);
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    buildPdfNow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentResult.id, timeUnit, savedScenarios.length]);

  const handleDownload = async () => {
    if (!pdfHandle) return;
    const res = await PdfReportGenerator.downloadPdf(pdfHandle);
    setSavedNotification(`Archivo guardado exitosamente en: ${res.savedPath}`);
    SoundEffectsService.playTap(settings.soundEnabled);
  };

  const handleShare = async () => {
    if (!pdfHandle) return;
    await PdfReportGenerator.sharePdf(
      pdfHandle,
      `Informe Teoría de Colas - ${
        currentResult.model === 'MM1' ? 'M/M/1' : `M/M/${currentResult.servers}`
      }`
    );
  };

  return (
    <div className="space-y-5">
      {/* Control Card (HU-14 & HU-15) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full">
              HU-14 & HU-15 • Generación, Descarga y Compartir Informe PDF Automático
            </span>
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-1.5">
              Informe Técnico Completo Listo para Entrega
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
              Generado en <strong>{generationMs} ms</strong> (&lt; 5 s) con el orden estricto de
              HU-14: Portada, Datos de Entrada, Estadística Descriptiva, Supuestos, Ecuaciones
              Sustituidas, Resultados, Gráficas, Escenarios y Conclusión Automática.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleDownload}
              disabled={!pdfHandle || generating}
              className="flex items-center gap-2 bg-[#0033A0] hover:bg-blue-800 text-white font-extrabold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-md transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Descargar PDF</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              disabled={!pdfHandle || generating}
              className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-md transition-all"
            >
              <Share2 className="w-4 h-4" />
              <span>Compartir (WhatsApp / Correo / Drive)</span>
            </button>

            {pdfHandle && (
              <a
                href={pdfHandle.blobUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm px-3.5 py-2.5 rounded-xl"
              >
                <ExternalLink className="w-4 h-4 text-blue-700" />
                <span>Abrir en pestaña</span>
              </a>
            )}

            <button
              type="button"
              onClick={buildPdfNow}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"
              title="Regenerar PDF"
            >
              <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* File name & saved notification (HU-15.1 & HU-15.3) */}
        {pdfHandle && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-slate-700">
              <FileText className="w-4 h-4 text-[#0033A0]" />
              <span>
                Nombre oficial del archivo (HU-15.1):{' '}
                <code className="font-mono font-bold text-[#0033A0] bg-blue-50 px-2 py-0.5 rounded">
                  {pdfHandle.fileName}
                </code>
              </span>
            </div>

            {savedNotification && (
              <div className="flex items-center gap-2 text-emerald-800 font-bold bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{savedNotification}</span>
                <a
                  href={pdfHandle.blobUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-[#0033A0] ml-2"
                >
                  Abrir
                </a>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Embedded PDF Preview */}
      {pdfHandle && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-4 py-2.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-700">
            <span>Vista Previa Interactiva del Documento PDF</span>
            <button
              type="button"
              onClick={() => setActiveStep(3)}
              className="inline-flex items-center gap-1 text-[#0033A0] hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Volver a Resultados</span>
            </button>
          </div>
          <iframe
            src={pdfHandle.blobUrl}
            title="Vista previa del informe PDF"
            className="w-full h-[640px] border-0"
          />
        </div>
      )}
    </div>
  );
};

