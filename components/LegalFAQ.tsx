
import React, { useState, useEffect } from 'react';
import { LawArea } from '../types';
import { getLegalFAQ } from '../services/geminiService';
import { LightbulbIcon } from './Icons';

interface LegalFAQProps {
    lawArea: LawArea;
    onSelectQuestion: (question: string) => void;
}

const LegalFAQ: React.FC<LegalFAQProps> = ({ lawArea, onSelectQuestion }) => {
    const [questions, setQuestions] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchFAQ = async () => {
            setIsLoading(true);
            try {
                const faqs = await getLegalFAQ(lawArea);
                setQuestions(faqs);
            } catch (error) {
                console.error("Failed to load FAQ:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchFAQ();
    }, [lawArea]);

    if (isLoading) {
        return (
            <div className="mt-8 animate-pulse">
                <div className="h-4 w-32 bg-slate-700 rounded mb-4"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-12 bg-slate-800 rounded-lg border border-slate-700/50"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (questions.length === 0) return null;

    return (
        <div className="mt-10">
            <div className="flex items-center gap-2 mb-4 text-cyan-400">
                <LightbulbIcon className="w-5 h-5 text-cyan-500" />
                <h4 className="font-semibold text-sm uppercase tracking-wider">Często Zadawane Pytania: {lawArea}</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {questions.map((q, index) => (
                    <button
                        key={index}
                        onClick={() => onSelectQuestion(q)}
                        className="flex items-start text-left p-4 bg-slate-800/40 hover:bg-slate-700/60 border border-slate-700/50 hover:border-cyan-600/50 rounded-xl transition-all group"
                    >
                        <span className="text-sm text-slate-300 group-hover:text-white leading-relaxed">
                            {q}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default LegalFAQ;
