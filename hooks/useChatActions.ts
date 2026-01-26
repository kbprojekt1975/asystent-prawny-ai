import React, { useCallback } from 'react';
import { LawArea, InteractionMode, ChatMessage, ExportedChat } from '../types';

interface UseChatActionsProps {
    setChatHistory: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
    setIsLoading: (val: boolean) => void;
    handleSendMessage: (
        messageOverride?: string,
        historyOverride?: ChatMessage[],
        metadataOverride?: { lawArea: LawArea, topic: string, interactionMode: InteractionMode, servicePath?: 'pro' | 'standard' }
    ) => Promise<void>;
    selectedLawArea: LawArea | null;
    selectedTopic: string | null;
    chatHistory: ChatMessage[];
    interactionMode: InteractionMode | null;
}

export const useChatActions = ({
    setChatHistory,
    setIsLoading,
    handleSendMessage,
    selectedLawArea,
    selectedTopic,
    chatHistory,
    interactionMode
}: UseChatActionsProps) => {

    const handleGenerateKnowledge = useCallback(async () => {
        if (!selectedLawArea || !selectedTopic) return;
        setIsLoading(true);

        const userMessage: ChatMessage = { role: 'user', content: "Generuj Bazę Wiedzy dla tej sprawy." };
        setChatHistory(prev => [...prev, userMessage]);

        const specializedPrompt = `
      # ZADANIE: BUDOWA BAZY WIEDZY DLA SPRAWY (INTERAKTYWNA)
      Użytkownik prosi o przygotowanie merytoryczne do sprawy: "${selectedTopic}".

      # TWOJE KROKI:
      1. Analiza i Wywiad (PRIORYTET)
      2. Pobieranie Wiedzy (Gdy kontekst jest jasny - szukanie wyroków i ustaw)
      
      Zasady: Maksymalnie 5 wyroków na jedną turę.
    `;

        const historyForAI = [...chatHistory, userMessage, { role: 'system', content: specializedPrompt } as ChatMessage];
        await handleSendMessage(undefined, historyForAI, undefined);
    }, [selectedLawArea, selectedTopic, chatHistory, handleSendMessage, setChatHistory, setIsLoading]);

    const handleFileUpload = useCallback(async (file: File) => {
        if (!selectedLawArea || !selectedTopic) return;
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
          ${textContent.substring(0, 20000)}
          ---
          Analizuj ten dokument i streść kluczowe informacje.
        `;

                const historyForAI = [...chatHistory, userMessage, { role: 'system', content: specializedPrompt } as ChatMessage];
                await handleSendMessage(undefined, historyForAI, undefined);
            };
            reader.readAsText(file);
        } catch (err) {
            console.error(err);
            setIsLoading(false);
        }
    }, [selectedLawArea, selectedTopic, chatHistory, handleSendMessage, setChatHistory, setIsLoading]);

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

            setChatHistory(data.messages);
            onSuccess(data);

            const primingPrompt = `
                [SYSTEM: IMPORT HISTORII]
                Użytkownik właśnie wczytał historię rozmowy.
                TEMAT: ${data.topic}
                TRYB: ${data.interactionMode}
                TWOJE ZADANIE: Zapoznaj się z historią i potwierdź gotowość do kontynuacji.
            `;

            const historyWithPriming = [...data.messages, { role: 'user', content: primingPrompt } as ChatMessage];

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
    }, [handleSendMessage, setChatHistory, setIsLoading]);

    return {
        handleGenerateKnowledge,
        handleFileUpload,
        handleExportChat,
        handleImportChat
    };
};
