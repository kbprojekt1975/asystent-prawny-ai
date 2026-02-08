import React from 'react';
import { useTranslation } from 'react-i18next';
import { LawArea, FeatureFlags } from '../types';
import { GavelIcon, FamilyIcon, ScalesIcon, BuildingIcon, MagicWandIcon, BriefcaseIcon, HomeIcon, CoinsIcon, FlagIcon, TrashIcon, XIcon, PencilIcon } from './Icons';
import HelpModal from './HelpModal';
import { InfoIcon } from './InfoIcon';
import { useState } from 'react';

interface LawSelectorProps {
  onSelect: (area: LawArea) => void;
  onAnalyzeClick: () => void;
  isLocalOnly: boolean;
  setIsLocalOnly: (val: boolean) => void;
  features: FeatureFlags;
  hasConsent?: boolean;
  onImport?: (file: File) => void;
  isPro?: boolean;
  customAgents?: any[];
  onCustomAgentSelect: (agent: any) => void;
  onDeleteCustomAgent: (agent: any) => void;
  onEditCustomAgent: (agent: any) => void;
  onCreateCustomAgent: (type: 'standalone' | 'overlay') => void;
  onDeactivateAgent: () => void;
  activeAgent?: any;
}

// Options will be mapped inside component to access t() function

const LawSelector: React.FC<LawSelectorProps> = ({
  onSelect,
  onAnalyzeClick,
  isLocalOnly,
  setIsLocalOnly,
  onImport,
  hasConsent = false,
  isPro = false,
  customAgents = [],
  onCustomAgentSelect,
  onDeleteCustomAgent,
  onEditCustomAgent,
  onCreateCustomAgent,
  onDeactivateAgent,
  activeAgent,
  features
}) => {
  const { t } = useTranslation();
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isAgentHelpOpen, setIsAgentHelpOpen] = useState(false);
  const topRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (activeAgent && topRef.current) {
      topRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeAgent]);

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

  const customAgentOption = {
    area: LawArea.Custom,
    name: "MOI AGENCI",
    icon: <MagicWandIcon className="text-cyan-400" />,
    description: "Stwórz własnego asystenta z dowolną osobowością."
  };

  return (
    <div ref={topRef} className="flex flex-col items-center min-h-full p-4 w-full">
      <div className="text-center mb-10 flex flex-col items-center justify-center gap-2 my-auto md:mt-0 pt-8 md:pt-0">
        {activeAgent && (
          <div className="mb-4 px-4 py-2 bg-violet-500/20 border border-violet-500/30 rounded-full flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="w-6 h-6 bg-violet-500 rounded-full flex items-center justify-center text-[10px] font-black text-white uppercase">
              {activeAgent.name.substring(0, 1)}
            </div>
            <span className="text-sm font-bold text-violet-300">AKTYWNY AGENT: {activeAgent.name.toUpperCase()}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeactivateAgent();
              }}
              className="ml-1 p-0.5 hover:bg-violet-500/30 rounded-full transition-colors group"
              title="Włącz standardowego asystenta"
            >
              <XIcon className="w-4 h-4 text-violet-400 group-hover:text-white" />
            </button>
          </div>
        )}
        <div className="flex items-center gap-2">
          <p className="text-lg text-theme-text-secondary">
            {activeAgent ? `Wybierz kategorię dla agenta ${activeAgent.name}` : t('law.header')}
          </p>
          <InfoIcon onClick={() => setIsHelpOpen(true)} />
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6 w-full max-w-6xl mb-8">
        {lawOptions.map((option) => (
          <button
            key={option.area}
            onClick={() => onSelect(option.area)}
            className="group bg-theme-bg-darker border border-theme-border-default rounded-lg p-3 md:p-6 text-left hover:bg-theme-bg-light hover:border-theme-primary transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-theme-primary"
          >
            <div className="w-8 h-8 md:w-12 md:h-12 bg-theme-bg-light rounded-lg flex items-center justify-center mb-2 md:mb-4 group-hover:bg-theme-primary/30 transition-colors">
              {option.icon}
            </div>
            <h2 className="text-sm md:text-xl font-semibold text-white mb-0.5 md:mb-1 leading-tight">{option.name}</h2>
            <p className="text-xs md:text-base text-theme-text-secondary line-clamp-2">{option.description}</p>
          </button>
        ))}
      </div>

      {/* CUSTOM AGENTS SECTION */}
      <div className={`w-full max-w-6xl border-t border-theme-border-default pt-8 mt-4 mb-8 relative ${!features.enable_studio ? 'opacity-75 pointer-events-none select-none grayscale' : ''}`}>
        {!features.enable_studio && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-[2px] rounded-lg border border-yellow-500/30">
            <div className="bg-slate-900 border border-yellow-500/50 text-yellow-500 px-6 py-3 rounded-full font-bold shadow-2xl flex items-center gap-3 transform -rotate-3 scale-110">
              <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse" />
              PRACE SERWISOWE
              <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse" />
            </div>
          </div>
        )}

        <h3 className="text-xs font-bold text-theme-text-muted uppercase tracking-[0.2em] mb-6 text-center">Sekcja Personalizacji</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
          {/* AI Studio Tile */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => features.enable_studio && onSelect(LawArea.Custom)}
            className="cursor-pointer group relative overflow-hidden bg-theme-bg-dark border-2 border-dashed border-violet-500/30 hover:border-violet-500 hover:bg-theme-bg-darker rounded-lg p-3 md:p-6 text-left transition-all duration-300"
          >
            <div className="absolute top-2 right-2 md:top-4 md:right-4 z-20">
              <InfoIcon
                onClick={(e) => {
                  e.stopPropagation();
                  setIsAgentHelpOpen(true);
                }}
                className="w-8 h-8 md:w-12 md:h-12 text-violet-400 hover:text-white bg-slate-800/90 border border-violet-500/20 rounded-full shadow-2xl flex items-center justify-center p-1.5 md:p-2"
              />
            </div>

            <div className="w-8 h-8 md:w-12 md:h-12 bg-violet-500/10 rounded-lg flex items-center justify-center mb-2 md:mb-4 group-hover:scale-110 transition-transform">
              <MagicWandIcon className="w-5 h-5 md:w-6 md:h-6 text-violet-400" />
            </div>
            <h2 className="text-sm md:text-xl font-semibold text-white mb-0.5 md:mb-1 leading-tight uppercase">Moje Studio AI</h2>
            <p className="text-xs md:text-base text-theme-text-secondary line-clamp-2">Zarządzaj i twórz własnych asystentów ({customAgents.length})</p>
          </div>
        </div>
      </div>

      <div className="w-full max-w-6xl mb-8 relative">
        <button
          onClick={onAnalyzeClick}
          className="w-full group bg-gradient-to-r from-violet-600/20 to-indigo-600/20 border border-violet-500/30 rounded-lg p-6 flex items-center gap-6 hover:bg-violet-600/30 hover:border-violet-500 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:cursor-not-allowed"
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

      {
        onImport && (
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
                className="w-full group bg-theme-bg-darker border border-theme-border-default rounded-lg p-4 flex items-center justify-center gap-3 hover:bg-theme-bg-light hover:border-theme-primary transition-all duration-300"
              >
                <MagicWandIcon className="w-5 h-5 text-theme-primary group-hover:scale-110 transition-transform" />
                <span className="text-theme-text-primary font-medium">{t('law.importJson')}</span>
              </button>
          </div>
        )
      }

      <div className="w-full max-w-6xl p-6 bg-theme-bg-darker rounded-xl border border-theme-border-default backdrop-blur-sm">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-1">{t('law.localMode.title')}</h3>
            <p className="text-sm text-theme-text-secondary">
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
            <li>
              <strong>{t('law_help.studio_title')}</strong> {t('law_help.studio_desc')}
            </li>
          </ul>
        </div>
      </HelpModal>

      <HelpModal
        isOpen={isAgentHelpOpen}
        onClose={() => setIsAgentHelpOpen(false)}
        title={t('customAgent.help.title')}
      >
        <div className="space-y-4">
          <p className="text-slate-300 leading-relaxed">
            {t('customAgent.help.intro')}
          </p>
          <div className="space-y-3 bg-slate-800/50 p-4 rounded-xl border border-slate-700">
            <div className="flex gap-3">
              <div className="mt-1 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <p className="text-sm text-slate-300">
                {t('customAgent.help.point1').split('**').map((part, i) => i % 2 === 1 ? <strong key={i} className="text-cyan-400">{part}</strong> : part)}
              </p>
            </div>
            <div className="flex gap-3">
              <div className="mt-1 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <p className="text-sm text-slate-300">
                {t('customAgent.help.point2').split('**').map((part, i) => i % 2 === 1 ? <strong key={i} className="text-cyan-400">{part}</strong> : part)}
              </p>
            </div>
            <div className="flex gap-3">
              <div className="mt-1 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <p className="text-sm text-slate-300">
                {t('customAgent.help.point3').split('**').map((part, i) => i % 2 === 1 ? <strong key={i} className="text-cyan-400">{part}</strong> : part)}
              </p>
            </div>
            <div className="flex gap-3">
              <div className="mt-1 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <p className="text-sm text-slate-300">
                {t('customAgent.help.point4').split('**').map((part, i) => i % 2 === 1 ? <strong key={i} className="text-cyan-400">{part}</strong> : part)}
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-500 italic">
            * Pamiętaj: Twoje instrukcje są kluczem do jakości porady. Bądź precyzyjny!
          </p>
        </div>
      </HelpModal>
    </div >
  );
};

export default LawSelector;
