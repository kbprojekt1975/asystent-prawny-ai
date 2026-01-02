import React, { useState, useEffect } from 'react';
import { XIcon } from './Icons';

const CookieConsent: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem('cookieConsent');
        if (!consent) {
            setIsVisible(true);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem('cookieConsent', 'true');
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 bg-slate-900/95 backdrop-blur-md border-t border-slate-700 shadow-2xl animate-in slide-in-from-bottom duration-500">
            <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                <p>
                    Ta strona korzysta z ciasteczek (cookies). Wszelkie dane wprowadzasz na własną odpowiedzialność i w każdej chwili możesz je usunąć.
                    Twoje dane są przechowywane w bazie wiedzy z zachowaniem najwyższych standardów bezpieczeństwa.
                    Korzystając ze strony, wyrażasz zgodę na używanie cookies.
                </p>
                <div className="flex items-center gap-3 flex-shrink-0">
                    <button
                        onClick={handleAccept}
                        className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-lg transition-colors whitespace-nowrap shadow-lg shadow-cyan-900/20"
                    >
                        Akceptuję
                    </button>
                    <button
                        onClick={() => setIsVisible(false)}
                        className="p-2 text-slate-400 hover:text-white transition-colors"
                        aria-label="Zamknij"
                    >
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CookieConsent;
