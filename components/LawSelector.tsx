
import React from 'react';
import { useTranslation } from 'react-i18next';
import { LawArea } from '../types';
import { GavelIcon, FamilyIcon, ScalesIcon, BuildingIcon, MagicWandIcon, BriefcaseIcon, HomeIcon, CoinsIcon, FlagIcon } from './Icons';
import HelpModal from './HelpModal';
import { InfoIcon } from './InfoIcon';
import { useState } from 'react';

interface LawSelectorProps {
  onSelect: (area: LawArea) => void;
  onAnalyzeClick: () => void;
  isLocalOnly: boolean;
  setIsLocalOnly: (val: boolean) => void;
  hasConsent?: boolean;
  onImport?: (file: File) => void;
}

// Options will be mapped inside component to access t() function

const LawSelector: React.FC<LawSelectorProps> = ({ onSelect, onAnalyzeClick, isLocalOnly, setIsLocalOnly, onImport, hasConsent = false }) => {
  const { t } = useTranslation();
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const lawOptions = [
    { area: LawArea.Criminal, name: t('law.areas.prawo karne'), icon: <GavelIcon />, description: t('law.areas.prawo karne_desc') },
    { area: LawArea.Family, name: t('law.areas.prawo rodzinne'), icon: <FamilyIcon />, description: t('law.areas.prawo rodzinne_desc') },
    { area: LawArea.Civil, name: t('law.areas.prawo cywilne'), icon: <ScalesIcon />, description: t('law.areas.prawo cywilne_desc') },
    { area: LawArea.Commercial, name: t('law.areas.prawo handlowe'), icon: <BuildingIcon />, description: t('law.areas.prawo handlowe_desc') },
    { area: LawArea.Labor, name: t('law.areas.prawo pracy'), icon: <BriefcaseIcon />, description: t('law.areas.prawo pracy_desc') },
    { area: LawArea.RealEstate, name: t('law.areas.prawo nieruchomości'), icon: <HomeIcon />, description: t('law.areas.prawo nieruchomości_desc') },
    { area: LawArea.Tax, name: t('law.areas.prawo podatkowe'), icon: <CoinsIcon />, description: t('law.areas.prawo podatkowe_desc') },
    { area: LawArea.Administrative, name: t('law.areas.prawo administracyjne'), icon: <FlagIcon />, description: t('law.areas.prawo administracyjne_desc') },
  ];

  return (
    <div className="flex flex-col items-center min-h-full p-4 w-full">
      <div className="text-center mb-10 flex items-center justify-center gap-2 my-auto md:mt-0 pt-8 md:pt-0">
        <p className="text-lg text-slate-400">{t('law.header')}</p>
        <InfoIcon onClick={() => setIsHelpOpen(true)} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 w-full max-w-6xl mb-8">
        {lawOptions.map((option) => (
          <button
            key={option.area}
            onClick={() => onSelect(option.area)}
            className="group bg-slate-800/50 border border-slate-700 rounded-lg p-3 md:p-6 text-left hover:bg-slate-700/70 hover:border-cyan-500 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <div className="w-8 h-8 md:w-12 md:h-12 bg-slate-700/50 rounded-lg flex items-center justify-center mb-2 md:mb-4 group-hover:bg-cyan-600/30 transition-colors">
              {option.icon}
            </div>
            <h2 className="text-sm md:text-xl font-semibold text-white mb-0.5 md:mb-1 leading-tight">{option.name}</h2>
            <p className="text-xs md:text-base text-slate-400 line-clamp-2">{option.description}</p>
          </button>
        ))}
      </div>

      <div className="w-full max-w-6xl mb-8">
        <button
          onClick={onAnalyzeClick}
          className="w-full group bg-gradient-to-r from-violet-600/20 to-indigo-600/20 border border-violet-500/30 rounded-lg p-6 flex items-center gap-6 hover:bg-violet-600/30 hover:border-violet-500 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          <div className="w-16 h-16 bg-violet-600/30 rounded-xl flex items-center justify-center group-hover:bg-violet-500/50 transition-colors shadow-lg shadow-violet-900/50">
            <MagicWandIcon className="w-8 h-8 text-white" />
          </div>
          <div className="text-left flex-1">
            <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
              {t('law.analyzeMyCase')}
              <span className="bg-violet-600 text-white text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">AI</span>
            </h2>
            <p className="text-slate-300">{t('law.analyzeDesc')}</p>
          </div>
        </button>
      </div>

      {onImport && (
        <div className="w-full max-w-6xl mb-8">
          <input
            type="file"
            id="main-json-import"
            className="hidden"
            accept=".json"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                onImport(file);
                e.target.value = '';
              }
            }}
          />
          <button
            onClick={() => document.getElementById('main-json-import')?.click()}
            className="w-full group bg-slate-800/40 border border-slate-700 rounded-lg p-4 flex items-center justify-center gap-3 hover:bg-slate-700/60 hover:border-cyan-500 transition-all duration-300"
          >
            <MagicWandIcon className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
            <span className="text-slate-200 font-medium">{t('law.importJson')}</span>
          </button>
        </div>
      )}

      <div className="w-full max-w-6xl p-6 bg-slate-800/40 rounded-xl border border-slate-700/50 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-1">{t('law.localMode.title')}</h3>
            <p className="text-sm text-slate-400">
              {t('law.localMode.desc')}
              <span className="block mt-1 text-xs text-slate-500 italic">
                {t('law.localMode.note')}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-3 bg-slate-700/50 px-4 py-2 rounded-lg">
            <span className={`text-sm font-medium ${isLocalOnly ? 'text-cyan-400' : 'text-slate-400'}`}>
              {isLocalOnly ? t('law.localMode.on') : t('law.localMode.off')}
            </span>
            <button
              onClick={() => hasConsent && setIsLocalOnly(!isLocalOnly)}
              disabled={!hasConsent}
              className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${!hasConsent ? 'opacity-50 cursor-not-allowed bg-cyan-600' : (isLocalOnly ? 'bg-cyan-600' : 'bg-slate-600')}`}
              title={!hasConsent ? t('law.localMode.tooltip') : ""}
            >
              <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${isLocalOnly ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>
      </div>

      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        title={t('law.header')}
      >
        <div className="space-y-4">
          <p>
            {t('law_help.intro')}
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>{t('law_help.manual_title')}</strong> {t('law_help.manual_desc')}
              <em> {t('law_help.manual_civ')}</em>. {t('law_help.manual_fam_pre')} <em> {t('law_help.manual_fam')}</em>.
            </li>
            <li>
              <strong>{t('law_help.ai_title')}</strong> {t('law_help.ai_desc')}
            </li>
          </ul>
        </div>
      </HelpModal>
    </div>
  );
};

export default LawSelector;
