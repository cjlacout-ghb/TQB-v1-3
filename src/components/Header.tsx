'use client';

import Image from 'next/image';
import { Book } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Tooltip } from '@/components/ui/Tooltip';

interface HeaderProps {
    onOpenManual: () => void;
    onGoHome: () => void;
}

export default function Header({ onOpenManual, onGoHome }: HeaderProps) {
    const { t, language, setLanguage } = useLanguage();

    const toggleLanguage = () => {
        setLanguage(language === 'en' ? 'es' : 'en');
    };

    return (
        <header className="sticky top-0 z-30 bg-dark-900/80 backdrop-blur-md border-b border-dark-500">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo & Title - Clickable */}
                    <Tooltip text={t.tooltips.headerHomeReset} className="min-w-0 flex-1">
                        <button 
                            onClick={onGoHome}
                            className="flex items-center gap-3 hover:opacity-80 transition-all duration-200 group text-left min-w-0"
                            aria-label={t.tooltips.headerHomeReset}
                        >
                            <Image
                                src="/images/logo.png"
                                alt="TQB Calculator Logo"
                                width={40}
                                height={40}
                                priority
                                className="rounded-xl object-contain shadow-lg shadow-primary-500/20 group-hover:scale-105 transition-transform duration-200 flex-shrink-0"
                            />
                            <div className="min-w-0">
                                <h1 className="text-base sm:text-lg font-bold text-white tracking-tight group-hover:text-primary-400 transition-colors duration-200 break-words min-w-0">
                                    {t.common.title}
                                </h1>
                            </div>
                        </button>
                    </Tooltip>

                    {/* Navigation */}
                    <nav className="flex items-center gap-2 sm:gap-4">
                        {/* Language Toggle */}
                        <Tooltip text={language === 'es' ? t.tooltips.headerLangEn : t.tooltips.headerLangEs}>
                            <button
                                onClick={toggleLanguage}
                                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200"
                                aria-label={language === 'es' ? t.tooltips.headerLangEn : t.tooltips.headerLangEs}
                            >
                                <span className="font-mono">
                                    <span className={language === 'es' ? 'text-primary-400 font-bold' : 'text-gray-500'}>ESP</span>
                                    <span className="mx-1 text-gray-600">|</span>
                                    <span className={language === 'en' ? 'text-primary-400 font-bold' : 'text-gray-500'}>ENG</span>
                                </span>
                            </button>
                        </Tooltip>

                        <div className="w-px h-6 bg-dark-600 hidden sm:block"></div>

                        <Tooltip text={t.tooltips.headerUserManual}>
                            <button
                                onClick={onOpenManual}
                                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200"
                                aria-label={t.tooltips.headerUserManual}
                            >
                                <Book size={18} />
                                <span className="hidden sm:inline">{t.common.userManual}</span>
                            </button>
                        </Tooltip>
                    </nav>
                </div>
            </div>
        </header>
    );
}
