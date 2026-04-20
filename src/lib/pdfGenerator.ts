import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PDFExportData, TeamStats, GameData, TieBreakMethod } from './types';
import { formatTQBValue, outsToInnings, calculateDisplayRanks, getTieBreakMethodText } from './calculations';
import { translations } from '@/data/translations';

type TranslationSet = typeof translations['en'];
type RGB = [number, number, number];

// Shared palette — defined once, used by header and helper
const primaryColor: RGB = [139, 92, 246];
const darkBg: RGB     = [26,  26,  46 ];
const textLight: RGB  = [255, 255, 255];
const textMuted: RGB  = [156, 163, 175];

/**
 * Renders one group's content block (standings, formula, tie-break method,
 * calculation summary, game results) into the PDF document.
 *
 * Used for both single-group (called once, no groupLabel) and multi-group
 * (called once per group, with groupLabel — same template logic, different data).
 *
 * @returns the final yPos after all content is written (unused in multi-group
 *          because each subsequent group calls addPage internally).
 */
function renderGroupContent(
    doc: jsPDF,
    rankings: TeamStats[],
    games: GameData[],
    tieBreakMethod: TieBreakMethod,
    useERTQB: boolean,
    lang: string,
    t: TranslationSet,
    pageWidth: number,
    startY: number,
    groupLabel?: string,
): number {
    let yPos = startY;

    // ===== GROUP SECTION HEADER (multi-group mode only) =====
    if (groupLabel) {
        doc.addPage();
        yPos = 20;
        doc.setFillColor(...darkBg);
        doc.rect(0, yPos - 6, pageWidth, 16, 'F');
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...textLight);
        doc.text(groupLabel, pageWidth / 2, yPos + 4, { align: 'center' });
        yPos += 20;
    }

    // ===== FINAL STANDINGS TABLE =====
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(t.pdf.finalStandings, 14, yPos);
    yPos += 8;

    const displayRanksStandings = calculateDisplayRanks(rankings, useERTQB);
    const rankingsData = rankings.map((team, index) => [
        `#${displayRanksStandings[index]}`,
        team.name,
        `${team.wins}-${team.losses}`,
        formatTQBValue(useERTQB ? team.erTqb : team.tqb),
    ]);

    autoTable(doc, {
        startY: yPos,
        head: [[t.rankings.rank, t.rankings.team, t.rankings.wl, useERTQB ? 'ER-TQB' : 'TQB']],
        body: rankingsData,
        theme: 'grid',
        headStyles: {
            fillColor: primaryColor,
            textColor: textLight,
            fontStyle: 'bold',
            halign: 'center',
        },
        columnStyles: {
            0: { halign: 'center', cellWidth: 15 },
            1: { halign: 'left' },
            2: { halign: 'center', cellWidth: 20 },
            3: { halign: 'center', cellWidth: 25, font: 'courier' },
        },
        alternateRowStyles: { fillColor: [245, 245, 250] },
        margin: { left: 14, right: 14, bottom: 25 },
    });

    yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

    // ===== FORMULA REFERENCE =====
    if (tieBreakMethod === 'TQB' || tieBreakMethod === 'ER_TQB' || tieBreakMethod === 'UNRESOLVED' || useERTQB) {
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(100, 100, 100);

        const isER = tieBreakMethod === 'ER_TQB' || tieBreakMethod === 'UNRESOLVED' || useERTQB;
        const formulaTitle = isER ? t.rankings.formula.erTitle : t.rankings.formula.title;
        const formulaText  = isER ? t.rankings.formula.erText  : t.rankings.formula.text;

        const splitFormula = doc.splitTextToSize(`${formulaTitle}: ${formulaText}`, pageWidth - 28);
        doc.text(splitFormula, 14, yPos);
        yPos += (splitFormula.length * 4) + 8;
    } else {
        yPos += 10;
    }

    // ===== TIE-BREAKING METHOD =====
    if (yPos > 240) { doc.addPage(); yPos = 20; }

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text(t.pdf.methodLabel, 14, yPos);
    yPos += 6;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    const methodLines = doc.splitTextToSize(getTieBreakMethodText(tieBreakMethod, lang), pageWidth - 28);
    doc.text(methodLines, 14, yPos);
    yPos += methodLines.length * 5 + 10;

    // ===== TQB CALCULATION SUMMARY =====
    if (yPos > 230) { doc.addPage(); yPos = 20; }

    const method = useERTQB ? 'ER-TQB' : 'TQB';

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(t.rankings.summary.title.replace('{method}', method), 14, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    const introLines = doc.splitTextToSize(
        t.rankings.summary.description.replace('{method}', method),
        pageWidth - 28,
    );
    doc.text(introLines, 14, yPos);
    yPos += introLines.length * 5 + 5;

    const displayRanksSummary = calculateDisplayRanks(rankings, useERTQB);
    const summaryTableData = rankings.map((team, index) => {
        const runsS  = useERTQB ? team.earnedRunsScored  : team.runsScored;
        const runsA  = useERTQB ? team.earnedRunsAllowed : team.runsAllowed;
        const innBat = team.inningsAtBatOuts    / 3;
        const innDef = team.inningsOnDefenseOuts / 3;
        const ratioS = innBat > 0 ? runsS / innBat : 0;
        const ratioA = innDef > 0 ? runsA / innDef : 0;
        return [
            `#${displayRanksSummary[index]}`,
            team.name,
            `${runsS}`,
            `${outsToInnings(team.inningsAtBatOuts).toFixed(1)}`,
            `${runsA}`,
            `${outsToInnings(team.inningsOnDefenseOuts).toFixed(1)}`,
            ratioS.toFixed(4),
            ratioA.toFixed(4),
            formatTQBValue(useERTQB ? team.erTqb : team.tqb),
        ];
    });

    autoTable(doc, {
        startY: yPos,
        head: [[
            t.rankings.rank,
            t.rankings.team,
            t.pdf.runsScoredShort,
            t.pdf.inningsBattingShort,
            t.pdf.runsAllowedShort,
            t.pdf.inningsDefenseShort,
            t.pdf.ratioScoredShort,
            t.pdf.ratioAllowedShort,
            `${method}\n${t.common.final}`,
        ]],
        body: summaryTableData,
        theme: 'grid',
        headStyles: {
            fillColor: [60, 60, 80],
            textColor: textLight,
            fontStyle: 'bold',
            halign: 'center',
            fontSize: 7,
            lineColor: [80, 80, 100],
            lineWidth: 0.1,
        },
        columnStyles: {
            0: { halign: 'center', cellWidth: 10 },
            1: { halign: 'left',   minCellWidth: 32 },
            2: { halign: 'center', cellWidth: 17 },
            3: { halign: 'center', cellWidth: 17 },
            4: { halign: 'center', cellWidth: 17 },
            5: { halign: 'center', cellWidth: 17 },
            6: { halign: 'center', font: 'courier', cellWidth: 22 },
            7: { halign: 'center', font: 'courier', cellWidth: 22 },
            8: { halign: 'right',  font: 'courier', fontStyle: 'bold', cellWidth: 20 },
        },
        styles: { fontSize: 8, cellPadding: 1.5 },
        alternateRowStyles: { fillColor: [245, 245, 250] },
        margin: { left: 14, right: 14, bottom: 25 },
    });

    yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;

    // ===== GAME RESULTS SUMMARY =====
    if (yPos > 220) { doc.addPage(); yPos = 20; }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(t.pdf.resultsSummary, 14, yPos);
    yPos += 8;

    autoTable(doc, {
        startY: yPos,
        head: [[t.pdf.teamA, t.pdf.runs, '', t.pdf.runs, t.pdf.teamB]],
        body: games.map(game => [
            game.teamAName,
            `${game.runsA ?? 0}`,
            'vs',
            `${game.runsB ?? 0}`,
            game.teamBName,
        ]),
        theme: 'grid',
        headStyles: {
            fillColor: [100, 100, 120],
            textColor: textLight,
            fontStyle: 'bold',
            halign: 'center',
        },
        columnStyles: {
            0: { halign: 'left' },
            1: { halign: 'center', cellWidth: 20 },
            2: { halign: 'center', cellWidth: 15 },
            3: { halign: 'center', cellWidth: 20 },
            4: { halign: 'right' },
        },
        alternateRowStyles: { fillColor: [245, 245, 250] },
        showHead: 'firstPage',
        margin: { left: 14, right: 14, bottom: 25 },
    });

    return (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
}

/**
 * Generate PDF report for tournament rankings.
 * In multi-group mode each group renders as a separate labeled section.
 */
export function generatePDF(data: PDFExportData): void {
    const lang = data.language || 'en';
    const t    = translations[lang];

    const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
        putOnlyUsedFonts: true,
    });
    const pageWidth = doc.internal.pageSize.getWidth();

    // ===== HEADER =====
    doc.setFillColor(...darkBg);
    doc.rect(0, 0, pageWidth, 50, 'F');

    doc.setTextColor(...textLight);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text(t.pdf.report, pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...primaryColor);
    const subtitle = data.tournamentName
        ? `${t.pdf.tournamentPrefix}: ${data.tournamentName}`
        : t.pdf.subtitle;
    doc.text(doc.splitTextToSize(subtitle, pageWidth - 40), pageWidth / 2, 30, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(...textMuted);
    doc.text(`${t.pdf.date}: ${data.date}`, pageWidth / 2, 40, { align: 'center' });

    // ===== CONTENT =====
    if (data.isMultiGroup) {
        // Each group starts on a new page via renderGroupContent (groupLabel triggers addPage)
        const gAR = data.rankings.filter(r => r.groupId === 'A');
        const gBR = data.rankings.filter(r => r.groupId === 'B');
        const gAG = data.games.filter(g => g.groupId === 'A');
        const gBG = data.games.filter(g => g.groupId === 'B');
        const tieA = data.groupTieBreakMethod?.['A'] ?? data.tieBreakMethod;
        const tieB = data.groupTieBreakMethod?.['B'] ?? data.tieBreakMethod;

        renderGroupContent(doc, gAR, gAG, tieA, data.useERTQB, lang, t, pageWidth, 60, t.common.groupTab.replace('{gId}', 'A'));
        renderGroupContent(doc, gBR, gBG, tieB, data.useERTQB, lang, t, pageWidth, 0,  t.common.groupTab.replace('{gId}', 'B'));
    } else {
        renderGroupContent(doc, data.rankings, data.games, data.tieBreakMethod, data.useERTQB, lang, t, pageWidth, 60);
    }

    // ===== FOOTER & PAGE NUMBERS =====
    const totalPages = doc.getNumberOfPages();
    const footerY    = 278;

    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...textMuted);
        doc.text(t.common.footer.version, pageWidth / 2, footerY,     { align: 'center' });
        doc.text(t.common.footer.dev,     pageWidth / 2, footerY + 4, { align: 'center' });
        doc.text(t.common.footer.rights,  pageWidth / 2, footerY + 8, { align: 'center' });
        doc.text(`${i}`, pageWidth - 14,  footerY + 8, { align: 'right' });
    }

    // ===== SAVE PDF =====
    const sanitizedName = data.tournamentName
        .trim()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/gi, '_')
        .replace(/_+/g, '_')
        .replace(/^_+|_+$/g, '');

    const finalFilename = sanitizedName
        ? `${t.pdf.filename}_${sanitizedName}.pdf`
        : `${t.pdf.filename}.pdf`;

    try {
        const blob = doc.output('blob');
        const url  = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href     = url;
        link.download = finalFilename;
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }, 100);
    } catch (e) {
        console.error('Manual download failed, falling back to doc.save', e);
        doc.save(finalFilename);
    }
}
