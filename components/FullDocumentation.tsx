import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
    DocumentTextIcon, 
    BookOpenIcon, 
    BrainIcon, 
    BriefcaseIcon, 
    ScaleIcon, 
    ShieldCheckIcon,
    ClockIcon,
    CheckIcon,
    PaperClipIcon,
    PencilIcon,
    MegaphoneIcon,
    UserGroupIcon,
    SparklesIcon as LightningIcon
} from './Icons';

const FullDocumentation: React.FC = () => {
    const { t } = useTranslation();

    const sections = [
        {
            id: 'andromeda',
            icon: <LightningIcon className="w-6 h-6 text-cyan-400" />,
            title: t('documentation.andromeda.title'),
            desc: t('documentation.andromeda.desc'),
            features: [
                t('documentation.andromeda.feature1'),
                t('documentation.andromeda.feature2'),
                t('documentation.andromeda.feature3')
            ],
            caseStudy: t('documentation.andromeda.caseStudy')
        },
        {
            id: 'studio',
            icon: <LightningIcon className="w-6 h-6 text-amber-400" />,
            title: t('documentation.studio.title'),
            desc: t('documentation.studio.desc'),
            features: [
                t('documentation.studio.feature1'),
                t('documentation.studio.feature2'),
                t('documentation.studio.feature3')
            ],
            caseStudy: t('documentation.studio.caseStudy')
        },
        {
            id: 'deepThinking',
            icon: <BrainIcon className="w-6 h-6 text-purple-400" />,
            title: t('documentation.deepThinking.title'),
            desc: t('documentation.deepThinking.desc'),
            features: [
                t('documentation.deepThinking.feature1'),
                t('documentation.deepThinking.feature2'),
                t('documentation.deepThinking.feature3')
            ],
            caseStudy: t('documentation.deepThinking.caseStudy')
        },
        {
            id: 'caseTools',
            icon: <BriefcaseIcon className="w-6 h-6 text-blue-400" />,
            title: t('documentation.caseTools.title'),
            desc: t('documentation.caseTools.desc'),
            subsections: [
                { icon: <ClockIcon className="w-4 h-4" />, text: t('documentation.caseTools.timeline') },
                { icon: <CheckIcon className="w-4 h-4" />, text: t('documentation.caseTools.checklist') },
                { icon: <PaperClipIcon className="w-4 h-4" />, text: t('documentation.caseTools.repository') },
                { icon: <PencilIcon className="w-4 h-4" />, text: t('documentation.caseTools.notes') }
            ],
            caseStudy: t('documentation.caseTools.caseStudy')
        },
        {
            id: 'modes',
            icon: <ScaleIcon className="w-6 h-6 text-emerald-400" />,
            title: t('documentation.modes.title'),
            subsections: [
                { icon: <MegaphoneIcon className="w-4 h-4" />, text: t('documentation.modes.advice') },
                { icon: <PencilIcon className="w-4 h-4" />, text: t('documentation.modes.document') },
                { icon: <UserGroupIcon className="w-4 h-4" />, text: t('documentation.modes.court') },
                { icon: <UserGroupIcon className="w-4 h-4" />, text: t('documentation.modes.negotiation') }
            ],
            caseStudy: t('documentation.modes.caseStudy')
        },
        {
            id: 'privacy',
            icon: <ShieldCheckIcon className="w-6 h-6 text-rose-400" />,
            title: t('documentation.privacy.title'),
            desc: t('documentation.privacy.desc'),
            features: [
                t('documentation.privacy.local'),
                t('documentation.privacy.cloud')
            ],
            caseStudy: t('documentation.privacy.caseStudy')
        }
    ];

    return (
        <div className="space-y-8 py-2 px-2 max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 pb-8">
                {sections.map((section) => (
                    <div 
                        key={section.id}
                        className="bg-slate-900/40 backdrop-blur-md border border-slate-700/40 rounded-3xl p-6 hover:bg-slate-800/60 transition-all duration-300 group shadow-lg flex flex-col h-full"
                    >
                        <div className="flex items-start gap-4 mb-4">
                            <div className="p-3 bg-slate-800/50 rounded-2xl group-hover:scale-105 transition-transform border border-slate-700/30">
                                {section.icon}
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white mb-1 tracking-tight">
                                    {section.title}
                                </h3>
                                {section.desc && (
                                    <p className="text-sm text-slate-400 leading-relaxed font-medium">
                                        {section.desc}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex-1">
                            {section.features && (
                                <ul className="space-y-3 mt-4">
                                    {section.features.map((feature, idx) => (
                                        <li key={idx} className="flex gap-3 text-sm text-slate-300 items-center">
                                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 shrink-0 shadow-[0_0_10px_rgba(6,182,212,0.6)]" />
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}

                            {section.subsections && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                                    {section.subsections.map((sub, idx) => (
                                        <div key={idx} className="flex items-center gap-3 p-3 bg-slate-950/40 rounded-xl border border-slate-700/20 hover:border-slate-600/50 transition-colors">
                                            <div className="text-slate-400">
                                                {sub.icon}
                                            </div>
                                            <span className="text-[11px] text-slate-300 font-bold uppercase tracking-wider">{sub.text}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {section.caseStudy && (
                                <div className="mt-6 p-4 bg-cyan-500/5 rounded-2xl border border-cyan-500/20 relative overflow-hidden group/case">
                                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover/case:opacity-20 transition-opacity">
                                        <LightningIcon className="w-8 h-8 text-cyan-400" />
                                    </div>
                                    <div className="flex gap-3">
                                        <div className="shrink-0 mt-1">
                                            <div className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30">
                                                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400/80 block">
                                                {t('documentation.caseStudyLabel')}
                                            </span>
                                            <p className="text-xs text-slate-400 leading-relaxed font-medium">
                                                {section.caseStudy}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <footer className="mt-8 p-10 bg-gradient-to-br from-cyan-950/30 to-blue-950/30 rounded-[2.5rem] border border-cyan-500/20 text-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <p className="text-cyan-100 font-bold text-lg relative z-10">
                    {t('documentation.footerTitle')}
                </p>
                <p className="text-slate-400 text-sm mt-1 relative z-10">
                    {t('documentation.footerDesc')}
                </p>
            </footer>
        </div>
    );
};

export default FullDocumentation;
