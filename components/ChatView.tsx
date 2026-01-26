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
        currentChatId,
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
                            onChangeMode={() => {
                                setInteractionMode(null);
                                setCourtRole(null);
                            }}
                        />
                    </div>
                </div>
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
