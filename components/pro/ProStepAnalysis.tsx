import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    ArrowLeftIcon,
    MagicWandIcon,
    ScaleIcon,
    ArrowsContractIcon,
    ArrowsExpandIcon,
    SendIcon,
    BriefcaseIcon
} from '../Icons';
import { InfoIcon } from '../InfoIcon';
import HelpModal from '../HelpModal';
import ChatBubble from '../ChatBubble';
import { ChatMessage, LawArea, FeatureFlags } from '../../types';

interface ProStepAnalysisProps {
    onBack: () => void;
    messages: ChatMessage[];
    isLoading: boolean;
    handleGenerateAnalysis: () => Promise<void>;
    handleSendMessage: (isDeepThinkingEnabled?: boolean) => Promise<void>;
    scrollRef: React.RefObject<HTMLDivElement>;
    isFullScreen: boolean;
    setIsFullScreen: (val: boolean) => void;
    isDeepThinkingEnabled: boolean;
    setIsDeepThinkingEnabled: (val: boolean) => void;
    currentInput: string;
    setCurrentInput: (val: string) => void;
    onAddNote?: (content: string, linkedMsg?: string, noteId?: string, linkedRole?: 'user' | 'model' | 'system') => void;
    onDeleteNote?: (noteId: string) => void;
    onUpdateNotePosition?: (noteId: string, position: { x: number, y: number } | null) => void;
    onSelectInteractionMode?: (mode: any) => void;
    existingNotes?: any[];
    lawArea: LawArea;
    topic: string;
    isHelpOpen: boolean;
    setIsHelpOpen: (val: boolean) => void;
    features: FeatureFlags;
}

const ProStepAnalysis: React.FC<ProStepAnalysisProps> = ({
    onBack,
    messages,
    isLoading,
    handleGenerateAnalysis,
    handleSendMessage,
    scrollRef,
    isFullScreen,
    setIsFullScreen,
    isDeepThinkingEnabled,
    setIsDeepThinkingEnabled,
    currentInput,
    setCurrentInput,
    onAddNote,
    onDeleteNote,
    onUpdateNotePosition,
    onSelectInteractionMode,
    existingNotes,
    lawArea,
    topic,
    isHelpOpen,
    setIsHelpOpen,
    features
}) => {
    const { t } = useTranslation();

    const reportIndex = [...messages].reverse().findIndex(m => m.role === 'model' && m.content.includes('MOCNE STRONY'));
    const actualReportIndex = reportIndex !== -1 ? messages.length - 1 - reportIndex : -1;
    const reportMessage = actualReportIndex !== -1 ? messages[actualReportIndex] : null;
    const followUpMessages = actualReportIndex !== -1 ? messages.slice(actualReportIndex + 1) : [];

    return (
        <div className="flex flex-col h-full bg-slate-900 text-white overflow-hidden relative">
            {!isFullScreen && (
                <div className="p-4 border-b border-slate-700 flex items-center justify-between bg-slate-800/50 backdrop-blur-md z-10 gap-2">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors flex-shrink-0"
                    >
                        <ArrowLeftIcon className="w-5 h-5" />
                        <span className="hidden md:inline">{t('pro.dashboard.dashboard_label')}</span>
                    </button>
                    <h2 className="font-bold text-violet-400 flex items-center gap-1.5 text-xs md:text-base max-w-[60%] md:max-w-full">
                        <span className="truncate">{t('pro.analysis.step_title')}</span>
                        <InfoIcon onClick={() => setIsHelpOpen(true)} className="flex-shrink-0" />
                    </h2>
                    <div className="w-8 md:w-24 flex-shrink-0"></div>
                </div>
            )}

            {isLoading && !reportMessage && (
                <div className="absolute inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-300">
                    <div className="relative">
                        <div className="w-20 h-20 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin"></div>
                        <MagicWandIcon className="w-8 h-8 text-violet-400 absolute inset-0 m-auto animate-pulse" />
                    </div>
                    <h2 className="text-xl font-bold mt-6 text-white tracking-tight">{t('pro.analysis.creating_report')}</h2>
                    <p className="text-slate-400 text-sm mt-2 animate-pulse">{t('pro.analysis.analyzing_desc')}</p>
                </div>
            )}

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 scroll-smooth">
                <div className="max-w-4xl mx-auto w-full pb-10">
                    <div className="flex items-center justify-between mb-8">
                        <h1 className="text-3xl font-bold">{t('pro.analysis.main_title')}</h1>
                        <button
                            onClick={handleGenerateAnalysis}
                            disabled={isLoading}
                            className="bg-violet-600 hover:bg-violet-500 px-6 py-2 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg disabled:opacity-50"
                        >
                            <MagicWandIcon className="w-4 h-4" />
                            <span>{t('pro.analysis.refresh_btn')}</span>
                        </button>
                    </div>

                    {reportMessage && (
                        <div className="mb-12">
                            <ChatBubble
                                message={reportMessage}
                                onAddNote={onAddNote ? (content, linkedMsg, noteId) => onAddNote(content, linkedMsg, noteId, 'model') : undefined}
                                existingNotes={existingNotes?.filter(n =>
                                    n.linkedMessage === reportMessage.content.substring(0, 50) &&
                                    (!n.linkedRole || n.linkedRole === 'model')
                                )}
                                onDeleteNote={onDeleteNote}
                                onUpdateNotePosition={onUpdateNotePosition}
                                lawArea={lawArea}
                                topic={topic}
                            />
                        </div>
                    )}

                    {followUpMessages.length > 0 && (
                        <div className="space-y-6 mt-12 border-t border-slate-800 pt-12 pb-24">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="h-px flex-1 bg-slate-800"></div>
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Dyskusja nad raportem</span>
                                <div className="h-px flex-1 bg-slate-800"></div>
                            </div>
                            {followUpMessages.map((m, i) => (
                                <ChatBubble
                                    key={i}
                                    message={m}
                                    onAddNote={onAddNote ? (content, linkedMsg, noteId) => onAddNote(content, linkedMsg, noteId, m.role === 'model' ? 'model' : 'user') : undefined}
                                    existingNotes={existingNotes?.filter(n =>
                                        n.linkedMessage === m.content.substring(0, 50) &&
                                        (!n.linkedRole || n.linkedRole === (m.role === 'model' ? 'model' : 'user'))
                                    )}
                                    onDeleteNote={onDeleteNote}
                                    onUpdateNotePosition={onUpdateNotePosition}
                                    lawArea={lawArea}
                                    topic={topic}
                                />
                            ))}
                            {isLoading && <div className="text-slate-500 text-sm animate-pulse italic">Asystent analizuje raport...</div>}
                        </div>
                    )}

                    {!reportMessage && !isLoading && (
                        <div className="text-center py-20">
                            <ScaleIcon className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                            <p className="text-slate-500 italic mb-8">Nie wygenerowano jeszcze raportu końcowego.</p>
                            <button
                                onClick={handleGenerateAnalysis}
                                className="bg-violet-600/20 text-violet-400 border border-violet-500/30 px-8 py-3 rounded-2xl font-bold hover:bg-violet-600/30 transition-all"
                            >
                                GENERUJ RAPORT TERAZ
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {reportMessage && (
                <div className="p-4 bg-slate-800/80 border-t border-slate-700 backdrop-blur-md">
                    <div className="flex flex-col gap-3 max-w-4xl mx-auto">
                        {!isFullScreen && (
                            <div className="flex items-center gap-2 px-1 py-1 text-[10px] opacity-70">
                                <ScaleIcon className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                                <span className="text-slate-400 font-semibold uppercase tracking-wider">Tryb: Analiza Strategiczna</span>
                                <span className="text-slate-600">|</span>
                                <BriefcaseIcon className="w-3 h-3 text-amber-400 flex-shrink-0" />
                                <span className="text-amber-400 font-semibold truncate uppercase tracking-wider">{topic}</span>
                            </div>
                        )}

                        {!isFullScreen && (
                            <div className="flex items-center justify-between gap-3 flex-wrap">
                                {features.enable_deep_thinking && (
                                    <div className="flex items-center">
                                        <label htmlFor="pro-analysis-deep-thinking-toggle" className="text-[10px] sm:text-xs leading-tight font-medium text-slate-400 mr-2 cursor-pointer flex flex-col items-center">
                                            {t('chat.deepThinking')}
                                        </label>
                                        <button
                                            id="pro-analysis-deep-thinking-toggle"
                                            onClick={() => setIsDeepThinkingEnabled(!isDeepThinkingEnabled)}
                                            className={`relative inline-flex items-center h-5 rounded-full w-10 transition-colors ${isDeepThinkingEnabled ? 'bg-cyan-600' : 'bg-slate-600'}`}
                                        >
                                            <span className={`inline-block w-3.5 h-3.5 transform bg-white rounded-full transition-transform ${isDeepThinkingEnabled ? 'translate-x-5.5' : 'translate-x-1'}`} />
                                        </button>
                                    </div>
                                )}

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setIsFullScreen(!isFullScreen)}
                                        className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors border border-slate-700 bg-slate-800/50"
                                        title={isFullScreen ? "Wyjdź z pełnego ekranu" : "Pełny ekran"}
                                    >
                                        {isFullScreen ? <ArrowsContractIcon className="h-5 w-5" /> : <ArrowsExpandIcon className="h-5 w-5" />}
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-2">
                            {isFullScreen && (
                                <button
                                    onClick={() => setIsFullScreen(false)}
                                    className="p-3 text-slate-400 hover:text-cyan-400 rounded-xl transition-colors border border-slate-700 bg-slate-900/50"
                                    title="Wyjdź z pełnego ekranu"
                                >
                                    <ArrowsContractIcon className="w-5 h-5 transition-transform group-active:scale-90" />
                                </button>
                            )}
                            <input
                                type="text"
                                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-violet-500 transition-all placeholder:text-slate-600"
                                placeholder="Zadaj pytanie do raportu lub odpowiedz Asystentowi..."
                                value={currentInput}
                                onChange={(e) => setCurrentInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(isDeepThinkingEnabled)}
                            />
                            <button
                                onClick={() => handleSendMessage(isDeepThinkingEnabled)}
                                disabled={isLoading || !currentInput.trim()}
                                className="p-3 bg-violet-600 rounded-xl hover:bg-violet-500 transition-colors disabled:opacity-50 shadow-lg shadow-violet-900/20"
                            >
                                <SendIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <HelpModal
                isOpen={isHelpOpen}
                onClose={() => setIsHelpOpen(false)}
                title="Etap 3: Raport - Pomoc"
            >
                <div className="space-y-4 text-sm">
                    <p>To wynik całej naszej pracy. Raport Strategiczny zawiera kompleksową ocenę Twojej sytuacji prawnej.</p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>SWOT:</strong> Jasno zdefiniowane mocne i słabe strony Twojej sprawy.</li>
                        <li><strong>Szanse:</strong> Szacunkowa ocena prawdopodobieństwa sukcesu w procentach.</li>
                        <li><strong>Dyskusja:</strong> Poniżej raportu możesz kontynuować rozmowę – dopytać o niezrozumiałe kwestie lub poprosić o rozwinięcie konkretnego punktu strategii.</li>
                    </ul>
                </div>
            </HelpModal>
        </div>
    );
};

export default ProStepAnalysis;
