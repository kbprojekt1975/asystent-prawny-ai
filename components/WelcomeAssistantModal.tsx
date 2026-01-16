import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { InteractionMode, ChatMessage, UserProfile } from '../types';

import { getLegalAdvice } from '../services/geminiService';
import { XIcon, SendIcon, SparklesIcon, ScaleIcon } from './Icons';
import LoadingSpinner from './LoadingSpinner';

interface WelcomeAssistantModalProps {
    isOpen: boolean;
    onClose: () => void;
    userProfile: UserProfile;
    onUpdateProfile: (profile: UserProfile) => void;
}

const WelcomeAssistantModal: React.FC<WelcomeAssistantModalProps> = ({ isOpen, onClose, userProfile, onUpdateProfile }) => {
    const { t, i18n } = useTranslation();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [dontShowAgain, setDontShowAgain] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && messages.length === 0) {
            setMessages([
                {
                    role: 'model',
                    content: t('welcome.intro_message')
                }
            ]);
        }
    }, [isOpen, messages.length, t]);

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
                'welcome-assistant',
                i18n.language
            );

            if (response && response.text) {
                setMessages([...newMessages, { role: 'model', content: response.text }]);
            }
        } catch (error) {
            console.error('Welcome Assistant Error:', error);
            setMessages([...newMessages, { role: 'model', content: t('welcome.error_message') }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        if (dontShowAgain) {
            onUpdateProfile({
                ...userProfile,
                hasSeenWelcomeAssistant: true
            });
        }
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-6 border-b border-slate-700 flex items-center justify-between bg-gradient-to-r from-slate-800 to-slate-900">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-cyan-500/20 rounded-xl">
                            <SparklesIcon className="w-6 h-6 text-cyan-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">{t('welcome.title')}</h2>
                            <p className="text-xs text-slate-400">{t('welcome.subtitle')}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-all"
                    >
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Chat Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-slate-900/50">
                    {/* Info Banner */}
                    <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-2xl p-4 mb-2 flex gap-4 items-start backdrop-blur-sm animate-guide-pulse">
                        <div className="p-2 bg-cyan-500/20 rounded-lg flex-shrink-0 mt-1">
                            <SparklesIcon className="w-5 h-5 text-cyan-400" />
                        </div>
                        <div>
                            <p className="text-sm text-cyan-50 text-white leading-relaxed font-medium">
                                {t('welcome.tip_text')}
                            </p>
                            <p className="text-xs text-cyan-400 mt-1 font-bold">
                                {t('welcome.tip_subtext')}
                            </p>
                        </div>
                    </div>

                    {messages.map((msg, idx) => (
                        <div
                            key={idx}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                                    ? 'bg-cyan-600 text-white rounded-tr-none shadow-lg shadow-cyan-900/20'
                                    : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-none'
                                    }`}
                            >
                                {msg.content}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-slate-800 p-4 rounded-2xl rounded-tl-none border border-slate-700">
                                <LoadingSpinner />
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Footer Controls */}
                <div className="p-6 border-t border-slate-700 bg-slate-800/50">
                    <div className="flex flex-col gap-4">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder={t('welcome.input_placeholder')}
                                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors shadow-inner"
                                disabled={isLoading}
                            />
                            <button
                                onClick={handleSend}
                                disabled={isLoading || !input.trim()}
                                className="px-5 bg-cyan-600 text-white rounded-xl hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-cyan-900/40 flex items-center justify-center"
                            >
                                <SendIcon className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        checked={dontShowAgain}
                                        onChange={(e) => setDontShowAgain(e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-5 h-5 border-2 border-slate-600 rounded-md peer-checked:bg-cyan-500 peer-checked:border-cyan-500 transition-all"></div>
                                    <svg className="absolute top-0.5 left-0.5 w-4 h-4 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <span className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">{t('welcome.dont_show')}</span>
                            </label>

                            <button
                                onClick={handleClose}
                                className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
                            >
                                {t('welcome.close')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WelcomeAssistantModal;
