import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { CampaignIcon, XMarkIcon, ChevronUpIcon } from './Icons';

const GlobalAnnouncement: React.FC = () => {
    const [announcement, setAnnouncement] = useState<{ message: string; active: boolean } | null>(null);
    const [isDismissed, setIsDismissed] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);

    useEffect(() => {
        // Listen to the global broadcast document
        const unsub = onSnapshot(doc(db, 'config', 'broadcast'), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setAnnouncement({
                    message: data.message,
                    active: data.active
                });
                // Reset dismissal when message changes or becomes active again
                setIsDismissed(false);
                setIsMinimized(false);
            }
        });

        return () => unsub();
    }, []);

    if (!announcement || !announcement.active || isDismissed || !announcement.message) {
        return null;
    }

    return (
        <div className="fixed top-0 left-0 right-0 z-[100] pointer-events-none">
            <div className="animate-slide-down pointer-events-auto">
                {isMinimized ? (
                    <div className="flex justify-center">
                        <button
                            onClick={() => setIsMinimized(false)}
                            className="bg-gradient-to-b from-cyan-600 to-blue-600 text-white px-4 py-1.5 rounded-b-xl shadow-lg border-x border-b border-white/20 flex items-center gap-2 hover:py-2 transition-all group"
                            title="Rozwiń wiadomość"
                        >
                            <CampaignIcon className="h-4 w-4 animate-pulse" />
                            <span className="text-xs font-semibold uppercase tracking-wider opacity-0 group-hover:opacity-100 max-w-0 group-hover:max-w-xs transition-all duration-300 overflow-hidden whitespace-nowrap">
                                Wiadomość
                            </span>
                        </button>
                    </div>
                ) : (
                    <div className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-2xl border-b border-white/10 overflow-hidden relative">
                        {/* Animated pattern background */}
                        <div className="absolute inset-0 opacity-10 pointer-events-none">
                            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                                <path d="M0 100 L100 0 L100 100 Z" fill="currentColor" />
                            </svg>
                        </div>

                        <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8 relative">
                            <div className="flex items-center justify-between flex-wrap gap-4">
                                <div className="w-0 flex-1 flex items-center min-w-0">
                                    <span className="flex p-2 rounded-lg bg-white/20">
                                        <CampaignIcon className="h-5 w-5 text-white" aria-hidden="true" />
                                    </span>
                                    <p className="ml-3 font-medium text-white truncate sm:text-base">
                                        <span className="hidden md:inline">Wiadomość systemowa: </span>
                                        <span className="whitespace-pre-wrap">{announcement.message}</span>
                                    </p>
                                </div>

                                <div className="order-2 flex-shrink-0 sm:order-3 ml-3 flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsMinimized(true)}
                                        className="flex p-2 rounded-md hover:bg-white/20 transition-all focus:outline-none focus:ring-2 focus:ring-white"
                                        title="Minimalizuj"
                                    >
                                        <ChevronUpIcon className="h-5 w-5 text-white" aria-hidden="true" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsDismissed(true)}
                                        className="flex p-2 rounded-md hover:bg-white/20 transition-all focus:outline-none focus:ring-2 focus:ring-white"
                                        title="Zamknij"
                                    >
                                        <XMarkIcon className="h-5 w-5 text-white" aria-hidden="true" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes slide-down {
                    from { transform: translateY(-100%); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .animate-slide-down {
                    animation: slide-down 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
            `}</style>
        </div>
    );
};

export default GlobalAnnouncement;
