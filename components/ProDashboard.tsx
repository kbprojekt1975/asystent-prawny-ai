import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { collection, query, orderBy, onSnapshot, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { LawArea, InteractionMode, CaseDocument, ChatMessage } from '../types';
import { getLegalAdvice } from '../services/geminiService';
import { uploadCaseDocument, deleteCaseDocument } from '../services/storageService';
import {
    DocumentTextIcon,
    UserGroupIcon,
    UserIcon,
    TrashIcon,
    ScaleIcon,
    CheckIcon,
    ChevronRightIcon,
    ArrowLeftIcon,
    PlusIcon,
    BriefcaseIcon,
    MagicWandIcon,
    ClockIcon,
    ExternalLinkIcon,
    SendIcon,
    ArrowsExpandIcon,
    ArrowsContractIcon,
    DocumentDuplicateIcon,
    GavelIcon
} from './Icons';
import { InfoIcon } from './InfoIcon';
import HelpModal from './HelpModal';
import ChatBubble from './ChatBubble';
import NotesWidget from './NotesWidget';
import CourtRoleSelector from './CourtRoleSelector';
import { CourtRole } from '../types';

interface ProDashboardProps {
    userId: string;
    chatId: string | null;
    lawArea: LawArea;
    topic: string;
    onBack: () => void;
    isFullScreen?: boolean;
    setIsFullScreen?: (val: boolean) => void;
    isDeepThinkingEnabled?: boolean;
    setIsDeepThinkingEnabled?: (val: boolean) => void;
    onAddNote?: (content: string, linkedMsg?: string, noteId?: string, linkedRole?: 'user' | 'model' | 'system') => void;
    onDeleteNote?: (noteId: string) => void;
    onUpdateNotePosition?: (noteId: string, position: { x: number, y: number } | null) => void;
    existingNotes?: any[];
}

enum ProStep {
    Documents = 'docs',
    Interview = 'interview',
    Analysis = 'analysis',
    Court = 'court',
    Notes = 'notes'
}

const ProDashboard: React.FC<ProDashboardProps> = ({
    userId,
    chatId,
    lawArea,
    topic,
    onBack,
    isFullScreen = false,
    setIsFullScreen,
    isDeepThinkingEnabled = false,
    setIsDeepThinkingEnabled,
    onAddNote,
    onDeleteNote,
    onUpdateNotePosition,
    existingNotes
}) => {
    const [activeStep, setActiveStep] = useState<ProStep | null>(null);
    const [documents, setDocuments] = useState<CaseDocument[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isAddingNoteId, setIsAddingNoteId] = useState<number | null>(null);
    const [noteContent, setNoteContent] = useState('');
    const [stepStatus, setStepStatus] = useState({
        [ProStep.Documents]: 'idle',
        [ProStep.Interview]: 'idle',
        [ProStep.Analysis]: 'idle',
        [ProStep.Court]: 'idle'
    });
    const [courtRole, setCourtRole] = useState<CourtRole | null>(null);
    const [isHelpOpen, setIsHelpOpen] = useState(false);
    const { t, i18n } = useTranslation();

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [currentInput, setCurrentInput] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);
    const mineInputRef = useRef<HTMLInputElement>(null);
    const opposingInputRef = useRef<HTMLInputElement>(null);

    // Scroll chat to bottom when messages change
    useEffect(() => {
        if ((activeStep === ProStep.Interview || activeStep === ProStep.Analysis) && scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, activeStep]);

    // Load documents and status from Firestore
    useEffect(() => {
        if (!userId || !chatId) return;

        // Listen for documents in this specific chat
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

        // Listen for chat state and progress
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
        // Usuwanie pustych lub placeholderowych bloków kodu na końcu (np. ```text ... ```)
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
            if (event.target) event.target.value = ''; // Reset input
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
                // Jeśli mamy historię, poproś AI o podsumowanie stanowiące wstęp do PRO
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

            // Czysty start bez historii
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
            // Przejdź od razu do wywiadu, aby użytkownik widział podsumowanie i pytania
            setActiveStep(ProStep.Interview);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendMessage = async () => {
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
                true,
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

            const finalHistory = [...messages, { role: 'user', content: "Generuj raport końcowy." }, { role: 'model', content: aiRes.text }];

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

    const handleAddNote = async (content: string) => {
        if (!userId || !chatId) return;
        try {
            const notesRef = collection(db, 'users', userId, 'chats', chatId, 'notes');
            const noteId = `note_${Date.now()}`;
            await setDoc(doc(notesRef, noteId), {
                content: `Z analizy PRO: ${content}`,
                createdAt: serverTimestamp()
            });
            alert("Dodano notatkę z analizy.");
        } catch (e) {
            console.error("Error adding note:", e);
        }
    };

    // Sub-view: Step 1 - Documents
    if (activeStep === ProStep.Documents) {
        return (
            <div className="flex flex-col h-full bg-slate-900 text-white p-6 overflow-y-auto">
                <button
                    onClick={() => setActiveStep(null)}
                    className="flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors self-start"
                >
                    <ArrowLeftIcon className="w-5 h-5" />
                    <span>{t('pro.dashboard.back_to_dashboard')}</span>
                </button>
                <div className="max-w-4xl mx-auto w-full pb-10">
                    <div className="flex items-center justify-between mb-2">
                        <h1 className="text-3xl font-bold">{t('pro.dashboard.load_docs_title')}</h1>
                        <InfoIcon onClick={() => setIsHelpOpen(true)} />
                    </div>
                    <p className="text-slate-400 mb-8">{t('pro.dashboard.load_docs_desc')}</p>

                    {/* Wstępny wywiad (Preliminary Context) */}
                    {messages.filter(m => m.role !== 'system').length > 0 && (
                        <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="h-px flex-1 bg-slate-800"></div>
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">{t('pro.dashboard.preliminary_interview_label')}</span>
                                <div className="h-px flex-1 bg-slate-800"></div>
                            </div>
                            <div className="flex justify-center">
                                <button
                                    onClick={handleNoDocs}
                                    disabled={isLoading}
                                    className="bg-violet-600/20 text-violet-400 border border-violet-500/30 px-8 py-4 rounded-2xl font-bold hover:bg-violet-600/30 transition-all flex items-center gap-3 group shadow-xl shadow-violet-900/10 disabled:opacity-50"
                                >
                                    {isLoading ? (
                                        <div className="w-5 h-5 border-2 border-violet-400/20 border-t-violet-400 rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            <span>{t('pro.dashboard.continue_interview')}</span>
                                            <ChevronRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        {/* Moje Dokumenty */}
                        <div
                            className="bg-slate-800/40 border-2 border-dashed border-violet-500/30 rounded-3xl p-8 text-center hover:border-violet-500/60 transition-all group"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                                e.preventDefault();
                                const file = e.dataTransfer.files[0];
                                if (file) handleFileUpload({ target: { files: [file] } } as any, 'mine');
                            }}
                        >
                            <UserIcon className="w-12 h-12 text-violet-400/50 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                            <h3 className="font-bold mb-1">{t('pro.dashboard.my_docs')}</h3>
                            <p className="text-slate-500 text-xs mb-4">{t('pro.dashboard.my_docs_desc')}</p>
                            <input
                                type="file"
                                ref={mineInputRef}
                                className="hidden"
                                onChange={(e) => handleFileUpload(e, 'mine')}
                            />
                            <button
                                onClick={() => mineInputRef.current?.click()}
                                className="bg-violet-600/20 text-violet-400 border border-violet-500/30 px-4 py-2 rounded-xl text-xs font-bold hover:bg-violet-600/30 transition-all"
                            >
                                {t('pro.dashboard.select_files')}
                            </button>
                        </div>

                        {/* Dokumenty Przeciwnika */}
                        <div
                            className="bg-slate-800/40 border-2 border-dashed border-slate-700 rounded-3xl p-8 text-center hover:border-slate-500/60 transition-all group"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                                e.preventDefault();
                                const file = e.dataTransfer.files[0];
                                if (file) handleFileUpload({ target: { files: [file] } } as any, 'opposing');
                            }}
                        >
                            <UserGroupIcon className="w-12 h-12 text-slate-600 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                            <h3 className="font-bold mb-1">{t('pro.dashboard.opposing_docs')}</h3>
                            <p className="text-slate-500 text-xs mb-4">{t('pro.dashboard.opposing_docs_desc')}</p>
                            <input
                                type="file"
                                ref={opposingInputRef}
                                className="hidden"
                                onChange={(e) => handleFileUpload(e, 'opposing')}
                            />
                            <button
                                onClick={() => opposingInputRef.current?.click()}
                                className="bg-slate-700/50 text-slate-400 border border-slate-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-300 hover:text-slate-900 transition-all"
                            >
                                {t('pro.dashboard.select_files')}
                            </button>
                        </div>
                    </div>

                    <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-slate-300">{t('pro.dashboard.loaded_files')} ({documents.length})</h3>
                        </div>
                        <div className="flex flex-col gap-2">
                            {documents.length > 0 ? (
                                documents.map(doc => (
                                    <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-900/50 border border-slate-700/30 rounded-xl group hover:border-violet-500/30 transition-all">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className={`p-1.5 rounded-lg ${doc.party === 'opposing' ? 'bg-slate-700 text-slate-400' : 'bg-violet-600/20 text-violet-400'}`}>
                                                {doc.party === 'opposing' ? <UserGroupIcon className="w-4 h-4" /> : <UserIcon className="w-4 h-4" />}
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-sm font-medium truncate">{doc.name}</span>
                                                <span className={`text-[10px] font-bold uppercase ${doc.party === 'opposing' ? 'text-slate-500' : 'text-violet-400'}`}>
                                                    {doc.party === 'opposing' ? t('pro.dashboard.opposing_party') : t('pro.dashboard.my_party')}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <a href={doc.url} target="_blank" className="p-2 text-slate-500 hover:text-white transition-colors" title={t('pro.dashboard.preview')}>
                                                <ExternalLinkIcon className="w-4 h-4" />
                                            </a>
                                            <button
                                                onClick={() => handleDeleteDoc(doc)}
                                                className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                                                title={t('pro.dashboard.delete')}
                                            >
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8">
                                    <DocumentTextIcon className="w-12 h-12 text-slate-700 mx-auto mb-2" />
                                    <p className="text-slate-500 text-sm italic">{t('pro.dashboard.no_docs')}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-12 flex flex-col items-center gap-4">
                        <button
                            disabled={documents.length === 0 || isLoading}
                            className={`flex items-center gap-3 bg-gradient-to-r from-violet-600 to-indigo-600 px-10 py-5 rounded-2xl font-bold shadow-lg transition-all ${(documents.length === 0 || isLoading) ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:scale-105 hover:shadow-violet-900/40'
                                }`}
                            onClick={handleAnalyzeDocs}
                        >
                            {isLoading ? <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin"></div> : <MagicWandIcon className="w-6 h-6" />}
                            <span>{t('pro.dashboard.analyze_button')}</span>
                        </button>

                        <button
                            onClick={handleNoDocs}
                            disabled={isLoading}
                            className="text-slate-500 text-sm hover:text-white hover:underline transition-colors mt-2"
                        >
                            {isLoading ? t('pro.dashboard.initiating') : t('pro.dashboard.no_docs_link')}
                        </button>
                    </div>
                </div>


                <HelpModal
                    isOpen={isHelpOpen}
                    onClose={() => setIsHelpOpen(false)}
                    title={t('pro.dashboard.help_title')}
                >
                    <div className="space-y-4 text-sm">
                        <p>
                            {t('pro.dashboard.help_desc')}
                        </p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>
                                {t('pro.dashboard.help_my_docs')}
                            </li>
                            <li>
                                {t('pro.dashboard.help_opposing_docs')}
                            </li>
                        </ul>
                        <p className="italic text-slate-500 mt-2">
                            {t('pro.dashboard.help_footer')}
                        </p>
                    </div>
                </HelpModal>
            </div>

        );
    }

    // Sub-view: Step 2 - Interview
    if (activeStep === ProStep.Interview) {
        return (
            <div className="flex flex-col h-full bg-slate-900 text-white overflow-hidden">
                {!isFullScreen && (
                    <div className="p-4 border-b border-slate-700 flex items-center justify-between bg-slate-800/50 backdrop-blur-md gap-2">
                        <button
                            onClick={() => setActiveStep(null)}
                            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors flex-shrink-0"
                        >
                            <ArrowLeftIcon className="w-5 h-5" />
                            <span className="hidden md:inline">{t('pro.dashboard.dashboard_label')}</span>
                        </button>
                        <h2 className="font-bold text-violet-400 flex items-center gap-1.5 text-xs md:text-base max-w-[60%] md:max-w-full">
                            <span className="truncate">{t('pro.dashboard.interview_stage')}</span>
                            <InfoIcon onClick={() => setIsHelpOpen(true)} className="flex-shrink-0" />
                        </h2>
                        <button
                            onClick={() => {
                                setStepStatus(prev => ({ ...prev, [ProStep.Interview]: 'completed' }));
                                setActiveStep(null);
                            }}
                            className="text-[10px] md:text-xs bg-green-600/20 text-green-400 border border-green-500/30 px-2 md:px-3 py-1 rounded-full font-bold hover:bg-green-600/30 transition-all flex-shrink-0"
                        >
                            {t('pro.dashboard.finish_interview')}
                        </button>
                    </div>
                )}

                <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-4 custom-scrollbar"
                >
                    <div className="max-w-4xl mx-auto space-y-4">
                        {messages.filter(m => m.role !== 'system' && !m.content.includes('[SYSTEM:')).map((m, i) => (
                            <ChatBubble
                                key={i}
                                message={m}
                                onAddNote={onAddNote ? (content, linkedMsg, noteId) => onAddNote(content, linkedMsg, noteId, m.role === 'model' ? 'model' : 'user') : undefined}
                                existingNotes={existingNotes?.filter(n =>
                                    n.linkedMessage === m.content.substring(0, 50) &&
                                    (!n.linkedRole || n.linkedRole === (m.role === 'model' ? 'model' : 'user'))
                                )}
                                onDeleteNote={onDeleteNote}
                                onUpdateNotePosition={onUpdateNotePosition}
                                lawArea={lawArea}
                                topic={topic}
                            />
                        ))}

                        {isLoading && <div className="text-slate-500 text-sm animate-pulse italic">{t('pro.dashboard.analyzing')}</div>}
                    </div>
                </div>

                <div className="p-4 bg-slate-800/80 border-t border-slate-700">
                    <div className="flex flex-col gap-3 max-w-4xl mx-auto">
                        {!isFullScreen && (
                            <div className="flex items-center justify-between gap-3 flex-wrap">
                                <div className="flex items-center">
                                    <label htmlFor="pro-deep-thinking-toggle" className="text-[10px] sm:text-xs leading-tight font-medium text-slate-400 mr-2 cursor-pointer flex flex-col items-center">
                                        <span>{t('pro.dashboard.deep_thinking').split(' ')[0]}</span>
                                        <span>{t('pro.dashboard.deep_thinking').split(' ')[1]}</span>
                                    </label>
                                    <button
                                        id="pro-deep-thinking-toggle"
                                        onClick={() => setIsDeepThinkingEnabled?.(!isDeepThinkingEnabled)}
                                        className={`relative inline-flex items-center h-5 rounded-full w-10 transition-colors ${isDeepThinkingEnabled ? 'bg-cyan-600' : 'bg-slate-600'}`}
                                    >
                                        <span className={`inline-block w-3.5 h-3.5 transform bg-white rounded-full transition-transform ${isDeepThinkingEnabled ? 'translate-x-5.5' : 'translate-x-1'}`} />
                                    </button>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setIsFullScreen?.(!isFullScreen)}
                                        className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors border border-slate-700 bg-slate-800/50"
                                        title={isFullScreen ? t('pro.dashboard.exit_fullscreen') : t('pro.dashboard.fullscreen')}
                                    >
                                        {isFullScreen ? <ArrowsContractIcon className="h-5 w-5" /> : <ArrowsExpandIcon className="h-5 w-5" />}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Context Badge */}
                        {!isFullScreen && (
                            <div className="flex items-center gap-2 px-1 py-1 text-[10px] opacity-70">
                                <ScaleIcon className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                                <span className="text-slate-400 font-semibold uppercase tracking-wider">{t('pro.dashboard.context_mode')}</span>
                                <span className="text-slate-600">|</span>
                                <BriefcaseIcon className="w-3 h-3 text-amber-400 flex-shrink-0" />
                                <span className="text-amber-400 font-semibold truncate uppercase tracking-wider">{topic}</span>
                            </div>
                        )}
                        <div className="flex gap-2">
                            {isFullScreen && (
                                <button
                                    onClick={() => setIsFullScreen?.(false)}
                                    className="p-3 text-slate-400 hover:text-cyan-400 rounded-xl transition-colors border border-slate-700 bg-slate-900/50"
                                    title={t('pro.dashboard.exit_fullscreen')}
                                >
                                    <ArrowsContractIcon className="w-5 h-5 transition-transform group-active:scale-90" />
                                </button>
                            )}
                            <input
                                type="text"
                                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-violet-500 transition-all"
                                placeholder={t('pro.dashboard.input_placeholder')}
                                value={currentInput}
                                onChange={(e) => setCurrentInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            />
                            <button
                                onClick={handleSendMessage}
                                disabled={isLoading || !currentInput.trim()}
                                className="p-3 bg-violet-600 rounded-xl hover:bg-violet-500 transition-colors disabled:opacity-50"
                            >
                                <SendIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>


                <HelpModal
                    isOpen={isHelpOpen}
                    onClose={() => setIsHelpOpen(false)}
                    title={t('pro.dashboard.interview_help_title')}
                >
                    <div className="space-y-4 text-sm">
                        <p>
                            {t('pro.dashboard.interview_help_desc')}
                        </p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>
                                {t('pro.dashboard.interview_help_honest')}
                            </li>
                            <li>
                                {t('pro.dashboard.interview_help_dunno')}
                            </li>
                            <li>
                                {t('pro.dashboard.interview_help_finish')}
                            </li>
                        </ul>
                    </div>
                </HelpModal>
            </div>
        );
    }

    // Sub-view: Step 3 - Analysis
    // Sub-view: Step 3 - Analysis
    if (activeStep === ProStep.Analysis) {
        const reportIndex = [...messages].reverse().findIndex(m => m.role === 'model' && m.content.includes('MOCNE STRONY'));
        const actualReportIndex = reportIndex !== -1 ? messages.length - 1 - reportIndex : -1;
        const reportMessage = actualReportIndex !== -1 ? messages[actualReportIndex] : null;
        const followUpMessages = actualReportIndex !== -1 ? messages.slice(actualReportIndex + 1) : [];

        return (
            <div className="flex flex-col h-full bg-slate-900 text-white overflow-hidden relative">
                {/* Fixed Header */}
                {!isFullScreen && (
                    <div className="p-4 border-b border-slate-700 flex items-center justify-between bg-slate-800/50 backdrop-blur-md z-10 gap-2">
                        <button
                            onClick={() => setActiveStep(null)}
                            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors flex-shrink-0"
                        >
                            <ArrowLeftIcon className="w-5 h-5" />
                            <span className="hidden md:inline">{t('pro.dashboard.dashboard_label')}</span>
                        </button>

                        <h2 className="font-bold text-violet-400 flex items-center gap-1.5 text-xs md:text-base max-w-[60%] md:max-w-full">
                            <span className="truncate">{t('pro.analysis.step_title')}</span>
                            <InfoIcon onClick={() => setIsHelpOpen(true)} className="flex-shrink-0" />
                        </h2>
                        <div className="w-8 md:w-24 flex-shrink-0"></div> {/* Spacer for balance */}
                    </div>
                )}

                {/* Centered Loading Overlay */}
                {
                    isLoading && (
                        <div className="absolute inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-300">
                            <div className="relative">
                                <div className="w-20 h-20 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin"></div>
                                <MagicWandIcon className="w-8 h-8 text-violet-400 absolute inset-0 m-auto animate-pulse" />
                            </div>
                            <h2 className="text-xl font-bold mt-6 text-white tracking-tight">{t('pro.analysis.creating_report')}</h2>
                            <p className="text-slate-400 text-sm mt-2 animate-pulse">{t('pro.analysis.analyzing_desc')}</p>
                        </div>
                    )
                }

                {/* Scrollable Content Area */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 scroll-smooth">
                    <div className="max-w-4xl mx-auto w-full pb-10">
                        <div className="flex items-center justify-between mb-8">
                            <h1 className="text-3xl font-bold">{t('pro.analysis.main_title')}</h1>
                            <button
                                onClick={handleGenerateAnalysis}
                                disabled={isLoading}
                                className="bg-violet-600 hover:bg-violet-500 px-6 py-2 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg disabled:opacity-50"
                            >
                                <MagicWandIcon className="w-4 h-4" />
                                <span>{t('pro.analysis.refresh_btn')}</span>
                            </button>
                        </div>

                        {/* The Strategic Report */}
                        {reportMessage && (
                            <div className="mb-12">
                                <ChatBubble
                                    message={reportMessage}
                                    onAddNote={onAddNote ? (content, linkedMsg, noteId) => onAddNote(content, linkedMsg, noteId, 'model') : undefined}
                                    existingNotes={existingNotes?.filter(n =>
                                        n.linkedMessage === reportMessage.content.substring(0, 50) &&
                                        (!n.linkedRole || n.linkedRole === 'model')
                                    )}
                                    onDeleteNote={onDeleteNote}
                                    onUpdateNotePosition={onUpdateNotePosition}
                                    lawArea={lawArea}
                                    topic={topic}
                                />
                            </div>
                        )}

                        {/* Chat History after report (Follow-ups) */}
                        {followUpMessages.length > 0 && (
                            <div className="space-y-6 mt-12 border-t border-slate-800 pt-12 pb-24">
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="h-px flex-1 bg-slate-800"></div>
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Dyskusja nad raportem</span>
                                    <div className="h-px flex-1 bg-slate-800"></div>
                                </div>
                                {followUpMessages.map((m, i) => (
                                    <ChatBubble
                                        key={i}
                                        message={m}
                                        onAddNote={onAddNote ? (content, linkedMsg, noteId) => onAddNote(content, linkedMsg, noteId, m.role === 'model' ? 'model' : 'user') : undefined}
                                        existingNotes={existingNotes?.filter(n =>
                                            n.linkedMessage === m.content.substring(0, 50) &&
                                            (!n.linkedRole || n.linkedRole === (m.role === 'model' ? 'model' : 'user'))
                                        )}
                                        onDeleteNote={onDeleteNote}
                                        onUpdateNotePosition={onUpdateNotePosition}
                                        lawArea={lawArea}
                                        topic={topic}
                                    />
                                ))}
                                {isLoading && <div className="text-slate-500 text-sm animate-pulse italic">Asystent analizuje raport...</div>}
                            </div>
                        )}

                        {!reportMessage && !isLoading && (
                            <div className="text-center py-20">
                                <ScaleIcon className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                                <p className="text-slate-500 italic mb-8">Nie wygenerowano jeszcze raportu końcowego.</p>
                                <button
                                    onClick={handleGenerateAnalysis}
                                    className="bg-violet-600/20 text-violet-400 border border-violet-500/30 px-8 py-3 rounded-2xl font-bold hover:bg-violet-600/30 transition-all"
                                >
                                    GENERUJ RAPORT TERAZ
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sticky Footer for Input */}
                {
                    reportMessage && (
                        <div className="p-4 bg-slate-800/80 border-t border-slate-700 backdrop-blur-md">
                            <div className="flex flex-col gap-3 max-w-4xl mx-auto">
                                {!isFullScreen && (
                                    <div className="flex items-center gap-2 px-1 py-1 text-[10px] opacity-70">
                                        <ScaleIcon className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                                        <span className="text-slate-400 font-semibold uppercase tracking-wider">Tryb: Analiza Strategiczna</span>
                                        <span className="text-slate-600">|</span>
                                        <BriefcaseIcon className="w-3 h-3 text-amber-400 flex-shrink-0" />
                                        <span className="text-amber-400 font-semibold truncate uppercase tracking-wider">{topic}</span>
                                    </div>
                                )}

                                {!isFullScreen && (
                                    <div className="flex items-center justify-between gap-3 flex-wrap">
                                        <div className="flex items-center">
                                            <label htmlFor="pro-analysis-deep-thinking-toggle" className="text-[10px] sm:text-xs leading-tight font-medium text-slate-400 mr-2 cursor-pointer flex flex-col items-center">
                                                {t('chat.deepThinking')}
                                            </label>
                                            <button
                                                id="pro-analysis-deep-thinking-toggle"
                                                onClick={() => setIsDeepThinkingEnabled?.(!isDeepThinkingEnabled)}
                                                className={`relative inline-flex items-center h-5 rounded-full w-10 transition-colors ${isDeepThinkingEnabled ? 'bg-cyan-600' : 'bg-slate-600'}`}
                                            >
                                                <span className={`inline-block w-3.5 h-3.5 transform bg-white rounded-full transition-transform ${isDeepThinkingEnabled ? 'translate-x-5.5' : 'translate-x-1'}`} />
                                            </button>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setIsFullScreen?.(!isFullScreen)}
                                                className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors border border-slate-700 bg-slate-800/50"
                                                title={isFullScreen ? "Wyjdź z pełnego ekranu" : "Pełny ekran"}
                                            >
                                                {isFullScreen ? <ArrowsContractIcon className="h-5 w-5" /> : <ArrowsExpandIcon className="h-5 w-5" />}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    {isFullScreen && (
                                        <button
                                            onClick={() => setIsFullScreen?.(false)}
                                            className="p-3 text-slate-400 hover:text-cyan-400 rounded-xl transition-colors border border-slate-700 bg-slate-900/50"
                                            title="Wyjdź z pełnego ekranu"
                                        >
                                            <ArrowsContractIcon className="w-5 h-5 transition-transform group-active:scale-90" />
                                        </button>
                                    )}
                                    <input
                                        type="text"
                                        className="flex-1 bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-violet-500 transition-all placeholder:text-slate-600"
                                        placeholder="Zadaj pytanie do raportu lub odpowiedz Asystentowi..."
                                        value={currentInput}
                                        onChange={(e) => setCurrentInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                    />
                                    <button
                                        onClick={handleSendMessage}
                                        disabled={isLoading || !currentInput.trim()}
                                        className="p-3 bg-violet-600 rounded-xl hover:bg-violet-500 transition-colors disabled:opacity-50 shadow-lg shadow-violet-900/20"
                                    >
                                        <SendIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                }


                <HelpModal
                    isOpen={isHelpOpen}
                    onClose={() => setIsHelpOpen(false)}
                    title="Etap 3: Raport - Pomoc"
                >
                    <div className="space-y-4 text-sm">
                        <p>
                            To wynik całej naszej pracy. Raport Strategiczny zawiera kompleksową ocenę Twojej sytuacji prawnej.
                        </p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>
                                <strong>SWOT:</strong> Jasno zdefiniowane mocne i słabe strony Twojej sprawy.
                            </li>
                            <li>
                                <strong>Szanse:</strong> Szacunkowa ocena prawdopodobieństwa sukcesu w procentach.
                            </li>
                            <li>
                                <strong>Dyskusja:</strong> Poniżej raportu możesz kontynuować rozmowę – dopytać o niezrozumiałe kwestie lub poprosić o rozwinięcie konkretnego punktu strategii.
                            </li>
                        </ul>
                    </div>
                </HelpModal>
            </div>
        );
    }

    // Sub-view: Step 5 - Court Simulation
    if (activeStep === ProStep.Court) {
        // Filter messages to only show those from the current simulation
        const trialStartIndex = messages.findLastIndex(m => m.role === 'system' && m.content.includes('[SYSTEM PRO: SYMULACJA SĄDOWA]'));
        const trialMessages = messages
            .slice(trialStartIndex !== -1 ? trialStartIndex : 0)
            .filter(m => m.role !== 'system' && !m.content.includes('[SYSTEM:'));

        return (
            <div className="flex flex-col h-full bg-slate-900 text-white overflow-hidden">
                {!isFullScreen && (
                    <div className="p-4 border-b border-slate-700 flex items-center justify-between bg-slate-800/50 backdrop-blur-md gap-2">
                        <div className="flex items-center gap-2 overflow-hidden">
                            <button
                                onClick={() => {
                                    setActiveStep(null);
                                    setCourtRole(null);
                                }}
                                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors flex-shrink-0"
                            >
                                <ArrowLeftIcon className="w-5 h-5" />
                                <span className="hidden md:inline">Pulpit sprawy</span>
                            </button>
                            <h2 className="font-bold text-cyan-400 flex items-center gap-1.5 text-xs md:text-base max-w-[60%] md:max-w-full overflow-hidden">
                                <GavelIcon className="w-5 h-5 flex-shrink-0" />
                                <span className="truncate">{courtRole ? `${courtRole}` : "Tryb Sądowy"}</span>
                                <InfoIcon onClick={() => setIsHelpOpen(true)} className="flex-shrink-0" />
                            </h2>
                        </div>
                        <div className="flex items-center gap-2">
                            {courtRole && (
                                <button
                                    onClick={() => setCourtRole(null)}
                                    className="text-[10px] md:text-xs text-slate-400 hover:text-white transition-colors px-2 py-1 rounded-lg border border-slate-700 font-medium"
                                >
                                    Zmień rolę
                                </button>
                            )}
                            <button
                                onClick={() => {
                                    setStepStatus(prev => ({ ...prev, [ProStep.Court]: 'completed' }));
                                    setActiveStep(null);
                                    setCourtRole(null);
                                }}
                                className="text-[10px] md:text-xs bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 px-2 md:px-3 py-1 rounded-full font-bold hover:bg-cyan-600/30 transition-all flex-shrink-0"
                            >
                                Zakończ
                            </button>
                        </div>
                    </div>
                )}

                {!courtRole ? (
                    <div className="flex-1 overflow-y-auto">
                        <CourtRoleSelector onSelect={handleSelectCourtRole} />
                    </div>
                ) : (
                    <>
                        <div
                            ref={scrollRef}
                            className="flex-1 overflow-y-auto p-4 custom-scrollbar"
                        >
                            <div className="max-w-4xl mx-auto space-y-4">
                                {trialMessages.map((m, i) => (
                                    <ChatBubble
                                        key={i}
                                        message={m}
                                        onAddNote={onAddNote ? (content, linkedMsg, noteId) => onAddNote(content, linkedMsg, noteId, m.role === 'model' ? 'model' : 'user') : undefined}
                                        existingNotes={existingNotes?.filter(n =>
                                            n.linkedMessage === m.content.substring(0, 50) &&
                                            (!n.linkedRole || n.linkedRole === (m.role === 'model' ? 'model' : 'user'))
                                        )}
                                        onDeleteNote={onDeleteNote}
                                        onUpdateNotePosition={onUpdateNotePosition}
                                        lawArea={lawArea}
                                        topic={topic}
                                    />
                                ))}
                                {isLoading && <div className="text-slate-500 text-sm animate-pulse italic">Sąd analizuje odpowiedź...</div>}
                            </div>
                        </div>

                        <div className="p-4 bg-slate-800/80 border-t border-slate-700">
                            <div className="flex flex-col gap-3 max-w-4xl mx-auto">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        className="flex-1 bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-cyan-500 transition-all"
                                        placeholder="Wpisz swoją odpowiedź sędziemu lub adwokatowi..."
                                        value={currentInput}
                                        onChange={(e) => setCurrentInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                        disabled={isLoading}
                                    />
                                    <button
                                        onClick={handleSendMessage}
                                        disabled={isLoading || !currentInput.trim()}
                                        className="p-3 bg-cyan-600 rounded-xl hover:bg-cyan-500 transition-colors disabled:opacity-50"
                                    >
                                        <SendIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                <HelpModal
                    isOpen={isHelpOpen}
                    onClose={() => setIsHelpOpen(false)}
                    title="Tryb Sądowy - Pomoc"
                >
                    <div className="space-y-4 text-sm">
                        <p>
                            Tryb Sądowy pozwala na symulację prawdziwej rozprawy. AI wciela się w wybraną rolę, aby pomóc Ci oswoić się z sytuacją na sali sądowej.
                        </p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>
                                <strong>Rola Sędziego:</strong> Formalne przesłuchanie. Skup się na faktach i odpowiadaj krótko.
                            </li>
                            <li>
                                <strong>Rola Adwokata:</strong> Przygotowanie strategii i ćwiczenie pytań, które mogą paść.
                            </li>
                            <li>
                                <strong>Wiedza:</strong> AI wykorzystuje Twoje dokumenty i raport strategiczny, by symulacja była jak najbardziej realistyczna.
                            </li>
                        </ul>
                    </div>
                </HelpModal>
            </div>
        );
    }

    // Sub-view: Step 4 - Notes
    if (activeStep === ProStep.Notes) {
        return (
            <div className="flex flex-col h-full bg-slate-900 text-white p-6 overflow-y-auto">
                <button
                    onClick={() => setActiveStep(null)}
                    className="flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors self-start"
                >
                    <ArrowLeftIcon className="w-5 h-5" />
                    <span>Powrót do pulpitu sprawy</span>
                </button>
                <div className="max-w-4xl mx-auto w-full pb-10 h-[calc(100vh-200px)] min-h-[500px]">
                    <NotesWidget userId={userId} chatId={chatId!} />
                </div>
            </div>
        );
    }

    // Main Dashboard View
    return (
        <div className="flex flex-col h-full bg-slate-900 text-white overflow-hidden">
            {/* Header Sprawy */}
            <div className="bg-slate-800/50 border-b border-slate-700/50 p-6 backdrop-blur-md">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onBack}
                            className="p-2 bg-slate-700/50 hover:bg-slate-700 rounded-xl transition-colors"
                        >
                            <ArrowLeftIcon className="w-5 h-5" />
                        </button>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="bg-violet-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter">PRO Strategy</span>
                                <span className="text-slate-500 text-xs">{lawArea}</span>
                            </div>
                            <h1 className="text-2xl font-bold">{topic}</h1>
                        </div>
                        <InfoIcon onClick={() => setIsHelpOpen(true)} className="ml-2" />
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">{t('pro.dashboard.progress_title')}</span>
                            <div className="flex gap-1 mt-1">
                                <div className={`h-1.5 w-10 rounded-full ${stepStatus[ProStep.Documents] === 'completed' ? 'bg-violet-500' : 'bg-slate-700'}`}></div>
                                <div className={`h-1.5 w-10 rounded-full ${stepStatus[ProStep.Interview] === 'completed' ? 'bg-violet-500' : 'bg-slate-700'}`}></div>
                                <div className={`h-1.5 w-10 rounded-full ${stepStatus[ProStep.Analysis] === 'completed' ? 'bg-violet-500' : 'bg-slate-700'}`}></div>
                                <div className={`h-1.5 w-10 rounded-full ${stepStatus[ProStep.Court] === 'completed' ? 'bg-cyan-500' : 'bg-slate-700'}`}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Dashboard Tiles */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-6xl mx-auto py-10">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                        {/* Kafel 1: Dokumenty */}
                        <div
                            onClick={() => setActiveStep(ProStep.Documents)}
                            className={`group relative bg-slate-800/40 border-2 rounded-[2.5rem] p-8 cursor-pointer transition-all duration-300 overflow-hidden ${stepStatus[ProStep.Documents] === 'completed' ? 'border-green-500/50 hover:bg-green-500/5' : 'border-slate-700/50 hover:border-violet-500 hover:bg-slate-800/60'
                                }`}
                        >
                            {stepStatus[ProStep.Documents] === 'completed' && (
                                <div className="absolute top-6 right-6 p-2 bg-green-500/20 text-green-400 rounded-full">
                                    <CheckIcon className="w-5 h-5" />
                                </div>
                            )}

                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-8 transition-transform group-hover:scale-110 ${stepStatus[ProStep.Documents] === 'completed' ? 'bg-green-600/20 text-green-400' : 'bg-violet-600/20 text-violet-400'
                                }`}>
                                <DocumentTextIcon className="w-8 h-8" />
                            </div>

                            <h3 className="text-2xl font-bold mb-4">{t('pro.dashboard.tile_docs_title')}</h3>
                            <p className="text-slate-400 text-sm leading-relaxed mb-8">
                                {t('pro.dashboard.tile_docs_desc')}
                            </p>

                            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-violet-400">
                                <span>{stepStatus[ProStep.Documents] === 'completed' ? t('pro.dashboard.tile_docs_btn_manage') : t('pro.dashboard.tile_docs_btn')}</span>
                                <ChevronRightIcon className="w-4 h-4" />
                            </div>
                        </div>

                        {/* Kafel 2: Wywiad */}
                        <div
                            onClick={() => (stepStatus[ProStep.Documents] === 'completed' || stepStatus[ProStep.Interview] === 'completed') && setActiveStep(ProStep.Interview)}
                            className={`group relative bg-slate-800/40 border-2 rounded-[2.5rem] p-8 transition-all duration-300 overflow-hidden ${(stepStatus[ProStep.Documents] === 'completed' || stepStatus[ProStep.Interview] === 'completed')
                                ? 'cursor-pointer border-slate-700/50 hover:border-violet-500 hover:bg-slate-800/60'
                                : 'cursor-not-allowed opacity-40 border-transparent'
                                }`}
                        >
                            {stepStatus[ProStep.Interview] === 'completed' && (
                                <div className="absolute top-6 right-6 p-2 bg-green-500/20 text-green-400 rounded-full">
                                    <CheckIcon className="w-5 h-5" />
                                </div>
                            )}
                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-8 transition-transform group-hover:scale-110 ${stepStatus[ProStep.Interview] === 'completed' ? 'bg-green-600/20 text-green-400' : 'bg-violet-600/20 text-violet-400'
                                }`}>
                                <UserGroupIcon className="w-8 h-8" />
                            </div>

                            <h3 className="text-2xl font-bold mb-4">{t('pro.dashboard.tile_interview_title')}</h3>
                            <p className="text-slate-400 text-sm leading-relaxed mb-8">
                                {t('pro.dashboard.tile_interview_desc')}
                            </p>

                            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-violet-400">
                                <span>{t('pro.dashboard.tile_interview_btn')}</span>
                                <ChevronRightIcon className="w-4 h-4" />
                            </div>
                        </div>

                        {/* Kafel 3: Analiza */}
                        <div
                            onClick={() => stepStatus[ProStep.Interview] === 'completed' && setActiveStep(ProStep.Analysis)}
                            className={`group relative bg-slate-800/40 border-2 rounded-[2.5rem] p-8 transition-all duration-300 overflow-hidden ${stepStatus[ProStep.Interview] === 'completed' ? 'cursor-pointer border-slate-700/50 hover:border-violet-500 hover:bg-slate-800/60' : 'cursor-not-allowed opacity-40 border-transparent'
                                }`}
                        >
                            <div className="w-16 h-16 bg-violet-600/20 text-violet-400 rounded-2xl flex items-center justify-center mb-8 transition-transform group-hover:scale-110">
                                <ScaleIcon className="w-8 h-8" />
                            </div>

                            <h3 className="text-2xl font-bold mb-4">{t('pro.dashboard.tile_analysis_title')}</h3>
                            <p className="text-slate-400 text-sm leading-relaxed mb-8">
                                {t('pro.dashboard.tile_analysis_desc')}
                            </p>

                            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-violet-400">
                                <span>{t('pro.dashboard.tile_analysis_btn')}</span>
                                <ChevronRightIcon className="w-4 h-4" />
                            </div>
                        </div>

                        {/* Kafel 4: Tryb Sądowy */}
                        <div
                            onClick={() => stepStatus[ProStep.Analysis] === 'completed' && setActiveStep(ProStep.Court)}
                            className={`group relative bg-slate-800/40 border-2 rounded-[2.5rem] p-8 transition-all duration-300 overflow-hidden ${stepStatus[ProStep.Analysis] === 'completed' ? 'cursor-pointer border-slate-700/50 hover:border-cyan-500 hover:bg-slate-800/60' : 'cursor-not-allowed opacity-40 border-transparent'
                                }`}
                        >
                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-8 transition-transform group-hover:scale-110 ${stepStatus[ProStep.Court] === 'completed' ? 'bg-green-600/20 text-green-400' : 'bg-cyan-600/20 text-cyan-400'
                                }`}>
                                <GavelIcon className="w-8 h-8" />
                            </div>

                            <h3 className="text-2xl font-bold mb-4">{t('pro.dashboard.tile_court_title')}</h3>
                            <p className="text-slate-400 text-sm leading-relaxed mb-8">
                                {t('pro.dashboard.tile_court_desc')}
                            </p>

                            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-cyan-400">
                                <span>{t('pro.dashboard.tile_court_btn')}</span>
                                <ChevronRightIcon className="w-4 h-4" />
                            </div>
                        </div>

                        {/* Kafel 5: Notatki */}
                        <div
                            onClick={() => chatId && setActiveStep(ProStep.Notes)}
                            className="group relative bg-slate-800/40 border-2 border-slate-700/50 rounded-[2.5rem] p-8 cursor-pointer transition-all duration-300 overflow-hidden hover:border-violet-500 hover:bg-slate-800/60"
                        >
                            <div className="w-16 h-16 bg-violet-600/20 text-violet-400 rounded-2xl flex items-center justify-center mb-8 transition-transform group-hover:scale-110">
                                <DocumentTextIcon className="w-8 h-8" />
                            </div>

                            <h3 className="text-2xl font-bold mb-4">{t('pro.dashboard.tile_notes_title')}</h3>
                            <p className="text-slate-400 text-sm leading-relaxed mb-8">
                                {t('pro.dashboard.tile_notes_desc')}
                            </p>

                            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-violet-400">
                                <span>{t('pro.dashboard.tile_notes_btn')}</span>
                                <ChevronRightIcon className="w-4 h-4" />
                            </div>
                        </div>

                    </div>

                    {/* Info */}
                    <div className="mt-16 bg-slate-800/30 border border-slate-700/30 rounded-3xl p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <ClockIcon className="w-6 h-6 text-violet-400" />
                            <h4 className="font-bold text-lg">{t('pro.dashboard.strategy_title')}</h4>
                        </div>
                        <p className="text-slate-400 text-sm italic">
                            {t('pro.dashboard.strategy_desc')}
                        </p>
                    </div>
                </div>
            </div>

            <HelpModal
                isOpen={isHelpOpen}
                onClose={() => setIsHelpOpen(false)}
                title={t('pro.dashboard.main_help_title')}
            >
                <div className="space-y-4 text-sm">
                    <p>
                        {t('pro.dashboard.main_help_desc')}
                    </p>
                    <ol className="list-decimal pl-5 space-y-3">
                        <li>
                            <strong className="text-violet-400">{t('pro.dashboard.tile_docs_title').split('.')[1]}:</strong> {t('pro.dashboard.main_help_point_1')}
                        </li>
                        <li>
                            <strong className="text-violet-400">{t('pro.dashboard.tile_interview_title').split('.')[1]}:</strong> {t('pro.dashboard.main_help_point_2')}
                        </li>
                        <li>
                            <strong className="text-violet-400">{t('pro.dashboard.tile_analysis_title').split('.')[1]}:</strong> {t('pro.dashboard.main_help_point_3')}
                        </li>
                    </ol>
                    <p className="italic text-slate-500 mt-2">
                        {t('pro.dashboard.main_help_footer')}
                    </p>
                </div>
            </HelpModal>
        </div>
    );
};

export default ProDashboard;
