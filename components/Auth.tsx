
import React, { useState } from 'react';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth, googleProvider } from '../services/firebase';
import { MagicWandIcon } from './Icons';
import HelpModal from './HelpModal';
import { InfoIcon } from './InfoIcon';

import PrivacyPolicyModal from './PrivacyPolicyModal';

const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isPrivacyPolicyOpen, setIsPrivacyPolicyOpen] = useState(false);

  const helpContent = (
    <div className="space-y-4">
      <p>
        <strong>Asystent Prawny AI</strong> to innowacyjne narzędzie, które pomaga Ci w rozwiązywaniu problemów prawnych.
      </p>
      <ul className="list-disc pl-5 space-y-2">
        <li>
          <strong>Szybkie porady:</strong> Uzyskaj natychmiastowe wyjaśnienie przepisów i procedur.
        </li>
        <li>
          <strong>Generowanie pism:</strong> Twórz profesjonalne projekty pism, pozwów i wniosków.
        </li>
        <li>
          <strong>Analiza spraw:</strong> Opisz swój problem, a AI pomoże Ci go zaklasyfikować i wskaże dalsze kroki.
        </li>
        <li>
          <strong>Baza wiedzy:</strong> Przeglądaj historię swoich spraw i generuj podsumowania.
        </li>
      </ul>
    </div>
  );

  const handleGoogleLogin = async () => {
    try {
      setError(null);
      setIsLoading(true);
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error(err);
      setError("Wystąpił błąd podczas logowania przez Google.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Proszę podać adres email.");
      return;
    }

    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMessage("Link do resetowania hasła został wysłany na Twój email.");
      // Optional: switch back to login mode after a delay or let user do it manually
    } catch (err: any) {
      console.error(err);
      let msg = "Wystąpił błąd podczas resetowania hasła.";
      if (err.code === 'auth/user-not-found') msg = "Nie znaleziono użytkownika o podanym adresie email.";
      else if (err.code === 'auth/invalid-email') msg = "Nieprawidłowy format adresu email.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setError(null);
    setIsLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      console.error(err);
      let msg = "Wystąpił błąd.";
      if (err.code === 'auth/invalid-credential') msg = "Nieprawidłowy email lub hasło.";
      else if (err.code === 'auth/user-not-found') msg = "Nie znaleziono użytkownika.";
      else if (err.code === 'auth/wrong-password') msg = "Nieprawidłowe hasło.";
      else if (err.code === 'auth/email-already-in-use') msg = "Ten email jest już zarejestrowany.";
      else if (err.code === 'auth/weak-password') msg = "Hasło musi mieć co najmniej 6 znaków.";
      else if (err.code === 'auth/invalid-email') msg = "Nieprawidłowy format adresu email.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-slate-900 p-4">
      <div className="bg-slate-800 border border-slate-700 p-8 rounded-2xl shadow-2xl max-w-md w-full text-center relative">
        <div className="absolute top-4 right-4">
          <InfoIcon onClick={() => setIsHelpOpen(true)} />
        </div>
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-cyan-900/30 mb-6 ring-1 ring-cyan-500/50">
          <MagicWandIcon className="w-8 h-8 text-cyan-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Asystent Prawny AI</h1>
        <p className="text-slate-400 mb-6">
          {isResetPassword
            ? 'Zresetuj swoje hasło'
            : (isLogin ? 'Zaloguj się, aby kontynuować' : 'Utwórz konto, aby zacząć')}
        </p>

        {isResetPassword ? (
          <form onSubmit={handleResetPassword} className="space-y-4 mb-6">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Adres email"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              required
            />
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-cyan-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-cyan-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Wysyłanie...' : 'Wyślij link resetujący'}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsResetPassword(false);
                setError(null);
                setSuccessMessage(null);
              }}
              className="text-slate-400 hover:text-white text-sm"
            >
              Wróć do logowania
            </button>
          </form>
        ) : (
          <form onSubmit={handleEmailAuth} className="space-y-4 mb-6">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Adres email"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              required
            />
            <div className="flex flex-col items-end gap-1">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Hasło"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                required
              />
              {isLogin && (
                <button
                  type="button"
                  onClick={() => {
                    setIsResetPassword(true);
                    setError(null);
                    setSuccessMessage(null);
                  }}
                  className="text-xs text-cyan-400 hover:text-cyan-300 hover:underline mt-1"
                >
                  Nie pamiętasz hasła?
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-cyan-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-cyan-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Przetwarzanie...' : (isLogin ? 'Zaloguj się' : 'Zarejestruj się')}
            </button>
            <p className="text-[10px] text-slate-500 text-center mt-2 px-1">
              Administratorem Twoich danych osobowych jest [Administrator]. Dane przetwarzamy w celu realizacji usługi (założenie i prowadzenie konta). Szczegóły w <button type="button" onClick={() => setIsPrivacyPolicyOpen(true)} className="text-cyan-500 hover:underline">Polityce Prywatności</button>.
            </p>
          </form>
        )}

        {!isResetPassword && (
          <>
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-slate-800 text-slate-500">lub kontynuuj przez</span>
              </div>
            </div>

            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full bg-white text-slate-900 font-semibold py-3 px-4 rounded-lg hover:bg-slate-100 transition-colors flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google
            </button>
          </>
        )}

        {error && (
          <p className="mt-4 text-sm text-red-400 bg-red-900/20 p-2 rounded border border-red-900/50">{error}</p>
        )}

        {successMessage && (
          <p className="mt-4 text-sm text-green-400 bg-green-900/20 p-2 rounded border border-green-900/50">{successMessage}</p>
        )}

        {!isResetPassword && (
          <p className="mt-6 text-slate-400 text-sm">
            {isLogin ? "Nie masz konta? " : "Masz już konto? "}
            <button
              onClick={() => { setIsLogin(!isLogin); setError(null); setSuccessMessage(null); }}
              className="text-cyan-400 hover:text-cyan-300 font-medium hover:underline focus:outline-none"
            >
              {isLogin ? "Zarejestruj się" : "Zaloguj się"}
            </button>
          </p>
        )}
      </div>

      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        title="O aplikacji"
      >
        {helpContent}
      </HelpModal>

      <PrivacyPolicyModal
        isOpen={isPrivacyPolicyOpen}
        onClose={() => setIsPrivacyPolicyOpen(false)}
      />
    </div>
  );
};

export default Auth;
