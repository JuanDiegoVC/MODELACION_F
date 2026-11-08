# Urgencias Colas SURA — Sistema Web & Android APK de Teoría de Colas (M/M/1 y M/M/S)

Aplicativo web progresivo (PWA) y móvil nativo Android (`.apk`) para el **modelamiento, simulación e inferencia estadística del proceso de registro y atención en el área de urgencias de un hospital**, basado en los 200 registros de `registros_atencion_sura_medellin.xlsx` (07:00–20:12).

---

## 1. Arquitectura de Software y Principios Aplicados

El sistema fue diseñado bajo **Clean Architecture (Arquitectura Limpia)** con **bajo acoplamiento y alta cohesión**, aplicando estrictamente los principios **SOLID**, **DRY** y **KISS**:

```text
MODELACION_F/
├── urgencias-colas-sura.apk                # Entregable APK Android firmado listo para instalar
├── registros_atencion_sura_medellin.xlsx   # Base de datos de 200 registros (07:00–20:12)
├── public/
│   ├── apk/urgencias-colas-sura.apk        # APK descargable desde la interfaz web
│   └── registros_atencion_sura_medellin.xlsx
├── src/
│   ├── domain/                             # CAPA DE DOMINIO (0 dependencias de UI o frameworks)
│   │   ├── entities/                       # Modelos inmutables de datos y resultados
│   │   ├── repositories/                   # Contratos de persistencia (Inversión de Dependencias)
│   │   ├── services/                       # Motores matemáticos M/M/1, M/M/S (Erlang-C), Estadística y Costos
│   │   └── __tests__/                      # Suite de pruebas unitarias de aceptación (Vitest)
│   ├── infrastructure/                     # CAPA DE INFRAESTRUCTURA (Adaptadores externos)
│   │   ├── storage/                        # Persistencia offline en LocalStorage
│   │   ├── importers/                      # Parser de Excel (.xlsx) y CSV con mapeo de columnas
│   │   ├── pdf/                            # Generador de informes PDF y adaptador nativo de compartir
│   │   ├── audio/                          # Sintetizador de efectos de sonido con Web Audio API
│   │   └── data/                           # Generador determinístico de los 200 registros de SURA Medellín
│   └── presentation/                       # CAPA DE PRESENTACIÓN (React + TailwindCSS)
│       ├── context/                        # Orquestación de estado desacoplada
│       └── components/                     # Flujo guiado en 4 pasos (Datos → Modelo → Resultados → PDF)
└── android/                                # Proyecto nativo Android (Capacitor + Gradle)
```

### Patrones de Diseño Utilizados
- **Strategy & Factory Pattern (`QueueCalculatorFactory`, `MM1Calculator`, `MMSCalculator`):** Permite intercambiar dinámicamente el motor matemático según el modelo elegido (`M/M/1` o `M/M/S`) implementando la interfaz `IQueueCalculator` (Principio Abierto/Cerrado — **OCP** y Sustitución de Liskov — **LSP**).
- **Repository Pattern (`IStorageRepository` / `LocalStorageRepository`):** Desacopla la lógica de negocio del mecanismo de almacenamiento local offline (Principio de Inversión de Dependencias — **DIP**).
- **Single Responsibility Principle (**SRP**):** Separación estricta entre captura/importación (`SpreadsheetImporter`), estadística descriptiva (`StatisticsService`), optimización de costos (`CostOptimizerService`) y generación de reportes (`PdfReportGenerator`).

---

## 2. Matriz de Cumplimiento de Historias de Usuario (HU-01 a HU-19)

| Épica | Historia | Estado | Módulo Responsable |
|---|---|---|---|
| **E1. Captura de datos** | **HU-01** Registrar observaciones en campo | ✅ 100% | `FieldObserverPanel.tsx` |
| **E1. Captura de datos** | **HU-02** Importar datos desde Excel/CSV | ✅ 100% | `SpreadsheetImporter.ts`, `ExcelImportPanel.tsx` |
| **E1. Captura de datos** | **HU-03** Ingresar parámetros manualmente | ✅ 100% | `ManualParamsPanel.tsx` |
| **E1. Captura de datos** | **HU-04** Estadística descriptiva y validar muestra | ✅ 100% | `StatisticsService.ts`, `DescriptiveStatsPanel.tsx` |
| **E2. Modelo y cálculo** | **HU-05** Elegir el modelo de colas (`M/M/1` / `M/M/S`) | ✅ 100% | `ModelSelectionView.tsx` |
| **E2. Modelo y cálculo** | **HU-06** Calcular el modelo `M/M/1` | ✅ 100% | `MM1Calculator.ts` |
| **E2. Modelo y cálculo** | **HU-07** Calcular el modelo `M/M/S` (hasta `s=50+`) | ✅ 100% | `MMSCalculator.ts` |
| **E2. Modelo y cálculo** | **HU-08** Elegir qué parámetros estimar | ✅ 100% | `ModelSelectionView.tsx` |
| **E3. Resultados** | **HU-09** Ver resultados con su interpretación y semáforo | ✅ 100% | `ResultsDashboardView.tsx` |
| **E3. Resultados** | **HU-10** Ver ecuaciones sustituidas y supuestos | ✅ 100% | `MathFormula.tsx`, `EquationsModal.tsx` |
| **E3. Resultados** | **HU-11** Ver gráficas del sistema ($P_n$, $W_q$ y $L_q$ vs $s$) | ✅ 100% | `SystemChartsPanel.tsx` |
| **E4. Mejora** | **HU-12** Simular escenarios "¿qué pasaría si…?" (hasta 5) | ✅ 100% | `ScenariosSimulatorPanel.tsx` |
| **E4. Mejora** | **HU-13** Analizar costos en COP y hallar $s^*$ óptimo | ✅ 100% | `CostOptimizerService.ts`, `CostAnalysisPanel.tsx` |
| **E5. Informe PDF** | **HU-14** Generar informe PDF automático (< 2 s) | ✅ 100% | `PdfReportGenerator.ts`, `PdfReportView.tsx` |
| **E5. Informe PDF** | **HU-15** Descargar y compartir el PDF | ✅ 100% | `PdfReportGenerator.ts`, `PdfReportView.tsx` |
| **E6. Entrega** | **HU-16** Instalar la app desde un APK (Android 8.0+) | ✅ 100% | `urgencias-colas-sura.apk`, `ApkDownloadModal.tsx` |
| **E6. Entrega** | **HU-17** Interfaz clara, splash, animación de cola y sonidos | ✅ 100% | `SplashScreen.tsx`, `QueueLiveVisualizer.tsx`, `SoundEffectsService.ts` |
| **E6. Entrega** | **HU-18** Consultar ayuda, glosario, Kendall y ejemplo resuelto | ✅ 100% | `HelpTheoryModal.tsx` |
| **E6. Entrega** | **HU-19** Guardar el historial de cálculos | ✅ 100% | `HistoryDrawer.tsx`, `LocalStorageRepository.ts` |

---

## 3. Ejecución y Despliegue

### Ejecutar en Desarrollo Web
```bash
npm install
npm run dev
```

### Ejecutar Suite de Pruebas Matemáticas de Aceptación
```bash
npm test
```

### Compilar para Despliegue Web Estático (Vercel / Netlify / GitHub Pages)
```bash
npm run build
```
La carpeta `dist/` generada contiene la aplicación web completa lista para subir a cualquier servicio de hosting estático e incluye `dist/apk/urgencias-colas-sura.apk` para descarga directa desde el navegador.

