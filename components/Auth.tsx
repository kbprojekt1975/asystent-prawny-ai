
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth, googleProvider } from '../services/firebase';
import { MagicWandIcon, SparklesIcon } from './Icons';
import HelpModal from './HelpModal';
import { InfoIcon } from './InfoIcon';
import AppGuide from './AppGuide';

import PrivacyPolicyModal from './PrivacyPolicyModal';

interface AuthProps {
  onAuthStart?: () => void;
}

const Auth: React.FC<AuthProps> = ({ onAuthStart }) => {
  const { t } = useTranslation();
  const [isLogin, setIsLogin] = useState(true);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isPrivacyPolicyOpen, setIsPrivacyPolicyOpen] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [authMethod, setAuthMethod] = useState<'email' | 'nickname'>('email');
  const [nickname, setNickname] = useState('');



  const handleGoogleLogin = async () => {
    try {
      setError(null);
      setIsLoading(true);
      sessionStorage.setItem('pendingConsent', consentChecked ? 'true' : 'false');
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error(err);
      setError(t('auth.errors.googleLogin'));
      setIsLoading(false);
    }
    // Do not clear loading on success - wait for unmount
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError(t('auth.errors.provideEmail'));
      return;
    }

    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMessage(t('auth.success.resetSent'));
      // Optional: switch back to login mode after a delay or let user do it manually
    } catch (err: any) {
      console.error(err);
      let msg = t('auth.errors.resetError');
      if (err.code === 'auth/user-not-found') msg = t('auth.errors.userNotFound');
      else if (err.code === 'auth/invalid-email') msg = t('auth.errors.invalidEmail');
      setError(msg);
      setIsLoading(false);
    }
    // Do not clear loading on success
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    let effectiveEmail = email;
    if (authMethod === 'nickname') {
      if (!nickname || !password) return;
      effectiveEmail = `${nickname.trim().toLowerCase()}@internal.asystent-ai.pl`;
    } else {
      if (!email || !password) return;
    }

    setError(null);
    setIsLoading(true);

    sessionStorage.setItem('pendingConsent', consentChecked ? 'true' : 'false');

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, effectiveEmail, password);
      } else {
        await createUserWithEmailAndPassword(auth, effectiveEmail, password);
      }
    } catch (err: any) {
      console.error(err);
      let msg = t('auth.errors.generic');
      if (err.code === 'auth/invalid-credential') msg = t('auth.errors.invalidCredential');
      else if (err.code === 'auth/user-not-found') msg = authMethod === 'nickname' ? t('auth.errors.userNotFoundNick') : t('auth.errors.userNotFound');
      else if (err.code === 'auth/wrong-password') msg = t('auth.errors.wrongPassword');
      else if (err.code === 'auth/email-already-in-use') msg = authMethod === 'nickname' ? t('auth.errors.nickTaken') : t('auth.errors.emailTaken');
      else if (err.code === 'auth/weak-password') msg = t('auth.errors.weakPassword');
      else if (err.code === 'auth/invalid-email') msg = authMethod === 'nickname' ? t('auth.errors.invalidNick') : t('auth.errors.invalidEmail');
      setError(msg);
      setIsLoading(false);
    }
    // Do not clear loading on success
  };

  return (
    <div
      className="flex flex-col items-center justify-center min-h-[100dvh] bg-slate-900 p-4"
    >
      <div className="bg-slate-800 border border-slate-700 p-8 rounded-2xl shadow-2xl max-w-md w-full text-center relative">
        <div className="absolute top-4 right-4">
          <InfoIcon onClick={() => setIsHelpOpen(true)} />
        </div>
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-cyan-900/30 mb-6 ring-1 ring-cyan-500/50">
          <MagicWandIcon className="w-8 h-8 text-cyan-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">{t('auth.title')}</h1>
        <p className="text-slate-400 mb-6">
          {isResetPassword
            ? t('auth.resetPasswordTitle')
            : (isLogin ? t('auth.loginTitle') : t('auth.registerTitle'))}
        </p>

        {isResetPassword ? (
          <div key="reset-password" className="animate-fade-in w-full">
            <form onSubmit={handleResetPassword} className="space-y-4 mb-6">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('auth.emailPlaceholder')}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                required
              />
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-cyan-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-cyan-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? t('auth.sending') : t('auth.sendResetLink')}
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
                {t('auth.backToLogin')}
              </button>
            </form>
          </div>
        ) : (
          <div key={isLogin ? 'login' : 'register'} className="animate-fade-in w-full">
            <form onSubmit={handleEmailAuth} className="space-y-4 mb-6">
              <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-700 mb-2">
                <button
                  type="button"
                  onClick={() => setAuthMethod('email')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${authMethod === 'email' ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  {t('auth.email')}
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMethod('nickname')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${authMethod === 'nickname' ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  {t('auth.nickname')}
                </button>
              </div>

              {authMethod === 'email' ? (
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('auth.emailPlaceholder')}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  required
                />
              ) : (
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder={t('auth.nicknamePlaceholder')}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  required
                  pattern="^[a-zA-Z0-9_\-]+$"
                  title={t('auth.errors.nickPattern')}
                />
              )}

              {authMethod === 'nickname' && (
                <div className="bg-amber-900/30 border border-amber-500/50 p-3 rounded-xl text-left animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex gap-2">
                    <div className="p-1 h-fit bg-amber-500/20 rounded-lg text-amber-500">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <p className="text-[10px] leading-relaxed text-amber-200/90">
                      <strong className="text-amber-400 block mb-0.5 uppercase tracking-wide">{t('auth.security.title')}</strong>
                      {t('auth.security.desc')}
                    </p>
                  </div>
                </div>
              )}
              <div className="flex flex-col items-end gap-1">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('auth.passwordPlaceholder')}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  required
                />
                {isLogin && authMethod === 'email' && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsResetPassword(true);
                      setError(null);
                      setSuccessMessage(null);
                    }}
                    className="text-xs text-cyan-400 hover:text-cyan-300 hover:underline mt-1"
                  >
                    {t('auth.forgotPassword')}
                  </button>
                )}
              </div>
              <div className="flex flex-col gap-3 py-2">
                <label className="flex items-start gap-3 cursor-pointer group text-left">
                  <div className="flex items-center h-5">
                    <input
                      type="checkbox"
                      checked={consentChecked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setIsPrivacyPolicyOpen(true);
                        } else {
                          setConsentChecked(false);
                        }
                      }}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-cyan-600 focus:ring-cyan-500 focus:ring-offset-slate-800"
                    />
                  </div>
                  <div className="text-xs leading-relaxed">
                    <span className="text-slate-300 group-hover:text-white transition-colors">
                      {t('auth.privacy.accept')} <button type="button" onClick={() => setIsPrivacyPolicyOpen(true)} className="text-cyan-400 hover:underline">{t('auth.privacy.policy')}</button>{t('auth.privacy.consent')}
                    </span>
                    {!consentChecked && (
                      <>
                        <span className="block mt-1 text-amber-500 font-semibold">
                          {t('auth.privacy.noConsent')}
                        </span>
                        <span className="block mt-1 text-amber-500 font-medium">
                          {t('auth.privacy.warning')}
                        </span>
                      </>
                    )}
                  </div>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-cyan-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-cyan-500 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? t('auth.processing') : (isLogin ? t('auth.loginButton') : t('auth.registerButton'))}
              </button>
            </form>
          </div>
        )}

        {!isResetPassword && (
          <>
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-slate-800 text-slate-500">{t('auth.orContinueWith')}</span>
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
              {t('auth.googleLogin')}
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
            {isLogin ? t('auth.noAccount') : t('auth.hasAccount')}
            <button
              onClick={() => { setIsLogin(!isLogin); setError(null); setSuccessMessage(null); }}
              className="text-cyan-400 hover:text-cyan-300 font-medium hover:underline focus:outline-none"
            >
              {isLogin ? t('auth.registerButton') : t('auth.loginButton')}
            </button>
          </p>
        )}

        <div className="mt-8 pt-6 border-t border-slate-700/50">
          <p className="text-slate-500 text-xs mb-3">{t('auth.newInAssistant')}</p>
          <button
            onClick={() => setIsHelpOpen(true)}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-dashed border-slate-700 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all text-sm group animate-guide-pulse"
          >
            <SparklesIcon className="w-4 h-4 text-cyan-500/50 group-hover:text-cyan-400" />
            <span>{t('auth.seeHowItWorks')}</span>
          </button>
        </div>
      </div>

      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        title={t('menu.about')}
      >
        <AppGuide showStartButton={false} />
      </HelpModal>

      <PrivacyPolicyModal
        isOpen={isPrivacyPolicyOpen}
        onClose={() => setIsPrivacyPolicyOpen(false)}
        showAcceptance={true}
        onAccept={() => setConsentChecked(true)}
      />
    </div>
  );
};

export default Auth;
