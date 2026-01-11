
import React from 'react';
import { LawArea, InteractionMode, UserProfile } from '../types';
import { XIcon, TrashIcon, CaseIcon, BookOpenIcon, DocumentTextIcon } from './Icons';
import HelpModal from './HelpModal';
import { InfoIcon } from './InfoIcon';
import { useState } from 'react';

interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  isLocalOnly: boolean;
  userProfile: UserProfile;
  histories: { lawArea: LawArea, topic: string, interactionMode?: InteractionMode, servicePath?: 'pro' | 'standard', lastUpdated?: any, docCount?: number }[];
  onLoadHistory: (lawArea: LawArea, topic: string, mode?: InteractionMode, servicePath?: 'pro' | 'standard') => void;
  onDeleteHistory: (lawArea: LawArea, topic: string) => void;
  onViewKnowledge: (lawArea: LawArea, topic: string) => void;
  onViewDocuments: (lawArea: LawArea, topic: string) => void;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({
  isOpen,
  onClose,
  histories,
  onLoadHistory,
  onDeleteHistory,
  onViewKnowledge,
  onViewDocuments,
  isLocalOnly,
  userProfile
}) => {
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const groupedHistories = histories.reduce((acc, item) => {
    if (!acc[item.lawArea]) {
      acc[item.lawArea] = [];
    }
    acc[item.lawArea].push(item);
    return acc;
  }, {} as Record<string, typeof histories>);

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-60 z-50 transition-opacity duration-300 ease-in-out ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      aria-labelledby="history-panel-title"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className={`fixed top-0 left-0 h-full w-full max-w-md bg-slate-800 shadow-xl border-r border-slate-700 transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
        onClick={e => e.stopPropagation()}
      >
        <header className="p-6 flex justify-between items-center border-b border-slate-700 flex-shrink-0">
          <div className="flex items-center gap-2">
            <h3 className="text-xl leading-6 font-bold text-white" id="history-panel-title">
              Historia Spraw
            </h3>
            <InfoIcon onClick={() => setIsHelpOpen(true)} className="ml-2" />
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            aria-label="Zamknij historię"
          >
            <XIcon />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLocalOnly && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-4">
              <div className="flex gap-3">
                <div className="text-amber-500 flex-shrink-0 mt-0.5">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-amber-500 mb-1">
                    {userProfile?.manualLocalMode ? 'Aktywny Tryb Lokalny' : 'Brak zgody RODO'}
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {userProfile?.manualLocalMode
                      ? 'Twoje dane są przechowywane tylko w Twojej przeglądarce. Historia z chmury jest ukryta.'
                      : 'Twoja historia z chmury jest ukryta, ponieważ nie wyrażono zgody na przetwarzanie danych.'}
                  </p>
                </div>
              </div>
            </div>
          )}
          <div>
            {Object.keys(groupedHistories).length > 0 ? Object.entries(groupedHistories).map(([area, items]) => (
              <div key={area} className="mb-6">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 px-1 flex items-center gap-2">
                  <div className="w-1 h-3 bg-cyan-500 rounded-full" />
                  {area}
                </h4>
                <div className="space-y-2">
                  {(items as any[]).map(({ lawArea, topic, interactionMode, servicePath, docCount }, index) => (
                    <div key={`${lawArea}-${topic}-${index}`} className="flex items-center justify-between bg-slate-700/50 rounded-lg group hover:bg-slate-700 transition-colors px-3">
                      <button onClick={() => { onLoadHistory(lawArea as LawArea, topic, interactionMode, servicePath); onClose(); }} className="flex-grow flex items-center gap-3 py-3 text-left min-w-0">
                        <div className={`w-10 h-10 ${servicePath === 'pro' ? 'bg-violet-600/20 text-violet-400' : 'bg-slate-600 text-cyan-400'} rounded-lg flex items-center justify-center flex-shrink-0 relative`}>
                          <CaseIcon />
                          {docCount && docCount > 0 ? (
                            <div className="absolute -top-1 -right-1 bg-cyan-500 text-slate-900 text-[10px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center border-2 border-slate-800" title={`${docCount} dokumentów`}>
                              {docCount}
                            </div>
                          ) : null}
                        </div>
                        <div className="overflow-hidden min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-white font-medium truncate">{topic}</p>
                            {servicePath === 'pro' && (
                              <span className="text-[9px] bg-violet-600 text-white px-1.5 py-0.5 rounded font-black tracking-tighter shrink-0">PRO</span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 truncate">
                            {interactionMode && <span className={`${servicePath === 'pro' ? 'text-violet-400/80' : 'text-cyan-500/80'}`}>{interactionMode}</span>}
                            {!interactionMode && <span className="opacity-50 italic text-[10px]">Brak aktywnego trybu</span>}
                          </p>
                        </div>
                      </button>
                      <div className="flex items-center gap-1">
                        {onViewDocuments && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onViewDocuments(lawArea, topic);
                            }}
                            className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-600 rounded-lg transition-all relative"
                            title="Dokumenty Sprawy"
                          >
                            <DocumentTextIcon className="w-5 h-5" />
                            {docCount && docCount > 0 && (
                              <span className="absolute top-1 right-1 w-2 h-2 bg-cyan-500 rounded-full border border-slate-800" />
                            )}
                          </button>
                        )}
                        {onViewKnowledge && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onViewKnowledge(lawArea, topic);
                            }}
                            className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-600 rounded-lg transition-all"
                            title="Baza Wiedzy Sprawy"
                          >
                            <BookOpenIcon className="w-5 h-5" />
                          </button>
                        )}
                        <button
                          onClick={() => onDeleteHistory(lawArea, topic)}
                          className="text-slate-500 hover:text-red-500 transition-colors p-2"
                          aria-label={`Usuń historię ${topic}`}
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                <CaseIcon className="w-12 h-12 mb-3 opacity-20" />
                <p>Brak zapisanych spraw.</p>
              </div>
            )}
          </div>
        </main>

        <footer className="p-6 border-t border-slate-700 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full inline-flex justify-center rounded-md border border-slate-600 shadow-sm px-4 py-2 bg-slate-700 text-base font-medium text-slate-300 hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 focus:ring-offset-slate-800 sm:w-auto sm:text-sm transition-colors"
          >
            Zamknij
          </button>
        </footer>
      </div>

      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        title="Panel Historii"
      >
        <div className="space-y-4">
          <p>
            Tutaj znajdziesz listę wszystkich swoich wcześniejszych rozmów i analiz.
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              Kliknij na <strong>tytuł sprawy/temat</strong>, aby wrócić do rozmowy.
            </li>
            <li>
              Użyj ikony <strong>kosza</strong>, aby trwale usunąć dany wątek.
            </li>
            <li>
              Pamiętaj, że usunięcie historii jest nieodwracalne.
            </li>
          </ul>
        </div>
      </HelpModal>
    </div >
  );
};

export default HistoryPanel;
