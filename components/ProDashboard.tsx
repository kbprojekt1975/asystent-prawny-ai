import React, { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { LawArea, InteractionMode, CaseDocument, ChatMessage } from '../types';
import { getLegalAdvice } from '../services/geminiService';
import {
    DocumentTextIcon,
    UserGroupIcon,
    ScaleIcon,
    CheckIcon,
    ChevronRightIcon,
    ArrowLeftIcon,
    PlusIcon,
    BriefcaseIcon,
    MagicWandIcon,
    ClockIcon,
    ExternalLinkIcon,
    SendIcon
} from './Icons';

interface ProDashboardProps {
    userId: string;
    chatId: string | null;
    lawArea: LawArea;
    topic: string;
    onBack: () => void;
}

enum ProStep {
    Documents = 'docs',
    Interview = 'interview',
    Analysis = 'analysis'
}

const ProDashboard: React.FC<ProDashboardProps> = ({ userId, chatId, lawArea, topic, onBack }) => {
    const [activeStep, setActiveStep] = useState<ProStep | null>(null);
    const [documents, setDocuments] = useState<CaseDocument[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [stepStatus, setStepStatus] = useState({
        [ProStep.Documents]: 'idle',
        [ProStep.Interview]: 'idle',
        [ProStep.Analysis]: 'idle'
    });

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [currentInput, setCurrentInput] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

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
                    chatId
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
                    lastUpdated: serverTimestamp()
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
                lastUpdated: serverTimestamp()
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
            const prompt = `[SYSTEM PRO: ANALIZA DOKUMENTÓW]
            W tej sprawie załadowano dokumenty: ${documents.map(d => d.name).join(', ')}.
            
            TWOJE ZADANIE:
            1. Przeanalizuj treść tych plików w kontekście sprawy: ${topic}.
            2. Przedstaw konkretne podsumowanie tego, co już udało się ustalić na podstawie dokumentów (fakty, chronologia, kluczowe dowody).
            3. Na tej podstawie zadaj 2-3 najważniejsze pytania uzupełniające, które pomogą Ci przygotować strategię.
            
            Twoja odpowiedź otwiera Etap 2: Wywiad Strategiczny. Bądź profesjonalny i konkretny.`;

            const aiRes = await getLegalAdvice(
                [...messages, { role: 'user', content: prompt }],
                lawArea,
                InteractionMode.StrategicAnalysis,
                topic,
                true,
                undefined,
                chatId
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
                lastUpdated: serverTimestamp()
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

            const aiRes = await getLegalAdvice(
                newHistory,
                lawArea,
                InteractionMode.StrategicAnalysis,
                topic,
                true,
                undefined,
                chatId
            );

            const cleanedText = cleanAiResponse(aiRes.text);
            const finalHistory = [...newHistory, { role: 'model', content: cleanedText }];

            await setDoc(doc(db, 'users', userId, 'chats', chatId), {
                messages: finalHistory,
                lastUpdated: serverTimestamp()
            }, { merge: true });

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
                chatId
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

    // Sub-view: Step 1 - Documents
    if (activeStep === ProStep.Documents) {
        return (
            <div className="flex flex-col h-full bg-slate-900 text-white p-6 overflow-y-auto">
                <button
                    onClick={() => setActiveStep(null)}
                    className="flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors self-start"
                >
                    <ArrowLeftIcon className="w-5 h-5" />
                    <span>Powrót do pulpitu sprawy</span>
                </button>
                <div className="max-w-4xl mx-auto w-full pb-10">
                    <h1 className="text-3xl font-bold mb-2">Załaduj dokumenty</h1>
                    <p className="text-slate-400 mb-8">System przeanalizuje Twoje dokumenty, aby zrozumieć stan faktyczny.</p>

                    {/* Wstępny wywiad (Preliminary Context) */}
                    {messages.filter(m => m.role !== 'system').length > 0 && (
                        <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="h-px flex-1 bg-slate-800"></div>
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Wstępny wywiad</span>
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
                                            <span>KONTYNUUJ WYWIAD / WEJDŹ W ROZMOWĘ</span>
                                            <ChevronRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="bg-slate-800/50 border-2 border-dashed border-slate-700 rounded-3xl p-12 text-center mb-8">
                        <DocumentTextIcon className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold mb-2">Przeciągnij pliki tutaj</h2>
                        <p className="text-slate-500 text-sm mb-6">PDF, JPG, PNG (pozwy, pisma, dowody)</p>
                        <button className="bg-violet-600 hover:bg-violet-500 px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-violet-900/20">
                            Wybierz pliki
                        </button>
                        <div className="mt-4">
                            <button
                                onClick={handleNoDocs}
                                className="text-slate-500 text-sm hover:text-white hover:underline transition-colors"
                            >
                                {isLoading ? 'Inicjowanie wywiadu...' : 'Nie mam dokumentów - chcę opowiedzieć o sprawie'}
                            </button>
                        </div>
                    </div>

                    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-slate-300">Twoja lista dokumentów ({documents.length})</h3>
                        </div>
                        <div className="flex flex-col gap-3">
                            {documents.length > 0 ? (
                                documents.map(doc => (
                                    <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-900/50 border border-slate-700/50 rounded-xl group hover:border-violet-500/50 transition-all">
                                        <div className="flex items-center gap-3">
                                            <DocumentTextIcon className="w-5 h-5 text-violet-400" />
                                            <span className="text-sm">{doc.name}</span>
                                        </div>
                                        <a href={doc.url} target="_blank" className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
                                            <ExternalLinkIcon className="w-4 h-4" />
                                        </a>
                                    </div>
                                ))
                            ) : (
                                <p className="text-slate-500 text-sm italic">Brak załadowanych dokumentów.</p>
                            )}
                        </div>
                    </div>

                    <div className="mt-12 flex justify-center">
                        <button
                            disabled={documents.length === 0 || isLoading}
                            className={`flex items-center gap-3 bg-gradient-to-r from-violet-600 to-indigo-600 px-10 py-5 rounded-2xl font-bold shadow-lg transition-all ${(documents.length === 0 || isLoading) ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:scale-105 hover:shadow-violet-900/40'
                                }`}
                            onClick={handleAnalyzeDocs}
                        >
                            {isLoading ? <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin"></div> : <MagicWandIcon className="w-6 h-6" />}
                            <span>ANALIZUJ DOKUMENTY (AI)</span>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Sub-view: Step 2 - Interview
    if (activeStep === ProStep.Interview) {
        return (
            <div className="flex flex-col h-full bg-slate-900 text-white overflow-hidden">
                <div className="p-4 border-b border-slate-700 flex items-center justify-between bg-slate-800/50 backdrop-blur-md">
                    <button
                        onClick={() => setActiveStep(null)}
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                    >
                        <ArrowLeftIcon className="w-5 h-5" />
                        <span>Pulpit sprawy</span>
                    </button>
                    <h2 className="font-bold text-violet-400">Etap 2: Wywiad Strategiczny</h2>
                    <button
                        onClick={() => {
                            setStepStatus(prev => ({ ...prev, [ProStep.Interview]: 'completed' }));
                            setActiveStep(null);
                        }}
                        className="text-xs bg-green-600/20 text-green-400 border border-green-500/30 px-3 py-1 rounded-full font-bold hover:bg-green-600/30 transition-all"
                    >
                        Zakończ wywiad
                    </button>
                </div>

                <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-4 space-y-4"
                >
                    {messages.map((m, i) => (
                        <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] p-4 rounded-2xl ${m.role === 'user' ? 'bg-violet-600 text-white rounded-tr-none shadow-lg' : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-none'
                                }`}>
                                <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                            </div>
                        </div>
                    ))}
                    {isLoading && <div className="text-slate-500 text-sm animate-pulse italic">Asystent analizuje fakty...</div>}
                </div>

                <div className="p-4 bg-slate-800/80 border-t border-slate-700">
                    <div className="flex gap-2 max-w-4xl mx-auto">
                        <input
                            type="text"
                            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-violet-500 transition-all"
                            placeholder="Wpisz odpowiedź na pytania AI..."
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
                <div className="p-4 border-b border-slate-700 flex items-center justify-between bg-slate-800/50 backdrop-blur-md z-10">
                    <button
                        onClick={() => setActiveStep(null)}
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                    >
                        <ArrowLeftIcon className="w-5 h-5" />
                        <span>Pulpit sprawy</span>
                    </button>
                    <h2 className="font-bold text-violet-400">Etap 3: Raport Strategiczny</h2>
                    <div className="w-24"></div> {/* Spacer for balance */}
                </div>

                {/* Centered Loading Overlay */}
                {isLoading && (
                    <div className="absolute inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-300">
                        <div className="relative">
                            <div className="w-20 h-20 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin"></div>
                            <MagicWandIcon className="w-8 h-8 text-violet-400 absolute inset-0 m-auto animate-pulse" />
                        </div>
                        <h2 className="text-xl font-bold mt-6 text-white tracking-tight">Tworzenie raportu strategicznego...</h2>
                        <p className="text-slate-400 text-sm mt-2 animate-pulse">Asystent analizuje fakty i szanse wygranej</p>
                    </div>
                )}

                {/* Scrollable Content Area */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 scroll-smooth">
                    <div className="max-w-4xl mx-auto w-full pb-10">
                        <div className="flex items-center justify-between mb-8">
                            <h1 className="text-3xl font-bold">Analiza i Strategia</h1>
                            <button
                                onClick={handleGenerateAnalysis}
                                disabled={isLoading}
                                className="bg-violet-600 hover:bg-violet-500 px-6 py-2 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg disabled:opacity-50"
                            >
                                <MagicWandIcon className="w-4 h-4" />
                                <span>ODŚWIEŻ RAPORT</span>
                            </button>
                        </div>

                        {/* The Strategic Report */}
                        {reportMessage && (
                            <div className="bg-slate-800/50 border border-slate-700 rounded-3xl p-8 shadow-2xl mb-12">
                                <div className="prose prose-invert max-w-none text-slate-100 text-sm leading-relaxed whitespace-pre-wrap">
                                    {reportMessage.content}
                                </div>
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
                                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[85%] p-4 rounded-2xl ${m.role === 'user' ? 'bg-violet-600 text-white rounded-tr-none shadow-lg' : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-none'
                                            }`}>
                                            <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                                        </div>
                                    </div>
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
                {reportMessage && (
                    <div className="p-4 bg-slate-800/80 border-t border-slate-700 backdrop-blur-md">
                        <div className="flex gap-2 max-w-4xl mx-auto">
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
                )}
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
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Postęp strategiczny</span>
                            <div className="flex gap-1 mt-1">
                                <div className={`h-1.5 w-12 rounded-full ${stepStatus[ProStep.Documents] === 'completed' ? 'bg-violet-500' : 'bg-slate-700'}`}></div>
                                <div className={`h-1.5 w-12 rounded-full ${stepStatus[ProStep.Interview] === 'completed' ? 'bg-violet-500' : 'bg-slate-700'}`}></div>
                                <div className={`h-1.5 w-12 rounded-full ${stepStatus[ProStep.Analysis] === 'completed' ? 'bg-violet-500' : 'bg-slate-700'}`}></div>
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

                            <h3 className="text-2xl font-bold mb-4">1. Załaduj dokumenty</h3>
                            <p className="text-slate-400 text-sm leading-relaxed mb-8">
                                Prześlij pozwy, pisma i dowody. AI przeanalizuje ich treść i wykryje kluczowe fakty. Możesz też opowiedzieć o sprawie bez dokumentów.
                            </p>

                            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-violet-400">
                                <span>{stepStatus[ProStep.Documents] === 'completed' ? 'ZARZĄDZAJ' : 'ROZPOCZNIJ'}</span>
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

                            <h3 className="text-2xl font-bold mb-4">2. Wywiad strategiczny</h3>
                            <p className="text-slate-400 text-sm leading-relaxed mb-8">
                                AI zada Ci precyzyjne pytania uzupełniające na podstawie Twoich dokumentów. To klucz do zrozumienia "drugiej strony".
                            </p>

                            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-violet-400">
                                <span>ROZPOCZNIJ WYWIAD</span>
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

                            <h3 className="text-2xl font-bold mb-4">3. Analiza i Szanse</h3>
                            <p className="text-slate-400 text-sm leading-relaxed mb-8">
                                Poznaj swoje mocne i słabe strony. AI przedstawi szanse na wygraną oraz obszary wymagające szczególnej uwagi.
                            </p>

                            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-violet-400">
                                <span>GENERUJ RAPORT</span>
                                <ChevronRightIcon className="w-4 h-4" />
                            </div>
                        </div>

                    </div>

                    {/* Info */}
                    <div className="mt-16 bg-slate-800/30 border border-slate-700/30 rounded-3xl p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <ClockIcon className="w-6 h-6 text-violet-400" />
                            <h4 className="font-bold text-lg">Inteligentna Strategia</h4>
                        </div>
                        <p className="text-slate-400 text-sm italic">
                            "System PRO łączy analizę Twoich dokumentów z pogłębionym wywiadem AI. Na końcu otrzymasz kompletną strategię procesową, która pomoże Ci wygrać sprawę."
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProDashboard;
