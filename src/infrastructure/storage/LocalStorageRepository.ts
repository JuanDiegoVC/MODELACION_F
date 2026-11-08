import { PatientRecord } from '../../domain/entities/PatientRecord';
import { QueueParameters } from '../../domain/entities/QueueParameters';
import { QueueCalculationResult } from '../../domain/entities/QueueResults';
import { SavedScenario } from '../../domain/entities/Scenario';
import { AppSettings, IStorageRepository } from '../../domain/repositories/IStorageRepository';

const KEYS = {
  FIELD_RECORDS: 'urgencias_sura_field_records_v1',
  HISTORY: 'urgencias_sura_calc_history_v1',
  SCENARIOS: 'urgencias_sura_scenarios_v1',
  SETTINGS: 'urgencias_sura_settings_v1',
  LAST_PARAMS: 'urgencias_sura_last_params_v1',
};

const DEFAULT_SETTINGS: AppSettings = {
  soundEnabled: true,
  occupancyThresholds: {
    greenMaxPercent: 70,
    yellowMaxPercent: 85,
  },
  excludeFirstZeroInterArrival: true,
};

export class LocalStorageRepository implements IStorageRepository {
  public getFieldRecords(): PatientRecord[] {
    try {
      const raw = localStorage.getItem(KEYS.FIELD_RECORDS);
      return raw ? (JSON.parse(raw) as PatientRecord[]) : [];
    } catch {
      return [];
    }
  }

  public saveFieldRecords(records: PatientRecord[]): void {
    try {
      localStorage.setItem(KEYS.FIELD_RECORDS, JSON.stringify(records));
    } catch {
      // Ignore quota errors
    }
  }

  public getCalculationHistory(): QueueCalculationResult[] {
    try {
      const raw = localStorage.getItem(KEYS.HISTORY);
      return raw ? (JSON.parse(raw) as QueueCalculationResult[]) : [];
    } catch {
      return [];
    }
  }

  public saveCalculationToHistory(result: QueueCalculationResult): void {
    try {
      const current = this.getCalculationHistory();
      const updated = [result, ...current.filter((item) => item.id !== result.id)].slice(0, 30);
      localStorage.setItem(KEYS.HISTORY, JSON.stringify(updated));
    } catch {
      // Ignore quota errors
    }
  }

  public deleteHistoryItem(id: string): void {
    try {
      const current = this.getCalculationHistory();
      const updated = current.filter((item) => item.id !== id);
      localStorage.setItem(KEYS.HISTORY, JSON.stringify(updated));
    } catch {
      // Ignore
    }
  }

  public clearHistory(): void {
    try {
      localStorage.removeItem(KEYS.HISTORY);
    } catch {
      // Ignore
    }
  }

  public getSavedScenarios(): SavedScenario[] {
    try {
      const raw = localStorage.getItem(KEYS.SCENARIOS);
      return raw ? (JSON.parse(raw) as SavedScenario[]) : [];
    } catch {
      return [];
    }
  }

  public saveScenarios(scenarios: SavedScenario[]): void {
    try {
      localStorage.setItem(KEYS.SCENARIOS, JSON.stringify(scenarios.slice(0, 5)));
    } catch {
      // Ignore
    }
  }

  public getSettings(): AppSettings {
    try {
      const raw = localStorage.getItem(KEYS.SETTINGS);
      if (!raw) return DEFAULT_SETTINGS;
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  public saveSettings(settings: AppSettings): void {
    try {
      localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
    } catch {
      // Ignore
    }
  }

  public getLastParameters(): QueueParameters | null {
    try {
      const raw = localStorage.getItem(KEYS.LAST_PARAMS);
      return raw ? (JSON.parse(raw) as QueueParameters) : null;
    } catch {
      return null;
    }
  }

  public saveLastParameters(params: QueueParameters): void {
    try {
      localStorage.setItem(KEYS.LAST_PARAMS, JSON.stringify(params));
    } catch {
      // Ignore
    }
  }
}

