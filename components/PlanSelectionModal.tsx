
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
                <div className="flex flex-col items-center text-center p-6 bg-slate-700/30 border border-slate-600 rounded-2xl">
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
                    {isLimitReached ? (
                        <>
                            <h3 className="text-2xl font-bold text-white mb-2">{t('plan.limitReached.title') || "Limit Środków Wyczerpany"}</h3>
                            <p className="text-slate-400 mb-8 max-w-sm">
                                {t('plan.limitReached.desc') || "Twoje środki się skończyły. Aby kontynuować korzystanie z asystenta, doładuj konto wybierając pakiet startowy."}
                            </p>
                        </>
                    ) : (
                        <>
                            <h3 className="text-2xl font-bold text-white mb-2">{t('plan.starter.title')}</h3>
                            <p className="text-slate-400 mb-8 max-w-sm">
                                {t('plan.starter.desc')}
                            </p>
                        </>
                    )}

                    <div className="grid grid-cols-2 gap-4 w-full mb-8">
                        <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700 text-left">
                            <div className="flex items-center gap-2 text-cyan-400 mb-1">
                                <CreditCardIcon className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase tracking-wider">{t('plan.starter.creditLabel')}</span>
                            </div>
                            <div className="text-xl font-bold text-white">10.00 PLN</div>
                        </div>
                        <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700 text-left">
                            <div className="flex items-center gap-2 text-violet-400 mb-1">
                                <TimeIcon className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase tracking-wider">{t('plan.starter.validityLabel')}</span>
                            </div>
                            <div className="text-xl font-bold text-white">{t('plan.starter.validityValue')}</div>
                        </div>
                    </div>

                    <button
                        onClick={() => onSelectPlan(PRICE_IDS.STARTER_10PLN)}
                        disabled={isLoading}
                        className="w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-cyan-900/20 disabled:opacity-50"
                    >
                        {isLoading ? t('auth.processing') : (isLimitReached ? (t('plan.limitReached.selectButton') || "Doładuj 10 PLN") : t('plan.starter.selectButton'))}
                    </button>
                    <p className="mt-4 text-[10px] text-slate-500 uppercase tracking-widest">
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
