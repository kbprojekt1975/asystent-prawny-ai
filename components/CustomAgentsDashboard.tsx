import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MagicWandIcon, PencilIcon, TrashIcon } from './Icons';
import { InfoIcon } from './InfoIcon';
import HelpModal from './HelpModal';

interface CustomAgentsDashboardProps {
    customAgents: any[];
    onCustomAgentSelect: (agent: any) => void;
    onDeleteCustomAgent: (agent: any) => void;
    onEditCustomAgent: (agent: any) => void;
    onCreateCustomAgent: (type: 'standalone' | 'overlay') => void;
    isPro?: boolean;
    onBack: () => void;
}

const CustomAgentsDashboard: React.FC<CustomAgentsDashboardProps> = ({
    customAgents,
    onCustomAgentSelect,
    onDeleteCustomAgent,
    onEditCustomAgent,
    onCreateCustomAgent,
    isPro = false,
    onBack
}) => {
    const { t } = useTranslation();
    const [isAgentHelpOpen, setIsAgentHelpOpen] = useState(false);

    return (
        <div className="flex flex-col items-center min-h-full p-4 w-full animate-fade-in">
            <div className="w-full max-w-6xl mb-8 flex flex-col items-center">
                <div className="flex items-center gap-2 mb-2">
                    <h2 className="text-2xl font-bold text-white uppercase tracking-wider">Moje Studio AI</h2>
                    <InfoIcon onClick={() => setIsAgentHelpOpen(true)} />
                </div>
                <p className="text-slate-400 text-center max-w-2xl">
                    Twórz, zarządzaj i edytuj swoich osobistych asystentów prawnych. Wybierz agenta z listy poniżej lub stwórz nowego.
                </p>
            </div>

            <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                {/* Create New Agent Tile (Overlay) */}
                <div
                    role="button"
                    tabIndex={0}
                    onClick={() => isPro ? onCreateCustomAgent('overlay') : alert("Funkcja Agentów dostępna tylko w pakiecie PRO.")}
                    className={`cursor-pointer group relative overflow-hidden bg-slate-900 border-2 border-dashed ${isPro ? 'border-cyan-500/30 hover:border-cyan-500 hover:bg-slate-800' : 'border-slate-700 opacity-70'} rounded-xl p-6 transition-all duration-300 flex items-center gap-4`}
                >
                    {!isPro && (
                        <div className="absolute top-2 right-2 px-2 py-0.5 bg-cyan-500 text-slate-950 text-[10px] font-black rounded-full shadow-lg">
                            PRO ONLY
                        </div>
                    )}
                    <div className="w-16 h-16 bg-cyan-500/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                        <MagicWandIcon className="w-8 h-8 text-cyan-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white mb-1 uppercase">Stwórz Agenta</h2>
                        <p className="text-sm text-slate-400">Nakładka AI na dziedziny prawa (np. Ekspert RODO)</p>
                    </div>
                </div>

                {/* Create New Standalone Assistant Tile */}
                <div
                    role="button"
                    tabIndex={0}
                    onClick={() => isPro ? onCreateCustomAgent('standalone') : alert("Funkcja Niezależnych Asystentów dostępna tylko w pakiecie PRO.")}
                    className={`cursor-pointer group relative overflow-hidden bg-slate-900 border-2 border-dashed ${isPro ? 'border-violet-500/30 hover:border-violet-500 hover:bg-slate-800' : 'border-slate-700 opacity-70'} rounded-xl p-6 transition-all duration-300 flex items-center gap-4`}
                >
                    {!isPro && (
                        <div className="absolute top-2 right-2 px-2 py-0.5 bg-violet-500 text-white text-[10px] font-black rounded-full shadow-lg">
                            PRO ONLY
                        </div>
                    )}
                    <div className="w-16 h-16 bg-violet-500/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                        <MagicWandIcon className="w-8 h-8 text-violet-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white mb-1 uppercase">Stwórz Asystenta</h2>
                        <p className="text-sm text-slate-400">Niezależny byt z bezpośrednim czatem</p>
                    </div>
                </div>
            </div>

            <div className="w-full max-w-6xl">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mb-6">Twoi Agenci ({customAgents.length})</h3>

                {customAgents.length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-slate-700 rounded-xl bg-slate-800/20">
                        <p className="text-slate-400 mb-2">Nie masz jeszcze żadnych agentów.</p>
                        <p className="text-slate-500 text-sm">Kliknij jeden z przycisków powyżej, aby stworzyć pierwszego asystenta AI.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {customAgents.map(agent => (
                            <div key={agent.id} className="relative group">
                                <button
                                    onClick={() => onCustomAgentSelect(agent)}
                                    className={`w-full h-full bg-slate-800/40 border border-slate-700 rounded-lg p-6 text-left hover:bg-slate-700/70 ${agent.agentType === 'standalone' ? 'hover:border-violet-500' : 'hover:border-cyan-500'} transition-all duration-300`}
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <div className={`w-12 h-12 ${agent.agentType === 'standalone' ? 'bg-violet-500/10' : 'bg-cyan-500/10'} rounded-lg flex items-center justify-center group-hover:bg-opacity-20 transition-colors`}>
                                            <div className={`text-xl font-black ${agent.agentType === 'standalone' ? 'text-violet-400' : 'text-cyan-400'} uppercase font-mono`}>{agent.name.substring(0, 1)}</div>
                                        </div>
                                        {agent.agentType === 'standalone' && (
                                            <span className="text-[10px] bg-violet-500/20 text-violet-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border border-violet-500/20">
                                                Asystent
                                            </span>
                                        )}
                                    </div>
                                    <h2 className="text-xl font-semibold text-white mb-2 line-clamp-1 leading-tight">{agent.name}</h2>
                                    <p className="text-sm text-slate-400 line-clamp-2">{agent.persona}</p>
                                </button>

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onEditCustomAgent(agent);
                                    }}
                                    className="absolute bottom-4 right-4 p-2 text-slate-500 hover:text-cyan-400 hover:bg-cyan-400/10 rounded-lg transition-all opacity-0 group-hover:opacity-100 bg-slate-800 border border-slate-700 shadow-xl"
                                    title="Edytuj agenta"
                                >
                                    <PencilIcon className="w-5 h-5" />
                                </button>

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (confirm(`Czy na pewno chcesz usunąć agenta "${agent.name}" wraz z całą historią?`)) {
                                            onDeleteCustomAgent(agent);
                                        }
                                    }}
                                    className="absolute top-4 right-4 p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all opacity-0 group-hover:opacity-100 bg-slate-800 border border-slate-700 shadow-xl"
                                    title="Usuń agenta"
                                >
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

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
                </div>
            </HelpModal>
        </div>
    );
};

export default CustomAgentsDashboard;
