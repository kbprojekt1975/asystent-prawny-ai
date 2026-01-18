
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { UserProfile, QuickAction, LawArea, InteractionMode } from '../types';
import { XIcon, PlusCircleIcon, TrashIcon, UserIcon, CalendarIcon, ListIcon, ExclamationIcon, CaseIcon, SparklesIcon } from './Icons';
import AppGuide from './AppGuide';
import { signOut, User } from 'firebase/auth';
import { auth, functions } from '../services/firebase';
import HelpModal from './HelpModal';
import { InfoIcon } from './InfoIcon';
import UserCalendar from './UserCalendar';
import { useUserCalendar } from '../hooks/useUserCalendar';
import { httpsCallable } from 'firebase/functions';
import PrivacyPolicyModal from './PrivacyPolicyModal';

interface UserProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpdateProfile: (profile: UserProfile, isSessionOnly: boolean) => void;
    user: User | null;
    profile: UserProfile;
    allTopics: Record<LawArea, string[]>;
}

type ProfileTab = 'personal' | 'quickActions' | 'calendar' | 'guide';

const UserProfileModal: React.FC<UserProfileModalProps> = ({
    isOpen,
    onClose,
    onUpdateProfile,
    user,
    profile: initialProfile,
    allTopics
}) => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<ProfileTab>('personal');
    const [currentProfile, setCurrentProfile] = useState<UserProfile>(initialProfile);
    const [newActionArea, setNewActionArea] = useState<LawArea | ''>('');
    const [newActionTopic, setNewActionTopic] = useState<string>('');
    const [isSessionOnly, setIsSessionOnly] = useState<boolean>(false);
    const [isHelpOpen, setIsHelpOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [confirmAction, setConfirmAction] = useState<{
        type: 'wipe' | 'delete' | 'reset',
        title: string,
        message: string,
        confirmText: string,
        confirmColor: string
    } | null>(null);

    const [isPrivacyPolicyOpen, setIsPrivacyPolicyOpen] = useState(false);
    const [isAcceptingPrivacyPolicy, setIsAcceptingPrivacyPolicy] = useState(false);

    const isMasterAdmin =
        user?.uid === "Yb23rXe0JdOvieB3grdaN0Brmkjh" ||
        user?.email?.includes("kbprojekt1975@gmail.com") ||
        user?.email?.includes("konrad@example.com") ||
        user?.email?.includes("wielki@electronik.com");

    const {
        allEvents,
        addReminder,
        deleteReminder,
        toggleReminder
    } = useUserCalendar(user);

    useEffect(() => {
        setCurrentProfile(initialProfile);
        if (!isOpen) {
            setNewActionArea('');
            setNewActionTopic('');
        }
    }, [initialProfile, isOpen]);

    const handleAddQuickAction = () => {
        if (!newActionArea) return;
        const newAction: QuickAction = {
            lawArea: newActionArea,
            ...(newActionTopic && { topic: newActionTopic })
        };

        const isDuplicate = currentProfile.quickActions?.some(
            qa => qa.lawArea === newAction.lawArea && qa.topic === newAction.topic
        );
        if (isDuplicate) {
            return; // Don't add duplicates
        }

        const updatedProfile = {
            ...currentProfile,
            quickActions: [...(currentProfile.quickActions || []), newAction]
        };
        setCurrentProfile(updatedProfile);
        onUpdateProfile(updatedProfile, isSessionOnly);
        setNewActionArea('');
        setNewActionTopic('');
    };

    const handleDeleteQuickAction = (indexToDelete: number) => {
        const updatedProfile = {
            ...currentProfile,
            quickActions: currentProfile.quickActions?.filter((_, index) => index !== indexToDelete)
        };
        setCurrentProfile(updatedProfile);
        onUpdateProfile(updatedProfile, isSessionOnly);
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            onClose();
        } catch (error) {
            console.error("Logout error", error);
        }
    };

    const handleDeletePersonalData = () => {
        setConfirmAction({
            type: 'wipe',
            title: t('userProfile.confirmations.wipeTitle'),
            message: t('userProfile.confirmations.wipeMessage'),
            confirmText: t('userProfile.confirmations.wipeConfirm'),
            confirmColor: 'bg-red-500 hover:bg-red-600'
        });
    };

    const handleDeleteAccount = () => {
        setConfirmAction({
            type: 'delete',
            title: t('userProfile.confirmations.deleteTitle'),
            message: t('userProfile.confirmations.deleteMessage'),
            confirmText: t('userProfile.confirmations.deleteConfirm'),
            confirmColor: 'bg-red-600 hover:bg-red-700'
        });
    };

    const handleResetDatabase = () => {
        setConfirmAction({
            type: 'reset',
            title: t('userProfile.confirmations.resetTitle'),
            message: t('userProfile.confirmations.resetMessage'),
            confirmText: t('userProfile.confirmations.resetConfirm'),
            confirmColor: 'bg-orange-600 hover:bg-orange-700'
        });
    };

    const executeConfirmAction = async () => {
        if (!confirmAction) return;
        const actionType = confirmAction.type;
        setConfirmAction(null);
        setIsDeleting(true);

        try {
            if (actionType === 'wipe') {
                const deleteDataFn = httpsCallable(functions, 'deleteMyPersonalData');
                await deleteDataFn();
                alert(t('userProfile.alerts.dataDeleted'));
                onClose();
                window.location.reload();
            } else if (actionType === 'delete') {
                const deleteAccountFn = httpsCallable(functions, 'deleteMyAccount');
                await deleteAccountFn();
                await signOut(auth);
                alert(t('userProfile.alerts.accountDeleted'));
                onClose();
            } else if (actionType === 'reset') {
                const resetDbFn = httpsCallable(functions, 'resetGlobalDatabase');
                await resetDbFn();
                alert(t('userProfile.alerts.databaseReset'));
                onClose();
            }
        } catch (err) {
            console.error(`${actionType} error:`, err);
            alert(t('userProfile.alerts.error'));
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div
            className={`fixed inset-0 bg-black bg-opacity-60 z-50 transition-opacity duration-300 ease-in-out ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            aria-labelledby="panel-title"
            role="dialog"
            aria-modal="true"
            onClick={onClose}
        >
            <div
                className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95%] max-w-2xl h-[90vh] bg-slate-800 shadow-2xl rounded-2xl border border-slate-700 transform transition-all duration-300 ease-in-out flex flex-col ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0 pointer-events-none'}`}
                onClick={e => e.stopPropagation()}
            >
                <header className="p-6 flex justify-between items-center border-b border-slate-700 flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <h3 className="text-xl leading-6 font-bold text-white" id="panel-title">
                            {t('userProfile.title')}
                        </h3>
                        <InfoIcon onClick={() => setIsHelpOpen(true)} className="ml-2" />
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                        aria-label={t('userProfile.closeLabel')}
                    >
                        <XIcon />
                    </button>
                </header>

                <div className="relative mx-4 md:mx-6 mt-4 group">
                    <div className="flex overflow-x-auto scrollbar-hide flex-nowrap bg-slate-900/50 p-1 rounded-xl border border-slate-700/50 gap-1 touch-pan-x">
                        <button
                            onClick={() => setActiveTab('personal')}
                            className={`flex-1 flex-shrink-0 min-w-fit whitespace-nowrap flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-all ${activeTab === 'personal' ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/20' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                            <UserIcon className="w-4 h-4" />
                            <span>{t('userProfile.tabs.personal')}</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('quickActions')}
                            className={`flex-1 flex-shrink-0 min-w-fit whitespace-nowrap flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-all ${activeTab === 'quickActions' ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/20' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                            <ListIcon className="w-4 h-4" />
                            <span>{t('userProfile.tabs.quickActions')}</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('calendar')}
                            className={`flex-1 flex-shrink-0 min-w-fit whitespace-nowrap flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-all ${activeTab === 'calendar' ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/20' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                            <CalendarIcon className="w-4 h-4" />
                            <span>{t('userProfile.tabs.calendar')}</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('guide')}
                            className={`flex-1 flex-shrink-0 min-w-fit whitespace-nowrap flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-all ${activeTab === 'guide' ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                            <SparklesIcon className="w-4 h-4" />
                            <span>{t('userProfile.tabs.guide')}</span>
                        </button>
                    </div>
                    {/* Visual indicators for scrolling */}
                    <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-800 to-transparent pointer-events-none rounded-r-xl md:hidden" />
                    <div className="flex md:hidden items-center justify-center gap-1.5 mt-2 text-[10px] text-slate-500 font-medium animate-pulse">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                        <span>{t('userProfile.swipeHint')}</span>
                    </div>
                </div>

                <main className="flex-1 overflow-y-auto p-6">
                    {activeTab === 'personal' && (
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

                            <div className="space-y-4">
                                <h4 className="text-lg font-medium text-white mb-2">{t('userProfile.personal.dataForDocuments')}</h4>
                                <p className="text-sm text-slate-400 mb-4">{t('userProfile.personal.dataDescription')}</p>

                                <div>
                                    <label htmlFor="fullName" className="block text-xs font-semibold text-slate-400 mb-1 uppercase">{t('userProfile.personal.fullName')}</label>
                                    <input
                                        id="fullName"
                                        type="text"
                                        value={currentProfile.personalData?.fullName || ''}
                                        onChange={e => setCurrentProfile({
                                            ...currentProfile,
                                            personalData: { ...(currentProfile.personalData || {}), fullName: e.target.value }
                                        })}
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
                                            onChange={e => setCurrentProfile({
                                                ...currentProfile,
                                                personalData: { ...(currentProfile.personalData || {}), address: e.target.value }
                                            })}
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
                                            onChange={e => setCurrentProfile({
                                                ...currentProfile,
                                                personalData: { ...(currentProfile.personalData || {}), postalCode: e.target.value }
                                            })}
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
                                            onChange={e => setCurrentProfile({
                                                ...currentProfile,
                                                personalData: { ...(currentProfile.personalData || {}), city: e.target.value }
                                            })}
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
                                            onChange={e => setCurrentProfile({
                                                ...currentProfile,
                                                personalData: { ...(currentProfile.personalData || {}), pesel: e.target.value }
                                            })}
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
                                            onChange={e => setCurrentProfile({
                                                ...currentProfile,
                                                personalData: { ...(currentProfile.personalData || {}), idNumber: e.target.value }
                                            })}
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
                                                    onClick={() => {
                                                        setIsAcceptingPrivacyPolicy(true);
                                                    }}
                                                    className="text-[10px] bg-cyan-600 hover:bg-cyan-500 text-white px-2 py-1 rounded font-bold transition-colors"
                                                >
                                                    WYRAŹ ZGODĘ
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

                                <div className="mt-10 pt-6 border-t border-slate-700/50">
                                    <div className="flex items-center gap-2 mb-4">
                                        <ExclamationIcon className="w-5 h-5 text-red-500" />
                                        <h5 className="text-sm font-bold text-red-500 uppercase tracking-wider">{t('userProfile.personal.dangerZone')}</h5>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex flex-col gap-1">
                                            <button
                                                onClick={handleDeletePersonalData}
                                                disabled={isDeleting}
                                                className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg p-3 text-sm font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                            >
                                                <TrashIcon className="w-4 h-4" />
                                                {t('userProfile.personal.wipeData')}
                                            </button>
                                            <p className="text-[10px] text-slate-500 px-1 text-center">{t('userProfile.personal.wipeDataNote')}</p>
                                        </div>

                                        <div className="flex flex-col gap-1">
                                            <button
                                                onClick={handleDeleteAccount}
                                                disabled={isDeleting}
                                                className="w-full bg-red-600 hover:bg-red-700 text-white rounded-lg p-3 text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-900/20 disabled:opacity-50"
                                            >
                                                <TrashIcon className="w-4 h-4" />
                                                {t('userProfile.personal.deleteAccount')}
                                            </button>
                                            <p className="text-[10px] text-slate-500 px-1">{t('userProfile.personal.deleteAccountNote')}</p>
                                        </div>

                                        {isMasterAdmin && (
                                            <div className="mt-6 p-4 bg-orange-500/5 border border-orange-500/20 rounded-xl">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <ExclamationIcon className="w-4 h-4 text-orange-500" />
                                                    <span className="text-xs font-bold text-orange-500">{t('userProfile.personal.adminOptions')}</span>
                                                </div>
                                                <button
                                                    onClick={handleResetDatabase}
                                                    disabled={isDeleting}
                                                    className="w-full bg-orange-600 hover:bg-orange-700 text-white rounded-lg p-3 text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-900/20 disabled:opacity-50"
                                                >
                                                    <CaseIcon className="w-4 h-4" />
                                                    {t('userProfile.personal.resetDatabase')}
                                                </button>
                                                <p className="text-[10px] text-orange-500/70 mt-2 text-center">{t('userProfile.personal.resetDatabaseNote')}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'quickActions' && (
                        <div>
                            <h4 className="text-lg font-medium text-white mb-2">{t('userProfile.quickActions.title')}</h4>
                            <p className="text-sm text-slate-400 mb-4">{t('userProfile.quickActions.description')}</p>

                            <div className="space-y-2 mb-4">
                                {currentProfile.quickActions?.map((qa, index) => (
                                    <div key={`${qa.lawArea}-${qa.topic || 'general'}-${index}`} className="flex items-center justify-between bg-slate-700/50 rounded-lg p-2 px-3 group">
                                        <span className="text-sm text-slate-200">
                                            {qa.lawArea}{qa.topic ? <span className="text-slate-400"> / {qa.topic}</span> : ''}
                                        </span>
                                        <button onClick={() => handleDeleteQuickAction(index)} className="text-slate-500 hover:text-red-500 transition-colors opacity-50 group-hover:opacity-100" aria-label={`${t('userProfile.quickActions.deleteLabel')} ${qa.lawArea} ${qa.topic || ''}`}>
                                            <TrashIcon />
                                        </button>
                                    </div>
                                ))}
                                {(!currentProfile.quickActions || currentProfile.quickActions.length === 0) && (
                                    <p className="text-sm text-slate-500 text-center py-2">{t('userProfile.quickActions.noActions')}</p>
                                )}
                            </div>

                            <div className="space-y-3 p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                                <h5 className="text-sm font-semibold text-white">{t('userProfile.quickActions.addNew')}</h5>
                                <select
                                    value={newActionArea}
                                    onChange={e => { setNewActionArea(e.target.value as LawArea); setNewActionTopic(''); }}
                                    className="w-full bg-slate-700/50 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 border border-slate-600/50"
                                >
                                    <option value="">{t('userProfile.quickActions.selectLawArea')}</option>
                                    {Object.values(LawArea).map(area => <option key={area} value={area}>{t(`law.areas.${area.toLowerCase()}`)}</option>)}
                                </select>

                                {newActionArea && (
                                    <select
                                        value={newActionTopic}
                                        onChange={e => setNewActionTopic(e.target.value)}
                                        className="w-full bg-slate-700/50 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 border border-slate-600/50"
                                    >
                                        <option value="">{t('userProfile.quickActions.selectTopic')}</option>
                                        {allTopics[newActionArea]?.map(topic => <option key={topic} value={topic}>{topic}</option>)}
                                    </select>
                                )}

                                <button
                                    onClick={handleAddQuickAction}
                                    disabled={!newActionArea}
                                    className="w-full flex items-center justify-center gap-2 bg-cyan-600/20 text-cyan-300 border border-cyan-600/50 rounded-lg p-3 text-sm font-medium hover:bg-cyan-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <PlusCircleIcon />
                                    {t('userProfile.quickActions.addButton')}
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'calendar' && (
                        <UserCalendar
                            events={allEvents}
                            onAddReminder={addReminder}
                            onDeleteReminder={deleteReminder}
                            onToggleReminder={toggleReminder}
                        />
                    )}

                    {activeTab === 'guide' && (
                        <AppGuide onClose={onClose} />
                    )}
                </main>

                <footer className="p-6 border-t border-slate-700 flex-shrink-0 flex justify-between items-center">
                    <button
                        onClick={() => setIsPrivacyPolicyOpen(true)}
                        className="text-sm text-cyan-400 hover:text-cyan-300 hover:underline transition-colors"
                    >
                        {t('userProfile.footer.privacyPolicy')}
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex justify-center rounded-md border border-slate-600 shadow-sm px-4 py-2 bg-slate-700 text-base font-medium text-slate-300 hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 focus:ring-offset-slate-800 sm:text-sm transition-colors"
                    >
                        {t('userProfile.footer.close')}
                    </button>
                </footer>
            </div>

            <HelpModal
                isOpen={isHelpOpen}
                onClose={() => setIsHelpOpen(false)}
                title={t('userProfile.help.title')}
            >
                <div className="space-y-4">
                    <p>
                        {t('userProfile.help.intro')}
                    </p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>
                            <strong>{t('userProfile.help.quickActionsTitle')}</strong> {t('userProfile.help.quickActionsDesc')}
                        </li>
                        <li>
                            <strong>{t('userProfile.help.dataTitle')}</strong> {t('userProfile.help.dataDesc')}
                        </li>
                        <li>
                            <strong>{t('userProfile.help.sessionTitle')}</strong> {t('userProfile.help.sessionDesc')}
                        </li>
                    </ul>
                </div>
            </HelpModal>

            <PrivacyPolicyModal
                isOpen={isPrivacyPolicyOpen || isAcceptingPrivacyPolicy}
                onClose={() => {
                    setIsPrivacyPolicyOpen(false);
                    setIsAcceptingPrivacyPolicy(false);
                }}
                showAcceptance={isAcceptingPrivacyPolicy}
                onAccept={() => {
                    const updated = { ...currentProfile, dataProcessingConsent: true, consentDate: new Date().toISOString() };
                    setCurrentProfile(updated);
                    onUpdateProfile(updated, isSessionOnly);
                    setIsAcceptingPrivacyPolicy(false);
                }}
            />

            {/* Confirmation Modal */}
            {confirmAction && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl max-w-sm w-full shadow-2xl animate-in zoom-in duration-200">
                        <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mb-4 mx-auto text-red-500">
                            <ExclamationIcon className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold text-white text-center mb-2">{confirmAction.title}</h3>
                        <p className="text-sm text-slate-400 text-center mb-6 leading-relaxed">
                            {confirmAction.message}
                        </p>
                        <div className="flex flex-col gap-2">
                            <button
                                onClick={executeConfirmAction}
                                className={`w-full py-3 rounded-xl text-white font-bold transition-all shadow-lg ${confirmAction.confirmColor}`}
                            >
                                {confirmAction.confirmText}
                            </button>
                            <button
                                onClick={() => setConfirmAction(null)}
                                className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl font-medium transition-colors"
                            >
                                {t('userProfile.confirmations.cancel')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserProfileModal;
