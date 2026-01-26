import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { SendIcon, PaperClipIcon } from '../Icons';

interface AndromedaInputProps {
    onSend: (input: string) => void;
    onFileUpload: (file: File) => void;
    isLoading: boolean;
}

const AndromedaInput: React.FC<AndromedaInputProps> = ({ onSend, onFileUpload, isLoading }) => {
    const { t } = useTranslation();
    const [input, setInput] = useState('');
    const [placeholderIndex, setPlaceholderIndex] = useState(0);
    const [isPlaceholderVisible, setIsPlaceholderVisible] = useState(true);
    const placeholders = t('andromeda.placeholders', { returnObjects: true }) as string[];

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [input]);

    // Rotating placeholders logic
    useEffect(() => {
        const interval = setInterval(() => {
            setIsPlaceholderVisible(false);
            setTimeout(() => {
                setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
                setIsPlaceholderVisible(true);
            }, 600);
        }, 4500);
        return () => clearInterval(interval);
    }, [placeholders.length]);

    const handleSend = () => {
        if (!input.trim() || isLoading) return;
        onSend(input);
        setInput('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onFileUpload(file);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <footer className="relative z-10 p-4 md:p-6 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent">
            <div className="max-w-3xl mx-auto relative group">
                <div className="absolute inset-0 bg-cyan-600/5 blur-xl group-focus-within:bg-cyan-600/10 transition-colors rounded-2xl" />
                <div className="relative flex flex-col bg-slate-900/80 border border-slate-800 group-focus-within:border-cyan-500/50 rounded-2xl transition-all backdrop-blur-xl shadow-2xl overflow-hidden">
                    {!input && (
                        <div className={`absolute top-0 left-0 w-full px-4 py-4 text-slate-500 text-sm md:text-base pointer-events-none transition-all duration-700 ease-in-out ${isPlaceholderVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1'}`}>
                            {placeholders[placeholderIndex]}
                        </div>
                    )}
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="w-full bg-transparent px-4 py-4 text-white focus:outline-none resize-none min-h-[60px] max-h-[300px] text-sm md:text-base relative z-10"
                        rows={1}
                    />
                    <div className="flex items-center justify-between px-4 pb-4">
                        <div className="flex items-center gap-2 md:gap-4">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                                accept=".txt,.md,.json,.csv,.xml"
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isLoading}
                                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all border border-transparent hover:border-slate-600"
                                title={t('andromeda.uploadFile')}
                            >
                                <PaperClipIcon className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleSend}
                                disabled={!input.trim() || isLoading}
                                className={`p-2 rounded-xl transition-all ${input.trim() && !isLoading
                                    ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/40 hover:scale-105 active:scale-95'
                                    : 'bg-slate-800 text-slate-600'
                                    }`}
                            >
                                <SendIcon className="w-5 h-5 font-bold" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default AndromedaInput;
