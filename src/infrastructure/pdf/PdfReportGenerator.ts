import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DatasetDescriptiveAnalysis } from '../../domain/entities/DescriptiveStats';
import { IndicatorKey, TimeUnit } from '../../domain/entities/QueueParameters';
import { QueueCalculationResult } from '../../domain/entities/QueueResults';
import { CostAnalysisResult, SavedScenario } from '../../domain/entities/Scenario';
import { formatNum } from '../../domain/services/QueueCalculatorCommon';

export interface PdfGenerationInput {
  result: QueueCalculationResult;
  descriptiveAnalysis: DatasetDescriptiveAnalysis | null;
  savedScenarios: SavedScenario[];
  costAnalysis: CostAnalysisResult | null;
  timeUnit: TimeUnit;
}

export interface PdfOutputHandle {
  fileName: string;
  blob: Blob;
  blobUrl: string;
  savedPath: string;
}

/**
 * Sanitizes strings for jsPDF standard Helvetica (WinAnsiEncoding)
 * Preserves Spanish tildes (áéíóúÁÉÍÓÚ) and ñ/Ñ while mapping Greek/Unicode math
 * symbols to readable WinAnsi equivalents for tables, and renders full math via high-DPI Canvas.
 */
function winAnsiSafe(text: string): string {
  return text
    .replace(/λ/g, 'lambda')
    .replace(/μ/g, 'mu')
    .replace(/ρ/g, 'rho')
    .replace(/σ/g, 'sigma')
    .replace(/Σ/g, 'Suma')
    .replace(/₀/g, '0')
    .replace(/₁/g, '1')
    .replace(/₂/g, '2')
    .replace(/₃/g, '3')
    .replace(/₄/g, '4')
    .replace(/₅/g, '5')
    .replace(/⁻/g, '-')
    .replace(/¹/g, '1')
    .replace(/≥/g, '>=')
    .replace(/≤/g, '<=')
    .replace(/≈/g, '~')
    .replace(/−/g, '-')
    .replace(/–/g, '-')
    .replace(/—/g, '-');
}

export class PdfReportGenerator {
  public static buildFileName(model: string, servers: number): string {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const modelTag = model === 'MM1' ? 'MM1' : `MMS_s${servers}`;
    return `informe_colas_${modelTag}_${yyyy}-${mm}-${dd}_${hh}${min}.pdf`;
  }

  public static async generateReport(input: PdfGenerationInput): Promise<PdfOutputHandle> {
    const { result, descriptiveAnalysis, savedScenarios, costAnalysis, timeUnit } = input;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const now = new Date();
    const dateStr = now.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const timeStr = now.toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const modelLabel = result.model === 'MM1' ? 'M/M/1' : `M/M/S (s = ${result.servers})`;
    const selectedKeys = (Object.keys(result.params.selectedIndicators) as IndicatorKey[]).filter(
      (k) => result.params.selectedIndicators[k]
    );

    // =========================================================================
    // (a) PORTADA / ENCABEZADO INSTITUCIONAL
    // =========================================================================
    doc.setFillColor(0, 51, 160); // SURA Blue
    doc.rect(0, 0, pageWidth, 42, 'F');
    doc.setFillColor(0, 174, 199); // SURA Cyan accent
    doc.rect(0, 42, pageWidth, 3, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(17);
    doc.text('INFORME TÉCNICO DE TEORÍA DE COLAS — URGENCIAS', 14, 16);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text('Modelamiento del Proceso de Registro y Atención en Urgencias Hospitalarias', 14, 24);
    doc.setFontSize(9.5);
    doc.text(`Modelo evaluado: ${modelLabel}   |   Fecha de generación: ${dateStr} a las ${timeStr}`, 14, 34);

    let y = 53;

    // =========================================================================
    // (b) DATOS DE ENTRADA Y SU ORIGEN
    // =========================================================================
    doc.setTextColor(0, 30, 98);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('1. Datos de Entrada y Origen de la Muestra', 14, y);
    y += 3;

    autoTable(doc, {
      startY: y,
      head: [['Parámetro de Entrada', 'Valor', 'Unidad / Detalle']],
      body: [
        ['Origen de los datos', winAnsiSafe(result.params.sourceDescription), 'Fuente declarada'],
        ['Modelo seleccionado', modelLabel, result.model === 'MM1' ? 'Un servidor' : `${result.servers} servidores en paralelo`],
        ['Tiempo medio entre llegadas (1/lambda)', formatNum(result.params.meanInterArrivalMin, 3), 'minutos / paciente'],
        ['Tasa media de llegada (lambda)', formatNum(result.params.lambdaPerHour, 3), 'pacientes / hora'],
        ['Tiempo medio de atención (1/mu)', formatNum(result.params.meanServiceMin, 3), 'minutos / paciente'],
        ['Tasa media de servicio por servidor (mu)', formatNum(result.params.muPerHour, 3), 'pacientes / hora'],
        ['Intensidad de tráfico (r = lambda / mu)', formatNum(result.trafficIntensityR, 3), 'adimensional (Erlangs)'],
        ['Mínimo de servidores para estabilidad', `s = ${result.minStableServers}`, 'Menor entero s > lambda / mu'],
      ],
      theme: 'striped',
      headStyles: { fillColor: [0, 51, 160], fontSize: 9 },
      styles: { fontSize: 8.5, cellPadding: 2.2 },
    });

    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 7;

    // =========================================================================
    // (c) ESTADÍSTICA DESCRIPTIVA (SI EXISTE)
    // =========================================================================
    if (descriptiveAnalysis && descriptiveAnalysis.interArrivalStats.n > 0) {
      if (y > 230) {
        doc.addPage();
        y = 18;
      }
      doc.setTextColor(0, 30, 98);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('2. Estadística Descriptiva y Validación de la Muestra', 14, y);
      y += 3;

      const ia = descriptiveAnalysis.interArrivalStats;
      const sv = descriptiveAnalysis.serviceStats;
      const svWarn = sv.warningMessage
        ? `AVISO: CV = ${formatNum(sv.cv, 2)} (fuera de 0,7-1,3). ${sv.warningMessage}.`
        : 'Compatible con supuesto exponencial (CV entre 0,7 y 1,3).';

      autoTable(doc, {
        startY: y,
        head: [['Estadístico', 'Tiempo entre Llegadas (min)', 'Tiempo de Atención (min)']],
        body: [
          ['Tamaño de muestra usado (n)', `${ia.n} registros`, `${sv.n} registros`],
          ['Media muestral', `${formatNum(ia.mean, 3)} min`, `${formatNum(sv.mean, 3)} min`],
          ['Desviación estándar (s)', `${formatNum(ia.stdDev, 3)} min`, `${formatNum(sv.stdDev, 3)} min`],
          ['Mínimo / Máximo', `${formatNum(ia.min, 2)} / ${formatNum(ia.max, 2)} min`, `${formatNum(sv.min, 2)} / ${formatNum(sv.max, 2)} min`],
          ['Mediana', `${formatNum(ia.median, 2)} min`, `${formatNum(sv.median, 2)} min`],
          ['Coeficiente de Variación (CV)', `${formatNum(ia.cv, 3)} (${ia.isExponentialCompatible ? 'Compatible Poisson' : 'No exponencial'})`, `${formatNum(sv.cv, 3)} (${sv.isExponentialCompatible ? 'Compatible Exponencial' : 'No exponencial'})`],
          [
            'Hora pico identificada',
            descriptiveAnalysis.peakHour
              ? `${ winAnsiSafe(descriptiveAnalysis.peakHour.hourLabel) } (${descriptiveAnalysis.peakHour.count} llegadas)`
              : 'N/A',
            winAnsiSafe(svWarn),
          ],
        ],
        theme: 'grid',
        headStyles: { fillColor: [0, 110, 150], fontSize: 9 },
        styles: { fontSize: 8.5, cellPadding: 2.2 },
      });

      y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 7;
    }

    // =========================================================================
    // (d) MODELO ELEGIDO Y SUPUESTOS
    // =========================================================================
    if (y > 235) {
      doc.addPage();
      y = 18;
    }
    doc.setTextColor(0, 30, 98);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('3. Modelo Elegido y Supuestos Teóricos (Notación de Kendall)', 14, y);
    y += 5;

    doc.setTextColor(40, 40, 40);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const assumptions = [
      `• Proceso de llegadas de Poisson (tiempos entre llegadas exponenciales independientes con tasa lambda = ${formatNum(result.params.lambdaPerHour, 2)} pac/h).`,
      `• Tiempos de servicio exponenciales independientes con tasa mu = ${formatNum(result.params.muPerHour, 2)} pac/h por servidor.${
        result.params.serviceCV && (result.params.serviceCV < 0.7 || result.params.serviceCV > 1.3)
          ? ` [Nota: En la muestra el CV de atención es ${formatNum(result.params.serviceCV, 2)}; el modelo M/M se emplea como aproximación analítica].`
          : ''
      }`,
      `• Disciplina de atención FIFO (First-In, First-Out: primero en llegar, primero en ser atendido), sin abandono.`,
      `• Población potencial y capacidad de sala de espera infinitas (${result.model === 'MM1' ? 'M/M/1/inf/inf/FIFO' : `M/M/${result.servers}/inf/inf/FIFO`}).`,
      `• Condición de estado estable: rho = lambda / (s * mu) < 1 (${result.isStable ? `Cumplida: rho = ${formatNum(result.rho, 4)}` : `NO CUMPLIDA: rho = ${formatNum(result.rho, 2)} >= 1`}).`,
    ];
    for (const line of assumptions) {
      const wrapped = doc.splitTextToSize(winAnsiSafe(line), pageWidth - 28);
      doc.text(wrapped, 14, y);
      y += wrapped.length * 4.5 + 1;
    }
    y += 3;

    // =========================================================================
    // (e) ECUACIONES CON VALORES SUSTITUIDOS (RENDERIZADO GRÁFICO + TABLA)
    // =========================================================================
    if (y > 215) {
      doc.addPage();
      y = 18;
    }
    doc.setTextColor(0, 30, 98);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('4. Ecuaciones del Modelo con Valores Sustituidos', 14, y);
    y += 4;

    // Render High-DPI Canvas Image of mathematical equations so Greek letters (λ, μ, ρ, Σ) look crisp
    const eqCanvasDataUrl = this.renderEquationsCanvas(result, selectedKeys);
    if (eqCanvasDataUrl) {
      const imgHeight = Math.min(82, 16 + selectedKeys.length * 9);
      if (y + imgHeight > 275) {
        doc.addPage();
        y = 18;
      }
      doc.addImage(eqCanvasDataUrl, 'PNG', 14, y, pageWidth - 28, imgHeight);
      y += imgHeight + 6;
    }

    // =========================================================================
    // (f) TABLA DE RESULTADOS CON UNIDADES (O DECLARACIÓN DE INESTABILIDAD)
    // =========================================================================
    if (y > 220) {
      doc.addPage();
      y = 18;
    }
    doc.setTextColor(0, 30, 98);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('5. Resultados de los Indicadores Seleccionados', 14, y);
    y += 4;

    if (!result.isStable) {
      // HU-14.4: Si el sistema es inestable, el PDF lo declara y no incluye resultados numéricos inválidos
      doc.setFillColor(254, 242, 242);
      doc.setDrawColor(220, 38, 38);
      doc.roundedRect(14, y, pageWidth - 28, 28, 2, 2, 'FD');
      doc.setTextColor(185, 28, 28);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.text('DECLARACIÓN DE SISTEMA INESTABLE (SIN SOLUCIÓN DE ESTADO ESTACIONARIO)', 18, y + 8);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const alertLines = doc.splitTextToSize(
        winAnsiSafe(
          `${result.instabilityMessage || ''} No se reportan valores numéricos de L, Lq, W ni Wq porque las ecuaciones estacionarias producen valores negativos o divergentes cuando rho >= 1.`
        ),
        pageWidth - 36
      );
      doc.text(alertLines, 18, y + 15);
      y += 34;
    } else {
      const rows: string[][] = [];
      for (const key of selectedKeys) {
        const eq = result.equations[key];
        const interp = result.interpretations[key];
        let valFormatted = eq.resultFormatted;
        if (key === 'Wq' && result.WqMin !== null && result.WqHours !== null) {
          valFormatted =
            timeUnit === 'min'
              ? `${formatNum(result.WqMin, 2)} min (${formatNum(result.WqHours, 4)} h)`
              : `${formatNum(result.WqHours, 4)} h (${formatNum(result.WqMin, 2)} min)`;
        } else if (key === 'W' && result.WMin !== null && result.WHours !== null) {
          valFormatted =
            timeUnit === 'min'
              ? `${formatNum(result.WMin, 2)} min (${formatNum(result.WHours, 4)} h)`
              : `${formatNum(result.WHours, 4)} h (${formatNum(result.WMin, 2)} min)`;
        }
        rows.push([
          winAnsiSafe(eq.symbol),
          winAnsiSafe(eq.name),
          winAnsiSafe(valFormatted),
          winAnsiSafe(interp),
        ]);
      }

      autoTable(doc, {
        startY: y,
        head: [['Símbolo', 'Indicador', 'Resultado y Unidad', 'Interpretación Operativa']],
        body: rows,
        theme: 'grid',
        headStyles: { fillColor: [0, 51, 160], fontSize: 9 },
        styles: { fontSize: 8.5, cellPadding: 2.4 },
        columnStyles: {
          0: { cellWidth: 18, fontStyle: 'bold' },
          1: { cellWidth: 46 },
          2: { cellWidth: 38, fontStyle: 'bold' },
          3: { cellWidth: 78 },
        },
      });
      y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 7;
    }

    // =========================================================================
    // (g) GRÁFICAS DEL SISTEMA
    // =========================================================================
    const chartDataUrl = this.renderChartsCanvas(result);
    if (chartDataUrl) {
      if (y + 82 > 275) {
        doc.addPage();
        y = 18;
      }
      doc.setTextColor(0, 30, 98);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('6. Gráficas de Desempeño del Sistema', 14, y);
      y += 4;
      doc.addImage(chartDataUrl, 'PNG', 14, y, pageWidth - 28, 75);
      y += 81;
    }

    // =========================================================================
    // (h) ESCENARIOS COMPARADOS Y COSTOS (SI EXISTEN)
    // =========================================================================
    if (savedScenarios.length > 0) {
      if (y > 220) {
        doc.addPage();
        y = 18;
      }
      doc.setTextColor(0, 30, 98);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('7. Comparativa de Escenarios de Mejora Simulados', 14, y);
      y += 3;

      const scenRows = savedScenarios.map((sc) => [
        winAnsiSafe(sc.name),
        `s = ${sc.servers}`,
        `${formatNum(sc.effectiveLambdaPerHour, 2)} /h (${sc.lambdaVariationPercent >= 0 ? '+' : ''}${sc.lambdaVariationPercent}%)`,
        `${formatNum(sc.effectiveMeanServiceMin, 2)} min (${sc.serviceTimeVariationPercent >= 0 ? '+' : ''}${sc.serviceTimeVariationPercent}%)`,
        sc.result.isStable ? `${formatNum(sc.result.rho * 100, 1)} %` : 'Inestable',
        sc.result.isStable ? `${formatNum(sc.result.Lq, 2)} pac` : 'Inestable',
        sc.result.isStable ? `${formatNum(sc.result.WqMin, 2)} min` : 'Inestable',
      ]);

      autoTable(doc, {
        startY: y,
        head: [['Escenario', 'Servidores', 'Tasa Llegada', 'T. Atención', 'Ocupación (rho)', 'Cola (Lq)', 'Espera (Wq)']],
        body: scenRows,
        theme: 'striped',
        headStyles: { fillColor: [0, 110, 150], fontSize: 8.5 },
        styles: { fontSize: 8, cellPadding: 2 },
      });
      y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 7;
    }

    if (costAnalysis && costAnalysis.points.length > 0) {
      if (y > 220) {
        doc.addPage();
        y = 18;
      }
      doc.setTextColor(0, 30, 98);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('8. Análisis Económico y Número Óptimo de Servidores (COP/hora)', 14, y);
      y += 3;

      const costRows = costAnalysis.points.map((pt) => [
        `s = ${pt.servers}${pt.isOptimal ? ' (ÓPTIMO)' : ''}`,
        `${formatNum(pt.rho * 100, 1)} %`,
        `$ ${Math.round(pt.serverCostPerHourCOP).toLocaleString('es-CO')}`,
        pt.waitingCostPerHourCOP !== null
          ? `$ ${Math.round(pt.waitingCostPerHourCOP).toLocaleString('es-CO')}`
          : 'Inestable',
        pt.totalCostPerHourCOP !== null
          ? `$ ${Math.round(pt.totalCostPerHourCOP).toLocaleString('es-CO')}`
          : 'Inestable',
      ]);

      autoTable(doc, {
        startY: y,
        head: [['Servidores (s)', 'Ocupación', 'Costo Servidores /h', 'Costo Espera /h', 'Costo Total /h (COP)']],
        body: costRows,
        theme: 'grid',
        headStyles: { fillColor: [16, 120, 80], fontSize: 8.5 },
        styles: { fontSize: 8, cellPadding: 2 },
      });
      y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 7;
    }

    // =========================================================================
    // (i) INTERPRETACIÓN Y CONCLUSIÓN AUTOMÁTICA
    // =========================================================================
    if (y > 235) {
      doc.addPage();
      y = 18;
    }
    doc.setTextColor(0, 30, 98);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Conclusión Ejecutiva y Recomendación Operativa', 14, y);
    y += 4;

    doc.setFillColor(232, 244, 248);
    doc.setDrawColor(0, 174, 199);
    const conclusionText = winAnsiSafe(result.executiveConclusion);
    const conclusionLines = doc.splitTextToSize(conclusionText, pageWidth - 36);
    const boxH = Math.max(22, conclusionLines.length * 5 + 8);
    doc.roundedRect(14, y, pageWidth - 28, boxH, 2, 2, 'FD');

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.text(conclusionLines, 18, y + 7);

    // Page footers
    const pageCount = doc.getNumberOfPages();
    for (let p = 1; p <= pageCount; p++) {
      doc.setPage(p);
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text(
        `Urgencias Colas SURA — Informe generado automáticamente (${dateStr}) — Página ${p} de ${pageCount}`,
        14,
        290
      );
    }

    const fileName = this.buildFileName(result.model, result.servers);
    const arrayBuffer = doc.output('arraybuffer');
    const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
    const blobUrl = URL.createObjectURL(blob);

    return {
      fileName,
      blob,
      blobUrl,
      savedPath: `Descargas/${fileName}`,
    };
  }

  /**
   * Saves the PDF file to device Downloads (on Web via anchor download, on Android via Capacitor Filesystem).
   */
  public static async downloadPdf(handle: PdfOutputHandle): Promise<{ savedPath: string }> {
    if (Capacitor.isNativePlatform()) {
      try {
        const base64Data = await this.blobToBase64(handle.blob);
        const res = await Filesystem.writeFile({
          path: handle.fileName,
          data: base64Data,
          directory: Directory.Documents,
        });
        return { savedPath: res.uri || `Documentos/${handle.fileName}` };
      } catch {
        // Fallback to browser download if storage permission denied
      }
    }

    const link = document.createElement('a');
    link.href = handle.blobUrl;
    link.download = handle.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return { savedPath: `Descargas/${handle.fileName}` };
  }

  /**
   * Opens the native system Share menu (WhatsApp, Correo, Drive) on Android/iOS or Web Share API.
   */
  public static async sharePdf(handle: PdfOutputHandle, title: string): Promise<boolean> {
    if (Capacitor.isNativePlatform()) {
      try {
        const base64Data = await this.blobToBase64(handle.blob);
        const written = await Filesystem.writeFile({
          path: handle.fileName,
          data: base64Data,
          directory: Directory.Cache,
        });
        await Share.share({
          title,
          text: `Informe de Teoría de Colas (${handle.fileName})`,
          url: written.uri,
          dialogTitle: 'Compartir Informe PDF',
        });
        return true;
      } catch {
        return false;
      }
    }

    const file = new File([handle.blob], handle.fileName, { type: 'application/pdf' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          title,
          text: `Informe de Teoría de Colas (${handle.fileName})`,
          files: [file],
        });
        return true;
      } catch {
        return false;
      }
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: `Informe de Teoría de Colas (${handle.fileName})`,
          url: window.location.href,
        });
        return true;
      } catch {
        return false;
      }
    }

    // Fallback: trigger download
    await this.downloadPdf(handle);
    return true;
  }

  private static blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const res = String(reader.result || '');
        const base64 = res.includes(',') ? res.split(',')[1] : res;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Renders the selected mathematical equations with real Unicode symbols (λ, μ, ρ, Σ, P₀)
   * onto a high-resolution offscreen canvas for crisp embedding in the PDF.
   */
  private static renderEquationsCanvas(
    result: QueueCalculationResult,
    selectedKeys: IndicatorKey[]
  ): string | null {
    if (typeof document === 'undefined' || selectedKeys.length === 0) return null;
    const canvas = document.createElement('canvas');
    const width = 1200;
    const rowH = 58;
    const height = 50 + selectedKeys.length * rowH;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, width - 2, height - 2);

    // Header
    ctx.fillStyle = '#0033A0';
    ctx.fillRect(0, 0, width, 42);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('Indicador', 20, 28);
    ctx.fillText('Fórmula Sustituida con Parámetros Reales', 230, 28);
    ctx.fillText('Resultado', 940, 28);

    selectedKeys.forEach((key, idx) => {
      const eq = result.equations[key];
      const top = 42 + idx * rowH;
      if (idx % 2 === 1) {
        ctx.fillStyle = '#f1f5f9';
        ctx.fillRect(2, top, width - 4, rowH);
      }

      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, top + rowH);
      ctx.lineTo(width, top + rowH);
      ctx.stroke();

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 21px serif';
      ctx.fillText(`${eq.symbol}`, 20, top + 26);
      ctx.font = '14px sans-serif';
      ctx.fillStyle = '#475569';
      ctx.fillText(eq.name.slice(0, 32), 20, top + 46);

      ctx.fillStyle = '#1e293b';
      ctx.font = '18px monospace';
      ctx.fillText(eq.substitutedFormulaText.slice(0, 62), 230, top + 35);

      ctx.fillStyle = '#0033A0';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText(eq.resultFormatted, 940, top + 35);
    });

    return canvas.toDataURL('image/png');
  }

  /**
   * Renders the Pn distribution bar chart and Wq vs s sensitivity chart onto an offscreen canvas
   * so HU-11.4 ("Las gráficas se incluyen en el PDF") is always satisfied.
   */
  private static renderChartsCanvas(result: QueueCalculationResult): string | null {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 1200, 480);

    // Left Chart: Pn distribution (if stable)
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, 575, 460);

    ctx.fillStyle = '#001E62';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('Distribución de Probabilidad Pn (n pacientes)', 30, 42);

    if (result.isStable && result.pnDistribution.length > 0) {
      const pts = result.pnDistribution.slice(0, 12);
      const maxP = Math.max(...pts.map((p) => p.probability), 0.05);
      const chartLeft = 65;
      const chartBottom = 415;
      const chartH = 330;
      const chartW = 490;
      const barW = Math.floor(chartW / pts.length) - 8;

      ctx.strokeStyle = '#94a3b8';
      ctx.beginPath();
      ctx.moveTo(chartLeft, 65);
      ctx.lineTo(chartLeft, chartBottom);
      ctx.lineTo(chartLeft + chartW, chartBottom);
      ctx.stroke();

      pts.forEach((pt, i) => {
        const h = (pt.probability / maxP) * (chartH - 20);
        const x = chartLeft + 10 + i * (barW + 8);
        const y = chartBottom - h;

        ctx.fillStyle = '#0033A0';
        ctx.fillRect(x, y, barW, h);

        ctx.fillStyle = '#334155';
        ctx.font = '13px sans-serif';
        ctx.fillText(`n=${pt.n}`, x + 2, chartBottom + 20);
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText(`${(pt.probability * 100).toFixed(1)}%`, x, y - 6);
      });
    } else {
      ctx.fillStyle = '#b91c1c';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('Sistema inestable (ρ ≥ 1): Pn no estacionario', 80, 240);
    }

    // Right Chart: Sensitivity of Wq (min) and Lq vs Servers s
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    ctx.strokeRect(605, 10, 585, 460);

    ctx.fillStyle = '#001E62';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('Sensibilidad: Espera en Cola Wq (min) vs Servidores (s)', 625, 42);

    const sens = result.sensitivitySeries.filter((s) => s.isStable && s.WqMin !== null);
    if (sens.length > 0) {
      const maxWq = Math.max(...sens.map((s) => s.WqMin || 0), 1);
      const chartLeft = 665;
      const chartBottom = 415;
      const chartH = 330;
      const chartW = 490;
      const barW = Math.min(68, Math.floor(chartW / sens.length) - 24);

      ctx.strokeStyle = '#94a3b8';
      ctx.beginPath();
      ctx.moveTo(chartLeft, 65);
      ctx.lineTo(chartLeft, chartBottom);
      ctx.lineTo(chartLeft + chartW, chartBottom);
      ctx.stroke();

      sens.forEach((pt, i) => {
        const wq = pt.WqMin || 0;
        const h = Math.max(6, (wq / maxWq) * (chartH - 30));
        const x = chartLeft + 24 + i * (barW + 28);
        const y = chartBottom - h;

        ctx.fillStyle = pt.servers === result.servers ? '#00AEC7' : '#0284c7';
        ctx.fillRect(x, y, barW, h);

        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 15px sans-serif';
        ctx.fillText(`s = ${pt.servers}`, x + 8, chartBottom + 22);
        ctx.font = '12px sans-serif';
        ctx.fillStyle = '#475569';
        ctx.fillText(`ρ=${(pt.rho * 100).toFixed(0)}%`, x + 4, chartBottom + 40);

        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText(`${wq.toFixed(1)} min`, x, y - 8);
      });
    }

    return canvas.toDataURL('image/png');
  }
}

