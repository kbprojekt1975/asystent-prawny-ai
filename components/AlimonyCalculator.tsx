import React, { useState, useEffect } from 'react';
import { XIcon, CalculatorIcon, RefreshIcon } from './Icons';
import { LawArea } from '../types';

interface AlimonyCalculatorProps {
    isOpen: boolean;
    onClose: () => void;
    lawArea: LawArea | null;
}

const AlimonyCalculator: React.FC<AlimonyCalculatorProps> = ({ isOpen, onClose, lawArea }) => {
    const [income, setIncome] = useState<number | ''>('');
    const [childNeeds, setChildNeeds] = useState<number | ''>('');
    const [childrenCount, setChildrenCount] = useState<number>(1);
    const [result, setResult] = useState<string | null>(null);

    // Safety check: Close if not Family Law (though parent should handle this)
    useEffect(() => {
        if (lawArea !== LawArea.Family && isOpen) {
            onClose();
        }
    }, [lawArea, isOpen, onClose]);

    if (!isOpen) return null;

    const calculate = () => {
        const inc = Number(income) || 0;
        const needs = Number(childNeeds) || 0;

        if (inc <= 0 || needs <= 0) {
            setResult("Wprowadź poprawne dane finansowe.");
            return;
        }

        // Simplified logic inspired by KRIO guidelines (Just for demo)
        // Assumption: Alimony usually covers ~50-70% of needs properly split, capped by income capacity.
        // This is a heuristic for the MVP.
        const share = 0.6; // Obligor covers 60% of needs typically
        const maxCapacity = inc * 0.4; // Can't take more than 40% of income usually

        let calc = needs * share * childrenCount;

        if (calc > maxCapacity) {
            calc = maxCapacity;
        }

        setResult(`Szacowana kwota alimentów: ${Math.round(calc)} PLN miesięcznie.`);
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div
                className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh] overflow-hidden animate-slide-up"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-700 bg-slate-800/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-pink-500/20 rounded-lg flex items-center justify-center text-pink-400">
                            <CalculatorIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Kalkulator Alimentów</h2>
                            <p className="text-xs text-pink-400 font-medium tracking-wide uppercase">Tylko w: Prawo Rodzinne</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-700/50 rounded-lg"
                    >
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Dochód netto zobowiązanego (PLN)
                            </label>
                            <input
                                type="number"
                                value={income}
                                onChange={(e) => setIncome(Number(e.target.value))}
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all outline-none"
                                placeholder="np. 4500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Miesięczny koszt utrzymania dzieci (PLN)
                            </label>
                            <input
                                type="number"
                                value={childNeeds}
                                onChange={(e) => setChildNeeds(Number(e.target.value))}
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all outline-none"
                                placeholder="np. 2000 (szkoła, jedzenie, leki)"
                            />
                            <p className="text-xs text-slate-500 mt-1">Suma "usprawiedliwionych potrzeb" wszystkich dzieci.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Liczba dzieci
                            </label>
                            <select
                                value={childrenCount}
                                onChange={(e) => setChildrenCount(Number(e.target.value))}
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all outline-none"
                            >
                                {[1, 2, 3, 4, 5].map(n => (
                                    <option key={n} value={n}>{n}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {result && (
                        <div className="p-4 bg-pink-500/10 border border-pink-500/20 rounded-xl animate-fade-in">
                            <p className="text-center text-pink-300 font-semibold text-lg">{result}</p>
                        </div>
                    )}

                    <button
                        onClick={calculate}
                        className="w-full py-4 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-bold rounded-xl shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        <CalculatorIcon className="w-5 h-5" />
                        Oblicz szacunek
                    </button>

                    <p className="text-xs text-slate-500 text-center leading-relaxed">
                        * To narzędzie służy jedynie do celów poglądowych. Ostateczna kwota alimentów zależy od indywidualnej oceny sądu, możliwości zarobkowych rodzica oraz usprawiedliwionych potrzeb dziecka (art. 135 k.r.o.).
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AlimonyCalculator;
