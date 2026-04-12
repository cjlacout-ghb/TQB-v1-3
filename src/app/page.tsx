'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useLanguage } from '@/contexts/LanguageContext';

import Header from '@/components/Header';
import TeamEntry from '@/components/screens/TeamEntry';
import GameEntry from '@/components/screens/GameEntry';
import TQBRankings from '@/components/screens/TQBRankings';
import EarnedRunsEntry from '@/components/screens/EarnedRunsEntry';
import ERTQBRankings from '@/components/screens/ERTQBRankings';
const UserManualModal = dynamic(() => import('@/components/modals/UserManualModal'), {
    ssr: false,
});
const PDFExportModal = dynamic(() => import('@/components/modals/PDFExportModal'), {
    ssr: false,
});
const FeedbackModal = dynamic(() => import('@/components/modals/FeedbackModal'), {
    ssr: false,
});
import LandingScreen from '@/components/screens/LandingScreen';
import ConfirmResetModal from '@/components/modals/ConfirmResetModal';
import { loadState, hasSavedState } from '@/lib/storage';

import { useTQBState } from '@/hooks/useTQBState';

export default function Home() {
    const { state, actions } = useTQBState();
    const {
        currentScreen,
        teams,
        games,
        rankings,
        tieBreakMethod,
        needsERTQB,
        hasUnresolvedTies,
        totalSteps
    } = state;

    const {
        setCurrentScreen,
        setTeams,
        setGames,
        handleCSVImport,
        handleContinueToGames,
        handleCalculateTQB,
        handleCalculateERTQB,
        handleStartNew,
        handleBack: baseHandleBack
    } = actions;

    // Modal states
    const [isManualOpen, setIsManualOpen] = useState(false);
    const [manualSection, setManualSection] = useState<string | undefined>();
    const [isPDFModalOpen, setIsPDFModalOpen] = useState(false);
    const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
    const [isConfirmResetOpen, setIsConfirmResetOpen] = useState(false);

    const handleOpenManual = useCallback((section?: string) => {
        setManualSection(section);
        setIsManualOpen(true);
    }, []);

    // Scroll to top when screen changes
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'instant' });
    }, [currentScreen]);

    const handleStartNewConfirm = useCallback(() => {
        if (hasSavedState()) {
            setIsConfirmResetOpen(true);
        } else {
            handleStartNew();
        }
    }, [handleStartNew]);

    const handleContinueTournament = useCallback(() => {
        const saved = loadState();
        if (saved) {
            setCurrentScreen(saved.currentScreen || 1);
        } else {
            setCurrentScreen(1);
        }
    }, [setCurrentScreen]);

    // Handle going back with confirm reset on first screen
    const handleBack = useCallback(() => {
        if (currentScreen === 1) {
            handleStartNewConfirm();
        } else {
            baseHandleBack();
        }
    }, [currentScreen, handleStartNewConfirm, baseHandleBack]);

    // Handle proceeding to ER-TQB entry
    const handleProceedToERTQB = useCallback(() => {
        setCurrentScreen(4);
    }, [setCurrentScreen]);

    // Render current screen — useMemo prevents re-mounting inputs on every keystroke
    const renderedScreen = useMemo(() => {
        switch (currentScreen) {
            case 0:
                return (
                    <LandingScreen 
                        onNewTournament={handleStartNewConfirm}
                        onContinueTournament={handleContinueTournament}
                        canContinue={hasSavedState()}
                    />
                );

            case 1:
                return (
                    <TeamEntry
                        teams={teams}
                        onTeamsChange={setTeams}
                        onContinue={handleContinueToGames}
                        onCSVImport={handleCSVImport}
                        onBack={handleBack}
                    />
                );

            case 2:
                return (
                    <GameEntry
                        teams={teams}
                        games={games}
                        onGamesChange={setGames}
                        onCalculate={handleCalculateTQB}
                        onBack={handleBack}
                        totalSteps={totalSteps}
                    />
                );

            case 3:
                return (
                    <TQBRankings
                        rankings={rankings}
                        tieBreakMethod={tieBreakMethod}
                        needsERTQB={needsERTQB}
                        onProceedToERTQB={handleProceedToERTQB}
                        onExportPDF={() => setIsPDFModalOpen(true)}
                        onStartNew={handleStartNewConfirm}
                        onBack={handleBack}
                        totalSteps={totalSteps}
                        games={games}
                        onOpenManual={handleOpenManual}
                    />
                );

            case 4:
                return (
                    <EarnedRunsEntry
                        games={games}
                        onGamesChange={setGames}
                        onCalculate={handleCalculateERTQB}
                        onBack={handleBack}
                    />
                );

            case 5:
                return (
                    <ERTQBRankings
                        rankings={rankings}
                        tieBreakMethod={tieBreakMethod}
                        hasUnresolvedTies={hasUnresolvedTies}
                        onExportPDF={() => setIsPDFModalOpen(true)}
                        onStartNew={handleStartNewConfirm}
                        onBack={handleBack}
                        games={games}
                        onOpenManual={handleOpenManual}
                    />
                );

            default:
                return null;
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentScreen, teams, games, rankings, tieBreakMethod, needsERTQB,
        hasUnresolvedTies, totalSteps, setTeams, setGames, handleCSVImport,
        handleContinueToGames, handleCalculateTQB, handleCalculateERTQB,
        handleProceedToERTQB, handleStartNewConfirm, handleContinueTournament,
        handleBack, handleOpenManual]);

    const { language, t } = useLanguage();

    return (
        <div className="min-h-screen flex flex-col">
            <Header 
                onOpenManual={() => handleOpenManual()} 
                onGoHome={() => setCurrentScreen(0)}
            />

            <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
                {renderedScreen}
            </main>

            {/* Footer */}
            <footer className="py-4 text-center text-sm text-gray-500 border-t border-dark-600">
                <div className="flex flex-col gap-1">
                    <p className="font-medium text-gray-400">{t.common.footer.version}</p>
                    <p>{t.common.footer.dev}</p>
                    <p className="text-xs text-gray-600">{t.common.footer.rights}</p>
                    <div className="mt-2">
                        <button
                            onClick={() => setIsFeedbackOpen(true)}
                            className="text-primary-400 hover:text-primary-300 transition-colors flex items-center gap-1 mx-auto"
                        >
                            {t.common.feedback}
                        </button>
                    </div>
                </div>
            </footer>

            {/* Modals */}
            <UserManualModal
                isOpen={isManualOpen}
                onClose={() => {
                    setIsManualOpen(false);
                    setManualSection(undefined);
                }}
                initialSection={manualSection}
            />

            <PDFExportModal
                isOpen={isPDFModalOpen}
                onClose={() => setIsPDFModalOpen(false)}
                data={{
                    rankings,
                    games,
                    tieBreakMethod,
                    useERTQB: currentScreen === 5,
                    language,
                }}
            />

            <FeedbackModal
                isOpen={isFeedbackOpen}
                onClose={() => setIsFeedbackOpen(false)}
            />

            <ConfirmResetModal
                isOpen={isConfirmResetOpen}
                onClose={() => setIsConfirmResetOpen(false)}
                onConfirm={handleStartNew}
            />
        </div>
    );
}
