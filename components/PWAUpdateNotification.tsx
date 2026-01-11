import React, { useState, useEffect } from 'react';
import { SparklesIcon, RefreshIcon } from './Icons';

const PWAUpdateNotification: React.FC = () => {
    const [show, setShow] = useState(false);
    const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

    useEffect(() => {
        const handleUpdate = (e: any) => {
            setRegistration(e.detail);
            setShow(true);
        };

        window.addEventListener('pwa-update-available', handleUpdate);
        return () => window.removeEventListener('pwa-update-available', handleUpdate);
    }, []);

    const updateApp = () => {
        if (registration && registration.waiting) {
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
        setShow(false);
    };

    if (!show) return null;

    return (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-md animate-in slide-in-from-bottom-8 duration-500">
            <div className="bg-slate-800/90 backdrop-blur-xl border border-cyan-500/50 p-4 rounded-2xl shadow-2xl shadow-cyan-950/40 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="bg-cyan-500/20 p-2 rounded-xl">
                        <SparklesIcon className="w-6 h-6 text-cyan-400 animate-pulse" />
                    </div>
                    <div>
                        <h4 className="text-white font-bold text-sm">Dostępna aktualizacja!</h4>
                        <p className="text-slate-400 text-xs">Pobraliśmy nową wersję asystenta.</p>
                    </div>
                </div>
                <button
                    onClick={updateApp}
                    className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-2 transition-all active:scale-95 whitespace-nowrap"
                >
                    <RefreshIcon className="w-4 h-4" />
                    ODŚWIEŻ
                </button>
            </div>
        </div>
    );
};

export default PWAUpdateNotification;
