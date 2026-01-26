import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { UserProfile, QuickAction, LawArea } from '../types';
import { XIcon, ExclamationIcon } from './Icons';
import AppGuide from './AppGuide';
import { signOut, User } from 'firebase/auth';
import { auth, functions } from '../services/firebase';
import HelpModal from './HelpModal';
import { InfoIcon } from './InfoIcon';
import UserCalendar from './UserCalendar';
import { useUserCalendar } from '../hooks/useUserCalendar';
import { httpsCallable } from 'firebase/functions';
import PrivacyPolicyModal from './PrivacyPolicyModal';

// Modular Components
import ProfileTabs, { ProfileTab } from './profile/ProfileTabs';
import PersonalTab from './profile/PersonalTab';
import QuickActionsTab from './profile/QuickActionsTab';
import DangerZone from './profile/DangerZone';

interface UserProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpdateProfile: (profile: UserProfile, isSessionOnly: boolean) => void;
    user: User | null;
    profile: UserProfile;
    allTopics: Record<LawArea, string[]>;
}

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

    const handleAddQuickAction = useCallback(() => {
        if (!newActionArea) return;
        const newAction: QuickAction = {
            lawArea: newActionArea,
            ...(newActionTopic && { topic: newActionTopic })
        };

        const isDuplicate = currentProfile.quickActions?.some(
            qa => qa.lawArea === newAction.lawArea && qa.topic === newAction.topic
        );
        if (isDuplicate) return;

        const updatedProfile = {
            ...currentProfile,
            quickActions: [...(currentProfile.quickActions || []), newAction]
        };
        setCurrentProfile(updatedProfile);
        onUpdateProfile(updatedProfile, isSessionOnly);
        setNewActionArea('');
        setNewActionTopic('');
    }, [newActionArea, newActionTopic, currentProfile, onUpdateProfile, isSessionOnly]);

    const handleDeleteQuickAction = useCallback((indexToDelete: number) => {
        const updatedProfile = {
            ...currentProfile,
            quickActions: currentProfile.quickActions?.filter((_, index) => index !== indexToDelete)
        };
        setCurrentProfile(updatedProfile);
        onUpdateProfile(updatedProfile, isSessionOnly);
    }, [currentProfile, onUpdateProfile, isSessionOnly]);

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

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-60 z-[100] transition-opacity duration-300 ease-in-out flex items-center justify-center p-4 backdrop-blur-sm"
            aria-labelledby="panel-title"
            role="dialog"
            aria-modal="true"
            onClick={onClose}
        >
            <div
                className="w-full max-w-2xl h-[90vh] bg-slate-800 shadow-2xl rounded-2xl border border-slate-700 transform transition-all duration-300 ease-in-out flex flex-col animate-in zoom-in-95 duration-200"
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

                <ProfileTabs activeTab={activeTab} setActiveTab={setActiveTab} />

                <main className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                    {activeTab === 'personal' && (
                        <div className="space-y-8 animate-in fade-in duration-300">
                            <PersonalTab
                                user={user}
                                currentProfile={currentProfile}
                                setCurrentProfile={setCurrentProfile}
                                isSessionOnly={isSessionOnly}
                                setIsSessionOnly={setIsSessionOnly}
                                handleLogout={handleLogout}
                                onUpdateProfile={onUpdateProfile}
                                setIsAcceptingPrivacyPolicy={setIsAcceptingPrivacyPolicy}
                                setIsPrivacyPolicyOpen={setIsPrivacyPolicyOpen}
                            />
                            <DangerZone
                                isDeleting={isDeleting}
                                isMasterAdmin={isMasterAdmin}
                                handleDeletePersonalData={handleDeletePersonalData}
                                handleDeleteAccount={handleDeleteAccount}
                                handleResetDatabase={handleResetDatabase}
                            />
                        </div>
                    )}

                    {activeTab === 'quickActions' && (
                        <div className="animate-in fade-in duration-300">
                            <QuickActionsTab
                                currentProfile={currentProfile}
                                allTopics={allTopics}
                                newActionArea={newActionArea}
                                setNewActionArea={setNewActionArea}
                                newActionTopic={newActionTopic}
                                setNewActionTopic={setNewActionTopic}
                                handleAddQuickAction={handleAddQuickAction}
                                handleDeleteQuickAction={handleDeleteQuickAction}
                            />
                        </div>
                    )}

                    {activeTab === 'calendar' && (
                        <div className="animate-in fade-in duration-300">
                            <UserCalendar
                                events={allEvents}
                                onAddReminder={addReminder}
                                onDeleteReminder={deleteReminder}
                                onToggleReminder={toggleReminder}
                            />
                        </div>
                    )}

                    {activeTab === 'guide' && (
                        <div className="animate-in fade-in duration-300">
                            <AppGuide onClose={onClose} />
                        </div>
                    )}
                </main>

                <footer className="p-6 border-t border-slate-700 flex-shrink-0 flex justify-between items-center bg-slate-800/50">
                    <button
                        onClick={() => setIsPrivacyPolicyOpen(true)}
                        className="text-sm text-cyan-400 hover:text-cyan-300 hover:underline transition-colors"
                    >
                        {t('userProfile.footer.privacyPolicy')}
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex justify-center rounded-xl border border-slate-600 shadow-sm px-6 py-2 bg-slate-700 text-sm font-bold text-slate-300 hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 focus:ring-offset-slate-800 transition-all active:scale-95"
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
                    <p>{t('userProfile.help.intro')}</p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>{t('userProfile.help.quickActionsTitle')}</strong> {t('userProfile.help.quickActionsDesc')}</li>
                        <li><strong>{t('userProfile.help.dataTitle')}</strong> {t('userProfile.help.dataDesc')}</li>
                        <li><strong>{t('userProfile.help.sessionTitle')}</strong> {t('userProfile.help.sessionDesc')}</li>
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
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
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
