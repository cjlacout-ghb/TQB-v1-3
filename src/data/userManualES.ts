// Spanish User Manual Content
import { UserManualSection } from '../lib/types';

export const userManualES: UserManualSection[] = [
    {
        id: 'introduction',
        title: 'Introducción',
        content: `
La **Calculadora TQB** es una herramienta diseñada para calcular las clasificaciones de torneos de softbol utilizando los criterios de desempate de la **Regla C11 del Reglamento de Torneos de la WBSC** (Confederación Mundial de Béisbol y Softbol).

Esta aplicación ayuda a oficiales de torneos y entrenadores a determinar con precisión las clasificaciones de equipos cuando múltiples equipos tienen el mismo récord de victorias-derrotas.

### Propósito
- Calcular y mostrar clasificaciones de torneos
- Aplicar automáticamente las reglas oficiales de desempate de la WBSC
- Generar informes profesionales en PDF
- Soportar formatos de torneo round-robin (hasta 8 equipos)
    `,
    },
    {
        id: 'getting-started',
        title: 'Primeros Pasos',
        content: `
### Paso 1: Ingresar Nombres de Equipos

1. En la primera pantalla, ingrese los nombres de todos los equipos en su torneo
2. Haga clic en **"Agregar Equipo"** para añadir más equipos (máximo 8 equipos)
3. Haga clic en el **icono de papelera** junto a un equipo para eliminarlo (mínimo 3 equipos requeridos)
4. Los nombres de equipos no pueden contener caracteres especiales
5. Una vez que proceda a la siguiente pantalla, los nombres de equipos no pueden ser editados

### Consejos
- Use nombres oficiales de equipos para un registro preciso
- Verifique la ortografía antes de continuar
- También puede cargar un archivo (CSV o TXT) con todos los datos prellenados
    `,
    },
    {
        id: 'csv-upload',
        title: 'Guía de Carga de Archivos',
        content: `
### Formato de Archivo (CSV/TXT)

Cargue un archivo CSV o TXT para llenar automáticamente todos los datos de equipos y partidos. El archivo debe tener las siguientes columnas:

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

### Contenido de Ejemplo del Archivo

\`\`\`
Team_A,Team_B,Runs_A,Runs_B,Earned_Runs_A,Earned_Runs_B,Innings_A_Batting,Innings_A_Defense,Innings_B_Batting,Innings_B_Defense
Tigres,Aguilas,5,3,4,2,7,6.2,6.2,7
Aguilas,Tiburones,2,8,1,6,7,7,7,7
\`\`\`

### Cómo Cargar
1. **Cargar Archivo**: (Paso 1) Arrastre y suelte su archivo CSV o TXT en el área de carga.
2. **Verificar Datos**: (Paso 2) La aplicación se mueve automáticamente al Paso 2. Todos los datos de los partidos importados se pre-llenan.
3. **Editar (Opcional)**: Si es necesario, puede corregir cualquier valor (carreras, entradas) directamente en esta pantalla.
4. **Calcular**: Haga clic en **"Calcular Clasificaciones"** en la parte inferior de la pantalla para ver los resultados.
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
*Nota: Esto requiere ejecución manual*
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
3. Haga clic en **"Generar PDF"**

**El PDF incluye:**
- Nombre del torneo y fecha
- Referencia a la Regla C11 de WBSC
- Tabla de clasificaciones finales con todas las estadísticas
- Método de desempate utilizado
- Resumen de resultados de partidos
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
        title: 'Regla Oficial C11: Desempates',
        content: `
### Reglamento de Torneos WBSC - Regla C11

Todos los empates después de la Ronda de Apertura, Super Ronda y Finales se resolverán en el siguiente orden:

---

**1. Resultados Directos (Head-to-Head)**
El equipo que ganó el partido(s) jugado entre los equipos empatados recibirá la posición más alta.

**2. Balance de Calidad del Equipo (TQB)**
Si hay un empate entre tres o más equipos y los resultados directos no resuelven el empate, se utilizará el balance de calidad del equipo (TQB) para determinar la clasificación.
- **Fórmula**: (Carreras Anotadas / Entradas Jugadas al Bate) – (Carreras Permitidas / Entradas Jugadas en Defensa).
- El TQB incorpora tanto el rendimiento ofensivo como el defensivo.

**3. TQB de Carreras Limpias (ER-TQB)**
Si el empate persiste, se utilizará el ER-TQB para determinar la clasificación.
- **Fórmula**: (Carreras Limpias Anotadas / Entradas Jugadas al Bate) – (Carreras Limpias Permitidas / Entradas Jugadas en Defensa).

**4. Promedio de Bateo Más Alto**
El equipo con el promedio de bateo más alto en los partidos jugados entre los equipos empatados recibirá la posición más alta.

**5. Lanzamiento de Moneda**
Un lanzamiento de moneda determinará la clasificación como último recurso.

---

### IMPORTANTE: La Regla de Cascada
Según las regulaciones de la WBSC Softball:
> *"Los criterios de desempate se aplican en orden secuencial. Una vez que un empate pasa a un paso posterior (como el TQB), el cálculo se basa ÚNICAMENTE en los juegos jugados entre los equipos involucrados en ese empate específico."*

**Ejemplo**: Si los Equipos A, B y C están empatados y los resultados Directos son circulares, la aplicación pasa al TQB. Si el TQB separa al Equipo A como el #1, pero B y C permanecen iguales, la aplicación pasa al Paso 3 (ER-TQB) para B y C, usando solo el juego entre ellos. La lógica avanza y nunca regresa al enfrentamiento Directo.
    `,
    },
    {
        id: 'about',
        title: 'Acerca de la Regla C11 de WBSC',
        content: `
### Referencia Oficial

Esta calculadora implementa los procedimientos de desempate del **Reglamento de Torneos de WBSC, Regla C11**.

La Confederación Mundial de Béisbol y Softbol (WBSC) es el organismo rector mundial para béisbol y softbol. Sus reglamentos de torneos proporcionan procedimientos estandarizados para determinar clasificaciones cuando los equipos tienen récords de victorias-derrotas iguales.

### Descargo de Responsabilidad

Aunque esta calculadora implementa la fórmula oficial de desempate de WBSC, siempre verifique los resultados con la documentación oficial del torneo. Para las reglas oficiales de WBSC, visite: [wbsc.org](https://www.wbsc.org)

### Versión

Calculadora TQB v1.1.0
    `,
    },
];
