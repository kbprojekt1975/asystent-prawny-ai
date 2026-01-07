import React from 'react';
import HelpModal from './HelpModal';
import {
    SparklesIcon,
    ScaleIcon,
    BriefcaseIcon,
    ClockIcon,
    CheckIcon,
    PaperClipIcon,
    MagicWandIcon,
    ArrowsExpandIcon,
    TrendingUpIcon
} from './Icons';

interface AppGuideModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const AppGuideModal: React.FC<AppGuideModalProps> = ({ isOpen, onClose }) => {
    return (
        <HelpModal
            isOpen={isOpen}
            onClose={onClose}
            title="Przewodnik po Asystencie Prawnym AI"
        >
            <div className="space-y-8 py-2">
                {/* Intro */}
                <section>
                    <p className="text-slate-200 leading-relaxed">
                        Witaj w <strong>Asystencie Prawnym AI</strong> – Twoim osobistym wsparciu w świecie prawa. Nasza aplikacja łączy zaawansowaną sztuczną inteligencję z polską bazą wiedzy prawniczej, aby pomagać Ci w codziennych i złożonych sprawach.
                    </p>
                </section>

                {/* Core Features */}
                <section className="space-y-4">
                    <h4 className="text-cyan-400 font-bold flex items-center gap-2 uppercase text-xs tracking-wider">
                        <MagicWandIcon className="w-4 h-4" /> Główne Funkcje
                    </h4>
                    <div className="grid grid-cols-1 gap-4">
                        <div className="bg-slate-700/30 p-4 rounded-xl border border-slate-600/30">
                            <h5 className="text-white font-semibold mb-1 flex items-center gap-2">
                                <SparklesIcon className="w-4 h-4 text-cyan-400" /> Inteligentna Analiza Spraw
                            </h5>
                            <p className="text-sm text-slate-400">
                                Opisz swój problem potocznym językiem. AI automatycznie zaklasyfikuje sprawę, dobierze odpowiednią dziedzinę prawa i wskaże najważniejsze przepisy.
                            </p>
                        </div>
                        <div className="bg-slate-700/30 p-4 rounded-xl border border-slate-600/30">
                            <h5 className="text-white font-semibold mb-1 flex items-center gap-2">
                                <ScaleIcon className="w-4 h-4 text-cyan-400" /> Baza Wiedzy i Ustaw
                            </h5>
                            <p className="text-sm text-slate-400">
                                Dostęp do aktualnych tekstów jednopolitych ustaw. Asystent potrafi wyszukiwać konkretne paragrafy i wyjaśniać ich znaczenie w kontekście Twojej sytuacji.
                            </p>
                        </div>
                        <div className="bg-slate-700/30 p-4 rounded-xl border border-slate-600/30">
                            <h5 className="text-white font-semibold mb-1 flex items-center gap-2">
                                <TrendingUpIcon className="w-4 h-4 text-rose-400" /> Ocena Szans Procesowych
                            </h5>
                            <p className="text-sm text-slate-400">
                                Przejdź przez rzetelny wywiad i analizę orzecznictwa, aby oszacować prawdopodobieństwo sukcesu i zidentyfikować kluczowe ryzyka w Twojej sprawie.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Interaction Modes */}
                <section className="space-y-4">
                    <h4 className="text-purple-400 font-bold flex items-center gap-2 uppercase text-xs tracking-wider">
                        <ArrowsExpandIcon className="w-4 h-4" /> Tryby Współpracy
                    </h4>
                    <div className="space-y-3">
                        <div className="flex gap-3">
                            <div className="mt-1"><div className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]"></div></div>
                            <div>
                                <span className="text-white font-medium text-sm">Tryb Analizy:</span>
                                <p className="text-xs text-slate-400">Skupienie na zrozumieniu faktów, gromadzeniu dowodów i wstępnej ocenie prawnej.</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <div className="mt-1"><div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div></div>
                            <div>
                                <span className="text-white font-medium text-sm">Tryb Dokumentów:</span>
                                <p className="text-xs text-slate-400">Generowanie pozwów, wniosków, umów i pism procesowych gotowych do wypełnienia.</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <div className="mt-1"><div className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]"></div></div>
                            <div>
                                <span className="text-white font-medium text-sm">Tryb Negocjacji:</span>
                                <p className="text-xs text-slate-400">Wsparcie w mediacjach, przygotowanie argumentacji i szukanie kompromisów.</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <div className="mt-1"><div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div></div>
                            <div>
                                <span className="text-white font-medium text-sm">Tryb Sądowy:</span>
                                <p className="text-xs text-slate-400">Symulacje rozpraw, wybór roli (powód/pozwany) i nauka reakcji na pytania sądu.</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <div className="mt-1"><div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]"></div></div>
                            <div>
                                <span className="text-white font-medium text-sm">Ocena Szans:</span>
                                <p className="text-xs text-slate-400">Szczegółowy wywiad i analiza prawdopodobieństwa wygranej na podstawie faktów i prawa.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Case Management */}
                <section className="space-y-4">
                    <h4 className="text-amber-400 font-bold flex items-center gap-2 uppercase text-xs tracking-wider">
                        <BriefcaseIcon className="w-4 h-4" /> Zarządzanie Sprawą
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-700/50">
                            <ClockIcon className="w-4 h-4 text-amber-500 mb-2" />
                            <h6 className="text-xs font-bold text-white mb-1">Terminarz</h6>
                            <p className="text-[10px] text-slate-500">Śledzenie terminów procesowych i dat rozpraw.</p>
                        </div>
                        <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-700/50">
                            <CheckIcon className="w-4 h-4 text-green-500 mb-2" />
                            <h6 className="text-xs font-bold text-white mb-1">Checklisty</h6>
                            <p className="text-[10px] text-slate-500">Zadania do wykonania i dokumenty do zebrania.</p>
                        </div>
                        <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-700/50">
                            <PaperClipIcon className="w-4 h-4 text-blue-500 mb-2" />
                            <h6 className="text-xs font-bold text-white mb-1">Repozytorium</h6>
                            <p className="text-[10px] text-slate-500">Bezpieczne przechowywanie pism i dowodów.</p>
                        </div>
                        <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-700/50">
                            <MagicWandIcon className="w-4 h-4 text-purple-500 mb-2" />
                            <h6 className="text-xs font-bold text-white mb-1">Eksport</h6>
                            <p className="text-[10px] text-slate-500">Pobieranie całej historii sprawy do pliku JSON.</p>
                        </div>
                    </div>
                </section>

                {/* Privacy & Modes */}
                <section className="p-4 bg-emerald-900/10 border border-emerald-900/30 rounded-xl">
                    <h4 className="text-emerald-400 font-bold mb-2 text-xs uppercase tracking-wider">Prywatność przede wszystkim</h4>
                    <p className="text-sm text-slate-300">
                        Możesz pracować w <strong>Trybie Lokalnym</strong> (dane tylko w pamięci przeglądarki) lub w <strong>Chmurze</strong> (bezpieczna synchronizacja między urządzeniami). Ty decydujesz o swoich danych przy każdym logowaniu.
                    </p>
                </section>
            </div>
        </HelpModal>
    );
};

export default AppGuideModal;
