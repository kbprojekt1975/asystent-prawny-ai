import React, { useState } from 'react';
import { SparklesIcon, DocumentTextIcon, BookOpenIcon, ChevronDownIcon } from './Icons';

interface AppGuideProps {
    onClose?: () => void;
    showStartButton?: boolean;
}

const AppGuide: React.FC<AppGuideProps> = ({ onClose, showStartButton = true }) => {
    const [expandedSection, setExpandedSection] = useState<string | null>('analysis');

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="text-center space-y-2 mb-8">
                <h4 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                    Twój Osobisty Asystent Prawny
                </h4>
                <p className="text-sm text-slate-400 px-8 leading-relaxed">
                    Odkryj pełen potencjał aplikacji w 3 prostych krokach. Kliknij karty poniżej, aby zobaczyć szczegóły.
                </p>
            </div>

            <div className="space-y-4">
                {/* Section 1 */}
                <div className={`group border border-slate-700/50 rounded-2xl transition-all duration-300 ${expandedSection === 'analysis' ? 'bg-slate-900/40 border-cyan-500/30 ring-1 ring-cyan-500/20' : 'bg-slate-900/20 hover:bg-slate-900/40'}`}>
                    <button
                        onClick={() => setExpandedSection(expandedSection === 'analysis' ? null : 'analysis')}
                        className="w-full flex items-center gap-4 p-4 text-left"
                    >
                        <div className={`p-3 rounded-xl transition-colors ${expandedSection === 'analysis' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-400 group-hover:text-cyan-400 group-hover:bg-slate-800'}`}>
                            <SparklesIcon className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                            <h5 className="font-bold text-slate-100 italic">1. Inteligentna Analiza Spraw</h5>
                            <p className="text-xs text-slate-400">Zrozumienie Twojego problemu i wskazanie ścieżki prawnej</p>
                        </div>
                        <ChevronDownIcon className={`w-5 h-5 text-slate-500 transition-transform duration-300 ${expandedSection === 'analysis' ? 'rotate-180 text-cyan-400' : ''}`} />
                    </button>
                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${expandedSection === 'analysis' ? 'max-h-48' : 'max-h-0'}`}>
                        <div className="p-4 pt-0 border-t border-slate-700/30 mt-2">
                            <p className="text-sm text-slate-300 leading-relaxed">
                                Nasz AI przeanalizuje Twoją sprawę na podstawie opisów i dokumentów. Otrzymasz konkretne paragrafy, ocenę szans i plan działania.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Section 2 */}
                <div className={`group border border-slate-700/50 rounded-2xl transition-all duration-300 ${expandedSection === 'generator' ? 'bg-slate-900/40 border-cyan-500/30 ring-1 ring-cyan-500/20' : 'bg-slate-900/20 hover:bg-slate-900/40'}`}>
                    <button
                        onClick={() => setExpandedSection(expandedSection === 'generator' ? null : 'generator')}
                        className="w-full flex items-center gap-4 p-4 text-left"
                    >
                        <div className={`p-3 rounded-xl transition-colors ${expandedSection === 'generator' ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-800 text-slate-400 group-hover:text-purple-400'}`}>
                            <DocumentTextIcon className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                            <h5 className="font-bold text-slate-100 italic">2. Generator Dokumentów</h5>
                            <p className="text-xs text-slate-400">Tworzenie pism procesowych, wezwań i wniosków</p>
                        </div>
                        <ChevronDownIcon className={`w-5 h-5 text-slate-500 transition-transform duration-300 ${expandedSection === 'generator' ? 'rotate-180 text-purple-400' : ''}`} />
                    </button>
                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${expandedSection === 'generator' ? 'max-h-48' : 'max-h-0'}`}>
                        <div className="p-4 pt-0 border-t border-slate-700/30 mt-2">
                            <p className="text-sm text-slate-300 leading-relaxed">
                                Na podstawie czatu możesz wygenerować gotowe pismo procesowe. System sam uzupełni Twoje dane i podstawę prawną.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Section 3 */}
                <div className={`group border border-slate-700/50 rounded-2xl transition-all duration-300 ${expandedSection === 'knowledge' ? 'bg-slate-900/40 border-cyan-500/30 ring-1 ring-cyan-500/20' : 'bg-slate-900/20 hover:bg-slate-900/40'}`}>
                    <button
                        onClick={() => setExpandedSection(expandedSection === 'knowledge' ? null : 'knowledge')}
                        className="w-full flex items-center gap-4 p-4 text-left"
                    >
                        <div className={`p-3 rounded-xl transition-colors ${expandedSection === 'knowledge' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400 group-hover:text-emerald-400'}`}>
                            <BookOpenIcon className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                            <h5 className="font-bold text-slate-100 italic">3. Baza Wiedzy i Pamięć</h5>
                            <p className="text-xs text-slate-400">Bezpieczne archiwum Twoich spraw i dokumentów</p>
                        </div>
                        <ChevronDownIcon className={`w-5 h-5 text-slate-500 transition-transform duration-300 ${expandedSection === 'knowledge' ? 'rotate-180 text-emerald-400' : ''}`} />
                    </button>
                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${expandedSection === 'knowledge' ? 'max-h-48' : 'max-h-0'}`}>
                        <div className="p-4 pt-0 border-t border-slate-700/30 mt-2">
                            <p className="text-sm text-slate-300 leading-relaxed">
                                Wszystkie analizy są zapisywane. Możesz do nich wrócić w dowolnym momencie w sekcji "Baza Wiedzy".
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {showStartButton && (
                <div className="mt-8 p-6 bg-slate-900/60 rounded-3xl border border-slate-700/50 text-center space-y-4">
                    <h5 className="text-lg font-bold text-white">Gotowy?</h5>
                    <p className="text-sm text-slate-400 px-4">
                        Wybierz metodę działania, która pasuje Tobie najlepiej. Pamiętaj, że w każdej chwili możesz wrócić do tego przewodnika.
                    </p>
                    <button
                        onClick={onClose}
                        className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-4 rounded-2xl shadow-xl shadow-cyan-900/20 transition-all active:scale-95 transform translate-y-0"
                    >
                        Przejdź do Aplikacji
                    </button>
                </div>
            )}
        </div>
    );
};

export default AppGuide;
