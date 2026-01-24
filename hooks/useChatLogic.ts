import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { doc, updateDoc, setDoc, serverTimestamp, increment, collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { getLegalAdvice } from '../services/geminiService';
import { LawArea, ChatMessage, InteractionMode, UserProfile, SubscriptionStatus, CourtRole, ExportedChat, getChatId } from '../types';
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

const normalizeHistory = (history: ChatMessage[]): ChatMessage[] => {
    const alternating: ChatMessage[] = [];
    // Filter out system messages as they are handled separately by the backend
    const nonSystem = history.filter(m => m.role !== 'system');

    nonSystem.forEach((msg) => {
        if (alternating.length > 0 && alternating[alternating.length - 1].role === msg.role) {
            // Merge consecutive messages of the same role
            alternating[alternating.length - 1].content += "\n\n" + msg.content;
            if (msg.sources) {
                alternating[alternating.length - 1].sources = [
                    ...(alternating[alternating.length - 1].sources || []),
                    ...msg.sources
                ];
            }
        } else {
            alternating.push({ ...msg });
        }
    });
    return alternating;
};

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
    const { t, i18n } = useTranslation();

    const handleSelectCourtRole = useCallback((role: CourtRole) => {
        setCourtRole(role);

        if (!selectedTopic || !selectedLawArea) {
            // If no topic selected yet, just set the role and return.
            // The simulation will be triggered once the topic is loaded.
            return;
        }

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

        const systemContent = `${t('chat.court_mode.simulation_start')}
        ${t('dashboard.law_area')}: ${selectedLawArea}. ${t('dashboard.topic')}: ${selectedTopic}.
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
        if (role === CourtRole.MyAttorney) greeting = t('chat.court_mode.my_attorney');
        if (role === CourtRole.Judge) greeting = t('chat.court_mode.judge');
        if (role === CourtRole.OpposingAttorney) greeting = t('chat.court_mode.opposing_attorney');
        if (role === CourtRole.Prosecutor) greeting = t('chat.court_mode.prosecutor');

        if (greeting) {
            newMessages.push({ role: 'user', content: t('chat.court_mode.role_system_prefix', { role }) });
            newMessages.push({ role: 'model', content: greeting });
        }

        setChatHistory(newMessages);
    }, [selectedLawArea, selectedTopic, chatHistory, setCourtRole, setChatHistory]);

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
            ? getChatId(metadataOverride.lawArea, metadataOverride.topic, metadataOverride.interactionMode)
            : getChatId(effectiveLawArea!, effectiveTopic!, effectiveInteractionMode);

        const messageToSend = messageOverride || currentMessage.trim();
        if ((!messageToSend && !historyOverride) || !effectiveLawArea || !effectiveTopic || !effectiveInteractionMode || (isLoading && !historyOverride) || !user || !effectiveChatId) return;

        // Use current history or the override provided
        const currentHistory = historyOverride || chatHistory;

        let newHistory = [...currentHistory];

        // Ensure the hidden prompt (messageOverride) is appended to the history sent to AI
        if (messageOverride) {
            newHistory.push({ role: 'user', content: messageOverride });
        }

        // Only append UI user message if it's not a technical override/history override
        if (!historyOverride && !messageOverride) {
            const userMessage: ChatMessage = { role: 'user', content: messageToSend };
            newHistory.push(userMessage);
            setChatHistory(newHistory.filter(m => m.role !== 'system'));
        } else if (historyOverride) {
            // When using historyOverride (e.g. specialized prompts), only show non-system messages in UI
            setChatHistory(historyOverride.filter(m => m.role !== 'system'));
        } else if (messageOverride) {
            // If it's just a technical override message, keep UI as is (newHistory already has it for AI)
            setChatHistory(currentHistory.filter(m => m.role !== 'system'));
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
            // Save messages (FILTERING out system instructions from permanent record)
            if (!isLocalOnly) {
                const chatId = effectiveChatId;
                const historyToSave = newHistory.filter(m => m.role !== 'system');
                await setDoc(doc(db, 'users', user.uid, 'chats', chatId), {
                    messages: historyToSave,
                    lastUpdated: serverTimestamp(),
                    lawArea: effectiveLawArea,
                    topic: effectiveTopic, // Preserve original topic title
                    interactionMode: effectiveInteractionMode,
                    servicePath: metadataOverride?.servicePath || (chatHistories.filter(h => h.lawArea === effectiveLawArea).find(h => {
                        return getChatId(h.lawArea, h.topic) === getChatId(effectiveLawArea, effectiveTopic);
                    })?.servicePath) || 'standard'
                }, { merge: true });
            }

            const normalizedHistoryForAI = normalizeHistory(newHistory);

            const aiResponse = await getLegalAdvice(
                normalizedHistoryForAI,
                effectiveLawArea,
                effectiveInteractionMode,
                effectiveTopic,
                isDeepThinkingEnabled,
                articlesToPass,
                effectiveChatId, // Użycie ujednoliconego ID
                i18n.language // Pass current language
            );

            // Sanitize response to prevent "undefined" values in Firestore
            const aiMessage: ChatMessage = { role: 'model', content: aiResponse.text };
            if (aiResponse.sources) {
                aiMessage.sources = aiResponse.sources;
            }

            // Determine follow-up options - ONLY if user has already interacted (real familiarization)
            // History check: 1st user msg is hidden greeting, 2nd is real user input.
            const userMsgCount = newHistory.filter(m => m.role === 'user').length;
            if (userMsgCount >= 2) {
                const options: InteractionMode[] = [];
                const lowText = aiResponse.text.toLowerCase();
                if (lowText.includes('pismo') || lowText.includes('wniosek') || lowText.includes('pozew')) options.push(InteractionMode.Document);
                if (lowText.includes('szkolenie') || lowText.includes('nauczyć')) options.push(InteractionMode.LegalTraining);
                if (lowText.includes('sąd') || lowText.includes('rozpraw')) options.push(InteractionMode.Court);
                if (lowText.includes('ugod') || lowText.includes('negocjacj')) options.push(InteractionMode.Negotiation);

                if (options.length > 0) {
                    aiMessage.followUpOptions = options;
                }
            }

            // Final history for UI and storage should NOT include the technical system instructions
            const finalHistory = [...newHistory.filter(m => m.role !== 'system'), aiMessage];
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
                    topic: effectiveTopic, // This is the original title
                    interactionMode: effectiveInteractionMode,
                    servicePath: metadataOverride?.servicePath || (chatHistories.filter(h => h.lawArea === effectiveLawArea).find(h => {
                        return getChatId(h.lawArea, h.topic) === getChatId(effectiveLawArea, effectiveTopic);
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
      # ZADANIE: BUDOWA BAZY WIEDZY DLA SPRAWY (INTERAKTYWNA)
      Użytkownik prosi o przygotowanie merytoryczne do sprawy: "${selectedTopic}".

      # INSTRUKCJA ODPOWIEDZI (BARDZO WAŻNE):
      1. NIE wypisuj punktów tej instrukcji w odpowiedzi dla użytkownika.
      2. Rozpocznij odpowiedź od profesjonalnego potwierdzenia: "Zrozumiałem zadanie. Przystępuję do analizy i budowy bazy wiedzy dla Twojej sprawy."
      3. Następnie przejdź do realizacji poniższych kroków.

      # TWOJE KROKI:
      1. **Analiza i Wywiad (PRIORYTET)**:
         - Sprawdź dotychczasowy przebieg rozmowy (HISTORIA).
         - Jeśli informacje są zbyt ogólne, ZADAJ 1-2 konkretne pytania wywiadu (np. o kluczowe daty, okoliczności). 
         - NIE przechodź do punktu 2, dopóki nie będziesz mieć wystarczającego kontekstu do precyzyjnego szukania wyroków.

      2. **Pobieranie Wiedzy (Gdy kontekst jest jasny)**:
         - Znajdź 1-3 kluczowe akty prawne (użyj 'search_legal_acts') i zapisz ich ('add_act_to_topic_knowledge').
         - Znajdź podobne i niedawne wyroki sądowe (użyj 'search_court_rulings').
         - WYBIERZ MAKSYMALNIE 5 najtrafniejszych wyroków i zapisz je ('add_ruling_to_topic_knowledge').

      # REGUŁY:
      - Zgoda na TRWAŁE zapisanie została udzielona.
      - UNIKAJ DUPLIKATÓW: Nie zapisuj aktów/wyroków, które widzisz w "EXISTING TOPIC KNOWLEDGE".
      - Jeśli już masz wystarczająco dużo danych w bazie (pobrano wyroki i ustawy), wyświetl podsumowanie.
      - PAMIĘTAJ O LIMITACH: Maksymalnie 5 wyroków na jedną turę.

      Na koniec wyświetl status: "Zaktualizowano Bazę Wiedzy sprawy. Dodano [lista aktów] oraz [liczba] wyroków." lub poproś o więcej danych.
    `;

        const historyForAI = [...chatHistory, userMessage, { role: 'system', content: specializedPrompt } as ChatMessage];
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

                const historyForAI = [...chatHistory, userMessage, { role: 'system', content: specializedPrompt } as ChatMessage];
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
            const histories: { lawArea: LawArea; topic: string; interactionMode?: InteractionMode; servicePath?: 'pro' | 'standard'; lastUpdated?: any; docCount?: number }[] = [];

            // Collect all promises to fetch metadata for each chat concurrently
            const historyPromises = querySnapshot.docs.map(async (chatDoc) => {
                const data = chatDoc.data();
                const parts = chatDoc.id.split('_');
                if (parts.length >= 2) {
                    const lawArea = (data.lawArea || parts[0]) as LawArea;
                    const topic = data.topic || parts.slice(1).join('_'); // Prefer data.topic which is the original title

                    // Fetch document count
                    let docCount = 0;
                    try {
                        const docsRef = collection(db, 'users', user.uid, 'chats', chatDoc.id, 'documents');
                        const docsSnap = await getDocs(docsRef);
                        docCount = docsSnap.size;
                    } catch (err) {
                        console.warn(`Could not fetch doc count for ${chatDoc.id}`, err);
                    }

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
                    return { lawArea, topic, interactionMode, servicePath: data.servicePath || 'standard', lastUpdated: data.lastUpdated, docCount };
                }
                return null;
            });

            const results = await Promise.all(historyPromises);
            results.forEach(res => {
                if (res) histories.push(res);
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

    const handleInitialGreeting = useCallback(async (lawArea: LawArea, topic: string, mode: InteractionMode) => {
        if (!user) return;
        setIsLoading(true);

        // Reset history to only the system prompt first
        const systemPrompt = `Specjalizacja: ${lawArea}. Temat: ${topic}. Tryb: ${mode}`;
        const initialHistory: ChatMessage[] = [{ role: 'system', content: systemPrompt }];
        setChatHistory(initialHistory);

        // Define a hidden prompt that forces the AI to introduce itself and ask for details
        const greetingPrompt = `[SYSTEM: POWITANIE NOWEJ SPRAWY - TRYB ${mode}]
        Użytkownik właśnie rozpoczął nową sprawę: "${topic}".
        TWOJE ZADANIE:
        1. Przedstaw się krótko (np. jako Ekspert ds. Pism, Strateg Procesowy itp. zależnie od trybu).
        2. Wyjaśnij konkretnie, jak pomożesz w tym trybie.
        3. Wypisz listę informacji lub dokumentów, których będziesz potrzebować, aby przygotować najlepszą pomoc.
        4. Zadaj 1-2 konkretne pytania na start, aby użytkownik mógł od razu opisać swoją sytuację.
        
        SKUP SIĘ WYŁĄCZNIE NA OBECNYM TRYBIE (${mode}). Nie sugeruj innych asystentów ani zmiany trybu pracy w trakcie rozmowy.
        Pisz proaktywnie, profesjonalnie i z empatią. Nie używaj ogólników.`;

        // Send this to AI - This will generate the model greeting and save to Firestore
        await handleSendMessage(greetingPrompt, initialHistory, {
            lawArea,
            topic,
            interactionMode: mode,
            servicePath: 'standard'
        });
    }, [user, handleSendMessage]);

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
        handleImportChat,
        handleInitialGreeting
    };
};
