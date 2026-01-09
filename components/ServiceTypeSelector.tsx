import React from 'react';
import { BriefcaseIcon, SparklesIcon, ChevronRightIcon } from './Icons';
import { LawArea } from '../types';

interface ServiceTypeSelectorProps {
    lawArea: LawArea;
    onSelect: (type: 'pro' | 'hub') => void;
}

const ServiceTypeSelector: React.FC<ServiceTypeSelectorProps> = ({ lawArea, onSelect }) => {
    return (
        <div className="flex flex-col items-center min-h-full p-4 w-full animate-in fade-in duration-500">
            <div className="text-center mb-10 flex flex-col items-center justify-center gap-2 mt-4 md:mt-0 pt-8 md:pt-0">
                <h1 className="text-2xl font-bold text-white mb-2">Wybierz sposób rozwiązania sprawy</h1>
                <p className="text-lg text-slate-400">
                    Dla wybranej dziedziny ({lawArea}) oferujemy dwa podejścia:
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl px-4">
                {/* PRO Path */}
                <button
                    onClick={() => onSelect('pro')}
                    className="group bg-slate-800/50 border border-slate-700 rounded-lg p-6 text-left hover:bg-slate-700/70 hover:border-violet-500 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-violet-500 relative overflow-hidden"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-slate-700/50 rounded-lg flex items-center justify-center group-hover:bg-violet-600/30 transition-colors">
                            <BriefcaseIcon className="h-6 w-6 text-violet-400" />
                        </div>
                        <span className="px-2 py-0.5 bg-violet-600/20 border border-violet-500/30 rounded-full text-[10px] font-bold text-violet-300 uppercase tracking-wider">
                            Rekomendowane
                        </span>
                    </div>

                    <h2 className="text-xl font-semibold text-white mb-2 group-hover:text-violet-300 transition-colors">PRO: Prowadź moją sprawę</h2>
                    <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                        Kompleksowa ścieżka strategiczna. Analiza całej teczki dokumentów, ocena szans na wygraną i budowanie strategii procesowej.
                    </p>

                    <div className="flex items-center gap-2 text-violet-400 text-xs font-bold uppercase tracking-widest group-hover:translate-x-1 transition-transform">
                        <span>Rozpocznij analizę PRO</span>
                        <ChevronRightIcon className="w-4 h-4" />
                    </div>
                </button>

                {/* Standard Tools Path */}
                <button
                    onClick={() => onSelect('hub')}
                    className="group bg-slate-800/50 border border-slate-700 rounded-lg p-6 text-left hover:bg-slate-700/70 hover:border-cyan-500 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                    <div className="w-12 h-12 bg-slate-700/50 rounded-lg flex items-center justify-center mb-4 group-hover:bg-cyan-600/30 transition-colors">
                        <SparklesIcon className="h-6 w-6 text-cyan-400" />
                    </div>

                    <h2 className="text-xl font-semibold text-white mb-2 group-hover:text-cyan-300 transition-colors">Narzędzia AI i Porady</h2>
                    <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                        Zadaj pytanie prawne, wygeneruj konkretne pismo, przeszukaj przepisy lub przejdź interaktywne szkolenie.
                    </p>

                    <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-widest group-hover:translate-x-1 transition-transform">
                        <span>Otwórz zestaw narzędzi</span>
                        <ChevronRightIcon className="w-4 h-4" />
                    </div>
                </button>
            </div>

            <div className="mt-12 text-slate-500 text-[10px] uppercase tracking-[0.2em] font-medium text-center">
                Asystent Prawny AI &bull; Inteligentne Wsparcie Procesowe
            </div>
        </div>
    );
};

export default ServiceTypeSelector;
