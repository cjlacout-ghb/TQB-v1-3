'use client';

import { useState, useRef, useCallback, memo, useMemo } from 'react';
import { Plus, Trash2, Upload, HelpCircle, ArrowRight, AlertCircle, ArrowLeft, FileText, ClipboardList, Users } from 'lucide-react';
import { Team, GameData, GroupID } from '@/lib/types';
import { parseCSV, getSampleCSV } from '@/lib/csvParser';
import StepIndicator from '../StepIndicator';
import { useLanguage } from '@/contexts/LanguageContext';

interface TeamEntryProps {
    teams: Team[];
    onTeamsChange: (teams: Team[]) => void;
    onContinue: () => void;
    onCSVImport: (teams: Team[], games: GameData[]) => void;
    onMultiGroupImport: (teams: Team[], games: GameData[], groupId: GroupID) => void;
    onBack?: () => void;
    isMultiGroup: boolean;
    onSetMultiGroup: (value: boolean | ((prev: boolean) => boolean)) => void;
}

const MAX_TEAMS = 8;
const MIN_TEAMS = 3;

const TeamEntry = memo(function TeamEntry({
    teams,
    onTeamsChange,
    onContinue,
    onCSVImport,
    onMultiGroupImport,
    onBack,
    isMultiGroup,
    onSetMultiGroup,
}: TeamEntryProps) {
    const { t } = useLanguage();
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [csvError, setCSVError] = useState<string[]>([]);
    const [showCSVHelp, setShowCSVHelp] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [importMethod, setImportMethod] = useState<'file' | 'paste'>('file');
    const [pastedText, setPastedText] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [activeGroupId, setActiveGroupId] = useState<GroupID>('A'); // Local UI state only — never persisted
    const fileInputRef = useRef<HTMLInputElement>(null);

    const addTeam = useCallback(() => {
        const groupTeams = teams.filter(t => t.groupId === activeGroupId);
        if (groupTeams.length >= MAX_TEAMS) return;

        const newTeam: Team = {
            id: `team-${Date.now()}`,
            name: '',
            groupId: activeGroupId,
        };
        onTeamsChange([...teams, newTeam]);
    }, [teams, onTeamsChange, activeGroupId]);

    const removeTeam = useCallback((teamId: string) => {
        const groupTeams = teams.filter(t => t.groupId === activeGroupId);
        if (groupTeams.length <= MIN_TEAMS) return;
        onTeamsChange(teams.filter(t => t.id !== teamId));

        // Clear error for removed team
        setErrors(prev => {
            const next = { ...prev };
            delete next[teamId];
            return next;
        });
    }, [teams, onTeamsChange, activeGroupId]);

    const updateTeamName = useCallback((teamId: string, name: string) => {
        onTeamsChange(
            teams.map(t => t.id === teamId ? { ...t, name } : t)
        );

        // Clear error when user starts typing
        if (errors[teamId]) {
            setErrors(prev => {
                const next = { ...prev };
                delete next[teamId];
                return next;
            });
        }
    }, [teams, onTeamsChange, errors]);

    const validateTeams = useCallback((): boolean => {
        const newErrors: Record<string, string> = {};

        const validateGroup = (groupTeams: Team[]) => {
            const names = new Set<string>();
            for (const team of groupTeams) {
                const trimmedName = team.name.trim();
                if (!trimmedName) {
                    newErrors[team.id] = t.teamEntry.errors.required;
                } else if (names.has(trimmedName.toLowerCase())) {
                    newErrors[team.id] = t.teamEntry.errors.duplicate;
                } else {
                    names.add(trimmedName.toLowerCase());
                }
            }
        };

        if (isMultiGroup) {
            validateGroup(teams.filter(t => t.groupId === 'A'));
            validateGroup(teams.filter(t => t.groupId === 'B'));
        } else {
            validateGroup(teams);
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [teams, t, isMultiGroup]);

    const handleContinue = useCallback(() => {
        if (validateTeams()) {
            // Trim team names before continuing
            onTeamsChange(teams.map(t => ({ ...t, name: t.name.trim() })));
            onContinue();
        }
    }, [validateTeams, teams, onTeamsChange, onContinue]);

    const handleFileUpload = useCallback((file: File) => {
        setCSVError([]);

        if (!file.name.endsWith('.csv') && !file.name.endsWith('.txt')) {
            setCSVError([t.teamEntry.errors.fileType]);
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result as string;
            const result = parseCSV(content, t);

            if (!result.success) {
                setCSVError(result.errors);
                return;
            }

            if (isMultiGroup) {
                onMultiGroupImport(result.teams, result.games, activeGroupId);
            } else {
                onCSVImport(result.teams, result.games);
            }
        };
        reader.readAsText(file);
    }, [onCSVImport, onMultiGroupImport, isMultiGroup, activeGroupId, t]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer.files[0];
        if (file) handleFileUpload(file);
    }, [handleFileUpload]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);
    
    const handlePasteProcess = useCallback(() => {
        if (!pastedText.trim()) return;
        
        setCSVError([]);
        setIsProcessing(true);
        
        // Small delay to show feedback if needed, although parsing is synchronous
        setTimeout(() => {
            const result = parseCSV(pastedText, t);
            setIsProcessing(false);
            
            if (!result.success) {
                setCSVError(result.errors);
                return;
            }

            if (isMultiGroup) {
                onMultiGroupImport(result.teams, result.games, activeGroupId);
            } else {
                onCSVImport(result.teams, result.games);
            }
        }, 300);
    }, [pastedText, t, onCSVImport, onMultiGroupImport, isMultiGroup, activeGroupId]);

    // Continue button is enabled only when ALL active groups have ≥3 named teams
    const hasValidTeams = useMemo(() => {
        const groupATeams = teams.filter(t => t.groupId === 'A');
        const groupAReady = groupATeams.length >= MIN_TEAMS && groupATeams.every(t => t.name.trim().length > 0);
        if (!isMultiGroup) return groupAReady;
        const groupBTeams = teams.filter(t => t.groupId === 'B');
        const groupBReady = groupBTeams.length >= MIN_TEAMS && groupBTeams.every(t => t.name.trim().length > 0);
        return groupAReady && groupBReady;
    }, [teams, isMultiGroup]);

    // Teams visible in the current tab
    const displayTeams = teams.filter(t => t.groupId === activeGroupId);

    // Per-group readiness for the tab status indicators
    const groupAReady = useMemo(() => {
        const g = teams.filter(t => t.groupId === 'A');
        return g.length >= MIN_TEAMS && g.every(t => t.name.trim().length > 0);
    }, [teams]);
    const groupBReady = useMemo(() => {
        const g = teams.filter(t => t.groupId === 'B');
        return g.length >= MIN_TEAMS && g.every(t => t.name.trim().length > 0);
    }, [teams]);

    return (
        <div className="max-w-2xl mx-auto animate-fade-in">
            <StepIndicator currentStep={1} totalSteps={3} />

            <div className="card">
                <div className="card-header">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            {onBack && (
                                <button
                                    onClick={onBack}
                                    className="group flex items-center justify-center w-10 h-10 rounded-full bg-dark-600 text-gray-400 hover:text-white hover:bg-dark-500 transition-all duration-200"
                                    title={t.common.reset}
                                    aria-label={t.common.reset}
                                >
                                    <ArrowLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
                                </button>
                            )}
                            <h2 className="text-2xl font-bold text-white">{t.teamEntry.title}</h2>
                        </div>

                        {/* Multi-group toggle */}
                        {!isMultiGroup ? (
                            <button
                                onClick={() => {
                                    onSetMultiGroup(true);
                                    const ts = Date.now();
                                    const bTeams: Team[] = [
                                        { id: `team-b-1-${ts}`,     name: '', groupId: 'B' },
                                        { id: `team-b-2-${ts + 1}`, name: '', groupId: 'B' },
                                        { id: `team-b-3-${ts + 2}`, name: '', groupId: 'B' },
                                    ];
                                    onTeamsChange([...teams, ...bTeams]);
                                    setActiveGroupId('B');
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                                    bg-primary-500/10 text-primary-400 border border-primary-500/30
                                    hover:bg-primary-500/20 transition-all duration-200 text-sm font-medium whitespace-nowrap"
                            >
                                <Users size={14} />
                                {t.common.addGroupB}
                            </button>
                        ) : (
                            <button
                                onClick={() => {
                                    onSetMultiGroup(false);
                                    onTeamsChange(teams.filter(t => t.groupId !== 'B'));
                                    setActiveGroupId('A');
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                                    bg-dark-600 text-gray-400 border border-dark-500
                                    hover:border-error-500/50 hover:text-error-400
                                    transition-all duration-200 text-sm font-medium whitespace-nowrap"
                            >
                                {t.common.onlyGroupA}
                            </button>
                        )}
                    </div>
                </div>

                {/* Group A / B tab strip — only when multi-group is active */}
                {isMultiGroup && (
                    <div className="px-6 pt-2">
                        <div className="flex p-1 bg-dark-900/50 rounded-xl border border-dark-600">
                            {(['A', 'B'] as GroupID[]).map(gId => {
                                const ready = gId === 'A' ? groupAReady : groupBReady;
                                const isActive = activeGroupId === gId;
                                return (
                                    <button
                                        key={gId}
                                        onClick={() => { setActiveGroupId(gId); setErrors({}); setCSVError([]); }}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all
                                            ${isActive ? 'bg-primary-500 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                                    >
                                        {t.common.groupTab.replace('{gId}', gId)}
                                        <span
                                            title={ready ? 'Listo' : 'Incompleto'}
                                            className={`w-2 h-2 rounded-full transition-colors ${
                                                ready ? 'bg-green-400' : 'bg-yellow-500/70'
                                            }`}
                                        />
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                <div className="card-body space-y-6">
                    {/* Team List — filtered to the active group's tab */}
                    <div className="space-y-3">
                        {displayTeams.map((team, index) => (
                            <div key={team.id} className="flex items-start gap-3 animate-slide-up">
                                <div className="w-8 h-10 flex items-center justify-center text-gray-500 font-mono text-sm">
                                    {index + 1}.
                                </div>
                                <div className="flex-1">
                                    <input
                                        type="text"
                                        value={team.name}
                                        onChange={(e) => updateTeamName(team.id, e.target.value)}
                                        placeholder={t.teamEntry.inputPlaceholder.replace('{n}', (index + 1).toString())}
                                        className={`input ${errors[team.id] ? 'input-error' : ''}`}
                                        maxLength={50}
                                        aria-label={`Team ${index + 1} name`}
                                    />
                                    {errors[team.id] && (
                                        <p className="mt-1 text-sm text-error-400 flex items-center gap-1">
                                            <AlertCircle size={14} />
                                            {errors[team.id]}
                                        </p>
                                    )}
                                </div>
                                <button
                                    onClick={() => removeTeam(team.id)}
                                    disabled={displayTeams.length <= MIN_TEAMS}
                                    className="h-10 px-3 text-gray-400 hover:text-error-400 hover:bg-error-500/10 
                    rounded-lg transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
                                    aria-label={t.teamEntry.removeTeam}
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Add Team Button */}
                    <button
                        onClick={addTeam}
                        disabled={displayTeams.length >= MAX_TEAMS}
                        className="w-full py-3 border-2 border-dashed border-dark-500 rounded-xl
              text-gray-400 hover:text-primary-400 hover:border-primary-500/50
              transition-all duration-200 flex items-center justify-center gap-2
              disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-gray-400 disabled:hover:border-dark-500"
                    >
                        <Plus size={18} />
                        {t.teamEntry.addTeam} ({displayTeams.length}/{MAX_TEAMS})
                    </button>

                    {/* Divider */}
                    <div className="relative py-4">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-dark-500" />
                        </div>
                        <div className="relative flex justify-center">
                            <span className="px-4 text-sm text-gray-500 bg-dark-800">
                                {t.teamEntry.orUpload}
                            </span>
                        </div>
                    </div>

                    {/* CSV/Paste Upload Section */}
                    <div className="space-y-4">
                        {/* Tabs */}
                        <div className="flex p-1 bg-dark-900/50 rounded-xl border border-dark-600">
                            <button
                                onClick={() => { setImportMethod('file'); setCSVError([]); }}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all
                                    ${importMethod === 'file' 
                                        ? 'bg-primary-500 text-white shadow-lg' 
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                            >
                                <FileText size={16} />
                                {t.teamEntry.importFile}
                            </button>
                            <button
                                onClick={() => { setImportMethod('paste'); setCSVError([]); }}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all
                                    ${importMethod === 'paste' 
                                        ? 'bg-primary-500 text-white shadow-lg' 
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                            >
                                <ClipboardList size={16} />
                                {t.teamEntry.importPaste}
                            </button>
                        </div>

                        {importMethod === 'file' ? (
                            <div
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                className={`
                                    relative p-10 border-2 border-dashed rounded-2xl text-center
                                    transition-all duration-200 cursor-pointer
                                    ${isDragging
                                        ? 'border-primary-500 bg-primary-500/10 scale-[1.01]'
                                        : 'border-dark-500 hover:border-primary-500/50 hover:bg-dark-700/30'
                                    }
                                `}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".csv,.txt"
                                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                                    className="hidden"
                                    aria-label={t.teamEntry.dropFile}
                                />

                                <Upload
                                    size={40}
                                    className={`mx-auto mb-4 ${isDragging ? 'text-primary-400' : 'text-gray-500'}`}
                                />
                                <p className="text-gray-200 font-bold text-lg">
                                    {isDragging ? t.teamEntry.dropFileActive : t.teamEntry.dropFile}
                                </p>
                                <p className="text-base text-gray-400 mt-2">
                                    {t.teamEntry.preFill}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4 animate-fade-in">
                                <textarea
                                    value={pastedText}
                                    onChange={(e) => setPastedText(e.target.value)}
                                    placeholder={t.teamEntry.pastePlaceholder}
                                    className="w-full h-40 input font-mono text-sm resize-none"
                                    aria-label={t.teamEntry.importPaste}
                                />
                                <button
                                    onClick={handlePasteProcess}
                                    disabled={!pastedText.trim() || isProcessing}
                                    className="w-full py-3 bg-dark-700 hover:bg-dark-600 border border-dark-500 
                                             text-primary-400 font-semibold rounded-xl transition-all flex items-center justify-center gap-2
                                             disabled:opacity-30 disabled:cursor-not-allowed group"
                                >
                                    {isProcessing ? (
                                        <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                            {t.teamEntry.processButton}
                                        </>
                                    )}
                                </button>
                            </div>
                        )}

                        {/* Common Format Help Toggle */}
                        <div className="flex justify-center">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowCSVHelp(!showCSVHelp);
                                }}
                                className="inline-flex items-center gap-1 text-sm text-primary-400 hover:text-primary-300 transition-colors"
                            >
                                <HelpCircle size={14} />
                                {t.teamEntry.viewFormat}
                            </button>
                        </div>
                    </div>

                    {/* CSV Help Panel */}
                    {showCSVHelp && (
                        <div className="p-4 bg-dark-700/50 rounded-xl border border-dark-500 animate-slide-up">
                            <h4 className="text-sm font-semibold text-gray-300 mb-2">
                                {t.teamEntry.example}
                            </h4>
                            <pre className="text-xs text-gray-400 font-mono bg-dark-900 p-3 rounded-lg overflow-x-auto">
                                {getSampleCSV()}
                            </pre>
                        </div>
                    )}

                    {/* CSV/Paste Errors */}
                    {csvError.length > 0 && (
                        <div className="p-4 bg-error-500/10 border border-error-500/30 rounded-xl animate-shake">
                            <h4 className="text-sm font-semibold text-error-400 mb-2 flex items-center gap-2">
                                <AlertCircle size={16} />
                                {t.teamEntry.fileError}
                            </h4>
                            <ul className="text-sm text-error-300 space-y-1">
                                {csvError.map((error, i) => (
                                    <li key={i}>• {error}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Continue Button */}
                    <button
                        onClick={handleContinue}
                        disabled={!hasValidTeams}
                        className="w-full btn-primary py-4 text-lg"
                    >
                        {t.teamEntry.continueButton}
                        <ArrowRight size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
});

export default TeamEntry;
