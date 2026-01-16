import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDownIcon, ChevronUpIcon, BriefcaseIcon, SparklesIcon } from './Icons';
import Timeline from './Timeline';
import DocumentManager from './DocumentManager';
import ChecklistManager from './ChecklistManager';
import NotesWidget from './NotesWidget';
import HelpModal from './HelpModal';
import { InfoIcon } from './InfoIcon';

interface CaseDashboardProps {
    userId: string;
    caseId: string;
    initialExpanded?: boolean;
    onChangeMode?: () => void;
}

export interface CaseDashboardRef {
    toggleExpansion: () => void;
    setExpanded: (expanded: boolean) => void;
}

const CaseDashboard = React.forwardRef<CaseDashboardRef, CaseDashboardProps>(({ userId, caseId, initialExpanded = false, onChangeMode }, ref) => {
    const { t } = useTranslation();
    const [isExpanded, setIsExpanded] = useState(initialExpanded);
    const [isHelpOpen, setIsHelpOpen] = useState(false);

    React.useImperativeHandle(ref, () => ({
        toggleExpansion: () => setIsExpanded(prev => !prev),
        setExpanded: (expanded: boolean) => setIsExpanded(expanded)
    }));

    return (
        <div className="rounded-xl border border-slate-700 bg-slate-800/60 overflow-hidden shadow-lg transition-all duration-300">
            <div
                className="w-full flex items-center justify-center p-0 bg-slate-800 hover:bg-slate-700/80 transition-colors relative"
            >
                <div
                    className="flex-1 flex items-center justify-between p-3 md:p-4 cursor-pointer"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <div className="flex items-center gap-3">
                        <div className="p-1.5 md:p-2 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-lg border border-cyan-500/20">
                            <BriefcaseIcon className="w-4 h-4 md:w-5 md:h-5 text-cyan-400" />
                        </div>
                        <div className="text-left">
                            <h3 className="font-semibold text-slate-200 text-sm md:text-base">{t('dashboard.panel_title')}</h3>
                            <p className="text-[10px] md:text-xs text-slate-400">
                                {isExpanded ? t('dashboard.click_collapse') : t('dashboard.subtitle_collapsed')}
                            </p>
                        </div>
                    </div>
                    <div className={`transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                        <ChevronDownIcon className="w-4 h-4 md:w-5 md:h-5 text-slate-400" />
                    </div>
                </div>
                <div className="absolute right-12 md:right-20 top-1/2 -translate-y-1/2 z-10">
                    <InfoIcon onClick={() => setIsHelpOpen(true)} />
                </div>
            </div>

            {isExpanded && (
                <div className="p-4 border-t border-slate-700/50 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <Timeline userId={userId} caseId={caseId} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <DocumentManager userId={userId} caseId={caseId} />
                        <div className="space-y-4">
                            <ChecklistManager userId={userId} caseId={caseId} />
                            <div className="h-80">
                                <NotesWidget userId={userId} chatId={caseId} />
                            </div>
                            {onChangeMode && (
                                <button
                                    onClick={onChangeMode}
                                    className="w-full flex items-center justify-between p-4 bg-slate-800/80 border border-slate-700 rounded-xl hover:bg-slate-700 hover:border-cyan-500/50 transition-all group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-cyan-600/20 rounded-lg text-cyan-400 group-hover:bg-cyan-600/30 transition-colors">
                                            <SparklesIcon className="h-5 w-5" />
                                        </div>
                                        <div className="text-left">
                                            <span className="block text-sm font-semibold text-slate-200">{t('dashboard.change_mode')}</span>
                                            <span className="block text-[10px] text-slate-400 uppercase tracking-wider">{t('dashboard.mode_desc')}</span>
                                        </div>
                                    </div>
                                    <ChevronUpIcon className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors rotate-90" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <HelpModal
                isOpen={isHelpOpen}
                onClose={() => setIsHelpOpen(false)}
                title={t('dashboard.panel_title')}
            >
                <div className="space-y-4">
                    <p>
                        {t('dashboard.help_intro')}
                    </p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>
                            <strong>{t('dashboard.help_timeline')}</strong> {t('dashboard.help_timeline_desc')}
                        </li>
                        <li>
                            <strong>{t('dashboard.help_docs')}</strong> {t('dashboard.help_docs_desc')}
                        </li>
                        <li>
                            <strong>{t('dashboard.help_checklist')}</strong> {t('dashboard.help_checklist_desc')}
                        </li>
                        <li>
                            <strong>{t('dashboard.help_notes')}</strong> {t('dashboard.help_notes_desc')}
                        </li>
                    </ul>
                </div>
            </HelpModal>
        </div>
    );
});

export default CaseDashboard;
