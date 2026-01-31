import { useState, useEffect, useCallback } from 'react';
import { ChatMessage, UserProfile, AndromedaChat } from '../types';
import { askAndromeda } from '../services/geminiService';
import { db } from '../services/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, doc, updateDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { useAppContext } from '../context/AppContext';

export const useAndromeda = (language: string, onAddCost?: (cost: number) => void) => {
    const { user, userProfile, isLocalOnly } = useAppContext();
    const [history, setHistory] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [currentChatId, setCurrentChatId] = useState<string | null>(null);
    const [chats, setChats] = useState<AndromedaChat[]>([]);
    const [localChats, setLocalChats] = useState<AndromedaChat[]>([]);

    // Fetch Andromeda Chats from Firestore
    useEffect(() => {
        if (!user || isLocalOnly) return;

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
        });

        return () => unsubscribe();
    }, [user, isLocalOnly]);

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

    const saveLocalChats = useCallback((updatedChats: AndromedaChat[]) => {
        setLocalChats(updatedChats);
        localStorage.setItem('andromeda_local_chats', JSON.stringify(updatedChats));
    }, []);

    const handleNewChat = useCallback(() => {
        setCurrentChatId(null);
        setHistory([]);
    }, []);

    const handleSelectChat = useCallback((chat: AndromedaChat) => {
        setCurrentChatId(chat.id);
        setHistory(chat.messages);
    }, []);

    const handleDeleteChat = useCallback(async (chatId: string) => {
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
    }, [user, isLocalOnly, localChats, saveLocalChats, currentChatId, handleNewChat]);

    const handleSend = useCallback(async (input: string) => {
        if (!input.trim() || isLoading || !user) return;

        const userMessage: ChatMessage = { role: 'user', content: input };
        const newHistory = [...history, userMessage];
        setHistory(newHistory);
        setIsLoading(true);

        try {
            const response = await askAndromeda(newHistory, language, currentChatId, isLocalOnly);

            if (response.usage && response.usage.cost > 0) {
                onAddCost?.(response.usage.cost);
            }

            const assistantMessage: ChatMessage = { role: 'model', content: response.text };
            const finalHistory = [...newHistory, assistantMessage];
            setHistory(finalHistory);

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
    }, [user, history, isLoading, language, currentChatId, isLocalOnly, localChats, saveLocalChats, onAddCost]);

    const handleFileUpload = useCallback(async (file: File) => {
        if (!file || !user) return;

        const userMessage: ChatMessage = { role: 'user', content: `[Przesłano plik: ${file.name}]` };
        const newHistory = [...history, userMessage];
        setHistory(newHistory);
        setIsLoading(true);

        try {
            const reader = new FileReader();
            reader.onload = async (ev) => {
                const textContent = ev.target?.result as string;
                const systemPrompt = `\nSYSTEM: Użytkownik przesłał plik "${file.name}". Treść:\n---\n${textContent.substring(0, 25000)}\n---\nPrzeanalizuj ten dokument i zapisz kluczowe fakty używając narzędzia 'add_to_chat_knowledge'.`;
                const backendHistory = [...newHistory, { role: 'user', content: systemPrompt }];

                const response = await askAndromeda(backendHistory, language, currentChatId, isLocalOnly);

                if (response.usage && response.usage.cost > 0) {
                    onAddCost?.(response.usage.cost);
                }

                const assistantMessage: ChatMessage = { role: 'model', content: response.text };
                const finalHistory = [...newHistory, assistantMessage];
                setHistory(finalHistory);

                if (!isLocalOnly) {
                    if (currentChatId) {
                        await updateDoc(doc(db, 'users', user.uid, 'andromeda_chats', currentChatId), {
                            messages: finalHistory,
                            lastUpdated: serverTimestamp()
                        });
                    } else {
                        const title = `Analiza: ${file.name}`;
                        const docRef = await addDoc(collection(db, 'users', user.uid, 'andromeda_chats'), {
                            title,
                            messages: finalHistory,
                            lastUpdated: serverTimestamp(),
                            createdAt: serverTimestamp()
                        });
                        setCurrentChatId(docRef.id);
                    }
                }
            };
            reader.readAsText(file);
        } catch (error) {
            console.error("File upload error:", error);
        } finally {
            setIsLoading(false);
        }
    }, [user, history, language, currentChatId, isLocalOnly, onAddCost]);

    return {
        history,
        isLoading,
        currentChatId,
        chats: isLocalOnly ? localChats : chats,
        userProfile,
        user,
        isLocalOnly,
        handleNewChat,
        handleSelectChat,
        handleDeleteChat,
        handleSend,
        handleFileUpload
    };
};
