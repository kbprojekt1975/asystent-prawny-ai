
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { SparklesIcon, XIcon, CreditCardIcon, TimeIcon } from './Icons';
import { SubscriptionStatus, SubscriptionInfo } from '../types';
import { InfoIcon } from './InfoIcon';
import HelpModal from './HelpModal';
import { PRICE_IDS } from '../services/stripeService';

interface PlanSelectionModalProps {
    isOpen: boolean;
    onSelectPlan: (planId: string) => Promise<void>;
    subscription?: SubscriptionInfo;
    isLoading: boolean;
}

const PlanSelectionModal: React.FC<PlanSelectionModalProps> = ({ isOpen, onSelectPlan, subscription, isLoading }) => {
    const { t } = useTranslation();
    const [isVisible, setIsVisible] = useState(false);
    const [isHelpOpen, setIsHelpOpen] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
        } else {
            const timer = setTimeout(() => setIsVisible(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isVisible && !isOpen) return null;

    const getStatusDisplay = () => {
        const isLimitReached = subscription && subscription.spentAmount >= subscription.creditLimit && (subscription.status === SubscriptionStatus.Active || subscription.status === SubscriptionStatus.Trialing);

        if (!subscription || subscription.status === SubscriptionStatus.None || isLimitReached) {
            return (
                <div className="flex flex-col items-center text-center p-6 bg-slate-900/40 border border-slate-700/50 backdrop-blur-xl rounded-2xl shadow-2xl">
                    <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 flex items-center justify-center mb-6 ring-1 ring-cyan-500/50 relative">
                        {isLimitReached ? (
                            <CreditCardIcon className="w-8 h-8 text-orange-400" />
                        ) : (
                            <SparklesIcon className="w-8 h-8 text-cyan-400" />
                        )}
                        <div className="absolute -right-12 -top-2">
                            <InfoIcon onClick={() => setIsHelpOpen(true)} />
                        </div>
                    </div>

                    <h3 className="text-2xl font-bold text-white mb-2">
                        {isLimitReached ? t('plan.limitReached.title', "Limit Środków Wyczerpany") : t('plan.selectPlan', "Wybierz swój plan")}
                    </h3>
                    <p className="text-slate-400 mb-8 max-w-sm text-sm">
                        {isLimitReached
                            ? t('plan.limitReached.desc', "Twoje środki się skończyły. Aby kontynuować, wybierz plan doładowania.")
                            : t('plan.intro', "Odblokuj pełną moc sztucznej inteligencji prawniczej.")}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mb-8">
                        {/* STARTER PLAN */}
                        <div className="relative group flex flex-col p-6 bg-slate-800/50 rounded-2xl border border-slate-700 hover:border-cyan-500/50 transition-all duration-300">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-2 bg-slate-700/50 rounded-lg">
                                    <SparklesIcon className="w-5 h-5 text-slate-300" />
                                </div>
                                <div className="text-2xl font-black text-white">10<span className="text-sm font-normal text-slate-400"> PLN</span></div>
                            </div>
                            <h4 className="text-lg font-bold text-white text-left mb-1">{t('plan.starter.title')}</h4>
                            <p className="text-xs text-slate-400 text-left mb-6 leading-relaxed">
                                {t('plan.starter.desc')}
                            </p>

                            <ul className="space-y-3 mb-8 text-left flex-1">
                                <li className="flex items-center gap-2 text-xs text-slate-300">
                                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400"></div>
                                    <span>333 000 Tokenów</span>
                                </li>
                                <li className="flex items-center gap-2 text-xs text-slate-300">
                                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400"></div>
                                    <span>Wszystkie tryby asystenta</span>
                                </li>
                            </ul>

                            <button
                                onClick={() => onSelectPlan(PRICE_IDS.STARTER_10PLN)}
                                disabled={isLoading}
                                className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl transition-all border border-slate-600 shadow-lg disabled:opacity-50"
                            >
                                {isLoading ? t('auth.processing') : t('plan.starter.selectButton')}
                            </button>
                        </div>

                        {/* PRO PLAN */}
                        <div className="relative group flex flex-col p-6 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border-2 border-cyan-500 shadow-2xl shadow-cyan-900/20 transform md:scale-105 z-10">
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-cyan-500 text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-full">
                                BEST VALUE
                            </div>
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-2 bg-cyan-500/20 rounded-lg">
                                    <SparklesIcon className="w-5 h-5 text-cyan-400" />
                                </div>
                                <div className="text-2xl font-black text-white">50<span className="text-sm font-normal text-slate-400"> PLN</span></div>
                            </div>
                            <h4 className="text-lg font-bold text-white text-left mb-1">PRO PLAN</h4>
                            <p className="text-[10px] text-cyan-400/80 text-left mb-4 font-bold uppercase tracking-wider">
                                Aktywny 30 dni • 5x + 30% wydajności
                            </p>

                            <ul className="space-y-3 mb-8 text-left flex-1">
                                <li className="flex items-center gap-2 text-xs text-white">
                                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]"></div>
                                    <span className="font-bold">5x wiecej wydajnosci niz w planie start + 30%</span>
                                </li>
                                <li className="flex items-center gap-2 text-xs text-slate-200">
                                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400"></div>
                                    <span>Tworzenie Własnych Agentów</span>
                                </li>
                                <li className="flex items-center gap-2 text-xs text-slate-200">
                                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400"></div>
                                    <span>Najwyższy priorytet odpowiedzi</span>
                                </li>
                            </ul>

                            <button
                                onClick={() => onSelectPlan(PRICE_IDS.PRO_50PLN)}
                                disabled={isLoading}
                                className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-xl transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50"
                            >
                                {isLoading ? t('auth.processing') : "WYBIERZ PRO"}
                            </button>
                        </div>
                    </div>

                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">
                        {t('plan.starter.manualActivation')}
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
                    <h3 className="text-xl font-bold text-white mb-2">{t('plan.pending.title')}</h3>
                    <p className="text-slate-400 mb-6">
                        {t('plan.pending.desc')}
                    </p>
                    <div className="text-xs text-amber-400/70 bg-amber-400/10 px-4 py-2 rounded-full border border-amber-400/20 mb-6">
                        {t('plan.pending.statusLabel')}
                    </div>
                </div>
            );
        }

        if (subscription.status === SubscriptionStatus.Expired) {
            return (
                <div className="flex flex-col items-center text-center p-8 bg-red-500/5 border border-red-500/20 rounded-2xl">
                    <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-6 border border-red-500/50">
                        <XIcon className="w-8 h-8 text-red-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{t('plan.expired.title')}</h3>
                    <p className="text-slate-400 mb-8">
                        {t('plan.expired.desc')}
                    </p>
                    <button
                        onClick={() => onSelectPlan(PRICE_IDS.STARTER_10PLN)}
                        disabled={isLoading}
                        className="w-full py-4 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl transition-all border border-slate-600"
                    >
                        {t('plan.expired.renewButton')}
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
            <HelpModal
                isOpen={isHelpOpen}
                onClose={() => setIsHelpOpen(false)}
                title={t('plan.help.title')}
            >
                <div className="space-y-4 text-sm">
                    <p>
                        {t('plan.help.intro')}
                    </p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>
                            <strong>{t('plan.help.creditTitle')}</strong> {t('plan.help.creditDesc')}
                        </li>
                        <li>
                            <strong>{t('plan.help.validityTitle')}</strong> {t('plan.help.validityDesc')}
                        </li>
                        <li>
                            <strong>{t('plan.help.activationTitle')}</strong> {t('plan.help.activationDesc')}
                        </li>
                    </ul>
                </div>
            </HelpModal>
        </div >
    );
};

export default PlanSelectionModal;
