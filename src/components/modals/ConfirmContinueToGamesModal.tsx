'use client';

import React, { useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { ContinueToGamesImpact } from '@/lib/calculations';

interface ConfirmContinueToGamesModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    impact: ContinueToGamesImpact | null;
    isMultiGroup: boolean;
}

const ConfirmContinueToGamesModal: React.FC<ConfirmContinueToGamesModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    impact,
    isMultiGroup,
}) => {
    const { t } = useLanguage();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen || !impact) return null;

    // Build affected group label
    const changedGroupLabels = impact.changedGroups
        .map(gId => t.common.groupTab.replace('{gId}', gId))
        .join(', ');

    const description = t.teamEntry.confirmContinueToGames.description
        .replace('{groups}', isMultiGroup ? changedGroupLabels : t.common.groupTab.replace('{gId}', 'A'));

    const resultsWarning = impact.gamesWithResultsCount > 0
        ? t.teamEntry.confirmContinueToGames.warningResults
            .replace('{count}', impact.gamesWithResultsCount.toString())
        : null;

    const lockedWarning = impact.lockedCount > 0
        ? t.teamEntry.confirmContinueToGames.warningLocked
            .replace('{count}', impact.lockedCount.toString())
        : null;

    return (
        <div className="fixed inset-0 flex items-center justify-center z-[100] px-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
            <div className="bg-dark-800 border border-dark-600 p-6 sm:p-8 rounded-2xl max-w-md w-full relative z-10 animate-slide-up shadow-2xl shadow-black/50">
                <h3 className="text-xl font-bold text-white mb-4 text-center leading-tight">
                    {t.teamEntry.confirmContinueToGames.title}
                </h3>

                <p className="text-sm text-gray-300 mb-4 text-center leading-relaxed">
                    {description}
                </p>

                {(resultsWarning || lockedWarning) && (
                    <div className="mb-6 p-3 bg-warning-500/10 border border-warning-500/30 rounded-xl space-y-1">
                        {resultsWarning && (
                            <p className="text-xs text-warning-400 text-center font-medium">
                                {resultsWarning}
                            </p>
                        )}
                        {lockedWarning && (
                            <p className="text-xs text-error-400 text-center font-medium">
                                {lockedWarning}
                            </p>
                        )}
                    </div>
                )}

                <div className="flex flex-col gap-3">
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className="w-full py-3.5 bg-error-600 hover:bg-error-500 text-white font-bold rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-error-600/20"
                    >
                        {t.teamEntry.confirmContinueToGames.confirmButton}
                    </button>
                    <button
                        onClick={onClose}
                        className="w-full py-3.5 bg-dark-600 hover:bg-dark-500 text-white font-bold rounded-xl transition-all active:scale-[0.98]"
                    >
                        {t.teamEntry.confirmContinueToGames.cancelButton}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmContinueToGamesModal;
