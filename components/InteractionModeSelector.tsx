import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LawArea, InteractionMode } from '../types';
import { LightbulbIcon, DocumentTextIcon, SearchIcon, ArchiveIcon, BookOpenIcon, ScaleIcon, UserGroupIcon, BriefcaseIcon } from './Icons';
import HelpModal from './HelpModal';
import { InfoIcon } from './InfoIcon';

interface InteractionModeSelectorProps {
  lawArea: LawArea;
  onSelect: (mode: InteractionMode) => void;
  onViewDocuments?: () => void;
  onViewHistory?: () => void;
  onViewKnowledge?: () => void;
}

const InteractionModeSelector: React.FC<InteractionModeSelectorProps> = ({
  lawArea,
  onSelect,
  onViewDocuments,
  onViewHistory,
  onViewKnowledge
}) => {
  const { t } = useTranslation();
  const [isHelpOpen, setIsHelpOpen] = useState(false);

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
      <div className="text-center mb-10 flex items-center justify-center gap-2 mt-8 md:mt-0">
        <p className="text-lg text-slate-400">{t('interaction.header')}</p>
        <InfoIcon onClick={() => setIsHelpOpen(true)} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
        {interactionOptions.map((option) => (
          <button
            key={option.mode}
            onClick={() => onSelect(option.mode)}
            className="group bg-slate-800/40 border border-slate-700/50 rounded-xl p-6 text-left hover:bg-slate-800/70 hover:border-cyan-500/40 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          >
            <div className={`w-12 h-12 ${option.bgColor} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
              {option.icon}
            </div>
            <h2 className="text-xl font-bold text-white mb-2 leading-tight">{option.label}</h2>
            <p className="text-sm text-slate-400 leading-relaxed font-medium">{option.description}</p>
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