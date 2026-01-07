
import React, { useState, useEffect } from 'react';
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

    const isMasterAdmin =
        user?.uid === "Yb23rXe0JdOvieB3grdaN0Brmkjh" ||
        user?.email?.includes("kbprojekt1975@gmail.com") ||
        user?.email?.includes("konrad@example.com");

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
            title: 'Wyczyścić wszystko?',
            message: 'Ta operacja TRWALE usunie: całą historię czatów, wszystkie wgrane pliki, Twoje zapisane sprawy oraz dane profilowe. Twoje powiązane konto i subskrypcja pozostaną aktywne.',
            confirmText: 'Tak, wyczyść wszystko',
            confirmColor: 'bg-red-500 hover:bg-red-600'
        });
    };

    const handleDeleteAccount = () => {
        setConfirmAction({
            type: 'delete',
            title: 'Trwale usunąć konto?',
            message: 'UWAGA: To działanie jest NIEODWRACALNE. Wszystkie Twoje dane, pliki i historia zostaną bezpowrotnie usunięte, a dostęp do systemu zostanie zamknięty.',
            confirmText: 'Tak, usuń moje konto',
            confirmColor: 'bg-red-600 hover:bg-red-700'
        });
    };

    const handleResetDatabase = () => {
        setConfirmAction({
            type: 'reset',
            title: 'ZRESTARTOWAĆ CAŁĄ BAZĘ?',
            message: 'KRYTYCZNE: Operacja usunie dane WSZYSTKICH użytkowników systemu. To narzędzie wyłącznie dla głównego administratora.',
            confirmText: 'TAK, RESTARTUJ WSZYSTKO',
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
                alert("Twoje dane osobowe i historia zostały usunięte.");
                onClose();
                window.location.reload();
            } else if (actionType === 'delete') {
                const deleteAccountFn = httpsCallable(functions, 'deleteMyAccount');
                await deleteAccountFn();
                await signOut(auth);
                alert("Twoje konto zostało usunięte.");
                onClose();
            } else if (actionType === 'reset') {
                const resetDbFn = httpsCallable(functions, 'resetGlobalDatabase');
                await resetDbFn();
                alert("Baza danych została zrestartowana pomyślnie.");
                onClose();
            }
        } catch (err) {
            console.error(`${actionType} error:`, err);
            alert("Wystąpił błąd podczas wykonywania operacji.");
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
                            Panel Użytkownika
                        </h3>
                        <InfoIcon onClick={() => setIsHelpOpen(true)} className="ml-2" />
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                        aria-label="Zamknij panel"
                    >
                        <XIcon />
                    </button>
                </header>

                <div className="flex bg-slate-900/50 p-1 mx-6 mt-4 rounded-xl border border-slate-700/50">
                    <button
                        onClick={() => setActiveTab('personal')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'personal' ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/20' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                        <UserIcon className="w-4 h-4" />
                        <span>Moje Dane</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('quickActions')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'quickActions' ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/20' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                        <ListIcon className="w-4 h-4" />
                        <span>Szybkie Akcje</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('calendar')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'calendar' ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/20' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                        <CalendarIcon className="w-4 h-4" />
                        <span>Kalendarz</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('guide')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'guide' ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                        <SparklesIcon className="w-4 h-4" />
                        <span>Przewodnik</span>
                    </button>
                </div>

                <main className="flex-1 overflow-y-auto p-6">
                    {activeTab === 'personal' && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-700">
                                <div className="w-12 h-12 rounded-full bg-cyan-600 flex items-center justify-center text-xl font-bold text-white">
                                    {auth.currentUser?.email?.charAt(0).toUpperCase() || "U"}
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <p className="text-white font-medium truncate">{auth.currentUser?.email}</p>
                                    <button
                                        onClick={handleLogout}
                                        className="text-sm text-red-400 hover:text-red-300 transition-colors"
                                    >
                                        Wyloguj się
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-lg font-medium text-white mb-2">Dane do Pism</h4>
                                <p className="text-sm text-slate-400 mb-4">Uzupełnij swoje dane, aby automatycznie wstawiać je do generowanych dokumentów.</p>

                                <div>
                                    <label htmlFor="fullName" className="block text-xs font-semibold text-slate-400 mb-1 uppercase">Imię i Nazwisko</label>
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
                                        <label htmlFor="address" className="block text-xs font-semibold text-slate-400 mb-1 uppercase">Adres zamieszkania</label>
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
                                        <label htmlFor="postalCode" className="block text-xs font-semibold text-slate-400 mb-1 uppercase">Kod pocztowy</label>
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
                                        <label htmlFor="city" className="block text-xs font-semibold text-slate-400 mb-1 uppercase">Miejscowość</label>
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
                                        <label htmlFor="pesel" className="block text-xs font-semibold text-slate-400 mb-1 uppercase">PESEL</label>
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
                                        <label htmlFor="idNumber" className="block text-xs font-semibold text-slate-400 mb-1 uppercase">Nr Dowodu</label>
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
                                        Zapisz tylko dla tej sesji (dane znikną po zamknięciu przeglądarki)
                                    </label>
                                </div>

                                <button
                                    onClick={() => onUpdateProfile(currentProfile, isSessionOnly)}
                                    className="w-full bg-cyan-600 text-white rounded-lg p-3 text-sm font-bold hover:bg-cyan-500 shadow-lg shadow-cyan-600/20 transition-all mt-2"
                                >
                                    Zapisz Dane Osobowe
                                </button>
                                <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700/50 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-semibold text-slate-400 uppercase">Zgoda na przetwarzanie danych</span>
                                        {currentProfile.dataProcessingConsent ? (
                                            <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-[10px] font-bold rounded-full border border-green-500/30">UDZIELONA</span>
                                        ) : (
                                            <div className="flex flex-col items-end gap-2">
                                                <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-[10px] font-bold rounded-full border border-red-500/30">BRAK</span>
                                                <button
                                                    onClick={() => {
                                                        const updated = { ...currentProfile, dataProcessingConsent: true, consentDate: new Date().toISOString() };
                                                        setCurrentProfile(updated);
                                                        onUpdateProfile(updated, isSessionOnly);
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
                                            ? "Zgoda została udzielona. Twoje dane są bezpiecznie przechowywane w chmurze i synchronizowane między urządzeniami."
                                            : "Obecnie pracujesz w trybie lokalnym. Twoje dane są zapisywane tylko w tej przeglądarce i znikną po wyczyszczeniu jej pamięci."}
                                        {currentProfile.consentDate && (
                                            <span className="block mt-1 text-slate-600">
                                                Data udzielenia: {currentProfile.consentDate.toDate ? currentProfile.consentDate.toDate().toLocaleString() : new Date(currentProfile.consentDate).toLocaleString()}
                                            </span>
                                        )}
                                    </p>
                                </div>

                                <p className="text-[10px] text-slate-500 text-center mt-2 px-2">
                                    Podanie tych danych jest dobrowolne, ale niezbędne do wygenerowania pisma procesowego. Administratorem danych jest [Administrator]. Szczegóły w <button onClick={() => setIsPrivacyPolicyOpen(true)} className="text-cyan-500 hover:underline">Polityce Prywatności</button>.
                                </p>

                                <div className="mt-10 pt-6 border-t border-slate-700/50">
                                    <div className="flex items-center gap-2 mb-4">
                                        <ExclamationIcon className="w-5 h-5 text-red-500" />
                                        <h5 className="text-sm font-bold text-red-500 uppercase tracking-wider">Strefa Zagrożenia</h5>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex flex-col gap-1">
                                            <button
                                                onClick={handleDeletePersonalData}
                                                disabled={isDeleting}
                                                className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg p-3 text-sm font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                            >
                                                <TrashIcon className="w-4 h-4" />
                                                Wyczyść wszystko (Czaty, Pliki, Dane)
                                            </button>
                                            <p className="text-[10px] text-slate-500 px-1 text-center">UWAGA: Czyści wszystkie czaty, wgrane pliki i dane profilu, zachowując samo konto.</p>
                                        </div>

                                        <div className="flex flex-col gap-1">
                                            <button
                                                onClick={handleDeleteAccount}
                                                disabled={isDeleting}
                                                className="w-full bg-red-600 hover:bg-red-700 text-white rounded-lg p-3 text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-900/20 disabled:opacity-50"
                                            >
                                                <TrashIcon className="w-4 h-4" />
                                                Trwale usuń moje konto
                                            </button>
                                            <p className="text-[10px] text-slate-500 px-1">Całkowite usunięcie profilu i dostępu do systemu.</p>
                                        </div>

                                        {isMasterAdmin && (
                                            <div className="mt-6 p-4 bg-orange-500/5 border border-orange-500/20 rounded-xl">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <ExclamationIcon className="w-4 h-4 text-orange-500" />
                                                    <span className="text-xs font-bold text-orange-500">OPCJE ADMINISTRATORA</span>
                                                </div>
                                                <button
                                                    onClick={handleResetDatabase}
                                                    disabled={isDeleting}
                                                    className="w-full bg-orange-600 hover:bg-orange-700 text-white rounded-lg p-3 text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-900/20 disabled:opacity-50"
                                                >
                                                    <CaseIcon className="w-4 h-4" />
                                                    RESTARTUJ CAŁĄ BAZĘ DANYCH (RESET)
                                                </button>
                                                <p className="text-[10px] text-orange-500/70 mt-2 text-center">UWAGA: Usuwa dane wszystkich użytkowników! Aktywne konta zostaną zachowane.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'quickActions' && (
                        <div>
                            <h4 className="text-lg font-medium text-white mb-2">Szybkie Akcje</h4>
                            <p className="text-sm text-slate-400 mb-4">Dodaj skróty do najczęściej używanych dziedzin lub tematów, aby mieć do nich szybki dostęp.</p>

                            <div className="space-y-2 mb-4">
                                {currentProfile.quickActions?.map((qa, index) => (
                                    <div key={`${qa.lawArea}-${qa.topic || 'general'}-${index}`} className="flex items-center justify-between bg-slate-700/50 rounded-lg p-2 px-3 group">
                                        <span className="text-sm text-slate-200">
                                            {qa.lawArea}{qa.topic ? <span className="text-slate-400"> / {qa.topic}</span> : ''}
                                        </span>
                                        <button onClick={() => handleDeleteQuickAction(index)} className="text-slate-500 hover:text-red-500 transition-colors opacity-50 group-hover:opacity-100" aria-label={`Usuń skrót ${qa.lawArea} ${qa.topic || ''}`}>
                                            <TrashIcon />
                                        </button>
                                    </div>
                                ))}
                                {(!currentProfile.quickActions || currentProfile.quickActions.length === 0) && (
                                    <p className="text-sm text-slate-500 text-center py-2">Brak zdefiniowanych szybkich akcji.</p>
                                )}
                            </div>

                            <div className="space-y-3 p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                                <h5 className="text-sm font-semibold text-white">Dodaj nowy skrót</h5>
                                <select
                                    value={newActionArea}
                                    onChange={e => { setNewActionArea(e.target.value as LawArea); setNewActionTopic(''); }}
                                    className="w-full bg-slate-700/50 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 border border-slate-600/50"
                                >
                                    <option value="">Wybierz dziedzinę prawa...</option>
                                    {Object.values(LawArea).map(area => <option key={area} value={area}>{area}</option>)}
                                </select>

                                {newActionArea && (
                                    <select
                                        value={newActionTopic}
                                        onChange={e => setNewActionTopic(e.target.value)}
                                        className="w-full bg-slate-700/50 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 border border-slate-600/50"
                                    >
                                        <option value="">Dowolny temat / Ogólne</option>
                                        {allTopics[newActionArea]?.map(topic => <option key={topic} value={topic}>{topic}</option>)}
                                    </select>
                                )}

                                <button
                                    onClick={handleAddQuickAction}
                                    disabled={!newActionArea}
                                    className="w-full flex items-center justify-center gap-2 bg-cyan-600/20 text-cyan-300 border border-cyan-600/50 rounded-lg p-3 text-sm font-medium hover:bg-cyan-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <PlusCircleIcon />
                                    Dodaj skrót
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
                        Polityka Prywatności
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex justify-center rounded-md border border-slate-600 shadow-sm px-4 py-2 bg-slate-700 text-base font-medium text-slate-300 hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 focus:ring-offset-slate-800 sm:text-sm transition-colors"
                    >
                        Zamknij
                    </button>
                </footer>
            </div>

            <HelpModal
                isOpen={isHelpOpen}
                onClose={() => setIsHelpOpen(false)}
                title="Panel Użytkownika - Pomoc"
            >
                <div className="space-y-4">
                    <p>
                        W tym panelu możesz zarządzać swoimi ustawieniami i danymi.
                    </p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>
                            <strong>Szybkie Akcje:</strong> Definiuj skróty do najczęściej używanych tematów.
                            Dzięki temu będziesz mieć je zawsze pod ręką w głównym menu.
                        </li>
                        <li>
                            <strong>Dane do Pism:</strong> Uzupełnij swoje dane raz, a system automatycznie
                            będzie je wstawiał do generowanych pozwów i wniosków. To oszczędność czasu!
                        </li>
                        <li>
                            <strong>Zapis sesji:</strong> Możesz wybrać, czy dane mają być zapamiętane na stałe,
                            czy tylko do momentu zamknięcia przeglądarki.
                        </li>
                    </ul>
                </div>
            </HelpModal>

            <PrivacyPolicyModal
                isOpen={isPrivacyPolicyOpen}
                onClose={() => setIsPrivacyPolicyOpen(false)}
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
                                Anuluj
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserProfileModal;
