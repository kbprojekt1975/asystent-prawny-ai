import React from 'react';
import { useTranslation } from 'react-i18next';

interface FullScreenLoaderProps {
    isOverlay?: boolean;
    transparent?: boolean;
}

const FullScreenLoader: React.FC<FullScreenLoaderProps> = ({ isOverlay = false, transparent = false }) => {
    const { t } = useTranslation();

    return (
        <div className={`fixed inset-0 z-[10000] flex flex-col items-center justify-center transition-all duration-500 ${transparent ? 'bg-slate-900/60 backdrop-blur-md' : 'bg-slate-900'} overflow-hidden animate-in fade-in duration-500`}>
            {/* Background Effects */}
            {!transparent && (
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full animate-pulse" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
                </div>
            )}

            <div className="relative flex flex-col items-center max-w-sm px-6 text-center">
                {/* Spinner */}
                <div className="w-16 h-16 rounded-full border-4 border-slate-700/50 border-t-cyan-500 animate-spin mb-8 shadow-2xl shadow-cyan-500/20"></div>

                {/* Loading Text */}
                <div className="flex items-center gap-3 animate-pulse">
                    <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                        <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                        <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">
                        {t('splash.preparing') || "PRZYGOTOWYWANIE APLIKACJI..."}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default FullScreenLoader;
