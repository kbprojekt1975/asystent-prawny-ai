import React from 'react';
import { LawArea, InteractionMode } from '../types';
import { LightbulbIcon, DocumentTextIcon, SearchIcon, ArchiveIcon, BookOpenIcon, ScaleIcon } from './Icons';
import HelpModal from './HelpModal';
import { InfoIcon } from './InfoIcon';
import { useState } from 'react';

interface InteractionModeSelectorProps {
  lawArea: LawArea;
  onSelect: (mode: InteractionMode) => void;
}


const InteractionModeSelector: React.FC<InteractionModeSelectorProps> = ({ lawArea, onSelect }) => {
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const interactionOptions = [
    { mode: InteractionMode.Advice, icon: <LightbulbIcon />, description: "Uzyskaj analizę i poradę w swojej sprawie." },
    { mode: InteractionMode.Document, icon: <DocumentTextIcon />, description: "Wygeneruj pozew, wniosek lub inne pismo." },
    { mode: InteractionMode.LegalTraining, icon: <BookOpenIcon />, description: "Przejdź interaktywne szkolenie z danego zagadnienia." },
    { mode: InteractionMode.SuggestRegulations, icon: <SearchIcon />, description: "Opisz problem, a AI znajdzie pasujące przepisy." },
    { mode: InteractionMode.FindRulings, icon: <ArchiveIcon />, description: "Wyszukaj przykładowe wyroki w podobnych sprawach." },
    { mode: InteractionMode.Court, icon: <ScaleIcon />, description: "Przygotuj się do kontaktu z sądem w precyzyjnym, formalnym trybie." },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full p-4">
      <div className="text-center mb-10 flex items-center justify-center gap-2">
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
          </ul>
        </div>
      </HelpModal>
    </div>
  );
};

export default InteractionModeSelector;