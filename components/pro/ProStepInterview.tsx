import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    ArrowLeftIcon,
    ScaleIcon,
    BriefcaseIcon,
    ArrowsContractIcon,
    ArrowsExpandIcon,
    SendIcon
} from '../Icons';
import { InfoIcon } from '../InfoIcon';
import HelpModal from '../HelpModal';
import ChatBubble from '../ChatBubble';
import { ChatMessage, LawArea } from '../../types';

interface ProStepInterviewProps {
    onBack: () => void;
    finishInterview: () => Promise<void>;
    messages: ChatMessage[];
    isLoading: boolean;
    isFullScreen: boolean;
    setIsFullScreen: (val: boolean) => void;
    isDeepThinkingEnabled: boolean;
    setIsDeepThinkingEnabled: (val: boolean) => void;
    currentInput: string;
    setCurrentInput: (val: string) => void;
    handleSendMessage: (isDeepThinkingEnabled?: boolean) => Promise<void>;
    scrollRef: React.RefObject<HTMLDivElement>;
    onAddNote?: (content: string, linkedMsg?: string, noteId?: string, linkedRole?: 'user' | 'model' | 'system') => void;
    onDeleteNote?: (noteId: string) => void;
    onUpdateNotePosition?: (noteId: string, position: { x: number, y: number } | null) => void;
    onSelectInteractionMode?: (mode: any) => void;
    existingNotes?: any[];
    lawArea: LawArea;
    topic: string;
    isHelpOpen: boolean;
    setIsHelpOpen: (val: boolean) => void;
}

const ProStepInterview: React.FC<ProStepInterviewProps> = ({
    onBack,
    finishInterview,
    messages,
    isLoading,
    isFullScreen,
    setIsFullScreen,
    isDeepThinkingEnabled,
    setIsDeepThinkingEnabled,
    currentInput,
    setCurrentInput,
    handleSendMessage,
    scrollRef,
    onAddNote,
    onDeleteNote,
    onUpdateNotePosition,
    onSelectInteractionMode,
    existingNotes,
    lawArea,
    topic,
    isHelpOpen,
    setIsHelpOpen
}) => {
    const { t } = useTranslation();

    return (
        <div className="flex flex-col h-full bg-slate-900 text-white overflow-hidden">
            {!isFullScreen && (
                <div className="p-4 border-b border-slate-700 flex items-center justify-between bg-slate-800/50 backdrop-blur-md gap-2">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors flex-shrink-0"
                    >
                        <ArrowLeftIcon className="w-5 h-5" />
                        <span className="hidden md:inline">{t('pro.dashboard.dashboard_label')}</span>
                    </button>
                    <h2 className="font-bold text-violet-400 flex items-center gap-1.5 text-xs md:text-base max-w-[60%] md:max-w-full">
                        <span className="truncate">{t('pro.dashboard.interview_stage')}</span>
                        <InfoIcon onClick={() => setIsHelpOpen(true)} className="flex-shrink-0" />
                    </h2>
                    <button
                        onClick={finishInterview}
                        className="text-[10px] md:text-xs bg-green-600/20 text-green-400 border border-green-500/30 px-2 md:px-3 py-1 rounded-full font-bold hover:bg-green-600/30 transition-all flex-shrink-0"
                    >
                        {t('pro.dashboard.finish_interview')}
                    </button>
                </div>
            )}

            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 custom-scrollbar"
            >
                <div className="max-w-4xl mx-auto space-y-4">
                    {messages.filter(m => m.role !== 'system' && !m.content.includes('[SYSTEM:')).map((m, i) => (
                        <ChatBubble
                            key={i}
                            message={m}
                            onAddNote={onAddNote ? (content, linkedMsg, noteId) => onAddNote(content, linkedMsg, noteId, m.role === 'model' ? 'model' : 'user') : undefined}
                            onSelectMode={onSelectInteractionMode}
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
                    {isLoading && <div className="text-slate-500 text-sm animate-pulse italic">{t('pro.dashboard.analyzing')}</div>}
                </div>
            </div>

            <div className="p-4 bg-slate-800/80 border-t border-slate-700">
                <div className="flex flex-col gap-3 max-w-4xl mx-auto">
                    {!isFullScreen && (
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                            <div className="flex items-center">
                                <label htmlFor="pro-deep-thinking-toggle" className="text-[10px] sm:text-xs leading-tight font-medium text-slate-400 mr-2 cursor-pointer flex flex-col items-center">
                                    <span>{t('pro.dashboard.deep_thinking').split(' ')[0]}</span>
                                    <span>{t('pro.dashboard.deep_thinking').split(' ')[1]}</span>
                                </label>
                                <button
                                    id="pro-deep-thinking-toggle"
                                    onClick={() => setIsDeepThinkingEnabled(!isDeepThinkingEnabled)}
                                    className={`relative inline-flex items-center h-5 rounded-full w-10 transition-colors ${isDeepThinkingEnabled ? 'bg-cyan-600' : 'bg-slate-600'}`}
                                >
                                    <span className={`inline-block w-3.5 h-3.5 transform bg-white rounded-full transition-transform ${isDeepThinkingEnabled ? 'translate-x-5.5' : 'translate-x-1'}`} />
                                </button>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setIsFullScreen(!isFullScreen)}
                                    className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors border border-slate-700 bg-slate-800/50"
                                    title={isFullScreen ? t('pro.dashboard.exit_fullscreen') : t('pro.dashboard.fullscreen')}
                                >
                                    {isFullScreen ? <ArrowsContractIcon className="h-5 w-5" /> : <ArrowsExpandIcon className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>
                    )}

                    {!isFullScreen && (
                        <div className="flex items-center gap-2 px-1 py-1 text-[10px] opacity-70">
                            <ScaleIcon className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                            <span className="text-slate-400 font-semibold uppercase tracking-wider">{t('pro.dashboard.context_mode')}</span>
                            <span className="text-slate-600">|</span>
                            <BriefcaseIcon className="w-3 h-3 text-amber-400 flex-shrink-0" />
                            <span className="text-amber-400 font-semibold truncate uppercase tracking-wider">{topic}</span>
                        </div>
                    )}
                    <div className="flex gap-2">
                        {isFullScreen && (
                            <button
                                onClick={() => setIsFullScreen(false)}
                                className="p-3 text-slate-400 hover:text-cyan-400 rounded-xl transition-colors border border-slate-700 bg-slate-900/50"
                                title={t('pro.dashboard.exit_fullscreen')}
                            >
                                <ArrowsContractIcon className="w-5 h-5 transition-transform group-active:scale-90" />
                            </button>
                        )}
                        <input
                            type="text"
                            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-violet-500 transition-all"
                            placeholder={t('pro.dashboard.input_placeholder')}
                            value={currentInput}
                            onChange={(e) => setCurrentInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(isDeepThinkingEnabled)}
                        />
                        <button
                            onClick={() => handleSendMessage(isDeepThinkingEnabled)}
                            disabled={isLoading || !currentInput.trim()}
                            className="p-3 bg-violet-600 rounded-xl hover:bg-violet-500 transition-colors disabled:opacity-50"
                        >
                            <SendIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            <HelpModal
                isOpen={isHelpOpen}
                onClose={() => setIsHelpOpen(false)}
                title={t('pro.dashboard.interview_help_title')}
            >
                <div className="space-y-4 text-sm">
                    <p>{t('pro.dashboard.interview_help_desc')}</p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>{t('pro.dashboard.interview_help_honest')}</li>
                        <li>{t('pro.dashboard.interview_help_dunno')}</li>
                        <li>{t('pro.dashboard.interview_help_finish')}</li>
                    </ul>
                </div>
            </HelpModal>
        </div>
    );
};

export default ProStepInterview;
