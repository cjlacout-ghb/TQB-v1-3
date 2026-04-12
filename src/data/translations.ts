
export const translations = {
    en: {
        common: {
            title: "TQB Calculator",
            subtitle: "WBSC Rule C11 Tie-Breaker",
            userManual: "User Manual",
            ruleC11: "Rule C11",
            viewOfficialRule: "View Official Rule C11",
            back: "Go back",
            continue: "Continue",
            calculate: "Calculate",
            reset: "Reset form",
            required: "Required",
            footer: {
                version: "TQB Calculator v1.3",
                dev: "Cristian Lacout - WBSC International TC",
                rights: "2026 - all rights reserved"
            },
            exportPDF: "Export to PDF",
            startNew: "Start New Calculation",
            loading: "Loading...",
            final: "Final",
            step: "Step",
            of: "of",
            feedback: "💡 Leave me your feedback"
        },
        landing: {
            title: "Tournament Calculator / Softball",
            subtitle: "Automatic standings calculation. Includes tiebreaker resolution by TQB(*).",
            description: "(*)Team Quality Balance. Rule C11. WBSC Softball Tournament Regulations.",
            newTournament: "New Tournament",
            continueTournament: "Continue Tournament",
            startDescription: "Start a new calculation.",
            continueDescription: "Resume your calculation exactly where you left off.",
            confirmNew: "Are you sure? This will delete the current tournament data.",
            yesNew: "Yes, Start New",
            cancel: "Cancel"
        },
        feedback: {
            title: "Suggestions & Feedback",
            description: "Your feedback helps improve this tool for the softball community. Share your thoughts or report issues below.",
            labelMessage: "Your message",
            labelEmail: "Your email",
            labelFirstName: "First Name",
            labelLastName: "Last Name",
            labelCountry: "Country",
            placeholderMessage: "I would like to suggest...",
            placeholderEmail: "coach@example.com",
            placeholderFirstName: "John",
            placeholderLastName: "Doe",
            selectCountry: "Select a country",
            sendButton: "Send Feedback",
            cancel: "Cancel",
            sending: "Sending...",
            success: "Thank you! Your feedback has been sent successfully.",
            error: "Please enter a message",
            allFieldsRequired: "All fields are required",
            tryAgain: "Something went wrong. Please try again."
        },
        teamEntry: {
            title: "Enter Teams",
            description: "Add teams that are involved in the tiebreaker",
            inputPlaceholder: "Team {n} name",
            addTeam: "Add Team",
            removeTeam: "Remove team",
            orUpload: "or upload file",
            dropFile: "Drop your file here or click to browse",
            dropFileActive: "Drop file now!",
            preFill: "Pre-fill all team and game data",
            viewFormat: "View file format",
            requiredColumns: "Required Columns:",
            example: "Example:",
            fileError: "File Upload Error",
            continueButton: "Continue to Games",
            errors: {
                required: "Team name is required",
                duplicate: "Duplicate team name",
                fileType: "Please upload a CSV or TXT file",
                csv: {
                    empty: "CSV must contain a header row and at least one data row",
                    missingColumn: "Missing required column: {column}",
                    missingNames: "Row {row}: Missing team name(s)",
                    invalidRuns: "Row {row}: Invalid runs values",
                    invalidEarnedRuns: "Row {row}: Invalid earned runs values",
                    invalidInnings: "Row {row}: Invalid innings format (use X, X.1, or X.2)",
                    parseError: "Row {row}: Error parsing data - {error}",
                    minTeams: "CSV must contain at least 3 different teams",
                    maxTeams: "CSV contains more than 8 teams (maximum allowed)"
                }
            },
            tooltips: {
                ruleC11: "This calculator follows the official WBSC Rule C11 tie-breaking procedures, including Win-Loss, Head-to-Head, TQB, and ER-TQB criteria."
            }
        },
        gameEntry: {
            title: "Enter Game Results",
            description: "{games} games for {teams} teams (round-robin format)",
            inningsHelp: "Innings format help",
            howToEnter: "How to enter innings:",
            inningsExamples: [
                { val: "7", desc: "7 complete innings" },
                { val: "7.1", desc: "7 innings + 1 out (7⅓ innings)" },
                { val: "7.2", desc: "7 innings + 2 outs (7⅔ innings)" },
                { val: "6.2", desc: "6 innings + 2 outs (game ended early)" }
            ],
            softballNote: "Softball games can end mid-inning (mercy rule, rain, etc.), so innings may differ between teams.",
            tieBreakerMatchup: "Tie-Breaker Matchup",
            swapSides: "ATAQUE/DEFENSA",
            visitor: "Visitor",
            home: "Home Team",
            runsScored: "Runs Scored",
            inningsBatting: "Innings at Bat",
            inningsDefense: "Innings on Defense",
            calculateButton: "Calculate Rankings",
            errors: {
                summary: "Please fix the errors above",
                detail: "All fields are required. Innings must be valid and respect game outcome logic.",
                invalidFormat: "Invalid format",
                winningHome: "Winning home team must have fewer innings at bat than visitor",
                losingHome: "Losing home team must have exactly the same innings at bat as visitor"
            }
        },
        rankings: {
            tqbTitle: "TQB Rankings",
            tqbSubtitle: "",
            ertqbTitle: "ER-TQB Rankings",
            ertqbSubtitle: "",
            needsERTQB: "TQB did not resolve all ties. Proceed to ER-TQB.",
            tieBreakNote: "If further tie-breaking is needed: 2) TQB | 3) ER-TQB | 4) Highest Batting Average | 5) Coin Toss",
            rank: "Rank",
            team: "Team",
            wl: "W-L",
            tqb: "TQB",
            ertqb: "ER-TQB",
            game: "Game",
            formula: {
                title: "TQB Formula",
                erTitle: "ER-TQB Formula",
                text: "TQB = (Runs Scored ÷ Innings at Bat) - (Runs Allowed ÷ Innings on Defense)",
                erText: "ER-TQB = (Earned Runs Scored ÷ Innings at Bat) - (Earned Runs Allowed ÷ Innings on Defense)"
            },
            summary: {
                title: "{method} Calculation Summary ({count}-Way Tie)",
                description: "This summary provides a detailed breakdown of the {method} components. The tie is resolved by comparing the offensive efficiency (Ratio Scored) against the defensive efficiency (Ratio Allowed) based on each team's total innings played.",
                offensiveRatio: "Offensive Ratio",
                defensiveRatio: "Defensive Ratio",
                runsAllowed: "Runs Allowed",
                erAllowed: "E.Runs Allowed",
                finalValue: "Final {method}"
            },
            compare: {
                title: "Compare TQB vs ER-TQB values",
                diff: "Difference"
            },
            gameDetail: {
                erNote: "ER: Earned Runs (Used for ER-TQB Tie-Break)"
            },
            viewGameResults: "View game results summary",
            proceedToER: "Proceed to ER-TQB Entry",
        },
        earnedRuns: {
            title: "Enter Earned Runs",
            description: "Enter earned runs for games between tied teams",
            help: "Earned Runs Help",
            helpText: "Earned runs are runs for which the pitcher is held accountable.",
            calculateButton: "Calculate ER-TQB Rankings",
            inputLabel: "Earned Runs Scored",
            errors: {
                summary: "Please fix the errors above",
                detail: "All earned runs fields are required and cannot exceed total runs.",
                cannotExceed: "Cannot exceed total runs"
            }
        },
        pdfExport: {
            title: "Export to PDF",
            tournamentName: "Tournament Name",
            placeholder: "e.g., 2026 Regional Championship",
            includes: "PDF will include:",
            summaryItems: {
                standings: "Final standings table",
                teams: "teams ranked",
                games: "game results",
                tieBreaker: "Tie-breaking method used"
            },
            cancel: "Cancel",
            generate: "Generate PDF",
            generating: "Generating...",
            errors: {
                required: "Please enter a tournament name",
                failed: "Failed to generate PDF. Please try again."
            }
        },
        pdf: {
            report: "Standings Report",
            subtitle: "WBSC Softball Tournament Rankings - Rule C11",
            date: "Date",
            finalStandings: "Final Standings",
            runsScoredShort: "Runs S.",
            inningsBattingShort: "Inn. Bat",
            runsAllowedShort: "Runs A.",
            inningsDefenseShort: "Inn. Def.",
            ratioScoredShort: "Ratio S.",
            ratioAllowedShort: "Ratio A.",
            methodLabel: "Tie-Breaking Method:",
            tournamentPrefix: "Tournament",
            resultsSummary: "Game Results Summary",
            teamA: "Team A",
            teamB: "Team B",
            runs: "Runs",
            filename: "WBSC_Standings_Report"
        }
    },
    es: {
        common: {
            title: "Calculadora TQB",
            subtitle: "Desempate Regla WBSC C11",
            userManual: "Guía de Uso",
            ruleC11: "Regla C11",
            viewOfficialRule: "Ver Regla Oficial C11",
            back: "Volver",
            continue: "Continuar",
            calculate: "Calcular",
            reset: "Reiniciar formulario",
            required: "Requerido",
            footer: {
                version: "Calculadora TQB v1.3",
                dev: "Cristian Lacout - TC Internacional WBSC",
                rights: "2026 - todos los derechos reservados"
            },
            exportPDF: "Exportar a PDF",
            startNew: "Nuevo Cálculo",
            loading: "Cargando...",
            final: "Final",
            step: "Paso",
            of: "de",
            feedback: "💡 Dejame tu comentario"
        },
        landing: {
            title: "Calculadora de Torneo / Softbol",
            subtitle: "Cálculo automático de posiciones. Incluye resolución de empates por TQB(*)",
            description: "(*)Team Quality Balance . Regla C11 . Reglamento de torneos WBSC Softball",
            newTournament: "Nuevo Torneo",
            continueTournament: "Continuar Torneo",
            startDescription: "Comienza un nuevo cálculo",
            continueDescription: "Retoma tu cálculo exactamente donde lo dejaste",
            confirmNew: "¿Estás seguro? Esto borrará los datos del torneo actual.",
            yesNew: "Sí, Empezar Nuevo",
            cancel: "Cancelar"
        },
        feedback: {
            title: "Sugerencias y Comentarios",
            description: "Tus comentarios ayudan a mejorar esta herramienta para la comunidad del softbol. Comparte tus ideas o reporta problemas abajo.",
            labelMessage: "Tu mensaje",
            labelEmail: "Tu email",
            labelFirstName: "Nombre",
            labelLastName: "Apellido",
            labelCountry: "País",
            placeholderMessage: "Me gustaría sugerir...",
            placeholderEmail: "coach@ejemplo.com",
            placeholderFirstName: "Juan",
            placeholderLastName: "Pérez",
            selectCountry: "Selecciona un país",
            sendButton: "Enviar Comentarios",
            cancel: "Cancelar",
            sending: "Enviando...",
            success: "¡Gracias! Tus comentarios han sido enviados correctamente.",
            error: "Por favor ingresa un mensaje",
            allFieldsRequired: "Todos los campos son obligatorios",
            tryAgain: "Algo salió mal. Por favor intenta de nuevo."
        },
        teamEntry: {
            title: "Ingresar Equipos",
            description: "Agrega los equipos involucrados en el desempate",
            inputPlaceholder: "Nombre del Equipo {n}",
            addTeam: "Agregar Equipo",
            removeTeam: "Eliminar equipo",
            orUpload: "o subir archivo",
            dropFile: "Arrastra tu archivo aquí o haz clic",
            dropFileActive: "¡Suelta el archivo ahora!",
            preFill: "Pre-llenar datos de equipos y juegos",
            viewFormat: "Ver formato de archivo",
            requiredColumns: "Columnas Requeridas:",
            example: "Ejemplo:",
            fileError: "Error de Subida",
            continueButton: "Continuar a Juegos",
            errors: {
                required: "Nombre de equipo requerido",
                duplicate: "Nombre de equipo duplicado",
                fileType: "Por favor suba un archivo CSV o TXT",
                csv: {
                    empty: "El CSV debe contener una fila de encabezado y al menos una fila de datos",
                    missingColumn: "Falta columna requerida: {column}",
                    missingNames: "Fila {row}: Faltan nombres de equipo",
                    invalidRuns: "Fila {row}: Valores de carreras inválidos",
                    invalidEarnedRuns: "Fila {row}: Valores de carreras limpias inválidos",
                    invalidInnings: "Fila {row}: Formato de entradas inválido (use X, X.1 o X.2)",
                    parseError: "Fila {row}: Error procesando datos - {error}",
                    minTeams: "El CSV debe contener al menos 3 equipos diferentes",
                    maxTeams: "El CSV contiene más de 8 equipos (máximo permitido)"
                }
            },
            tooltips: {
                ruleC11: "Esta calculadora sigue los procedimientos oficiales de desempate de la Regla WBSC C11, incluyendo Ganados-Perdidos, Entre Sí, TQB y ER-TQB."
            }
        },
        gameEntry: {
            title: "Ingresar Resultados",
            description: "{games} juegos para {teams} equipos (formato todos contra todos)",
            inningsHelp: "Ayuda formato entradas",
            howToEnter: "Cómo ingresar entradas:",
            inningsExamples: [
                { val: "7", desc: "7 entradas completas" },
                { val: "7.1", desc: "7 entradas + 1 out (7⅓ entradas)" },
                { val: "7.2", desc: "7 entradas + 2 outs (7⅔ entradas)" }
            ],
            softballNote: "",
            tieBreakerMatchup: "Partido de Desempate",
            swapSides: "ATAQUE/DEFENSA",
            visitor: "Visitante",
            home: "Local",
            runsScored: "Carreras Anotadas",
            inningsBatting: "Entradas al Bate",
            inningsDefense: "Entradas a la Defensa",
            calculateButton: "Calcular Posiciones",
            errors: {
                summary: "Por favor corrija los errores",
                detail: "Todos los campos son requeridos. Las entradas deben ser válidas y respetar la lógica del juego.",
                invalidFormat: "Formato inválido",
                winningHome: "Local ganador debe tener menos entradas al bate que el visitante",
                losingHome: "Local perdedor debe tener exactamente las mismas entradas al bate que el visitante"
            }
        },
        rankings: {
            tqbTitle: "Posiciones TQB",
            tqbSubtitle: "",
            ertqbTitle: "Posiciones ER-TQB",
            ertqbSubtitle: "",
            needsERTQB: "TQB no resolvió todos los empates. Proceder a ER-TQB.",
            tieBreakNote: "Si persiste el empate: 2) TQB | 3) ER-TQB | 4) Mayor Promedio de Bateo | 5) Lanzamiento de Moneda",
            rank: "Pos",
            team: "Equipo",
            wl: "G-P",
            tqb: "TQB",
            ertqb: "ER-TQB",
            game: "Juego",
            formula: {
                title: "Fórmula TQB",
                erTitle: "Fórmula ER-TQB",
                text: "TQB = (Carreras Anotadas ÷ Entradas Bate) - (Carreras Permitidas ÷ Entradas Defensa)",
                erText: "ER-TQB = (Carreras Limpias Anotadas ÷ Entradas Bate) - (Carreras Limpias Permitidas ÷ Entradas Defensa)"
            },
            summary: {
                title: "Resumen de Cálculo {method} (Empate de {count})",
                description: "Este resumen detalla los componentes del cálculo {method}. Compara la eficiencia ofensiva (Ratio Anotado) contra la eficiencia defensiva (Ratio Permitido) basado en las entradas jugadas de cada equipo.",
                offensiveRatio: "Ratio Ofensivo",
                defensiveRatio: "Ratio Defensivo",
                runsAllowed: "Carreras Permitidas",
                erAllowed: "C. Limpias Permitidas",
                finalValue: "Final {method}"
            },
            compare: {
                title: "Comparar valores TQB vs ER-TQB",
                diff: "Diferencia"
            },
            gameDetail: {
                erNote: "ER: Carreras Limpias (Usado para desempate ER-TQB)"
            },
            viewGameResults: "Ver resumen de resultados",
            proceedToER: "Proceder a ER-TQB",
        },
        earnedRuns: {
            title: "Ingresar Carreras Limpias",
            description: "Ingrese carreras limpias para juegos entre equipos empatados",
            help: "Ayuda Carreras Limpias",
            helpText: "Las carreras limpias son aquellas de las que el lanzador es responsable.",
            calculateButton: "Calcular Posiciones ER-TQB",
            inputLabel: "Carreras Limpias",
            errors: {
                summary: "Por favor corrija los errores",
                detail: "Todos los campos calculados son requeridos y no pueden exceder carreras totales.",
                cannotExceed: "No puede exceder el total de carreras"
            }
        },
        pdfExport: {
            title: "Exportar a PDF",
            tournamentName: "Nombre del Torneo",
            placeholder: "ej. Campeonato Regional 2026",
            includes: "El PDF incluirá:",
            summaryItems: {
                standings: "Tabla de posiciones final",
                teams: "equipos clasificados",
                games: "resultados de juegos",
                tieBreaker: "Método de desempate utilizado"
            },
            cancel: "Cancelar",
            generate: "Generar PDF",
            generating: "Generando...",
            errors: {
                required: "Por favor ingrese un nombre de torneo",
                failed: "Error al generar el PDF. Intente nuevamente."
            }
        },
        pdf: {
            report: "Reporte de Posiciones",
            subtitle: "Posiciones de Torneo Softbol WBSC - Regla C11",
            date: "Fecha",
            finalStandings: "Posiciones Finales",
            runsScoredShort: "Carreras S.",
            inningsBattingShort: "Entr. Bate",
            runsAllowedShort: "Carreras A.",
            inningsDefenseShort: "Entr. Def.",
            ratioScoredShort: "Ratio S.",
            ratioAllowedShort: "Ratio A.",
            methodLabel: "Método de Desempate:",
            tournamentPrefix: "Torneo",
            resultsSummary: "Resumen de Resultados",
            teamA: "Equipo A",
            teamB: "Equipo B",
            runs: "Carreras",
            filename: "WBSC_Reporte_de_Posiciones"
        }
    },
};

export type Language = 'en' | 'es';
export type Translation = typeof translations.en;
