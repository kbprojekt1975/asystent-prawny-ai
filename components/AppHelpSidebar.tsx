import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { InteractionMode, ChatMessage } from '../types';
import { getLegalAdvice } from '../services/geminiService';
import { XIcon, SendIcon, SparklesIcon, ScaleIcon } from './Icons';
import LoadingSpinner from './LoadingSpinner';

interface AppHelpSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    userId?: string;
}

const AppHelpSidebar: React.FC<AppHelpSidebarProps> = ({ isOpen, onClose, userId }) => {
    const { i18n } = useTranslation();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && messages.length === 0) {
            setMessages([
                {
                    role: 'model',
                    content: 'Witaj! Jestem Twoim asystentem aplikacji. W czym mogę Ci dzisiaj pomóc? Mogę wyjaśnić jak działają poszczególne funkcje, jak zarządzać sprawami lub jak korzystać z narzędzi AI.'
                }
            ]);
        }
    }, [isOpen, messages.length]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg: ChatMessage = { role: 'user', content: input };
        const newMessages = [...messages, userMsg];
        setMessages(newMessages);
        setInput('');
        setIsLoading(true);

        try {
            const response = await getLegalAdvice(
                newMessages,
                null as any,
                InteractionMode.AppHelp,
                'Asystent Aplikacji',
                false,
                undefined,
                'help-sidebar',
                i18n.language
            );

            if (response && response.text) {
                setMessages([...newMessages, { role: 'model', content: response.text }]);
            }
        } catch (error) {
            console.error('Help Sidebar Error:', error);
            setMessages([...newMessages, { role: 'model', content: 'Przepraszam, wystąpił błąd podczas ładowania odpowiedzi. Spróbuj ponownie później.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className={`fixed inset-y-0 right-0 w-80 md:w-96 bg-slate-900 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out border-l border-slate-700 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        >
            <div className="flex flex-col h-full">
                {/* Header */}
                <div className="p-4 border-b border-slate-700 flex items-center justify-between bg-slate-800/50">
                    <div className="flex items-center gap-2">
                        <SparklesIcon className="w-5 h-5 text-cyan-400" />
                        <h2 className="text-white font-semibold">Pomoc AI</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 text-slate-400 hover:text-white transition-colors"
                    >
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                    {messages.map((msg, idx) => (
                        <div
                            key={idx}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.role === 'user'
                                    ? 'bg-cyan-600 text-white rounded-tr-none'
                                    : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-none'
                                    }`}
                            >
                                {msg.content}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-slate-800 p-3 rounded-2xl rounded-tl-none border border-slate-700">
                                <LoadingSpinner />
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Info Box */}
                <div className="px-4 py-2 bg-slate-800/30 border-t border-slate-700/50">
                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                        <ScaleIcon className="w-3 h-3" />
                        <span>Tryb: Pomoc w obsłudze aplikacji</span>
                    </div>
                </div>

                {/* Input */}
                <div className="p-4 border-t border-slate-700 bg-slate-800/50">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Zadaj pytanie..."
                            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500"
                            disabled={isLoading}
                        />
                        <button
                            onClick={handleSend}
                            disabled={isLoading || !input.trim()}
                            className="p-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <SendIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AppHelpSidebar;
