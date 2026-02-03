import React, { useRef, useState, useEffect } from 'react';
import { useAndromeda } from '../hooks/useAndromeda';
import AndromedaSidebar from './andromeda/AndromedaSidebar';
import AndromedaChatView from './andromeda/AndromedaChatView';
import AndromedaInput from './andromeda/AndromedaInput';
import { AndromedaChat } from '../types';

interface AndromedaAssistantProps {
    onProceed: () => void;
    onProfileClick: () => void;
    language: string;
    onAddCost?: (cost: number) => void;
}

const AndromedaAssistant: React.FC<AndromedaAssistantProps> = ({ onProceed, onProfileClick, language, onAddCost }) => {
    const {
        history,
        isLoading,
        currentChatId,
        chats,
        userProfile,
        user,
        isLocalOnly,
        handleNewChat,
        handleSelectChat,
        handleDeleteChat,
        handleSend,
        handleFileUpload
    } = useAndromeda(language, onAddCost);

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [history, isLoading]);

    const onDeleteChatWrapper = (e: React.MouseEvent, chatId: string) => {
        e.stopPropagation();
        handleDeleteChat(chatId);
    };

    const onSelectChatWrapper = (chat: AndromedaChat) => {
        handleSelectChat(chat);
        setIsSidebarOpen(false);
    };

    const onNewChatWrapper = () => {
        handleNewChat();
        setIsSidebarOpen(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex bg-slate-950 text-slate-100 overflow-hidden font-sans h-[100dvh]">
            <AndromedaSidebar
                isSidebarOpen={isSidebarOpen}
                setIsSidebarOpen={setIsSidebarOpen}
                chats={chats}
                currentChatId={currentChatId}
                handleNewChat={onNewChatWrapper}
                handleSelectChat={onSelectChatWrapper}
                handleDeleteChat={onDeleteChatWrapper}
                isUserMenuOpen={isUserMenuOpen}
                setIsUserMenuOpen={setIsUserMenuOpen}
                userProfile={userProfile}
                onProfileClick={onProfileClick}
                isLocalOnly={isLocalOnly}
                user={user}
            />

            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            <div className="flex-1 flex flex-col relative h-full min-h-0">
                <AndromedaChatView
                    history={history}
                    isLoading={isLoading}
                    setIsSidebarOpen={setIsSidebarOpen}
                    onProceed={onProceed}
                    messagesEndRef={messagesEndRef}
                />

                <AndromedaInput
                    onSend={handleSend}
                    onFileUpload={handleFileUpload}
                    isLoading={isLoading}
                />
            </div>

            <style>{`
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 20px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #334155; }
                
                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
                .animate-float { animation: float 6s ease-in-out infinite; }
                @keyframes attention-blink {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.3; transform: scale(0.9); }
                }
                .animate-attention-blink {
                    animation: attention-blink 0.8s ease-in-out 5;
                }
            `}</style>
        </div>
    );
};

export default AndromedaAssistant;
