import React, { useState } from 'react';
import { LawArea } from '../types';
import { CaseIcon, PlusCircleIcon, TrashIcon, UserGroupIcon } from './Icons';
import HelpModal from './HelpModal';
import { InfoIcon } from './InfoIcon';

interface TopicSelectorProps {
  lawArea: LawArea;
  topics: string[];
  onSelectTopic: (topic: string) => void;
  onAddTopic: (topic: string) => void;
  onAddNegotiationTopic: (topic: string) => void;
  onDeleteTopic: (topic: string) => void;
}

const TopicSelector: React.FC<TopicSelectorProps> = ({ lawArea, topics, onSelectTopic, onAddTopic, onAddNegotiationTopic, onDeleteTopic }) => {
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
      <div className="text-center mb-10 flex items-center justify-center gap-2 mt-4 md:mt-0">
        <p className="text-lg text-slate-400">Wybierz lub utwórz temat sprawy.</p>
        <InfoIcon onClick={() => setIsHelpOpen(true)} />
      </div>
      <div className="w-full max-w-2xl space-y-8 my-auto pb-8">
        {/* Lista tematów */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 shadow-xl backdrop-blur-sm">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <CaseIcon className="w-6 h-6 text-cyan-400" />
            Twoje Sprawy
          </h2>

          {/* Sekcja: Sprawy standardowe */}
          <div className="space-y-6">
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 px-1">Analiza i Porady</h3>
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
                  <p className="text-slate-500 text-sm italic px-1">Brak aktywnych spraw w tym dziale.</p>
                )}
              </div>
            </div>

            {/* Sekcja: Negocjacje i Mediacje */}
            <div className="pt-4 border-t border-slate-700/50">
              <h3 className="text-xs font-bold text-purple-400/80 uppercase tracking-widest mb-3 px-1">Negocjacje i Mediacje</h3>
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
                  <p className="text-slate-500 text-sm italic px-1">Nie rozpoczęto jeszcze żadnych negocjacji.</p>
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
              Nowa Sprawa
            </h2>
            <div className="flex flex-col md:flex-row gap-3">
              <input
                type="text"
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddClick()}
                placeholder="Np. Sprawa o alimenty, Umowa najmu"
                className="flex-grow bg-slate-700/50 border border-slate-600 rounded-lg p-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
              />
              <button
                onClick={handleAddClick}
                disabled={!newTopic.trim()}
                className="bg-cyan-600 text-white px-6 py-3 md:py-0 rounded-lg hover:bg-cyan-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 font-medium shrink-0"
              >
                Analizuj
              </button>
            </div>
          </div>

          <div className="bg-slate-800/50 border border-purple-900/30 rounded-xl p-6 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/5 blur-3xl rounded-full -mr-16 -mt-16"></div>
            <h2 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
              <UserGroupIcon className="text-purple-400 w-5 h-5" />
              Nowa Konwersacja
            </h2>
            <p className="text-xs text-slate-400 mb-4 uppercase tracking-tighter">Mediacje i Negocjacje</p>
            <div className="flex flex-col md:flex-row gap-3">
              <input
                type="text"
                value={newNegotiationTopic}
                onChange={(e) => setNewNegotiationTopic(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddNegotiationClick()}
                placeholder="Np. Kontakt z dziećmi, Spłata zadłużenia"
                className="flex-grow bg-slate-700/50 border border-purple-900/30 rounded-lg p-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
              <button
                onClick={handleAddNegotiationClick}
                disabled={!newNegotiationTopic.trim()}
                className="bg-purple-600 text-white px-6 py-3 md:py-0 rounded-lg hover:bg-purple-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 font-medium shrink-0"
              >
                Rozpocznij
              </button>
            </div>
          </div>
        </div>
        <HelpModal
          isOpen={isHelpOpen}
          onClose={() => setIsHelpOpen(false)}
          title="Zarządzanie tematami"
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
    </div>
  );
};

export default TopicSelector;