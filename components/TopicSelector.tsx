import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LawArea } from '../types';
import { CaseIcon, PlusCircleIcon, TrashIcon, UserGroupIcon, SparklesIcon, ChevronUpIcon } from './Icons';
import HelpModal from './HelpModal';
import { InfoIcon } from './InfoIcon';

interface TopicSelectorProps {
  lawArea: LawArea;
  topics: string[];
  onSelectTopic: (topic: string) => void;
  onAddTopic: (topic: string) => void;
  onAddNegotiationTopic: (topic: string) => void;
  onDeleteTopic: (topic: string) => void;
  onChangeMode?: () => void;
  isLocalOnly?: boolean;
  activeAgent?: any;
}

const TopicSelector: React.FC<TopicSelectorProps> = ({ lawArea, topics, onSelectTopic, onAddTopic, onAddNegotiationTopic, onDeleteTopic, onChangeMode, isLocalOnly, activeAgent }) => {
  const { t } = useTranslation();
  const [newTopic, setNewTopic] = useState('');
  const [newNegotiationTopic, setNewNegotiationTopic] = useState('');
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const handleAddClick = () => {
    if (newTopic.trim()) {
      onAddTopic(newTopic);
      setNewTopic('');
    }
  };

  const handleAddNegotiationClick = () => {
    if (newNegotiationTopic.trim()) {
      let topicWithSuffix = newNegotiationTopic.trim();
      const lower = topicWithSuffix.toLowerCase();
      if (!lower.includes('negocjacje') && !lower.includes('mediacje') && !lower.includes('ugoda') && !lower.includes('porozumienie')) {
        topicWithSuffix += ' (Negocjacje)';
      }
      onAddNegotiationTopic(topicWithSuffix);
      setNewNegotiationTopic('');
    }
  };

  return (
    <div className="flex flex-col items-center min-h-full p-4 w-full">
      <div className="text-center mb-10 flex flex-col items-center justify-center gap-2 mt-4 md:mt-0">
        {activeAgent && (
          <div className="mb-4 px-4 py-2 bg-violet-500/20 border border-violet-500/30 rounded-full flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="w-6 h-6 bg-violet-500 rounded-full flex items-center justify-center text-[10px] font-black text-white uppercase">
              {activeAgent.name.substring(0, 1)}
            </div>
            <span className="text-sm font-bold text-violet-300">AKTYWNY AGENT: {activeAgent.name.toUpperCase()}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <p className="text-lg text-slate-400">
            {activeAgent ? `Wybierz sprawę dla agenta ${activeAgent.name}` : t('topic.header')}
          </p>
          <InfoIcon onClick={() => setIsHelpOpen(true)} />
        </div>
      </div>
      <div className="w-full max-w-2xl space-y-8 my-auto pb-8">
        {/* AI Tools Access - RELOCATED TO TOP */}
        {onChangeMode && (
          <div className="pt-2">
            <button
              onClick={onChangeMode}
              className="w-full flex items-center justify-between p-4 bg-slate-800/80 border border-slate-700 rounded-xl hover:bg-slate-700 hover:border-cyan-500/50 transition-all group shadow-xl backdrop-blur-sm"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-600/20 rounded-lg text-cyan-400 group-hover:bg-cyan-600/30 transition-colors">
                  <SparklesIcon className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <span className="block text-sm font-semibold text-slate-200">{t('topic.changeMode')}</span>
                  <span className="block text-[10px] text-slate-400 uppercase tracking-wider">{t('topic.modeDesc')}</span>
                </div>
              </div>
              <ChevronUpIcon className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors rotate-90" />
            </button>
          </div>
        )}

        {/* Lista tematów */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 shadow-xl backdrop-blur-sm">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <CaseIcon className="w-6 h-6 text-cyan-400" />
              {t('topic.yourCases')}
            </h2>
            {isLocalOnly && (
              <p className="text-[10px] text-amber-400/80 mt-1 uppercase tracking-tight flex items-center gap-1.5 font-medium ml-1">
                <span className="w-1 h-1 bg-amber-400 rounded-full animate-pulse"></span>
                {t('topic.noConsentHistoryNotice')}
              </p>
            )}
          </div>

          {/* Sekcja: Sprawy standardowe */}
          <div className="space-y-6">
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 px-1">{t('topic.analysisAndAdvice')}</h3>
              <div className="grid grid-cols-1 gap-3">
                {topics.filter(t => {
                  const low = t.toLowerCase();
                  return !low.includes('negocjacje') && !low.includes('mediacje') && !low.includes('ugoda') && !low.includes('porozumienie');
                }).length > 0 ? (
                  topics
                    .filter(t => {
                      const low = t.toLowerCase();
                      return !low.includes('negocjacje') && !low.includes('mediacje') && !low.includes('ugoda') && !low.includes('porozumienie');
                    })
                    .map((topic) => (
                      <div key={topic} className="group flex items-center justify-between bg-slate-700/30 border border-slate-700/50 rounded-lg pr-3 hover:bg-slate-700/50 hover:border-cyan-500/50 transition-all duration-200">
                        <button
                          onClick={() => onSelectTopic(topic)}
                          className="flex-grow flex items-center gap-4 p-4 text-left focus:outline-none"
                        >
                          <CaseIcon className="w-5 h-5 text-cyan-400 opacity-70" />
                          <span className="text-slate-200 font-medium">{topic}</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteTopic(topic);
                          }}
                          className="text-slate-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 p-2"
                          title="Usuń sprawę"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    ))
                ) : (
                  <p className="text-slate-500 text-sm italic px-1">{t('topic.noActiveCases')}</p>
                )}
              </div>
            </div>

            {/* Sekcja: Negocjacje i Mediacje */}
            <div className="pt-4 border-t border-slate-700/50">
              <h3 className="text-xs font-bold text-purple-400/80 uppercase tracking-widest mb-3 px-1">{t('topic.negotiationsAndMediation')}</h3>
              <div className="grid grid-cols-1 gap-3">
                {topics.filter(t => {
                  const low = t.toLowerCase();
                  return low.includes('negocjacje') || low.includes('mediacje') || low.includes('ugoda') || low.includes('porozumienie');
                }).length > 0 ? (
                  topics
                    .filter(t => {
                      const low = t.toLowerCase();
                      return low.includes('negocjacje') || low.includes('mediacje') || low.includes('ugoda') || low.includes('porozumienie');
                    })
                    .map((topic) => (
                      <div key={topic} className="group flex items-center justify-between bg-purple-900/10 border border-purple-900/30 rounded-lg pr-3 hover:bg-purple-900/20 hover:border-purple-500/50 transition-all duration-200 shadow-sm">
                        <button
                          onClick={() => onSelectTopic(topic)}
                          className="flex-grow flex items-center gap-4 p-4 text-left focus:outline-none"
                        >
                          <UserGroupIcon className="h-5 w-5 text-purple-400" />
                          <span className="text-purple-100 font-medium">{topic}</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteTopic(topic);
                          }}
                          className="text-slate-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 p-2"
                          title="Usuń konwersację"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    ))
                ) : (
                  <p className="text-slate-500 text-sm italic px-1">{t('topic.noNegotiations')}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Formularze tworzenia */}
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <PlusCircleIcon className="text-cyan-400 w-5 h-5" />
              {t('topic.newCase')}
            </h2>
            <div className="flex flex-col md:flex-row gap-3">
              <input
                type="text"
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddClick()}
                placeholder={t('topic.newCasePlaceholder')}
                className="flex-grow bg-slate-700/50 border border-slate-600 rounded-lg p-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
              />
              <button
                onClick={handleAddClick}
                disabled={!newTopic.trim()}
                className="bg-cyan-600 text-white px-6 py-3 md:py-0 rounded-lg hover:bg-cyan-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 font-medium shrink-0"
              >
                {t('topic.analyze')}
              </button>
            </div>
          </div>

          <div className="bg-slate-800/50 border border-purple-900/30 rounded-xl p-6 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/5 blur-3xl rounded-full -mr-16 -mt-16"></div>
            <h2 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
              <UserGroupIcon className="text-purple-400 w-5 h-5" />
              {t('topic.newConversation')}
            </h2>
            <p className="text-xs text-slate-400 mb-4 uppercase tracking-tighter">{t('topic.negotiationDesc')}</p>
            <div className="flex flex-col md:flex-row gap-3">
              <input
                type="text"
                value={newNegotiationTopic}
                onChange={(e) => setNewNegotiationTopic(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddNegotiationClick()}
                placeholder={t('topic.negotiationPlaceholder')}
                className="flex-grow bg-slate-700/50 border border-purple-900/30 rounded-lg p-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
              <button
                onClick={handleAddNegotiationClick}
                disabled={!newNegotiationTopic.trim()}
                className="bg-purple-600 text-white px-6 py-3 md:py-0 rounded-lg hover:bg-purple-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 font-medium shrink-0"
              >
                {t('topic.start')}
              </button>
            </div>
          </div>
        </div>
      </div>

      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        title={t('topic.header')}
      >
        <div className="space-y-4">
          <p>
            W ramach wybranej dziedziny prawa (np. {lawArea}) możesz tworzyć oddzielne wątki
            dla różnych spraw.
          </p>
          <ul className="list-disc pl-5 space-y-2 text-sm">
            <li>
              <strong>Wybór tematu:</strong> Jeśli już wcześniej rozmawiałeś na dany temat,
              znajdziesz go na liście. Kliknij go, aby kontynuować.
            </li>
            <li>
              <strong>Nowy temat:</strong> Wpisz nazwę (np. "Spór z sąsiadem") i kliknij <em>Dodaj</em>,
              aby rozpocząć zupełnie nową rozmowę.
            </li>
            <li>
              <strong>Usuwanie:</strong> Możesz usunąć temat, którego już nie potrzebujesz,
              używając ikony kosza.
            </li>
          </ul>
        </div>
      </HelpModal>
    </div>
  );
};

export default TopicSelector;