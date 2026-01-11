import React from 'react';
import HamburgerMenu from './HamburgerMenu';
import { SparklesIcon, ClockIcon, HomeIcon, ArrowsExpandIcon, CreditCardIcon, ProfileIcon, BookOpenIcon, DownloadIcon, UploadIcon, ArrowLeftIcon, BrainIcon } from './Icons';
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
}

const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  onProfileClick,
  onBackClick,
  backButtonText = 'Wróć',
  onChangeClick,
  changeButtonText = 'Zmień',
  onQuickActionsClick,
  onHistoryClick,
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
  onImportChat
}) => {
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  return (
    <header className="bg-slate-900/70 backdrop-blur-md p-4 border-b border-slate-700 flex justify-between items-center z-40 flex-shrink-0 gap-4 w-full">
      <div className="flex items-center gap-3 mr-auto truncate">
        {onBackClick && (
          <button
            onClick={onBackClick}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-full transition-colors flex-shrink-0"
            aria-label={backButtonText}
            title={backButtonText}
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
              {hasConsent ? 'TRYB LOKALNY' : 'BRAK ZGODY RODO'}
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
                  WYKUP NOWY PLAN
                </span>
              </div>
            )}
            {subscription.status === SubscriptionStatus.Active && ((subscription.creditLimit - subscription.spentAmount) / subscription.creditLimit) > 0.1 && (
              <div className="flex items-center gap-2 bg-cyan-950/40 border border-cyan-500/30 px-3 py-2 rounded-xl hidden lg:flex">
                <CreditCardIcon className="h-4 w-4 text-cyan-400" />
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-tight">
                  AKTUALNY PLAN: {(subscription.creditLimit - subscription.spentAmount).toFixed(2)} PLN
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
            {changeButtonText}
          </button>
        )}
        {onHomeClick && (
          <button
            onClick={onHomeClick}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-full transition-colors hidden sm:block"
            aria-label="Strona główna"
            title="Strona główna"
          >
            <HomeIcon className="h-6 w-6" />
          </button>
        )}
        {onGenerateKnowledgeClick && (
          <button
            onClick={onGenerateKnowledgeClick}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-full transition-colors hidden md:block"
            aria-label="Generuj Bazę Wiedzy"
            title="Generuj Bazę Wiedzy (Pobierz Akty i Wyroki)"
          >
            <BrainIcon className="h-6 w-6 text-green-400" />
          </button>
        )}
        {onKnowledgeClick && (
          <button
            onClick={onKnowledgeClick}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-full transition-colors hidden sm:block"
            aria-label="Baza Wiedzy"
            title="Baza Wiedzy"
          >
            <BookOpenIcon className="h-6 w-6" />
          </button>
        )}
        {onExportChat && (
          <button
            onClick={onExportChat}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-full transition-colors hidden sm:block"
            aria-label="Eksportuj Rozmowę"
            title="Pobierz rozmowę na urządzenie"
          >
            <DownloadIcon className="h-6 w-6 text-blue-400" />
          </button>
        )}
        {onImportChat && (
          <label
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-full transition-colors cursor-pointer hidden sm:block"
            title="Wgraj rozmowę z pliku JSON"
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
            aria-label="Historia Spraw"
            title="Historia Spraw"
          >
            <ClockIcon className="h-6 w-6" />
          </button>
        )}
        {onQuickActionsClick && (
          <button
            onClick={onQuickActionsClick}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-full transition-colors hidden sm:block"
            aria-label="Szybkie Akcje"
            title="Szybkie Akcje"
          >
            <SparklesIcon className="h-6 w-6" />
          </button>
        )}
        {onFullScreenClick && (
          <button
            onClick={onFullScreenClick}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-full transition-colors hidden md:block"
            aria-label="Pełny Ekran"
            title="Pełny Ekran"
          >
            <ArrowsExpandIcon className="h-6 w-6" />
          </button>
        )}
        <button
          onClick={onProfileClick}
          className="p-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-full transition-colors relative hidden xs:block"
          aria-label="Panel Użytkownika"
          title="Panel Użytkownika"
        >
          <ProfileIcon className="h-6 w-6" />
          {remindersCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-slate-900">
              {remindersCount}
            </span>
          )}
        </button>

        <div className="border-l border-slate-700 h-6 mx-1 hidden md:block"></div>

        <InfoIcon
          onClick={() => setIsHelpOpen(true)}
          className="hidden md:block"
        />

        <HamburgerMenu
          onProfileClick={onProfileClick}
          onKnowledgeClick={onKnowledgeClick || (() => { })}
          onHomeClick={onHomeClick}
          onHistoryClick={onHistoryClick}
          onQuickActionsClick={onQuickActionsClick}
          onFullScreenClick={onFullScreenClick}
          subscription={subscription}
          totalCost={totalCost}
        />
      </div>

      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        title="Przewodnik po aplikacji"
      >
        <div className="space-y-4">
          <p><strong>Witaj w Asystencie Prawnym AI!</strong></p>
          <p>Oto co oznaczają poszczególne ikony:</p>
          <ul className="list-disc pl-5 space-y-2 text-sm">
            <li><HomeIcon className="w-4 h-4 inline mr-1 text-slate-400" /> <strong>Dom:</strong> Powrót do ekranu startowego.</li>
            <li><BookOpenIcon className="w-4 h-4 inline mr-1 text-slate-400" /> <strong>Baza Wiedzy:</strong> Twoje zapisane akty prawne i przepisy.</li>
            <li><ClockIcon className="w-4 h-4 inline mr-1 text-slate-400" /> <strong>Zegar/Historia:</strong> Dostęp do Twoich poprzednich rozmów.</li>
            <li><SparklesIcon className="w-4 h-4 inline mr-1 text-slate-400" /> <strong>Różdżka/Szybkie Akcje:</strong> Gotowe scenariusze (np. "Napisz pozew").</li>
            <li><ArrowsExpandIcon className="w-4 h-4 inline mr-1 text-slate-400" /> <strong>Strzałki:</strong> Tryb pełnoekranowy dla czytelniejszej pracy z tekstem.</li>
            <li><ProfileIcon className="w-4 h-4 inline mr-1 text-slate-400" /> <strong>Profil:</strong> Twoje dane, subskrypcja i ustawienia.</li>
          </ul>
        </div>
      </HelpModal>
    </header>
  );
};

export default AppHeader;
