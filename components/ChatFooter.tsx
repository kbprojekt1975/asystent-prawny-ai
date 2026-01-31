import React, { useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    EllipsisHorizontalIcon,
    BrainIcon,
    DownloadIcon,
    UploadIcon,
    ArrowsContractIcon,
    ArrowsExpandIcon,
    AdjustmentsHorizontalIcon,
    PaperClipIcon,
    SendIcon
} from './Icons';
import QuickActions from './QuickActions';
import { useAppContext, useChatContext, useUIContext } from '../context';

const ChatFooter: React.FC = () => {
    const { t } = useTranslation();
    const {
        selectedLawArea,
        selectedTopic,
        interactionMode,
        servicePath,
        setSelectedLawArea,
        setSelectedTopic,
        setInteractionMode,
    } = useAppContext();

    const {
        currentMessage,
        setCurrentMessage,
        isLoading,
        isDeepThinkingEnabled,
        setIsDeepThinkingEnabled,
        handleSendMessage,
        handleGenerateKnowledge,
        handleFileUpload,
        handleExportChat,
        handleImportChat,
    } = useChatContext();

    const {
        isFullScreen,
        setIsFullScreen,
        setIsCaseManagementModalOpen,
        deferredPrompt,
    } = useUIContext();

    const [mobileToolbarAlwaysShow, setMobileToolbarAlwaysShow] = useState(() => {
        try {
            return localStorage.getItem('mobileToolbarAlwaysShow') === 'true';
        } catch {
            return false;
        }
    });

    const [isMobileToolbarOpen, setIsMobileToolbarOpen] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const toggleMobileToolbarAlwaysShow = () => {
        const newVal = !mobileToolbarAlwaysShow;
        setMobileToolbarAlwaysShow(newVal);
        localStorage.setItem('mobileToolbarAlwaysShow', String(newVal));
    };

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [currentMessage]);

    const handleQuickActionClick = (prompt: string) => {
        handleSendMessage(prompt);
    };

    if (!selectedTopic || !interactionMode || !servicePath || servicePath === 'pro') return null;

    const showQuickActions = !isLoading; // Simplified logic, can be refined

    return (
        <footer className={`bg-slate-900 transition-all duration-200 ${(!isMobileToolbarOpen && !mobileToolbarAlwaysShow && !isFullScreen) ? 'py-0.5 px-2 md:p-4' : 'p-2 md:p-4'}`}>
            <div className="max-w-4xl mx-auto">
                {showQuickActions && !isFullScreen && (
                    <div className={`${(!isMobileToolbarOpen && !mobileToolbarAlwaysShow) ? 'hidden md:block' : 'block'}`}>
                        <QuickActions interactionMode={interactionMode} onActionClick={handleQuickActionClick} />
                    </div>
                )}
                <div className={`flex flex-col gap-2 md:gap-3 ${(!isMobileToolbarOpen && !mobileToolbarAlwaysShow) ? 'mt-0 md:mt-3' : 'mt-1 md:mt-3'}`}>
                    {!isFullScreen && (
                        <>
                            <div className={`md:hidden ${(!isMobileToolbarOpen && !mobileToolbarAlwaysShow) ? 'block' : 'hidden'}`}>
                                <button
                                    onClick={() => setIsMobileToolbarOpen(true)}
                                    className="p-1 text-slate-500 hover:text-white transition-colors"
                                    title={t('mobile.toolbarOptions')}
                                >
                                    <EllipsisHorizontalIcon className="w-5 h-5" />
                                </button>
                            </div>

                            <div className={`${(!isMobileToolbarOpen && !mobileToolbarAlwaysShow) ? 'hidden md:flex' : 'flex'} flex-col md:flex-row md:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200 md:animate-none`}>
                                <div className="flex items-center justify-between gap-3 flex-wrap w-full">
                                    <div className="flex items-center">
                                        <label htmlFor="deep-thinking-toggle" className="text-[10px] sm:text-xs leading-tight font-medium text-slate-400 mr-2 cursor-pointer flex flex-col items-center">
                                            <span>{t('chat.deepThinking_l1')}</span>
                                            <span>{t('chat.deepThinking_l2')}</span>
                                        </label>
                                        <button
                                            id="deep-thinking-toggle"
                                            onClick={() => setIsDeepThinkingEnabled(!isDeepThinkingEnabled)}
                                            className={`relative inline-flex items-center h-5 rounded-full w-10 transition-colors ${isDeepThinkingEnabled ? 'bg-cyan-600' : 'bg-slate-600'}`}
                                        >
                                            <span className={`inline-block w-3.5 h-3.5 transform bg-white rounded-full transition-transform ${isDeepThinkingEnabled ? 'translate-x-[22px]' : 'translate-x-1'}`} />
                                        </button>



                                        <div className="flex items-center gap-1.5 ml-3 md:hidden border-l border-slate-700 pl-3">
                                            <button
                                                onClick={handleExportChat}
                                                className="p-1.5 text-slate-300 hover:text-cyan-400 rounded-lg transition-colors bg-slate-800/50 border border-slate-700"
                                                title="Eksportuj czat"
                                            >
                                                <DownloadIcon className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => document.getElementById('mobile-chat-import')?.click()}
                                                className="p-1.5 text-slate-300 hover:text-purple-400 rounded-lg transition-colors bg-slate-800/50 border border-slate-700"
                                                title="Importuj czat"
                                            >
                                                <UploadIcon className="w-4 h-4" />
                                            </button>
                                            <input
                                                id="mobile-chat-import"
                                                type="file"
                                                accept=".json"
                                                className="hidden"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        handleImportChat(file, (data) => {
                                                            setSelectedLawArea(data.lawArea);
                                                            setSelectedTopic(data.topic);
                                                            setInteractionMode(data.interactionMode);
                                                        });
                                                    }
                                                    e.target.value = '';
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-1 md:hidden">
                                            <button
                                                onClick={() => setIsFullScreen(!isFullScreen)}
                                                className={`p-1.5 text-slate-300 hover:text-white rounded-lg transition-colors border border-slate-700 ${isFullScreen ? 'bg-cyan-900/50 text-cyan-400 border-cyan-500/50' : 'bg-slate-800/50'}`}
                                                title={isFullScreen ? "Wyjdź z pełnego ekranu" : "Pełny ekran"}
                                            >
                                                {isFullScreen ? <ArrowsContractIcon className="w-4 h-4" /> : <ArrowsExpandIcon className="w-4 h-4" />}
                                            </button>
                                            <button
                                                onClick={() => setIsCaseManagementModalOpen(true)}
                                                className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors border border-slate-600 shadow-lg bg-slate-800/50"
                                                aria-label="Zarządzaj sprawą"
                                                title="Zarządzaj sprawą"
                                            >
                                                <AdjustmentsHorizontalIcon className="h-5 w-5 text-cyan-400" />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="md:hidden w-full flex items-center justify-between border-t border-slate-700/50 mt-2 pt-2">
                                    <button
                                        onClick={() => setIsMobileToolbarOpen(false)}
                                        className="text-[10px] text-slate-500 hover:text-white px-2 py-1 bg-slate-800/50 rounded hover:bg-slate-700 transition-colors"
                                    >
                                        {t('mobile.hide')}
                                    </button>
                                    <div className="flex items-center gap-2 cursor-pointer" onClick={toggleMobileToolbarAlwaysShow}>
                                        <span className="text-[10px] text-slate-400">{t('mobile.showAlways')}</span>
                                        <div className={`relative inline-flex items-center h-4 rounded-full w-8 transition-colors ${mobileToolbarAlwaysShow ? 'bg-cyan-600' : 'bg-slate-700'}`}>
                                            <span className={`inline-block w-2.5 h-2.5 transform bg-white rounded-full transition-transform ${mobileToolbarAlwaysShow ? 'translate-x-[18px]' : 'translate-x-1'}`} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    <div className="flex items-end gap-2 bg-slate-900/50 rounded-xl p-1.5 md:p-2 border border-slate-700/50">
                        {isFullScreen && (
                            <button
                                onClick={() => setIsFullScreen(false)}
                                className="p-1.5 md:p-2 text-slate-400 hover:text-cyan-400 rounded-lg border border-slate-700 bg-slate-900/50"
                                title="Wyjdź z pełnego ekranu"
                            >
                                <ArrowsContractIcon className="w-5 h-5" />
                            </button>
                        )}
                        <button onClick={() => document.getElementById('chat-file-upload')?.click()} className="p-1.5 md:p-2 text-slate-400 hover:text-cyan-400 rounded-lg"><PaperClipIcon className="w-5 h-5" /></button>
                        <input id="chat-file-upload" type="file" className="hidden" onChange={async (e) => { const file = e.target.files?.[0]; if (file) await handleFileUpload(file); e.target.value = ''; }} />
                        <textarea ref={textareaRef} value={currentMessage} onChange={(e) => setCurrentMessage(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }} placeholder={t('chat.messagePlaceholder')} className="w-full bg-transparent text-slate-200 placeholder-slate-400 focus:outline-none resize-none max-h-48 py-1 md:py-0" rows={1} disabled={isLoading} />
                        <button onClick={() => handleSendMessage()} disabled={isLoading || !currentMessage.trim()} className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white p-2 md:p-2.5 rounded-full"><SendIcon className="w-5 h-5" /></button>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default ChatFooter;
