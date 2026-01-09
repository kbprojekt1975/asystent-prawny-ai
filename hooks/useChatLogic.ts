import { useState, useCallback } from 'react';
import { doc, updateDoc, setDoc, serverTimestamp, increment, collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { getLegalAdvice } from '../services/geminiService';
import { LawArea, ChatMessage, InteractionMode, UserProfile, SubscriptionStatus, CourtRole, ExportedChat } from '../types';
import { User } from 'firebase/auth';

interface UseChatLogicProps {
    user: User | null;
    userProfile: UserProfile;
    selectedLawArea: LawArea | null;
    selectedTopic: string | null;
    interactionMode: InteractionMode | null;
    currentChatId: string | null;
    onAddCost: (cost: number) => void;
    onRefreshHistories: () => void;
    setCourtRole: (role: CourtRole | null) => void;
    chatHistories?: { lawArea: LawArea; topic: string; servicePath?: 'pro' | 'standard' }[];
    isLocalOnly?: boolean;
}

export const useChatLogic = ({
    user,
    userProfile,
    selectedLawArea,
    selectedTopic,
    interactionMode,
    currentChatId,
    onAddCost,
    onRefreshHistories,
    setCourtRole,
    chatHistories = [],
    isLocalOnly = false
}: UseChatLogicProps) => {
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [currentMessage, setCurrentMessage] = useState<string>('');
    const [legalArticles, setLegalArticles] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isDeepThinkingEnabled, setIsDeepThinkingEnabled] = useState<boolean>(false);

    const handleSelectCourtRole = (role: CourtRole) => {
        setCourtRole(role);

        let roleInstructions = "";
        switch (role) {
            case CourtRole.MyAttorney:
                roleInstructions = "Twoja rola: MÓJ MECENAS. Przeprowadź symulację przygotowania do rozprawy. Zadawaj pytania, które może zadać sąd, i koryguj moje odpowiedzi. Bądź wspierający, ale wymagający.";
                break;
            case CourtRole.OpposingAttorney:
                roleInstructions = "Twoja rola: MECENAS STRONY PRZECIWNEJ. Przeprowadź 'cross-examination'. Zadawaj podchwytliwe pytania, próbuj podważyć wiarygodność, wytykaj niespójności. Bądź ostry i dociekliwy.";
                break;
            case CourtRole.Judge:
                roleInstructions = "Twoja rola: SĄD (SĘDZIA). Prowadź przesłuchanie w sposób formalny, bezstronny i stanowczy. Używaj języka prawniczego. Zadawaj pytania doprecyzujące fakty.";
                break;
            case CourtRole.Prosecutor:
                roleInstructions = "Twoja rola: PROKURATOR. (Tryb karny). Zadawaj pytania oskarżycielskie, dąż do udowodnienia winy. Bądź surowy.";
                break;
        }

        const systemContent = `ZMIANA TRYBU: Rozpoczynamy symulację w Trybie Sądowym.
        Specjalizacja: ${selectedLawArea}. Temat: ${selectedTopic}.
        ${roleInstructions}
        
        WAŻNE: Wykorzystaj całą dotychczasową wiedzę o sprawie zapisaną w historii czatu powyżej. Zachowaj pełną powagę i realizm symulacji.`;

        const newMessages: ChatMessage[] = [];

        // Add current history if exists
        if (chatHistory.length > 0) {
            newMessages.push(...chatHistory);
        }

        newMessages.push({
            role: 'system',
            content: systemContent
        });

        // Initial greeting based on role
        let greeting = "";
        if (role === CourtRole.MyAttorney) greeting = "Dzień dobry. Jestem Twoim pełnomocnikiem. Przeanalizowałem dotychczasowe informacje. Musimy przygotować się do rozprawy. Czy możemy przejść do pytań, które mogą paść na sali?";
        if (role === CourtRole.Judge) greeting = "Sąd otwiera posiedzenie. Na podstawie zebranego materiału dowodowego, przystępujemy do przesłuchania. Proszę podejść do barierki. Czy jest Pan/Pani gotowy/a do złożenia zeznań?";
        if (role === CourtRole.OpposingAttorney) greeting = "Witam. Reprezentuję stronę przeciwną. Zapoznałem się z Pana/Pani wersją wydarzeń. Mam do Pana/Pani kilka pytań.";
        if (role === CourtRole.Prosecutor) greeting = "Prokuratura Rejonowa. Analiza akt została zakończona. Przystępujemy do czynności. Czy podtrzymuje Pan/Pani swoje dotychczasowe wyjaśnienia?";

        if (greeting) {
            newMessages.push({ role: 'user', content: `[SYSTEM: Rozpocznij symulację w roli: ${role}]` });
            newMessages.push({ role: 'model', content: greeting });
        }

        setChatHistory(newMessages);
    };

    const handleSendMessage = useCallback(async (
        messageOverride?: string,
        historyOverride?: ChatMessage[],
        metadataOverride?: { lawArea: LawArea, topic: string, interactionMode: InteractionMode, servicePath?: 'pro' | 'standard' }
    ) => {
        // Determine effective values (use overrides or current state)
        const effectiveLawArea = metadataOverride?.lawArea || selectedLawArea;
        const effectiveTopic = metadataOverride?.topic || selectedTopic;
        const effectiveInteractionMode = metadataOverride?.interactionMode || interactionMode;
        const effectiveChatId = metadataOverride
            ? `${metadataOverride.lawArea}_${metadataOverride.topic.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`
            : currentChatId;

        const messageToSend = messageOverride || currentMessage.trim();
        if ((!messageToSend && !historyOverride) || !effectiveLawArea || !effectiveTopic || !effectiveInteractionMode || (isLoading && !historyOverride) || !user || !effectiveChatId) return;

        // Use current history or the override provided
        const currentHistory = historyOverride || chatHistory;

        let newHistory = [...currentHistory];

        // Only append user message if it's not a history override (which already includes it)
        if (!historyOverride) {
            const userMessage: ChatMessage = { role: 'user', content: messageToSend };
            newHistory.push(userMessage);
            setChatHistory(newHistory);
        } else {
            setChatHistory(historyOverride);
        }

        if (!messageOverride) {
            setCurrentMessage('');
        }

        // BLOCK IF NOT ACTIVE (Check isPaid as source of truth)
        if (userProfile?.subscription && !userProfile.subscription.isPaid) {
            console.warn("Blocked: Subscription not paid");
            setIsLoading(false);
            return;
        }

        setIsLoading(true);

        const articlesToPass =
            effectiveInteractionMode !== InteractionMode.SuggestRegulations &&
                effectiveInteractionMode !== InteractionMode.FindRulings &&
                effectiveInteractionMode !== InteractionMode.LegalTraining
                ? legalArticles.trim() : undefined;


        try {
            // Save user message (and ensure doc exists) BEFORE calling AI
            if (!isLocalOnly) {
                const chatId = effectiveChatId;
                await setDoc(doc(db, 'users', user.uid, 'chats', chatId), {
                    messages: newHistory,
                    lastUpdated: serverTimestamp(),
                    lawArea: effectiveLawArea,
                    topic: effectiveTopic,
                    interactionMode: effectiveInteractionMode,
                    servicePath: metadataOverride?.servicePath || (chatHistories.find(h => {
                        const sanTopic = h.topic.replace(/[^a-z0-9]/gi, '_').toLowerCase();
                        return h.lawArea === effectiveLawArea && sanTopic === effectiveTopic.replace(/[^a-z0-9]/gi, '_').toLowerCase();
                    })?.servicePath) || 'standard'
                }, { merge: true });
            }

            const aiResponse = await getLegalAdvice(
                newHistory,
                effectiveLawArea,
                effectiveInteractionMode,
                effectiveTopic,
                isDeepThinkingEnabled,
                articlesToPass,
                effectiveChatId // Użycie ujednoliconego ID
            );

            // Sanitize response to prevent "undefined" values in Firestore
            const aiMessage: ChatMessage = { role: 'model', content: aiResponse.text };
            if (aiResponse.sources) {
                aiMessage.sources = aiResponse.sources;
            }

            const finalHistory = [...newHistory, aiMessage];
            setChatHistory(finalHistory);

            // Update cost
            if (aiResponse.usage && aiResponse.usage.cost > 0) {
                const cost = aiResponse.usage.cost;
                onAddCost(cost);
                if (!isLocalOnly) {
                    await updateDoc(doc(db, 'users', user.uid), {
                        totalCost: increment(cost)
                    });
                }
            }

            // Save to Firestore with timestamp and metadata
            if (!isLocalOnly) {
                await setDoc(doc(db, 'users', user.uid, 'chats', effectiveChatId), {
                    messages: finalHistory,
                    lastUpdated: serverTimestamp(),
                    lawArea: effectiveLawArea,
                    topic: effectiveTopic,
                    interactionMode: effectiveInteractionMode,
                    servicePath: metadataOverride?.servicePath || (chatHistories.find(h => {
                        const sanTopic = h.topic.replace(/[^a-z0-9]/gi, '_').toLowerCase();
                        return h.lawArea === effectiveLawArea && sanTopic === effectiveTopic.replace(/[^a-z0-9]/gi, '_').toLowerCase();
                    })?.servicePath) || 'standard'
                }, { merge: true });

                // Reload histories only if syncing with server
                onRefreshHistories();
            }

        } catch (error) {
            console.error("AI Error", error);
        } finally {
            setIsLoading(false);
        }
    }, [currentMessage, selectedLawArea, interactionMode, isLoading, legalArticles, isDeepThinkingEnabled, selectedTopic, chatHistory, user, onRefreshHistories, currentChatId, userProfile?.subscription?.status, onAddCost, isLocalOnly]);

    const handleGenerateKnowledge = useCallback(async () => {
        if (!user || !selectedLawArea || !selectedTopic) return;
        setIsLoading(true);

        const userMessage: ChatMessage = { role: 'user', content: "Generuj Bazę Wiedzy dla tej sprawy." };
        setChatHistory(prev => [...prev, userMessage]);

        const specializedPrompt = `
            SYSTEM: Użytkownik prosi o wygenerowanie kompletnej Bazy Wiedzy (Case File) dla tej konkretnej sprawy.
            TWOJE ZADANIE:
            1. Przeanalizuj dotychczasową rozmowę i zidentyfikuj kluczowe problemy prawne.
            2. Użyj narzędzia 'search_legal_acts' aby znaleźć konkretne ustawy i rozporządzenia regulujące te kwestie.
            3. Użyj narzędzia 'get_act_content' aby pobrać treść kluczowych aktów (lub ich fragmentów). PAMIĘTAJ o zapisywaniu ich do bazy.
            4. Wylistuj najważniejsze, precedensowe orzecznictwo (wyroki SN, SA) pasujące do stanu faktycznego (skorzystaj ze swojej wiedzy, jeśli nie masz narzędzia do wyroków).

            Na koniec wyświetl podsumowanie: "Zaktualizowano Akt Sprawy. Dodano następujące pozycje: [Lista]".
            `;

        const historyForAI = [...chatHistory, userMessage, { role: 'user', content: specializedPrompt } as ChatMessage];
        await handleSendMessage(undefined, historyForAI, undefined);
    }, [user, selectedLawArea, selectedTopic, chatHistory, handleSendMessage]);

    const handleFileUpload = useCallback(async (file: File) => {
        if (!user || !selectedLawArea || !selectedTopic) return;
        setIsLoading(true);

        const userMessage: ChatMessage = { role: 'user', content: `[Przesłano dokument: ${file.name}]` };
        setChatHistory(prev => [...prev, userMessage]);

        try {
            const reader = new FileReader();
            reader.onload = async (ev) => {
                const textContent = ev.target?.result as string;
                const specializedPrompt = `
          SYSTEM: Użytkownik przesłał plik "${file.name}".
          TREŚĆ PLIKU:
          ---
          ${textContent.substring(0, 20000)} ... (truncated if key)
          ---
          Proszę o analizę tego dokumentu w kontekście sprawy. Potwierdź otrzymanie i streść kluczowe informacje.
        `;

                const historyForAI = [...chatHistory, userMessage, { role: 'user', content: specializedPrompt } as ChatMessage];
                await handleSendMessage(undefined, historyForAI, undefined);
            };
            reader.readAsText(file);
        } catch (err) {
            console.error(err);
            setIsLoading(false);
        }
    }, [user, selectedLawArea, selectedTopic, chatHistory, handleSendMessage]);

    const loadChatHistories = useCallback(async () => {
        if (!user || isLocalOnly) return [];
        try {
            const chatsColRef = collection(db, 'users', user.uid, 'chats');
            const querySnapshot = await getDocs(chatsColRef);
            const histories: { lawArea: LawArea; topic: string; interactionMode?: InteractionMode; servicePath?: 'pro' | 'standard'; lastUpdated?: any }[] = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const parts = doc.id.split('_');
                if (parts.length >= 2) {
                    const lawArea = parts[0] as LawArea;
                    const topic = parts.slice(1).join('_');
                    let interactionMode: InteractionMode | undefined = undefined;
                    if (data.interactionMode && Object.values(InteractionMode).includes(data.interactionMode)) {
                        interactionMode = data.interactionMode as InteractionMode;
                    } else if (data.messages && data.messages.length > 0 && data.messages[0].role === 'system') {
                        const systemMessage = data.messages[0].content;
                        const modeMatch = systemMessage.match(/Tryb: (.*)$/);
                        if (modeMatch && modeMatch[1]) {
                            const modeString = modeMatch[1].trim();
                            if (Object.values(InteractionMode).includes(modeString as InteractionMode)) {
                                interactionMode = modeString as InteractionMode;
                            }
                        }
                    }
                    histories.push({ lawArea, topic, interactionMode, servicePath: data.servicePath || 'standard', lastUpdated: data.lastUpdated });
                }
            });
            histories.sort((a, b) => {
                if (a.lastUpdated && b.lastUpdated) return b.lastUpdated.seconds - a.lastUpdated.seconds;
                if (a.lastUpdated) return -1;
                if (b.lastUpdated) return 1;
                const lawAreaCompare = a.lawArea.localeCompare(b.lawArea);
                if (lawAreaCompare !== 0) return lawAreaCompare;
                return a.topic.localeCompare(b.topic);
            });
            return histories;
        } catch (e) {
            console.error("Error loading chat histories:", e);
            return [];
        }
    }, [user]);

    const handleAddCost = useCallback(async (cost: number) => {
        if (!user) return;
        onAddCost(cost);
        if (!isLocalOnly) {
            await updateDoc(doc(db, 'users', user.uid), {
                totalCost: increment(cost)
            });
        }
    }, [user, onAddCost, isLocalOnly]);

    const handleExportChat = useCallback(() => {
        if (!selectedLawArea || !selectedTopic || !interactionMode || chatHistory.length === 0) {
            alert("Brak aktywnego czatu do wyeksportowania.");
            return;
        }

        const exportData: ExportedChat = {
            version: "1.0",
            lawArea: selectedLawArea,
            topic: selectedTopic,
            interactionMode: interactionMode,
            messages: chatHistory,
            exportedAt: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const safeTopic = selectedTopic.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        a.download = `asystent_ai_${safeTopic}_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, [selectedLawArea, selectedTopic, interactionMode, chatHistory]);

    const handleImportChat = useCallback(async (file: File, onSuccess: (data: ExportedChat) => void) => {
        setIsLoading(true);
        try {
            const text = await file.text();
            const data: ExportedChat = JSON.parse(text);

            if (!data.messages || !Array.isArray(data.messages) || !data.lawArea || !data.topic) {
                throw new Error("Nieprawidłowy format pliku kopii zapasowej.");
            }

            // Restore history
            const restoredHistory = data.messages;
            setChatHistory(restoredHistory);

            // Notify caller to update navigation
            onSuccess(data);

            // Priming message to Gemini
            const primingPrompt = `
                [SYSTEM: IMPORT HISTORII]
                Użytkownik właśnie wczytał historię rozmowy z pliku zewnętrznego.
                TEMAT: ${data.topic} (${data.lawArea})
                TRYB: ${data.interactionMode}

                TWOJE ZADANIE: Zapoznaj się z powyższą historią wiadomości. Potwierdź użytkownikowi, że jesteś gotowy do kontynuacji sprawy na podstawie wczytanych danych. Streść krótko ostatni etap rozmowy, aby użytkownik wiedział, że masz kontekst.
            `;

            const historyWithPriming = [...restoredHistory, { role: 'user', content: primingPrompt } as ChatMessage];

            // We call handleSendMessage with the full history and priming prompt
            // Note: handleSendMessage will save to Firestore if not localOnly
            await handleSendMessage(undefined, historyWithPriming, {
                lawArea: data.lawArea,
                topic: data.topic,
                interactionMode: data.interactionMode
            });

        } catch (err: any) {
            console.error("Import error:", err);
            alert("Błąd podczas importu: " + err.message);
        } finally {
            setIsLoading(false);
        }
    }, [handleSendMessage]);

    return {
        chatHistory, setChatHistory,
        currentMessage, setCurrentMessage,
        legalArticles, setLegalArticles,
        isLoading, setIsLoading,
        isDeepThinkingEnabled, setIsDeepThinkingEnabled,
        handleSendMessage,
        handleSelectCourtRole,
        handleGenerateKnowledge,
        handleFileUpload,
        loadChatHistories,
        handleAddCost,
        handleExportChat,
        handleImportChat
    };
};
