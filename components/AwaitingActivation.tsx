import React from 'react';
import { useTranslation } from 'react-i18next';
import { ClockIcon } from './Icons';
import { auth } from '../services/firebase';

const AwaitingActivation: React.FC = () => {
    const { t } = useTranslation();

    return (
        <div className="flex h-screen items-center justify-center bg-slate-800 px-4">
            <div className="max-w-md w-full bg-slate-800 border border-slate-700/50 p-8 rounded-2xl text-center shadow-2xl backdrop-blur-sm">
                <div className="w-16 h-16 bg-amber-500/20 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ClockIcon className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-4">{t('activation.title')}</h2>
                <p className="text-slate-400 mb-8 leading-relaxed">
                    {t('activation.description')}
                </p>
                <div className="space-y-4">
                    <div className="bg-slate-700/30 p-4 rounded-xl text-xs text-slate-500 text-left">
                        <p className="font-semibold text-slate-400 mb-1">{t('activation.statusTitle')}</p>
                        <ul className="list-disc pl-4 space-y-1">
                            <li>{t('activation.planLabel')} {t('activation.planValue')}</li>
                            <li>{t('activation.paymentLabel')} <span className="text-amber-500">{t('activation.paymentValue')}</span></li>
                            <li>{t('activation.verificationLabel')} {t('activation.verificationValue')}</li>
                        </ul>
                    </div>
                    <button
                        onClick={() => auth.signOut()}
                        className="w-full py-3 px-4 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors font-medium"
                    >
                        {t('activation.logout')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AwaitingActivation;
