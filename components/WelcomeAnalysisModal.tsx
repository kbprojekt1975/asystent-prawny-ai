
import React, { useState, useEffect } from 'react';
import { MagicWandIcon, SendIcon, XIcon, MenuIcon, SparklesIcon } from './Icons';
import HelpModal from './HelpModal';
import { InfoIcon } from './InfoIcon';

interface WelcomeAnalysisModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAnalyze: (description: string) => Promise<void>;
    isLoading: boolean;
    initialViewMode?: ViewMode;
}

type ViewMode = 'selection' | 'input';

const WelcomeAnalysisModal: React.FC<WelcomeAnalysisModalProps> = ({ isOpen, onClose, onAnalyze, isLoading, initialViewMode = 'selection' }) => {
    const [description, setDescription] = useState('');
    const [isVisible, setIsVisible] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode);
    const [isHelpOpen, setIsHelpOpen] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            setViewMode(initialViewMode); // Use initialViewMode on open
        } else {
            setTimeout(() => setIsVisible(false), 300);
        }
    }, [isOpen, initialViewMode]);

    if (!isVisible && !isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (description.trim()) {
            await onAnalyze(description);
        }
    };

    const handleAdvancedClick = () => {
        onClose();
    };

    return (
        <div
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
            aria-modal="true"
            role="dialog"
        >
            {/* Semi-transparent backdrop */}
            <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm" onClick={onClose}></div>

            {/* Modal Content */}
            <div className="relative bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden transform transition-all duration-300 scale-100">

                {/* Header */}
                <div className="flex justify-between items-start p-6 pb-2">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-violet-600/20 flex items-center justify-center ring-1 ring-violet-500/50">
                            <MagicWandIcon className="w-6 h-6 text-violet-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Witaj w Asystencie Prawnym</h2>
                            <p className="text-slate-400 text-sm">Wybierz, w jaki sposób chcesz pracować.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <InfoIcon onClick={() => setIsHelpOpen(true)} />
                        <button
                            onClick={onClose}
                            className="text-slate-500 hover:text-white transition-colors p-2 hover:bg-slate-700/50 rounded-full"
                            title="Zamknij"
                        >
                            <XIcon className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                <div className="p-6 pt-4">
                    {viewMode === 'selection' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                            {/* Basic Mode Button */}
                            <button
                                onClick={() => setViewMode('input')}
                                className="group flex flex-col items-start p-6 bg-slate-700/30 hover:bg-violet-600/10 border border-slate-600 hover:border-violet-500 rounded-xl transition-all duration-300 text-left h-full"
                            >
                                <div className="w-12 h-12 rounded-full bg-violet-500/20 flex items-center justify-center mb-4 group-hover:bg-violet-500 group-hover:text-white text-violet-400 transition-colors">
                                    <SparklesIcon className="w-6 h-6" />
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-violet-300 transition-colors">Wersja Podstawowa</h3>
                                <p className="text-slate-400 text-sm leading-relaxed">
                                    Po prostu opisz swój problem. Inteligentny agent sam rozpozna temat, dobierze odpowiednie prawo i poprowadzi rozmowę.
                                </p>
                                <div className="mt-auto pt-4 flex items-center text-violet-400 text-sm font-semibold group-hover:translate-x-1 transition-transform">
                                    Rozpocznij czat &rarr;
                                </div>
                            </button>

                            {/* Advanced Mode Button */}
                            <button
                                onClick={handleAdvancedClick}
                                className="group flex flex-col items-start p-6 bg-slate-700/30 hover:bg-cyan-600/10 border border-slate-600 hover:border-cyan-500 rounded-xl transition-all duration-300 text-left h-full"
                            >
                                <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center mb-4 group-hover:bg-cyan-600 group-hover:text-white text-cyan-400 transition-colors">
                                    <MenuIcon className="w-6 h-6" />
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors">Wersja Zaawansowana</h3>
                                <p className="text-slate-400 text-sm leading-relaxed">
                                    Pełna kontrola. Samodzielnie wybierz dziedzinę prawa, konkretny temat oraz tryb pracy (np. szkolenie, szukanie wyroków).
                                </p>
                                <div className="mt-auto pt-4 flex items-center text-cyan-400 text-sm font-semibold group-hover:translate-x-1 transition-transform">
                                    Przejdź do aplikacji &rarr;
                                </div>
                            </button>
                        </div>
                    ) : (
                        /* Input View */
                        <form onSubmit={handleSubmit} className="animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="mb-4">
                                <button
                                    type="button"
                                    onClick={() => setViewMode('selection')}
                                    className="text-sm text-slate-400 hover:text-white flex items-center gap-1 mb-2 transition-colors"
                                >
                                    &larr; Wróć do wyboru
                                </button>
                                <label className="block text-white font-medium mb-2">
                                    Opisz swoją sytuację:
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Np. Otrzymałem wypowiedzenie z pracy i nie zgadzam się z uzasadnieniem..."
                                    className="w-full h-40 bg-slate-900/50 border border-slate-700 rounded-xl p-4 text-base text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none transition-all"
                                    disabled={isLoading}
                                    autoFocus
                                />
                            </div>

                            <div className="flex justify-end gap-3">
                                <button
                                    type="submit"
                                    disabled={!description.trim() || isLoading}
                                    className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-6 py-2.5 rounded-lg hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-violet-600/25 font-semibold w-full justify-center sm:w-auto"
                                >
                                    {isLoading ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Analizuję...
                                        </>
                                    ) : (
                                        <>
                                            Rozpocznij rozmowę
                                            <SendIcon />
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>

            <HelpModal
                isOpen={isHelpOpen}
                onClose={() => setIsHelpOpen(false)}
                title="Wybór trybu pracy"
            >
                <div className="space-y-4">
                    <p>
                        Możesz korzystać z asystenta na dwa sposoby:
                    </p>
                    <div className="space-y-4">
                        <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                            <h4 className="flex items-center gap-2 font-bold text-violet-400 mb-1">
                                <SparklesIcon className="w-4 h-4" /> Wersja Podstawowa
                            </h4>
                            <p className="text-sm">
                                Idealna na start. Po prostu opisz swój problem własnymi słowami.
                                System sam rozpozna, czy to sprawa karna, cywilna czy inna, i zada Ci odpowiednie pytania.
                            </p>
                        </div>

                        <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                            <h4 className="flex items-center gap-2 font-bold text-cyan-400 mb-1">
                                <MenuIcon className="w-4 h-4" /> Wersja Zaawansowana
                            </h4>
                            <p className="text-sm">
                                Dla osób, które wiedzą czego szukają.
                                Pozwala ręcznie wybrać dziedzinę prawa (np. Prawo Karne) i konkretne narzędzie (np. "Stwórz pismo" lub "Wyszukaj wyroki").
                            </p>
                        </div>
                    </div>
                </div>
            </HelpModal>
        </div>
    );
};

export default WelcomeAnalysisModal;
