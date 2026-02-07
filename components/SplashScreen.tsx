import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { SparklesIcon, ScaleIcon, ShieldCheckIcon, ChevronRightIcon } from './Icons';
import MonitorWrapper from './MonitorWrapper';

interface SplashScreenProps {
    onStart: () => void;
    isReady: boolean;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onStart, isReady }) => {
    const { t, i18n } = useTranslation();
    const [messageIndex, setMessageIndex] = useState(0);
    const [fade, setFade] = useState(true);
    const [isExiting, setIsExiting] = useState(false);
    const [minTimeElapsed, setMinTimeElapsed] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setMinTimeElapsed(true);
        }, 2000);

        const interval = setInterval(() => {
            setFade(false);
            // Delay the message swap slightly longer than the fade-out duration (1000ms)
            setTimeout(() => {
                const messages = t('splash.messages', { returnObjects: true }) as string[];
                setMessageIndex((prev) => (prev + 1) % messages.length);
                // Tiny extra delay before fading back in to ensure domestic re-paint
                setTimeout(() => {
                    setFade(true);
                }, 50);
            }, 1050);
        }, 6000); // 6s cycle for better reading pace

        return () => {
            clearTimeout(timer);
            clearInterval(interval);
        };
    }, [t]);

    const canStart = isReady && minTimeElapsed && !isExiting;

    const handleStart = () => {
        setIsExiting(true);
        setTimeout(() => {
            onStart();
        }, 500);
    };

    return (
        <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden transition-all duration-500 bg-[#0f172a] ${isExiting ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100'}`}>
            {/* Professional Background Gradient */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(30,41,59,1)_0%,rgba(15,23,42,1)_45%,rgba(8,10,18,1)_100%)]" />
            
            {/* Subtle Indigo/Navy Glow */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-900/10 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-900/10 blur-[120px] rounded-full" />

            {/* Discreet Language Switcher - Top Right */}
            <div className="absolute top-6 right-6 z-50 flex bg-slate-900/40 rounded-lg p-1 border border-white/5 backdrop-blur-md transition-all hover:bg-slate-900/60">
                {['PL', 'EN', 'ES'].map((lang) => (
                    <button
                        key={lang}
                        onClick={() => i18n.changeLanguage(lang.toLowerCase())}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                            i18n.language.startsWith(lang.toLowerCase())
                                ? 'bg-white/10 text-white shadow-sm'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        {lang}
                    </button>
                ))}
            </div>

            <div className="relative flex flex-col items-center max-w-2xl px-6 text-center">
                {/* Headline inside Monitor Wrapper */}
                <div className="mb-12 w-full animate-in fade-in slide-in-from-bottom-6 duration-1000">
                    <MonitorWrapper>
                        <h2 className="relative z-10 text-3xl md:text-5xl font-bold tracking-tight leading-[1.2] px-4 py-2 animate-neon" 
                            style={{ 
                                fontFamily: "'Outfit', sans-serif",
                                color: "#000000", // Pure black for "void" effect
                            }}>
                            {t('splash.headline')}
                        </h2>
                    </MonitorWrapper>
                </div>

                {/* Logo / Icon Area */}
                <div className="relative mb-12 animate-in fade-in zoom-in duration-1000 delay-300">
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

                {/* Action Button */}
                <div className="mb-12 min-h-[60px] flex items-center justify-center w-full">
                    {canStart ? (
                        <button
                            onClick={handleStart}
                            disabled={isExiting}
                            className="group relative px-10 py-4 bg-white/5 backdrop-blur-xl border border-white/10 text-white font-bold rounded-2xl shadow-[0_0_20px_rgba(6,182,212,0.15)] transition-all duration-500 hover:bg-white/10 hover:border-white/20 hover:scale-105 hover:shadow-[0_0_30px_rgba(6,182,212,0.3)] active:scale-95"
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-lg tracking-wide uppercase">{t('splash.start')}</span>
                                <ChevronRightIcon className="w-6 h-6 group-hover:translate-x-1.5 transition-transform duration-300 text-cyan-400" />
                            </div>
                            <div className="absolute inset-0 rounded-2xl border border-cyan-500/10 pointer-events-none" />
                        </button>
                    ) : (
                        <div className="flex flex-col items-center gap-4">
                            <div className="flex gap-1.5">
                                <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                                <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                                <div className="w-2 h-2 bg-cyan-700 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                            </div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.4em] translate-x-[0.2em]">{t('splash.preparing')}</span>
                        </div>
                    )}
                </div>

                {/* Marketing Messages - Layout Stable Container */}
                <div className="h-24 flex items-center justify-center px-4 overflow-hidden">
                    <p className={`m-0 text-xl md:text-2xl font-medium text-slate-200/90 text-center transition-opacity duration-1000 ease-in-out ${fade ? 'opacity-100' : 'opacity-0'}`} style={{ fontFamily: "'Outfit', sans-serif" }}>
                        {(t('splash.messages', { returnObjects: true }) as string[])[messageIndex]}
                    </p>
                </div>

                {/* Subtle Footer Meta */}
                <div className="mt-16 flex flex-col items-center opacity-40">
                    <div className="w-32 h-[1px] bg-gradient-to-r from-transparent via-slate-500 to-transparent" />
                    <p className="mt-4 text-[9px] text-slate-500 font-mono tracking-[0.3em] uppercase italic">{t('splash.credit')}</p>
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
                @keyframes neon-turn-on {
                    0% {
                        text-shadow: 
                            0 0 0 rgba(6,182,212,0);
                        opacity: 0.8;
                    }
                    100% {
                        text-shadow: 
                            0 0 5px rgba(6,182,212,0.8),
                            0 0 10px rgba(6,182,212,0.6),
                            0 0 20px rgba(6,182,212,0.4),
                            0 0 40px rgba(6,182,212,0.2);
                        opacity: 1;
                    }
                }
                .animate-float { animation: float 4s ease-in-out infinite; }
                .animate-bounce-slow { animation: bounce-slow 3s ease-in-out infinite; }
                .animate-neon { animation: neon-turn-on 3s ease-out forwards; }
            `}</style>
        </div>
    );
};

export default SplashScreen;
