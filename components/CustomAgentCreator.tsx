import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { XIcon, SparklesIcon, SendIcon } from './Icons';
import { InfoIcon } from './InfoIcon';
import { CustomAgent } from '../types';
import { optimizeAgent } from '../services/geminiService';

interface CustomAgentCreatorProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (agent: Omit<CustomAgent, 'id' | 'createdAt'>) => Promise<void>;
}

const CustomAgentCreator: React.FC<CustomAgentCreatorProps> = ({ isOpen, onClose, onSave }) => {
    const { t } = useTranslation();
    const [name, setName] = useState('');
    const [persona, setPersona] = useState('');
    const [instructions, setInstructions] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isOptimizing, setIsOptimizing] = useState(false);

    if (!isOpen) return null;

    const handleOptimize = async () => {
        if (!name && !persona && !instructions) {
            alert("Najpierw wpisz cokolwiek, co AI mogłoby rozwinąć.");
            return;
        }
        setIsOptimizing(true);
        try {
            const optimized = await optimizeAgent(name, persona, instructions);
            setName(optimized.name);
            setPersona(optimized.persona);
            setInstructions(optimized.instructions);
        } catch (error) {
            console.error("Failed to optimize agent:", error);
            alert("Błąd podczas optymalizacji przez AI.");
        } finally {
            setIsOptimizing(false);
        }
    };

    const handleSave = async () => {
        if (!name || !persona || !instructions) {
            alert("Proszę uzupełnić wszystkie pola.");
            return;
        }
        setIsSaving(true);
        try {
            await onSave({ name, persona, instructions });
            onClose();
        } catch (error) {
            console.error("Failed to save agent:", error);
            alert("Błąd podczas zapisywania agenta.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
                <header className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800/50 rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-cyan-500/20 rounded-lg">
                            <SparklesIcon className="w-5 h-5 text-cyan-400" />
                        </div>
                        <h2 className="text-lg md:text-xl font-bold text-white">Stwórz Własnego Agenta</h2>
                        <InfoIcon
                            onClick={() => alert(`${t('customAgent.help.intro')}\n\n1. ${t('customAgent.help.point1')}\n2. ${t('customAgent.help.point2')}\n3. ${t('customAgent.help.point3')}\n\n${t('customAgent.help.point4')}`)}
                            className="w-6 h-6 md:w-8 md:h-8 text-cyan-400 hover:text-white"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        {(name || persona || instructions) && (
                            <button
                                onClick={handleOptimize}
                                disabled={isOptimizing}
                                className="flex items-center gap-2 px-3 py-1.5 bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 rounded-lg text-violet-400 text-xs font-bold transition-all disabled:opacity-50 animate-in fade-in zoom-in-95"
                                title="AI dostosuje opisy i instrukcje aby agent spelnil jak najlepiej funkcje"
                            >
                                <SparklesIcon className={`w-3.5 h-3.5 ${isOptimizing ? 'animate-spin' : ''}`} />
                                {isOptimizing ? "OPTYMALIZACJA..." : "OPTYMALIZUJ Z AI"}
                            </button>
                        )}
                        <button onClick={onClose} className="p-2 text-slate-400 hover:text-white transition-colors">
                            <XIcon className="w-6 h-6" />
                        </button>
                    </div>
                </header>

                <main className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                            <span>1. Nazwa dla asystenta</span>
                            <span className="text-[10px] font-medium lowercase text-slate-600 normal-case">(np. Mój Doradca)</span>
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Wpisz jak chcesz go nazywać..."
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                            <span>2. Kim ma być ten asystent? (Rola)</span>
                        </label>
                        <input
                            type="text"
                            value={persona}
                            onChange={(e) => setPersona(e.target.value)}
                            placeholder="Np. Prawnik tłumaczący z trudnego na nasze..."
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">3. Co ma sprawdzać w dokumentach? (Instrukcje)</label>
                        <textarea
                            value={instructions}
                            onChange={(e) => setInstructions(e.target.value)}
                            rows={6}
                            placeholder="Przykład: Zawsze szukaj terminów płatności i pisz do mnie krótko w punktach..."
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors resize-none custom-scrollbar"
                        />
                    </div>

                    <div className="p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-xl space-y-2">
                        <p className="text-xs text-cyan-300 leading-relaxed font-bold">
                            <SparklesIcon className="w-3 h-3 inline mr-1 mb-0.5" />
                            Precyzja PRO (Gemini 1.5 Pro)
                        </p>
                        <p className="text-xs text-slate-400 leading-relaxed italic">
                            Agent będzie miał dostęp do Twoich dokumentów i historii czatu, interpretując je zgodnie z nadaną mu osobowością. Zerowa temperatura gwarantuje, że AI nie będzie wymyślać faktów.
                        </p>
                    </div>
                </main>

                <footer className="p-6 border-t border-slate-700 bg-slate-800/30 rounded-b-2xl">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="w-full py-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 disabled:opacity-50"
                    >
                        {isSaving ? "ZAPISYWANIE..." : (
                            <>
                                <span>ZAPISZ AGENTA</span>
                                <SendIcon className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default CustomAgentCreator;
