import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { SparklesIcon, ScaleIcon, ShieldCheckIcon, UserCircleIcon, ChevronRightIcon } from './Icons';

// Messages removed, will be loaded from translations

interface SplashScreenProps {
    onStart: () => void;
    isReady: boolean;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onStart, isReady }) => {
    const { t, i18n } = useTranslation();
    const [messageIndex, setMessageIndex] = useState(0);
    const [fade, setFade] = useState(true);
    const [minTimeElapsed, setMinTimeElapsed] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setMinTimeElapsed(true);
        }, 2500); // Gwarantowane 2.5s na hasła marketingowe

        const interval = setInterval(() => {
            setFade(false);
            setTimeout(() => {
                const messages = t('splash.messages', { returnObjects: true }) as string[];
                setMessageIndex((prev) => (prev + 1) % messages.length);
                setFade(true);
            }, 500);
        }, 3500);

        return () => {
            clearTimeout(timer);
            clearInterval(interval);
        };
    }, [t]);

    const changeLanguage = (lang: string) => {
        i18n.changeLanguage(lang);
        localStorage.setItem('i18nextLng', lang);
    };

    const canStart = isReady && minTimeElapsed;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-slate-900 z-[9999] overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            <div className="relative flex flex-col items-center max-w-sm px-6 text-center">
                {/* Language Switcher - Moved above icons */}
                <div className="mb-12 z-50 flex bg-slate-800/50 rounded-lg p-1 border border-slate-700/50 backdrop-blur-sm">
                    <button
                        onClick={() => changeLanguage('pl')}
                        className={`px-3 py-1.5 text-sm font-bold rounded-md transition-all ${i18n.language.startsWith('pl') ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/20' : 'text-slate-400 hover:text-white'}`}
                    >
                        PL
                    </button>
                    <button
                        onClick={() => changeLanguage('en')}
                        className={`px-3 py-1.5 text-sm font-bold rounded-md transition-all ${!i18n.language.startsWith('pl') ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/20' : 'text-slate-400 hover:text-white'}`}
                    >
                        EN
                    </button>
                </div>

                {/* Logo / Icon Area */}
                <div className="relative mb-8">
                    <div className="absolute inset-0 bg-cyan-500/20 blur-2xl rounded-full animate-pulse" />
                    <div className="relative flex items-center justify-center w-24 h-24 bg-slate-800 border border-slate-700/50 rounded-3xl shadow-2xl rotate-12 animate-float">
                        <SparklesIcon className="w-12 h-12 text-cyan-400" />
                    </div>
                    {/* Floating mini icons */}
                    <div className="absolute -top-4 -right-4 w-10 h-10 bg-slate-800 border border-slate-700/50 rounded-xl shadow-lg -rotate-12 flex items-center justify-center animate-bounce-slow">
                        <ScaleIcon className="w-5 h-5 text-amber-400" />
                    </div>
                    <div className="absolute -bottom-2 -left-6 w-10 h-10 bg-slate-800 border border-slate-700/50 rounded-xl shadow-lg rotate-6 flex items-center justify-center animate-bounce-slow" style={{ animationDelay: '0.5s' }}>
                        <ShieldCheckIcon className="w-5 h-5 text-emerald-400" />
                    </div>
                </div>

                {/* Loading Status / Action Button */}
                <div className="mb-8 min-h-[40px] flex items-center justify-center w-full">
                    {canStart ? (
                        <button
                            onClick={onStart}
                            className="group relative px-8 py-3 bg-gradient-to-r from-cyan-600 to-blue-700 text-white font-bold rounded-xl shadow-lg shadow-cyan-900/20 hover:shadow-cyan-500/30 hover:scale-105 active:scale-95 transition-all duration-300 animate-in fade-in zoom-in"
                        >
                            <div className="flex items-center gap-2">
                                <span>{t('splash.start')}</span>
                                <ChevronRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </button>
                    ) : (
                        <div className="flex items-center gap-3 animate-pulse">
                            <div className="flex gap-1">
                                <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                                <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                                <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                            </div>
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">{t('splash.preparing')}</span>
                        </div>
                    )}
                </div>

                {/* Marketing Messages */}
                <div className="h-24 flex items-center justify-center">
                    <p className={`text-lg md:text-xl font-medium text-white transition-all duration-500 ${fade ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                        {(t('splash.messages', { returnObjects: true }) as string[])[messageIndex]}
                    </p>
                </div>

                {/* Footer Meta */}
                <div className="absolute bottom-[-150px] left-0 right-0 flex flex-col items-center px-4">
                    <div className="w-48 h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 animate-loading-bar" />
                    </div>
                    <p className="mt-4 text-[8px] sm:text-[10px] text-slate-500 font-mono tracking-wider sm:tracking-widest uppercase italic text-center max-w-full">{t('splash.credit')}</p>
                    <p className="mt-1 text-[7px] sm:text-[9px] text-slate-600 font-mono tracking-wider sm:tracking-widest uppercase text-center">{t('splash.environment')}</p>
                </div>
            </div>

            <style>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0) rotate(12deg); }
                    50% { transform: translateY(-10px) rotate(15deg); }
                }
                @keyframes bounce-slow {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-5px); }
                }
                @keyframes loading-bar {
                    0% { width: 0%; transform: translateX(-100%); }
                    50% { width: 70%; transform: translateX(0); }
                    100% { width: 0%; transform: translateX(100%); }
                }
                .animate-float { animation: float 4s ease-in-out infinite; }
                .animate-bounce-slow { animation: bounce-slow 3s ease-in-out infinite; }
                .animate-loading-bar { animation: loading-bar 2s ease-in-out infinite; }
            `}</style>
        </div>
    );
};

export default SplashScreen;
