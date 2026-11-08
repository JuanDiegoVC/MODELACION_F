import { PatientRecord } from '../entities/PatientRecord';
import { OccupancyThresholds, QueueParameters } from '../entities/QueueParameters';
import { QueueCalculationResult } from '../entities/QueueResults';
import { SavedScenario } from '../entities/Scenario';

export interface AppSettings {
  soundEnabled: boolean;
  occupancyThresholds: OccupancyThresholds;
  excludeFirstZeroInterArrival: boolean;
}

export interface IStorageRepository {
  getFieldRecords(): PatientRecord[];
  saveFieldRecords(records: PatientRecord[]): void;
  getCalculationHistory(): QueueCalculationResult[];
  saveCalculationToHistory(result: QueueCalculationResult): void;
  deleteHistoryItem(id: string): void;
  clearHistory(): void;
  getSavedScenarios(): SavedScenario[];
  saveScenarios(scenarios: SavedScenario[]): void;
  getSettings(): AppSettings;
  saveSettings(settings: AppSettings): void;
  getLastParameters(): QueueParameters | null;
  saveLastParameters(params: QueueParameters): void;
}

