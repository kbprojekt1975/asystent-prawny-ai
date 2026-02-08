import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ArrowLeftIcon,
    DocumentTextIcon,
    UserGroupIcon,
    ScaleIcon,
    GavelIcon,
    ClockIcon
} from './Icons';
import { InfoIcon } from './InfoIcon';
import HelpModal from './HelpModal';
import NotesWidget from './NotesWidget';
import { LawArea, InteractionMode, FeatureFlags } from '../types';
import { useProDashboard, ProStep } from '../hooks/useProDashboard';

// Sub-components
import ProDashboardTile from './pro/ProDashboardTile';
import ProStepDocuments from './pro/ProStepDocuments';
import ProStepInterview from './pro/ProStepInterview';
import ProStepAnalysis from './pro/ProStepAnalysis';
import ProStepCourt from './pro/ProStepCourt';

interface ProDashboardProps {
    userId: string;
    chatId: string | null;
    lawArea: LawArea;
    topic: string;
    onBack: () => void;
    isFullScreen?: boolean;
    setIsFullScreen?: (val: boolean) => void;
    isDeepThinkingEnabled?: boolean;
    setIsDeepThinkingEnabled?: (val: boolean) => void;
    onAddNote?: (content: string, linkedMsg?: string, noteId?: string, linkedRole?: 'user' | 'model' | 'system') => void;
    onDeleteNote?: (noteId: string) => void;
    onUpdateNotePosition?: (noteId: string, position: { x: number, y: number } | null) => void;
    onSelectInteractionMode?: (mode: InteractionMode) => void;
    existingNotes?: any[];
    features: FeatureFlags;
}

const ProDashboard: React.FC<ProDashboardProps> = ({
    userId,
    chatId,
    lawArea,
    topic,
    onBack,
    isFullScreen = false,
    setIsFullScreen,
    isDeepThinkingEnabled = false,
    setIsDeepThinkingEnabled,
    onAddNote,
    onDeleteNote,
    onUpdateNotePosition,
    onSelectInteractionMode,
    existingNotes,
    features
}) => {
    const { t } = useTranslation();
    const [isHelpOpen, setIsHelpOpen] = useState(false);

    const proLogic = useProDashboard({ userId, chatId, lawArea, topic });
    const {
        activeStep,
        setActiveStep,
        documents,
        isLoading,
        stepStatus,
        courtRole,
        setCourtRole,
        messages,
        currentInput,
        setCurrentInput,
        scrollRef,
        handleFileUpload,
        handleDeleteDoc,
        handleNoDocs,
        handleAnalyzeDocs,
        handleSendMessage,
        handleSelectCourtRole,
        handleGenerateAnalysis,
        finishInterview
    } = proLogic;

    // View Components Mapping
    if (activeStep === ProStep.Documents) {
        return (
            <ProStepDocuments
                onBack={() => setActiveStep(null)}
                messages={messages}
                isLoading={isLoading}
                documents={documents}
                handleFileUpload={handleFileUpload}
                handleDeleteDoc={handleDeleteDoc}
                handleNoDocs={handleNoDocs}
                handleAnalyzeDocs={handleAnalyzeDocs}
                isHelpOpen={isHelpOpen}
                setIsHelpOpen={setIsHelpOpen}
            />
        );
    }

    if (activeStep === ProStep.Interview) {
        return (
            <ProStepInterview
                onBack={() => setActiveStep(null)}
                finishInterview={finishInterview}
                messages={messages}
                isLoading={isLoading}
                isFullScreen={isFullScreen}
                setIsFullScreen={setIsFullScreen!}
                isDeepThinkingEnabled={isDeepThinkingEnabled}
                setIsDeepThinkingEnabled={setIsDeepThinkingEnabled!}
                features={features}
                currentInput={currentInput}
                setCurrentInput={setCurrentInput}
                handleSendMessage={handleSendMessage}
                scrollRef={scrollRef as React.RefObject<HTMLDivElement>}
                onAddNote={onAddNote}
                onDeleteNote={onDeleteNote}
                onUpdateNotePosition={onUpdateNotePosition}
                onSelectInteractionMode={onSelectInteractionMode}
                existingNotes={existingNotes}
                lawArea={lawArea}
                topic={topic}
                isHelpOpen={isHelpOpen}
                setIsHelpOpen={setIsHelpOpen}
            />
        );
    }

    if (activeStep === ProStep.Analysis) {
        return (
            <ProStepAnalysis
                onBack={() => setActiveStep(null)}
                messages={messages}
                isLoading={isLoading}
                handleGenerateAnalysis={handleGenerateAnalysis}
                handleSendMessage={handleSendMessage}
                scrollRef={scrollRef as React.RefObject<HTMLDivElement>}
                isFullScreen={isFullScreen}
                setIsFullScreen={setIsFullScreen!}
                isDeepThinkingEnabled={isDeepThinkingEnabled}
                setIsDeepThinkingEnabled={setIsDeepThinkingEnabled!}
                features={features}
                currentInput={currentInput}
                setCurrentInput={setCurrentInput}
                onAddNote={onAddNote}
                onDeleteNote={onDeleteNote}
                onUpdateNotePosition={onUpdateNotePosition}
                onSelectInteractionMode={onSelectInteractionMode}
                existingNotes={existingNotes}
                lawArea={lawArea}
                topic={topic}
                isHelpOpen={isHelpOpen}
                setIsHelpOpen={setIsHelpOpen}
            />
        );
    }

    if (activeStep === ProStep.Court) {
        return (
            <ProStepCourt
                onBack={() => { setActiveStep(null); setCourtRole(null); }}
                finishSimulation={() => { setActiveStep(null); setCourtRole(null); }}
                messages={messages}
                isLoading={isLoading}
                isFullScreen={isFullScreen}
                courtRole={courtRole}
                setCourtRole={setCourtRole}
                handleSelectCourtRole={handleSelectCourtRole}
                handleSendMessage={() => handleSendMessage()}
                currentInput={currentInput}
                setCurrentInput={setCurrentInput}
                scrollRef={scrollRef as React.RefObject<HTMLDivElement>}
                onAddNote={onAddNote}
                onDeleteNote={onDeleteNote}
                onUpdateNotePosition={onUpdateNotePosition}
                onSelectInteractionMode={onSelectInteractionMode}
                existingNotes={existingNotes}
                lawArea={lawArea}
                topic={topic}
                isHelpOpen={isHelpOpen}
                setIsHelpOpen={setIsHelpOpen}
            />
        );
    }

    if (activeStep === ProStep.Notes) {
        return (
            <div className="flex flex-col h-full bg-slate-900 text-white p-6 overflow-y-auto">
                <button
                    onClick={() => setActiveStep(null)}
                    className="flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors self-start"
                >
                    <ArrowLeftIcon className="w-5 h-5" />
                    <span>Powrót do pulpitu sprawy</span>
                </button>
                <div className="max-w-4xl mx-auto w-full pb-10 h-[calc(100vh-200px)] min-h-[500px]">
                    <NotesWidget userId={userId} chatId={chatId!} />
                </div>
            </div>
        );
    }

    // Main Dashboard View
    return (
        <div className="flex flex-col h-full bg-slate-900 text-white overflow-hidden">
            {/* Header Sprawy */}
            <div className="bg-slate-800/50 border-b border-slate-700/50 p-6 backdrop-blur-md">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onBack}
                            className="p-2 bg-slate-700/50 hover:bg-slate-700 rounded-xl transition-colors"
                        >
                            <ArrowLeftIcon className="w-5 h-5" />
                        </button>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="bg-violet-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter">PRO Strategy</span>
                                <span className="text-slate-500 text-xs">{lawArea}</span>
                            </div>
                            <h1 className="text-2xl font-bold">{topic}</h1>
                        </div>
                        <InfoIcon onClick={() => setIsHelpOpen(true)} className="ml-2" />
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">{t('pro.dashboard.progress_title')}</span>
                            <div className="flex gap-1 mt-1">
                                <div className={`h-1.5 w-10 rounded-full ${stepStatus[ProStep.Documents] === 'completed' ? 'bg-violet-500' : 'bg-slate-700'}`}></div>
                                <div className={`h-1.5 w-10 rounded-full ${stepStatus[ProStep.Interview] === 'completed' ? 'bg-violet-500' : 'bg-slate-700'}`}></div>
                                <div className={`h-1.5 w-10 rounded-full ${stepStatus[ProStep.Analysis] === 'completed' ? 'bg-violet-500' : 'bg-slate-700'}`}></div>
                                <div className={`h-1.5 w-10 rounded-full ${stepStatus[ProStep.Court] === 'completed' ? 'bg-cyan-500' : 'bg-slate-700'}`}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Dashboard Tiles */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-6xl mx-auto py-10">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <ProDashboardTile
                            onClick={() => setActiveStep(ProStep.Documents)}
                            icon={<DocumentTextIcon className="w-8 h-8" />}
                            title={t('pro.dashboard.tile_docs_title')}
                            description={t('pro.dashboard.tile_docs_desc')}
                            buttonText={stepStatus[ProStep.Documents] === 'completed' ? t('pro.dashboard.tile_docs_btn_manage') : t('pro.dashboard.tile_docs_btn')}
                            isCompleted={stepStatus[ProStep.Documents] === 'completed'}
                        />

                        <ProDashboardTile
                            onClick={() => setActiveStep(ProStep.Interview)}
                            icon={<UserGroupIcon className="w-8 h-8" />}
                            title={t('pro.dashboard.tile_interview_title')}
                            description={t('pro.dashboard.tile_interview_desc')}
                            buttonText={t('pro.dashboard.tile_interview_btn')}
                            isCompleted={stepStatus[ProStep.Interview] === 'completed'}
                            isDisabled={!(stepStatus[ProStep.Documents] === 'completed' || stepStatus[ProStep.Interview] === 'completed')}
                        />

                        <ProDashboardTile
                            onClick={() => setActiveStep(ProStep.Analysis)}
                            icon={<ScaleIcon className="w-8 h-8" />}
                            title={t('pro.dashboard.tile_analysis_title')}
                            description={t('pro.dashboard.tile_analysis_desc')}
                            buttonText={t('pro.dashboard.tile_analysis_btn')}
                            isCompleted={stepStatus[ProStep.Analysis] === 'completed'}
                            isDisabled={!(stepStatus[ProStep.Interview] === 'completed')}
                        />

                        <ProDashboardTile
                            onClick={() => setActiveStep(ProStep.Court)}
                            icon={<GavelIcon className="w-8 h-8" />}
                            title={t('pro.dashboard.tile_court_title')}
                            description={t('pro.dashboard.tile_court_desc')}
                            buttonText={t('pro.dashboard.tile_court_btn')}
                            isCompleted={stepStatus[ProStep.Court] === 'completed'}
                            isDisabled={!(stepStatus[ProStep.Analysis] === 'completed')}
                            isCyan
                        />

                        <ProDashboardTile
                            onClick={() => setActiveStep(ProStep.Notes)}
                            icon={<DocumentTextIcon className="w-8 h-8" />}
                            title={t('pro.dashboard.tile_notes_title')}
                            description={t('pro.dashboard.tile_notes_desc')}
                            buttonText={t('pro.dashboard.tile_notes_btn')}
                        />
                    </div>

                    <div className="mt-16 bg-slate-800/30 border border-slate-700/30 rounded-3xl p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <ClockIcon className="w-6 h-6 text-violet-400" />
                            <h4 className="font-bold text-lg">{t('pro.dashboard.strategy_title')}</h4>
                        </div>
                        <p className="text-slate-400 text-sm italic">
                            {t('pro.dashboard.strategy_desc')}
                        </p>
                    </div>
                </div>
            </div>

            <HelpModal
                isOpen={isHelpOpen}
                onClose={() => setIsHelpOpen(false)}
                title={t('pro.dashboard.main_help_title')}
            >
                <div className="space-y-4 text-sm">
                    <p>{t('pro.dashboard.main_help_desc')}</p>
                    <ol className="list-decimal pl-5 space-y-3">
                        <li><strong className="text-violet-400">{t('pro.dashboard.tile_docs_title').split('.')[1]}:</strong> {t('pro.dashboard.main_help_point_1')}</li>
                        <li><strong className="text-violet-400">{t('pro.dashboard.tile_interview_title').split('.')[1]}:</strong> {t('pro.dashboard.main_help_point_2')}</li>
                        <li><strong className="text-violet-400">{t('pro.dashboard.tile_analysis_title').split('.')[1]}:</strong> {t('pro.dashboard.main_help_point_3')}</li>
                    </ol>
                    <p className="italic text-slate-500 mt-2">{t('pro.dashboard.main_help_footer')}</p>
                </div>
            </HelpModal>
        </div>
    );
};

export default ProDashboard;
