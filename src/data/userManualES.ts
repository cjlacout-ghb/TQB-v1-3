// Spanish User Manual Content
import { UserManualSection } from '../lib/types';

export const userManualES: UserManualSection[] = [
    {
        id: 'introduction',
        title: 'Introducción',
        content: `
La **Calculadora TQB** es una herramienta diseñada para calcular las clasificaciones de torneos de softbol utilizando los criterios de desempate de la **Regla C11 del Reglamento de Torneos de la WBSC** (Confederación Mundial de Béisbol y Softbol).

Esta aplicación ayuda a oficiales de torneos y entrenadores a determinar con precisión las clasificaciones de equipos cuando múltiples equipos tienen el mismo récord de victorias-derrotas.

### Funcionalidades
- Calcula y muestra las clasificaciones del torneo según la oficial Regla C11 de la WBSC.
- **Modo Multi-Grupo**: Rastrea y clasifica dos divisiones separadas (Grupo A y Grupo B) simultáneamente en el mismo archivo.
- **Guardado Automático**: Los datos se guardan en su dispositivo. Puede cerrar el navegador en cualquier momento y retomar exactamente donde quedó.
- Genera informes profesionales en PDF con tablas separadas para cada grupo.
- Soporta formatos de torneo round-robin (hasta 8 equipos por grupo).
    `,
    },
    {
        id: 'data-persistence',
        title: 'Persistencia de Datos y Privacidad',
        content: `
### ¿Dónde se guardan los datos?
Los datos se almacenan localmente en el **almacenamiento de su navegador (localStorage)**. Esto implica:
- **Sin Servidor**: Sus datos nunca se envían a un servidor externo. La privacidad es 100% local.
- **Persistencia**: La información permanece en el dispositivo incluso si cierra el navegador o reinicia su equipo/móvil.

### Escenarios de Pérdida de Datos
Sus datos se borrarán permanentemente en los siguientes casos:
1. **Modo Incógnito**: Los datos se eliminan al cerrar la pestaña o ventana privada.
2. **Borrar Datos del Navegador**: Si limpia manualmente la "Caché" o los "Datos de sitios" del navegador.
3. **Cambiar de Dispositivo/Navegador**: Los datos son exclusivos del navegador y dispositivo donde se ingresaron (ej. no aparecerán en otro móvil o se cambia de Chrome a Safari).
4. **Nuevo Torneo**: Al hacer clic en **"Nuevo Torneo"** dentro de la app, se borra el registro actual.
    `,
    },
    {
        id: 'getting-started',
        title: 'Primeros Pasos',
        content: `
### Pantalla de Bienvenida
1. **Continuar Torneo**: Retoma la sesión anterior con todos los datos previamente ingresados.
2. **Nuevo Torneo**: Borra todos los datos actuales para iniciar un cálculo desde cero (Paso 1).

### Paso 1: Ingresar Nombres de Equipos
1. Ingrese los nombres de todos los equipos involucrados.
2. Haga clic en **"Agregar Equipo"** para añadir más (mínimo 3, máximo 8 por grupo).
3. **Torneos Multi-Grupo**: Haga clic en **"+ Grupo B"** para habilitar el seguimiento multi-grupo. Ahora puede usar las pestañas para cambiar entre el Grupo A y el Grupo B libremente, tratando a cada uno de forma independiente.
4. Use el **icono de papelera** para eliminar un equipo.
5. Una vez que avance a la siguiente pantalla, los nombres no podrán ser editados.

### Consejos
- Use nombres oficiales de equipos para un registro preciso
- Verifique la ortografía antes de continuar
- También puede cargar un archivo (CSV o TXT) o **pegar el contenido directamente** para pre-llenar todos los datos
    `,
    },
    {
        id: 'csv-upload',
        title: 'Guía de Importación (Archivo o Texto)',
        content: `
### Formato de Archivo o Pegado de Texto (CSV/TXT)

Cargue un archivo CSV/TXT o **pegue el contenido** para llenar automáticamente todos los datos de equipos y partidos. El archivo debe tener las siguientes columnas:

| Columna | Descripción |
|---------|-------------|
| Team_A | Nombre del primer equipo |
| Team_B | Nombre del segundo equipo |
| Runs_A | Carreras anotadas por Equipo A |
| Runs_B | Carreras anotadas por Equipo B |
| Earned_Runs_A | Carreras limpias anotadas por Equipo A |
| Earned_Runs_B | Carreras limpias anotadas por Equipo B |
| Innings_A_Batting | Entradas del Equipo A al bate |
| Innings_A_Defense | Entradas del Equipo A en defensa |
| Innings_B_Batting | Entradas del Equipo B al bate |
| Innings_B_Defense | Entradas del Equipo B en defensa |

### Contenido de Ejemplo

\`\`\`
Team_A,Team_B,Runs_A,Runs_B,Earned_Runs_A,Earned_Runs_B,Innings_A_Batting,Innings_A_Defense,Innings_B_Batting,Innings_B_Defense
Tigres,Aguilas,5,3,4,2,7,6.2,6.2,7
Aguilas,Tiburones,2,8,1,6,7,7,7,7
\`\`\`

### Cómo Importar Datos

#### Opción A: Cargar Archivo
1. **Seleccionar Pestaña**: Asegúrese de estar en la pestaña **"Archivo"**.
2. **Cargar**: (Paso 1) Arrastre y suelte su archivo CSV o TXT en el área de carga.

#### Opción B: Pegar Texto (Novedad v1.3)
1. **Seleccionar Pestaña**: Cambie a la pestaña **"Pegar Texto"**.
2. **Pegar**: Pegue el contenido de su archivo TXT o Excel en el área de texto. Asegúrese de incluir la fila de encabezado.
3. **Procesar**: Haga clic en **"Procesar Texto"**.

### Siguientes Pasos
1. **Verificar Datos**: (Paso 2) La aplicación se mueve automáticamente al Paso 2. Todos los datos de los partidos importados se pre-llenan.
2. **Editar (Opcional)**: Si es necesario, puede corregir cualquier valor directamente en esta pantalla.
3. **Calcular**: Haga clic en **"Calcular Clasificaciones"** en la parte inferior para ver los resultados.

### Restricciones
- Se requiere un **mínimo de 3 equipos** por grupo.
- Se permite un **máximo de 8 equipos** por grupo (igual límite que la entrada manual).
- En modo multi-grupo, importe el CSV de cada grupo por separado usando las pestañas **Grupo A / Grupo B**.
- Si el grupo destino ya contiene equipos con nombre o resultados de partidos, una ventana de confirmación le solicitará su aprobación antes de reemplazar los datos existentes.
    `,
    },
    {
        id: 'entering-games',
        title: 'Ingresando Resultados de Partidos',
        content: `
### Emparejamientos Auto-Generados

El sistema genera automáticamente todos los emparejamientos posibles en formato round-robin:
- 4 equipos = 6 partidos
- 5 equipos = 10 partidos
- 6 equipos = 15 partidos
- 7 equipos = 21 partidos
- 8 equipos = 28 partidos

### Orden de Controles en el Encabezado de la Tarjeta de Partido
En el encabezado de cada tarjeta de partido, los botones y controles están dispuestos de izquierda a derecha en el siguiente orden estándar:
1. **Flechas Subir / Bajar** (▲/▼): ajustan la posición del partido en el cronograma.
2. **Número de Partido** (#N): muestra la numeración ordinal del partido.
3. **Botón de Candado**: permite fijar o desbloquear los resultados del partido.

Seguidos de los nombres de los equipos y las etiquetas de estado. La numeración #N se actualiza automáticamente y el orden personalizado se refleja en los reportes exportados en PDF.

### Fijar Resultados de Partidos (Candado de Bloqueo)
Cada partido cuenta con un botón de **candado** en su encabezado para fijar sus resultados una vez disputado:
- **Solo lectura e indicador visual**: Al fijar un partido completo, muestra una etiqueta carmesí **"Fijado"** (con su botón de candado en tono carmesí) y sus carreras y entradas quedan deshabilitadas para evitar modificaciones accidentales.
- **Reglas estrictas**: Solo se pueden fijar partidos que cumplan las reglas oficiales de partido finalizado (ej. entradas del equipo local según el resultado). Al hacer clic en un candado bloqueado, se muestra una explicación interactive con el motivo exacto (datos incompletos o regla de partido finalizado no cumplida).
- **Recálculo rápido**: Permite simular distintos escenarios modificando solo el partido en curso sin reingresar ni alterar los partidos ya confirmados.
- **Desbloqueo**: Hacer clic en el candado desbloquea el partido de forma inmediata.

### Sugerencias Visuales (Tooltips)
Todos los botones e iconos interactivos de la aplicación cuentan con sugerencias visuales emergentes (tooltips) al posar el cursor o enfocar con el teclado. Estas explicaciones facilitan la navegación y describen la función exacta de cada acción.

### Partido en Juego ("En Juego")
- **Foto del momento**: La app permite calcular la clasificación en tiempo real (*on the fly*) para un partido en curso, incluyendo parciales a mitad de entrada (media entrada).
- **Etiqueta visual**: Se muestra la etiqueta en tonos dorados **"En juego"** (con punto pulsante animado) únicamente cuando el grupo tiene exactamente 1 partido sin fijar y al menos 1 partido fijado.
- **Regla de fijación de partidos del grupo**: Por cada grupo se permite como **máximo 1 partido sin fijar** ("En juego"). Todos los demás partidos disputados del grupo deben estar **fijados con el candado** como partidos finales antes de presionar "Calcular Posiciones". Si hay más de un partido sin fijar, al hacer clic en "Calcular Posiciones" o "Exportar PDF" se despliega un resumen indicando qué partidos se pueden fijar (✓) y cuáles requieren corregir datos (⚠).
- **Validación flexible**: El partido en juego solo requiere datos numéricos y de entradas con formato válido. Las reglas estrictas de finalización (ganador local con menos entradas al bate, etc.) solo se aplican a los partidos fijados o al intentar cerrar el candado.


### Para Cada Partido, Ingrese:

**Carreras Anotadas**
- Ingrese el total de carreras anotadas por cada equipo
- Debe ser un número entero (0 o mayor)

**Formato de Entradas**
El campo de entradas usa un formato decimal especial:
- **Entradas completas**: 7, 6, 5, etc.
- **Entradas + 1 out**: 7.1 (7 entradas completas + 1 out)
- **Entradas + 2 outs**: 7.2 (7 entradas completas + 2 outs)

**¿Por qué este formato?**
El softbol cuenta outs por entrada (3 outs = 1 entrada completa). Si un partido termina a mitad de entrada, necesita registrar las entradas parciales.

**Ejemplo**: Si un partido termina después de que el Equipo A hace 2 outs en la 7ma entrada, ingrese "6.2" (6 entradas completas + 2 outs = 6⅔ entradas).

### Reglas Específicas de Softbol

Para garantizar la integridad de los datos, la calculadora aplica varias restricciones reglamentarias de softbol:

**1. Lados Local/Visitante (Intercambiar)**
- Al hacer clic en **"Intercambiar Lados"**, se cambia qué equipo es el Local y cuál es el Visitante.
- Esto es importante porque el estado Local/Visitante afecta las restricciones de entradas.

**2. Entradas Sincronizadas**
- Cuando ingresa las **Entradas al Bate** para el Equipo A, las **Entradas en Defensa** para el Equipo B se actualizan automáticamente al mismo valor.
- Esto asegura la consistencia en el registro del partido.
- **Validación Lógica**: La aplicación impedirá ingresar entradas al bate que no coincidan con la línea de tiempo del partido (ej. un equipo no puede tener más entradas de bateo que el total de entradas que el otro equipo defendió).

**3. Restricciones del Equipo Local**
- **Equipo Local Gana**: Si el equipo local está ganando, debe tener **menos** entradas al bate que el Visitante (ya que no se completa la parte baja de la última entrada).
- **Equipo Local Pierde**: Si el equipo local pierde, debe tener **exactamente las mismas** entradas al bate que el Visitante.
    `,
    },
    {
        id: 'tie-breaking',
        title: 'Entendiendo los Criterios de Desempate',
        content: `
### Jerarquía de Desempate de la Regla C11 de WBSC

Cuando múltiples equipos tienen el mismo récord de victorias-derrotas, se aplican los siguientes criterios **en orden**:

---

**1. Récord de Victorias-Derrotas y Resultados Directos (Head-to-Head)**
Los equipos se clasifican primero por su récord general. Para equipos con récords idénticos:
- **2 equipos**: El ganador de su enfrentamiento directo se clasifica más alto.
- **3+ equipos**: El equipo con mejor récord en partidos SOLO entre los equipos empatados se clasifica más alto.
- Si es circular (A venció a B, B venció a C, C venció a A), se procede al TQB.

---

**2. Balance de Calidad del Equipo (TQB)**

**Fórmula:**
\`\`\`
TQB = (Carreras Anotadas ÷ Entradas al Bate) - (Carreras Permitidas ÷ Entradas en Defensa)
\`\`\`

**Qué mide:**
- La diferencia entre producción ofensiva y rendimiento defensivo
- Un TQB más alto indica mejor calidad general del equipo
- Valores positivos significan que el equipo anota más carreras por entrada de las que permite

---

**3. TQB de Carreras Limpias (ER-TQB)**

Solo se usa si el TQB no resuelve los empates.

**Fórmula:**
\`\`\`
ER-TQB = (Carreras Limpias Anotadas ÷ Entradas al Bate) - (Carreras Limpias Permitidas ÷ Entradas en Defensa)
\`\`\`

**Qué mide:**
- Similar al TQB pero usa carreras limpias (excluye carreras anotadas debido a errores)
- Proporciona una medida más "pura" del rendimiento del equipo

---

**4. Promedio de Bateo**
Si el ER-TQB no resuelve los empates, se comparan los promedios de bateo entre equipos empatados.
*Nota: Esto requiere revisión manual*

---

**5. Lanzamiento de Moneda**
Como último recurso, los empates se resuelven por lanzamiento de moneda.
*Nota: El sistema indicará si se ha llegado a este punto crítico.*
    `,
    },
    {
        id: 'viewing-results',
        title: 'Visualizando Resultados',
        content: `
### Pantalla de Clasificaciones

La visualización de clasificaciones muestra:
- **Posición de Rango**: #1, #2, #3, etc.
- **Nombre del Equipo**: El nombre del equipo
- **Récord V-D**: Victorias y derrotas
- **Valor TQB/ER-TQB**: Valor de balance calculado (a 4 decimales)

### Panel "Partido en Juego" (Posiciones en Vivo)
Cuando un grupo cuenta con al menos 1 partido fijado y entre 1 y 4 partidos sin fijar, se despliega el panel colapsable **"Partido en Juego"** en la parte superior de la pantalla de Posiciones TQB (Pantalla 3).
- **Actualización en Vivo**: Permite editar carreras y entradas del partido en curso directamente dentro del panel. La tabla de posiciones se recalcula al instante en tiempo real sin cambiar de pantalla.
- **Protección del Candado**: Al fijar un partido desde el panel, su resultado queda protegido y sale del panel hacia la lista de partidos confirmados. El candado protege el marcador principal y las entradas contra ediciones accidentales, permitiendo ingresar carreras limpias en la pantalla de ER-TQB si fuera necesario.
- **Aviso de Cálculo Desactualizado**: Si un partido en juego tiene campos incompletos o inválidos, se muestra un aviso indicando que se visualiza el último cálculo válido hasta completar los datos.

### Marca de Posiciones Provisionales
Un grupo se clasifica como **Provisional** cuando contiene al menos 1 partido fijado Y al menos 1 partido sin fijar (un torneo en desarrollo con partidos en juego). En las pantallas 3 (TQB) y 5 (ER-TQB) se despliega un aviso destacado en tono ámbar que advierte que las posiciones incluyen resultados sin confirmar y que la clasificación final puede cambiar.

### Entendiendo los Valores

- **TQB Positivo**: El equipo anota más carreras por entrada de las que permite (¡bien!)
- **TQB Negativo**: El equipo permite más carreras por entrada de las que anota
- **TQB Cero**: Ofensiva y defensa perfectamente balanceadas

### Mensajes de Resolución de Empates

La pantalla indicará cómo se resolvieron los empates:
- "Empates resueltos usando Resultados Directos"
- "Empates resueltos usando TQB (Balance de Calidad del Equipo)"
- "Empates resueltos usando ER-TQB (Balance de Calidad por Carreras Limpias)"
- "Se requiere revisión manual para Promedio de Bateo o Lanzamiento de Moneda"
    `,
    },
    {
        id: 'exporting',
        title: 'Exportando Resultados',
        content: `
### Exportar a PDF

En la pantalla de clasificaciones finales, haga clic en **"Exportar a PDF"** para generar un informe imprimible.

**Antes de exportar:**
1. Ingrese un **Nombre de Torneo** (ej., "Campeonato Regional 2026")
2. Opcionalmente ajuste la fecha (por defecto es hoy)
3. Marque/desmarque **"Marcar documento como provisional"** (preseleccionado automáticamente si el torneo combina partidos fijados y sin fijar)
4. Haga clic en **"Generar PDF"**

**Controles de Exportación:**
- **Casilla de Documento Provisional**: Se preselecciona automáticamente si algún grupo es provisional. El usuario puede marcarla o desmarcarla manualmente para esa exportación específica. Al activarse, el PDF incluye encabezados y pies destacados en todas las páginas e identifica los partidos sin fijar con un símbolo (†) y una leyenda explicativa.
- **Bloqueo por Cálculo Desactualizado**: Si hay partidos con datos incompletos o inválidos, el sistema bloquea automáticamente la generación del PDF con un mensaje claro para evitar la impresión de tablas obsoletas o inconsistentes.

**El PDF incluye:**
- Nombre del torneo y fecha
- Referencia a la Regla C11 de WBSC
- Tabla de clasificaciones finales con todas las estadísticas
- Método de desempate utilizado
- Resumen de resultados de partidos (con marcas de partidos provisonales según corresponda)
- Referencia de fórmulas
    `,
    },
    {
        id: 'example',
        title: 'Ejemplo Paso a Paso',
        content: `
### Ejemplo Completo con 4 Equipos

**Equipos:** Tigres, Águilas, Tiburones, Leones

**Resultados de Partidos:**

| Partido | Marcador | Entradas |
|---------|----------|----------|
| Tigres vs Águilas | 5-3 | 7.0 cada uno |
| Tigres vs Tiburones | 4-4 | 7.0 cada uno |
| Tigres vs Leones | 6-2 | 7.0 cada uno |
| Águilas vs Tiburones | 2-8 | 7.0 cada uno |
| Águilas vs Leones | 5-5 | 7.0 cada uno |
| Tiburones vs Leones | 3-1 | 7.0 cada uno |

**Récords de Victorias-Derrotas:**
- Tigres: 2-0-1 (2 victorias, 1 empate)
- Tiburones: 2-0-1 (2 victorias, 1 empate)
- Leones: 0-2-1 (1 empate)
- Águilas: 0-2-1 (1 empate)

**Directos (Tigres vs Tiburones):** Empatados 4-4

**Cálculo de TQB:**
Como el enfrentamiento directo está empatado, calculamos TQB:

*Tigres:*
- Carreras Anotadas: 5+4+6 = 15
- Carreras Permitidas: 3+4+2 = 9
- TQB = (15÷21) - (9÷21) = 0.7143 - 0.4286 = **+0.2857**

*Tiburones:*
- Carreras Anotadas: 4+8+3 = 15
- Carreras Permitidas: 4+2+1 = 7
- TQB = (15÷21) - (7÷21) = 0.7143 - 0.3333 = **+0.3810**

**Clasificaciones Finales:**
1. Tiburones (TQB: +0.3810)
2. Tigres (TQB: +0.2857)
3. Águilas
4. Leones
    `,
    },
    {
        id: 'troubleshooting',
        title: 'Solución de Problemas',
        content: `
### Problemas Comunes

**"Formato de entradas inválido"**
- Use solo números enteros o decimales .1 o .2
- Válido: 7, 7.1, 7.2, 6, 6.1, 6.2
- Inválido: 7.3, 7.5, 6.33, etc.

**"El equipo local ganador debe tener menos entradas al bate..."**
- Según las reglas de softbol, si el equipo local gana, generalmente no termina su última media entrada al bate.
- Ajuste las **Entradas al Bate** del equipo local para que sean menores que las del visitante.

**"El equipo local perdedor debe tener exactamente las mismas entradas..."**
- Si el equipo local pierde, debe haber completado las mismas oportunidades ofensivas que el equipo visitante.
- Asegúrese de que ambos equipos tengan el mismo valor de **Entradas al Bate**.

**"Campos requeridos faltantes"**
- Todos los campos de carreras y entradas deben estar llenos
- Verifique cada partido para inputs vacíos

**"El nombre del equipo ya existe"**
- Cada equipo debe tener un nombre único
- Verifique entradas duplicadas

**Errores de carga de archivos**
- Asegúrese de que las 10 columnas estén presentes
- Verifique comas faltantes o columnas extra
- Verifique el formato de entradas en su hoja de cálculo

### Comenzar de Nuevo

Haga clic en **"Iniciar Nuevo Cálculo"** en cualquier pantalla de resultados para volver al principio e ingresar nuevos datos. Todos los datos actuales serán borrados.
    `,
    },
    {
        id: 'official-rule-c11',
        title: 'Referencia Oficial y Descargo',
        content: `
### Reglamento de Torneos WBSC - Regla C11

Todos los empates se resolverán en el siguiente orden secuencial:
1. **Resultados Directos (Head-to-Head)**: El ganador de los enfrentamientos directos se clasifica más alto.
2. **Balance de Calidad del Equipo (TQB)**: (Carreras Anotadas / Entradas Bateo) – (Carreras Permitidas / Entradas Defensa).
3. **TQB de Carreras Limpias (ER-TQB)**: (Carreras Limpias Anotadas / Entradas Bateo) – (Carreras Limpias Permitidas / Entradas Defensa).
4. **Promedio de Bateo Más Alto**: Comparación entre los equipos empatados.
5. **Lanzamiento de Moneda**: Como último recurso.

### La Regla de Cascada (Efecto Waterfall)
Los criterios de desempate se aplican en orden secuencial. Una vez que un empate avanza a un nivel superior (del Criterio 1 al Criterio 2, o del 2 al 3), **la regla prohíbe volver atrás**.

**Principio de Integridad del Grupo Original:** Si el TQB separa parcialmente el grupo (ej. Equipo A queda 1ro, pero B y C siguen empatados), el ER-TQB para B y C se calcula usando los juegos de **todo el grupo original** (A vs B, A vs C, B vs C). **IMPORTANTE**: Según la regla, no se vuelve a mirar el enfrentamiento directo (Head-to-Head) entre B y C aunque ahora solo queden ellos dos; se debe seguir bajando en la lista de criterios de la Regla C11 (Waterfall Effect).

### Acerca de la Regla C11 de WBSC
Esta calculadora implementa los procedimientos oficiales de la **WBSC (Confederación Mundial de Béisbol y Softbol)**.

### Descargo de Responsabilidad
Aunque esta calculadora usa las fórmulas oficiales de WBSC, siempre verifique resultados con la documentación oficial del torneo. Visite [wbsc.org](https://www.wbsc.org) para reglas oficiales.

### Versión
Calculadora TQB v1.3
    `,
    },
];
