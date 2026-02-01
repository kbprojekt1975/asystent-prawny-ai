import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PrivacyPolicyModal from './PrivacyPolicyModal';

const CookieConsent: React.FC = () => {
    const { t } = useTranslation();
    const [isVisible, setIsVisible] = useState(false);
    const [isPolicyOpen, setIsPolicyOpen] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem('cookieConsent');
        if (!consent) {
            setIsVisible(true);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem('cookieConsent', 'true');
        setIsVisible(false);
    };

    if (!isVisible) return null;

    const detailsKey = 'cookie.details';
    const detailsRaw = t(detailsKey) || '';
    const details = detailsRaw.includes('|') ? detailsRaw.split('|') : [detailsRaw];

    return (
        <>
            <div className="fixed bottom-0 left-0 right-0 z-[11000] bg-slate-900/95 backdrop-blur-md border-t border-cyan-500/30 p-4 md:p-6 animate-in slide-in-from-bottom-full duration-500">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex-1">
                        <h3 className="text-white font-bold mb-1">{t('cookie.title', 'Polityka Cookies')}</h3>
                        <p className="text-slate-400 text-xs md:text-sm leading-relaxed">
                            {t('cookie.message', 'Używamy plików cookies, aby zapewnić najlepszą jakość korzystania z naszego asystenta.')}
                        </p>
                        <div className="flex gap-4 mt-2">
                            {details.map((detail, idx) => (
                                <span key={idx} className="text-[10px] text-slate-500 border-l border-slate-700 pl-2 first:border-0 first:pl-0">
                                    {detail}
                                </span>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                        <button
                            onClick={() => setIsPolicyOpen(true)}
                            className="text-cyan-400 hover:text-cyan-300 text-sm font-medium transition-colors border-b border-transparent hover:border-cyan-400/50"
                        >
                            {t('cookie.detailsLink', 'Szczegóły polityki')}
                        </button>
                        <button
                            onClick={handleAccept}
                            className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-6 rounded-xl text-sm transition-all active:scale-95 shadow-lg shadow-cyan-900/20"
                        >
                            {t('cookie.accept', 'Rozumiem')}
                        </button>
                    </div>
                </div>
            </div>

            <PrivacyPolicyModal
                isOpen={isPolicyOpen}
                onClose={() => setIsPolicyOpen(false)}
            />
        </>
    );
};

export default CookieConsent;
