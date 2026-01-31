import React from 'react';
import { useTranslation } from 'react-i18next';
import { User } from 'firebase/auth';
import { UserProfile } from '../../types';

interface PersonalTabProps {
    user: User | null;
    currentProfile: UserProfile;
    setCurrentProfile: (profile: UserProfile) => void;
    isSessionOnly: boolean;
    setIsSessionOnly: (val: boolean) => void;
    handleLogout: () => void;
    onUpdateProfile: (profile: UserProfile, isSessionOnly: boolean) => void;
    setIsAcceptingPrivacyPolicy: (val: boolean) => void;
    setIsPrivacyPolicyOpen: (val: boolean) => void;
}

const PersonalTab: React.FC<PersonalTabProps> = ({
    user,
    currentProfile,
    setCurrentProfile,
    isSessionOnly,
    setIsSessionOnly,
    handleLogout,
    onUpdateProfile,
    setIsAcceptingPrivacyPolicy,
    setIsPrivacyPolicyOpen
}) => {
    const { t } = useTranslation();

    const handleDataChange = (field: string, value: string) => {
        setCurrentProfile({
            ...currentProfile,
            personalData: {
                ...(currentProfile.personalData || {}),
                [field]: value
            }
        });
    };

    const subscription = currentProfile.subscription;
    const expiresAtDate = subscription?.expiresAt
        ? (typeof subscription.expiresAt === 'number'
            ? new Date(subscription.expiresAt)
            : subscription.expiresAt.toMillis ? new Date(subscription.expiresAt.toMillis()) : null)
        : null;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-700">
                <div className="w-12 h-12 rounded-full bg-cyan-600 flex items-center justify-center text-xl font-bold text-white">
                    {(currentProfile.displayName || user?.displayName || user?.email)?.charAt(0).toUpperCase() || "U"}
                </div>
                <div className="flex-1 overflow-hidden">
                    <p className="text-white font-medium truncate">{currentProfile.displayName || user?.displayName || user?.email}</p>
                    <button
                        onClick={handleLogout}
                        className="text-sm text-red-400 hover:text-red-300 transition-colors"
                    >
                        {t('userProfile.personal.logout')}
                    </button>
                </div>
            </div>

            {/* Subscription Status Block */}
            <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-600/50 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-cyan-500/10 transition-all"></div>

                <div className="flex justify-between items-start relative z-10">
                    <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                            {t('userProfile.personal.subscriptionTitle') || "Status Subskrypcji"}
                        </h4>
                        <div className="flex items-center gap-2 mt-2">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${subscription?.status === 'active'
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]'
                                    : 'bg-slate-700 text-slate-400 border-slate-600'
                                }`}>
                                <div className={`w-1.5 h-1.5 rounded-full mr-2 ${subscription?.status === 'active' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`}></div>
                                {subscription?.status === 'active'
                                    ? (t('userProfile.personal.active') || "AKTYWNA")
                                    : (subscription?.status || "BRAK")}
                            </span>
                        </div>
                    </div>

                    {expiresAtDate && subscription?.status === 'active' && (
                        <div className="text-right">
                            <span className="block text-[10px] text-slate-500 uppercase font-semibold mb-1">
                                {t('userProfile.personal.expires') || "Wygasa"}
                            </span>
                            <div className="font-mono text-sm text-slate-200 bg-slate-900/50 px-2 py-1 rounded border border-slate-700/50">
                                {expiresAtDate.toLocaleDateString()}
                                <span className="text-slate-500 ml-1.5 text-xs">
                                    {expiresAtDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-4">
                <h4 className="text-lg font-medium text-white mb-2">{t('userProfile.personal.dataForDocuments')}</h4>
                <p className="text-sm text-slate-400 mb-4">{t('userProfile.personal.dataDescription')}</p>

                <div>
                    <label htmlFor="fullName" className="block text-xs font-semibold text-slate-400 mb-1 uppercase">{t('userProfile.personal.fullName')}</label>
                    <input
                        id="fullName"
                        type="text"
                        value={currentProfile.personalData?.fullName || ''}
                        onChange={e => handleDataChange('fullName', e.target.value)}
                        placeholder="Jan Kowalski"
                        className="w-full bg-slate-700/50 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 border border-slate-600/50"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <label htmlFor="address" className="block text-xs font-semibold text-slate-400 mb-1 uppercase">{t('userProfile.personal.address')}</label>
                        <input
                            id="address"
                            type="text"
                            value={currentProfile.personalData?.address || ''}
                            onChange={e => handleDataChange('address', e.target.value)}
                            placeholder="ul. Wiejska 1/2"
                            className="w-full bg-slate-700/50 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 border border-slate-600/50"
                        />
                    </div>
                    <div>
                        <label htmlFor="postalCode" className="block text-xs font-semibold text-slate-400 mb-1 uppercase">{t('userProfile.personal.postalCode')}</label>
                        <input
                            id="postalCode"
                            type="text"
                            value={currentProfile.personalData?.postalCode || ''}
                            onChange={e => handleDataChange('postalCode', e.target.value)}
                            placeholder="00-001"
                            className="w-full bg-slate-700/50 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 border border-slate-600/50"
                        />
                    </div>
                    <div>
                        <label htmlFor="city" className="block text-xs font-semibold text-slate-400 mb-1 uppercase">{t('userProfile.personal.city')}</label>
                        <input
                            id="city"
                            type="text"
                            value={currentProfile.personalData?.city || ''}
                            onChange={e => handleDataChange('city', e.target.value)}
                            placeholder="Warszawa"
                            className="w-full bg-slate-700/50 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 border border-slate-600/50"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="pesel" className="block text-xs font-semibold text-slate-400 mb-1 uppercase">{t('userProfile.personal.pesel')}</label>
                        <input
                            id="pesel"
                            type="text"
                            value={currentProfile.personalData?.pesel || ''}
                            onChange={e => handleDataChange('pesel', e.target.value)}
                            placeholder="80010100000"
                            className="w-full bg-slate-700/50 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 border border-slate-600/50"
                        />
                    </div>
                    <div>
                        <label htmlFor="idNumber" className="block text-xs font-semibold text-slate-400 mb-1 uppercase">{t('userProfile.personal.idNumber')}</label>
                        <input
                            id="idNumber"
                            type="text"
                            value={currentProfile.personalData?.idNumber || ''}
                            onChange={e => handleDataChange('idNumber', e.target.value)}
                            placeholder="ABC 123456"
                            className="w-full bg-slate-700/50 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 border border-slate-600/50"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2 mb-2 p-3 bg-slate-900/30 rounded-lg border border-slate-700/50">
                    <input
                        type="checkbox"
                        id="sessionOnly"
                        checked={isSessionOnly}
                        onChange={e => setIsSessionOnly(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-cyan-600 focus:ring-cyan-500 focus:ring-offset-slate-800"
                    />
                    <label htmlFor="sessionOnly" className="text-sm text-slate-300 cursor-pointer">
                        {t('userProfile.personal.sessionOnly')}
                    </label>
                </div>

                <button
                    onClick={() => onUpdateProfile(currentProfile, isSessionOnly)}
                    className="w-full bg-cyan-600 text-white rounded-lg p-3 text-sm font-bold hover:bg-cyan-500 shadow-lg shadow-cyan-600/20 transition-all mt-2"
                >
                    {t('userProfile.personal.saveButton')}
                </button>

                <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700/50 space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-400 uppercase">{t('userProfile.personal.consentTitle')}</span>
                        {currentProfile.dataProcessingConsent ? (
                            <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-[10px] font-bold rounded-full border border-green-500/30">{t('userProfile.personal.consentGranted')}</span>
                        ) : (
                            <div className="flex flex-col items-end gap-2">
                                <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-[10px] font-bold rounded-full border border-red-500/30">{t('userProfile.personal.consentMissing')}</span>
                                <button
                                    onClick={() => setIsAcceptingPrivacyPolicy(true)}
                                    className="text-[10px] bg-cyan-600 hover:bg-cyan-500 text-white px-2 py-1 rounded font-bold transition-colors"
                                >
                                    {t('userProfile.personal.giveConsent')}
                                </button>
                            </div>
                        )}
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                        {currentProfile.dataProcessingConsent
                            ? t('userProfile.personal.consentGrantedDesc')
                            : t('userProfile.personal.consentMissingDesc')}
                        {currentProfile.consentDate && (
                            <span className="block mt-1 text-slate-600">
                                {t('userProfile.personal.consentDate')}: {currentProfile.consentDate.toDate ? currentProfile.consentDate.toDate().toLocaleString() : new Date(currentProfile.consentDate).toLocaleString()}
                            </span>
                        )}
                    </p>
                </div>

                {currentProfile.dataProcessingConsent && (
                    <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700/50 space-y-3 mt-4">
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <h5 className="text-xs font-semibold text-slate-400 uppercase mb-1">{t('userProfile.personal.localModeTitle')}</h5>
                                <p className="text-[10px] text-slate-500 leading-relaxed">
                                    {t('userProfile.personal.localModeDesc')}
                                </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer ml-4">
                                <input
                                    type="checkbox"
                                    checked={currentProfile.manualLocalMode === true}
                                    onChange={(e) => {
                                        const updated = { ...currentProfile, manualLocalMode: e.target.checked };
                                        setCurrentProfile(updated);
                                        onUpdateProfile(updated, isSessionOnly);
                                    }}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-cyan-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                                <span className="ml-3 text-xs font-medium text-slate-300">
                                    {currentProfile.manualLocalMode ? t('userProfile.personal.localModeEnabled') : t('userProfile.personal.localModeDisabled')}
                                </span>
                            </label>
                        </div>
                        <p className="text-[10px] text-slate-500 italic">
                            {t('userProfile.personal.localModeNote')}
                        </p>
                    </div>
                )}

                <p className="text-[10px] text-slate-500 text-center mt-2 px-2">
                    {t('userProfile.personal.privacyNote')} <button onClick={() => setIsPrivacyPolicyOpen(true)} className="text-cyan-500 hover:underline">{t('userProfile.personal.privacyPolicy')}</button>.
                </p>
            </div>
        </div>
    );
};

export default PersonalTab;
