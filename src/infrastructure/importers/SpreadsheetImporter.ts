import * as XLSX from 'xlsx';
import {
  DatasetImportSummary,
  PatientRecord,
  RejectedRowInfo,
  TriageLevel,
} from '../../domain/entities/PatientRecord';

export interface ColumnMapping {
  arrivalTimeCol: string;
  interArrivalCol: string;
  serviceTimeCol: string;
  triageCol: string;
}

export interface ParsedSheetPreview {
  fileName: string;
  headers: string[];
  rawRows: Record<string, unknown>[];
  headerRowIndex: number;
  autoDetectedMapping: ColumnMapping | null;
}

const VALID_TRIAGES: TriageLevel[] = ['I', 'II', 'III', 'IV', 'V'];

export class SpreadsheetImporter {
  /**
   * Reads an Excel (.xlsx/.xls) or CSV file and detects the header row,
   * automatically skipping title rows (like Row 1 "REGISTROS SIMULADOS...").
   */
  public static async parseFilePreview(file: File): Promise<ParsedSheetPreview> {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    // Get 2D array of rows to detect where the real header row is (HU-02.2)
    const matrix = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
      header: 1,
      defval: '',
      blankrows: false,
    });

    let headerRowIndex = 0;
    for (let i = 0; i < Math.min(10, matrix.length); i++) {
      const row = (matrix[i] || []).map((cell) => String(cell ?? '').trim());
      const nonEmptyCount = row.filter((c) => c.length > 0).length;
      const joined = row.join(' ').toLowerCase();
      if (
        nonEmptyCount >= 2 &&
        (joined.includes('llegada') ||
          joined.includes('atenci') ||
          joined.includes('triage') ||
          joined.includes('tiempo') ||
          joined.includes('hora'))
      ) {
        headerRowIndex = i;
        break;
      } else if (i === 0 && nonEmptyCount <= 2 && matrix.length > 1) {
        // Row 1 is a title banner (e.g. "REGISTROS SIMULADOS") -> check next row
        headerRowIndex = 1;
      }
    }

    const headerCells = (matrix[headerRowIndex] || []).map((c, idx) => {
      const txt = String(c ?? '').trim();
      return txt || `Columna_${idx + 1}`;
    });

    const rawRows: Record<string, unknown>[] = [];
    for (let r = headerRowIndex + 1; r < matrix.length; r++) {
      const rowArr = matrix[r] || [];
      const isCompletelyEmpty = rowArr.every((cell) => String(cell ?? '').trim() === '');
      if (isCompletelyEmpty) continue;

      const rowObj: Record<string, unknown> = { __excelRowNumber: r + 1 };
      headerCells.forEach((colName, cIdx) => {
        rowObj[colName] = rowArr[cIdx];
      });
      rawRows.push(rowObj);
    }

    const autoDetectedMapping = this.tryAutoDetectColumns(headerCells);

    return {
      fileName: file.name,
      headers: headerCells,
      rawRows,
      headerRowIndex,
      autoDetectedMapping,
    };
  }

  public static tryAutoDetectColumns(headers: string[]): ColumnMapping | null {
    const findCol = (keywords: string[], excludeKeywords: string[] = []): string => {
      for (const h of headers) {
        const lower = h.toLowerCase();
        const matchesKeyword = keywords.some((kw) => lower.includes(kw));
        const matchesExclude = excludeKeywords.some((ex) => lower.includes(ex));
        if (matchesKeyword && !matchesExclude) {
          return h;
        }
      }
      return '';
    };

    const arrivalTimeCol = findCol(['hora de llegada', 'hora llegada', 'hora'], ['entre']);
    const interArrivalCol = findCol(['tiempo entre llegadas', 'entre llegadas', 'interllegada']);
    const serviceTimeCol = findCol(['tiempo de atención', 'tiempo de atencion', 'atención', 'atencion', 'servicio']);
    const triageCol = findCol(['triage', 'clasificación', 'clasificacion']);

    if (interArrivalCol && serviceTimeCol) {
      return {
        arrivalTimeCol,
        interArrivalCol,
        serviceTimeCol,
        triageCol,
      };
    }
    return null;
  }

  /**
   * Processes raw rows using the provided column mapping, rejecting invalid/negative/empty rows
   * and returning both valid records and the detailed rejection summary (HU-02.3, HU-02.4, HU-02.5).
   */
  public static importWithMapping(
    preview: ParsedSheetPreview,
    mapping: ColumnMapping,
    excludeFirstZeroInterArrival: boolean
  ): { records: PatientRecord[]; summary: DatasetImportSummary } {
    const records: PatientRecord[] = [];
    const rejectedRows: RejectedRowInfo[] = [];
    const triageCounts: Record<TriageLevel, number> = {
      I: 0,
      II: 0,
      III: 0,
      IV: 0,
      V: 0,
    };

    preview.rawRows.forEach((row, idx) => {
      const rowNum = Number(row.__excelRowNumber ?? idx + 2);
      const rawInter = row[mapping.interArrivalCol];
      const rawService = row[mapping.serviceTimeCol];
      const rawArrival = mapping.arrivalTimeCol ? row[mapping.arrivalTimeCol] : '';
      const rawTriage = mapping.triageCol ? row[mapping.triageCol] : '';

      const interVal = this.parseFlexibleNumber(rawInter);
      const serviceVal = this.parseFlexibleNumber(rawService);

      if (interVal === null || serviceVal === null) {
        rejectedRows.push({
          rowNumber: rowNum,
          reason: 'Valor vacío o no numérico en tiempo entre llegadas o tiempo de atención',
          rawValues: row,
        });
        return;
      }

      if (interVal < 0 || serviceVal <= 0) {
        rejectedRows.push({
          rowNumber: rowNum,
          reason:
            interVal < 0
              ? `Tiempo entre llegadas negativo (${interVal})`
              : `Tiempo de atención inválido o ≤ 0 (${serviceVal})`,
          rawValues: row,
        });
        return;
      }

      const arrivalStr = this.normalizeTimeStr(rawArrival, records.length);
      const triage = this.normalizeTriage(rawTriage);
      if (triage) {
        triageCounts[triage]++;
      }

      records.push({
        id: records.length + 1,
        arrivalTimeStr: arrivalStr,
        interArrivalMin: interVal,
        serviceTimeMin: serviceVal,
        triage,
      });
    });

    const start = records.length > 0 ? records[0].arrivalTimeStr : '—';
    const end = records.length > 0 ? records[records.length - 1].arrivalTimeStr : '—';

    const hasFirstZero = records.length > 0 && records[0].interArrivalMin === 0;
    const interArrivalCountUsed =
      excludeFirstZeroInterArrival && hasFirstZero
        ? Math.max(0, records.length - 1)
        : records.length;

    return {
      records,
      summary: {
        sourceName: preview.fileName,
        sourceType: 'excel',
        totalValidRecords: records.length,
        rejectedRows,
        timeRange: { start, end },
        triageCounts,
        interArrivalCountUsed,
        excludeFirstZeroInterArrival,
      },
    };
  }

  public static parseFlexibleNumber(val: unknown): number | null {
    if (typeof val === 'number') {
      return Number.isFinite(val) ? val : null;
    }
    if (typeof val === 'string') {
      const cleaned = val.trim().replace(',', '.');
      if (!cleaned) return null;
      const num = Number(cleaned);
      return Number.isFinite(num) ? num : null;
    }
    return null;
  }

  private static normalizeTimeStr(raw: unknown, idx: number): string {
    if (typeof raw === 'number' && raw >= 0 && raw < 1) {
      // Excel fractional day time
      const totalMinutes = Math.round(raw * 24 * 60);
      const hh = String(Math.floor(totalMinutes / 60) % 24).padStart(2, '0');
      const mm = String(totalMinutes % 60).padStart(2, '0');
      return `${hh}:${mm}`;
    }
    const str = String(raw ?? '').trim();
    if (/^\d{1,2}:\d{2}/.test(str)) {
      const parts = str.split(':');
      return `${parts[0].padStart(2, '0')}:${parts[1].slice(0, 2)}`;
    }
    const fallbackMinutes = 7 * 60 + idx * 4;
    const hh = String(Math.floor(fallbackMinutes / 60) % 24).padStart(2, '0');
    const mm = String(fallbackMinutes % 60).padStart(2, '0');
    return `${hh}:${mm}`;
  }

  private static normalizeTriage(raw: unknown): TriageLevel | undefined {
    const str = String(raw ?? '')
      .trim()
      .toUpperCase()
      .replace(/^TRIAGE\s*/i, '');
    if (VALID_TRIAGES.includes(str as TriageLevel)) {
      return str as TriageLevel;
    }
    const arabicMap: Record<string, TriageLevel> = {
      '1': 'I',
      '2': 'II',
      '3': 'III',
      '4': 'IV',
      '5': 'V',
    };
    return arabicMap[str];
  }
}

