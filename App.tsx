import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { LawArea, ChatMessage, InteractionMode, UserProfile, QuickAction, SubscriptionStatus, SubscriptionInfo, CourtRole } from './types';
import { analyzeLegalCase } from './services/geminiService';
import LawSelector from './components/LawSelector';
import TopicSelector from './components/TopicSelector';
import InteractionModeSelector from './components/InteractionModeSelector';
import ChatBubble from './components/ChatBubble';
import LoadingSpinner from './components/LoadingSpinner';
import ConfirmationModal from './components/ConfirmationModal';
import UserProfileModal from './components/UserProfileModal';
import HistoryPanel from './components/HistoryPanel';
import QuickActions from './components/QuickActions';
import {
  PaperClipIcon,
  SendIcon,
  SparklesIcon,
  ArrowsExpandIcon,
  ArrowsContractIcon,
  ClockIcon,
  HomeIcon,
  ProfileIcon,
  ScaleIcon
} from './components/Icons';
import AppHeader from './components/AppHeader';
import CourtRoleSelector from './components/CourtRoleSelector';
import LegalKnowledgeModal from './components/LegalKnowledgeModal';
import DocumentsRepositoryModal from './components/DocumentsRepositoryModal';
import QuickActionsModal from './components/QuickActionsModal';
import CaseAnalysisInput from './components/CaseAnalysisInput';
import WelcomeAnalysisModal from './components/WelcomeAnalysisModal';
import Auth from './components/Auth';
import { auth, db } from './services/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, getDocs, deleteDoc, serverTimestamp, updateDoc, increment, Timestamp, onSnapshot, query, orderBy } from 'firebase/firestore';
import PlanSelectionModal from './components/PlanSelectionModal';
import DocumentPreviewModal from './components/DocumentPreviewModal';
import CaseDashboard from './components/CaseDashboard';
import LegalFAQ from './components/LegalFAQ';
import { generateDocument } from './services/documentService';

import { useAppNavigation } from './hooks/useAppNavigation';
import { useChatLogic } from './hooks/useChatLogic';

import AppModals from './components/AppModals';
import { useUserSession } from './hooks/useUserSession';
import { useTopicManagement } from './hooks/useTopicManagement';
import RemindersWidget from './components/RemindersWidget';
import CookieConsent from './components/CookieConsent';
import { useUserCalendar } from './hooks/useUserCalendar';

const initialProfile: UserProfile = {
  quickActions: [],
  totalCost: 0
};

const App: React.FC = () => {
  const {
    selectedLawArea, setSelectedLawArea,
    selectedTopic, setSelectedTopic,
    interactionMode, setInteractionMode,
    courtRole, setCourtRole,
    isAnalysisMode, setIsAnalysisMode,
    isFullScreen, setIsFullScreen,
    isWelcomeModalOpen, setIsWelcomeModalOpen,
    currentChatId,
    resetNavigation,
    backToTopic,
    backToLawArea,
    initialTopics
  } = useAppNavigation();

  const handleWelcome = useCallback(() => {
    if (!selectedLawArea) setIsWelcomeModalOpen(true);
  }, [selectedLawArea, setIsWelcomeModalOpen]);

  const {
    user,
    authLoading,
    userProfile,
    totalCost,
    setTotalCost,
    handleUpdateProfile,
    isLocalOnly,
    setIsLocalOnly
  } = useUserSession(initialTopics, handleWelcome);

  const {
    topics,
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    topicToDelete,
    handleAddTopic,
    requestDeleteTopic,
    cancelDeleteTopic,
    confirmDeleteTopic
  } = useTopicManagement(user, initialTopics, selectedLawArea, setInteractionMode, setSelectedTopic, isLocalOnly);



  const onConfirmTopicDeletion = async () => {
    if (topicToDelete) {
      const { lawArea, topic } = topicToDelete;
      await confirmDeleteTopic(async (t) => {
        await handleDeleteHistory(lawArea, t);
      });
    }
  };

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isQuickActionsModalOpen, setIsQuickActionsModalOpen] = useState(false);
  const [isHistoryPanelOpen, setIsHistoryPanelOpen] = useState(false);
  const [chatHistories, setChatHistories] = useState<{ lawArea: LawArea; topic: string; interactionMode?: InteractionMode; lastUpdated?: any }[]>([]);

  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');
  // const [todayDeadlines, setTodayDeadlines] = useState<any[]>([]); // Removed: Handled globally by RemindersWidget
  const [isKnowledgeModalOpen, setIsKnowledgeModalOpen] = useState(false);
  const [knowledgeModalChatId, setKnowledgeModalChatId] = useState<string | null>(null);
  const [isDocumentsModalOpen, setIsDocumentsModalOpen] = useState(false);
  const [documentsModalChatId, setDocumentsModalChatId] = useState<string | null>(null);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCostAdd = useCallback((cost: number) => {
    setTotalCost(prev => prev + cost);
  }, [setTotalCost]);

  const {
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
    handleAddCost
  } = useChatLogic({
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
    isLocalOnly
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { allEvents } = useUserCalendar(user);
  const todayStr = new Date().toISOString().split('T')[0];
  const activeRemindersCount = useMemo(() =>
    allEvents.filter(e => !e.completed && e.date === todayStr).length,
    [allEvents, todayStr]);

  // --- OPTYMALIZACJA: Użycie useMemo dla chatId ---


  // Request Notification Permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Removed old useEffect for chat-specific timeline notifications
  // RemindersWidget now handles global notifications for all reminders and deadlines


  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, isLoading, currentMessage]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${scrollHeight}px`;
    }
  }, [currentMessage]);

  const handleViewKnowledge = (lawArea?: LawArea | null, topic?: string | null) => {
    let chatId: string | null = null;
    if (lawArea && topic) {
      const sanitizedTopic = topic.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      chatId = `${lawArea}_${sanitizedTopic}`;
    } else if (currentChatId) {
      chatId = currentChatId;
    }
    setKnowledgeModalChatId(chatId);
    setIsKnowledgeModalOpen(true);
  };

  const handleViewDocuments = (chatId?: string | null) => {
    setDocumentsModalChatId(chatId || null);
    setIsDocumentsModalOpen(true);
  };

  const handleSelectInteractionMode = (mode: InteractionMode) => {
    if (!selectedLawArea || !selectedTopic) return;
    setInteractionMode(mode);

    // Jeśli historia już istnieje, dodajemy komunikat o zmianie trybu, aby AI wiedziało co robić
    if (chatHistory.length > 0) {
      const lastMessage = chatHistory[chatHistory.length - 1];
      if (lastMessage.role !== 'system') {
        const modeContext = `[ZMIANA TRYBU]: Użytkownik przełączył się w tryb ${mode}. Kontynuuj rozmowę w oparciu o dotychczasowe ustalenia, ale dostosuj styl pracy do nowego trybu.`;
        setChatHistory(prev => [...prev, { role: 'system', content: modeContext }]);
      }
    } else {
      let systemContent = `Specjalizacja: ${selectedLawArea}. Temat: ${selectedTopic}. Tryb: ${mode}`;
      if (mode === InteractionMode.Document) {
        systemContent += `\n\nTWOJE ZADANIE: Generowanie pism procesowych i wniosków...`;
      }
      setChatHistory([{ role: 'system', content: systemContent }]);
    }
  };

  const handleSelectQuickAction = (action: QuickAction) => {
    setSelectedLawArea(action.lawArea);
    if (action.topic) {
      setSelectedTopic(action.topic);
      // Logic to load history would normally go here, but App.tsx has handleLoadHistory
      handleLoadHistory(action.lawArea, action.topic);
    } else {
      setSelectedTopic(null);
      setChatHistory([]);
    }
    setInteractionMode(null);
    setIsQuickActionsModalOpen(false);
    setIsFullScreen(false);
    setIsWelcomeModalOpen(false);
  };



  const handleQuickActionClick = (prompt: string) => {
    handleSendMessage(prompt);
  };

  const handleLoadHistory = async (lawArea: LawArea, topic: string) => {
    if (!user) return;
    setIsWelcomeModalOpen(false);
    setIsLoading(true);
    setChatHistory([]);
    setInteractionMode(null);
    setCourtRole(null);
    setIsFullScreen(false);

    setSelectedLawArea(lawArea);
    setSelectedTopic(topic);

    const sanitizedTopic = topic.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const chatId = `${lawArea}_${sanitizedTopic}`;

    // Auto-detect mode from topic name early (for UI responsiveness and new topics)
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
        let savedInteractionMode = (data.interactionMode as InteractionMode) || autoInteractionMode;

        // Jeśli nie ma zapisanego trybu, spróbuj wyciągnąć go z wiadomości systemowej
        if (!savedInteractionMode && savedHistory.length > 0 && savedHistory[0].role === 'system') {
          const systemMessage = savedHistory[0].content;
          const modeMatch = systemMessage.match(/Tryb: (.*)/);
          if (modeMatch && modeMatch[1]) {
            const parsed = modeMatch[1].trim() as InteractionMode;
            if (Object.values(InteractionMode).includes(parsed)) savedInteractionMode = parsed;
          }
        }

        setChatHistory(savedHistory);
        if (savedInteractionMode) {
          setInteractionMode(savedInteractionMode);
        }

        if (savedHistory.length === 0) {
          const modeToUse = savedInteractionMode || InteractionMode.Analysis;
          setInteractionMode(modeToUse);
          const systemContent = `Specjalizacja: ${lawArea}. Temat: ${topic}. Tryb: ${modeToUse}`;
          setChatHistory([{ role: 'system', content: systemContent }]);
        }
      } else {
        // Fallback for completely new topics that don't have a document yet
        setChatHistory([]);
        if (autoInteractionMode) {
          setInteractionMode(autoInteractionMode);
          const systemContent = `Specjalizacja: ${lawArea}. Temat: ${topic}. Tryb: ${autoInteractionMode}`;
          setChatHistory([{ role: 'system', content: systemContent }]);
        }
      }
    } catch (e) {
      console.error("Error loading chat history:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteHistory = async (lawArea: LawArea, topic: string) => {
    if (!user) return;
    const sanitizedTopic = topic.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const chatId = `${lawArea}_${sanitizedTopic}`;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'chats', chatId));
      const h = await loadChatHistories();
      if (h) setChatHistories(h);
    } catch (e) {
      console.error("Error deleting history:", e);
    }
  };

  const handlePreviewDocument = (rawContent: string) => {
    if (!userProfile?.personalData) {
      alert("Proszę najpierw uzupełnić swoje dane w Panelu Użytkownika.");
      setIsProfileModalOpen(true);
      return;
    }
    const filledContent = generateDocument(rawContent, userProfile.personalData);
    setPreviewContent(filledContent);
    setPreviewTitle("Podgląd Dokumentu");
    setIsPreviewModalOpen(true);
  };

  const handleAddDeadline = async (date: string, title: string, description: string) => {
    if (!user || !currentChatId) return;
    try {
      const timelineRef = collection(db, 'users', user.uid, 'chats', currentChatId, 'timeline');
      await setDoc(doc(timelineRef), {
        date, title, description, type: 'deadline', createdAt: serverTimestamp()
      });
      alert(`Dodano termin: ${title} (${date})`);
    } catch (e) {
      console.error("Error adding deadline:", e);
    }
  };

  const handleAddTask = async (text: string) => {
    if (!user || !currentChatId) return;
    try {
      const checklistRef = collection(db, 'users', user.uid, 'chats', currentChatId, 'checklist');
      await setDoc(doc(checklistRef), {
        text, completed: false, createdAt: serverTimestamp()
      });
      alert(`Dodano zadanie: ${text}`);
    } catch (e) {
      console.error("Error adding task:", e);
    }
  };

  const openProfileModal = () => {
    setIsProfileModalOpen(true);
  };

  const handleCaseAnalysis = async (description: string) => {
    if (!user) return;
    setIsLoading(true);
    const analysisResponse = await analyzeLegalCase(description);
    const { result, usage } = analysisResponse;

    if (usage && usage.cost > 0) {
      handleAddCost(usage.cost);
    }

    if (result) {
      // Topics are handled by useTopicManagement and Firestore sync
      if (!topics[result.lawArea] || !topics[result.lawArea].includes(result.topic)) {
        await handleAddTopic(result.topic, result.interactionMode);
      }

      setSelectedLawArea(result.lawArea);
      setSelectedTopic(result.topic);
      setInteractionMode(result.interactionMode);
      setIsWelcomeModalOpen(false);
      setIsLoading(false);

      const initialHistory: ChatMessage[] = [
        { role: 'system', content: `Specjalizacja: ${result.lawArea}. Temat: ${result.topic}. Tryb: ${result.interactionMode}` },
        { role: 'user', content: description }
      ];

      handleSendMessage(description, initialHistory, {
        lawArea: result.lawArea,
        topic: result.topic,
        interactionMode: result.interactionMode
      });
    } else {
      setIsLoading(false);
      alert("Nie udało się przeanalizować sprawy. Spróbuj ponownie lub wybierz kategorię ręcznie.");
    }
  };

  const handleSelectPlan = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const newSubscription: SubscriptionInfo = {
        status: SubscriptionStatus.Pending,
        isPaid: false,
        selectedAt: serverTimestamp(),
        activatedAt: null,
        creditLimit: 10.00,
        spentAmount: 0
      };
      await handleUpdateProfile({ ...userProfile, subscription: newSubscription });
    } catch (e) {
      console.error("Error selecting plan:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectLawArea = (area: LawArea) => {
    setSelectedLawArea(area);
  };

  const handleSelectTopic = async (topic: string) => {
    if (selectedLawArea) {
      handleLoadHistory(selectedLawArea, topic);
    }
  };

  const handleGoHome = () => {
    resetNavigation();
    setChatHistory([]);
  };

  const handleBackToLawArea = () => {
    backToLawArea();
    setChatHistory([]);
  };

  const handleBackToTopic = () => {
    backToTopic();
    setChatHistory([]);
  };

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  if (isLoading && chatHistory.length === 0 && !interactionMode && !isWelcomeModalOpen) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-500"></div>
          <p className="text-slate-400">Ładowanie sprawy...</p>
        </div>
      </div>
    );
  }

  // Check if account is active and paid
  const isAwaitingActivation = userProfile?.subscription && userProfile.subscription.isPaid === false;

  if (isAwaitingActivation) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900 px-4">
        <div className="max-w-md w-full bg-slate-800 border border-slate-700/50 p-8 rounded-2xl text-center shadow-2xl backdrop-blur-sm">
          <div className="w-16 h-16 bg-amber-500/20 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <ClockIcon className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Oczekiwanie na aktywację</h2>
          <p className="text-slate-400 mb-8 leading-relaxed">
            Twój plan został wybrany. Dostęp do asystenta zostanie odblokowany natychmiast po zaksięgowaniu wpłaty i aktywacji przez administratora.
          </p>
          <div className="space-y-4">
            <div className="bg-slate-700/30 p-4 rounded-xl text-xs text-slate-500 text-left">
              <p className="font-semibold text-slate-400 mb-1">Status zgłoszenia:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Plan: Pakiet Startowy (10 PLN)</li>
                <li>Status płatności: <span className="text-amber-500">Oczekiwanie</span></li>
                <li>Czas weryfikacji: zazwyczaj do 24h</li>
              </ul>
            </div>
            <button
              onClick={() => auth.signOut()}
              className="w-full py-3 px-4 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors font-medium"
            >
              Wyloguj się
            </button>
          </div>
        </div>
      </div>
    );
  }

  const showQuickActions = !isLoading && chatHistory.some(msg => msg.role === 'model');

  return (
    <>
      <AppModals
        isProfileModalOpen={isProfileModalOpen}
        setIsProfileModalOpen={setIsProfileModalOpen}
        user={user}
        userProfile={userProfile}
        handleUpdateProfile={handleUpdateProfile}
        topics={topics}
        isHistoryPanelOpen={isHistoryPanelOpen}
        setIsHistoryPanelOpen={setIsHistoryPanelOpen}
        chatHistories={chatHistories}
        handleLoadHistory={handleLoadHistory}
        handleDeleteHistory={requestDeleteTopic}
        handleViewKnowledge={handleViewKnowledge}
        handleViewDocuments={handleViewDocuments}
        isQuickActionsModalOpen={isQuickActionsModalOpen}
        setIsQuickActionsModalOpen={setIsQuickActionsModalOpen}
        handleSelectQuickAction={handleSelectQuickAction}
        isWelcomeModalOpen={isWelcomeModalOpen}
        setIsWelcomeModalOpen={setIsWelcomeModalOpen}
        handleCaseAnalysis={handleCaseAnalysis}
        isLoading={isLoading}
        isKnowledgeModalOpen={isKnowledgeModalOpen}
        setIsKnowledgeModalOpen={setIsKnowledgeModalOpen}
        knowledgeModalChatId={knowledgeModalChatId}
        isDocumentsModalOpen={isDocumentsModalOpen}
        setIsDocumentsModalOpen={setIsDocumentsModalOpen}
        documentsModalChatId={documentsModalChatId}
        isDeleteModalOpen={isDeleteModalOpen}
        cancelDeleteTopic={cancelDeleteTopic}
        confirmDeleteTopic={onConfirmTopicDeletion}
        isPreviewModalOpen={isPreviewModalOpen}
        setIsPreviewModalOpen={setIsPreviewModalOpen}
        previewContent={previewContent}
        previewTitle={previewTitle}
      />

      <PlanSelectionModal
        isOpen={!userProfile?.subscription || userProfile.subscription.status === SubscriptionStatus.Expired}
        onSelectPlan={handleSelectPlan}
        subscription={userProfile?.subscription}
        isLoading={isLoading}
      />

      {isFullScreen && (
        <button
          onClick={() => setIsFullScreen(false)}
          className="fixed top-4 right-4 z-[100] bg-slate-800/90 hover:bg-slate-700 text-slate-200 p-3 rounded-full shadow-2xl border border-slate-600 transition-all group active:scale-95"
          title="Wyjdź z pełnego ekranu"
        >
          <ArrowsContractIcon className="h-6 w-6 group-hover:text-cyan-400 transition-colors" />
        </button>
      )}

      <div className="flex flex-col h-[100dvh] bg-slate-800">
        {!isFullScreen && (
          <AppHeader
            title={
              !selectedLawArea ? "Asystent Prawny AI" : (
                !selectedTopic ? (
                  <>
                    <span className="text-slate-400 hidden sm:inline">Asystent:</span>
                    <span className="text-cyan-400"> {selectedLawArea}</span>
                  </>
                ) : (
                  <>
                    <span className="text-slate-400 hidden sm:inline">Asystent:</span>
                    <span className="text-cyan-400"> {selectedLawArea} / {selectedTopic}</span>
                  </>
                )
              )
            }
            onProfileClick={() => setIsProfileModalOpen(true)}
            onQuickActionsClick={() => setIsQuickActionsModalOpen(true)}
            onHistoryClick={() => setIsHistoryPanelOpen(true)}
            onBackClick={selectedTopic ? handleBackToTopic : (selectedLawArea ? handleBackToLawArea : undefined)}
            onHomeClick={handleGoHome}
            onFullScreenClick={selectedTopic && interactionMode ? () => setIsFullScreen(true) : undefined}
            totalCost={totalCost}
            subscription={userProfile?.subscription}
            onKnowledgeClick={() => handleViewKnowledge()}
            onGenerateKnowledgeClick={selectedTopic ? handleGenerateKnowledge : undefined}
            remindersCount={activeRemindersCount}
            isLocalOnly={isLocalOnly}
          />
        )}

        <main ref={chatContainerRef} className="flex-1 overflow-y-auto">
          {!selectedLawArea ? (
            <LawSelector onSelect={handleSelectLawArea} onAnalyzeClick={() => setIsWelcomeModalOpen(true)} isLocalOnly={isLocalOnly} setIsLocalOnly={setIsLocalOnly} />
          ) : !selectedTopic ? (
            <TopicSelector
              lawArea={selectedLawArea}
              topics={topics[selectedLawArea] || []}
              onSelectTopic={handleSelectTopic}
              onAddTopic={async (topic) => {
                await handleAddTopic(topic);
                const h = await loadChatHistories();
                if (h) setChatHistories(h);
              }}
              onAddNegotiationTopic={async (topic) => {
                await handleAddTopic(topic, InteractionMode.Negotiation);
                const h = await loadChatHistories();
                if (h) setChatHistories(h);
              }}
              onDeleteTopic={(topic) => requestDeleteTopic(selectedLawArea, topic)}
            />
          ) : !interactionMode ? (
            <div className="flex flex-col flex-1">
              <InteractionModeSelector
                lawArea={selectedLawArea}
                onSelect={handleSelectInteractionMode}
                onViewDocuments={() => handleViewDocuments(null)}
                onViewHistory={() => setIsHistoryPanelOpen(true)}
                onViewKnowledge={() => handleViewKnowledge(null)}
              />
              <div className="max-w-4xl mx-auto px-4 pb-12">
                <LegalFAQ lawArea={selectedLawArea} onSelectQuestion={handleSendMessage} />
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full bg-slate-900">
              {interactionMode === InteractionMode.Court && !courtRole ? (
                <div className="p-6 h-full overflow-y-auto"><CourtRoleSelector onSelect={handleSelectCourtRole} /></div>
              ) : (
                <div className="flex flex-col h-full overflow-hidden">
                  <div className="sticky top-0 z-20 bg-slate-800/95 backdrop-blur-sm border-b border-slate-700/50 p-4">
                    <div className="max-w-4xl mx-auto"><CaseDashboard userId={user.uid} caseId={currentChatId!} /></div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
                    <div className="max-w-4xl mx-auto">
                      {interactionMode === InteractionMode.Analysis && (
                        <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/50 mb-4 flex items-center justify-between backdrop-blur-sm">
                          <div className="flex-1">
                            <h3 className="text-sm font-semibold text-white mb-1">Faza: Analiza i Gromadzenie Wiedzy</h3>
                            <p className="text-xs text-slate-400">Dostarcz niezbędne informacje i dokumenty przed uzyskaniem porady.</p>
                          </div>
                        </div>
                      )}
                      {chatHistory.filter(msg => msg.role !== 'system').map((msg, index) => (
                        <ChatBubble key={index} message={msg} onPreviewDocument={handlePreviewDocument} onAddDeadline={handleAddDeadline} onAddTask={handleAddTask} />
                      ))}
                      {isLoading && <LoadingSpinner />}
                      <div ref={messagesEndRef} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>

        <RemindersWidget user={user} />
        <CookieConsent />

        {selectedTopic && interactionMode && (
          <footer className="bg-slate-900 p-4 border-t border-slate-700/50">
            <div className="max-w-4xl mx-auto">
              {showQuickActions && !isFullScreen && <QuickActions interactionMode={interactionMode} onActionClick={handleQuickActionClick} />}
              <div className="flex flex-col gap-3 mt-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <label htmlFor="deep-thinking-toggle" className="text-sm font-medium text-slate-300 mr-3 cursor-pointer">Głębokie Myślenie</label>
                    <button
                      id="deep-thinking-toggle"
                      onClick={() => setIsDeepThinkingEnabled(!isDeepThinkingEnabled)}
                      className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${isDeepThinkingEnabled ? 'bg-cyan-600' : 'bg-slate-600'}`}
                    >
                      <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${isDeepThinkingEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                </div>
                {!isFullScreen && !([InteractionMode.SuggestRegulations, InteractionMode.FindRulings, InteractionMode.LegalTraining].includes(interactionMode)) && (
                  <input type="text" value={legalArticles} onChange={(e) => setLegalArticles(e.target.value)} placeholder="Podaj konkretne paragrafy (opcjonalnie)..." className="w-full bg-slate-800 rounded-xl p-2.5 text-sm text-slate-200 border border-slate-700/50" disabled={isLoading} />
                )}
                <div className="flex items-end gap-2 bg-slate-800 rounded-xl p-2 border border-slate-700/50">
                  <button onClick={() => document.getElementById('chat-file-upload')?.click()} className="p-2 text-slate-400 hover:text-cyan-400 rounded-lg"><PaperClipIcon className="w-5 h-5" /></button>
                  <input id="chat-file-upload" type="file" className="hidden" onChange={async (e) => { const file = e.target.files?.[0]; if (file) await handleFileUpload(file); e.target.value = ''; }} />
                  <textarea ref={textareaRef} value={currentMessage} onChange={(e) => setCurrentMessage(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }} placeholder="Napisz wiadomość..." className="w-full bg-transparent text-slate-200 placeholder-slate-400 focus:outline-none resize-none max-h-48" rows={1} disabled={isLoading} />
                  <button onClick={() => handleSendMessage()} disabled={isLoading || !currentMessage.trim()} className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white p-2.5 rounded-full"><SendIcon /></button>
                </div>
              </div>
            </div>
          </footer>
        )}
      </div>
    </>
  );
};

export default App;
