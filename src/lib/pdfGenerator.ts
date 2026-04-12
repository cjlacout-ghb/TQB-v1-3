import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PDFExportData } from './types';
import { formatTQBValue, outsToInnings, calculateDisplayRanks, getTieBreakMethodText } from './calculations';
import { translations } from '@/data/translations';

/**
 * Generate PDF report for tournament rankings
 */
export function generatePDF(data: PDFExportData): void {
    const lang = data.language || 'en';
    const t = translations[lang];

    const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
        putOnlyUsedFonts: true
    });
    const pageWidth = doc.internal.pageSize.getWidth();

    // Colors
    const primaryColor: [number, number, number] = [139, 92, 246]; // Purple
    const darkBg: [number, number, number] = [26, 26, 46];
    const textLight: [number, number, number] = [255, 255, 255];
    const textMuted: [number, number, number] = [156, 163, 175];

    // ===== HEADER =====
    doc.setFillColor(...darkBg);
    doc.rect(0, 0, pageWidth, 50, 'F');

    // Tournament name
    doc.setTextColor(...textLight);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');

    const titleText = t.pdf.report;
    doc.text(titleText, pageWidth / 2, 20, { align: 'center' });

    // Subtitle
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...primaryColor);
    const subtitle = data.tournamentName
        ? `${t.pdf.tournamentPrefix}: ${data.tournamentName}`
        : t.pdf.subtitle;
    const subtitleLines = doc.splitTextToSize(subtitle, pageWidth - 40);
    doc.text(subtitleLines, pageWidth / 2, 30, { align: 'center' });

    // Date
    doc.setFontSize(10);
    doc.setTextColor(...textMuted);
    const dateLabel = t.pdf.date;
    doc.text(`${dateLabel}: ${data.date}`, pageWidth / 2, 40, { align: 'center' });

    let yPos = 60;

    // ===== FINAL STANDINGS TABLE =====
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    const standingsTitle = t.pdf.finalStandings;
    doc.text(standingsTitle, 14, yPos);
    yPos += 8;

    const displayRanksStandings = calculateDisplayRanks(data.rankings, data.useERTQB);
    const rankingsData = data.rankings.map((team, index) => [
        `#${displayRanksStandings[index]}`,
        team.name,
        `${team.wins}-${team.losses}`,
        formatTQBValue(data.useERTQB ? team.erTqb : team.tqb),
    ]);

    autoTable(doc, {
        startY: yPos,
        head: [[t.rankings.rank, t.rankings.team, t.rankings.wl, data.useERTQB ? 'ER-TQB' : 'TQB']],
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
        alternateRowStyles: {
            fillColor: [245, 245, 250],
        },
        margin: { left: 14, right: 14, bottom: 25 },
    });

    // Get Y position after table
    yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

    // ===== FORMULA REFERENCE =====
    // Add formula if TQB or ER-TQB was used to resolve ties
    if (data.tieBreakMethod === 'TQB' || data.tieBreakMethod === 'ER_TQB' || data.tieBreakMethod === 'UNRESOLVED' || data.useERTQB) {
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(100, 100, 100);
        
        const isER = data.tieBreakMethod === 'ER_TQB' || data.tieBreakMethod === 'UNRESOLVED' || data.useERTQB;
        const formulaTitle = isER ? t.rankings.formula.erTitle : t.rankings.formula.title;
        const formulaText = isER ? t.rankings.formula.erText : t.rankings.formula.text;
        
        const formulaLine = `${formulaTitle}: ${formulaText}`;
        const splitFormula = doc.splitTextToSize(formulaLine, pageWidth - 28);
        doc.text(splitFormula, 14, yPos);
        yPos += (splitFormula.length * 4) + 8;
    } else {
        yPos += 10;
    }

    // ===== TIE-BREAKING METHOD =====
    if (yPos > 240) {
        doc.addPage();
        yPos = 20;
    }

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    const methodLabel = t.pdf.methodLabel;
    doc.text(methodLabel, 14, yPos);
    yPos += 6;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    const methodText = getTieBreakMethodText(data.tieBreakMethod, lang);
    const methodLines = doc.splitTextToSize(methodText, pageWidth - 28);
    doc.text(methodLines, 14, yPos);
    yPos += methodLines.length * 5 + 10;

    // ===== TQB CALCULATION SUMMARY =====
    if (yPos > 230) {
        doc.addPage();
        yPos = 20;
    }

    const method = data.useERTQB ? 'ER-TQB' : 'TQB';
    const summaryTitle = t.rankings.summary.title
        .replace('{method}', method);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(summaryTitle, 14, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);

    doc.setFont('helvetica', 'normal');
    const summaryIntro = t.rankings.summary.description.replace('{method}', method);
    const introLines = doc.splitTextToSize(summaryIntro, pageWidth - 28);
    doc.text(introLines, 14, yPos);
    yPos += introLines.length * 5 + 5;

    const displayRanksSummary = calculateDisplayRanks(data.rankings, data.useERTQB);
    const summaryTableData = data.rankings.map((team, index) => {
        const runsS = data.useERTQB ? team.earnedRunsScored : team.runsScored;
        const runsA = data.useERTQB ? team.earnedRunsAllowed : team.runsAllowed;
        const innBat = team.inningsAtBatOuts / 3;
        const innDef = team.inningsOnDefenseOuts / 3;
        const ratioS = innBat > 0 ? runsS / innBat : 0;
        const ratioA = innDef > 0 ? runsA / innDef : 0;
        const finalVal = data.useERTQB ? team.erTqb : team.tqb;

        return [
            `#${displayRanksSummary[index]}`,
            team.name,
            `${runsS}`,
            `${outsToInnings(team.inningsAtBatOuts).toFixed(1)}`,
            `${runsA}`,
            `${outsToInnings(team.inningsOnDefenseOuts).toFixed(1)}`,
            ratioS.toFixed(4),
            ratioA.toFixed(4),
            formatTQBValue(finalVal)
        ];
    });

    const headersSummary = [
        t.rankings.rank,
        t.rankings.team,
        t.pdf.runsScoredShort,
        t.pdf.inningsBattingShort,
        t.pdf.runsAllowedShort,
        t.pdf.inningsDefenseShort,
        t.pdf.ratioScoredShort,
        t.pdf.ratioAllowedShort,
        `${method}\n${t.common.final}`
    ];

    autoTable(doc, {
        startY: yPos,
        head: [headersSummary],
        body: summaryTableData,
        theme: 'grid',
        headStyles: {
            fillColor: [60, 60, 80],
            textColor: textLight,
            fontStyle: 'bold',
            halign: 'center',
            fontSize: 7, // Reduced slightly to ensure it fits 2 lines comfortably
            lineColor: [80, 80, 100],
            lineWidth: 0.1,
        },
        columnStyles: {
            0: { halign: 'center', cellWidth: 10 }, // Rank
            1: { halign: 'left', minCellWidth: 32 }, // Team
            2: { halign: 'center', cellWidth: 17 }, // Runs Scored
            3: { halign: 'center', cellWidth: 17 }, // Innings Batting
            4: { halign: 'center', cellWidth: 17 }, // Runs Allowed
            5: { halign: 'center', cellWidth: 17 }, // Innings Defense
            6: { halign: 'center', font: 'courier', cellWidth: 22 }, // Ratio Scored
            7: { halign: 'center', font: 'courier', cellWidth: 22 }, // Ratio Allowed
            8: { halign: 'right', font: 'courier', fontStyle: 'bold', cellWidth: 20 }, // Final TQB
        },
        styles: { 
            fontSize: 8,
            cellPadding: 1.5,
        },
        alternateRowStyles: {
            fillColor: [245, 245, 250],
        },
        margin: { left: 14, right: 14, bottom: 25 },
    });

    // Update yPos after the table
    yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;

    // ===== GAME RESULTS SUMMARY =====
    // Ensure the entire section starts on a new page if space is limited (less than 60mm)
    if (yPos > 220) {
        doc.addPage();
        yPos = 20;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    const gameResultsTitle = t.pdf.resultsSummary;
    doc.text(gameResultsTitle, 14, yPos);
    yPos += 8;

    const gamesData = data.games.map(game => [
        game.teamAName,
        `${game.runsA ?? 0}`,
        'vs',
        `${game.runsB ?? 0}`,
        game.teamBName,
    ]);

    const teamHeaderA = t.pdf.teamA;
    const teamHeaderB = t.pdf.teamB;
    const runsHeader = t.pdf.runs;

    autoTable(doc, {
        startY: yPos,
        head: [[teamHeaderA, runsHeader, '', runsHeader, teamHeaderB]],
        body: gamesData,
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
        alternateRowStyles: {
            fillColor: [245, 245, 250],
        },
        showHead: 'firstPage',
        margin: { left: 14, right: 14, bottom: 25 },
    });

    yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;

    // ===== FOOTER & PAGE NUMBERS =====
    const totalPages = doc.getNumberOfPages();
    const footerY = 278;

    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);

        // Footer text (centered)
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...textMuted);
        const versionText = t.common.footer.version;
        doc.text(versionText, pageWidth / 2, footerY, { align: 'center' });
        doc.text(t.common.footer.dev, pageWidth / 2, footerY + 4, { align: 'center' });
        doc.text(t.common.footer.rights, pageWidth / 2, footerY + 8, { align: 'center' });

        // Page number (bottom right)
        doc.setFont('helvetica', 'normal');
        doc.text(`${i}`, pageWidth - 14, footerY + 8, { align: 'right' });
    }

    // Save PDF
    const sanitizedName = data.tournamentName
        .trim()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove accents
        .replace(/[^a-z0-9]/gi, '_') // Replace non-alphanumeric with underscore
        .replace(/_+/g, '_') // collapse multiples
        .replace(/^_+|_+$/g, ''); // trim

    const finalFilename = sanitizedName
        ? `${t.pdf.filename}_${sanitizedName}.pdf`
        : `${t.pdf.filename}.pdf`;

    // TRIGGER DOWNLOAD - Robust manual approach
    try {
        const blob = doc.output('blob');
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = finalFilename;
        document.body.appendChild(link);
        link.click();

        // Cleanup after a delay to ensure the browser has started the download
        setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }, 100);
    } catch (e) {
        console.error('Manual download failed, falling back to doc.save', e);
        doc.save(finalFilename);
    }
}
