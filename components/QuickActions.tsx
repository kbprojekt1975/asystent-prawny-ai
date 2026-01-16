import React from 'react';
import { useTranslation } from 'react-i18next';
import { InteractionMode } from '../types';
import { DocumentDuplicateIcon, QuestionMarkCircleIcon, SearchIcon, SparklesIcon } from './Icons';

interface QuickAction {
    text: string;
    icon: React.ReactNode;
}

const getSuggestions = (t: any): Partial<Record<InteractionMode, QuickAction[]>> => ({
    [InteractionMode.Advice]: [
        { text: t('chat.quick_actions.advice.create_doc'), icon: <DocumentDuplicateIcon /> },
        { text: t('chat.quick_actions.advice.regulations'), icon: <SearchIcon /> },
        { text: t('chat.quick_actions.advice.explain'), icon: <SparklesIcon /> },
    ],
    [InteractionMode.Document]: [
        { text: t('chat.quick_actions.document.check'), icon: <QuestionMarkCircleIcon /> },
        { text: t('chat.quick_actions.document.next_steps'), icon: <QuestionMarkCircleIcon /> },
        { text: t('chat.quick_actions.document.justify'), icon: <DocumentDuplicateIcon /> },
    ],
    [InteractionMode.SuggestRegulations]: [
        { text: t('chat.quick_actions.suggest_regulations.explain'), icon: <SparklesIcon /> },
        { text: t('chat.quick_actions.suggest_regulations.apply'), icon: <QuestionMarkCircleIcon /> },
        { text: t('chat.quick_actions.suggest_regulations.create_doc'), icon: <DocumentDuplicateIcon /> },
    ],
    [InteractionMode.FindRulings]: [
        { text: t('chat.quick_actions.find_rulings.impact'), icon: <QuestionMarkCircleIcon /> },
        { text: t('chat.quick_actions.find_rulings.summarize'), icon: <SparklesIcon /> },
        { text: t('chat.quick_actions.find_rulings.more'), icon: <SearchIcon /> },
    ],
    [InteractionMode.LegalTraining]: [
        { text: t('chat.quick_actions.legal_training.summarize'), icon: <SparklesIcon /> },
        { text: t('chat.quick_actions.legal_training.question'), icon: <QuestionMarkCircleIcon /> },
        { text: t('chat.quick_actions.legal_training.examples'), icon: <SearchIcon /> },
    ],
});


interface QuickActionsProps {
    interactionMode: InteractionMode;
    onActionClick: (prompt: string) => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({ interactionMode, onActionClick }) => {
    const { t } = useTranslation();
    const actions = getSuggestions(t)[interactionMode] || [];

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