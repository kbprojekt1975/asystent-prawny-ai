import React from 'react';
import { LawArea, InteractionMode } from '../types';
import { LightbulbIcon, DocumentTextIcon, SearchIcon, ArchiveIcon, BookOpenIcon, ScaleIcon, UserGroupIcon } from './Icons';
import HelpModal from './HelpModal';
import { InfoIcon } from './InfoIcon';
import { useState } from 'react';

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
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const interactionOptions = [
    { mode: InteractionMode.Advice, icon: <LightbulbIcon />, description: "Uzyskaj analizę i poradę w swojej sprawie." },
    { mode: InteractionMode.Document, icon: <DocumentTextIcon />, description: "Wygeneruj pozew, wniosek lub inne pismo." },
    { mode: InteractionMode.LegalTraining, icon: <BookOpenIcon />, description: "Przejdź interaktywne szkolenie z danego zagadnienia." },
    { mode: InteractionMode.SuggestRegulations, icon: <SearchIcon />, description: "Opisz problem, a AI znajdzie pasujące przepisy." },
    { mode: InteractionMode.FindRulings, icon: <ArchiveIcon />, description: "Wyszukaj przykładowe wyroki w podobnych sprawach." },
    { mode: InteractionMode.Court, icon: <ScaleIcon />, description: "Przygotuj się do kontaktu z sądem w precyzyjnym, formalnym trybie." },
    { mode: InteractionMode.Negotiation, icon: <UserGroupIcon />, description: "Opracuj strategię i treść komunikacji z drugą stroną sporu." },
  ];

  return (
    <div className="flex flex-col items-center min-h-full p-4 w-full">
      <div className="text-center mb-10 flex items-center justify-center gap-2 mt-8 md:mt-0">
        <p className="text-lg text-slate-400">Wybierz rodzaj pomocy, której potrzebujesz.</p>
        <InfoIcon onClick={() => setIsHelpOpen(true)} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
        {interactionOptions.map((option) => (
          <button
            key={option.mode}
            onClick={() => onSelect(option.mode)}
            className="group bg-slate-800/50 border border-slate-700 rounded-lg p-6 text-left hover:bg-slate-700/70 hover:border-cyan-500 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <div className="w-12 h-12 bg-slate-700/50 rounded-lg flex items-center justify-center mb-4 group-hover:bg-cyan-600/30 transition-colors">
              {option.icon}
            </div>
            <h2 className="text-xl font-semibold text-white mb-1">{option.mode}</h2>
            <p className="text-slate-400">{option.description}</p>
          </button>
        ))}
      </div>

      {/* Resources Section */}
      <div className="w-full max-w-2xl mt-8 pt-8 border-t border-slate-800">
        <h3 className="text-sm font-semibold text-slate-500 mb-4 px-1">TWOJE ZASOBY</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={onViewDocuments}
            className="flex items-center gap-3 p-4 bg-slate-800/30 border border-slate-700 rounded-lg hover:bg-slate-700/50 hover:border-cyan-500/50 transition-all group"
          >
            <div className="p-2 bg-slate-700/50 rounded-lg text-slate-400 group-hover:text-cyan-400 transition-colors">
              <DocumentTextIcon className="h-5 w-5" />
            </div>
            <div className="text-left">
              <span className="block text-sm font-medium text-slate-200">Moje Pisma</span>
              <span className="block text-xs text-slate-500">Wygenerowane dokumenty</span>
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
              <span className="block text-sm font-medium text-slate-200">Historia Spraw</span>
              <span className="block text-xs text-slate-500">Przeglądaj czaty</span>
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
              <span className="block text-sm font-medium text-slate-200">Baza Wiedzy</span>
              <span className="block text-xs text-slate-500">Zapisane przepisy</span>
            </div>
          </button>
        </div>
      </div>

      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        title="Dostępne narzędzia"
      >
        <div className="space-y-4">
          <p>
            Asystent oferuje szereg specjalistycznych narzędzi dostosowanych do Twoich potrzeb:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-sm">
            <li><strong>Porada Prawna:</strong> Ogólna analiza problemu i wstępne wskazówki.</li>
            <li><strong>Generowanie Pisma:</strong> Kreator dokumentów (pozwy, wnioski, wezwania).</li>
            <li><strong>Szkolenie Prawne:</strong> Moduł edukacyjny, który nauczy Cię podstaw danego zagadnienia.</li>
            <li><strong>Zasugeruj Przepisy:</strong> Wyszukiwarka konkretnych artykułów prawnych pasujących do sytuacji.</li>
            <li><strong>Znajdź Podobne Wyroki:</strong> Baza orzecznictwa, która pomoże znaleźć precedensy.</li>
            <li><strong>Tryb Sądowy:</strong> Symulacja rozmowy w sądzie - formalny język i precyzyjne odpowiedzi.</li>
            <li><strong>Konwersacja ze stroną przeciwną:</strong> Wsparcie w mediacjach, pisanie maili/SMS i budowanie strategii ugodowej.</li>
          </ul>
        </div>
      </HelpModal>
    </div>
  );
};

export default InteractionModeSelector;