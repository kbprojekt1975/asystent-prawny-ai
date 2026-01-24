import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { SparklesIcon, SendIcon, BotIcon, Bars3Icon, PlusIcon, ClockIcon, TrashIcon, PaperClipIcon, UserIcon } from './Icons';
import { ChatMessage, UserProfile } from '../types';
import { askAndromeda } from '../services/geminiService';
import LoadingSpinner from './LoadingSpinner';
import { auth, db } from '../services/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, doc, updateDoc, serverTimestamp, deleteDoc, getDocs, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';

interface AndromedaChat {
    id: string;
    title: string;
    lastUpdated: any;
    messages: ChatMessage[];
}

interface AndromedaAssistantProps {
    onProceed: () => void;
    onProfileClick: () => void;
    language: string;
}

const AndromedaAssistant: React.FC<AndromedaAssistantProps> = ({ onProceed, onProfileClick, language }) => {
    const { t, i18n } = useTranslation();
    const [input, setInput] = useState('');
    const [history, setHistory] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [currentChatId, setCurrentChatId] = useState<string | null>(null);
    const [chats, setChats] = useState<AndromedaChat[]>([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [placeholderIndex, setPlaceholderIndex] = useState(0);
    const [isPlaceholderVisible, setIsPlaceholderVisible] = useState(true);
    const [isLocalOnly, setIsLocalOnly] = useState(false);
    const [localChats, setLocalChats] = useState<AndromedaChat[]>([]);

    const placeholders = t('andromeda.placeholders', { returnObjects: true }) as string[];

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const user = auth.currentUser;

    // Fetch Andromeda Chats
    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, 'users', user.uid, 'andromeda_chats'),
            orderBy('lastUpdated', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedChats = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as AndromedaChat));
            setChats(fetchedChats);

            // Auto-select first chat if none selected and exists
            if (!currentChatId && fetchedChats.length > 0) {
                // setCurrentChatId(fetchedChats[0].id);
                // setHistory(fetchedChats[0].messages);
            }
        });

        return () => unsubscribe();
    }, [user]);

    // Fetch User Profile
    useEffect(() => {
        if (!user) return;

        const fetchProfile = async () => {
            try {
                const profileDoc = await getDoc(doc(db, 'users', user.uid));
                if (profileDoc.exists()) {
                    const profile = profileDoc.data().profile as UserProfile;
                    setUserProfile(profile);
                    setIsLocalOnly(!profile.dataProcessingConsent);
                } else {
                    // Default to local if no profile exists yet
                    setIsLocalOnly(true);
                }
            } catch (error) {
                console.error('Error fetching user profile:', error);
                setIsLocalOnly(true);
            }
        };

        fetchProfile();
    }, [user]);

    // Load Local Chats
    useEffect(() => {
        if (!isLocalOnly) return;
        const saved = localStorage.getItem('andromeda_local_chats');
        if (saved) {
            try {
                setLocalChats(JSON.parse(saved));
            } catch (e) {
                console.error("Local chats parse error:", e);
            }
        }
    }, [isLocalOnly]);

    const saveLocalChats = (updatedChats: AndromedaChat[]) => {
        setLocalChats(updatedChats);
        localStorage.setItem('andromeda_local_chats', JSON.stringify(updatedChats));
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [history, isLoading]);

    const handleNewChat = () => {
        setCurrentChatId(null);
        setHistory([]);
        setIsSidebarOpen(false);
    };

    const handleSelectChat = (chat: AndromedaChat) => {
        setCurrentChatId(chat.id);
        setHistory(chat.messages);
        setIsSidebarOpen(false);
    };

    const handleDeleteChat = async (e: React.MouseEvent, chatId: string) => {
        e.stopPropagation();
        if (!user) return;
        try {
            if (!isLocalOnly) {
                await deleteDoc(doc(db, 'users', user.uid, 'andromeda_chats', chatId));
            } else {
                const updatedLocal = localChats.filter(c => c.id !== chatId);
                saveLocalChats(updatedLocal);
            }

            if (currentChatId === chatId) {
                handleNewChat();
            }
        } catch (err) {
            console.error("Error deleting chat:", err);
        }
    };

    const handleSend = async () => {
        if (!input.trim() || isLoading || !user) return;

        const userMessage: ChatMessage = { role: 'user', content: input };
        const newHistory = [...history, userMessage];
        setHistory(newHistory);
        setInput('');
        setIsLoading(true);

        try {
            const response = await askAndromeda(newHistory, language, currentChatId); // Pass chatId
            const assistantMessage: ChatMessage = { role: 'model', content: response.text };
            const finalHistory = [...newHistory, assistantMessage];
            setHistory(finalHistory);

            // Save to Firestore OR Local Storage
            if (!isLocalOnly) {
                if (currentChatId) {
                    await updateDoc(doc(db, 'users', user.uid, 'andromeda_chats', currentChatId), {
                        messages: finalHistory,
                        lastUpdated: serverTimestamp()
                    });
                } else {
                    const title = input.length > 30 ? input.substring(0, 30) + '...' : input;
                    const docRef = await addDoc(collection(db, 'users', user.uid, 'andromeda_chats'), {
                        title,
                        messages: finalHistory,
                        lastUpdated: serverTimestamp(),
                        createdAt: serverTimestamp()
                    });
                    setCurrentChatId(docRef.id);
                }
            } else {
                // Local Storage Logic
                const title = input.length > 30 ? input.substring(0, 30) + '...' : input;
                const chatId = currentChatId || `local_${Date.now()}`;
                const newChat: AndromedaChat = {
                    id: chatId,
                    title,
                    messages: finalHistory,
                    lastUpdated: new Date().toISOString()
                };

                const updatedLocal = [...localChats];
                const index = updatedLocal.findIndex(c => c.id === chatId);
                if (index > -1) {
                    updatedLocal[index] = newChat;
                } else {
                    updatedLocal.unshift(newChat);
                }
                saveLocalChats(updatedLocal);
                setCurrentChatId(chatId);
            }
        } catch (error) {
            console.error("Andromeda error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        // Create a temporary message to show upload
        const userMessage: ChatMessage = { role: 'user', content: `[Przesłano plik: ${file.name}]` };
        const newHistory = [...history, userMessage];
        setHistory(newHistory);
        setIsLoading(true);

        try {
            const reader = new FileReader();
            reader.onload = async (ev) => {
                const textContent = ev.target?.result as string;
                // Add invisible system prompt with file content to history for analysis
                const systemPrompt = `\nSYSTEM: Użytkownik przesłał plik "${file.name}". Treść:\n---\n${textContent.substring(0, 25000)}\n---\nPrzeanalizuj ten dokument i zapisz kluczowe fakty używając narzędzia 'add_to_chat_knowledge'.`;

                // We don't display the huge text in UI, but send it to backend
                const backendHistory = [...newHistory, { role: 'user', content: systemPrompt }];

                const response = await askAndromeda(backendHistory, language, currentChatId); // Use currentChatId
                const assistantMessage: ChatMessage = { role: 'model', content: response.text };
                const finalHistory = [...newHistory, assistantMessage];
                setHistory(finalHistory);

                // Save to Firestore
                if (currentChatId) {
                    await updateDoc(doc(db, 'users', user.uid, 'andromeda_chats', currentChatId), {
                        messages: finalHistory,
                        lastUpdated: serverTimestamp()
                    });
                } else {
                    // If no chat exists yet, create one
                    const title = `Analiza: ${file.name}`;
                    const docRef = await addDoc(collection(db, 'users', user.uid, 'andromeda_chats'), {
                        title,
                        messages: finalHistory,
                        lastUpdated: serverTimestamp(),
                        createdAt: serverTimestamp()
                    });
                    setCurrentChatId(docRef.id);
                }
            };
            reader.readAsText(file);
        } catch (error) {
            console.error("File upload error:", error);
        } finally {
            setIsLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [input]);

    // Rotating placeholders logic with fade effect
    useEffect(() => {
        const interval = setInterval(() => {
            setIsPlaceholderVisible(false); // Start fade out

            setTimeout(() => {
                setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
                setIsPlaceholderVisible(true); // Start fade in
            }, 600); // Wait for fade out duration

        }, 4500); // Total cycle time
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="fixed inset-0 z-50 flex bg-slate-950 text-slate-100 overflow-hidden font-sans">
            {/* Sidebar - Desktop (Fixed) & Mobile (Drawer) */}
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
                        {(isLocalOnly ? localChats : chats).map((chat) => (
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

            {/* Overlay for Mobile Sidebar */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Main Chat Content */}
            <div className="flex-1 flex flex-col relative h-full">
                {/* Ambient Background */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-900/10 blur-[120px] rounded-full animate-pulse" />
                    <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-900/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
                </div>

                {/* Header */}
                <header className="relative z-10 px-4 md:px-6 py-4 flex items-center justify-between border-b border-slate-800/50 backdrop-blur-md bg-slate-900/40">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="lg:hidden p-2 -ml-2 text-slate-400 hover:text-white transition-colors"
                        >
                            <Bars3Icon className="w-6 h-6" />
                        </button>
                        <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-900/20">
                            <SparklesIcon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-base md:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 tracking-tight">
                                Andromeda
                            </h1>
                            <p className="text-[8px] md:text-[10px] text-cyan-400 uppercase tracking-widest font-bold">{t('andromeda.subtitle')}</p>
                        </div>
                    </div>


                    <button
                        onClick={onProceed}
                        className="group relative p-3 bg-slate-800/40 hover:bg-slate-700/60 rounded-xl transition-all border border-slate-700/50 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-900/20"
                        title="Przejdź do Narzędzi Specjalistycznych"
                    >
                        <div className="grid grid-cols-3 gap-1 animate-attention-blink">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="w-1.5 h-1.5 bg-cyan-400 rounded-sm" />
                            ))}
                        </div>
                    </button>
                </header>

                {/* Chat Area */}
                <main className="relative z-10 flex-1 overflow-y-auto px-4 md:px-6 py-6 md:py-8 scrollbar-hide">
                    <div className="max-w-3xl mx-auto space-y-6 md:space-y-8">
                        {history.length === 0 && (
                            <div className="text-center py-10 md:py-20 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                                <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-slate-900 rounded-3xl border border-slate-800 mb-6 shadow-2xl relative">
                                    <BotIcon className="w-8 h-8 md:w-10 md:h-10 text-cyan-400" />
                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-4 border-slate-950 animate-pulse" />
                                </div>
                                <h2 className="text-xl md:text-3xl font-bold text-white mb-4 px-4">{t('andromeda.welcomeTitle')}</h2>
                                <p className="text-slate-400 text-sm md:text-lg max-w-md mx-auto leading-relaxed px-6">
                                    {t('andromeda.welcomeDesc')}
                                </p>
                            </div>
                        )}

                        {history.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}
                            >
                                <div className={`max-w-[90%] md:max-w-[85%] p-3 md:p-4 rounded-2xl ${msg.role === 'user'
                                    ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/20'
                                    : 'bg-slate-900 border border-slate-800 text-slate-100 shadow-xl'
                                    }`}>
                                    <div className="prose prose-invert prose-xs md:prose-sm max-w-none whitespace-pre-wrap leading-relaxed">
                                        {msg.content}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center gap-3 shadow-xl">
                                    <LoadingSpinner size="sm" color="cyan" />
                                    <span className="text-sm text-slate-400 font-medium animate-pulse truncate">{t('andromeda.analyzingFile')}</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </main>

                {/* Input Area */}
                <footer className="relative z-10 p-4 md:p-6 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent">
                    <div className="max-w-3xl mx-auto relative group">
                        <div className="absolute inset-0 bg-cyan-600/5 blur-xl group-focus-within:bg-cyan-600/10 transition-colors rounded-2xl" />
                        <div className="relative flex flex-col bg-slate-900/80 border border-slate-800 group-focus-within:border-cyan-500/50 rounded-2xl transition-all backdrop-blur-xl shadow-2xl overflow-hidden">
                            {/* Animated Placeholder Overlay */}
                            {!input && (
                                <div className={`absolute top-0 left-0 w-full px-4 py-4 text-slate-500 text-sm md:text-base pointer-events-none transition-all duration-700 ease-in-out ${isPlaceholderVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1'}`}>
                                    {placeholders[placeholderIndex]}
                                </div>
                            )}
                            <textarea
                                ref={textareaRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="w-full bg-transparent px-4 py-4 text-white focus:outline-none resize-none min-h-[60px] max-h-[300px] text-sm md:text-base relative z-10"
                                rows={1}
                            />
                            <div className="flex items-center justify-between px-4 pb-4">
                                <div className="flex items-center gap-2 md:gap-4">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileUpload}
                                        className="hidden"
                                        accept=".txt,.md,.json,.csv,.xml"
                                    />
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isLoading}
                                        className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all border border-transparent hover:border-slate-600"
                                        title={t('andromeda.uploadFile')}
                                    >
                                        <PaperClipIcon className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleSend}
                                        disabled={!input.trim() || isLoading}
                                        className={`p-2 rounded-xl transition-all ${input.trim() && !isLoading
                                            ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/40 hover:scale-105 active:scale-95'
                                            : 'bg-slate-800 text-slate-600'
                                            }`}
                                    >
                                        <SendIcon className="w-5 h-5 font-bold" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </footer>
            </div>

            <style>{`
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 20px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #334155; }
                
                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
                 .animate-float { animation: float 6s ease-in-out infinite; }
                @keyframes attention-blink {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.3; transform: scale(0.9); }
                }
                .animate-attention-blink {
                    animation: attention-blink 0.8s ease-in-out 5;
                }
            `}</style>
        </div>
    );
};

export default AndromedaAssistant;
