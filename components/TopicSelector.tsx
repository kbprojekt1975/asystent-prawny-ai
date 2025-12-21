import React, { useState } from 'react';
import { LawArea } from '../types';
import { CaseIcon, PlusCircleIcon, TrashIcon } from './Icons';
import HelpModal from './HelpModal';
import { InfoIcon } from './InfoIcon';

interface TopicSelectorProps {
  lawArea: LawArea;
  topics: string[];
  onSelectTopic: (topic: string) => void;
  onAddTopic: (topic: string) => void;
  onDeleteTopic: (topic: string) => void;
}

const TopicSelector: React.FC<TopicSelectorProps> = ({ lawArea, topics, onSelectTopic, onAddTopic, onDeleteTopic }) => {
  const [newTopic, setNewTopic] = useState('');
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const handleAddClick = () => {
    if (newTopic.trim()) {
      onAddTopic(newTopic);
      setNewTopic('');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-4">
      <div className="text-center mb-10 flex items-center justify-center gap-2">
        <p className="text-lg text-slate-400">Wybierz lub utwórz temat sprawy.</p>
        <InfoIcon onClick={() => setIsHelpOpen(true)} />
      </div>
      <div className="w-full max-w-2xl">
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Istniejące tematy</h2>
          {topics.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {topics.map((topic) => (
                <div key={topic} className="group flex items-center justify-between bg-slate-700/50 rounded-lg pr-3 hover:bg-slate-700/70 transition-all duration-200">
                  <button
                    onClick={() => onSelectTopic(topic)}
                    className="flex-grow flex items-center gap-4 p-3 text-left focus:outline-none"
                  >
                    <CaseIcon />
                    <span className="text-white">{topic}</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteTopic(topic);
                    }}
                    className="text-slate-500 hover:text-red-500 transition-colors opacity-50 group-hover:opacity-100 focus:outline-none"
                    aria-label={`Usuń temat ${topic}`}
                  >
                    <TrashIcon />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 text-center">Brak zdefiniowanych tematów. Utwórz nowy poniżej.</p>
          )}
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Utwórz nowy temat</h2>
          <div className="flex gap-4">
            <input
              type="text"
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddClick()}
              placeholder="Np. Sprawa o alimenty, Umowa najmu"
              className="flex-grow bg-slate-700 rounded-lg p-3 text-lg text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            <button
              onClick={handleAddClick}
              disabled={!newTopic.trim()}
              className="bg-cyan-600 text-white p-3 rounded-lg hover:bg-cyan-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <PlusCircleIcon />
              <span className="hidden sm:inline">Dodaj</span>
            </button>
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