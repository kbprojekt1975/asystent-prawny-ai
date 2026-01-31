import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { XIcon, SparklesIcon, SendIcon } from './Icons';
import { CustomAgent } from '../types';

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

    if (!isOpen) return null;

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
                        <h2 className="text-xl font-bold text-white">Stwórz Własnego Agenta</h2>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-white transition-colors">
                        <XIcon className="w-6 h-6" />
                    </button>
                </header>

                <main className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nazwa Agenta</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="np. Surowy Sędzia, Ekspert od RODO..."
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Kim jest ten Agent? (Persona)</label>
                        <input
                            type="text"
                            value={persona}
                            onChange={(e) => setPersona(e.target.value)}
                            placeholder="np. Doświadczony prokurator z 20-letnim stażem..."
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Instrukcje Specjalne</label>
                        <textarea
                            value={instructions}
                            onChange={(e) => setInstructions(e.target.value)}
                            rows={6}
                            placeholder="Opisz jak agent ma się zachowywać, na czym ma się skupiać, jaki ma mieć styl wypowiedzi..."
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors resize-none custom-scrollbar"
                        />
                    </div>

                    <div className="p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-xl">
                        <p className="text-xs text-cyan-300 leading-relaxed italic">
                            Agent będzie miał dostęp do wszystkich Twoich dokumentów i historii czatu w ramach danej sprawy, ale będzie interpretował je zgodnie z powyższą osobliwością.
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
