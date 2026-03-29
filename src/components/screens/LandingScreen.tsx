'use client';

import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface LandingScreenProps {
    onNewTournament: () => void;
    onContinueTournament: () => void;
    canContinue: boolean;
}

const LandingScreen: React.FC<LandingScreenProps> = ({ 
    onNewTournament, 
    onContinueTournament, 
    canContinue 
}) => {
    const { t } = useLanguage();
    return (
        <div className="max-w-4xl mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-[70vh] animate-fade-in text-center">
            {/* Minimalist Logo/Brand Area */}
            <div className="mb-12">
                <div className="w-20 h-20 bg-primary-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-none">
                    <span className="text-3xl font-bold">TQB</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4 text-white">
                    {t.landing.title}
                </h1>
                <p className="text-xl text-gray-400 font-medium">
                    {t.landing.subtitle}
                </p>
                <div className="mt-8 max-w-lg mx-auto">
                    <p className="text-gray-500 leading-relaxed">
                        {t.landing.description}
                    </p>
                </div>
            </div>

            {/* Actions Area */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl mt-8">
                {/* Continue Tournament Card (Only if data exists) */}
                {canContinue && (
                    <button
                        onClick={onContinueTournament}
                        className="group flex flex-col items-center p-10 bg-dark-800 border border-dark-600 rounded-2xl hover:border-success-500/50 hover:bg-dark-700 transition-all duration-300 text-center"
                    >
                        <div className="w-16 h-16 rounded-full bg-success-500/10 text-success-400 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-success-500/20 transition-all">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-3 tracking-tight">{t.landing.continueTournament}</h2>
                        <p className="text-gray-400 text-base max-w-[200px] mx-auto leading-relaxed">{t.landing.continueDescription}</p>
                    </button>
                )}

                {/* New Tournament Card */}
                <button
                    onClick={onNewTournament}
                    className={`group flex flex-col items-center p-10 bg-dark-800 border border-dark-600 rounded-2xl hover:border-primary-500/50 hover:bg-dark-700 transition-all duration-300 text-center ${!canContinue ? 'md:col-span-2 max-w-sm mx-auto' : ''}`}
                >
                    <div className="w-16 h-16 rounded-full bg-primary-500/10 text-primary-400 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary-500/20 transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-3 tracking-tight">{t.landing.newTournament}</h2>
                    <p className="text-gray-400 text-base max-w-[200px] mx-auto leading-relaxed">{t.landing.startDescription}</p>
                </button>
            </div>
        </div>
    );
};

export default LandingScreen;
