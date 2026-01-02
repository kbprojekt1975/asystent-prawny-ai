import React from 'react';
import { XIcon } from './Icons';

interface PrivacyPolicyModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="bg-slate-900 border border-slate-700 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                <header className="flex items-center justify-between p-6 border-b border-slate-700 bg-slate-800/50 rounded-t-2xl">
                    <h2 className="text-xl font-bold text-white">Polityka Prywatności</h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-full transition-colors"
                    >
                        <XIcon className="w-6 h-6" />
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto p-6 md:p-8 text-slate-300 space-y-6 custom-scrollbar">
                    <section>
                        <h3 className="text-lg font-bold text-white mb-3">1. Wprowadzenie</h3>
                        <p>Niniejsza Polityka Prywatności opisuje zasady przetwarzania danych osobowych użytkowników aplikacji Asystent Prawny AI. Dbamy o Twoją prywatność i dokładamy wszelkich starań, aby Twoje dane były bezpieczne.</p>
                    </section>

                    <section>
                        <h3 className="text-lg font-bold text-white mb-3">2. Administrator Danych Osobowych</h3>
                        <p>Administratorem Twoich danych osobowych jest [Nazwa Twojej Firmy/Imię i Nazwisko], [Adres], [Kontakt: adres e-mail].</p>
                    </section>

                    <section>
                        <h3 className="text-lg font-bold text-white mb-3">3. Zakres Przetwarzanych Danych i Cele Przetwarzania</h3>

                        <div className="space-y-4 pl-4 border-l-2 border-slate-700">
                            <div>
                                <h4 className="font-semibold text-cyan-400 mb-2">3.1. Dane Logowania i Identyfikacyjne</h4>
                                <ul className="list-disc pl-5 space-y-1 text-sm">
                                    <li><strong>Zakres:</strong> Adres e-mail, unikalny identyfikator użytkownika (UID).</li>
                                    <li><strong>Cel:</strong> Umożliwienie bezpiecznego logowania, autoryzacja dostępu do konta, identyfikacja użytkownika w systemie.</li>
                                    <li><strong>Podstawa prawna:</strong> Niezbędność do wykonania umowy o świadczenie usług drogą elektroniczną (art. 6 ust. 1 lit. b RODO).</li>
                                </ul>
                            </div>

                            <div>
                                <h4 className="font-semibold text-cyan-400 mb-2">3.2. Dane do Pism Procesowych (Dane Osobowe)</h4>
                                <ul className="list-disc pl-5 space-y-1 text-sm">
                                    <li><strong>Zakres:</strong> Imię, nazwisko, adres zamieszkania, opcjonalnie PESEL lub inne dane wymagane przez sądy.</li>
                                    <li><strong>Cel:</strong> Automatyczne generowanie oficjalnych dokumentów prawnych, pozwów i wniosków na wyraźne żądanie użytkownika.</li>
                                    <li><strong>Podstawa prawna:</strong> Zgoda użytkownika (art. 6 ust. 1 lit. a RODO).</li>
                                    <li><strong>Informacja dodatkowa:</strong> Podanie numeru PESEL jest opcjonalne i zależy od wymogów konkretnego pisma procesowego.</li>
                                </ul>
                            </div>

                            <div>
                                <h4 className="font-semibold text-cyan-400 mb-2">3.3. Historia Spraw i Konwersacji (Treści Użytkownika)</h4>
                                <ul className="list-disc pl-5 space-y-1 text-sm">
                                    <li><strong>Zakres:</strong> Treść rozmów z Asystentem AI, opisy spraw, przesłane pliki/dokumenty do analizy.</li>
                                    <li><strong>Cel:</strong> Zapewnienie ciągłości obsługi ("pamięć" Asystenta), analiza kontekstu sprawy w celu udzielenia trafnej porady prawnej.</li>
                                    <li><strong>Podstawa prawna:</strong> Uzasadniony interes administratora (art. 6 ust. 1 lit. f RODO).</li>
                                    <li><strong>Informacja dodatkowa:</strong> Użytkownik ma możliwość usunięcia historii czatu w dowolnym momencie.</li>
                                </ul>
                            </div>

                            <div>
                                <h4 className="font-semibold text-cyan-400 mb-2">3.4. Dane Techniczne i Preferencje</h4>
                                <ul className="list-disc pl-5 space-y-1 text-sm">
                                    <li><strong>Zakres:</strong> Informacje o sesji, flagi akceptacji zgód, preferencje interfejsu.</li>
                                    <li><strong>Cel:</strong> Utrzymanie sesji zalogowania, poprawne wyświetlanie strony.</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h3 className="text-lg font-bold text-white mb-3">4. Odbiorcy Danych</h3>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Dostawca hostingu (przechowywanie danych na serwerach).</li>
                            <li>Dostawca chmury Firebase/Google Cloud.</li>
                            <li>Upoważnieni pracownicy i współpracownicy administratora.</li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-lg font-bold text-white mb-3">5. Prawa Użytkownika</h3>
                        <p className="mb-2">Masz prawo do:</p>
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                            <li>Dostępu do swoich danych osobowych.</li>
                            <li>Sprostowania swoich danych osobowych.</li>
                            <li>Usunięcia swoich danych osobowych ("prawo do bycia zapomnianym").</li>
                            <li>Ograniczenia przetwarzania swoich danych osobowych.</li>
                            <li>Przenoszenia swoich danych osobowych.</li>
                            <li>Wniesienia sprzeciwu wobec przetwarzania.</li>
                            <li>Wycofania zgody na przetwarzanie danych.</li>
                            <li>Wniesienia skargi do organu nadzorczego (UODO).</li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-lg font-bold text-white mb-3">6. Bezpieczeństwo Danych</h3>
                        <p>Stosujemy odpowiednie środki techniczne i organizacyjne w celu ochrony Twoich danych przed nieuprawnionym dostępem, utratą lub zniszczeniem (m.in. szyfrowanie połączeń SSL, bezpieczna infrastruktura chmurowa).</p>
                    </section>

                    <section>
                        <h3 className="text-lg font-bold text-white mb-3">7. Pliki Cookies</h3>
                        <p>Nasza strona internetowa wykorzystuje pliki cookies. Szczegółowe informacje o rodzajach cookies, celach ich stosowania i sposobach zarządzania nimi znajdziesz w naszej Polityce Cookies.</p>
                    </section>

                    <section>
                        <h3 className="text-lg font-bold text-white mb-3">8. Zmiany w Polityce Prywatności</h3>
                        <p>Niniejsza Polityka Prywatności może ulegać zmianom. O wszelkich zmianach będziemy informować użytkowników z odpowiednim wyprzedzeniem.</p>
                    </section>
                </div>

                <footer className="p-6 border-t border-slate-700 bg-slate-800/50 rounded-b-2xl flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors"
                    >
                        Zamknij
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default PrivacyPolicyModal;
