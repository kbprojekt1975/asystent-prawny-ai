import React from 'react';
import { useTranslation } from 'react-i18next';
import { UserIcon, ListIcon, CalendarIcon, SparklesIcon } from '../Icons';

export type ProfileTab = 'personal' | 'quickActions' | 'calendar' | 'guide';

interface ProfileTabsProps {
    activeTab: ProfileTab;
    setActiveTab: (tab: ProfileTab) => void;
}

const ProfileTabs: React.FC<ProfileTabsProps> = ({ activeTab, setActiveTab }) => {
    const { t } = useTranslation();

    return (
        <div className="relative mx-4 md:mx-6 mt-4 group">
            <div className="flex overflow-x-auto scrollbar-hide flex-nowrap bg-slate-900/50 p-1 rounded-xl border border-slate-700/50 gap-1 touch-pan-x">
                <button
                    onClick={() => setActiveTab('personal')}
                    className={`flex-1 flex-shrink-0 min-w-fit whitespace-nowrap flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-all ${activeTab === 'personal' ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/20' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    <UserIcon className="w-4 h-4" />
                    <span>{t('userProfile.tabs.personal')}</span>
                </button>
                <button
                    onClick={() => setActiveTab('quickActions')}
                    className={`flex-1 flex-shrink-0 min-w-fit whitespace-nowrap flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-all ${activeTab === 'quickActions' ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/20' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    <ListIcon className="w-4 h-4" />
                    <span>{t('userProfile.tabs.quickActions')}</span>
                </button>
                <button
                    onClick={() => setActiveTab('calendar')}
                    className={`flex-1 flex-shrink-0 min-w-fit whitespace-nowrap flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-all ${activeTab === 'calendar' ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/20' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    <CalendarIcon className="w-4 h-4" />
                    <span>{t('userProfile.tabs.calendar')}</span>
                </button>
                <button
                    onClick={() => setActiveTab('guide')}
                    className={`flex-1 flex-shrink-0 min-w-fit whitespace-nowrap flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-all ${activeTab === 'guide' ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    <SparklesIcon className="w-4 h-4" />
                    <span>{t('userProfile.tabs.guide')}</span>
                </button>
            </div>
            {/* Visual indicators for scrolling */}
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-800 to-transparent pointer-events-none rounded-r-xl md:hidden" />
            <div className="flex md:hidden items-center justify-center gap-1.5 mt-2 text-[10px] text-slate-500 font-medium animate-pulse">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
                <span>{t('userProfile.swipeHint')}</span>
            </div>
        </div>
    );
};

export default ProfileTabs;
