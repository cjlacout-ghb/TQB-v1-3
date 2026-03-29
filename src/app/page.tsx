'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useLanguage } from '@/contexts/LanguageContext';
import { Team, GameData, TeamStats, TieBreakMethod, ScreenNumber } from '@/lib/types';
import { generateMatchups, calculateRankings } from '@/lib/calculations';
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
import { loadState, saveState, clearState, hasSavedState } from '@/lib/storage';

export default function Home() {
    // App state
    const [currentScreen, setCurrentScreen] = useState<ScreenNumber>(0);
    const [teams, setTeams] = useState<Team[]>([
        { id: 'team-1', name: '' },
        { id: 'team-2', name: '' },
        { id: 'team-3', name: '' },
    ]);
    const [games, setGames] = useState<GameData[]>([]);
    const [rankings, setRankings] = useState<TeamStats[]>([]);
    const [tieBreakMethod, setTieBreakMethod] = useState<TieBreakMethod>('WIN_LOSS');
    const [needsERTQB, setNeedsERTQB] = useState(false);
    const [hasUnresolvedTies, setHasUnresolvedTies] = useState(false);

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

    // Load state on mount
    useEffect(() => {
        const saved = loadState();
        if (saved) {
            setTeams(saved.teams);
            setGames(saved.games);
            setRankings(saved.rankings);
            setTieBreakMethod(saved.tieBreakMethod);
            setNeedsERTQB(saved.needsERTQB);
            setHasUnresolvedTies(saved.hasUnresolvedTies);
        }
    }, []);

    // Auto-save state on any relevant change
    useEffect(() => {
        if (currentScreen !== 0) {
            saveState({
                currentScreen,
                teams,
                games,
                rankings,
                tieBreakMethod,
                needsERTQB,
                hasUnresolvedTies
            });
        }
    }, [currentScreen, teams, games, rankings, tieBreakMethod, needsERTQB, hasUnresolvedTies]);

    // Calculate total steps dynamically
    const totalSteps = useMemo(() => {
        return needsERTQB ? 5 : 3;
    }, [needsERTQB]);

    // Handle CSV import - go to Step 2 (Game Entry) for verification
    const handleCSVImport = useCallback((importedTeams: Team[], importedGames: GameData[]) => {
        setTeams(importedTeams);
        setGames(importedGames);
        setCurrentScreen(2);
    }, []);

    // Handle proceeding from Screen 1 to Screen 2
    const handleContinueToGames = useCallback(() => {
        // Generate matchups for all teams
        const matchups = generateMatchups(teams);
        const initialGames: GameData[] = matchups.map(match => ({
            ...match,
            runsA: null,
            runsB: null,
            inningsABatting: '',
            inningsADefense: '',
            inningsBBatting: '',
            inningsBDefense: '',
            earnedRunsA: null,
            earnedRunsB: null,
        }));

        setGames(initialGames);
        setCurrentScreen(2);
    }, [teams]);

    // Handle TQB calculation from Screen 2
    const handleCalculateTQB = useCallback(() => {
        const result = calculateRankings(teams, games, false);
        setRankings(result.rankings);
        setTieBreakMethod(result.tieBreakMethod);
        setNeedsERTQB(result.needsERTQB);
        setCurrentScreen(3);
    }, [teams, games]);

    // Handle proceeding to ER-TQB entry
    const handleProceedToERTQB = useCallback(() => {
        setCurrentScreen(4);
    }, []);

    // Handle ER-TQB calculation from Screen 4
    const handleCalculateERTQB = useCallback(() => {
        const result = calculateRankings(teams, games, true);
        setRankings(result.rankings);
        setTieBreakMethod(result.tieBreakMethod);
        setHasUnresolvedTies(result.hasTies);
        setCurrentScreen(5);
    }, [teams, games]);

    // Handle starting new calculation
    const handleStartNew = useCallback(() => {
        clearState();
        setTeams([
            { id: 'team-1', name: '' },
            { id: 'team-2', name: '' },
            { id: 'team-3', name: '' },
        ]);
        setGames([]);
        setRankings([]);
        setTieBreakMethod('WIN_LOSS');
        setNeedsERTQB(false);
        setHasUnresolvedTies(false);
        setCurrentScreen(1);
    }, []);

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
    }, []);

    // Handle going back
    const handleBack = useCallback(() => {
        if (currentScreen === 1) {
            handleStartNewConfirm();
        } else if (currentScreen === 2) {
            setCurrentScreen(1);
        } else if (currentScreen === 3) {
            setCurrentScreen(2);
        } else if (currentScreen === 4) {
            setCurrentScreen(3);
        } else if (currentScreen === 5) {
            setCurrentScreen(4);
        }
    }, [currentScreen, handleStartNewConfirm]);

    // Render current screen
    const renderScreen = () => {
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
    };

    const { language, t } = useLanguage();

    return (
        <div className="min-h-screen flex flex-col">
            <Header 
                onOpenManual={() => handleOpenManual()} 
                onGoHome={() => setCurrentScreen(0)}
            />

            <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
                {renderScreen()}
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
                            <span className="text-lg">💡</span> {t.common.feedback}
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
