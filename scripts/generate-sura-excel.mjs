import fs from 'node:fs';
import path from 'node:path';
import * as XLSX from 'xlsx';

// Re-run deterministic dataset creation to write physical Excel & CSV files in root & public/
let seed = 20261107;
const nextRand = () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const hourlyCounts = [
  { hour: 7, count: 16, endMinFrom7AM: 60.0 },
  { hour: 8, count: 22, endMinFrom7AM: 120.0 },
  { hour: 9, count: 19, endMinFrom7AM: 180.0 },
  { hour: 10, count: 18, endMinFrom7AM: 240.0 },
  { hour: 11, count: 16, endMinFrom7AM: 300.0 },
  { hour: 12, count: 14, endMinFrom7AM: 360.0 },
  { hour: 13, count: 15, endMinFrom7AM: 420.0 },
  { hour: 14, count: 16, endMinFrom7AM: 480.0 },
  { hour: 15, count: 15, endMinFrom7AM: 540.0 },
  { hour: 16, count: 14, endMinFrom7AM: 600.0 },
  { hour: 17, count: 12, endMinFrom7AM: 660.0 },
  { hour: 18, count: 11, endMinFrom7AM: 720.0 },
  { hour: 19, count: 10, endMinFrom7AM: 780.0 },
  { hour: 20, count: 2, endMinFrom7AM: 792.2 },
];

const arrivalMinutesFrom7AM = [0];
for (let b = 0; b < hourlyCounts.length; b++) {
  const bucket = hourlyCounts[b];
  const startMin = b === 0 ? 0.5 : (bucket.hour - 7) * 60 + 0.4;
  const endMin = b === hourlyCounts.length - 1 ? 792.2 : bucket.endMinFrom7AM - 0.6;
  const k = b === 0 ? bucket.count - 1 : bucket.count;

  const weights = [];
  for (let i = 0; i <= k; i++) {
    const u = Math.max(0.005, Math.min(0.995, nextRand()));
    weights.push(Math.pow(-Math.log(u), 1.05));
  }
  const totalW = weights.reduce((a, v) => a + v, 0);
  let cursor = startMin;
  for (let i = 0; i < k; i++) {
    if (b === hourlyCounts.length - 1 && i === k - 1) {
      arrivalMinutesFrom7AM.push(792.2);
    } else {
      cursor += (weights[i] / totalW) * (endMin - startMin);
      arrivalMinutesFrom7AM.push(Number(cursor.toFixed(2)));
    }
  }
}

const interArrivals = [0];
for (let i = 1; i < 200; i++) {
  interArrivals.push(Number((arrivalMinutesFrom7AM[i] - arrivalMinutesFrom7AM[i - 1]).toFixed(2)));
}
const sum198 = interArrivals.slice(1, 199).reduce((a, v) => a + v, 0);
interArrivals[199] = Number((792.2 - sum198).toFixed(2));

const rawService = [];
for (let i = 0; i < 200; i++) {
  const u1 = Math.max(0.001, nextRand());
  const u2 = Math.max(0.001, nextRand());
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  rawService.push(z);
}
const rawMean = rawService.reduce((a, v) => a + v, 0) / 200;
const centered = rawService.map((v) => v - rawMean);
const rawStd = Math.sqrt(centered.reduce((a, v) => a + v * v, 0) / 199);
const serviceTimes = centered.map((c) =>
  Number(Math.max(3.5, 11.718 + (c / rawStd) * (11.718 * 0.34)).toFixed(2))
);
const curServiceSum = serviceTimes.slice(0, 199).reduce((a, v) => a + v, 0);
serviceTimes[199] = Number((2343.6 - curServiceSum).toFixed(2));

const triages = [
  ...Array(92).fill('III'),
  ...Array(51).fill('IV'),
  ...Array(36).fill('V'),
  ...Array(21).fill('II'),
];
for (let i = triages.length - 1; i > 0; i--) {
  const j = Math.floor(nextRand() * (i + 1));
  const tmp = triages[i];
  triages[i] = triages[j];
  triages[j] = tmp;
}

const rows = [
  ['REGISTROS SIMULADOS - PROCESO DE REGISTRO Y ATENCIÓN EN URGENCIAS SURA MEDELLÍN'],
  ['ID', 'Hora de Llegada', 'Tiempo Entre Llegadas (min)', 'Tiempo de Atención (min)', 'Clasificación Triage'],
];

let cumMin = 7 * 60;
for (let i = 0; i < 200; i++) {
  cumMin += interArrivals[i];
  const totalMinutesFloor = Math.floor(cumMin + 1e-6);
  const hours = Math.floor(totalMinutesFloor / 60);
  const minutes = totalMinutesFloor % 60;
  const hh = String(hours).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');
  const timeStr = i === 0 ? '07:00' : i === 199 ? '20:12' : `${hh}:${mm}`;

  rows.push([i + 1, timeStr, interArrivals[i], serviceTimes[i], triages[i]]);
}

const wb = XLSX.utils.book_new();
const ws = XLSX.utils.aoa_to_sheet(rows);
XLSX.utils.book_append_sheet(wb, ws, 'Registros');

const statsSheet = XLSX.utils.aoa_to_sheet([
  ['Estadísticas Descriptivas - SURA Medellín'],
  ['Parámetro', 'Tiempo Entre Llegadas (min)', 'Tiempo de Atención (min)'],
  ['Media (n=200)', 3.961, 11.718],
  ['Media sin 0 inicial (n=199)', 3.981, 11.718],
  ['Tasa por hora (pacientes/h)', 15.148, 5.120],
  ['Coeficiente de Variación (CV)', 0.96, 0.34],
]);
XLSX.utils.book_append_sheet(wb, statsSheet, 'Estadísticas Descriptivas');

const rootExcel = path.resolve('registros_atencion_sura_medellin.xlsx');
const pubDir = path.resolve('public');
if (!fs.existsSync(pubDir)) fs.mkdirSync(pubDir, { recursive: true });
const pubExcel = path.resolve('public', 'registros_atencion_sura_medellin.xlsx');

XLSX.writeFile(wb, rootExcel);
XLSX.writeFile(wb, pubExcel);
console.log('Generated registros_atencion_sura_medellin.xlsx in root and public/');

