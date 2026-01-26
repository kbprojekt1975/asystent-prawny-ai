import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { collection, query, orderBy, onSnapshot, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { LawArea, InteractionMode, CaseDocument, ChatMessage, CourtRole } from '../types';
import { getLegalAdvice } from '../services/geminiService';
import { uploadCaseDocument, deleteCaseDocument } from '../services/storageService';

export enum ProStep {
    Documents = 'docs',
    Interview = 'interview',
    Analysis = 'analysis',
    Court = 'court',
    Notes = 'notes'
}

interface UseProDashboardProps {
    userId: string;
    chatId: string | null;
    lawArea: LawArea;
    topic: string;
}

export const useProDashboard = ({ userId, chatId, lawArea, topic }: UseProDashboardProps) => {
    const [activeStep, setActiveStep] = useState<ProStep | null>(null);
    const [documents, setDocuments] = useState<CaseDocument[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [stepStatus, setStepStatus] = useState({
        [ProStep.Documents]: 'idle',
        [ProStep.Interview]: 'idle',
        [ProStep.Analysis]: 'idle',
        [ProStep.Court]: 'idle'
    });
    const [courtRole, setCourtRole] = useState<CourtRole | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [currentInput, setCurrentInput] = useState('');
    const { i18n } = useTranslation();

    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if ((activeStep === ProStep.Interview || activeStep === ProStep.Analysis || activeStep === ProStep.Court) && scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, activeStep]);

    useEffect(() => {
        if (!userId || !chatId) return;

        const q = query(
            collection(db, 'users', userId, 'chats', chatId, 'documents'),
            orderBy('uploadedAt', 'desc')
        );

        const unsubDocs = onSnapshot(q, (snapshot) => {
            const docs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as CaseDocument));
            setDocuments(docs);
        });

        const unsubChat = onSnapshot(doc(db, 'users', userId, 'chats', chatId), (snap) => {
            if (snap.exists()) {
                const data = snap.data();
                if (data.proStatus) setStepStatus(data.proStatus);
                if (data.messages) setMessages(data.messages);
            }
        });

        return () => {
            unsubDocs();
            unsubChat();
        };
    }, [userId, chatId]);

    const cleanAiResponse = (text: string) => {
        return text.replace(/```[a-z]*\s*(\.\.\.|\s*)*```\s*$/gi, '').trim();
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, party: 'mine' | 'opposing') => {
        const file = event.target.files?.[0];
        if (!file || !userId || !chatId) return;

        setIsLoading(true);
        try {
            await uploadCaseDocument(userId, chatId, file, party);
        } catch (err) {
            console.error('Error uploading document:', err);
        } finally {
            setIsLoading(false);
            if (event.target) event.target.value = '';
        }
    };

    const handleDeleteDoc = async (docObj: CaseDocument) => {
        if (!userId || !chatId) return;
        setIsLoading(true);
        try {
            await deleteCaseDocument(userId, chatId, docObj.id, docObj.path);
        } catch (err) {
            console.error('Error deleting document:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleNoDocs = async () => {
        if (!chatId) return;
        const hasHistory = messages.filter(m => m.role !== 'system').length > 0;
        setIsLoading(true);
        try {
            if (hasHistory) {
                const prompt = `[SYSTEM PRO: KONTYNUACJA WYWIADU]
                Przeanalizuj dotychczasową rozmowę o temacie: ${topic}.
                Przedstaw konkretne podsumowanie faktów, które już ustaliliśmy.
                Następnie zadaj 2-3 najważniejsze pytania uzupełniające, które pomogą Ci zbudować kompletną strategię prawną.
                Twoja odpowiedź otwiera Etap 2: Wywiad Strategiczny. Bądź bardzo konkretny i profesjonalny.`;

                const aiRes = await getLegalAdvice(
                    [...messages, { role: 'user', content: prompt }],
                    lawArea,
                    InteractionMode.StrategicAnalysis,
                    topic,
                    true,
                    undefined,
                    chatId,
                    i18n.language
                );

                const cleanedText = cleanAiResponse(aiRes.text);
                const newMessages: ChatMessage[] = [
                    ...messages,
                    { role: 'user', content: "Kontynuujmy wywiad strategiczny w trybie PRO." },
                    { role: 'model', content: cleanedText }
                ];

                await setDoc(doc(db, 'users', userId, 'chats', chatId), {
                    messages: newMessages,
                    proStatus: { ...stepStatus, [ProStep.Documents]: 'completed' },
                    lastUpdated: serverTimestamp(),
                    servicePath: 'pro'
                }, { merge: true });

                setMessages(newMessages);
                setStepStatus(prev => ({ ...prev, [ProStep.Documents]: 'completed' }));
                setActiveStep(ProStep.Interview);
                return;
            }

            const initialHistory: ChatMessage[] = [
                { role: 'user', content: "Nie mam dokumentów - chcę opowiedzieć o sprawie." },
                { role: 'model', content: "Mamy to. Przejdźmy od razu do rozmowy. Opisz mi, proszę, ze swojej perspektywy: co się wydarzyło, jakie są Twoje cele i co Cię najbardziej niepokoi? Na tej podstawie przygotuję dla Ciebie dalsze pytania i wspólnie zbudujemy strategię." }
            ];

            await setDoc(doc(db, 'users', userId, 'chats', chatId), {
                messages: initialHistory,
                proStatus: { ...stepStatus, [ProStep.Documents]: 'completed' },
                lastUpdated: serverTimestamp(),
                servicePath: 'pro'
            }, { merge: true });

            setMessages(initialHistory);
            setStepStatus(prev => ({ ...prev, [ProStep.Documents]: 'completed' }));
            setActiveStep(ProStep.Interview);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAnalyzeDocs = async () => {
        if (!chatId || documents.length === 0) return;
        setIsLoading(true);
        try {
            const myDocs = documents.filter(d => d.party === 'mine' || !d.party).map(d => d.name).join(', ');
            const opposingDocs = documents.filter(d => d.party === 'opposing').map(d => d.name).join(', ');

            const prompt = `[SYSTEM PRO: ANALIZA DOKUMENTÓW]
            Temat sprawy: ${topic}.
            
            W tej sprawie załadowano następujące dokumenty:
            - MOJE DOKUMENTY: ${myDocs || 'brak'}
            - DOKUMENTY STRONY PRZECIWNEJ: ${opposingDocs || 'brak'}
            
            TWOJE ZADANIE:
            1. Przeanalizuj treść tych plików (dostępną w Twojej bazie wiedzy dla tego czatu).
            2. Przedstaw konkretne podsumowanie tego, co już udało się ustalić, z wyraźnym rozróżnieniem na to, co wiemy od nas, a co od przeciwnika.
            3. Na tej podstawie zadaj 2-3 najważniejsze pytania uzupełniające, które pomogą Ci przygotować strategię.
            
            Twoja odpowiedź otwiera Etap 2: Wywiad Strategiczny. Bądź profesjonalny i konkretny.`;

            const aiRes = await getLegalAdvice(
                [...messages, { role: 'user', content: prompt }],
                lawArea,
                InteractionMode.StrategicAnalysis,
                topic,
                true,
                undefined,
                chatId,
                i18n.language
            );

            const cleanedText = cleanAiResponse(aiRes.text);
            const newMessages: ChatMessage[] = [
                ...messages,
                { role: 'user', content: "Oto moje dokumenty. Proszę o ich analizę i rozpoczęcie wywiadu strategicznego." },
                { role: 'model', content: cleanedText }
            ];

            await setDoc(doc(db, 'users', userId, 'chats', chatId), {
                messages: newMessages,
                proStatus: { ...stepStatus, [ProStep.Documents]: 'completed' },
                lastUpdated: serverTimestamp(),
                servicePath: 'pro'
            }, { merge: true });

            setStepStatus(prev => ({ ...prev, [ProStep.Documents]: 'completed' }));
            setMessages(newMessages);
            setActiveStep(ProStep.Interview);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendMessage = async (isDeepThinkingEnabled: boolean = false) => {
        if (!currentInput.trim() || !chatId || isLoading) return;
        const msg = currentInput;
        setCurrentInput('');
        setIsLoading(true);

        try {
            const newHistory: ChatMessage[] = [...messages, { role: 'user', content: msg }];
            setMessages(newHistory);

            const modeToUse = activeStep === ProStep.Court ? InteractionMode.Court : InteractionMode.StrategicAnalysis;

            const aiRes = await getLegalAdvice(
                newHistory,
                lawArea,
                modeToUse,
                topic,
                isDeepThinkingEnabled,
                undefined,
                chatId,
                i18n.language
            );

            const cleanedText = cleanAiResponse(aiRes.text);
            const finalHistory = [...newHistory, { role: 'model', content: cleanedText }];

            await setDoc(doc(db, 'users', userId, 'chats', chatId), {
                messages: finalHistory,
                lastUpdated: serverTimestamp(),
                servicePath: 'pro'
            }, { merge: true });

        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectCourtRole = async (role: CourtRole) => {
        if (!userId || !chatId) return;
        setCourtRole(role);
        setIsLoading(true);

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

        const systemContent = `[SYSTEM PRO: SYMULACJA SĄDOWA]
        Rozpoczynamy symulację w Trybie Sądowym.
        Specjalizacja: ${lawArea}. Temat: ${topic}.
        ${roleInstructions}
        
        WAŻNE: Wykorzystaj całą dotychczasową wiedzę o sprawie zapisaną w historii czatu powyżej, w tym zgromadzone dokumenty i wyniki analizy strategicznej. Zachowaj pełną powagę i realizm symulacji.`;

        let greeting = "";
        if (role === CourtRole.MyAttorney) greeting = "Dzień dobry. Jestem Twoim pełnomocnikiem. Przeanalizowałem dotychczasowe informacje oraz raport strategiczny. Musimy przygotować się do rozprawy. Czy możemy przejść do pytań, które mogą paść na sali?";
        if (role === CourtRole.Judge) greeting = "Sąd otwiera posiedzenie. Na podstawie zebranego materiału dowodowego i analizy sytuacyjnej, przystępujemy do przesłuchania. Proszę podejść do barierki. Czy jest Pan/Pani gotowy/a do złożenia zeznań?";
        if (role === CourtRole.OpposingAttorney) greeting = "Witam. Reprezentuję stronę przeciwną. Zapoznałem się z Pana/Pani wersją wydarzeń oraz aktami sprawy. Mam do Pana/Pani kilka pytań.";
        if (role === CourtRole.Prosecutor) greeting = "Prokuratura Rejonowa. Analiza akt i dowodów została zakończona. Przystępujemy do czynności procesowych. Czy podtrzymuje Pan/Pani swoje dotychczasowe wyjaśnienia?";

        const newMessages: ChatMessage[] = [
            ...messages,
            { role: 'system', content: systemContent },
            { role: 'user', content: `[SYSTEM: Rozpocznij symulację w roli: ${role}]` },
            { role: 'model', content: greeting }
        ];

        try {
            await setDoc(doc(db, 'users', userId, 'chats', chatId), {
                messages: newMessages,
                proStatus: { ...stepStatus, [ProStep.Court]: 'completed' },
                lastUpdated: serverTimestamp()
            }, { merge: true });

            setMessages(newMessages);
            setStepStatus(prev => ({ ...prev, [ProStep.Court]: 'completed' }));
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerateAnalysis = async () => {
        if (!chatId) return;
        setIsLoading(true);
        try {
            const prompt = `[SYSTEM PRO: GENEROWANIE RAPORTU]
             Na podstawie zebranych dokumentów i wywiadu, przygotuj RAPORT STRATEGICZNY.
             Podziel raport na 4 wyraźne sekcje:
             1. MOCNE STRONY
             2. SŁABE STRONY
             3. SZANSE NA WYGRANĄ (szacunkowy %)
             4. OBSZARY ZAGROŻONE
             Użyj czytelnego formatowania markdown.`;

            const aiRes = await getLegalAdvice(
                [...messages, { role: 'user', content: prompt }],
                lawArea,
                InteractionMode.StrategicAnalysis,
                topic,
                true,
                undefined,
                chatId,
                i18n.language
            );

            const finalHistory: ChatMessage[] = [...messages, { role: 'user', content: "Generuj raport końcowy." }, { role: 'model', content: aiRes.text }];
            setMessages(finalHistory);

            await setDoc(doc(db, 'users', userId, 'chats', chatId), {
                messages: finalHistory,
                proStatus: { ...stepStatus, [ProStep.Analysis]: 'completed' },
                lastUpdated: serverTimestamp()
            }, { merge: true });

            setStepStatus(prev => ({ ...prev, [ProStep.Analysis]: 'completed' }));
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const finishInterview = async () => {
        if (!chatId) return;
        try {
            await setDoc(doc(db, 'users', userId, 'chats', chatId), {
                proStatus: { ...stepStatus, [ProStep.Interview]: 'completed' },
                lastUpdated: serverTimestamp()
            }, { merge: true });
            setStepStatus(prev => ({ ...prev, [ProStep.Interview]: 'completed' }));
            setActiveStep(null);
        } catch (err) {
            console.error(err);
        }
    };

    return {
        activeStep,
        setActiveStep,
        documents,
        isLoading,
        setIsLoading,
        stepStatus,
        setStepStatus,
        courtRole,
        setCourtRole,
        messages,
        currentInput,
        setCurrentInput,
        scrollRef,
        handleFileUpload,
        handleDeleteDoc,
        handleNoDocs,
        handleAnalyzeDocs,
        handleSendMessage,
        handleSelectCourtRole,
        handleGenerateAnalysis,
        finishInterview
    };
};
