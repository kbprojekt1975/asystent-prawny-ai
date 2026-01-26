import React from 'react';
import { useTranslation } from 'react-i18next';

interface AlimonyResultProps {
    result: {
        totalNeeds: number;
        shareMe: number;
        shareOther: number;
        suggestedAlimony: number;
    } | null;
}

const AlimonyResult: React.FC<AlimonyResultProps> = ({ result }) => {
    const { t } = useTranslation();

    if (!result) return null;

    return (
        <div className="mt-8 p-6 bg-slate-800 border border-violet-500/30 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-500">
            <h3 className="text-lg font-bold text-white mb-6 text-center border-b border-slate-700 pb-4">{t('alimonyCalculator.results.title')}</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 text-center">
                <div>
                    <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">{t('alimonyCalculator.results.needs')}</div>
                    <div className="text-2xl font-black text-white">{Math.round(result.totalNeeds)} PLN</div>
                </div>
                <div>
                    <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">{t('alimonyCalculator.results.financialShare')}</div>
                    <div className="font-bold text-emerald-400">{Math.round(result.shareMe)}% {t('alimonyCalculator.results.you')}</div>
                    <div className="font-bold text-blue-400">{Math.round(result.shareOther)}% {t('alimonyCalculator.results.otherSide')}</div>
                </div>
                <div>
                    <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">{t('alimonyCalculator.results.suggested')}</div>
                    <div className="text-3xl font-black text-pink-500">{Math.round(result.suggestedAlimony)} PLN</div>
                </div>
            </div>

            <div className="text-xs text-slate-500 italic text-center bg-slate-900/50 p-3 rounded-lg">
                {t('alimonyCalculator.results.disclaimer')}
            </div>
        </div>
    );
};

export default AlimonyResult;
