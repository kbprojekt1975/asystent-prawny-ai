import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SparklesIcon, DocumentTextIcon, BookOpenIcon, ChevronDownIcon, BriefcaseIcon } from './Icons';

interface AppGuideProps {
    onClose?: () => void;
    showStartButton?: boolean;
}

const AppGuide: React.FC<AppGuideProps> = ({ onClose, showStartButton = true }) => {
    const { t } = useTranslation();
    const [expandedSection, setExpandedSection] = useState<string | null>('analysis');

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="text-center space-y-2 mb-8">
                <h4 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                    {t('guide.title')}
                </h4>
                <p className="text-sm text-slate-400 px-8 leading-relaxed">
                    {t('guide.subtitle')}
                </p>
            </div>

            <div className="space-y-4">
                {/* Section 1 */}
                <div className={`group border border-slate-700/50 rounded-2xl transition-all duration-300 ${expandedSection === 'analysis' ? 'bg-slate-900/40 border-cyan-500/30 ring-1 ring-cyan-500/20' : 'bg-slate-900/20 hover:bg-slate-900/40'}`}>
                    <button
                        onClick={() => setExpandedSection(expandedSection === 'analysis' ? null : 'analysis')}
                        className="w-full flex items-center gap-4 p-4 text-left"
                    >
                        <div className={`p-3 rounded-xl transition-colors ${expandedSection === 'analysis' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-400 group-hover:text-cyan-400 group-hover:bg-slate-800'}`}>
                            <SparklesIcon className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                            <h5 className="font-bold text-slate-100 italic">{t('guide.analysis.title')}</h5>
                            <p className="text-xs text-slate-400">{t('guide.analysis.subtitle')}</p>
                        </div>
                        <ChevronDownIcon className={`w-5 h-5 text-slate-500 transition-transform duration-300 ${expandedSection === 'analysis' ? 'rotate-180 text-cyan-400' : ''}`} />
                    </button>
                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${expandedSection === 'analysis' ? 'max-h-48' : 'max-h-0'}`}>
                        <div className="p-4 pt-0 border-t border-slate-700/30 mt-2">
                            <p className="text-sm text-slate-300 leading-relaxed">
                                {t('guide.analysis.desc')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Section 2 */}
                <div className={`group border border-slate-700/50 rounded-2xl transition-all duration-300 ${expandedSection === 'generator' ? 'bg-slate-900/40 border-cyan-500/30 ring-1 ring-cyan-500/20' : 'bg-slate-900/20 hover:bg-slate-900/40'}`}>
                    <button
                        onClick={() => setExpandedSection(expandedSection === 'generator' ? null : 'generator')}
                        className="w-full flex items-center gap-4 p-4 text-left"
                    >
                        <div className={`p-3 rounded-xl transition-colors ${expandedSection === 'generator' ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-800 text-slate-400 group-hover:text-purple-400'}`}>
                            <DocumentTextIcon className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                            <h5 className="font-bold text-slate-100 italic">{t('guide.generator.title')}</h5>
                            <p className="text-xs text-slate-400">{t('guide.generator.subtitle')}</p>
                        </div>
                        <ChevronDownIcon className={`w-5 h-5 text-slate-500 transition-transform duration-300 ${expandedSection === 'generator' ? 'rotate-180 text-purple-400' : ''}`} />
                    </button>
                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${expandedSection === 'generator' ? 'max-h-48' : 'max-h-0'}`}>
                        <div className="p-4 pt-0 border-t border-slate-700/30 mt-2">
                            <p className="text-sm text-slate-300 leading-relaxed">
                                {t('guide.generator.desc')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Section 3 */}
                <div className={`group border border-slate-700/50 rounded-2xl transition-all duration-300 ${expandedSection === 'knowledge' ? 'bg-slate-900/40 border-cyan-500/30 ring-1 ring-cyan-500/20' : 'bg-slate-900/20 hover:bg-slate-900/40'}`}>
                    <button
                        onClick={() => setExpandedSection(expandedSection === 'knowledge' ? null : 'knowledge')}
                        className="w-full flex items-center gap-4 p-4 text-left"
                    >
                        <div className={`p-3 rounded-xl transition-colors ${expandedSection === 'knowledge' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400 group-hover:text-emerald-400'}`}>
                            <BookOpenIcon className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                            <h5 className="font-bold text-slate-100 italic">{t('guide.knowledge.title')}</h5>
                            <p className="text-xs text-slate-400">{t('guide.knowledge.subtitle')}</p>
                        </div>
                        <ChevronDownIcon className={`w-5 h-5 text-slate-500 transition-transform duration-300 ${expandedSection === 'knowledge' ? 'rotate-180 text-emerald-400' : ''}`} />
                    </button>
                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${expandedSection === 'knowledge' ? 'max-h-48' : 'max-h-0'}`}>
                        <div className="p-4 pt-0 border-t border-slate-700/30 mt-2">
                            <p className="text-sm text-slate-300 leading-relaxed">
                                {t('guide.knowledge.desc')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Section 4 */}
                <div className={`group border border-slate-700/50 rounded-2xl transition-all duration-300 ${expandedSection === 'pro' ? 'bg-slate-900/40 border-cyan-500/30 ring-1 ring-cyan-500/20' : 'bg-slate-900/20 hover:bg-slate-900/40'}`}>
                    <button
                        onClick={() => setExpandedSection(expandedSection === 'pro' ? null : 'pro')}
                        className="w-full flex items-center gap-4 p-4 text-left"
                    >
                        <div className={`p-3 rounded-xl transition-colors ${expandedSection === 'pro' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-400 group-hover:text-amber-400'}`}>
                            <BriefcaseIcon className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                            <h5 className="font-bold text-slate-100 italic">{t('guide.pro.title')} <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded ml-1 not-italic">{t('guide.pro.new')}</span></h5>
                            <p className="text-xs text-slate-400">{t('guide.pro.subtitle')}</p>
                        </div>
                        <ChevronDownIcon className={`w-5 h-5 text-slate-500 transition-transform duration-300 ${expandedSection === 'pro' ? 'rotate-180 text-amber-400' : ''}`} />
                    </button>
                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${expandedSection === 'pro' ? 'max-h-48' : 'max-h-0'}`}>
                        <div className="p-4 pt-0 border-t border-slate-700/30 mt-2">
                            <p className="text-sm text-slate-300 leading-relaxed">
                                {t('guide.pro.desc')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Section 5 (Moje Studio AI) */}
                <div className={`group border border-slate-700/50 rounded-2xl transition-all duration-300 ${expandedSection === 'studio' ? 'bg-slate-900/40 border-cyan-500/30 ring-1 ring-cyan-500/20' : 'bg-slate-900/20 hover:bg-slate-900/40'}`}>
                    <button
                        onClick={() => setExpandedSection(expandedSection === 'studio' ? null : 'studio')}
                        className="w-full flex items-center gap-4 p-4 text-left"
                    >
                        <div className={`p-3 rounded-xl transition-colors ${expandedSection === 'studio' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-400 group-hover:text-cyan-400'}`}>
                            <SparklesIcon className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                            <h5 className="font-bold text-slate-100 italic">{t('guide.studio.title')} <span className="text-[10px] bg-cyan-500/20 text-cyan-400 px-1.5 py-0.5 rounded ml-1 not-italic">{t('guide.studio.new')}</span></h5>
                            <p className="text-xs text-slate-400">{t('guide.studio.subtitle')}</p>
                        </div>
                        <ChevronDownIcon className={`w-5 h-5 text-slate-500 transition-transform duration-300 ${expandedSection === 'studio' ? 'rotate-180 text-cyan-400' : ''}`} />
                    </button>
                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${expandedSection === 'studio' ? 'max-h-48' : 'max-h-0'}`}>
                        <div className="p-4 pt-0 border-t border-slate-700/30 mt-2">
                            <p className="text-sm text-slate-300 leading-relaxed">
                                {t('guide.studio.desc')}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {showStartButton && (
                <div className="mt-8 p-6 bg-slate-900/60 rounded-3xl border border-slate-700/50 text-center space-y-4">
                    <h5 className="text-lg font-bold text-white">{t('guide.ready.title')}</h5>
                    <p className="text-sm text-slate-400 px-4">
                        {t('guide.ready.text')}
                    </p>
                    <button
                        onClick={onClose}
                        className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-4 rounded-2xl shadow-xl shadow-cyan-900/20 transition-all active:scale-95 transform translate-y-0"
                    >
                        {t('guide.ready.button')}
                    </button>
                </div>
            )}
        </div>
    );
};

export default AppGuide;
