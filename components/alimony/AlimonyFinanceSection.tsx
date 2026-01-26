import React from 'react';
import { useTranslation } from 'react-i18next';
import { ParentParams } from '../../hooks/useAlimonyCalculator';

interface AlimonyFinanceSectionProps {
    parentMe: ParentParams;
    parentOther: ParentParams;
    handleParentChange: (who: 'me' | 'other', field: keyof ParentParams, value: string) => void;
    onBack: () => void;
    onNext: () => void;
}

const AlimonyFinanceSection: React.FC<AlimonyFinanceSectionProps> = ({
    parentMe,
    parentOther,
    handleParentChange,
    onBack,
    onNext
}) => {
    const { t } = useTranslation();

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Parent Me */}
                <ParentSection
                    title={t('alimonyCalculator.parents.me')}
                    vals={parentMe}
                    onChange={(f, v) => handleParentChange('me', f, v)}
                    color="text-emerald-400"
                />
                {/* Parent Other */}
                <ParentSection
                    title={t('alimonyCalculator.parents.other')}
                    vals={parentOther}
                    onChange={(f, v) => handleParentChange('other', f, v)}
                    color="text-blue-400"
                    isOther
                />
            </div>
            <div className="flex justify-end gap-3">
                <button
                    onClick={onBack}
                    className="px-6 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 font-medium transition-colors"
                >
                    &larr; {t('alimonyCalculator.nav.back')}
                </button>
                <button
                    onClick={onNext}
                    className="px-6 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white font-medium transition-colors"
                >
                    {t('alimonyCalculator.nav.nextCare')} &rarr;
                </button>
            </div>
        </div>
    );
};

export const ParentSection = ({ title, vals, onChange, color, isOther }: { title: string, vals: ParentParams, onChange: (f: keyof ParentParams, v: string) => void, color: string, isOther?: boolean }) => {
    const { t } = useTranslation();
    return (
        <div className="space-y-4">
            <h3 className={`font-bold ${color} text-lg border-b border-slate-700/50 pb-2`}>{title}</h3>

            <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">{t('alimonyCalculator.parents.income')}</label>
                <input
                    type="number"
                    value={vals.income}
                    onChange={(e) => onChange('income', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-pink-500 outline-none"
                    placeholder={t('alimonyCalculator.parents.incomePlaceholder')}
                />
            </div>

            <div>
                <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold uppercase text-slate-500">{t('alimonyCalculator.parents.potential')}</label>
                    <span className="text-[10px] text-slate-400 italic">{t('alimonyCalculator.parents.potentialDesc')}</span>
                </div>
                <input
                    type="number"
                    value={vals.potential}
                    onChange={(e) => onChange('potential', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-pink-500 outline-none"
                    placeholder={t('alimonyCalculator.parents.potentialPlaceholder')}
                />
            </div>

            <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">{t('alimonyCalculator.parents.education')}</label>
                <textarea
                    value={vals.education}
                    onChange={(e) => onChange('education', e.target.value)}
                    rows={2}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-pink-500 outline-none resize-none"
                    placeholder={t('alimonyCalculator.parents.educationPlaceholder')}
                />
            </div>

            <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">{t('alimonyCalculator.parents.livingCosts')}</label>
                <input
                    type="number"
                    value={vals.livingCosts}
                    onChange={(e) => onChange('livingCosts', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-pink-500 outline-none"
                    placeholder={t('alimonyCalculator.parents.livingCostsPlaceholder')}
                />
            </div>
        </div>
    )
};

export default AlimonyFinanceSection;
