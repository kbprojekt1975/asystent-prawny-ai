
import React from 'react';
import { useTranslation } from 'react-i18next';
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
  onViewKnowledge: (lawArea: LawArea, topic: string, mode?: InteractionMode) => void;
  onViewDocuments: (lawArea: LawArea, topic: string, mode?: InteractionMode) => void;
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
  const { t } = useTranslation();
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const interactionModeMap: Record<string, string> = {
    [InteractionMode.Advice]: 'advice',
    [InteractionMode.Analysis]: 'analysis',
    [InteractionMode.Document]: 'document',
    [InteractionMode.LegalTraining]: 'legal_training',
    [InteractionMode.SuggestRegulations]: 'suggest_regulations',
    [InteractionMode.FindRulings]: 'find_rulings',
    [InteractionMode.Court]: 'court',
    [InteractionMode.Negotiation]: 'negotiation',
    [InteractionMode.StrategicAnalysis]: 'strategic_analysis',
    [InteractionMode.AppHelp]: 'app_help'
  };

  const groupedHistories = histories.reduce((acc, item) => {
    if (!acc[item.lawArea]) {
      acc[item.lawArea] = {};
    }
    if (!acc[item.lawArea][item.topic]) {
      acc[item.lawArea][item.topic] = [];
    }
    acc[item.lawArea][item.topic].push(item);
    return acc;
  }, {} as Record<string, Record<string, typeof histories>>);

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
              {t('history.title')}
            </h3>
            <InfoIcon onClick={() => setIsHelpOpen(true)} className="ml-2" />
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            aria-label={t('history.close')}
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
                    {userProfile?.manualLocalMode ? t('history.local_mode_active') : t('history.no_consent')}
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {userProfile?.manualLocalMode
                      ? t('history.local_desc')
                      : t('history.no_consent_desc')}
                  </p>
                </div>
              </div>
            </div>
          )}
          <div>
            {Object.keys(groupedHistories).length > 0 ? (
              Object.entries(groupedHistories).map(([area, topicsMap]) => (
                <div key={area} className="mb-6">
                  <h4 className="w-fit text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 px-1 pb-1 border-b-2 border-cyan-500/30">
                    {t(`law.areas.${area.toLowerCase()}`)}
                  </h4>
                  <div className="space-y-4">
                    {Object.entries(topicsMap).map(([topic, modes]) => (
                      <div key={topic} className="bg-slate-700/10 border border-slate-700/50 rounded-xl overflow-hidden">
                        {/* Topic Header - Links to General Chat (Advice or Analysis) */}
                        <div className="flex items-center justify-between group hover:bg-slate-700/20 transition-colors px-3 py-3 border-b border-slate-700/50 bg-slate-800/30">
                          <button
                            onClick={() => {
                              // Find the 'main' mode (Advice/StrategicAnalysis) if it exists, else use the first one
                              const mainMode = (modes as any[]).find(m => m.interactionMode === InteractionMode.Advice || m.interactionMode === InteractionMode.StrategicAnalysis) || modes[0];
                              onLoadHistory(area as LawArea, topic, mainMode.interactionMode, mainMode.servicePath);
                              onClose();
                            }}
                            className="flex-grow flex items-center gap-3 text-left min-w-0"
                          >
                            <CaseIcon className="w-4 h-4 text-cyan-500 shrink-0" />
                            <div className="flex flex-col min-w-0">
                              <p className="text-sm text-slate-200 font-bold truncate group-hover:text-white transition-colors">{topic}</p>
                              {modes.some(m => m.servicePath === 'pro') && (
                                <span className="w-fit text-[8px] bg-violet-600/20 text-violet-400 border border-violet-500/20 px-1 py-0.5 rounded font-bold tracking-tight mt-0.5">PRO ZONE</span>
                              )}
                            </div>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteHistory(area as LawArea, topic);
                            }}
                            className="p-1.5 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                            title={t('history.delete_topic')}
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Sub-modes (Nested Items) */}
                        <div className="bg-slate-900/10 divide-y divide-slate-700/30">
                          {(modes as any[]).map((m, idx) => (
                            <div key={`${m.interactionMode}-${idx}`} className="flex items-center justify-between group/mode hover:bg-slate-700/10 transition-colors px-4 py-2">
                              <button
                                onClick={() => {
                                  onLoadHistory(area as LawArea, topic, m.interactionMode, m.servicePath);
                                  onClose();
                                }}
                                className="flex-grow flex items-center gap-2 text-left min-w-0"
                              >
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-600 group-hover/mode:bg-cyan-500 transition-colors shrink-0" />
                                <span className="text-[11px] text-slate-400 group-hover/mode:text-slate-200 transition-colors truncate">
                                  {m.interactionMode ? t(`interaction.modes.${interactionModeMap[m.interactionMode] || 'advice'}`) : t('history.general_chat')}
                                </span>
                              </button>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={(e) => { e.stopPropagation(); onViewKnowledge(area as LawArea, topic, m.interactionMode); onClose(); }}
                                  className="p-1 hover:text-cyan-400"
                                  title="Pokaż bazę wiedzy"
                                >
                                  <BookOpenIcon className="w-3.5 h-3.5" />
                                </button>
                                {m.docCount > 0 && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); onViewDocuments(area as LawArea, topic, m.interactionMode); onClose(); }}
                                    className="flex items-center gap-0.5 hover:text-cyan-400"
                                    title="Pokaż dokumenty"
                                  >
                                    <DocumentTextIcon className="w-3.5 h-3.5" />
                                    {m.docCount}
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                <CaseIcon className="w-12 h-12 mb-3 opacity-20" />
                <p>{t('history.empty')}</p>
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
            {t('history.close')}
          </button>
        </footer>
      </div>

      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        title={t('history.title')}
      >
        <div className="space-y-4">
          <p>
            {t('history.help_intro')}
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              {t('history.help_click')} <strong>{t('history.help_click_bold')}</strong>{t('history.help_click_end')}
            </li>
            <li>
              {t('history.help_delete')} <strong>{t('history.help_delete_bold')}</strong>{t('history.help_delete_end')}
            </li>
            <li>
              {t('history.help_warning')}
            </li>
          </ul>
        </div>
      </HelpModal>
    </div >
  );
};

export default HistoryPanel;
