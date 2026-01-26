import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { LawArea, InteractionMode, ChatMessage, CourtRole } from '../types';

interface UseChatModesProps {
    setChatHistory: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
    handleSendMessage: (
        messageOverride?: string,
        historyOverride?: ChatMessage[],
        metadataOverride?: { lawArea: LawArea, topic: string, interactionMode: InteractionMode, servicePath?: 'pro' | 'standard' }
    ) => Promise<void>;
    selectedLawArea: LawArea | null;
    selectedTopic: string | null;
    setCourtRole: (role: CourtRole | null) => void;
}

export const useChatModes = ({
    setChatHistory,
    handleSendMessage,
    selectedLawArea,
    selectedTopic,
    setCourtRole
}: UseChatModesProps) => {
    const { t } = useTranslation();

    const handleInitialGreeting = useCallback(async (lawArea: LawArea, topic: string, mode: InteractionMode, initialDescription?: string) => {
        const systemPrompt = `Specjalizacja: ${lawArea}. Temat: ${topic}. Tryb: ${mode}`;
        const initialHistory: ChatMessage[] = [{ role: 'system', content: systemPrompt }];
        setChatHistory(initialHistory);

        const greetingPrompt = `[SYSTEM: POWITANIE NOWEJ SPRAWY - TRYB ${mode}]
        Użytkownik właśnie rozpoczął nową sprawę: "${topic}".
        ${initialDescription ? `OPIS SPRAWY OD UŻYTKOWNIKA: "${initialDescription}"` : ""}
        
        TWOJE ZADANIE:
        1. Zapoznaj się z powyższym opisem (jeśli podano) i tematem.
        2. Jeśli podano opis: Napisz profesjonalne podsumowanie tego, co już wiesz o sprawie (fakty, strony, kluczowy problem) i zapytaj o to czego potrzeba.
        3. Jeśli NIE podano opisu: Przedstaw się krótko i wyjaśnij swoją rolę.
        4. Wyjaśnij konkretnie, jak pomożesz w tym trybie (${mode}) w TEJ konkretnej sytuacji.
        5. Wypisz listę DODATKOWYCH informacji lub dokumentów, których będziesz potrzebować, aby przygotować najlepszą pomoc.
        6. Zadaj 1-2 konkretne pytania na start, aby użytkownik mógł od razu doprecyzować sytuację.
        
        SKUP SIĘ WYŁĄCZNIE NA OBECNYM TRYBIE (${mode}). Nie sugeruj innych asystentów ani zmiany trybu pracy.
        Pisz proaktywnie, profesjonalnie i z empatią. Nie używaj ogólników.`;

        await handleSendMessage(greetingPrompt, initialHistory, {
            lawArea,
            topic,
            interactionMode: mode,
            servicePath: 'standard'
        });
    }, [handleSendMessage, setChatHistory]);

    const handleSelectCourtRole = useCallback((role: CourtRole, currentHistory: ChatMessage[]) => {
        setCourtRole(role);

        if (!selectedTopic || !selectedLawArea) return;

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

        const newMessages: ChatMessage[] = [...currentHistory];
        newMessages.push({ role: 'system', content: systemContent });

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
    }, [selectedLawArea, selectedTopic, setCourtRole, setChatHistory, t]);

    return {
        handleInitialGreeting,
        handleSelectCourtRole
    };
};
