'use client';

import { useState, useEffect } from 'react';
import { X, Send, MessageSquare } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface FeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
}

// List of countries (WBSC member focus)
const COUNTRIES = [
    "Argentina", "Australia", "Bahamas", "Botswana", "Brazil", "Canada", "China", "Chinese Taipei",
    "Colombia", "Cuba", "Czech Republic", "Dominican Republic", "France", "Germany", "Great Britain",
    "Guam", "Guatemala", "Hong Kong", "Israel", "Italy", "Japan", "Mexico", "Netherlands", "New Zealand",
    "Panama", "Peru", "Philippines", "Puerto Rico", "South Africa", "South Korea", "Spain", "Thailand",
    "USA", "Uruguay", "Venezuela", "Other"
].sort();

export default function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
    const { t } = useLanguage();
    const [message, setMessage] = useState('');
    const [email, setEmail] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [country, setCountry] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    // Reset state when modal closes
    useEffect(() => {
        if (!isOpen) {
            setTimeout(() => {
                setMessage('');
                setEmail('');
                setFirstName('');
                setLastName('');
                setCountry('');
                setError(null);
                setIsSubmitting(false);
                setIsSuccess(false);
            }, 300);
        }
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Comprehensive validation
        if (!message.trim() || !email.trim() || !firstName.trim() || !lastName.trim() || !country) {
            setError(t.feedback.allFieldsRequired);
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const response = await fetch('https://formspree.io/f/xqepwazz', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    firstName: firstName,
                    lastName: lastName,
                    email: email,
                    country: country,
                    message: message,
                    _subject: `[TQB Feedback] New suggestion from ${firstName} ${lastName} (${country})`
                })
            });

            if (response.ok) {
                setIsSuccess(true);
                setTimeout(() => {
                    onClose();
                }, 3000);
            } else {
                setError(t.feedback.tryAgain);
            }
        } catch {
            setError(t.feedback.tryAgain);
        } finally {
            setIsSubmitting(false);
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
                    className="modal-content animate-slide-up pointer-events-auto max-w-lg w-full"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="feedback-title"
                >
                    <div className="card w-full flex flex-col overflow-hidden">
                        {/* Header */}
                        <div className="card-header flex items-center justify-between">
                            <h2 id="feedback-title" className="text-xl font-bold text-white flex items-center gap-2">
                                <MessageSquare className="text-primary-400" size={24} />
                                {t.feedback.title}
                            </h2>
                            <button
                                onClick={onClose}
                                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                aria-label="Close modal"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="card-body overflow-y-auto max-h-[80vh]">
                            {isSuccess ? (
                                <div className="py-8 text-center animate-fade-in">
                                    <div className="w-16 h-16 bg-success-500/20 text-success-400 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Send size={32} />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">
                                        {t.feedback.success}
                                    </h3>
                                    <button
                                        onClick={onClose}
                                        className="btn-ghost mt-4"
                                    >
                                        {t.common.back}
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <p className="text-gray-400 text-sm mb-6">
                                        {t.feedback.description}
                                    </p>

                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        {/* Name Row */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                                    {t.feedback.labelFirstName} *
                                                </label>
                                                <input
                                                    type="text"
                                                    value={firstName}
                                                    onChange={(e) => setFirstName(e.target.value)}
                                                    placeholder={t.feedback.placeholderFirstName}
                                                    className="input"
                                                    disabled={isSubmitting}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                                    {t.feedback.labelLastName} *
                                                </label>
                                                <input
                                                    type="text"
                                                    value={lastName}
                                                    onChange={(e) => setLastName(e.target.value)}
                                                    placeholder={t.feedback.placeholderLastName}
                                                    className="input"
                                                    disabled={isSubmitting}
                                                />
                                            </div>
                                        </div>

                                        {/* Email & Country Row */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                                    {t.feedback.labelEmail} *
                                                </label>
                                                <input
                                                    type="email"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    placeholder={t.feedback.placeholderEmail}
                                                    className="input"
                                                    disabled={isSubmitting}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                                    {t.feedback.labelCountry} *
                                                </label>
                                                <select
                                                    value={country}
                                                    onChange={(e) => setCountry(e.target.value)}
                                                    className="input appearance-none"
                                                    disabled={isSubmitting}
                                                >
                                                    <option value="" disabled>{t.feedback.selectCountry}</option>
                                                    {COUNTRIES.map(c => (
                                                        <option key={c} value={c}>{c}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-1">
                                                {t.feedback.labelMessage} *
                                            </label>
                                            <textarea
                                                value={message}
                                                onChange={(e) => setMessage(e.target.value)}
                                                placeholder={t.feedback.placeholderMessage}
                                                className={`input min-h-[100px] resize-none ${error && !message ? 'border-error-500' : ''}`}
                                                disabled={isSubmitting}
                                            />
                                        </div>

                                        {error && (
                                            <div className="p-3 bg-error-500/10 border border-error-500/20 rounded-lg">
                                                <p className="text-error-400 text-xs text-center">{error}</p>
                                            </div>
                                        )}

                                        <div className="flex gap-3 pt-2">
                                            <button
                                                type="button"
                                                onClick={onClose}
                                                className="flex-1 btn-ghost"
                                                disabled={isSubmitting}
                                            >
                                                {t.feedback.cancel}
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={isSubmitting}
                                                className="flex-[2] btn-primary"
                                            >
                                                {isSubmitting ? (
                                                    <span className="flex items-center gap-2">
                                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                        {t.feedback.sending}
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-2">
                                                        <Send size={18} />
                                                        {t.feedback.sendButton}
                                                    </span>
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
