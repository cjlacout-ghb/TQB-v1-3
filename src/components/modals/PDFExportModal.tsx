'use client';

import { useState, useEffect } from 'react';
import { X, FileDown, AlertTriangle } from 'lucide-react';
import { PDFExportData } from '@/lib/types';
import { generatePDF } from '@/lib/pdfGenerator';
import { useLanguage } from '@/contexts/LanguageContext';
import { isTournamentProvisional, areAllGroupsValidForCalculation } from '@/lib/calculations';

import Tooltip from '@/components/ui/Tooltip';

interface PDFExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: Omit<PDFExportData, 'tournamentName' | 'date'>;
}

export default function PDFExportModal({ isOpen, onClose, data }: PDFExportModalProps) {
    const { t, language } = useLanguage();
    const [tournamentName, setTournamentName] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState('');

    // Derive provisional and stale status from games (pure, no stored state)
    const autoProvisional = isTournamentProvisional(data.games, data.isMultiGroup ?? false);
    const allGamesValid   = areAllGroupsValidForCalculation(data.games, data.isMultiGroup ?? false);
    const isStaleBlocked  = !allGamesValid;

    const [isProvisional, setIsProvisional] = useState(autoProvisional);

    // Reset fields on open; re-derive provisional flag from current data each time
    useEffect(() => {
        if (isOpen) {
            setTournamentName('');
            setError('');
            setIsProvisional(isTournamentProvisional(data.games, data.isMultiGroup ?? false));
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);


    // Handle ESC key to close
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    const handleGenerate = () => {
        if (!tournamentName.trim()) {
            setError(t.pdfExport.errors.required);
            return;
        }
        // Stale check — do not export if games are invalid/incomplete
        if (isStaleBlocked) {
            setError(t.gameEntry.pdfBlockedInstruction || t.pdfExport.staleBlocked);
            return;
        }

        setIsGenerating(true);
        setError('');

        try {
            // Generate PDF immediately to preserve user gesture context
            generatePDF({
                ...data,
                tournamentName: tournamentName.trim(),
                date: formatDate(new Date().toISOString(), language),
                language,
                isProvisional,
            });

            // Small delay before closing to ensure the browser processes the download link
            setTimeout(onClose, 200);
        } catch (err) {
            setError(t.pdfExport.errors.failed);
            console.error('PDF generation error:', err);
        } finally {
            setIsGenerating(false);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="modal-backdrop animate-fade-in"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Modal Container */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                {/* Modal Content */}
                <div
                    className="modal-content max-w-md animate-slide-up pointer-events-auto"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="export-title"
                >
                    <div className="card h-full max-h-full flex flex-col overflow-hidden">
                        {/* Header */}
                        <div className="card-header flex items-center justify-between flex-shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center">
                                    <FileDown size={20} className="text-primary-400" />
                                </div>
                                <h2 id="export-title" className="text-xl font-bold text-white">
                                    {t.pdfExport.title}
                                </h2>
                            </div>

                            <Tooltip text={t.tooltips.modalClose}>
                                <button
                                    onClick={onClose}
                                    className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                    aria-label="Close modal"
                                >
                                    <X size={20} />
                                </button>
                            </Tooltip>
                        </div>

                        {/* Content */}
                        <div className="card-body flex-1 overflow-y-auto space-y-5">
                            {/* Stale blocker warning */}
                            {isStaleBlocked && (
                                <div className="p-3 rounded-xl bg-error-500/10 border border-error-500/30 flex items-start gap-2.5">
                                    <AlertTriangle size={16} className="text-error-400 flex-shrink-0 mt-0.5" />
                                    <p className="text-xs text-error-300 leading-relaxed font-medium">
                                        {t.pdfExport.staleBlocked}
                                    </p>
                                </div>
                            )}

                            {/* Tournament Name */}
                            <div>
                                <label
                                    htmlFor="tournament-name"
                                    className="block text-sm font-medium text-gray-300 mb-2"
                                >
                                    {t.pdfExport.tournamentName} *
                                </label>
                                <input
                                    type="text"
                                    id="tournament-name"
                                    value={tournamentName}
                                    onChange={(e) => setTournamentName(e.target.value)}
                                    placeholder={t.pdfExport.placeholder}
                                    className={`input ${error && !tournamentName.trim() ? 'input-error' : ''}`}
                                    autoFocus
                                    disabled={isStaleBlocked}
                                />
                            </div>

                            {/* Provisional checkbox */}
                            <label className="flex items-start gap-3 cursor-pointer group select-none">
                                <input
                                    type="checkbox"
                                    checked={autoProvisional || isProvisional}
                                    onChange={(e) => setIsProvisional(e.target.checked)}
                                    disabled={isStaleBlocked || autoProvisional}
                                    className="mt-0.5 w-4 h-4 rounded border-dark-400 bg-dark-700 text-primary-500 focus:ring-primary-500 focus:ring-offset-dark-900 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                                />
                                <span className="text-sm text-gray-300 leading-relaxed group-hover:text-white transition-colors">
                                    {t.pdfExport.provisionalCheckbox}
                                </span>
                            </label>

                            {/* Error Message */}
                            {error && (
                                <p className="text-sm text-error-400 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-error-400" />
                                    {error}
                                </p>
                            )}

                            {/* Preview Info */}
                            <div className="p-4 bg-dark-700/50 rounded-xl border border-dark-500">
                                <h4 className="text-sm font-semibold text-gray-300 mb-2">
                                    {t.pdfExport.includes}
                                </h4>
                                <ul className="text-sm text-gray-400 space-y-1">
                                    <li>• {t.pdfExport.summaryItems.standings}</li>
                                    <li>• {data.rankings.length} {t.pdfExport.summaryItems.teams}</li>
                                    <li>• {data.games.length} {t.pdfExport.summaryItems.games}</li>
                                    <li>• {t.pdfExport.summaryItems.tieBreaker}</li>
                                </ul>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-2">
                                <Tooltip text={t.tooltips.modalCancel} className="flex-1">
                                    <button
                                        onClick={onClose}
                                        className="w-full btn btn-ghost"
                                    >
                                        {t.pdfExport.cancel}
                                    </button>
                                </Tooltip>
                                <Tooltip text={t.tooltips.pdfExportDownload} className="flex-1">
                                    <button
                                        onClick={handleGenerate}
                                        disabled={isGenerating}
                                        aria-disabled={isStaleBlocked}
                                        className={`w-full btn-primary ${isStaleBlocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        {isGenerating ? (
                                            <>
                                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                                    <circle
                                                        className="opacity-25"
                                                        cx="12"
                                                        cy="12"
                                                        r="10"
                                                        stroke="currentColor"
                                                        strokeWidth="4"
                                                        fill="none"
                                                    />
                                                    <path
                                                        className="opacity-75"
                                                        fill="currentColor"
                                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                    />
                                                </svg>
                                                {t.pdfExport.generating}
                                            </>
                                        ) : (
                                            <>
                                                <FileDown size={18} />
                                                {t.pdfExport.generate}
                                            </>
                                        )}
                                    </button>
                                </Tooltip>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

function formatDate(dateString: string, lang: string = 'en'): string {
    const date = new Date(dateString);
    return date.toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}
