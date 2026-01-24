import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { XIcon, SparklesIcon } from './Icons';

interface InstallPWAPromptProps {
    isOpen: boolean;
    onClose: () => void;
    onInstall: () => void;
    onDismissForever: (dontAskAgain: boolean) => void;
}

const InstallPWAPrompt: React.FC<InstallPWAPromptProps> = ({ isOpen, onClose, onInstall, onDismissForever }) => {
    const { t } = useTranslation();
    const [dontAskAgain, setDontAskAgain] = useState(false);

    if (!isOpen) return null;

    const handleClose = () => {
        onDismissForever(dontAskAgain);
        onClose();
    };

    const handleInstallClick = () => {
        onInstall();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-slate-900 border border-slate-700/50 rounded-3xl w-full max-w-md shadow-2xl flex flex-col animate-in zoom-in-95 duration-300 relative">
                {/* Header with Icon background */}
                <div className="relative p-8 pb-4 text-center">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl shadow-xl flex items-center justify-center border-4 border-slate-900">
                        <SparklesIcon className="w-10 h-10 text-white" />
                    </div>

                    <h2 className="text-2xl font-bold text-white mt-6 mb-2">
                        {t('install.title', 'Zainstaluj aplikację')}
                    </h2>
                    <p className="text-slate-400 text-sm leading-relaxed">
                        {t('install.description', 'Dodaj nas do ekranu głównego, aby mieć szybki dostęp do swoich spraw i otrzymywać powiadomienia nawet bez przeglądarki.')}
                    </p>
                </div>

                <div className="p-8 pt-4 space-y-6">
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={handleInstallClick}
                            className="w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-2xl shadow-lg shadow-cyan-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            <SparklesIcon className="w-5 h-5" />
                            {t('install.button', 'Zainstaluj teraz')}
                        </button>

                        <button
                            onClick={handleClose}
                            className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-2xl transition-all active:scale-[0.98]"
                        >
                            {t('install.later', 'Może później')}
                        </button>
                    </div>

                    <div className="flex items-center justify-center">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    checked={dontAskAgain}
                                    onChange={(e) => setDontAskAgain(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-5 h-5 border-2 border-slate-700 rounded-md peer-checked:bg-cyan-500 peer-checked:border-cyan-500 transition-all group-hover:border-slate-500"></div>
                                <svg className="absolute top-0.5 left-0.5 w-4 h-4 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <span className="text-xs text-slate-500 group-hover:text-slate-400 transition-colors">
                                {t('install.dont_ask', 'Nie pytaj więcej')}
                            </span>
                        </label>
                    </div>
                </div>

                {/* Decorative bottom edge */}
                <div className="h-1.5 w-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 opacity-50 rounded-b-3xl" />
            </div>
        </div>
    );
};

export default InstallPWAPrompt;
