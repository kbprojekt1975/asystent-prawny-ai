import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MenuIcon, ProfileIcon, BookOpenIcon, HomeIcon, ClockIcon, SparklesIcon, DownloadIcon, UploadIcon, QuestionMarkCircleIcon, BrainIcon } from './Icons';
import { SubscriptionInfo } from '../types';

interface HamburgerMenuProps {
    onProfileClick: () => void;
    onKnowledgeClick: () => void;
    onGenerateKnowledgeClick?: () => void;
    onHomeClick?: () => void;
    onHistoryClick?: () => void;
    onAiToolsClick?: () => void;
    onQuickActionsClick?: () => void;
    onExportChat?: () => void;
    onImportChat?: (file: File) => void;
    onInstallApp?: () => void;
    onHelpClick?: () => void;
    onDocumentationClick?: () => void;
    subscription?: SubscriptionInfo;
    totalCost?: number;
}

const HamburgerMenu: React.FC<HamburgerMenuProps> = ({
    onProfileClick,
    onKnowledgeClick,
    onGenerateKnowledgeClick,
    onHomeClick,
    onHistoryClick,
    onAiToolsClick,
    onQuickActionsClick,
    onExportChat,
    onImportChat,
    onInstallApp,
    onHelpClick,
    onDocumentationClick,
    subscription,
    totalCost
}) => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [menuRef]);

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-full transition-colors"
                aria-label="Otwórz menu"
                aria-expanded={isOpen}
            >
                <MenuIcon />
            </button>
            {isOpen && (
                <div
                    className="absolute right-0 mt-2 w-64 origin-top-right bg-slate-800 border border-slate-700 rounded-md shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none z-50 backdrop-blur-xl"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="menu-button"
                >
                    <div className="py-1" role="none">
                        {subscription && (
                            <div className="px-4 py-3 border-b border-slate-700 sm:hidden">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{t('menu.myPlan')}</span>
                                    <span className="text-[10px] text-emerald-400 font-mono font-bold">
                                        {Math.max(0, ((subscription.creditLimit - subscription.spentAmount) / subscription.creditLimit) * 100).toFixed(1)}%
                                    </span>
                                </div>
                                <div className="text-xs text-white font-semibold truncate">
                                    {t('menu.balance')}: {(subscription.creditLimit - subscription.spentAmount).toFixed(2)} PLN
                                </div>
                            </div>
                        )}

                        {onHomeClick && (
                            <button
                                onClick={() => { onHomeClick(); setIsOpen(false); }}
                                className="w-full text-left flex items-center gap-3 px-4 py-3 text-sm text-slate-200 hover:bg-slate-700/50 transition-colors"
                                role="menuitem"
                            >
                                <HomeIcon className="h-5 w-5 text-cyan-500" />
                                <span>{t('menu.home')}</span>
                            </button>
                        )}

                        <button
                            onClick={() => { onProfileClick(); setIsOpen(false); }}
                            className="w-full text-left flex items-center gap-3 px-4 py-3 text-sm text-slate-200 hover:bg-slate-700/50 transition-colors"
                            role="menuitem"
                        >
                            <ProfileIcon className="h-5 w-5 text-slate-400" />
                            <span>{t('menu.myProfile')}</span>
                        </button>



                        <button
                            onClick={() => { onHelpClick?.(); setIsOpen(false); }}
                            className="w-full text-left flex items-center gap-3 px-4 py-3 text-sm text-white bg-indigo-500/20 hover:bg-indigo-500/30 transition-colors border-y border-slate-700"
                            role="menuitem"
                        >
                            <QuestionMarkCircleIcon className="h-5 w-5 text-indigo-400" />
                            <span className="font-bold inline-flex items-center gap-2">
                                {t('menu.helpAi')}
                                <span className="text-[8px] bg-indigo-500 text-white px-1 py-0.5 rounded uppercase tracking-tighter">{t('menu.new')}</span>
                            </span>
                        </button>

                        {onDocumentationClick && (
                            <button
                                onClick={() => { onDocumentationClick(); setIsOpen(false); }}
                                className="w-full text-left flex items-center gap-3 px-4 py-3 text-sm text-slate-200 hover:bg-slate-700/50 transition-colors"
                                role="menuitem"
                            >
                                <BookOpenIcon className="h-5 w-5 text-emerald-400" />
                                <span>{t('menu.documentation')}</span>
                            </button>
                        )}

                        {onAiToolsClick && (
                            <button
                                onClick={() => { onAiToolsClick(); setIsOpen(false); }}
                                className="w-full text-left flex items-center gap-3 px-4 py-3 text-sm text-white bg-cyan-500/10 hover:bg-cyan-500/20 transition-colors border-y border-slate-700/50"
                                role="menuitem"
                            >
                                <SparklesIcon className="h-5 w-5 text-cyan-400" />
                                <span className="font-bold">{t('menu.aiTools')}</span>
                            </button>
                        )}

                        {onHistoryClick && (
                            <button
                                onClick={() => { onHistoryClick(); setIsOpen(false); }}
                                className="w-full text-left flex items-center gap-3 px-4 py-3 text-sm text-slate-200 hover:bg-slate-700/50 transition-colors"
                                role="menuitem"
                            >
                                <ClockIcon className="h-5 w-5 text-blue-400" />
                                <span>{t('menu.history')}</span>
                            </button>
                        )}

                        {onQuickActionsClick && (
                            <button
                                onClick={() => { onQuickActionsClick(); setIsOpen(false); }}
                                className="w-full text-left flex items-center gap-3 px-4 py-3 text-sm text-slate-200 hover:bg-slate-700/50 transition-colors"
                                role="menuitem"
                            >
                                <SparklesIcon className="h-5 w-5 text-purple-400" />
                                <span>{t('menu.quickActions')}</span>
                            </button>
                        )}

                        <div className="border-t border-slate-700 my-1 sm:hidden"></div>

                        {onExportChat && (
                            <button
                                onClick={() => { onExportChat(); setIsOpen(false); }}
                                className="w-full text-left flex items-center gap-3 px-4 py-3 text-sm text-slate-200 hover:bg-slate-700/50 transition-colors sm:hidden"
                                role="menuitem"
                            >
                                <DownloadIcon className="h-5 w-5 text-blue-400" />
                                <span>{t('menu.export')}</span>
                            </button>
                        )}

                        {onImportChat && (
                            <label
                                className="w-full text-left flex items-center gap-3 px-4 py-3 text-sm text-slate-200 hover:bg-slate-700/50 transition-colors cursor-pointer sm:hidden"
                                role="menuitem"
                            >
                                <input
                                    type="file"
                                    accept=".json"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            onImportChat(file);
                                            setIsOpen(false);
                                            e.target.value = '';
                                        }
                                    }}
                                />
                                <UploadIcon className="h-5 w-5 text-purple-400" />
                                <span>{t('menu.import')}</span>
                            </label>
                        )}

                        {onInstallApp && (
                            <button
                                onClick={() => { onInstallApp(); setIsOpen(false); }}
                                className="w-full text-left flex items-center gap-3 px-4 py-3 text-sm text-white bg-cyan-600/20 hover:bg-cyan-600/30 transition-colors border-t border-slate-700"
                                role="menuitem"
                            >
                                <SparklesIcon className="h-5 w-5 text-cyan-400" />
                                <span className="font-bold">{t('menu.install')}</span>
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default HamburgerMenu;
