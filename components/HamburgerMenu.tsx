import React, { useState, useRef, useEffect } from 'react';
import { MenuIcon, ProfileIcon, BookOpenIcon, HomeIcon, ClockIcon, SparklesIcon, ArrowsExpandIcon } from './Icons';
import { SubscriptionInfo } from '../types';

interface HamburgerMenuProps {
    onProfileClick: () => void;
    onKnowledgeClick: () => void;
    onHomeClick?: () => void;
    onHistoryClick?: () => void;
    onQuickActionsClick?: () => void;
    onFullScreenClick?: () => void;
    subscription?: SubscriptionInfo;
    totalCost?: number;
}

const HamburgerMenu: React.FC<HamburgerMenuProps> = ({
    onProfileClick,
    onKnowledgeClick,
    onHomeClick,
    onHistoryClick,
    onQuickActionsClick,
    onFullScreenClick,
    subscription,
    totalCost
}) => {
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
                                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Mój Plan</span>
                                    <span className="text-[10px] text-emerald-400 font-mono font-bold">
                                        {Math.max(0, ((subscription.creditLimit - subscription.spentAmount) / subscription.creditLimit) * 100).toFixed(1)}%
                                    </span>
                                </div>
                                <div className="text-xs text-white font-semibold truncate">
                                    Saldo: {(subscription.creditLimit - subscription.spentAmount).toFixed(2)} PLN
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
                                <span>Strona Główna</span>
                            </button>
                        )}

                        <button
                            onClick={() => { onProfileClick(); setIsOpen(false); }}
                            className="w-full text-left flex items-center gap-3 px-4 py-3 text-sm text-slate-200 hover:bg-slate-700/50 transition-colors"
                            role="menuitem"
                        >
                            <ProfileIcon className="h-5 w-5 text-slate-400" />
                            <span>Panel Użytkownika</span>
                        </button>

                        <button
                            onClick={() => { onKnowledgeClick(); setIsOpen(false); }}
                            className="w-full text-left flex items-center gap-3 px-4 py-3 text-sm text-slate-200 hover:bg-slate-700/50 transition-colors"
                            role="menuitem"
                        >
                            <BookOpenIcon className="h-5 w-5 text-yellow-500" />
                            <span>Baza Wiedzy</span>
                        </button>

                        {onHistoryClick && (
                            <button
                                onClick={() => { onHistoryClick(); setIsOpen(false); }}
                                className="w-full text-left flex items-center gap-3 px-4 py-3 text-sm text-slate-200 hover:bg-slate-700/50 transition-colors"
                                role="menuitem"
                            >
                                <ClockIcon className="h-5 w-5 text-blue-400" />
                                <span>Historia Spraw</span>
                            </button>
                        )}

                        {onQuickActionsClick && (
                            <button
                                onClick={() => { onQuickActionsClick(); setIsOpen(false); }}
                                className="w-full text-left flex items-center gap-3 px-4 py-3 text-sm text-slate-200 hover:bg-slate-700/50 transition-colors"
                                role="menuitem"
                            >
                                <SparklesIcon className="h-5 w-5 text-purple-400" />
                                <span>Szybkie Akcje</span>
                            </button>
                        )}

                        {onFullScreenClick && (
                            <button
                                onClick={() => { onFullScreenClick(); setIsOpen(false); }}
                                className="w-full text-left flex items-center gap-3 px-4 py-3 text-sm text-slate-200 hover:bg-slate-700/50 transition-colors md:hidden"
                                role="menuitem"
                            >
                                <ArrowsExpandIcon className="h-5 w-5 text-slate-400" />
                                <span>Pełny Ekran</span>
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default HamburgerMenu;
