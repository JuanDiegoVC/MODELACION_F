import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { DatasetDescriptiveAnalysis } from '../../domain/entities/DescriptiveStats';
import { DatasetImportSummary, PatientRecord } from '../../domain/entities/PatientRecord';
import {
  IndicatorSelection,
  QueueModelType,
  QueueParameters,
  TimeUnit,
} from '../../domain/entities/QueueParameters';
import { QueueCalculationResult } from '../../domain/entities/QueueResults';
import { CostAnalysisResult, CostBasisType, SavedScenario } from '../../domain/entities/Scenario';
import { AppSettings } from '../../domain/repositories/IStorageRepository';
import { CostOptimizerService } from '../../domain/services/CostOptimizerService';
import { QueueCalculatorFactory } from '../../domain/services/QueueCalculatorFactory';
import { StatisticsService } from '../../domain/services/StatisticsService';
import { SoundEffectsService } from '../../infrastructure/audio/SoundEffectsService';
import {
  getSuraImportSummary,
  SURA_MEDELLIN_RECORDS,
} from '../../infrastructure/data/suraDefaultDataset';
import { LocalStorageRepository } from '../../infrastructure/storage/LocalStorageRepository';

export type WizardStep = 1 | 2 | 3 | 4;

interface AppContextValue {
  // Navigation
  activeStep: WizardStep;
  setActiveStep: (step: WizardStep) => void;

  // Dataset & Field Records
  importedRecords: PatientRecord[];
  importSummary: DatasetImportSummary;
  loadSuraDefaultDataset: (useExcelStatSheetMean200?: boolean) => void;
  setImportedDataset: (records: PatientRecord[], summary: DatasetImportSummary) => void;

  fieldRecords: PatientRecord[];
  updateFieldRecords: (records: PatientRecord[]) => void;
  applyFieldRecordsToModel: () => void;

  // Descriptive stats
  descriptiveAnalysis: DatasetDescriptiveAnalysis;
  confidenceLevel: 90 | 95 | 99;
  setConfidenceLevel: (lvl: 90 | 95 | 99) => void;
  acceptableErrorMin: number;
  setAcceptableErrorMin: (err: number) => void;

  // Queue Parameters & Calculation
  params: QueueParameters;
  updateParams: (partial: Partial<QueueParameters>) => void;
  updateIndicators: (partial: Partial<IndicatorSelection>) => void;
  currentResult: QueueCalculationResult;
  runCalculationAndAdvance: () => void;
  switchToStableMMS: (servers?: number) => void;

  // Display preferences
  timeUnit: TimeUnit;
  setTimeUnit: (u: TimeUnit) => void;
  settings: AppSettings;
  updateSettings: (partial: Partial<AppSettings>) => void;

  // Scenarios (HU-12)
  savedScenarios: SavedScenario[];
  saveScenario: (name: string, servers: number, lambdaVarPct: number, serviceVarPct: number) => void;
  deleteScenario: (id: string) => void;
  clearScenarios: () => void;

  // Cost Analysis (HU-13)
  costPerServerHourCOP: number;
  setCostPerServerHourCOP: (v: number) => void;
  costPerPatientWaitHourCOP: number;
  setCostPerPatientWaitHourCOP: (v: number) => void;
  costBasis: CostBasisType;
  setCostBasis: (b: CostBasisType) => void;
  costAnalysis: CostAnalysisResult;

  // History (HU-19)
  history: QueueCalculationResult[];
  loadFromHistory: (item: QueueCalculationResult) => void;
  deleteFromHistory: (id: string) => void;
  clearHistory: () => void;
}

const DEFAULT_INDICATORS: IndicatorSelection = {
  rho: true,
  P0: true,
  L: true,
  Lq: true,
  W: true,
  Wq: true,
  Pw: true,
  Pn: true,
};

const DEFAULT_PARAMS: QueueParameters = {
  model: 'MMS',
  servers: 4,
  lambdaPerHour: 60 / 3.961, // ≈ 15.1477 /h
  muPerHour: 60 / 11.718,    // ≈ 5.1203 /h
  meanInterArrivalMin: 3.961,
  meanServiceMin: 11.718,
  targetN: 5,
  maxChartN: 15,
  selectedIndicators: DEFAULT_INDICATORS,
  sourceDescription: 'Archivo Excel: registros_atencion_sura_medellin.xlsx (200 registros)',
  interArrivalCV: 0.96,
  serviceCV: 0.34,
};

const AppContext = createContext<AppContextValue | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const storage = useMemo(() => new LocalStorageRepository(), []);

  const [activeStep, setActiveStep] = useState<WizardStep>(1);
  const [settings, setSettings] = useState<AppSettings>(() => storage.getSettings());
  const [timeUnit, setTimeUnit] = useState<TimeUnit>('min');

  const [importedRecords, setImportedRecords] = useState<PatientRecord[]>(SURA_MEDELLIN_RECORDS);
  const [importSummary, setImportSummary] = useState<DatasetImportSummary>(() =>
    getSuraImportSummary(storage.getSettings().excludeFirstZeroInterArrival)
  );

  const [fieldRecords, setFieldRecords] = useState<PatientRecord[]>(() => storage.getFieldRecords());

  const [confidenceLevel, setConfidenceLevel] = useState<90 | 95 | 99>(95);
  const [acceptableErrorMin, setAcceptableErrorMin] = useState<number>(0.6);

  const [params, setParams] = useState<QueueParameters>(() => {
    const saved = storage.getLastParameters();
    return saved || DEFAULT_PARAMS;
  });

  const [savedScenarios, setSavedScenarios] = useState<SavedScenario[]>(() =>
    storage.getSavedScenarios()
  );

  const [costPerServerHourCOP, setCostPerServerHourCOP] = useState<number>(48000);
  const [costPerPatientWaitHourCOP, setCostPerPatientWaitHourCOP] = useState<number>(32000);
  const [costBasis, setCostBasis] = useState<CostBasisType>('system_L');

  const [history, setHistory] = useState<QueueCalculationResult[]>(() =>
    storage.getCalculationHistory()
  );

  const descriptiveAnalysis = useMemo(() => {
    return StatisticsService.analyzeDataset(importedRecords, {
      excludeFirstZeroInterArrival: settings.excludeFirstZeroInterArrival,
      confidenceLevelPercent: confidenceLevel,
      acceptableErrorMin,
    });
  }, [importedRecords, settings.excludeFirstZeroInterArrival, confidenceLevel, acceptableErrorMin]);

  const currentResult = useMemo(() => {
    return QueueCalculatorFactory.calculate(params);
  }, [params]);

  const costAnalysis = useMemo(() => {
    return CostOptimizerService.analyzeCosts(
      params,
      costPerServerHourCOP,
      costPerPatientWaitHourCOP,
      costBasis
    );
  }, [params, costPerServerHourCOP, costPerPatientWaitHourCOP, costBasis]);

  useEffect(() => {
    storage.saveLastParameters(params);
  }, [params, storage]);

  const updateSettings = (partial: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      storage.saveSettings(next);
      return next;
    });
  };

  const updateParams = (partial: Partial<QueueParameters>) => {
    setParams((prev) => {
      const next = { ...prev, ...partial };
      if (next.model === 'MM1') {
        next.servers = 1;
      }
      return next;
    });
  };

  const updateIndicators = (partial: Partial<IndicatorSelection>) => {
    setParams((prev) => ({
      ...prev,
      selectedIndicators: {
        ...prev.selectedIndicators,
        ...partial,
      },
    }));
  };

  const loadSuraDefaultDataset = (useExcelStatSheetMean200 = true) => {
    const excludeZero = !useExcelStatSheetMean200;
    updateSettings({ excludeFirstZeroInterArrival: excludeZero });
    setImportedRecords(SURA_MEDELLIN_RECORDS);
    setImportSummary(getSuraImportSummary(excludeZero));

    const meanIA = useExcelStatSheetMean200 ? 3.961 : 3.981;
    const meanService = 11.718;
    updateParams({
      meanInterArrivalMin: meanIA,
      meanServiceMin: meanService,
      lambdaPerHour: 60 / meanIA,
      muPerHour: 60 / meanService,
      interArrivalCV: 0.96,
      serviceCV: 0.34,
      sourceDescription: `Excel: registros_atencion_sura_medellin.xlsx (200 reg., n_llegadas=${
        useExcelStatSheetMean200 ? 200 : 199
      })`,
    });
    SoundEffectsService.playTap(settings.soundEnabled);
  };

  const setImportedDataset = (records: PatientRecord[], summary: DatasetImportSummary) => {
    setImportedRecords(records);
    setImportSummary(summary);

    const analysis = StatisticsService.analyzeDataset(records, {
      excludeFirstZeroInterArrival: settings.excludeFirstZeroInterArrival,
      confidenceLevelPercent: confidenceLevel,
      acceptableErrorMin,
    });

    if (analysis.interArrivalStats.mean > 0 && analysis.serviceStats.mean > 0) {
      const meanIA = Number(analysis.interArrivalStats.mean.toFixed(3));
      const meanSv = Number(analysis.serviceStats.mean.toFixed(3));
      updateParams({
        meanInterArrivalMin: meanIA,
        meanServiceMin: meanSv,
        lambdaPerHour: 60 / meanIA,
        muPerHour: 60 / meanSv,
        interArrivalCV: Number(analysis.interArrivalStats.cv.toFixed(2)),
        serviceCV: Number(analysis.serviceStats.cv.toFixed(2)),
        sourceDescription: `Archivo importado: ${summary.sourceName} (${summary.totalValidRecords} reg. válidos, n_llegadas=${analysis.interArrivalStats.n})`,
      });
    }
    SoundEffectsService.playCalculateSuccess(settings.soundEnabled);
  };

  const updateFieldRecords = (records: PatientRecord[]) => {
    setFieldRecords(records);
    storage.saveFieldRecords(records);
  };

  const applyFieldRecordsToModel = () => {
    const completed = fieldRecords.filter(
      (r) => r.serviceTimeMin !== null && r.serviceTimeMin > 0
    );
    if (completed.length < 2) return;

    const triageCounts = { I: 0, II: 0, III: 0, IV: 0, V: 0 };
    completed.forEach((r) => {
      if (r.triage) triageCounts[r.triage]++;
    });

    const summary: DatasetImportSummary = {
      sourceName: 'Observación directa en campo',
      sourceType: 'field',
      totalValidRecords: completed.length,
      rejectedRows: [],
      timeRange: {
        start: completed[0].arrivalTimeStr,
        end: completed[completed.length - 1].arrivalTimeStr,
      },
      triageCounts,
      interArrivalCountUsed: Math.max(1, completed.length - 1),
      excludeFirstZeroInterArrival: true,
    };

    setImportedRecords(completed);
    setImportSummary(summary);

    const analysis = StatisticsService.analyzeDataset(completed, {
      excludeFirstZeroInterArrival: true,
      confidenceLevelPercent: confidenceLevel,
      acceptableErrorMin,
    });

    if (analysis.interArrivalStats.mean > 0 && analysis.serviceStats.mean > 0) {
      const meanIA = Number(analysis.interArrivalStats.mean.toFixed(3));
      const meanSv = Number(analysis.serviceStats.mean.toFixed(3));
      updateParams({
        meanInterArrivalMin: meanIA,
        meanServiceMin: meanSv,
        lambdaPerHour: 60 / meanIA,
        muPerHour: 60 / meanSv,
        interArrivalCV: Number(analysis.interArrivalStats.cv.toFixed(2)),
        serviceCV: Number(analysis.serviceStats.cv.toFixed(2)),
        sourceDescription: `Observación en campo (${completed.length} pacientes registrados, n_llegadas=${analysis.interArrivalStats.n})`,
      });
    }
    SoundEffectsService.playCalculateSuccess(settings.soundEnabled);
  };

  const runCalculationAndAdvance = () => {
    const calc = QueueCalculatorFactory.calculate(params);
    storage.saveCalculationToHistory(calc);
    setHistory(storage.getCalculationHistory());
    if (calc.isStable) {
      SoundEffectsService.playCalculateSuccess(settings.soundEnabled);
    } else {
      SoundEffectsService.playWarningAlert(settings.soundEnabled);
    }
    setActiveStep(3);
  };

  const switchToStableMMS = (servers?: number) => {
    const targetS = servers ?? Math.max(3, currentResult.minStableServers + 1);
    const nextParams: QueueParameters = {
      ...params,
      model: 'MMS',
      servers: targetS,
    };
    setParams(nextParams);
    const calc = QueueCalculatorFactory.calculate(nextParams);
    storage.saveCalculationToHistory(calc);
    setHistory(storage.getCalculationHistory());
    SoundEffectsService.playCalculateSuccess(settings.soundEnabled);
  };

  const saveScenario = (
    name: string,
    servers: number,
    lambdaVarPct: number,
    serviceVarPct: number
  ) => {
    const effLambda = params.lambdaPerHour * (1 + lambdaVarPct / 100);
    const effMeanServiceMin = Math.max(0.1, params.meanServiceMin * (1 + serviceVarPct / 100));
    const effMu = 60 / effMeanServiceMin;

    const scenParams: QueueParameters = {
      ...params,
      model: servers === 1 ? 'MM1' : 'MMS',
      servers,
      lambdaPerHour: effLambda,
      muPerHour: effMu,
      meanInterArrivalMin: 60 / effLambda,
      meanServiceMin: effMeanServiceMin,
    };

    const scenResult = QueueCalculatorFactory.calculate(scenParams);
    const newScenario: SavedScenario = {
      id: `scen-${Date.now()}`,
      name: name.trim() || `Escenario s=${servers}`,
      servers,
      lambdaVariationPercent: lambdaVarPct,
      serviceTimeVariationPercent: serviceVarPct,
      effectiveLambdaPerHour: effLambda,
      effectiveMeanServiceMin: effMeanServiceMin,
      effectiveMuPerHour: effMu,
      result: scenResult,
    };

    setSavedScenarios((prev) => {
      const next = [...prev, newScenario].slice(-5); // Up to 5 scenarios (HU-12.3)
      storage.saveScenarios(next);
      return next;
    });
    SoundEffectsService.playTap(settings.soundEnabled);
  };

  const deleteScenario = (id: string) => {
    setSavedScenarios((prev) => {
      const next = prev.filter((s) => s.id !== id);
      storage.saveScenarios(next);
      return next;
    });
  };

  const clearScenarios = () => {
    setSavedScenarios([]);
    storage.saveScenarios([]);
  };

  const loadFromHistory = (item: QueueCalculationResult) => {
    setParams(item.params);
    setActiveStep(3);
    SoundEffectsService.playTap(settings.soundEnabled);
  };

  const deleteFromHistory = (id: string) => {
    storage.deleteHistoryItem(id);
    setHistory(storage.getCalculationHistory());
  };

  const clearHistory = () => {
    storage.clearHistory();
    setHistory([]);
  };

  return (
    <AppContext.Provider
      value={{
        activeStep,
        setActiveStep,
        importedRecords,
        importSummary,
        loadSuraDefaultDataset,
        setImportedDataset,
        fieldRecords,
        updateFieldRecords,
        applyFieldRecordsToModel,
        descriptiveAnalysis,
        confidenceLevel,
        setConfidenceLevel,
        acceptableErrorMin,
        setAcceptableErrorMin,
        params,
        updateParams,
        updateIndicators,
        currentResult,
        runCalculationAndAdvance,
        switchToStableMMS,
        timeUnit,
        setTimeUnit,
        settings,
        updateSettings,
        savedScenarios,
        saveScenario,
        deleteScenario,
        clearScenarios,
        costPerServerHourCOP,
        setCostPerServerHourCOP,
        costPerPatientWaitHourCOP,
        setCostPerPatientWaitHourCOP,
        costBasis,
        setCostBasis,
        costAnalysis,
        history,
        loadFromHistory,
        deleteFromHistory,
        clearHistory,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextValue => {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp debe utilizarse dentro de un AppProvider');
  }
  return ctx;
};

