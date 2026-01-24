import React from 'react';
import { useTranslation } from 'react-i18next';
import HamburgerMenu from './HamburgerMenu';
import { SparklesIcon, ClockIcon, HomeIcon, CreditCardIcon, ProfileIcon, BookOpenIcon, DownloadIcon, UploadIcon, ArrowLeftIcon, BrainIcon } from './Icons';
import CostCounter from './CostCounter';
import { SubscriptionInfo, SubscriptionStatus } from '../types';
import HelpModal from './HelpModal';
import { InfoIcon } from './InfoIcon';
import { useState } from 'react';

interface AppHeaderProps {
  title: React.ReactNode;
  onProfileClick: () => void;
  onBackClick?: () => void;
  backButtonText?: string;
  onChangeClick?: () => void;
  changeButtonText?: string;
  onQuickActionsClick?: () => void;
  onHistoryClick?: () => void;
  onAiToolsClick?: () => void;
  onHomeClick?: () => void;
  onFullScreenClick?: () => void;
  totalCost?: number;
  subscription?: SubscriptionInfo;
  onKnowledgeClick?: () => void;
  onGenerateKnowledgeClick?: () => void;
  remindersCount?: number;
  isLocalOnly?: boolean;
  hasConsent?: boolean;
  onExportChat?: () => void;
  onImportChat?: (file: File) => void;
  onInstallApp?: () => void;
  onHelpClick?: () => void;
  onAndromedaClick?: () => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  onProfileClick,
  onBackClick,
  backButtonText,
  onChangeClick,
  changeButtonText,
  onQuickActionsClick,
  onHistoryClick,
  onAiToolsClick,
  onHomeClick,
  onFullScreenClick,
  totalCost = 0,
  subscription,
  onKnowledgeClick,
  onGenerateKnowledgeClick,
  remindersCount = 0,
  isLocalOnly = false,
  hasConsent = true,
  onExportChat,
  onImportChat,
  onInstallApp,
  onHelpClick,
  onAndromedaClick
}) => {
  const { t, i18n } = useTranslation();
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Default values using translations if props are undefined
  const finalBackButtonText = backButtonText || t('app.back');
  const finalChangeButtonText = changeButtonText || t('app.change');

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('i18nextLng', lang);
  };

  return (
    <header className="bg-slate-900/70 backdrop-blur-md p-4 border-b border-slate-700 flex justify-between items-center z-40 flex-shrink-0 gap-4 w-full">
      <div className="flex items-center gap-3 mr-auto truncate">
        {onBackClick && (
          <button
            onClick={onBackClick}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-full transition-colors flex-shrink-0"
            aria-label={finalBackButtonText}
            title={finalBackButtonText}
          >
            <ArrowLeftIcon className="h-6 w-6" />
          </button>
        )}
        <h1 className="text-sm md:text-lg font-bold text-white truncate">
          {title}
        </h1>
      </div>
      <div className="flex items-center gap-2">
        {isLocalOnly && (
          <div className={`flex items-center gap-2 ${hasConsent ? 'bg-amber-500/20 border-amber-500/50' : 'bg-red-500/20 border-red-500/50'} px-3 py-2 rounded-xl animate-pulse whitespace-nowrap`}>
            <div className={`w-2 h-2 rounded-full ${hasConsent ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]'}`}></div>
            <span className={`text-[10px] font-bold ${hasConsent ? 'text-amber-500' : 'text-red-500'} uppercase tracking-tight`}>
              {hasConsent ? t('app.localMode') : t('app.noGdprConsent')}
            </span>
          </div>
        )}
        {subscription && subscription.creditLimit > 0 && (
          <>
            <div className="hidden sm:block">
              <CostCounter
                percentage={Math.max(0, ((subscription.creditLimit - subscription.spentAmount) / subscription.creditLimit) * 100)}
              />
            </div>
            {((subscription.creditLimit - subscription.spentAmount) / subscription.creditLimit) <= 0.1 && (
              <div className="flex items-center gap-2 bg-red-500/20 border border-red-500/50 px-3 py-2 rounded-xl animate-pulse hidden xs:flex">
                <CreditCardIcon className="h-4 w-4 text-red-500" />
                <span className="text-xs font-bold text-red-500 uppercase tracking-tight">
                  {t('app.buyPlan')}
                </span>
              </div>
            )}
            {subscription.status === SubscriptionStatus.Active && ((subscription.creditLimit - subscription.spentAmount) / subscription.creditLimit) > 0.1 && (
              <div className="flex items-center gap-2 bg-cyan-950/40 border border-cyan-500/30 px-3 py-2 rounded-xl hidden lg:flex">
                <CreditCardIcon className="h-4 w-4 text-cyan-400" />
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-tight">
                  {t('app.currentPlan')}: {(subscription.creditLimit - subscription.spentAmount).toFixed(2)} PLN
                </span>
              </div>
            )}
          </>
        )}

        {onChangeClick && (
          <button
            onClick={onChangeClick}
            className="text-sm border border-slate-600 hover:bg-slate-700/50 text-slate-300 font-semibold py-2 px-4 rounded-lg transition-colors flex-shrink-0 hidden md:block"
          >
            {finalChangeButtonText}
          </button>
        )}
        {onHomeClick && (
          <button
            onClick={onHomeClick}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-full transition-colors hidden sm:block"
            aria-label={t('app.home')}
            title={t('app.home')}
          >
            <HomeIcon className="h-6 w-6" />
          </button>
        )}
        {onKnowledgeClick && (
          <button
            onClick={onKnowledgeClick}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-full transition-colors hidden sm:block"
            aria-label={t('app.knowledgeBase')}
            title={t('app.knowledgeBase')}
          >
            <BookOpenIcon className="h-6 w-6" />
          </button>
        )}
        {onExportChat && (
          <button
            onClick={onExportChat}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-full transition-colors hidden sm:block"
            aria-label={t('app.exportChat')}
            title={t('app.exportChat')}
          >
            <DownloadIcon className="h-6 w-6 text-blue-400" />
          </button>
        )}
        {onImportChat && (
          <label
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-full transition-colors cursor-pointer hidden sm:block"
            title={t('app.importChat')}
          >
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  onImportChat(file);
                  e.target.value = ''; // Reset input
                }
              }}
            />
            <UploadIcon className="h-6 w-6 text-purple-400" />
            <span className="sr-only">Importuj Rozmowę</span>
          </label>
        )}
        {onHistoryClick && (
          <button
            onClick={onHistoryClick}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-full transition-colors hidden sm:block"
            aria-label={t('app.history')}
            title={t('app.history')}
          >
            <ClockIcon className="h-6 w-6" />
          </button>
        )}
        {onQuickActionsClick && (
          <button
            onClick={onQuickActionsClick}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-full transition-colors hidden sm:block"
            aria-label={t('app.quickActions')}
            title={t('app.quickActions')}
          >
            <SparklesIcon className="h-6 w-6" />
          </button>
        )}
        {onAndromedaClick && (
          <button
            onClick={onAndromedaClick}
            className="p-2 text-slate-300 hover:text-cyan-400 hover:bg-slate-700/50 rounded-full transition-all"
            title="Powrót do Andromeda"
          >
            <div className="relative flex items-center justify-center p-1 w-8 h-8">
              <div className="grid grid-cols-3 gap-[2px]">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="w-[6px] h-[6px] bg-current rounded-full" />
                ))}
              </div>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-6 h-[1.5px] bg-red-500/90 -rotate-45 rounded-full" />
              </div>
            </div>
          </button>
        )}

        <button
          onClick={onProfileClick}
          className="p-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-full transition-colors relative hidden xs:block"
          aria-label={t('app.userProfile')}
          title={t('app.userProfile')}
        >
          <ProfileIcon className="h-6 w-6" />
          {remindersCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-slate-900">
              {remindersCount}
            </span>
          )}
        </button>

        <div className="border-l border-slate-700 h-6 mx-1 hidden md:block"></div>

        <div className="flex bg-slate-800/50 rounded-lg p-1 border border-slate-700/50">
          <button
            onClick={() => changeLanguage('pl')}
            className={`px-2 py-1 text-xs font-bold rounded transition-all ${i18n.language.startsWith('pl') ? 'bg-slate-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
          >
            PL
          </button>
          <button
            onClick={() => changeLanguage('en')}
            className={`px-2 py-1 text-xs font-bold rounded transition-all ${i18n.language.startsWith('en') ? 'bg-slate-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
          >
            EN
          </button>
          <button
            onClick={() => changeLanguage('es')}
            className={`px-2 py-1 text-xs font-bold rounded transition-all ${i18n.language.startsWith('es') ? 'bg-slate-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
          >
            ES
          </button>
        </div>

        <div className="border-l border-slate-700 h-6 mx-1 hidden md:block"></div>

        <InfoIcon
          onClick={() => setIsHelpOpen(true)}
          className="hidden md:block"
        />

        <HamburgerMenu
          onProfileClick={onProfileClick}
          onKnowledgeClick={onKnowledgeClick || (() => { })}
          onGenerateKnowledgeClick={onGenerateKnowledgeClick}
          onHomeClick={onHomeClick}
          onHistoryClick={onHistoryClick}
          onAiToolsClick={onAiToolsClick}
          onQuickActionsClick={onQuickActionsClick}
          onExportChat={onExportChat}
          onImportChat={onImportChat}
          onInstallApp={onInstallApp}
          onHelpClick={onHelpClick}
          subscription={subscription}
          totalCost={totalCost}
        />
      </div>

      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        title={t('app_help.title')}
      >
        <div className="space-y-4">
          <p><strong>{t('app_help.intro')}</strong></p>
          <p>{t('app_help.icons_intro')}</p>
          <ul className="list-disc pl-5 space-y-2 text-sm">
            <li><HomeIcon className="w-4 h-4 inline mr-1 text-slate-400" /> <strong>{t('app_help.home')}:</strong> {t('app_help.home_desc')}</li>
            <li><BookOpenIcon className="w-4 h-4 inline mr-1 text-slate-400" /> <strong>{t('app_help.knowledge')}:</strong> {t('app_help.knowledge_desc')}</li>
            <li><ClockIcon className="w-4 h-4 inline mr-1 text-slate-400" /> <strong>{t('app_help.history')}:</strong> {t('app_help.history_desc')}</li>
            <li><SparklesIcon className="w-4 h-4 inline mr-1 text-slate-400" /> <strong>{t('app_help.magic')}:</strong> {t('app_help.magic_desc')}</li>
            <li><ProfileIcon className="w-4 h-4 inline mr-1 text-slate-400" /> <strong>{t('app_help.profile')}:</strong> {t('app_help.profile_desc')}</li>
          </ul>
        </div>
      </HelpModal>
    </header>
  );
};

export default AppHeader;
