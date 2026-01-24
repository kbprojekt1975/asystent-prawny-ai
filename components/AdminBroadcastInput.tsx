import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { MegaphoneIcon, XMarkIcon, CheckIcon, ChevronDownIcon } from './Icons';

interface AdminBroadcastInputProps {
    user: User | null;
}

const ADMIN_UIDS = ["Yb23rXe0JdOvieB3grdaN0Brmkjh"];
const ADMIN_EMAILS = ["kbprojekt1975@gmail.com", "konrad@example.com", "wielki@electronik.com"];

const AdminBroadcastInput: React.FC<AdminBroadcastInputProps> = ({ user }) => {
    const [message, setMessage] = useState('');
    const [isActive, setIsActive] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [isCollapsed, setIsCollapsed] = useState(true);

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
        <div className="fixed top-0 left-4 z-[100] flex items-start gap-2">
            {/* Minimalist Top Arrow Trigger */}
            {isCollapsed ? (
                <button
                    onClick={() => setIsCollapsed(false)}
                    className={`px-3 py-1.5 rounded-b-xl border-x border-b shadow-lg transition-all hover:py-2 active:scale-95 group/admin ${isActive ? 'bg-emerald-600 border-emerald-400 text-white animate-pulse' : 'bg-slate-800/80 border-slate-700/50 text-slate-500 hover:text-white hover:bg-slate-800'}`}
                    title="Panel Administratora"
                >
                    <ChevronDownIcon className="w-4 h-4 transition-transform group-hover/admin:translate-y-0.5" />
                </button>
            ) : (
                <div className={`mt-4 bg-slate-800 border-2 ${isActive ? 'border-emerald-500/50' : 'border-slate-700'} rounded-2xl p-6 backdrop-blur-xl shadow-2xl w-full max-w-sm animate-in slide-in-from-top-4 duration-300 relative`}>
                    <button
                        onClick={() => setIsCollapsed(true)}
                        className="absolute top-4 right-4 p-1.5 text-slate-500 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        <XMarkIcon className="w-4 h-4" />
                    </button>

                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-lg">
                            <MegaphoneIcon className="w-5 h-5" />
                        </div>
                        <h3 className="text-base font-bold text-white">Admin Broadcast</h3>
                    </div>

                    <div className="space-y-4">
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Treść ogłoszenia..."
                            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl p-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all min-h-[100px] resize-none"
                        />

                        <div className="flex flex-col gap-3">
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleSave(true)}
                                    disabled={isSaving || !message.trim()}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-sm rounded-xl font-semibold transition-all shadow-lg shadow-cyan-900/20 disabled:opacity-50 active:scale-95"
                                >
                                    <CheckIcon className="w-4 h-4" />
                                    Publikuj
                                </button>
                                <button
                                    onClick={() => handleSave(false)}
                                    disabled={isSaving || !isActive}
                                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm rounded-xl font-semibold transition-all active:scale-95 disabled:opacity-50"
                                >
                                    Wyłącz
                                </button>
                            </div>

                            <div className="flex items-center justify-between">
                                {isActive && (
                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 animate-pulse">
                                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                                        AKTYWNE
                                    </div>
                                )}
                                {lastSaved && (
                                    <span className="text-[10px] text-slate-500 italic ml-auto">
                                        Saved: {lastSaved.toLocaleTimeString()}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminBroadcastInput;
