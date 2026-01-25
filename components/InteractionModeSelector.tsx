import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LawArea, InteractionMode } from '../types';
import { LightbulbIcon, DocumentTextIcon, SearchIcon, ArchiveIcon, BookOpenIcon, ScaleIcon, UserGroupIcon, BriefcaseIcon, PlusCircleIcon } from './Icons';
import HelpModal from './HelpModal';
import { InfoIcon } from './InfoIcon';

interface InteractionModeSelectorProps {
  lawArea: LawArea;
  selectedTopic: string | null;
  onSelectTopic: (topic: string | null) => void;
  onSelect: (mode: InteractionMode, context: 'current' | 'select' | 'new') => void;
  onViewDocuments?: () => void;
  onViewHistory?: () => void;
  onViewKnowledge?: () => void;
}

const InteractionModeSelector: React.FC<InteractionModeSelectorProps> = ({
  lawArea,
  selectedTopic,
  onSelectTopic,
  onSelect,
  onViewDocuments,
  onViewHistory,
  onViewKnowledge
}) => {
  const { t } = useTranslation();
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [activeContext, setActiveContext] = useState<'current' | 'select' | 'new'>(selectedTopic ? 'current' : 'select');

  const handleToolClick = (mode: InteractionMode) => {
    onSelect(mode, activeContext);
  };

  const interactionOptions = [
    { mode: InteractionMode.StrategicAnalysis, label: t('interaction.modes.strategic_analysis'), icon: <BriefcaseIcon className="h-6 w-6 text-violet-400" />, bgColor: "bg-violet-500/10", description: t('interaction.modes.strategic_analysis_desc') },
    { mode: InteractionMode.Advice, label: t('interaction.modes.advice'), icon: <LightbulbIcon className="h-6 w-6 text-cyan-400" />, bgColor: "bg-cyan-500/10", description: t('interaction.modes.advice_desc') },
    { mode: InteractionMode.Document, label: t('interaction.modes.document'), icon: <DocumentTextIcon className="h-6 w-6 text-emerald-400" />, bgColor: "bg-emerald-500/10", description: t('interaction.modes.document_desc') },
    { mode: InteractionMode.LegalTraining, label: t('interaction.modes.legal_training'), icon: <BookOpenIcon className="h-6 w-6 text-blue-400" />, bgColor: "bg-blue-500/10", description: t('interaction.modes.legal_training_desc') },
    { mode: InteractionMode.SuggestRegulations, label: t('interaction.modes.suggest_regulations'), icon: <SearchIcon className="h-6 w-6 text-cyan-400" />, bgColor: "bg-cyan-500/10", description: t('interaction.modes.suggest_regulations_desc') },
    { mode: InteractionMode.FindRulings, label: t('interaction.modes.find_rulings'), icon: <ArchiveIcon className="h-6 w-6 text-cyan-400" />, bgColor: "bg-cyan-500/10", description: t('interaction.modes.find_rulings_desc') },
    { mode: InteractionMode.Court, label: t('interaction.modes.court'), icon: <ScaleIcon className="h-6 w-6 text-slate-200" />, bgColor: "bg-slate-700/50", description: t('interaction.modes.court_desc') },
    { mode: InteractionMode.Negotiation, label: t('interaction.modes.negotiation'), icon: <UserGroupIcon className="h-6 w-6 text-slate-200" />, bgColor: "bg-slate-700/50", description: t('interaction.modes.negotiation_desc') },
  ];

  return (
    <div className="flex flex-col items-center min-h-full p-4 w-full">
      <div className="text-center mb-4 md:mb-6 flex items-center justify-center gap-2 mt-4 md:mt-0">
        <p className="text-sm md:text-lg text-slate-400 font-medium">{t('interaction.header')}</p>
        <InfoIcon onClick={() => setIsHelpOpen(true)} className="w-4 h-4 md:w-5 md:h-5" />
      </div>

      {/* Case Context Selector */}
      <div className="w-full max-w-2xl bg-slate-900/80 p-2 rounded-2xl border-2 border-slate-700 shadow-2xl mb-8 flex flex-col md:flex-row gap-2">
        <button
          onClick={() => setActiveContext('current')}
          disabled={!selectedTopic}
          className={`flex-1 flex items-center justify-start md:justify-center gap-2 md:gap-3 px-4 md:px-5 py-3 md:py-4 rounded-xl transition-all duration-300 ${activeContext === 'current'
            ? 'bg-cyan-600/20 text-cyan-400 border-2 border-cyan-500/40 shadow-lg shadow-cyan-900/20'
            : 'bg-slate-800/50 text-slate-400 hover:text-slate-300 hover:bg-slate-800/70 border-2 border-slate-700/50'
            } ${!selectedTopic ? 'opacity-30 cursor-not-allowed' : ''}`}
        >
          <div className={`p-1.5 md:p-2 rounded-lg flex-shrink-0 ${activeContext === 'current' ? 'bg-cyan-500/20' : 'bg-slate-700/40'}`}>
            <BriefcaseIcon className="w-4 h-4 md:w-5 md:h-5" />
          </div>
          <div className="text-left overflow-hidden">
            <span className="block text-[9px] md:text-[11px] uppercase tracking-wider font-bold opacity-70 leading-none mb-1">
              {t('interaction.options.current_case_prefix')}
            </span>
            <span className="block text-[11px] md:text-sm font-semibold truncate max-w-[120px] md:max-w-[150px]">
              {selectedTopic || t('interaction.options.no_open_case')}
            </span>
          </div>
        </button>

        <button
          onClick={() => setActiveContext('select')}
          className={`flex-1 flex items-center justify-start md:justify-center gap-2 md:gap-3 px-4 md:px-5 py-3 md:py-4 rounded-xl transition-all duration-300 ${activeContext === 'select'
            ? 'bg-slate-700/90 text-white border-2 border-slate-600 shadow-xl'
            : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 hover:text-slate-200 border-2 border-slate-700/50'
            }`}
        >
          <div className={`p-1.5 md:p-2 rounded-lg flex-shrink-0 ${activeContext === 'select' ? 'bg-slate-600/50' : 'bg-slate-700/40'}`}>
            <ArchiveIcon className="w-4 h-4 md:w-5 md:h-5" />
          </div>
          <span className="text-[11px] md:text-sm font-semibold">{t('interaction.options.select_topic')}</span>
        </button>

        <button
          onClick={() => setActiveContext('new')}
          className={`flex-1 flex items-center justify-start md:justify-center gap-2 md:gap-3 px-4 md:px-5 py-3 md:py-4 rounded-xl transition-all duration-300 ${activeContext === 'new'
            ? 'bg-slate-700/90 text-white border-2 border-slate-600 shadow-xl'
            : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 hover:text-slate-200 border-2 border-slate-700/50'
            }`}
        >
          <div className={`p-1.5 md:p-2 rounded-lg flex-shrink-0 ${activeContext === 'new' ? 'bg-slate-600/50' : 'bg-slate-700/40'}`}>
            <PlusCircleIcon className="w-4 h-4 md:w-5 md:h-5" />
          </div>
          <span className="text-[11px] md:text-sm font-semibold">{t('interaction.options.start_clean')}</span>
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-2 gap-3 md:gap-6 w-full max-w-2xl">
        {interactionOptions.map((option) => (
          <button
            key={option.mode}
            onClick={() => handleToolClick(option.mode)}
            className="group bg-slate-800/40 border border-slate-700/50 rounded-xl p-3 md:p-6 text-left hover:bg-slate-800/70 hover:border-cyan-500/40 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 shadow-lg flex flex-col items-start"
          >
            <div className={`w-7 h-7 md:w-12 md:h-12 ${option.bgColor} rounded-lg md:rounded-xl flex items-center justify-center mb-2 md:mb-6 group-hover:scale-110 transition-transform duration-300 flex-shrink-0`}>
              <div className="scale-75 md:scale-100">
                {option.icon}
              </div>
            </div>
            <h2 className="text-[11px] md:text-xl font-bold text-white mb-0.5 md:mb-2 leading-tight">{option.label}</h2>
            <p className="hidden md:block text-xs md:text-sm text-slate-400 leading-relaxed font-medium line-clamp-2">{option.description}</p>
          </button>
        ))}
      </div>

      {/* Resources Section */}
      <div className="w-full max-w-2xl mt-8 pt-8 border-t border-slate-800">
        <h3 className="text-sm font-semibold text-slate-500 mb-4 px-1">{t('interaction.resources.header')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={onViewDocuments}
            className="flex items-center gap-3 p-4 bg-slate-800/30 border border-slate-700 rounded-lg hover:bg-slate-700/50 hover:border-cyan-500/50 transition-all group"
          >
            <div className="p-2 bg-slate-700/50 rounded-lg text-slate-400 group-hover:text-cyan-400 transition-colors">
              <DocumentTextIcon className="h-5 w-5" />
            </div>
            <div className="text-left">
              <span className="block text-sm font-medium text-slate-200">{t('interaction.resources.documents')}</span>
              <span className="block text-xs text-slate-500">{t('interaction.resources.documents_desc')}</span>
            </div>
          </button>

          <button
            onClick={onViewHistory}
            className="flex items-center gap-3 p-4 bg-slate-800/30 border border-slate-700 rounded-lg hover:bg-slate-700/50 hover:border-cyan-500/50 transition-all group"
          >
            <div className="p-2 bg-slate-700/50 rounded-lg text-slate-400 group-hover:text-purple-400 transition-colors">
              <ArchiveIcon className="h-5 w-5" />
            </div>
            <div className="text-left">
              <span className="block text-sm font-medium text-slate-200">{t('interaction.resources.history')}</span>
              <span className="block text-xs text-slate-500">{t('interaction.resources.history_desc')}</span>
            </div>
          </button>

          <button
            onClick={onViewKnowledge}
            className="flex items-center gap-3 p-4 bg-slate-800/30 border border-slate-700 rounded-lg hover:bg-slate-700/50 hover:border-cyan-500/50 transition-all group"
          >
            <div className="p-2 bg-slate-700/50 rounded-lg text-slate-400 group-hover:text-yellow-400 transition-colors">
              <BookOpenIcon className="h-5 w-5" />
            </div>
            <div className="text-left">
              <span className="block text-sm font-medium text-slate-200">{t('interaction.resources.knowledge')}</span>
              <span className="block text-xs text-slate-500">{t('interaction.resources.knowledge_desc')}</span>
            </div>
          </button>
        </div>
      </div>

      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        title={t('interaction.help.title')}
      >
        <div className="space-y-4">
          <p>
            {t('interaction.help.intro')}
          </p>
          <ul className="list-disc pl-5 space-y-2 text-sm">
            <li><strong>{t('interaction.modes.strategic_analysis')}:</strong> {t('interaction.help.list.strategic_analysis')}</li>
            <li><strong>{t('interaction.modes.advice')}:</strong> {t('interaction.help.list.advice')}</li>
            <li><strong>{t('interaction.modes.document')}:</strong> {t('interaction.help.list.document')}</li>
            <li><strong>{t('interaction.modes.legal_training')}:</strong> {t('interaction.help.list.legal_training')}</li>
            <li><strong>{t('interaction.modes.suggest_regulations')}:</strong> {t('interaction.help.list.suggest_regulations')}</li>
            <li><strong>{t('interaction.modes.find_rulings')}:</strong> {t('interaction.help.list.find_rulings')}</li>
            <li><strong>{t('interaction.modes.court')}:</strong> {t('interaction.help.list.court')}</li>
            <li><strong>{t('interaction.modes.negotiation')}:</strong> {t('interaction.help.list.negotiation')}</li>
          </ul>
        </div>
      </HelpModal>
    </div>
  );
};

export default InteractionModeSelector;