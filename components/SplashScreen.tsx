import React, { useState, useEffect } from 'react';
import { SparklesIcon, ScaleIcon, ShieldCheckIcon, UserCircleIcon, ChevronRightIcon } from './Icons';

const MESSAGES = [
    // 1. Profesjonalny i rzeczowy
    "Twój osobisty asystent w świecie prawa.",
    "Przygotowujemy kompleksową analizę Twojej sprawy...",
    "Inteligentne wsparcie prawne dostępne 24/7.",
    "Od analizy dokumentów po strategię procesową.",
    // 2. Budujący pewność siebie
    "Wchodzisz na salę rozpraw z gotowym planem.",
    "Prawo staje się prostsze. Inicjalizacja...",
    "Wszystko, czego potrzebujesz do wygrania sprawy, w jednym miejscu.",
    "Twoje wsparcie w trudnych rozmowach i negocjacjach.",
    // 3. Technologiczny i innowacyjny
    "Potęga AI w służbie sprawiedliwości.",
    "Inteligentna analiza prawna na podstawie Twoich dokumentów.",
    "Łączymy wiedzę prawniczą z najnowszą technologią.",
    // 4. Skupiony na bezpieczeństwie
    "Twoje dane są bezpieczne i szyfrowane.",
    "Prywatność i prawo w Twoich rękach.",
    "Bezpieczne połączenie z Twoim asystentem prawnym..."
];

interface SplashScreenProps {
    onStart: () => void;
    isReady: boolean;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onStart, isReady }) => {
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
                setMessageIndex((prev) => (prev + 1) % MESSAGES.length);
                setFade(true);
            }, 500);
        }, 3500);

        return () => {
            clearTimeout(timer);
            clearInterval(interval);
        };
    }, []);

    const canStart = isReady && minTimeElapsed;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-slate-900 z-[9999] overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            <div className="relative flex flex-col items-center max-w-sm px-6 text-center">
                {/* Logo / Icon Area */}
                <div className="relative mb-12">
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
                                <span>ZACZYNAMY</span>
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
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">Przygotowanie...</span>
                        </div>
                    )}
                </div>

                {/* Marketing Messages */}
                <div className="h-24 flex items-center justify-center">
                    <p className={`text-lg md:text-xl font-medium text-white transition-all duration-500 ${fade ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                        {MESSAGES[messageIndex]}
                    </p>
                </div>

                {/* Footer Meta */}
                <div className="absolute bottom-[-150px] left-0 right-0 flex flex-col items-center">
                    <div className="w-48 h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 animate-loading-bar" />
                    </div>
                    <p className="mt-4 text-[10px] text-slate-500 font-mono tracking-widest uppercase italic">Secure Legal Environment v2.0</p>
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
