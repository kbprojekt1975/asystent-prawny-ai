import React from 'react';
import { useTranslation } from 'react-i18next';
import { PlusIcon, ClockIcon, TrashIcon, UserIcon } from '../Icons';
import { UserProfile, AndromedaChat } from '../../types';
import { auth } from '../../services/firebase';
import { signOut, User } from 'firebase/auth';

interface AndromedaSidebarProps {
    isSidebarOpen: boolean;
    setIsSidebarOpen: (open: boolean) => void;
    chats: AndromedaChat[];
    currentChatId: string | null;
    handleNewChat: () => void;
    handleSelectChat: (chat: AndromedaChat) => void;
    handleDeleteChat: (e: React.MouseEvent, chatId: string) => void;
    isUserMenuOpen: boolean;
    setIsUserMenuOpen: (open: boolean) => void;
    userProfile: UserProfile | null;
    onProfileClick: () => void;
    isLocalOnly: boolean;
    user: User | null;
}

const AndromedaSidebar: React.FC<AndromedaSidebarProps> = ({
    isSidebarOpen,
    setIsSidebarOpen,
    chats,
    currentChatId,
    handleNewChat,
    handleSelectChat,
    handleDeleteChat,
    isUserMenuOpen,
    setIsUserMenuOpen,
    userProfile,
    onProfileClick,
    isLocalOnly,
    user
}) => {
    const { t } = useTranslation();

    return (
        <aside className={`
            fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 border-r border-slate-800 transition-transform duration-300 transform
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            lg:translate-x-0 lg:static lg:block
        `}>
            <div className="flex flex-col h-full">
                <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t('andromeda.sidebarTitle')}</span>
                    <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-1 text-slate-400 hover:text-white">
                        <PlusIcon className="w-5 h-5 rotate-45" />
                    </button>
                </div>

                <div className="p-4">
                    <button
                        onClick={handleNewChat}
                        className="w-full flex items-center gap-2 justify-center py-2 px-4 bg-cyan-600/10 hover:bg-cyan-600/20 text-cyan-400 rounded-xl transition-all border border-cyan-500/20 font-medium text-sm mb-4"
                    >
                        <PlusIcon className="w-4 h-4" />
                        <span>{t('andromeda.newChat')}</span>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-2 space-y-1 custom-scrollbar">
                    {chats.map((chat) => (
                        <div
                            key={chat.id}
                            onClick={() => handleSelectChat(chat)}
                            className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${currentChatId === chat.id ? 'bg-slate-800 text-white' : 'hover:bg-slate-800/50 text-slate-400'}`}
                        >
                            <div className="flex items-center gap-3 overflow-hidden">
                                <ClockIcon className="w-4 h-4 flex-shrink-0" />
                                <span className="text-sm truncate">{chat.title}</span>
                            </div>
                            <button
                                onClick={(e) => handleDeleteChat(e, chat.id)}
                                className="p-1 opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all"
                            >
                                <TrashIcon className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>

                <div className="p-4 mt-auto border-t border-slate-800 relative">
                    {isUserMenuOpen && (
                        <div className="absolute bottom-full left-4 mb-2 w-64 bg-slate-900/90 border border-slate-700/50 rounded-2xl shadow-2xl backdrop-blur-xl z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
                            <div className="p-2 space-y-1">
                                {userProfile?.subscription && (
                                    <div className="px-4 py-3 border-b border-slate-800/50">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">{t('menu.myPlan')}</span>
                                            <span className="text-[10px] text-cyan-400 font-mono font-bold px-2 py-0.5 bg-cyan-400/10 rounded-full">
                                                {Math.max(0, ((userProfile.subscription.creditLimit - userProfile.subscription.spentAmount) / userProfile.subscription.creditLimit) * 100).toFixed(1)}%
                                            </span>
                                        </div>
                                        <div className="text-xs text-white font-medium">
                                            {t('menu.balance')}: {(userProfile.subscription.creditLimit - userProfile.subscription.spentAmount).toFixed(2)} PLN
                                        </div>
                                    </div>
                                )}

                                <button
                                    onClick={() => { onProfileClick(); setIsUserMenuOpen(false); }}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
                                        <UserIcon />
                                    </div>
                                    <span className="font-medium">{t('menu.myProfile')}</span>
                                </button>

                                <button
                                    onClick={() => signOut(auth)}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                        </svg>
                                    </div>
                                    <span className="font-medium">{t('menu.logout')}</span>
                                </button>
                            </div>
                        </div>
                    )}
                    <div
                        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                        className="flex items-center gap-3 px-3 py-2 bg-slate-900/50 hover:bg-slate-800/80 cursor-pointer rounded-xl border border-slate-800 transition-all group"
                    >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-[10px] font-bold shadow-lg group-hover:scale-105 transition-transform">
                            {user?.email?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-white truncate">{user?.email}</p>
                            {isLocalOnly ? (
                                <div className="flex items-center gap-2 bg-red-500/20 border-red-500/50 px-3 py-2 rounded-xl animate-pulse whitespace-nowrap mt-1">
                                    <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div>
                                    <span className="text-[10px] font-bold text-red-500 uppercase tracking-tight">
                                        {t('app.noGdprConsent')}
                                    </span>
                                </div>
                            ) : (
                                <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">{t('andromeda.active')}</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default AndromedaSidebar;
