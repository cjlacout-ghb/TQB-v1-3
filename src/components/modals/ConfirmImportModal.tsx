'use client';

import React, { useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Tooltip } from '@/components/ui/Tooltip';
import { GroupID } from '@/lib/types';

interface ConfirmImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    teamCount: number;
    hasGameResults: boolean;
    isMultiGroup: boolean;
    activeGroupId: GroupID;
}

const ConfirmImportModal: React.FC<ConfirmImportModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    teamCount,
    hasGameResults,
    isMultiGroup,
    activeGroupId,
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

    if (!isOpen) return null;

    const groupText = t.common.groupTab.replace('{gId}', activeGroupId);
    const otherGroupId: GroupID = activeGroupId === 'A' ? 'B' : 'A';
    const otherGroupText = t.common.groupTab.replace('{gId}', otherGroupId);

    const description = isMultiGroup
        ? t.teamEntry.confirmImport.descriptionGroup
            .replace('{count}', teamCount.toString())
            .replace('{group}', groupText)
            .replace('{otherGroup}', otherGroupText)
        : t.teamEntry.confirmImport.descriptionSingle.replace('{count}', teamCount.toString());

    return (
        <div className="fixed inset-0 flex items-center justify-center z-[100] px-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
            <div className="bg-dark-800 border border-dark-600 p-6 sm:p-8 rounded-2xl max-w-md w-full relative z-10 animate-slide-up shadow-2xl shadow-black/50">
                <h3 className="text-xl font-bold text-white mb-4 text-center leading-tight">
                    {t.teamEntry.confirmImport.title}
                </h3>
                
                <p className="text-sm text-gray-300 mb-4 text-center leading-relaxed">
                    {description}
                </p>

                {hasGameResults && (
                    <div className="mb-6 p-3 bg-warning-500/10 border border-warning-500/30 rounded-xl">
                        <p className="text-xs text-warning-400 text-center font-medium">
                            {t.teamEntry.confirmImport.gameWarning.replace('{group}', isMultiGroup ? groupText : '')}
                        </p>
                    </div>
                )}

                <div className="flex flex-col gap-3">
                    <Tooltip text={t.tooltips.confirmImportSubmit} className="w-full">
                        <button 
                            onClick={() => {
                                onConfirm();
                                onClose();
                            }}
                            className="w-full py-3.5 bg-error-600 hover:bg-error-500 text-white font-bold rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-error-600/20"
                        >
                            {t.teamEntry.confirmImport.confirmButton}
                        </button>
                    </Tooltip>
                    <Tooltip text={t.tooltips.modalCancel} className="w-full">
                        <button 
                            onClick={onClose}
                            className="w-full py-3.5 bg-dark-600 hover:bg-dark-500 text-white font-bold rounded-xl transition-all active:scale-[0.98]"
                        >
                            {t.teamEntry.confirmImport.cancelButton}
                        </button>
                    </Tooltip>
                </div>
            </div>
        </div>
    );
};

export default ConfirmImportModal;
