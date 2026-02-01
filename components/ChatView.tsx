import React, { useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { InteractionMode } from '../types';
import CaseDashboard from './CaseDashboard';
import ChatBubble from './ChatBubble';
import LoadingSpinner from './LoadingSpinner';
import { useAppContext, useChatContext } from '../context';

const ChatView: React.FC = () => {
    const { t } = useTranslation();
    const {
        user,
        selectedLawArea,
        selectedTopic,
        interactionMode,
        setInteractionMode,
        setCourtRole,
        isLocalOnly,
        currentChatId,
        activeCustomAgent
    } = useAppContext();

    const {
        chatHistory,
        isLoading,
        chatNotes,
        handleAddNote,
        deleteNote,
        handleUpdateNotePosition,
        handleSendMessage,
    } = useChatContext();

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const caseDashboardRef = useRef<any>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [chatHistory, isLoading]);

    const handlePreviewDocument = (rawContent: string) => {
        // This will be handled by UIContext/App modals for now
    };

    const handleAddDeadline = (date: string, title: string, description: string) => {
        // This should probably move to ChatContext or a dedicated hook
    };

    const handleAddTask = (text: string) => {
        // This should probably move to ChatContext or a dedicated hook
    };

    if (!user || !currentChatId) return null;

    return (
        <div className="flex flex-col h-full bg-slate-900">
            <div className="flex flex-col h-full overflow-hidden">
                <div className="sticky top-0 z-20 bg-slate-800/95 backdrop-blur-sm border-b border-slate-700/50 p-4 hidden md:block" data-case-dashboard>
                    <div className="max-w-4xl mx-auto">
                        <CaseDashboard
                            ref={caseDashboardRef}
                            userId={user.uid}
                            caseId={currentChatId}
                            isLocalOnly={isLocalOnly}
                            onChangeMode={() => {
                                setInteractionMode(null);
                                setCourtRole(null);
                            }}
                        />
                    </div>
                </div>

                {activeCustomAgent && (
                    <div className="bg-gradient-to-r from-violet-600/10 to-transparent border-b border-violet-500/20 px-8 py-2 md:py-3 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="w-8 h-8 md:w-10 md:h-10 bg-violet-600 rounded-full flex items-center justify-center text-xs md:text-sm font-black text-white shadow-lg shadow-violet-500/20">
                            {activeCustomAgent.name.substring(0, 1)}
                        </div>
                        <div>
                            <p className="text-[10px] md:text-xs text-violet-400 font-bold uppercase tracking-wider leading-tight">Twój Agent AI</p>
                            <p className="text-sm md:text-base text-white font-semibold leading-tight">{activeCustomAgent.name}</p>
                        </div>
                        <div className="ml-auto">
                            <span className="text-[10px] md:text-xs bg-violet-500/20 text-violet-300 px-2 py-1 rounded-md font-medium border border-violet-500/30">PERSONA AKTYWNA</span>
                        </div>
                    </div>
                )}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
                    <div className="max-w-4xl mx-auto">
                        {interactionMode === InteractionMode.Analysis && (
                            <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/50 mb-4 flex items-center justify-between backdrop-blur-sm">
                                <div className="flex-1">
                                    <h3 className="text-sm font-semibold text-white mb-1">Faza: Analiza i Gromadzenie Wiedzy</h3>
                                    <p className="text-xs text-slate-400">Dostarcz niezbędne informacje i dokumenty przed uzyskaniem porady.</p>
                                </div>
                            </div>
                        )}
                        {chatHistory.filter(msg => msg.role !== 'system' && !msg.content.includes('[SYSTEM:')).map((msg, index) => (
                            <ChatBubble
                                key={index}
                                message={msg}
                                onPreviewDocument={handlePreviewDocument}
                                onAddDeadline={handleAddDeadline as any}
                                onAddTask={handleAddTask as any}
                                onAddNote={(content, linkedMsg, noteId) => handleAddNote(content, linkedMsg, noteId, msg.role as 'user' | 'model' | 'system')}
                                onSelectMode={(mode) => { /* handle select mode */ }}
                                onDeleteNote={deleteNote}
                                onUpdateNotePosition={handleUpdateNotePosition}
                                existingNotes={chatNotes.filter(n =>
                                    n.linkedMessage === msg.content.substring(0, 50) &&
                                    (!n.linkedRole || n.linkedRole === msg.role)
                                )}
                                lawArea={selectedLawArea || undefined}
                                topic={selectedTopic || undefined}
                            />
                        ))}
                        {isLoading && <LoadingSpinner />}
                        <div ref={messagesEndRef} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatView;
