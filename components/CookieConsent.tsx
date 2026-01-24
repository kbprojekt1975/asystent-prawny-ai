import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { XIcon } from './Icons';
import { UserProfile } from '../types';

interface CookieConsentProps {
    userProfile?: UserProfile;
    onUpdateProfile?: (profile: UserProfile, isSessionOnly: boolean) => void;
    isLoading?: boolean;
}

const CookieConsent: React.FC<CookieConsentProps> = ({ userProfile, onUpdateProfile, isLoading }) => {
    const { t } = useTranslation();
    const [isVisible, setIsVisible] = useState(false);
    const [showDetails, setShowDetails] = useState(false);

    useEffect(() => {
        const localConsent = localStorage.getItem('cookieConsent');
        const profileConsent = userProfile?.cookieConsent;

        console.log('[DEBUG] CookieConsent status:', { localConsent, profileConsent });

        // Auto-sync if it was accepted locally but not in profile yet
        if (localConsent === 'true' && !profileConsent && onUpdateProfile && userProfile) {
            console.log('[DEBUG] Auto-syncing local consent to profile');
            onUpdateProfile({
                ...userProfile,
                cookieConsent: true,
                cookieConsentDate: new Date().toISOString()
            }, false);
            return;
        }

        if (!localConsent && !profileConsent) {
            // Only show if definitely NOT loading and no consent found anywhere
            if (!isLoading) {
                setIsVisible(true);
                // console.log('[DEBUG] Setting CookieConsent to Visible');
            }
        } else {
            setIsVisible(false);
        }
    }, [userProfile?.cookieConsent, onUpdateProfile, isLoading]);

    const handleAccept = () => {
        console.log('[DEBUG] CookieConsent Accepted');
        localStorage.setItem('cookieConsent', 'true');

        if (onUpdateProfile && userProfile) {
            onUpdateProfile({
                ...userProfile,
                cookieConsent: true,
                cookieConsentDate: new Date().toISOString()
            }, false);
        }

        setIsVisible(false);
    };

    if (!isVisible) {
        // console.log('[DEBUG] CookieConsent is NOT visible');
        return null;
    }

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[9999] p-4 bg-slate-900/95 backdrop-blur-md border-t border-slate-700 shadow-2xl animate-in fade-in slide-in-from-bottom duration-700">
            <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex-1">
                    <p className="text-slate-300">
                        {t('cookieConsent.message')}
                    </p>
                    <button
                        onClick={() => setShowDetails(!showDetails)}
                        className="text-cyan-400 text-sm mt-2 hover:underline focus:outline-none"
                    >
                        {showDetails ? t('cookieConsent.hideDetails') : t('cookieConsent.showDetails')}
                    </button>

                    {showDetails && (
                        <div className="mt-4 p-4 bg-slate-800/50 rounded-lg text-sm text-slate-400 space-y-2 border border-slate-700">
                            <h4 className="font-semibold text-slate-200">{t('cookieConsent.detailsTitle')}</h4>
                            <ul className="list-disc pl-4 space-y-2 mt-2">
                                <li><strong className="text-slate-300">{t('cookieConsent.detailsAccount')}</strong> {t('cookieConsent.detailsAccountDesc')}</li>
                                <li><strong className="text-slate-300">{t('cookieConsent.detailsData')}</strong> {t('cookieConsent.detailsDataDesc')}</li>
                                <li><strong className="text-slate-300">{t('cookieConsent.detailsMemory')}</strong> {t('cookieConsent.detailsMemoryDesc')}</li>
                                <li><strong className="text-slate-300">{t('cookieConsent.detailsComfort')}</strong> {t('cookieConsent.detailsComfortDesc')}</li>
                            </ul>
                            <p className="text-xs mt-3 text-slate-500 italic">{t('cookieConsent.detailsFooter')}</p>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 self-start md:self-center mt-4 md:mt-0">
                    <button
                        onClick={handleAccept}
                        className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-lg transition-colors whitespace-nowrap shadow-lg shadow-cyan-900/20"
                    >
                        {t('cookieConsent.accept')}
                    </button>
                    <button
                        onClick={() => setIsVisible(false)}
                        className="p-2 text-slate-400 hover:text-white transition-colors"
                        aria-label={t('cookieConsent.close')}
                    >
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CookieConsent;
