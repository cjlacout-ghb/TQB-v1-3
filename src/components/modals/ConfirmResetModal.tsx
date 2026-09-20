'use client';

import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Tooltip } from '@/components/ui/Tooltip';

interface ConfirmResetModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

const ConfirmResetModal: React.FC<ConfirmResetModalProps> = ({ isOpen, onClose, onConfirm }) => {
    const { t } = useLanguage();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center z-[100] px-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
            <div className="bg-dark-800 border border-dark-600 p-8 rounded-2xl max-w-sm w-full relative z-10 animate-slide-up shadow-2xl shadow-black/50">
                <h3 className="text-xl font-bold text-white mb-6 text-center leading-tight">
                    {t.landing.confirmNew}
                </h3>
                <div className="flex flex-col gap-3">
                    <Tooltip text={t.tooltips.confirmResetSubmit} className="w-full">
                        <button 
                            onClick={() => {
                                onConfirm();
                                onClose();
                            }}
                            className="w-full py-4 bg-error-600 hover:bg-error-500 text-white font-bold rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-error-600/20"
                        >
                            {t.landing.yesNew}
                        </button>
                    </Tooltip>
                    <Tooltip text={t.tooltips.modalCancel} className="w-full">
                        <button 
                            onClick={onClose}
                            className="w-full py-4 bg-dark-600 hover:bg-dark-500 text-white font-bold rounded-xl transition-all active:scale-[0.98]"
                        >
                            {t.landing.cancel}
                        </button>
                    </Tooltip>
                </div>
            </div>
        </div>
    );
};

export default ConfirmResetModal;
