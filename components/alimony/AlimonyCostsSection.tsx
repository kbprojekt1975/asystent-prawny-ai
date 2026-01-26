import React from 'react';
import { useTranslation } from 'react-i18next';
import { CoinsIcon, HeartPulseIcon, HomeIcon, GraduationCapIcon, TrophyIcon, PalmtreeIcon } from '../Icons';
import { ChildCosts } from '../../hooks/useAlimonyCalculator';

interface AlimonyCostsSectionProps {
    costs: ChildCosts;
    handleCostChange: (field: keyof ChildCosts, value: string) => void;
    onNext: () => void;
}

const AlimonyCostsSection: React.FC<AlimonyCostsSectionProps> = ({ costs, handleCostChange, onNext }) => {
    const { t } = useTranslation();

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                    <CoinsIcon className="w-5 h-5 text-yellow-400" />
                    {t('alimonyCalculator.costs.title')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <CostInput
                        label={t('alimonyCalculator.costs.food')}
                        sublabel={t('alimonyCalculator.costs.foodDesc')}
                        value={costs.food}
                        onChange={(v) => handleCostChange('food', v)}
                        icon={<HeartPulseIcon className="w-4 h-4" />}
                    />
                    <CostInput
                        label={t('alimonyCalculator.costs.housing')}
                        sublabel={t('alimonyCalculator.costs.housingDesc')}
                        value={costs.housing}
                        onChange={(v) => handleCostChange('housing', v)}
                        icon={<HomeIcon className="w-4 h-4" />}
                    />
                    <CostInput
                        label={t('alimonyCalculator.costs.health')}
                        sublabel={t('alimonyCalculator.costs.healthDesc')}
                        value={costs.health}
                        onChange={(v) => handleCostChange('health', v)}
                        icon={<HeartPulseIcon className="w-4 h-4 text-red-400" />}
                    />
                    <CostInput
                        label={t('alimonyCalculator.costs.education')}
                        sublabel={t('alimonyCalculator.costs.educationDesc')}
                        value={costs.education}
                        onChange={(v) => handleCostChange('education', v)}
                        icon={<GraduationCapIcon className="w-4 h-4" />}
                    />
                    <CostInput
                        label={t('alimonyCalculator.costs.development')}
                        sublabel={t('alimonyCalculator.costs.developmentDesc')}
                        value={costs.development}
                        onChange={(v) => handleCostChange('development', v)}
                        icon={<TrophyIcon className="w-4 h-4" />}
                    />
                    <CostInput
                        label={t('alimonyCalculator.costs.fun')}
                        sublabel={t('alimonyCalculator.costs.funDesc')}
                        value={costs.fun}
                        onChange={(v) => handleCostChange('fun', v)}
                        icon={<PalmtreeIcon className="w-4 h-4" />}
                    />
                </div>
            </div>

            <div className="flex justify-end">
                <button
                    onClick={onNext}
                    className="px-6 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white font-medium transition-colors"
                >
                    {t('alimonyCalculator.nav.nextFinance')} &rarr;
                </button>
            </div>
        </div>
    );
};

export const CostInput = ({ label, sublabel, value, onChange, icon }: { label: string, sublabel?: string, value: number | '', onChange: (v: string) => void, icon?: React.ReactNode }) => (
    <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/30 hover:border-slate-600 transition-colors group">
        <label className="block text-sm font-medium text-slate-200 mb-1 flex items-center gap-2">
            {icon && <span className="opacity-70 group-hover:opacity-100 transition-opacity">{icon}</span>}
            {label}
        </label>
        <input
            type="number"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-1 focus:ring-pink-500 focus:border-pink-500 transition-all outline-none"
            placeholder="0 PLN"
        />
        {sublabel && <p className="text-[10px] text-slate-500 mt-1.5 leading-tight">{sublabel}</p>}
    </div>
);

export default AlimonyCostsSection;
