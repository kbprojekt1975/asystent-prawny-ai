import React from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshIcon, SendIcon } from '../Icons';

interface AlimonyChatProps {
    chatHistory: { role: 'user' | 'model', content: string }[];
    isTyping: boolean;
    chatInput: string;
    setChatInput: (val: string) => void;
    handleSendChat: () => Promise<void>;
    resetChat: () => void;
}

const AlimonyChat: React.FC<AlimonyChatProps> = ({
    chatHistory,
    isTyping,
    chatInput,
    setChatInput,
    handleSendChat,
    resetChat
}) => {
    const { t } = useTranslation();

    return (
        <div className="flex-[0.6] md:flex-1 bg-slate-950/50 flex flex-col border-t md:border-t-0 md:border-l border-slate-700 animate-in slide-in-from-bottom md:slide-in-from-right duration-300">
            <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
                <span className="text-sm font-bold text-violet-400 uppercase tracking-wider">{t('alimonyCalculator.chat.title')}</span>
                <button
                    onClick={resetChat}
                    className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                    title={t('alimonyCalculator.chat.clearHistory')}
                >
                    <RefreshIcon className="w-4 h-4" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {chatHistory.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-violet-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'}`}>
                            {msg.content}
                        </div>
                    </div>
                ))}
                {isTyping && (
                    <div className="flex justify-start">
                        <div className="bg-slate-800 p-3 rounded-2xl rounded-tl-none border border-slate-700">
                            <div className="flex gap-1">
                                <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-100"></div>
                                <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-200"></div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="p-4 bg-slate-900/50 border-t border-slate-800">
                <form
                    onSubmit={(e) => { e.preventDefault(); handleSendChat(); }}
                    className="relative"
                >
                    <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder={t('alimonyCalculator.chat.inputPlaceholder')}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-4 pr-12 text-sm text-white focus:border-violet-500 outline-none"
                    />
                    <button
                        type="submit"
                        disabled={!chatInput.trim() || isTyping}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 rounded-lg transition-colors text-white"
                    >
                        <SendIcon className="w-4 h-4" />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AlimonyChat;
