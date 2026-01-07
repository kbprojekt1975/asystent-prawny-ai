import React from 'react';
import { CompassIcon } from './Icons';

interface LegalCompassHeroProps {
    onClick: () => void;
}

const LegalCompassHero: React.FC<LegalCompassHeroProps> = ({ onClick }) => {
    return (
        <div className="w-full max-w-6xl mb-10">
            <button
                onClick={onClick}
                className="w-full group relative overflow-hidden bg-slate-800/40 border border-slate-700/50 rounded-2xl p-8 flex flex-col md:flex-row items-center gap-8 hover:bg-slate-700/50 hover:border-cyan-500/50 transition-all duration-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            >
                {/* Background Gradient Effect */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-cyan-600/10 rounded-full blur-3xl group-hover:bg-cyan-500/20 transition-colors duration-700" />
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-colors duration-700" />

                <div className="relative z-10 w-20 h-20 bg-gradient-to-br from-cyan-500/20 to-blue-600/30 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-xl shadow-cyan-900/20 border border-cyan-500/20">
                    <CompassIcon className="w-10 h-10 text-cyan-400 group-hover:text-cyan-300 transition-colors" />
                </div>

                <div className="relative z-10 text-center md:text-left flex-1">
                    <h2 className="text-3xl font-bold text-white mb-2 tracking-tight group-hover:text-cyan-100 transition-colors">
                        Kompas Prawny
                    </h2>
                    <p className="text-xl text-slate-300 font-medium leading-relaxed">
                        Nie wiesz od czego zacząć? Masz pismo z sądu? <span className="text-cyan-400 font-semibold group-hover:underline decoration-cyan-400/50 underline-offset-4">Kliknij tutaj.</span>
                    </p>
                </div>

                <div className="relative z-10 hidden lg:block">
                    <div className="bg-slate-700/50 p-3 rounded-full group-hover:bg-cyan-600 group-hover:translate-x-2 transition-all duration-300">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                    </div>
                </div>
            </button>
        </div>
    );
};

export default LegalCompassHero;
