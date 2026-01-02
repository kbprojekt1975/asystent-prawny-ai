import React, { useState, useEffect } from 'react';
import { XIcon } from './Icons';

const CookieConsent: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [showDetails, setShowDetails] = useState(false);

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
                <div className="flex-1">
                    <p className="text-slate-300">
                        Ta strona korzysta z ciasteczek (cookies). Wszelkie dane wprowadzasz na własną odpowiedzialność i w każdej chwili możesz je usunąć.
                        Twoje dane są przechowywane w bazie wiedzy z zachowaniem najwyższych standardów bezpieczeństwa.
                        Korzystając ze strony, wyrażasz zgodę na używanie cookies.
                    </p>
                    <button
                        onClick={() => setShowDetails(!showDetails)}
                        className="text-cyan-400 text-sm mt-2 hover:underline focus:outline-none"
                    >
                        {showDetails ? "Ukryj szczegóły" : "Więcej informacji o przechowywanych danych"}
                    </button>

                    {showDetails && (
                        <div className="mt-4 p-4 bg-slate-800/50 rounded-lg text-sm text-slate-400 space-y-2 border border-slate-700">
                            <h4 className="font-semibold text-slate-200">Co dokładnie i po co przechowujemy?</h4>
                            <ul className="list-disc pl-4 space-y-2 mt-2">
                                <li><strong className="text-slate-300">Dostęp do konta:</strong> Twój e-mail, żebyś miał bezpieczny dostęp do swoich spraw i nikt inny ich nie widział.</li>
                                <li><strong className="text-slate-300">Dane do pism:</strong> Imię, nazwisko, adres. Używamy ich <strong>tylko i wyłącznie</strong> wtedy, gdy poprosisz o napisanie oficjalnego dokumentu (np. pozwu), który musi te dane zawierać.</li>
                                <li><strong className="text-slate-300">Pamięć Asystenta:</strong> Historia rozmowy. Dzięki niej Asystent pamięta o czym rozmawialiście 5 minut temu i nie musisz mu wszystkiego powtarzać.</li>
                                <li><strong className="text-slate-300">Wygoda:</strong> Zapamiętujemy Twoje wybory, np. to, że już zamknąłeś to okienko.</li>
                            </ul>
                            <p className="text-xs mt-3 text-slate-500 italic">Pamiętaj: To Twoje dane. W panelu użytkownika możesz w każdej chwili usunąć historię czatu lub całe konto.</p>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 self-start md:self-center mt-4 md:mt-0">
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
