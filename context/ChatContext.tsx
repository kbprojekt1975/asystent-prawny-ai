import React, { createContext, useContext, ReactNode, useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getLegalAdvice, analyzeLegalCase } from '../services/geminiService';
import { ChatMessage, InteractionMode, LawArea, CaseNote, getChatId } from '../types';
import { useChatLogic } from '../hooks/useChatLogic';
import { useAppContext } from './AppContext';
import { useUIContext } from './UIContext';
import { useTopicManagement } from '../hooks/useTopicManagement';
import { db } from '../services/firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';

interface ChatContextType {
    chatHistory: ChatMessage[];
    setChatHistory: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
    currentMessage: string;
    setCurrentMessage: React.Dispatch<React.SetStateAction<string>>;
    isLoading: boolean;
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
    isDeepThinkingEnabled: boolean;
    setIsDeepThinkingEnabled: React.Dispatch<React.SetStateAction<boolean>>;
    chatHistories: any[];
    setChatHistories: React.Dispatch<React.SetStateAction<any[]>>;
    chatNotes: CaseNote[];

    handleSendMessage: (text?: string, historyOverride?: ChatMessage[], options?: any) => Promise<void>;
    handleSelectCourtRole: (role: any) => Promise<void>;
    handleGenerateKnowledge: () => Promise<void>;
    handleFileUpload: (file: File) => Promise<void>;
    loadChatHistories: () => Promise<any[] | undefined>;
    handleAddCost: (cost: number) => Promise<void>;
    handleExportChat: () => void;
    handleImportChat: (file: File, callback: (data: any) => void) => void;
    handleInitialGreeting: (lawArea: LawArea, topic: string, mode: InteractionMode, initialDescription?: string) => Promise<void>;
    handleAddNote: (content: string, linkedMessage?: string, noteId?: string, linkedRole?: 'user' | 'model' | 'system') => Promise<void>;
    deleteNote: (noteId: string) => Promise<void>;
    handleUpdateNotePosition: (noteId: string, position: { x: number, y: number } | null) => Promise<void>;
    handleSelectInteractionMode: (mode: InteractionMode, context?: 'current' | 'select' | 'new') => Promise<void>;
    handleLoadHistory: (lawArea: LawArea, topic: string, mode?: InteractionMode, path?: 'pro' | 'standard', initialDescription?: string) => Promise<void>;
    handleAddTopic: (newTopic: string, mode: InteractionMode | null, servicePath?: 'pro' | 'standard') => Promise<void>;
    handleDeleteHistory: (lawArea: LawArea, topic: string) => Promise<void>;
    handleCaseAnalysis: (description: string) => Promise<void>;
    isDeleteModalOpen: boolean;
    cancelDeleteTopic: () => void;
    confirmDeleteTopic: () => Promise<void>;
    requestDeleteTopic: (lawArea: LawArea, topic: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { t, i18n } = useTranslation();
    const {
        user,
        userProfile,
        selectedLawArea,
        setSelectedLawArea,
        selectedTopic,
        setSelectedTopic,
        interactionMode,
        setInteractionMode,
        currentChatId,
        setTotalCost,
        setCourtRole,
        courtRole,
        isLocalOnly,
        setIsLocalOnly,
        servicePath,
        setServicePath,
        topics,
        setTopics,
        handleUpdateProfile
    } = useAppContext();

    const {
        setIsWelcomeAssistantOpen,
        setIsFullScreen,
        setIsHistoryPanelOpen,
        setIsWelcomeModalOpen
    } = useUIContext();

    const [chatHistories, setChatHistories] = useState<any[]>([]);
    const [chatNotes, setChatNotes] = useState<CaseNote[]>([]);

    const handleCostAdd = useCallback((cost: number) => {
        setTotalCost(prev => prev + cost);
    }, [setTotalCost]);

    const chatLogic = useChatLogic({
        user,
        userProfile,
        selectedLawArea,
        selectedTopic,
        interactionMode,
        currentChatId,
        onAddCost: handleCostAdd,
        onRefreshHistories: async () => {
            const h = await loadChatHistories();
            if (h) setChatHistories(h);
        },
        setCourtRole,
        chatHistories,
        isLocalOnly
    });

    const {
        chatHistory,
        setChatHistory,
        handleSendMessage,
        handleSelectCourtRole,
        handleInitialGreeting,
        isLoading,
        setIsLoading,
        loadChatHistories,
        handleExportChat,
        handleImportChat,
        handleAddCost
    } = chatLogic;

    // Added: Load initial history on mount or user change
    useEffect(() => {
        if (user) {
            loadChatHistories().then(h => {
                if (h) setChatHistories(h);
            });
        }
    }, [user, loadChatHistories]);

    // Use topic management hook
    const topicManager = useTopicManagement(
        user,
        topics,
        setTopics,
        selectedLawArea,
        setInteractionMode,
        setSelectedTopic,
        isLocalOnly
    );

    const {
        handleAddTopic,
        isDeleteModalOpen,
        cancelDeleteTopic,
        confirmDeleteTopic,
        requestDeleteTopic
    } = topicManager;

    const handleDeleteHistory = async (lawArea: LawArea, topic: string) => {
        if (!user) return;
        try {
            const mainChatId = getChatId(lawArea, topic);
            await deleteDoc(doc(db, 'users', user.uid, 'chats', mainChatId));
            const deletePromises = Object.values(InteractionMode).map(async (m) => {
                if (m === InteractionMode.Advice || m === InteractionMode.Analysis) return;
                const specializedId = getChatId(lawArea, topic, m);
                await deleteDoc(doc(db, 'users', user.uid, 'chats', specializedId));
            });
            await Promise.all(deletePromises);
            const h = await loadChatHistories();
            if (h) setChatHistories(h);
            if (userProfile?.quickActions) {
                const updatedActions = userProfile.quickActions.filter(
                    action => !(action.lawArea === lawArea && action.topic === topic)
                );
                if (updatedActions.length !== userProfile.quickActions.length) {
                    handleUpdateProfile({
                        ...userProfile,
                        quickActions: updatedActions
                    }, false);
                }
            }
        } catch (e) {
            console.error("Error deleting history:", e);
        }
    };

    const handleLoadHistory = useCallback(async (lawArea: LawArea, topic: string, mode?: InteractionMode, path?: 'pro' | 'standard', initialDescription?: string) => {
        if (!user) return;
        setIsWelcomeAssistantOpen(false);
        setIsWelcomeModalOpen(false);
        setIsLoading(true);
        setChatHistory([]);

        if (mode) setInteractionMode(mode);
        if (path) setServicePath(path);

        if (mode !== InteractionMode.Court && interactionMode !== InteractionMode.Court) {
            setCourtRole(null);
        }
        setIsFullScreen(false);

        setSelectedLawArea(lawArea);
        setSelectedTopic(topic);

        const chatId = getChatId(lawArea, topic, mode);

        let autoInteractionMode: InteractionMode | null = null;
        const lowerTopic = topic.toLowerCase();
        if (lowerTopic.includes('negocjacje') || lowerTopic.includes('mediacje') || lowerTopic.includes('ugoda') || lowerTopic.includes('porozumienie')) {
            autoInteractionMode = InteractionMode.Negotiation;
        }

        try {
            const chatDoc = await getDoc(doc(db, 'users', user.uid, 'chats', chatId));
            if (chatDoc.exists()) {
                const data = chatDoc.data();
                const savedHistory = data.messages || [];
                const savedInteractionMode = (data.interactionMode as InteractionMode) || autoInteractionMode;
                const savedServicePath = data.servicePath as 'pro' | 'standard' | undefined;

                if (!path && savedServicePath) setServicePath(savedServicePath);

                let finalMode = mode || interactionMode || savedInteractionMode;

                if (!finalMode && savedHistory.length > 0 && savedHistory[0].role === 'system') {
                    const systemMessage = savedHistory[0].content;
                    const modeMatch = systemMessage.match(/Tryb: (.*)/);
                    if (modeMatch && modeMatch[1]) {
                        const parsed = modeMatch[1].trim() as InteractionMode;
                        if (Object.values(InteractionMode).includes(parsed)) finalMode = parsed;
                    }
                }

                setChatHistory(savedHistory);

                if (finalMode) {
                    setInteractionMode(finalMode);
                }

                if (finalMode === InteractionMode.Court && courtRole) {
                    handleSelectCourtRole(courtRole);
                } else if (savedHistory.length === 0 && finalMode) {
                    await handleInitialGreeting(lawArea, topic, finalMode, initialDescription);
                } else if (savedHistory.length > 0 && mode && mode !== savedInteractionMode && mode !== InteractionMode.Advice) {
                    const modeChangeMessage = `[SYSTEM: ZMIANA TRYBU NA ${mode}]\nUżytkownik właśnie przełączył się na ten tryb pracy.\nTWOJE ZADANIE:\n1. Krótko streść dotychczasowe ustalenia w sprawie: ${topic}.\n2. Wyjaśnij konkretnie, jak Twój obecnie wybrany tryb pracy wspiera użytkownika w tej sytuacji.\n3. Zaproponuj konkretne działania (np. przygotowanie pisma, analiza konkretnego aspektu) ściśle związane z Twoją specjalizacją w tym trybie.\n\nSKUP SIĘ WYŁĄCZNIE NA OBECNYM TRYBIE. Nie sugeruj innych asystentów ani zmiany trybu. Pisz proaktywnie.`;

                    await handleSendMessage(modeChangeMessage, savedHistory, {
                        lawArea,
                        topic,
                        interactionMode: mode,
                        servicePath: path || savedServicePath || 'standard'
                    });
                }
            } else {
                setChatHistory([]);
                const modeToUse = mode || interactionMode || autoInteractionMode;
                if (modeToUse) {
                    setInteractionMode(modeToUse);
                    if (modeToUse === InteractionMode.Court && courtRole) {
                        handleSelectCourtRole(courtRole);
                    } else {
                        await handleInitialGreeting(lawArea, topic, modeToUse, initialDescription);
                    }
                }
            }
        } catch (e) {
            console.error("Error loading chat history:", e);
        } finally {
            setIsLoading(false);
        }
    }, [user, interactionMode, courtRole, handleSelectCourtRole, handleInitialGreeting, handleSendMessage, setChatHistory, setInteractionMode, setIsFullScreen, setIsWelcomeAssistantOpen, setIsWelcomeModalOpen, setIsLoading, setSelectedLawArea, setSelectedTopic, setServicePath]);

    const handleCaseAnalysis = useCallback(async (description: string) => {
        if (!user) return;
        setIsLoading(true);
        try {
            const analysisResponse = await analyzeLegalCase(description, i18n.language);
            const { result, usage } = analysisResponse;
            if (usage && usage.cost > 0) {
                handleAddCost(usage.cost);
            }
            if (result) {
                const currentTopics = topics[result.lawArea] || [];
                const predictedPath = result.interactionMode === InteractionMode.StrategicAnalysis ? 'pro' : 'standard';
                if (!currentTopics.includes(result.topic)) {
                    await handleAddTopic(result.topic, result.interactionMode, predictedPath);
                }
                await handleLoadHistory(result.lawArea, result.topic, result.interactionMode, predictedPath, description);
            } else {
                console.warn("Analysis returned no result");
                alert("Niestety nie udało mi się automatycznie zaklasyfikować Twojej sprawy. Spróbuj wybrać kategorię ręcznie.");
            }
        } catch (e) {
            console.error("Error in case analysis:", e);
            alert("Wystąpił nieoczekiwany błąd podczas analizy sprawy.");
        } finally {
            setIsLoading(false);
            // Optional: setIsWelcomeModalOpen(false) here if we want to force close even on failure
        }
    }, [user, i18n.language, topics, handleAddTopic, handleLoadHistory, handleAddCost, setIsLoading]);

    const handleSelectInteractionMode = async (mode: InteractionMode, context: 'current' | 'select' | 'new' = 'current') => {
        let lawArea = selectedLawArea || LawArea.Civil;
        const newServicePath = mode === InteractionMode.StrategicAnalysis ? 'pro' : 'standard';

        if (context === 'new') {
            const now = new Date();
            const topicName = `Nowa sprawa (${now.toLocaleDateString()} ${now.getHours()}:${now.getMinutes()})`;
            await handleAddTopic(topicName, mode, newServicePath);
            setServicePath(newServicePath);
            handleLoadHistory(lawArea, topicName, mode, newServicePath);
            return;
        }

        if (context === 'select') {
            setServicePath(newServicePath);
            setInteractionMode(mode);
            setIsHistoryPanelOpen(true);
            return;
        }

        const oldMode = interactionMode;
        setServicePath(newServicePath);
        setInteractionMode(mode);

        if (selectedTopic && chatHistory.length > 0 && mode !== oldMode) {
            if (mode !== InteractionMode.Court) {
                const modeChangeMessage = `[SYSTEM: ZMIANA TRYBU NA ${mode}]\nUżytkownik właśnie przełączył się na ten tryb pracy.\nTWOJE ZADANIE:\n1. Krótko streść dotychczasowe ustalenia w sprawie: ${selectedTopic}.\n2. Wyjaśnij konkretnie, jak Twój obecnie wybrany tryb pracy wspiera użytkownika w tej sytuacji.\n3. Zaproponuj konkretne działania (np. przygotowanie pisma, analiza konkretnego aspektu) ściśle związane z Twoją specjalizacją w tym trybie.\n\nSKUP SIĘ WYŁĄCZNIE NA OBECNYM TRYBIE. Nie sugeruj innych asystentów ani zmiany trybu. Pisz proaktywnie.`;

                handleSendMessage(modeChangeMessage, chatHistory, {
                    lawArea: selectedLawArea,
                    topic: selectedTopic,
                    interactionMode: mode,
                    servicePath: newServicePath
                });
            }
        }
    };

    useEffect(() => {
        if (!user || !currentChatId) {
            setChatNotes([]);
            return;
        }

        const q = query(
            collection(db, 'users', user.uid, 'chats', currentChatId, 'notes'),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedNotes = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as CaseNote));
            setChatNotes(fetchedNotes);
        });

        return () => unsubscribe();
    }, [user, currentChatId]);

    const handleAddNote = async (content: string, linkedMessage?: string, noteId?: string, linkedRole?: 'user' | 'model' | 'system') => {
        if (!user || !currentChatId) return;
        try {
            const notesRef = collection(db, 'users', user.uid, 'chats', currentChatId, 'notes');
            const finalNoteId = noteId || `note_${Date.now()}`;
            const payload: any = {
                content,
                linkedMessage: linkedMessage || null,
                updatedAt: serverTimestamp()
            };
            if (linkedRole) payload.linkedRole = linkedRole;
            if (!noteId) payload.createdAt = serverTimestamp();
            await setDoc(doc(notesRef, finalNoteId), payload, { merge: true });
        } catch (e) {
            console.error("Error adding/updating note:", e);
        }
    };

    const deleteNote = async (noteId: string) => {
        if (!user || !currentChatId) return;
        try {
            await deleteDoc(doc(db, 'users', user.uid, 'chats', currentChatId, 'notes', noteId));
        } catch (e) {
            console.error("Error deleting note:", e);
        }
    };

    const handleUpdateNotePosition = async (noteId: string, position: { x: number, y: number } | null) => {
        if (!user || !currentChatId) return;
        try {
            const noteRef = doc(db, 'users', user.uid, 'chats', currentChatId, 'notes', noteId);
            await updateDoc(noteRef, {
                position,
                updatedAt: serverTimestamp()
            });
        } catch (e) {
            console.error("Error updating note position:", e);
        }
    };

    const value: ChatContextType = {
        ...chatLogic,
        chatHistories,
        setChatHistories,
        chatNotes,
        handleAddNote,
        deleteNote,
        handleUpdateNotePosition,
        handleSelectInteractionMode,
        handleLoadHistory,
        handleAddTopic,
        handleDeleteHistory,
        handleCaseAnalysis,
        isDeleteModalOpen,
        cancelDeleteTopic,
        confirmDeleteTopic,
        requestDeleteTopic
    };

    return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChatContext = () => {
    const context = useContext(ChatContext);
    if (context === undefined) {
        throw new Error('useChatContext must be used within a ChatProvider');
    }
    return context;
};
