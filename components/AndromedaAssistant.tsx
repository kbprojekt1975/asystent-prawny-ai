import React, { useRef, useState, useEffect } from 'react';
import { useAndromeda } from '../hooks/useAndromeda';
import AndromedaSidebar from './andromeda/AndromedaSidebar';
import AndromedaChatView from './andromeda/AndromedaChatView';
import AndromedaInput from './andromeda/AndromedaInput';
import { AndromedaChat, FeatureFlags } from '../types';

interface AndromedaAssistantProps {
    onProceed: () => void;
    onProfileClick: () => void;
    language: string;
    onAddCost?: (cost: number) => void;
    features?: FeatureFlags;
}

const AndromedaAssistant: React.FC<AndromedaAssistantProps> = ({ onProceed, onProfileClick, language, onAddCost, features }) => {
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

            <div className={`flex-1 flex flex-col relative h-full min-h-0 ${features && !features.enable_andromeda ? 'opacity-50 pointer-events-none select-none grayscale' : ''}`}>
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

            {features && !features.enable_andromeda && (
                 <div className="absolute inset-x-0 top-0 bottom-0 lg:left-80 z-[60] flex items-center justify-center pointer-events-auto">
                    <div className="bg-slate-900 border border-slate-700 p-8 rounded-2xl shadow-2xl flex flex-col items-center">
                        <div className="w-4 h-4 bg-yellow-500 rounded-full animate-pulse mb-4" />
                        <h2 className="text-xl font-bold text-slate-200">PRACE SERWISOWE</h2>
                        <p className="text-slate-400 mt-2 text-center max-w-xs">
                            Moduł Andromeda jest obecnie aktualizowany.<br/>
                            Przepraszamy za utrudnienia.
                        </p>
                        <button 
                            onClick={onProceed}
                            className="mt-6 px-6 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-700"
                        >
                            Zamknij okno
                        </button>
                    </div>
                 </div>
            )}

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
