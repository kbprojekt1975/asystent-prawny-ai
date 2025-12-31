
import React, { useState, useEffect } from 'react';
import { SparklesIcon, XIcon, CreditCardIcon, TimeIcon } from './Icons';
import { SubscriptionStatus, SubscriptionInfo } from '../types';

interface PlanSelectionModalProps {
    isOpen: boolean;
    onSelectPlan: () => Promise<void>;
    subscription?: SubscriptionInfo;
    isLoading: boolean;
}

const PlanSelectionModal: React.FC<PlanSelectionModalProps> = ({ isOpen, onSelectPlan, subscription, isLoading }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
        } else {
            setTimeout(() => setIsVisible(false), 300);
        }
    }, [isOpen]);

    if (!isVisible && !isOpen) return null;

    const getStatusDisplay = () => {
        if (!subscription || subscription.status === SubscriptionStatus.None) {
            return (
                <div className="flex flex-col items-center text-center p-6 bg-slate-700/30 border border-slate-600 rounded-2xl">
                    <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 flex items-center justify-center mb-6 ring-1 ring-cyan-500/50">
                        <SparklesIcon className="w-8 h-8 text-cyan-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Pakiet Startowy AI</h3>
                    <p className="text-slate-400 mb-8 max-w-sm">
                        Uzyskaj pełny dostęp do asystenta prawnego na tydzień.
                        Wykorzystaj 10 PLN kredytu na zaawansowane analizy Gemini 1.5 Pro/Flash.
                    </p>

                    <div className="grid grid-cols-2 gap-4 w-full mb-8">
                        <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700 text-left">
                            <div className="flex items-center gap-2 text-cyan-400 mb-1">
                                <CreditCardIcon className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase tracking-wider">Kredyt</span>
                            </div>
                            <div className="text-xl font-bold text-white">10.00 PLN</div>
                        </div>
                        <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700 text-left">
                            <div className="flex items-center gap-2 text-violet-400 mb-1">
                                <TimeIcon className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase tracking-wider">Ważność</span>
                            </div>
                            <div className="text-xl font-bold text-white">7 Dni</div>
                        </div>
                    </div>

                    <button
                        onClick={onSelectPlan}
                        disabled={isLoading}
                        className="w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-cyan-900/20 disabled:opacity-50"
                    >
                        {isLoading ? "Przetwarzanie..." : "Wybieram ten plan - 10 PLN"}
                    </button>
                    <p className="mt-4 text-[10px] text-slate-500 uppercase tracking-widest">
                        Wymagana ręczna aktywacja przez administratora
                    </p>
                </div>
            );
        }

        if (subscription.status === SubscriptionStatus.Pending) {
            return (
                <div className="flex flex-col items-center text-center p-8 bg-amber-500/5 border border-amber-500/20 rounded-2xl animate-pulse">
                    <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mb-6 border border-amber-500/50">
                        <TimeIcon className="w-8 h-8 text-amber-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Oczekiwanie na aktywację</h3>
                    <p className="text-slate-400 mb-6">
                        Twoje zgłoszenie zostało wysłane. <br />
                        Prosimy o dokonanie wpłaty (10 PLN). <br />
                        Administrator aktywuje Twoje konto wkrótce.
                    </p>
                    <div className="text-xs text-amber-400/70 bg-amber-400/10 px-4 py-2 rounded-full border border-amber-400/20 mb-6">
                        Status: PENDING_APPROVAL
                    </div>
                    <button
                        onClick={onSelectPlan}
                        disabled={isLoading}
                        className="text-xs text-slate-500 hover:text-white underline transition-colors"
                    >
                        {isLoading ? "Przetwarzanie..." : "Wymuś aktywację (Demo)"}
                    </button>
                </div>
            );
        }

        if (subscription.status === SubscriptionStatus.Expired) {
            return (
                <div className="flex flex-col items-center text-center p-8 bg-red-500/5 border border-red-500/20 rounded-2xl">
                    <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-6 border border-red-500/50">
                        <XIcon className="w-8 h-8 text-red-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Plan Wygasł</h3>
                    <p className="text-slate-400 mb-8">
                        Twój kredyt się wyczerpał lub termin ważności minął.
                        Wybierz plan ponownie, aby kontynuować.
                    </p>
                    <button
                        onClick={onSelectPlan}
                        disabled={isLoading}
                        className="w-full py-4 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl transition-all border border-slate-600"
                    >
                        Odnów dostęp - 10 PLN
                    </button>
                </div>
            );
        }

        return null;
    };

    return (
        <div
            className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
            aria-modal="true"
            role="dialog"
        >
            <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md"></div>

            <div className="relative w-full max-w-lg transform transition-all duration-300 scale-100">
                {getStatusDisplay()}
            </div>
        </div>
    );
};

export default PlanSelectionModal;
