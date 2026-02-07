import React from 'react';
import { useTranslation } from 'react-i18next';
import { SparklesIcon, Bars3Icon, BotIcon, InformationCircleIcon } from '../Icons';
import { ChatMessage } from '../../types';
import LoadingSpinner from '../LoadingSpinner';

interface AndromedaChatViewProps {
    history: ChatMessage[];
    isLoading: boolean;
    setIsSidebarOpen: (open: boolean) => void;
    onProceed: () => void;
    messagesEndRef: React.RefObject<HTMLDivElement>;
}

const AndromedaChatView: React.FC<AndromedaChatViewProps> = ({
    history,
    isLoading,
    setIsSidebarOpen,
    onProceed,
    messagesEndRef
}) => {
    const { t } = useTranslation();

    return (
        <div className="flex-1 flex flex-col relative min-h-0">
            {/* Ambient Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-900/10 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-900/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
            </div>

            {/* Header */}
            <header className="flex-none relative z-10 px-4 md:px-6 py-4 flex items-center justify-between border-b border-slate-800/50 backdrop-blur-md bg-slate-900/40">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="lg:hidden p-2 -ml-2 text-slate-400 hover:text-white transition-colors"
                    >
                        <Bars3Icon className="w-6 h-6" />
                    </button>
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-900/20">
                        <SparklesIcon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                    </div>
                    <div className="relative group">
                        <div className="flex items-center gap-2">
                            <h1 className="text-base md:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 tracking-tight">
                                Andromeda
                            </h1>
                            <div className="relative">
                                <button className="p-1 text-slate-500 hover:text-cyan-400 transition-colors focus:outline-none">
                                    <InformationCircleIcon className="w-4 h-4 md:w-5 md:h-5" />
                                </button>
                                
                                {/* Info Popover */}
                                <div className="absolute left-0 top-full mt-2 w-[85vw] md:w-[480px] p-6 bg-slate-900/95 border border-slate-700/50 rounded-2xl shadow-2xl backdrop-blur-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 pointer-events-none group-hover:pointer-events-auto">
                                    <h3 className="text-cyan-400 font-bold text-lg md:text-xl mb-3 flex items-center gap-3">
                                        <SparklesIcon className="w-5 h-5 md:w-6 md:h-6" />
                                        Tryb Strategiczny Andromeda
                                    </h3>
                                    <p className="text-sm md:text-base text-slate-300 leading-relaxed mb-4">
                                        Andromeda to Twój osobisty strateg procesowy. Łączy zaawansowaną analizę logiczną (Deep Thinking) z bezpośrednim dostępem do aktualnych baz prawa (ISAP) i orzecznictwa (SAOS).
                                    </p>
                                    <div className="space-y-3">
                                        {[
                                            { title: "Analiza Szans i Ryzyk", desc: "Precyzyjne oszacowanie prawdopodobieństwa wygranej i słabych punktów." },
                                            { title: "Symulacja Procesowa", desc: "Przewidywanie argumentów drugiej strony i pytań sądu." },
                                            { title: "Strategia \"Szachowa\"", desc: "Planowanie wieloetapowe, wykraczające poza proste porady." },
                                            { title: "Weryfikacja Dowodów", desc: "Ocena mocy Twojego materiału dowodowego w świetle prawa." },
                                            { title: "Argumentacja Prawna", desc: "Gotowe cytaty z ustaw i wyroków dopasowane do Twojej sprawy." }
                                        ].map((item, i) => (
                                            <div key={i} className="flex items-start gap-3">
                                                <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full mt-2 flex-shrink-0 shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
                                                <div>
                                                    <span className="text-slate-200 font-semibold text-sm block">{item.title}</span>
                                                    <span className="text-slate-400 text-xs md:text-sm leading-snug block">{item.desc}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between items-center">
                                        <span className="text-[10px] md:text-xs text-slate-500 italic">
                                            Powered by Gemini 1.5 Pro & Deep Thinking
                                        </span>
                                        <span className="text-[10px] md:text-xs text-cyan-500/80 font-mono border border-cyan-900/30 px-2 py-0.5 rounded bg-cyan-950/20">
                                            VERSION: ALPHA-OMEGA
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <p className="text-[8px] md:text-[10px] text-cyan-400 uppercase tracking-widest font-bold">{t('andromeda.subtitle')}</p>
                    </div>
                </div>

                <button
                    onClick={onProceed}
                    className="group relative p-3 bg-slate-800/40 hover:bg-slate-700/60 rounded-xl transition-all border border-slate-700/50 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-900/20"
                    title={t('app.homeGrid') || "Powrót do wyboru dziedziny"}
                >
                    <div className="grid grid-cols-3 gap-1 animate-attention-blink">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="w-1.5 h-1.5 bg-cyan-400 rounded-sm" />
                        ))}
                    </div>
                </button>
            </header>

            {/* Chat Area */}
            <main className="relative z-10 flex-1 overflow-y-auto px-4 md:px-6 py-6 md:py-8 min-h-0 scrollbar-hide">
                <div className="max-w-3xl mx-auto space-y-6 md:space-y-8">
                    {history.length === 0 && (
                        <div className="text-center py-10 md:py-20 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                            <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-slate-900 rounded-3xl border border-slate-800 mb-6 shadow-2xl relative">
                                <BotIcon className="w-8 h-8 md:w-10 md:h-10 text-cyan-400" />
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-4 border-slate-950 animate-pulse" />
                            </div>
                            <h2 className="text-xl md:text-3xl font-bold text-white mb-4 px-4">{t('andromeda.welcomeTitle')}</h2>
                            <p className="text-slate-400 text-sm md:text-lg max-w-md mx-auto leading-relaxed px-6">
                                {t('andromeda.welcomeDesc')}
                            </p>
                        </div>
                    )}

                    {history.map((msg, idx) => (
                        <div
                            key={idx}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}
                        >
                            <div className={`max-w-[90%] md:max-w-[85%] p-3 md:p-4 rounded-2xl ${msg.role === 'user'
                                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/20'
                                : 'bg-slate-900 border border-slate-800 text-slate-100 shadow-xl'
                                }`}>
                                <div className="prose prose-invert prose-xs md:prose-sm max-w-none whitespace-pre-wrap leading-relaxed">
                                    {msg.content}
                                </div>
                            </div>
                        </div>
                    ))}

                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center gap-3 shadow-xl">
                                <LoadingSpinner size="sm" color="cyan" />
                                <span className="text-sm text-slate-400 font-medium animate-pulse truncate">{t('andromeda.analyzingFile')}</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </main>
        </div>
    );
};

export default AndromedaChatView;
