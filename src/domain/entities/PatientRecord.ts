export type TriageLevel = 'I' | 'II' | 'III' | 'IV' | 'V';

export interface PatientRecord {
  id: number;
  arrivalTimeStr: string;           // "HH:mm:ss" or "HH:mm"
  arrivalTimestampMs?: number;      // Optional epoch ms for field capture
  serviceStartTimestampMs?: number; // Optional epoch ms for field capture
  serviceEndTimestampMs?: number;   // Optional epoch ms for field capture
  interArrivalMin: number | null;   // null for first record in field capture, or 0 in raw Excel row 1
  serviceTimeMin: number | null;    // Calculated or imported service duration in minutes
  triage?: TriageLevel;             // Optional I-V classification
}

export interface RejectedRowInfo {
  rowNumber: number;
  reason: string;
  rawValues: Record<string, unknown>;
}

export interface DatasetImportSummary {
  sourceName: string;
  sourceType: 'field' | 'excel' | 'manual';
  totalValidRecords: number;
  rejectedRows: RejectedRowInfo[];
  timeRange: { start: string; end: string };
  triageCounts: Record<TriageLevel, number>;
  interArrivalCountUsed: number;    // e.g. 199 when excluding first record's 0
  excludeFirstZeroInterArrival: boolean;
}

