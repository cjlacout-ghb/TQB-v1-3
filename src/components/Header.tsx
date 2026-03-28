'use client';

import Image from 'next/image';
import { Book } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

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
                    <button 
                        onClick={onGoHome}
                        className="flex items-center gap-3 hover:opacity-80 transition-all duration-200 group text-left"
                        aria-label="Go to Landing Page"
                    >
                        <Image
                            src="/images/logo.png"
                            alt="TQB Calculator Logo"
                            width={40}
                            height={40}
                            className="rounded-xl object-contain shadow-lg shadow-primary-500/20 group-hover:scale-105 transition-transform duration-200"
                        />
                        <div>
                            <h1 className="text-lg font-bold text-white tracking-tight group-hover:text-primary-400 transition-colors duration-200">
                                {t.common.title}
                            </h1>
                        </div>
                    </button>

                    {/* Navigation */}
                    <nav className="flex items-center gap-2 sm:gap-4">
                        {/* Language Toggle */}
                        <button
                            onClick={toggleLanguage}
                            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200"
                            title="Switch Language"
                        >
                            <span className="font-mono">
                                <span className={language === 'es' ? 'text-primary-400 font-bold' : 'text-gray-500'}>ESP</span>
                                <span className="mx-1 text-gray-600">|</span>
                                <span className={language === 'en' ? 'text-primary-400 font-bold' : 'text-gray-500'}>ENG</span>
                            </span>
                        </button>

                        <div className="w-px h-6 bg-dark-600 hidden sm:block"></div>

                        <button
                            onClick={onOpenManual}
                            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200"
                            aria-label="Open User Manual"
                        >
                            <Book size={18} />
                            <span className="hidden sm:inline">{t.common.userManual}</span>
                        </button>
                    </nav>
                </div>
            </div>
        </header>
    );
}
