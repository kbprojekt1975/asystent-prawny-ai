
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { LawArea } from '../types';
import { getLegalFAQ } from '../services/geminiService';
import { LightbulbIcon } from './Icons';

interface LegalFAQProps {
    lawArea: LawArea;
    onSelectQuestion: (question: string) => void;
}

const LegalFAQ: React.FC<LegalFAQProps> = ({ lawArea, onSelectQuestion }) => {
    const { t, i18n } = useTranslation();
    const [questions, setQuestions] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchFAQ = async () => {
            setIsLoading(true);
            try {
                // Pass current language to the service
                const faqs = await getLegalFAQ(lawArea, i18n.language);

                // If service returns empty array (e.g. backend issue), fall back to translated defaults
                if (faqs && faqs.length > 0) {
                    setQuestions(faqs);
                } else {
                    setQuestions(t('faq.fallbacks', { returnObjects: true }) as string[]);
                }
            } catch (error) {
                console.error("Failed to load FAQ:", error);
                setQuestions(t('faq.fallbacks', { returnObjects: true }) as string[]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchFAQ();
    }, [lawArea, i18n.language, t]);

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
                <h4 className="font-semibold text-sm uppercase tracking-wider">{t('faq.title')}: {t(`law.areas.${lawArea.toLowerCase()}`)}</h4>
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
