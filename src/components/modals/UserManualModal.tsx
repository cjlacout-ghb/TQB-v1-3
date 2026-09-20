'use client';

import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { UserManualSection } from '@/lib/types';
import { userManualEN } from '@/data/userManualEN';
import { userManualES } from '@/data/userManualES';
import { useLanguage } from '@/contexts/LanguageContext';

import Tooltip from '@/components/ui/Tooltip';

interface UserManualModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialSection?: string;
}

export default function UserManualModal({ isOpen, onClose, initialSection }: UserManualModalProps) {
    const { language, setLanguage, t } = useLanguage();
    const [activeSection, setActiveSection] = useState<string>('introduction');
    const contentRef = useRef<HTMLDivElement>(null);

    // Update active section when modal opens with initialSection
    useEffect(() => {
        if (isOpen && initialSection) {
            setActiveSection(initialSection);
        }
    }, [isOpen, initialSection]);

    const content: UserManualSection[] = language === 'en' ? userManualEN : userManualES;

    // Scroll to top when section or language changes
    useEffect(() => {
        if (contentRef.current) {
            contentRef.current.scrollTop = 0;
        }
    }, [activeSection, language]);

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
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 pointer-events-none">
                {/* Modal Content */}
                <div
                    className="modal-content animate-slide-up pointer-events-auto"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="manual-title"
                >
                    <div className="card h-full max-h-full flex flex-col overflow-hidden">
                        {/* Header */}
                        <div className="card-header flex items-center justify-between flex-shrink-0">
                            <div className="flex items-center gap-4">
                                <h2 id="manual-title" className="text-xl font-bold text-white">
                                    📖 {t.common.userManual}
                                </h2>

                                {/* Language Toggle */}
                                <div className="flex items-center bg-dark-700 rounded-lg p-1">
                                    <Tooltip text={t.tooltips.userManualTabEn}>
                                        <button
                                            onClick={() => setLanguage('en')}
                                            className={`px-3 py-1 text-sm rounded-md transition-all duration-200 ${language === 'en'
                                                ? 'bg-primary-500 text-white'
                                                : 'text-gray-400 hover:text-white'
                                                }`}
                                        >
                                            ENG
                                        </button>
                                    </Tooltip>
                                    <Tooltip text={t.tooltips.userManualTabEs}>
                                        <button
                                            onClick={() => setLanguage('es')}
                                            className={`px-3 py-1 text-sm rounded-md transition-all duration-200 ${language === 'es'
                                                ? 'bg-primary-500 text-white'
                                                : 'text-gray-400 hover:text-white'
                                                }`}
                                        >
                                            ESP
                                        </button>
                                    </Tooltip>
                                </div>
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
                        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
                            {/* Sidebar Navigation */}
                            <nav className="w-56 flex-shrink-0 border-r border-dark-500 overflow-y-auto p-4 hidden md:block">
                                <ul className="space-y-1">
                                    {content.map((section) => (
                                        <li key={section.id}>
                                            <Tooltip text={t.tooltips.userManualNav.replace('{sec}', section.title)} className="w-full">
                                                <button
                                                    onClick={() => setActiveSection(section.id)}
                                                    className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-all duration-200 ${activeSection === section.id
                                                        ? 'bg-primary-500/20 text-primary-400 border-l-2 border-primary-500'
                                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                                        }`}
                                                >
                                                    {section.title}
                                                </button>
                                            </Tooltip>
                                        </li>
                                    ))}
                                </ul>
                            </nav>

                            {/* Mobile Section Selector */}
                            <div className="md:hidden p-4 border-b border-dark-500 flex-shrink-0 bg-dark-800">
                                <select
                                    value={activeSection}
                                    onChange={(e) => setActiveSection(e.target.value)}
                                    className="input text-sm"
                                >
                                    {content.map((section) => (
                                        <option key={section.id} value={section.id}>
                                            {section.title}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Main Content */}
                            <div
                                ref={contentRef}
                                className="flex-1 overflow-y-auto p-6 scroll-smooth"
                            >
                                {content.map((section) => (
                                    <div
                                        key={section.id}
                                        className={activeSection === section.id ? 'block animate-fade-in' : 'hidden'}
                                    >
                                        <h3 className="text-2xl font-bold text-white mb-6 border-b border-dark-500 pb-2">
                                            {section.title}
                                        </h3>
                                        <div className="prose prose-invert prose-purple prose-sm max-w-none
                                        prose-headings:text-white prose-headings:font-bold
                                        prose-p:text-gray-300 prose-p:leading-relaxed
                                        prose-li:text-gray-300
                                        prose-strong:text-primary-300
                                        prose-code:text-primary-400 prose-code:bg-dark-700 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
                                        prose-pre:bg-dark-900 prose-pre:border prose-pre:border-dark-600 prose-pre:shadow-2xl
                                        prose-table:border-collapse prose-table:my-6
                                        prose-th:bg-dark-700 prose-th:px-4 prose-th:py-3 prose-th:text-primary-300 prose-th:border prose-th:border-dark-500
                                        prose-td:px-4 prose-td:py-2 prose-td:border prose-td:border-dark-500 prose-td:text-gray-300
                                        prose-hr:border-dark-500 prose-hr:my-8
                                        prose-img:rounded-xl prose-img:shadow-lg
                                        prose-a:text-primary-400 prose-a:no-underline hover:prose-a:underline
                                    ">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {section.content}
                                            </ReactMarkdown>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
