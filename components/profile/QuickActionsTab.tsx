import React from 'react';
import { useTranslation } from 'react-i18next';
import { UserProfile, QuickAction, LawArea } from '../../types';
import { TrashIcon, PlusCircleIcon } from '../Icons';

interface QuickActionsTabProps {
    currentProfile: UserProfile;
    allTopics: Record<LawArea, string[]>;
    newActionArea: LawArea | '';
    setNewActionArea: (area: LawArea | '') => void;
    newActionTopic: string;
    setNewActionTopic: (topic: string) => void;
    handleAddQuickAction: () => void;
    handleDeleteQuickAction: (index: number) => void;
}

const QuickActionsTab: React.FC<QuickActionsTabProps> = ({
    currentProfile,
    allTopics,
    newActionArea,
    setNewActionArea,
    newActionTopic,
    setNewActionTopic,
    handleAddQuickAction,
    handleDeleteQuickAction
}) => {
    const { t } = useTranslation();

    return (
        <div>
            <h4 className="text-lg font-medium text-white mb-2">{t('userProfile.quickActions.title')}</h4>
            <p className="text-sm text-slate-400 mb-4">{t('userProfile.quickActions.description')}</p>

            <div className="space-y-2 mb-4">
                {currentProfile.quickActions?.map((qa, index) => (
                    <div key={`${qa.lawArea}-${qa.topic || 'general'}-${index}`} className="flex items-center justify-between bg-slate-700/50 rounded-lg p-2 px-3 group">
                        <span className="text-sm text-slate-200">
                            {qa.lawArea}{qa.topic ? <span className="text-slate-400"> / {qa.topic}</span> : ''}
                        </span>
                        <button onClick={() => handleDeleteQuickAction(index)} className="text-slate-500 hover:text-red-500 transition-colors opacity-50 group-hover:opacity-100" aria-label={`${t('userProfile.quickActions.deleteLabel')} ${qa.lawArea} ${qa.topic || ''}`}>
                            <TrashIcon />
                        </button>
                    </div>
                ))}
                {(!currentProfile.quickActions || currentProfile.quickActions.length === 0) && (
                    <p className="text-sm text-slate-500 text-center py-2">{t('userProfile.quickActions.noActions')}</p>
                )}
            </div>

            <div className="space-y-3 p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                <h5 className="text-sm font-semibold text-white">{t('userProfile.quickActions.addNew')}</h5>
                <select
                    value={newActionArea}
                    onChange={e => { setNewActionArea(e.target.value as LawArea); setNewActionTopic(''); }}
                    className="w-full bg-slate-700/50 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 border border-slate-600/50"
                >
                    <option value="">{t('userProfile.quickActions.selectLawArea')}</option>
                    {Object.values(LawArea).map(area => <option key={area} value={area}>{t(`law.areas.${area.toLowerCase()}`)}</option>)}
                </select>

                {newActionArea && (
                    <select
                        value={newActionTopic}
                        onChange={e => setNewActionTopic(e.target.value)}
                        className="w-full bg-slate-700/50 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 border border-slate-600/50"
                    >
                        <option value="">{t('userProfile.quickActions.selectTopic')}</option>
                        {allTopics[newActionArea]?.map(topic => <option key={topic} value={topic}>{topic}</option>)}
                    </select>
                )}

                <button
                    onClick={handleAddQuickAction}
                    disabled={!newActionArea}
                    className="w-full flex items-center justify-center gap-2 bg-cyan-600/20 text-cyan-300 border border-cyan-600/50 rounded-lg p-3 text-sm font-medium hover:bg-cyan-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <PlusCircleIcon />
                    {t('userProfile.quickActions.addButton')}
                </button>
            </div>
        </div>
    );
};

export default QuickActionsTab;
