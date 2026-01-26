import React from 'react';
import { useTranslation } from 'react-i18next';
import { SparklesIcon, ChevronRightIcon } from '../Icons';
import { InteractionMode } from '../../types';

interface ChatBubbleFollowUpsProps {
    followUpOptions: InteractionMode[];
    onSelectMode: (mode: InteractionMode) => void;
}

const ChatBubbleFollowUps: React.FC<ChatBubbleFollowUpsProps> = ({
    followUpOptions,
    onSelectMode
}) => {
    const { t } = useTranslation();

    if (!followUpOptions || followUpOptions.length === 0) return null;

    return (
        <div className="mt-4 pt-4 border-t border-slate-600/50 flex flex-col gap-2">
            <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <SparklesIcon className="w-3.5 h-3.5" />
                {t('interaction.suggested_steps')}
            </p>
            <div className="flex flex-wrap gap-2">
                {followUpOptions.map((mode) => {
                    const modeKeyMap: Record<string, string> = {
                        [InteractionMode.StrategicAnalysis]: 'strategic_analysis',
                        [InteractionMode.Document]: 'document',
                        [InteractionMode.LegalTraining]: 'legal_training',
                        [InteractionMode.Court]: 'court',
                        [InteractionMode.Negotiation]: 'negotiation'
                    };
                    const translationKey = `interaction.modes.${modeKeyMap[mode] || 'advice'}`;

                    return (
                        <button
                            key={mode}
                            onClick={() => onSelectMode(mode)}
                            className="px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-xs font-semibold rounded-lg border border-cyan-500/30 transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5 shadow-sm"
                        >
                            <span>{t(translationKey)}</span>
                            <ChevronRightIcon className="w-3 h-3 opacity-50" />
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default ChatBubbleFollowUps;
