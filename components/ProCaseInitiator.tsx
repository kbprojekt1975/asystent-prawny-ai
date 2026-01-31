import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BriefcaseIcon, ArrowLeftIcon, MagicWandIcon, ClockIcon, TrashIcon } from './Icons';
import { LawArea } from '../types';
import { InfoIcon } from './InfoIcon';
import HelpModal from './HelpModal';

interface ProCaseInitiatorProps {
    lawArea: LawArea;
    existingTopics: string[];
    onSelectTopic: (topic: string) => void;
    onAddTopic: (topic: string) => void;
    onDeleteTopic: (topic: string) => void;
    onBack: () => void;
    isLocalOnly?: boolean;
}

const ProCaseInitiator: React.FC<ProCaseInitiatorProps> = ({
    lawArea,
    existingTopics = [],
    onSelectTopic,
    onAddTopic,
    onDeleteTopic,
    onBack,
    isLocalOnly
}) => {
    const [newTopic, setNewTopic] = useState('');
    const [isHelpOpen, setIsHelpOpen] = useState(false);
    const { t } = useTranslation();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newTopic.trim()) {
            onAddTopic(newTopic.trim());
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-900 text-white overflow-hidden animate-in fade-in duration-500">
            {/* Header */}
            <div className="p-4 border-b border-slate-700/50 bg-slate-800/30 backdrop-blur-md flex items-center justify-between">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
                >
                    <ArrowLeftIcon className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    <span>{t('pro.initiator.back')}</span>
                </button>
                <div className="flex items-center gap-2">
                    <BriefcaseIcon className="w-5 h-5 text-violet-400" />
                    <span className="font-bold text-xs uppercase tracking-widest text-slate-400">{t('pro.initiator.header_title')}</span>
                </div>
                <div className="w-20 hidden md:block"></div> {/* Spacer */}
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                <div className="max-w-2xl mx-auto py-8 md:py-16">
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-violet-600/10 rounded-[2rem] border border-violet-500/20 mb-8 shadow-2xl shadow-violet-900/10 rotate-3">
                            <MagicWandIcon className="w-10 h-10 text-violet-400 -rotate-3" />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-extrabold mb-4 tracking-tight flex items-center justify-center gap-3">
                            {t('pro.initiator.main_title')}
                            <InfoIcon onClick={() => setIsHelpOpen(true)} className="w-6 h-6" />
                        </h1>
                        <p className="text-slate-400 text-lg leading-relaxed max-w-md mx-auto">
                            {t('pro.initiator.main_desc')}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="mb-16">
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-[2rem] blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                            <div className="relative flex flex-col md:flex-row gap-3">
                                <input
                                    autoFocus
                                    type="text"
                                    value={newTopic}
                                    onChange={(e) => setNewTopic(e.target.value)}
                                    placeholder={t('pro.initiator.placeholder')}
                                    className="flex-1 bg-slate-800/80 border border-slate-700/50 rounded-2xl md:rounded-3xl p-6 text-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 transition-all backdrop-blur-xl"
                                />
                                <button
                                    type="submit"
                                    disabled={!newTopic.trim()}
                                    className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:grayscale px-10 py-5 md:py-0 rounded-2xl md:rounded-3xl font-bold transition-all shadow-lg shadow-violet-900/40 flex items-center justify-center gap-3 active:scale-95"
                                >
                                    <span>{t('pro.initiator.start_button')}</span>
                                    <MagicWandIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </form>

                    {existingTopics.length > 0 && (
                        <div className="animate-in fade-in slide-in-from-top-4 duration-700 delay-300">
                            <div className="flex items-center justify-between gap-4 mb-8">
                                <div className="flex items-center gap-4 flex-1">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] whitespace-nowrap">{t('pro.initiator.previous_cases')}</span>
                                    <div className="h-px w-full bg-slate-800"></div>
                                </div>
                                {isLocalOnly && (
                                    <span className="text-[8px] text-amber-500/80 uppercase tracking-widest font-bold whitespace-nowrap bg-amber-500/5 px-2 py-1 rounded border border-amber-500/20">
                                        {t('topic.noConsentHistoryNotice')}
                                    </span>
                                )}
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                                {existingTopics.map((topic, idx) => (
                                    <div key={idx} className="group relative">
                                        <button
                                            onClick={() => onSelectTopic(topic)}
                                            className="w-full flex items-center justify-between p-5 bg-slate-800/30 border border-slate-700/30 rounded-2xl hover:bg-slate-800/80 hover:border-violet-500/50 hover:shadow-lg transition-all"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-slate-700/30 rounded-xl flex items-center justify-center group-hover:bg-violet-600/20 transition-colors">
                                                    <ClockIcon className="w-5 h-5 text-slate-500 group-hover:text-violet-400" />
                                                </div>
                                                <span className="text-slate-300 font-medium group-hover:text-white transition-colors text-left">{topic}</span>
                                            </div>
                                            <ArrowLeftIcon className="w-5 h-5 text-slate-600 rotate-180 group-hover:text-violet-400 group-hover:translate-x-1 transition-all mr-10" />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onDeleteTopic(topic); }}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                                            title={t('pro.initiator.delete_tooltip')}
                                        >
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>


            <HelpModal
                isOpen={isHelpOpen}
                onClose={() => setIsHelpOpen(false)}
                title={t('pro.initiator.help_title')}
            >
                <div className="space-y-4 text-sm">
                    <p>
                        {t('pro.initiator.help_desc')}
                    </p>
                    <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
                        <strong className="text-violet-400 block mb-2">{t('pro.initiator.examples_title')}</strong>
                        <ul className="list-disc pl-5 space-y-1 text-slate-300">
                            <li>{t('pro.initiator.example_1')}</li>
                            <li>{t('pro.initiator.example_2')}</li>
                            <li>{t('pro.initiator.example_3')}</li>
                        </ul>
                    </div>
                    <p className="italic text-slate-500 mt-2">
                        {t('pro.initiator.help_footer')}
                    </p>
                </div>
            </HelpModal>
        </div>
    );
};

export default ProCaseInitiator;
