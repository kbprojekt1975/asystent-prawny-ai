import React from 'react';
import { useTranslation } from 'react-i18next';
import { LawArea, InteractionMode } from '../types';
import { XIcon } from './Icons';
import InteractionModeSelector from './InteractionModeSelector';

interface AiToolsSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    lawArea: LawArea;
    selectedTopic: string | null;
    onSelectTopic: (topic: string | null) => void;
    onSelectMode: (mode: InteractionMode, context: 'current' | 'select' | 'new') => void;
    onViewDocuments: () => void;
    onViewHistory: () => void;
    onViewKnowledge: () => void;
}

const AiToolsSidebar: React.FC<AiToolsSidebarProps> = ({
    isOpen,
    onClose,
    lawArea,
    selectedTopic,
    onSelectTopic,
    onSelectMode,
    onViewDocuments,
    onViewHistory,
    onViewKnowledge
}) => {
    const { t } = useTranslation();

    if (!isOpen) return null;

    return (
        <div
            className={`fixed inset-0 bg-black bg-opacity-60 z-[60] transition-opacity duration-300 ease-in-out ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            onClick={onClose}
        >
            <div
                className={`fixed top-0 right-0 h-full w-full max-w-2xl bg-slate-900 shadow-2xl border-l border-slate-700 transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
                onClick={e => e.stopPropagation()}
            >
                <header className="p-6 flex justify-between items-center border-b border-slate-700 flex-shrink-0 bg-slate-800/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-cyan-500/20 rounded-xl">
                            <svg className="w-6 h-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-white uppercase tracking-wider">{t('menu.aiTools')}</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                        aria-label={t('history.close')}
                    >
                        <XIcon className="w-6 h-6" />
                    </button>
                </header>

                <main className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="p-6">
                        <InteractionModeSelector
                            lawArea={lawArea}
                            selectedTopic={selectedTopic}
                            onSelectTopic={onSelectTopic}
                            onSelect={(mode, context) => {
                                onSelectMode(mode, context);
                                onClose();
                            }}
                            onViewDocuments={onViewDocuments}
                            onViewHistory={onViewHistory}
                            onViewKnowledge={onViewKnowledge}
                        />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AiToolsSidebar;
