import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ClockIcon, SparklesIcon } from './Icons';
import { auth } from '../services/firebase';

const AwaitingActivation: React.FC<{ isManuallyBlocked?: boolean }> = ({ isManuallyBlocked = false }) => {
    const { t } = useTranslation();
    const user = auth.currentUser;

    const isAdmin = useMemo(() => {
        if (!user) return false;
        const ADMIN_EMAILS = ["kbprojekt1975@gmail.com", "konrad@example.com", "wielki@electronik.com"];
        return ADMIN_EMAILS.some(email => user.email?.includes(email));
    }, [user]);

    // Use String or Boolean check to avoid type mismatch
    const isEmulator = String(import.meta.env.VITE_USE_EMULATORS) === 'true';

    const handleManualActivation = async () => {
        if (!user) return;
        try {
            const { setDoc, doc, serverTimestamp, updateDoc } = await import('firebase/firestore');
            const { db } = await import('../services/firebase');

            // 1. Mock a successful Stripe subscription (PRO by default for God Mode)
            await setDoc(doc(db, 'customers', user.uid, 'subscriptions', 'local_dev_sub'), {
                status: 'active',
                role: 'premium',
                items: [{ price: { id: "price_1Sw7KFDXnXONl2svPmtUXAxk" } }],
                created: serverTimestamp(),
                current_period_start: serverTimestamp(),
                current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            });

            // 2. Mark profile as active and PAID
            await updateDoc(doc(db, 'users', user.uid), {
                "profile.isActive": true,
                "profile.hasSeenWelcomeAssistant": false,
                "profile.subscription.isPaid": true,
                "profile.subscription.status": "active",
                "profile.subscription.packageType": "pro",
                "profile.subscription.creditLimit": 50,
                "profile.subscription.tokenLimit": 2166666
            });

            alert("Konto zostało aktywowane pomyślnie! Zaraz zostaniesz przekierowany...");
        } catch (err) {
            console.error("Activation failed:", err);
            alert("Błąd aktywacji: " + (err as any).message);
        }
    };

    return (
        <div className="flex h-screen items-center justify-center bg-slate-800 px-4">
            <div className="max-w-md w-full bg-slate-800 border border-slate-700/50 p-8 rounded-2xl text-center shadow-2xl backdrop-blur-sm relative overflow-hidden">
                {(isEmulator || isAdmin) && (
                    <div className="absolute top-0 left-0 right-0 bg-cyan-600/20 py-2 border-b border-cyan-500/30 flex items-center justify-center gap-2">
                        <SparklesIcon className="w-3 h-3 text-cyan-400" />
                        <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">Tryb Deweloperski / Admin</span>
                    </div>
                )}

                <div className="w-16 h-16 bg-amber-500/20 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6 mt-4">
                    <ClockIcon className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-4">
                    {isManuallyBlocked ? 'Konto Zablokowane' : t('activation.title')}
                </h2>
                <p className="text-slate-400 mb-8 leading-relaxed">
                    {isManuallyBlocked ? (
                        <>
                            <span className="text-red-400 font-semibold block mb-2">Zablokowane przez WielkiElectronik</span>
                            <span className="block mb-2">Powód: Prawdopodobne naruszenie zasad.</span>
                            <span className="block">Skontaktuj się z administratorem w celu wyjaśnienia sytuacji.</span>
                        </>
                    ) : (
                        t('activation.description')
                    )}
                </p>

                {(isEmulator || isAdmin) && (
                    <button
                        onClick={handleManualActivation}
                        className="w-full mb-6 py-4 px-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl transition-all font-bold shadow-lg shadow-cyan-900/40 border border-cyan-400/30 flex items-center justify-center gap-2 group"
                    >
                        <SparklesIcon className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                        AKTYWUJ KONTO TERAZ (ADMIN)
                    </button>
                )}

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
                        className="w-full py-3 px-4 bg-slate-700/50 hover:bg-slate-700 text-slate-400 rounded-xl transition-colors font-medium border border-slate-700"
                    >
                        {t('activation.logout')}
                    </button>
                </div>
            </div>
        </div>
    );
};
export default AwaitingActivation;
