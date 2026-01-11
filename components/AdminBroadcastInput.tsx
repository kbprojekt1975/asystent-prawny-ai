import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { MegaphoneIcon, XMarkIcon, CheckIcon } from './Icons';

interface AdminBroadcastInputProps {
    user: User | null;
}

const ADMIN_UIDS = ["Yb23rXe0JdOvieB3grdaN0Brmkjh"];
const ADMIN_EMAILS = ["kbprojekt1975@gmail.com", "konrad@example.com"];

const AdminBroadcastInput: React.FC<AdminBroadcastInputProps> = ({ user }) => {
    const [message, setMessage] = useState('');
    const [isActive, setIsActive] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);

    const isAdmin = user && (
        ADMIN_UIDS.includes(user.uid) ||
        (user.email && ADMIN_EMAILS.some(email => user.email?.includes(email)))
    );

    useEffect(() => {
        if (!isAdmin) return;

        const unsub = onSnapshot(doc(db, 'config', 'broadcast'), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setMessage(data.message || '');
                setIsActive(data.active || false);
            }
        });

        return () => unsub();
    }, [isAdmin]);

    const handleSave = async (active: boolean) => {
        if (!isAdmin) return;
        setIsSaving(true);
        try {
            await setDoc(doc(db, 'config', 'broadcast'), {
                message,
                active,
                updatedAt: new Date(),
                author: user?.email
            });
            setIsActive(active);
            setLastSaved(new Date());
        } catch (error) {
            console.error('Error saving broadcast:', error);
        } finally {
            setIsSaving(false);
        }
    };

    if (!isAdmin) return null;

    return (
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 mb-8 backdrop-blur-sm shadow-xl">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-lg">
                    <MegaphoneIcon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white">Panel Ogłoszeń Administratora</h3>
            </div>

            <div className="space-y-4">
                <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Wpisz treść ogłoszenia dla wszystkich użytkowników..."
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl p-4 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all min-h-[100px] resize-none"
                />

                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleSave(true)}
                            disabled={isSaving || !message.trim()}
                            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl font-semibold transition-all shadow-lg shadow-cyan-900/20 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                        >
                            <CheckIcon className="w-4 h-4" />
                            Publikuj
                        </button>
                        <button
                            onClick={() => handleSave(false)}
                            disabled={isSaving || !isActive}
                            className="flex items-center gap-2 px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl font-semibold transition-all active:scale-95 disabled:opacity-50"
                        >
                            <XMarkIcon className="w-4 h-4" />
                            Wyłącz
                        </button>
                    </div>

                    {lastSaved && (
                        <span className="text-xs text-slate-500 italic">
                            Ostatnia zmiana: {lastSaved.toLocaleTimeString()}
                        </span>
                    )}

                    {isActive && (
                        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-xs font-bold border border-emerald-500/20 animate-pulse">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                            AKTUALNIE WYŚWIETLANE
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminBroadcastInput;
