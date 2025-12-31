
import React from 'react';
import { LawArea, InteractionMode } from '../types';
import { XIcon, TrashIcon, CaseIcon, BookOpenIcon, DocumentTextIcon } from './Icons';
import HelpModal from './HelpModal';
import { InfoIcon } from './InfoIcon';
import { useState } from 'react';

interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  histories: { lawArea: LawArea, topic: string, interactionMode?: InteractionMode, lastUpdated?: any }[];
  onLoadHistory: (lawArea: LawArea, topic: string) => void;
  onDeleteHistory: (lawArea: LawArea, topic: string) => void;
  onViewKnowledge?: (lawArea: LawArea, topic: string) => void;
  onViewDocuments?: (lawArea: LawArea, topic: string) => void;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({
  isOpen,
  onClose,
  histories,
  onLoadHistory,
  onDeleteHistory,
  onViewKnowledge,
  onViewDocuments
}) => {
  const [isHelpOpen, setIsHelpOpen] = useState(false);

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
          <div>
            <p className="text-sm text-slate-400 mb-4">Wybierz sprawę, aby do niej wrócić.</p>
            <div className="space-y-2">
              {histories.length > 0 ? histories.map(({ lawArea, topic, interactionMode }, index) => (
                <div key={`${lawArea}-${topic}-${index}`} className="flex items-center justify-between bg-slate-700/50 rounded-lg group hover:bg-slate-700 transition-colors px-3">
                  <button onClick={() => { onLoadHistory(lawArea, topic); onClose(); }} className="flex-grow flex items-center gap-3 py-3 text-left min-w-0">
                    <div className="w-10 h-10 bg-slate-600 rounded-lg flex items-center justify-center flex-shrink-0 text-cyan-400">
                      <CaseIcon />
                    </div>
                    <div className="overflow-hidden min-w-0">
                      <p className="text-sm text-white font-medium truncate">{topic}</p>
                      <p className="text-xs text-slate-400 truncate">
                        {lawArea}
                        {interactionMode && <span className="text-cyan-500/80"> • {interactionMode}</span>}
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
                        className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-600 rounded-lg transition-all"
                        title="Dokumenty Sprawy"
                      >
                        <DocumentTextIcon className="w-5 h-5" />
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
              )) : (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                  <CaseIcon className="w-12 h-12 mb-3 opacity-20" />
                  <p>Brak zapisanych spraw.</p>
                </div>
              )}
            </div>
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
