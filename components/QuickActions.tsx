import React from 'react';
import { InteractionMode } from '../types';
import { DocumentDuplicateIcon, QuestionMarkCircleIcon, SearchIcon, SparklesIcon } from './Icons';

interface QuickAction {
    text: string;
    icon: React.ReactNode;
}

const suggestions: Partial<Record<InteractionMode, QuickAction[]>> = {
    [InteractionMode.Advice]: [
        { text: "Stwórz pismo na podstawie tej porady", icon: <DocumentDuplicateIcon /> },
        { text: "Jakie przepisy to regulują?", icon: <SearchIcon /> },
        { text: "Wyjaśnij to prostszym językiem", icon: <SparklesIcon /> },
    ],
    [InteractionMode.Document]: [
        { text: "Sprawdź poprawność formalną pisma", icon: <QuestionMarkCircleIcon /> },
        { text: "Jakie są dalsze kroki?", icon: <QuestionMarkCircleIcon /> },
        { text: "Dodaj uzasadnienie faktyczne", icon: <DocumentDuplicateIcon /> },
    ],
    [InteractionMode.SuggestRegulations]: [
        { text: "Wyjaśnij te przepisy prostszym językiem", icon: <SparklesIcon /> },
        { text: "Jak zastosować to w mojej sprawie?", icon: <QuestionMarkCircleIcon /> },
        { text: "Stwórz pismo w oparciu o te przepisy", icon: <DocumentDuplicateIcon /> },
    ],
    [InteractionMode.FindRulings]: [
        { text: "Jak te wyroki wpływają na moją sytuację?", icon: <QuestionMarkCircleIcon /> },
        { text: "Streszcz najważniejszy wyrok", icon: <SparklesIcon /> },
        { text: "Znajdź więcej podobnych orzeczeń", icon: <SearchIcon /> },
    ],
    [InteractionMode.LegalTraining]: [
        { text: "Podsumuj kluczowe punkty", icon: <SparklesIcon /> },
        { text: "Mam dodatkowe pytanie", icon: <QuestionMarkCircleIcon /> },
        { text: "Podaj praktyczne przykłady", icon: <SearchIcon /> },
    ],
};


interface QuickActionsProps {
  interactionMode: InteractionMode;
  onActionClick: (prompt: string) => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({ interactionMode, onActionClick }) => {
  const actions = suggestions[interactionMode] || [];

  if (actions.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 md:px-6 pb-2">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4">
        {actions.map((action, index) => (
            <button
                key={index}
                onClick={() => onActionClick(action.text)}
                className="flex-shrink-0 flex items-center gap-2 bg-slate-800/60 backdrop-blur-sm hover:bg-slate-700/80 text-slate-300 text-sm font-medium py-2 px-3 rounded-full transition-colors duration-200 border border-slate-700"
            >
                {React.cloneElement(action.icon as React.ReactElement, { className: "h-4 w-4 text-slate-400" })}
                {action.text}
            </button>
        ))}
        </div>
    </div>
  );
};

export default QuickActions;