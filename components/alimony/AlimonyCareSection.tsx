import React from 'react';
import { useTranslation } from 'react-i18next';
import { UserGroupIcon, ScaleIcon, CalculatorIcon } from '../Icons';
import { InfoIcon } from '../InfoIcon';

interface AlimonyCareSectionProps {
    isSharedCustody: boolean;
    setIsSharedCustody: (val: boolean) => void;
    daysWithOther: number;
    setDaysWithOther: (val: number) => void;
    otherDependents: number;
    setOtherDependents: (val: number) => void;
    calculate: () => void;
}

const AlimonyCareSection: React.FC<AlimonyCareSectionProps> = ({
    isSharedCustody,
    setIsSharedCustody,
    daysWithOther,
    setDaysWithOther,
    otherDependents,
    setOtherDependents,
    calculate
}) => {
    const { t } = useTranslation();

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50 space-y-6">
                <h3 className="font-bold text-white flex items-center gap-2">
                    <UserGroupIcon className="w-5 h-5 text-indigo-400" />
                    {t('alimonyCalculator.care.title')}
                </h3>

                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            checked={isSharedCustody}
                            onChange={(e) => setIsSharedCustody(e.target.checked)}
                            className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-pink-600 focus:ring-pink-500"
                        />
                        <div>
                            <span className="text-white font-medium">{t('alimonyCalculator.care.sharedCustody')}</span>
                            <p className="text-xs text-slate-500">{t('alimonyCalculator.care.sharedCustodyDesc')}</p>
                        </div>
                    </div>

                    {!isSharedCustody && (
                        <div className="pl-8">
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                {t('alimonyCalculator.care.daysWithOther')}
                            </label>
                            <input
                                type="number"
                                min="0" max="30"
                                value={daysWithOther}
                                onChange={(e) => setDaysWithOther(Number(e.target.value))}
                                className="w-32 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                            <p className="text-xs text-slate-500 mt-1">{t('alimonyCalculator.care.daysWithOtherDesc')}</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50 space-y-4">
                <h3 className="font-bold text-white flex items-center gap-2">
                    <ScaleIcon className="w-5 h-5 text-orange-400" />
                    {t('alimonyCalculator.care.extraTitle')}
                </h3>

                <div className="grid grid-cols-1 gap-6">
                    <div className="flex items-start gap-3 bg-slate-700/30 p-3 rounded-lg">
                        <InfoIcon className="w-5 h-5 text-blue-400 mt-0.5" />
                        <div>
                            <span className="text-sm font-bold text-white">{t('alimonyCalculator.care.800plus')}</span>
                            <p className="text-xs text-slate-400 mt-1" dangerouslySetInnerHTML={{ __html: t('alimonyCalculator.care.800plusDesc') }}></p>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            {t('alimonyCalculator.care.otherDependents')}
                        </label>
                        <input
                            type="number"
                            min="0"
                            value={otherDependents}
                            onChange={(e) => setOtherDependents(Number(e.target.value))}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none"
                            placeholder={t('alimonyCalculator.care.otherDependentsPlaceholder')}
                        />
                        <p className="text-xs text-slate-500 mt-1">{t('alimonyCalculator.care.otherDependentsDesc')}</p>
                    </div>
                </div>
            </div>

            <button
                onClick={calculate}
                className="w-full py-4 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-bold rounded-xl shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
                <CalculatorIcon className="w-5 h-5" />
                {t('alimonyCalculator.care.calculateBtn')}
            </button>
        </div>
    );
};

export default AlimonyCareSection;
