import React from 'react';
import { useTranslation } from 'react-i18next';

const MaintenanceScreen: React.FC = () => {
    const { t } = useTranslation();

    return (
        <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center p-4">
            <div className="relative">
                {/* Pulsing rings */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-yellow-500/10 rounded-full animate-ping delay-75" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-yellow-500/20 rounded-full animate-pulse" />
                
                {/* Icon Container */}
                <div className="relative z-10 w-32 h-32 bg-slate-900 border-2 border-yellow-500/50 rounded-2xl flex items-center justify-center shadow-[0_0_50px_rgba(234,179,8,0.3)]">
                    <svg className="w-16 h-16 text-yellow-500 animate-[spin_10s_linear_infinite]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </div>
            </div>

            <h1 className="mt-12 text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600 tracking-tight text-center">
                PRACE SERWISOWE
            </h1>
            
            <p className="mt-6 text-slate-400 text-center max-w-md text-sm md:text-base leading-relaxed">
                Wprowadzamy ulepszenia do systemu AI. <br />
                Aplikacja jest chwilowo niedostępna. Prosimy o cierpliwość.
            </p>

            <div className="mt-8 flex items-center gap-3 px-4 py-2 bg-slate-900/50 rounded-full border border-slate-800">
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                <span className="text-xs font-mono text-yellow-500/80">SYSTEM MAINTENANCE IN PROGRESS</span>
            </div>
        </div>
    );
};

export default MaintenanceScreen;
