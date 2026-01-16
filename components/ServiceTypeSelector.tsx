import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BriefcaseIcon, SparklesIcon, ChevronRightIcon } from './Icons';
import { LawArea } from '../types';
import { InfoIcon } from './InfoIcon';
import HelpModal from './HelpModal';

interface ServiceTypeSelectorProps {
    lawArea: LawArea;
    onSelect: (type: 'pro' | 'hub') => void;
}

const ServiceTypeSelector: React.FC<ServiceTypeSelectorProps> = ({ lawArea, onSelect }) => {
    const { t } = useTranslation();
    const [isHelpOpen, setIsHelpOpen] = useState(false);

    // Try to translate the law area, fallback to original value if no key match (or if simple string)
    // Assuming lawArea enum values match the keys in 'law.areas' when lowercased
    const translatedLawArea = t(`law.areas.${lawArea.toLowerCase()}`, { defaultValue: lawArea });

    return (
        <div className="flex flex-col items-center min-h-full p-4 w-full animate-in fade-in duration-500">
            <div className="text-center mb-10 flex flex-col items-center justify-center gap-2 mt-4 md:mt-0 pt-8 md:pt-0">
                <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold text-white mb-2">{t('service.header')}</h1>
                    <InfoIcon onClick={() => setIsHelpOpen(true)} className="mb-2" />
                </div>
                <p className="text-lg text-slate-400">
                    {t('service.description', { lawArea: translatedLawArea })}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl px-4">
                {/* PRO Path */}
                <button
                    onClick={() => onSelect('pro')}
                    className="group bg-slate-800/50 border border-slate-700 rounded-lg p-6 text-left hover:bg-slate-700/70 hover:border-violet-500 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-violet-500 relative overflow-hidden"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-slate-700/50 rounded-lg flex items-center justify-center group-hover:bg-violet-600/30 transition-colors">
                            <BriefcaseIcon className="h-6 w-6 text-violet-400" />
                        </div>
                        <span className="px-2 py-0.5 bg-violet-600/20 border border-violet-500/30 rounded-full text-[10px] font-bold text-violet-300 uppercase tracking-wider">
                            {t('service.pro.recommended')}
                        </span>
                    </div>

                    <h2 className="text-xl font-semibold text-white mb-2 group-hover:text-violet-300 transition-colors">{t('service.pro.title')}</h2>
                    <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                        {t('service.pro.desc')}
                    </p>

                    <div className="flex items-center gap-2 text-violet-400 text-xs font-bold uppercase tracking-widest group-hover:translate-x-1 transition-transform">
                        <span>{t('service.pro.action')}</span>
                        <ChevronRightIcon className="w-4 h-4" />
                    </div>
                </button>

                {/* Standard Tools Path */}
                <button
                    onClick={() => onSelect('hub')}
                    className="group bg-slate-800/50 border border-slate-700 rounded-lg p-6 text-left hover:bg-slate-700/70 hover:border-cyan-500 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                    <div className="w-12 h-12 bg-slate-700/50 rounded-lg flex items-center justify-center mb-4 group-hover:bg-cyan-600/30 transition-colors">
                        <SparklesIcon className="h-6 w-6 text-cyan-400" />
                    </div>

                    <h2 className="text-xl font-semibold text-white mb-2 group-hover:text-cyan-300 transition-colors">{t('service.hub.title')}</h2>
                    <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                        {t('service.hub.desc')}
                    </p>

                    <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-widest group-hover:translate-x-1 transition-transform">
                        <span>{t('service.hub.action')}</span>
                        <ChevronRightIcon className="w-4 h-4" />
                    </div>
                </button>
            </div>

            <div className="mt-12 text-slate-500 text-[10px] uppercase tracking-[0.2em] font-medium text-center">
                {/* Use dangerouslySetInnerHTML or just standard text interpretation if &bull; is needed, but t() handles it */}
                {t('service.footer')}
            </div>

            <HelpModal
                isOpen={isHelpOpen}
                onClose={() => setIsHelpOpen(false)}
                title={t('service.help.title')}
            >
                <div className="space-y-4">
                    <p>
                        {t('service.help.intro')}
                    </p>
                    <div className="space-y-2">
                        <h4 className="font-semibold text-violet-400">{t('service.help.proTitle')}</h4>
                        <p className="text-sm text-slate-400">
                            {t('service.help.proDesc')}
                        </p>
                    </div>
                    <div className="space-y-2">
                        <h4 className="font-semibold text-cyan-400">{t('service.help.hubTitle')}</h4>
                        <p className="text-sm text-slate-400">
                            {t('service.help.hubDesc')}
                        </p>
                    </div>
                </div>
            </HelpModal>
        </div>
    );
};

export default ServiceTypeSelector;
