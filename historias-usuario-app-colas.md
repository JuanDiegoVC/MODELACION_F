# Historias de usuario — App móvil de teoría de colas (Urgencias)

**Proyecto:** Modelamiento del proceso de registro y atención en el área de urgencias de un hospital
**Fuente de datos:** `registros_atencion_sura_medellin.xlsx` (200 registros, 07:00–20:12)
**Entregable técnico:** app Android instalable por APK
**Fecha:** 2026-11-07

---

## 0. Lo que dicen los datos (insumo para las historias)

| Parámetro | Valor | Cálculo |
|---|---|---|
| Tiempo medio entre llegadas | 3,961 min (hoja "Estadísticas") | — |
| Tasa de llegada λ | ≈ 15,15 pacientes/h | 60 / 3,961 |
| Tiempo medio de atención | 11,718 min | — |
| Tasa de servicio μ (por servidor) | ≈ 5,12 pacientes/h | 60 / 11,718 |
| Intensidad de tráfico r = λ/μ | ≈ 2,96 | — |
| Mezcla de triage | III: 92 · IV: 51 · V: 36 · II: 21 | — |

**Valores de referencia M/M/S** (sirven como caso de prueba de la app):

| s | ρ | P0 | Lq | L | Wq (min) | W (min) | Pw (espera) |
|---|---|---|---|---|---|---|---|
| 1 | 2,96 | — | **inestable** | — | — | — | — |
| 3 | 0,9862 | 0,0031 | 69,36 | 72,32 | 274,74 | 286,45 | 0,974 |
| 4 | 0,7396 | 0,0401 | 1,398 | 4,356 | 5,54 | 17,26 | 0,492 |
| 5 | 0,5917 | 0,0489 | 0,327 | 3,286 | 1,30 | 13,02 | 0,226 |

### Alertas antes de construir

1. **Con estos datos el M/M/1 no tiene solución estable** (ρ ≈ 2,96 > 1). La app tiene que
   detectarlo y explicarlo, no mostrar números negativos. Se necesitan al menos 4 servidores
   para un sistema razonable; con 3 la cola casi no tiene límite.
2. **El encabezado del Excel dice "REGISTROS SIMULADOS".** El enunciado pide datos reales
   tomados por observación directa y evidencia de la metodología. Conviene aclararlo con el
   docente o reemplazarlos por datos de campo.
3. **El tiempo de atención no parece exponencial.** El coeficiente de variación de las
   llegadas es ≈ 0,96 (cercano a 1, compatible con Poisson), pero el de la atención es
   ≈ 0,34 (una exponencial daría ≈ 1). El modelo M/M/S se puede usar porque lo pide el
   enunciado, pero debe quedar como supuesto declarado en el informe. La app puede advertirlo
   (ver HU-04).
4. **La media de la hoja "Estadísticas" incluye el 0 del primer registro.** Sin él, la media
   entre llegadas es 3,981 min. La diferencia es pequeña, pero la app debe tener una regla
   explícita (ver HU-03).

---

## Épicas

| Épica | Historias | Requisito del enunciado |
|---|---|---|
| E1. Captura de datos | HU-01, HU-02, HU-03, HU-04 | "Ingresar datos tomados en campo" |
| E2. Modelo y cálculo | HU-05, HU-06, HU-07, HU-08 | "Seleccionar modelo", "Estimar parámetros" |
| E3. Presentación de resultados | HU-09, HU-10, HU-11 | "Mostrar ecuaciones y resultados" |
| E4. Escenarios de mejora | HU-12, HU-13 | Punto 4: plan de mejora con escenarios simulados |
| E5. Informe PDF | HU-14, HU-15 | "Informe automático en PDF descargable" |
| E6. Experiencia y entrega | HU-16, HU-17, HU-18, HU-19 | APK, estética, animaciones, sonidos |

Prioridad: **Must** = obligatorio por el enunciado · **Should** = suma nota (creatividad,
análisis) · **Could** = valor extra si hay tiempo.

---

## E1. Captura de datos

### HU-01 — Registrar observaciones en campo
**Como** observador en la sala de urgencias,
**quiero** registrar con un toque la llegada de cada paciente y el inicio y fin de su atención,
**para** obtener los tiempos reales sin cronómetro ni planilla en papel.

**Prioridad:** Must

**Criterios de aceptación**
1. **Dado** que inicié una sesión de observación, **cuando** toco "Llegada", **entonces** se
   guarda un registro con ID consecutivo y la hora del dispositivo con precisión de segundos.
2. **Dado** un paciente registrado, **cuando** toco "Inicia atención" y luego "Termina
   atención", **entonces** la app calcula el tiempo de atención en minutos con 2 decimales.
3. **Dado** un registro nuevo, **cuando** lo guardo, **entonces** puedo asignarle opcionalmente
   una clasificación de triage (I a V).
4. El tiempo entre llegadas se calcula automáticamente como la diferencia con la llegada
   anterior. El primer registro de la sesión no tiene tiempo entre llegadas (queda vacío, no 0).
5. **Dado** que cerré la app sin terminar la sesión, **cuando** la vuelvo a abrir,
   **entonces** los registros siguen guardados (persistencia local, sin internet).
6. No se puede marcar "Termina atención" antes de "Inicia atención" en el mismo paciente.
7. Se puede editar o borrar un registro, y borrar pide confirmación.

### HU-02 — Importar datos desde Excel/CSV
**Como** integrante del equipo,
**quiero** cargar el archivo de registros que ya tenemos (.xlsx o .csv),
**para** no digitar los 200 registros a mano.

**Prioridad:** Must

**Criterios de aceptación**
1. **Dado** el archivo `registros_atencion_sura_medellin.xlsx`, **cuando** lo importo,
   **entonces** la app reconoce las columnas *Hora de Llegada*, *Tiempo Entre Llegadas (min)*,
   *Tiempo de Atención (min)* y *Clasificación Triage*, y carga 200 registros.
2. La app ignora las filas de título (fila 1 del archivo) y detecta la fila de encabezados.
3. **Dado** un archivo con columnas distintas, **cuando** lo importo, **entonces** la app me
   deja indicar qué columna es cada dato (mapeo manual) en vez de fallar.
4. **Dado** un archivo con valores no numéricos, negativos o vacíos, **cuando** lo importo,
   **entonces** la app muestra cuántas filas rechazó y por qué, y carga solo las válidas.
5. Después de importar se muestra un resumen: número de registros, rango horario y conteo por
   triage (para este archivo: 07:00–20:12; III=92, IV=51, V=36, II=21).

### HU-03 — Ingresar parámetros manualmente
**Como** estudiante que ya calculó los promedios,
**quiero** escribir directamente el tiempo medio entre llegadas y el tiempo medio de atención
(o λ y μ),
**para** usar la app aunque no tenga los registros individuales.

**Prioridad:** Must

**Criterios de aceptación**
1. Puedo elegir la forma de ingreso: **tiempos promedio** (min) o **tasas** (por hora o por
   minuto).
2. **Dado** un tiempo entre llegadas de 3,961 min y uno de atención de 11,718 min, **cuando**
   confirmo, **entonces** la app muestra λ ≈ 15,15 /h y μ ≈ 5,12 /h.
3. Las unidades se muestran siempre junto al valor y se convierten de forma coherente; nunca
   se mezclan minutos y horas en un mismo cálculo.
4. Valores ≤ 0, vacíos o no numéricos se rechazan con un mensaje junto al campo.
5. Se acepta coma o punto como separador decimal.
6. **Regla del primer registro:** cuando los datos vienen de registros (HU-01/HU-02), el 0 del
   primer paciente no entra al promedio entre llegadas. La pantalla indica cuántos datos se
   usaron (199 para este archivo).

### HU-04 — Ver estadística descriptiva y validar la muestra
**Como** equipo,
**quiero** ver media, desviación estándar, mínimo, máximo, mediana y el histograma de los
tiempos,
**para** justificar la validez de la muestra y el supuesto exponencial en el informe.

**Prioridad:** Should

**Criterios de aceptación**
1. Para los tiempos entre llegadas y los de atención se muestran n, media, desviación estándar,
   mínimo, máximo, mediana y coeficiente de variación (CV = σ / media).
2. Los valores coinciden con la hoja "Estadísticas Descriptivas" del Excel con tolerancia de
   ±0,01 (aplicando la misma regla del primer registro).
3. Se muestra el histograma de cada variable con la curva exponencial teórica superpuesta.
4. **Dado** un CV fuera del rango 0,7–1,3, **cuando** se muestran las estadísticas,
   **entonces** aparece un aviso: "Esta variable no se comporta como exponencial; el modelo
   M/M es una aproximación". Con los datos actuales debe aparecer para el tiempo de atención
   (CV ≈ 0,34) y no para las llegadas (CV ≈ 0,96).
5. Se muestran las llegadas por hora del día, para identificar horas pico (en este archivo,
   08:00–09:00 con 22 llegadas).
6. Se muestra el tamaño de muestra mínimo recomendado y si la muestra lo cumple. *(Requiere
   que el equipo defina el criterio: nivel de confianza y error aceptable.)*

---

## E2. Modelo y cálculo

### HU-05 — Elegir el modelo de colas
**Como** usuario,
**quiero** seleccionar entre M/M/1 y M/M/S,
**para** calcular el modelo que corresponde al número de puestos de atención.

**Prioridad:** Must

**Criterios de aceptación**
1. Hay un selector con las opciones **M/M/1** y **M/M/S**, cada una con una descripción de
   una línea y una imagen que represente el sistema (una fila con 1 servidor / con S
   servidores).
2. Si elijo M/M/S, se pide el número de servidores **s**, entero ≥ 1. Con s = 1 los
   resultados son idénticos a los de M/M/1.
3. La app sugiere el mínimo de servidores para que el sistema sea estable: el menor s con
   s > λ/μ (para estos datos, **s = 3**) y lo explica.

### HU-06 — Calcular el modelo M/M/1
**Como** usuario,
**quiero** obtener los indicadores del modelo M/M/1,
**para** analizar el sistema con un solo puesto de atención.

**Prioridad:** Must

**Criterios de aceptación**
1. Se calculan: ρ = λ/μ, P0 = 1 − ρ, L = λ/(μ − λ), Lq = λ²/[μ(μ − λ)], W = 1/(μ − λ),
   Wq = λ/[μ(μ − λ)] y Pn = (1 − ρ)ρⁿ para un n que elige el usuario.
2. **Caso de prueba estable:** con λ = 2 /h y μ = 3 /h → ρ = 0,667; L = 2; Lq = 1,333;
   W = 1 h; Wq = 0,667 h.
3. **Caso de prueba inestable (datos reales):** con λ = 15,15 /h y μ = 5,12 /h la app **no
   muestra resultados numéricos**. Muestra el mensaje "Sistema inestable: llegan más
   pacientes (ρ = 2,96) de los que se pueden atender. La cola crece sin límite" y ofrece
   cambiar a M/M/S.
4. Con ρ = 1 exacto también se considera inestable.
5. Se cumple la ley de Little: L = λW y Lq = λWq, con tolerancia de 0,001.

### HU-07 — Calcular el modelo M/M/S
**Como** usuario,
**quiero** obtener los indicadores del modelo M/M/S,
**para** analizar urgencias con varios puestos de atención.

**Prioridad:** Must

**Criterios de aceptación**
1. Se calculan: ρ = λ/(sμ); P0; Lq = P0(λ/μ)ˢρ / [s!(1 − ρ)²]; L = Lq + λ/μ; Wq = Lq/λ;
   W = Wq + 1/μ; la probabilidad de esperar Pw (fórmula de Erlang C); y Pn para un n dado.
2. **Casos de prueba con los datos del Excel** (λ = 15,148 /h, μ = 5,120 /h), tolerancia
   ±1 % en cada valor:

   | s | ρ | Lq | Wq (min) | W (min) | Pw |
   |---|---|---|---|---|---|
   | 3 | 0,9862 | 69,36 | 274,74 | 286,45 | 0,974 |
   | 4 | 0,7396 | 1,398 | 5,54 | 17,26 | 0,492 |
   | 5 | 0,5917 | 0,327 | 1,30 | 13,02 | 0,226 |

3. Con s ≤ λ/μ (s = 1 o 2 con estos datos) se muestra el mismo mensaje de inestabilidad que
   en HU-06.
4. El cálculo de s! y de las potencias no se desborda ni pierde precisión para s hasta 50.
5. Se cumple la ley de Little (L = λW, Lq = λWq) con tolerancia de 0,001.

### HU-08 — Elegir qué parámetros estimar
**Como** usuario,
**quiero** marcar qué indicadores me interesan (ρ, P0, L, Lq, W, Wq, Pw, Pn),
**para** que la pantalla y el PDF muestren solo lo necesario.

**Prioridad:** Must ("estimar los parámetros seleccionados")

**Criterios de aceptación**
1. Hay una lista de casillas con todos los indicadores; por defecto están todos marcados.
2. Debe quedar al menos uno marcado; si desmarco todos, el botón "Calcular" se desactiva.
3. Pn pide el valor de n (entero ≥ 0).
4. La selección se respeta en la pantalla de resultados (HU-09) y en el PDF (HU-14).

---

## E3. Presentación de resultados

### HU-09 — Ver resultados con su interpretación
**Como** usuario,
**quiero** ver cada resultado con unidad y una frase en lenguaje sencillo,
**para** entenderlo y explicarlo en la sustentación.

**Prioridad:** Must

**Criterios de aceptación**
1. Cada indicador muestra símbolo, nombre, valor con 2–4 decimales, unidad e interpretación.
   Ejemplo: "Wq = 5,54 min — un paciente espera en promedio 5,5 minutos antes de ser
   atendido".
2. Los tiempos se pueden ver en minutos o en horas (un selector cambia todos a la vez).
3. ρ se muestra además como porcentaje de ocupación con un indicador de color: verde < 70 %,
   amarillo 70–85 %, rojo > 85 %. *(Los umbrales son una propuesta y el equipo debe
   confirmarlos.)*
4. Se muestran los datos de entrada usados (λ, μ, s, modelo) en la misma pantalla.

### HU-10 — Ver las ecuaciones utilizadas
**Como** estudiante,
**quiero** ver cada ecuación con los valores sustituidos,
**para** demostrar cómo se obtuvo cada resultado.

**Prioridad:** Must

**Criterios de aceptación**
1. Cada indicador tiene un botón "Ver ecuación" que muestra:
   (a) la fórmula general en notación matemática,
   (b) la fórmula con los números reemplazados y
   (c) el resultado.
2. Las fórmulas se renderizan correctamente: fracciones, exponentes, factorial y sumatoria
   (Σ) legibles, nada de texto plano tipo `lambda^2/(mu*(mu-lambda))`.
3. Se muestran los supuestos del modelo: llegadas Poisson, servicio exponencial, disciplina
   FIFO, población infinita, capacidad infinita y estado estable (ρ < 1).
4. El supuesto de servicio exponencial muestra el aviso de HU-04 cuando aplica.

### HU-11 — Ver gráficas del sistema
**Como** usuario,
**quiero** ver gráficas de los resultados,
**para** que la exposición sea más visual.

**Prioridad:** Should

**Criterios de aceptación**
1. Gráfica de barras de Pn para n = 0…N (N configurable, por defecto 15).
2. Gráfica de Wq y Lq contra el número de servidores (s = mínimo estable … mínimo + 4).
3. Las gráficas tienen títulos, ejes con unidad y se leen en pantalla de celular en vertical.
4. Las gráficas se incluyen en el PDF (HU-14).

---

## E4. Escenarios de mejora

### HU-12 — Simular escenarios "¿qué pasaría si…?"
**Como** equipo que arma el plan de mejora,
**quiero** cambiar s, λ o μ y ver el efecto al instante,
**para** sustentar las recomendaciones con números del modelo.

**Prioridad:** Should (el punto 4 del enunciado exige escenarios simulados)

**Criterios de aceptación**
1. Se pueden ajustar con deslizadores: número de servidores, % de variación de λ (por ejemplo,
   hora pico +30 %) y tiempo medio de atención (por ejemplo, −15 % con mejor proceso de
   registro).
2. Los resultados se recalculan sin tocar "Calcular" otra vez.
3. Se pueden guardar hasta 5 escenarios con nombre y verlos en una tabla comparativa contra
   el escenario base.
4. La tabla marca en verde las mejoras y en rojo los empeoramientos de cada indicador frente
   al base.
5. Un escenario inestable se muestra en la tabla como "Inestable", no como un número.

### HU-13 — Analizar costos y encontrar el número óptimo de servidores
**Como** equipo,
**quiero** ingresar el costo por hora de un servidor y un costo por hora de espera del
paciente,
**para** encontrar el número de servidores que minimiza el costo total y hablar de
rentabilidad.

**Prioridad:** Should (el enunciado pide "rentabilidad")

**Criterios de aceptación**
1. Costo total por hora = s · Cs + L · Cw (o Lq · Cw; la app permite elegir y lo indica).
2. Se muestra una tabla y una gráfica del costo total para s = mínimo estable … mínimo + 6,
   con el óptimo resaltado.
3. Los costos se ingresan en COP y se muestran con separador de miles.
4. *(Requiere que el equipo defina de dónde salen Cs y Cw: salario del personal, costo de
   oportunidad del paciente, etc. No lo inventa la app.)*

---

## E5. Informe PDF

### HU-14 — Generar el informe PDF automático
**Como** usuario,
**quiero** generar un PDF con todo lo calculado,
**para** adjuntarlo al informe del proyecto.

**Prioridad:** Must

**Criterios de aceptación**
1. El PDF contiene, en este orden:
   (a) portada con título, fecha y hora de generación;
   (b) datos de entrada y su origen (manual, campo o archivo, con número de registros);
   (c) estadística descriptiva, si existe;
   (d) modelo elegido y supuestos;
   (e) ecuaciones con valores sustituidos;
   (f) tabla de resultados con unidades;
   (g) gráficas;
   (h) escenarios comparados, si existen;
   (i) interpretación y conclusión automática (por ejemplo, "El sistema opera al 74 % de
       ocupación; un paciente espera en promedio 5,5 min").
2. Solo incluye los indicadores seleccionados en HU-08.
3. Las fórmulas, tildes y la letra ñ se ven correctamente.
4. Si el sistema es inestable, el PDF lo declara y no incluye resultados numéricos inválidos.
5. El PDF se genera en menos de 5 segundos en un celular de gama media.
6. Los valores del PDF son idénticos a los que se muestran en pantalla.

### HU-15 — Descargar y compartir el PDF
**Como** usuario,
**quiero** guardar el PDF en el celular y compartirlo,
**para** enviarlo al equipo o al docente.

**Prioridad:** Must

**Criterios de aceptación**
1. Un botón "Descargar" guarda el archivo en Descargas con el nombre
   `informe_colas_{modelo}_{AAAA-MM-DD_HHmm}.pdf`.
2. Un botón "Compartir" abre el menú del sistema (WhatsApp, correo, Drive).
3. Al guardar se muestra la ruta y un botón "Abrir".
4. Si falta el permiso de almacenamiento, la app lo pide y explica para qué; si lo niego,
   puedo seguir compartiendo.

---

## E6. Experiencia y entrega

### HU-16 — Instalar la app desde un APK
**Como** docente evaluador,
**quiero** instalar la app con un archivo APK,
**para** probarla en mi celular sin tienda de aplicaciones.

**Prioridad:** Must

**Criterios de aceptación**
1. Se entrega un APK firmado que instala en Android 8.0 o superior.
2. La app abre sin conexión a internet y sin crear cuenta.
3. Tiene nombre e ícono propios en el lanzador.
4. Se probó en al menos 2 dispositivos reales distintos (marca o tamaño de pantalla) y queda
   registro de cuáles fueron.

### HU-17 — Navegar con una interfaz clara y atractiva
**Como** usuario,
**quiero** una interfaz con identidad visual, animaciones y sonidos sutiles,
**para** que la app sea agradable y fácil de usar (el enunciado lo valora).

**Prioridad:** Should

**Criterios de aceptación**
1. Hay una pantalla de bienvenida con logo y una animación breve (≤ 2 s).
2. El flujo principal (Datos → Modelo → Resultados → PDF) se completa en 4 pantallas o
   menos, con indicador de paso.
3. Una animación muestra la cola: pacientes que llegan y servidores que atienden, a una
   velocidad proporcional a λ y μ.
4. Hay sonidos al calcular o al generar el PDF, que se pueden silenciar desde Ajustes.
5. Los textos tienen tamaño mínimo legible (14 sp) y buen contraste.
6. Funciona en vertical en pantallas de 5" a 10" (celular y tableta).

### HU-18 — Consultar la ayuda y la teoría
**Como** usuario sin experiencia en teoría de colas,
**quiero** una sección de ayuda con conceptos básicos,
**para** entender qué significa cada símbolo.

**Prioridad:** Could

**Criterios de aceptación**
1. Hay un glosario de λ, μ, ρ, s, L, Lq, W, Wq, P0, Pn y Pw.
2. Hay una explicación de la notación de Kendall (A/B/s) y de cuándo usar M/M/1 o M/M/S.
3. Hay un ejemplo resuelto con el caso de urgencias.

### HU-19 — Guardar el historial de cálculos
**Como** usuario,
**quiero** que la app guarde mis cálculos anteriores,
**para** volver a ellos sin ingresar los datos otra vez.

**Prioridad:** Could

**Criterios de aceptación**
1. Cada cálculo se guarda con fecha, modelo, datos de entrada y resultados.
2. Desde el historial puedo abrir, regenerar el PDF o borrar un cálculo.
3. El historial sobrevive al cierre de la app.

---

## Fuera de alcance (o mejora opcional)

- **Colas con prioridad por triage** (M/M/S con prioridades). Los datos traen triage II–V y en
  una urgencia real no se atiende por orden de llegada (FIFO). El enunciado solo exige
  M/M/1 y M/M/S, pero mencionarlo en el análisis suma.
- **Modelos M/G/1 o M/Ek/S**, que se ajustan mejor a un servicio con CV ≈ 0,34.
- Sincronización en la nube y uso por varios observadores a la vez.

## Preguntas abiertas para el equipo o el docente

1. ¿Se aceptan los datos del Excel, que se declaran simulados, o hay que tomar datos reales
   por observación directa?
2. ¿Cuántos puestos de atención (s) tiene el proceso observado? ¿Registro y atención médica
   se modelan como una sola etapa o como dos colas en serie?
3. ¿Qué costos se usan para el análisis de rentabilidad (HU-13)?
4. ¿Qué tecnología usarán para la app? (Flutter, Kotlin, React Native, MIT App Inventor…).
   Influye en el alcance de las animaciones, el PDF y la importación de Excel.

## Definición de terminado (aplica a todas las historias)

- Cumple todos sus criterios de aceptación, probados en un dispositivo real.
- Los casos de prueba numéricos (HU-06, HU-07) dan resultados dentro de la tolerancia.
- No se cierra inesperadamente con entradas vacías, cero, negativas o muy grandes.
- Se puede mostrar en el video demo.
