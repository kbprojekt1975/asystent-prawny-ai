
import React, { useState } from 'react';
import { MagicWandIcon, SendIcon } from './Icons';

interface CaseAnalysisInputProps {
  onAnalyze: (description: string) => void;
  isLoading: boolean;
  onCancel: () => void;
}

const CaseAnalysisInput: React.FC<CaseAnalysisInputProps> = ({ onAnalyze, isLoading, onCancel }) => {
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (description.trim()) {
      onAnalyze(description);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 animate-in fade-in duration-500">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-violet-600/20 mb-4 ring-1 ring-violet-500/50">
                <MagicWandIcon className="w-8 h-8 text-violet-400" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Opisz swoją sprawę</h2>
            <p className="text-slate-400 max-w-xl mx-auto">
                Napisz, co się stało. Asystent przeanalizuje Twój opis, wybierze odpowiednią dziedzinę prawa i zaproponuje dalsze kroki.
            </p>
        </div>

        <form onSubmit={handleSubmit} className="relative">
            <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Np. Mam problem z sąsiadem, który zalał mi mieszkanie i nie chce zapłacić odszkodowania..."
                className="w-full h-48 bg-slate-800/50 border border-slate-700 rounded-xl p-6 text-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none transition-all shadow-xl"
                disabled={isLoading}
                autoFocus
            />
            
            <div className="flex justify-between items-center mt-6">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={isLoading}
                    className="text-slate-400 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-slate-800"
                >
                    Wróć
                </button>
                <button
                    type="submit"
                    disabled={!description.trim() || isLoading}
                    className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-8 py-3 rounded-lg hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-violet-600/25 font-semibold text-lg"
                >
                    {isLoading ? (
                        <>
                             <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Analizuję...
                        </>
                    ) : (
                        <>
                            Rozpocznij analizę
                            <SendIcon />
                        </>
                    )}
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default CaseAnalysisInput;
