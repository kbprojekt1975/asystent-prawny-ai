import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { LawArea, ChatMessage, InteractionMode, UserProfile, QuickAction, SubscriptionStatus, SubscriptionInfo, CourtRole } from './types';
import { analyzeLegalCase } from './services/geminiService';
import LawSelector from './components/LawSelector';
import ServiceTypeSelector from './components/ServiceTypeSelector';
import TopicSelector from './components/TopicSelector';
import ProDashboard from './components/ProDashboard';
import ProCaseInitiator from './components/ProCaseInitiator';
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
  ScaleIcon,
  CaseIcon,
  ChevronRightIcon,
  DownloadIcon,
  UploadIcon
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
import { CaseDashboardRef } from './components/CaseDashboard';

import { useAppNavigation } from './hooks/useAppNavigation';
import { useChatLogic } from './hooks/useChatLogic';

import AppModals from './components/AppModals';
import SplashScreen from './components/SplashScreen';
import { useUserSession } from './hooks/useUserSession';
import { useTopicManagement } from './hooks/useTopicManagement';
import RemindersWidget from './components/RemindersWidget';
import CookieConsent from './components/CookieConsent';
import { useUserCalendar } from './hooks/useUserCalendar';
import AlimonyCalculator from './components/AlimonyCalculator';
import GlobalAnnouncement from './components/GlobalAnnouncement';
import AdminBroadcastInput from './components/AdminBroadcastInput';
import PWAUpdateNotification from './components/PWAUpdateNotification';

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
    servicePath, setServicePath,
    isAnalysisMode, setIsAnalysisMode,
    isFullScreen, setIsFullScreen,
    isWelcomeModalOpen, setIsWelcomeModalOpen,
    currentChatId,
    resetNavigation,
    backToTopic,
    backToLawArea,
    initialTopics
  } = useAppNavigation();

  const [isAlimonyModalOpen, setIsAlimonyModalOpen] = useState(false);

  const {
    user,
    authLoading,
    profileLoading,
    userProfile,
    totalCost,
    setTotalCost,
    handleUpdateProfile,
    isLocalOnly,
    setIsLocalOnly
  } = useUserSession(initialTopics);

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



  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }
    setDeferredPrompt(null);
  };

  const toggleFullScreen = () => setIsFullScreen(!isFullScreen);

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
  const [isCaseManagementModalOpen, setIsCaseManagementModalOpen] = useState(false);
  const [chatHistories, setChatHistories] = useState<{ lawArea: LawArea; topic: string; interactionMode?: InteractionMode; lastUpdated?: any }[]>([]);

  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');
  // const [todayDeadlines, setTodayDeadlines] = useState<any[]>([]); // Removed: Handled globally by RemindersWidget
  const [isKnowledgeModalOpen, setIsKnowledgeModalOpen] = useState(false);
  const [knowledgeModalChatId, setKnowledgeModalChatId] = useState<string | null>(null);
  const [isDocumentsModalOpen, setIsDocumentsModalOpen] = useState(false);
  const [isSplashDismissed, setIsSplashDismissed] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [documentsModalChatId, setDocumentsModalChatId] = useState<string | null>(null);
  const [welcomeModalInitialViewMode, setWelcomeModalInitialViewMode] = useState<'selection' | 'input'>('selection');

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCostAdd = useCallback((cost: number) => {
    setTotalCost(prev => prev + cost);
  }, [setTotalCost]);

  const handleToggleLocalMode = (val: boolean) => {
    setIsLocalOnly(val);
    if (userProfile?.dataProcessingConsent) {
      handleUpdateProfile({
        ...userProfile,
        manualLocalMode: val
      }, false);
    }
  };

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
    handleAddCost,
    handleExportChat,
    handleImportChat,
    handleInitialGreeting
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
    chatHistories,
    isLocalOnly
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const caseDashboardRef = useRef<CaseDashboardRef>(null);

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

  // Initial Load of Chat Histories
  useEffect(() => {
    if (user && !isLocalOnly) {
      loadChatHistories().then(h => {
        if (h) setChatHistories(h);
      });
    } else if (!user || isLocalOnly) {
      setChatHistories([]);
    }
  }, [user, isLocalOnly, loadChatHistories]);

  const filteredTopics = useMemo(() => {
    if (!selectedLawArea) return { standard: [], pro: [] };
    const allTopics = topics[selectedLawArea] || [];

    // Find topics that have a pro servicePath in chatHistories
    const proTopicNames = chatHistories
      .filter(h => h.lawArea === selectedLawArea && h.servicePath === 'pro')
      .map(h => h.topic);

    return {
      standard: allTopics.filter(t => !proTopicNames.includes(t)),
      pro: allTopics.filter(t => proTopicNames.includes(t))
    };
  }, [topics, selectedLawArea, chatHistories]);

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
    if (!selectedLawArea) return;
    setInteractionMode(mode);

    if (selectedTopic && chatHistory.length > 0) {
      if (mode !== InteractionMode.Court) {
        const systemContent = getSystemPromptForMode(mode, selectedLawArea, selectedTopic);
        setChatHistory([{ role: 'system', content: systemContent }]);
      }
    }
  };

  const getSystemPromptForMode = (mode: InteractionMode, lawArea: LawArea, topic: string) => {
    let prompt = `Specjalizacja: ${lawArea}. Temat: ${topic}. Tryb: ${mode}.\n\n`;

    switch (mode) {
      case InteractionMode.StrategicAnalysis:
        prompt += `TWOJE ZADANIE: Jesteś Starszym Strategiem Procesowym. 
        Analizuj całą dostępną dokumentację użytkownika (teczkę sprawy).
        1. Zidentyfikuj MOCNE i SŁABE strony stanowiska użytkownika.
        2. Wskaż ZAGROŻENIA i SZANSE (analiza SWOT).
        3. Szukaj słabych punktów strony przeciwnej.
        4. Oszacuj PROCENTOWO szanse na wygraną na podstawie dowodów.
        5. Sugeruj konkretne przepisy i linie orzecznicze.
        Działaj proaktywnie, wyłapuj sprzeczności w dokumentach.`;
        break;
      case InteractionMode.Document:
        prompt += `TWOJE ZADANIE: Generowanie pism procesowych i wniosków...`;
        break;
      case InteractionMode.Court:
        prompt += `Tryb formalny, przygotowanie do sali rozpraw...`;
        break;
      default:
        prompt += `Zasugeruj analizę i pomoc w oparciu o temat.`;
    }
    return prompt;
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

  const handleLoadHistory = async (lawArea: LawArea, topic: string, mode?: InteractionMode, path?: 'pro' | 'standard') => {
    if (!user) return;
    setIsWelcomeModalOpen(false);
    setIsLoading(true);
    setChatHistory([]);

    // Priority: use the mode and path passed from history
    if (mode) setInteractionMode(mode);
    if (path) setServicePath(path);
    // Else if no mode/path provided, we can auto-clear if it's a "clean" load from elsewhere
    // but usually this comes from History which now has them.

    if (mode !== InteractionMode.Court && interactionMode !== InteractionMode.Court) {
      setCourtRole(null);
    }
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
        const savedInteractionMode = (data.interactionMode as InteractionMode) || autoInteractionMode;
        const savedServicePath = data.servicePath as 'pro' | 'standard' | undefined;

        // Restore service path if not provided but saved
        if (!path && savedServicePath) setServicePath(savedServicePath);

        // Jeśli nie została przekazana z zewnątrz (np. z kliknięcia w historię), spróbuj wyciągnąć go z dokumentu
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

        // Auto-trigger court simulation if a role was pre-selected
        if (finalMode === InteractionMode.Court && courtRole) {
          handleSelectCourtRole(courtRole);
        } else if (savedHistory.length === 0 && finalMode) {
          handleInitialGreeting(lawArea, topic, finalMode);
        }
      } else {
        // Fallback for completely new topics that don't have a document yet
        setChatHistory([]);
        const modeToUse = mode || interactionMode || autoInteractionMode;
        if (modeToUse) {
          setInteractionMode(modeToUse);
          if (modeToUse === InteractionMode.Court && courtRole) {
            handleSelectCourtRole(courtRole);
          } else {
            handleInitialGreeting(lawArea, topic, modeToUse);
          }
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

      handleSendMessage(description, [
        { role: 'system', content: `Specjalizacja: ${result.lawArea}. Temat: ${result.topic}. Tryb: ${result.interactionMode}` },
        { role: 'user', content: description }
      ], {
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
      await handleUpdateProfile({
        ...userProfile,
        subscription: newSubscription,
        dataProcessingConsent: true,
        consentDate: serverTimestamp()
      });
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

  const handleBackToInteractionMode = () => {
    setInteractionMode(null);
    setCourtRole(null);
  };

  const handleSelectServicePath = (path: 'pro' | 'hub') => {
    setServicePath(path);
    if (path === 'pro') {
      setInteractionMode(InteractionMode.StrategicAnalysis);
    } else {
      setInteractionMode(null);
    }
  };

  const handleUniversalBack = () => {
    if (selectedTopic) {
      // W czacie -> powrót do wyboru tematu
      setSelectedTopic(null);
    } else if (!selectedTopic && interactionMode && (servicePath === 'pro')) {
      // W wyborze tematów (ścieżka PRO) -> powrót do wyboru usługi (PRO/Hub)
      setServicePath(null);
      setInteractionMode(null);
      setCourtRole(null);
    } else if (!selectedTopic && interactionMode && (servicePath === 'hub' || servicePath === 'standard' || !servicePath)) {
      // W wyborze tematów (ścieżka Hub/Standard) -> powrót do wyboru narzędzia (Hub)
      setInteractionMode(null);
      setCourtRole(null);
    } else if (!selectedTopic && !interactionMode && (servicePath === 'hub' || servicePath === 'standard')) {
      // W Hubie -> powrót do wyboru usługi (PRO/Hub)
      setServicePath(null);
    } else if (!selectedTopic && !interactionMode && !servicePath && selectedLawArea) {
      // W wyborze usługi -> powrót do wyboru dziedziny
      setSelectedLawArea(null);
    }
  };

  const isAppDataLoading = authLoading || profileLoading || (isLoading && chatHistory.length === 0 && !interactionMode && !isWelcomeModalOpen && selectedTopic);

  // Consolidated loading experience with marketing messages
  if (!isSplashDismissed) {
    return (
      <SplashScreen
        isReady={!isAppDataLoading}
        onStart={() => setIsSplashDismissed(true)}
      />
    );
  }

  if (!user) {
    return <Auth />;
  }

  // Check if account is active and paid - NOW SAFE because profile is loaded
  const isAwaitingActivation = userProfile?.subscription && userProfile.subscription.isPaid === false;

  if (isAwaitingActivation) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-800 px-4">
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
      <PWAUpdateNotification />
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
        welcomeModalInitialViewMode={welcomeModalInitialViewMode}
        isKnowledgeModalOpen={isKnowledgeModalOpen}
        setIsKnowledgeModalOpen={setIsKnowledgeModalOpen}
        knowledgeModalChatId={knowledgeModalChatId}
        isDocumentsModalOpen={isDocumentsModalOpen}
        setIsDocumentsModalOpen={setIsDocumentsModalOpen}
        documentsModalChatId={documentsModalChatId}
        isDeleteModalOpen={isDeleteModalOpen}
        cancelDeleteTopic={cancelDeleteTopic}
        confirmDeleteTopic={onConfirmTopicDeletion}
        previewContent={previewContent}
        previewTitle={previewTitle}
        isCaseManagementModalOpen={isCaseManagementModalOpen}
        setIsCaseManagementModalOpen={setIsCaseManagementModalOpen}
        currentChatId={currentChatId}
        onChangeMode={() => {
          setInteractionMode(null);
          setIsCaseManagementModalOpen(false);
        }}
        isLocalOnly={isLocalOnly}
      />

      <PlanSelectionModal
        isOpen={!profileLoading && (!userProfile?.subscription || userProfile.subscription.status === SubscriptionStatus.Expired)}
        onSelectPlan={handleSelectPlan}
        subscription={userProfile?.subscription}
        isLoading={isLoading}
      />

      {isFullScreen && (
        <button
          onClick={() => setIsFullScreen(false)}
          className="fixed top-4 right-4 z-[100] bg-slate-800/90 hover:bg-slate-700 text-slate-200 p-3 rounded-full shadow-2xl border border-slate-600 transition-all group active:scale-95 hidden md:block"
          title="Wyjdź z pełnego ekranu"
        >
          <ArrowsContractIcon className="h-6 w-6 group-hover:text-cyan-400 transition-colors" />
        </button>
      )}



      {/* MODULAR FEATURE: Alimony Calculator (Only for Family Law) */}
      {selectedLawArea === LawArea.Family && !isLoading && !isWelcomeModalOpen && (
        <>
          <button
            onClick={() => setIsAlimonyModalOpen(true)}
            className="fixed bottom-24 right-4 z-40 bg-pink-600 hover:bg-pink-500 text-white p-4 rounded-full shadow-2xl border border-pink-400/50 transition-all group hover:scale-105 active:scale-95 animate-bounce-in"
            title="Kalkulator Alimentów"
          >
            <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-900">
              NEW
            </div>
            {/* Simple Calculator Icon SVG inline if not imported */}
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </button>

          <AlimonyCalculator
            isOpen={isAlimonyModalOpen}
            onClose={() => setIsAlimonyModalOpen(false)}
            lawArea={selectedLawArea}
          />
        </>
      )}

      <GlobalAnnouncement />

      <div className="flex flex-col h-[100dvh] bg-slate-800">
        {!isFullScreen && (
          <AppHeader
            title={
              (() => {
                const breadcrumbParts = [];

                // Level 1: Service Path (Home/Base)
                if (servicePath) {
                  breadcrumbParts.push({
                    label: servicePath === 'pro' ? 'Strefa PRO' : 'Narzędzia AI',
                    color: 'text-slate-400 hover:text-white',
                    onClick: handleGoHome
                  });
                }

                // Level 2: Law Area
                if (selectedLawArea) {
                  breadcrumbParts.push({
                    label: selectedLawArea,
                    color: 'text-slate-400 hover:text-white',
                    onClick: () => {
                      setSelectedTopic(null);
                      setInteractionMode(null);
                      setCourtRole(null);
                      setServicePath(null);
                    }
                  });
                }

                // Level 3: Interaction Mode (Tool)
                if (interactionMode) {
                  breadcrumbParts.push({
                    label: interactionMode,
                    color: 'text-slate-400 hover:text-white',
                    icon: ScaleIcon,
                    onClick: () => {
                      setSelectedTopic(null);
                      setCourtRole(null);
                    }
                  });
                }

                // Level 4: Topic/Case
                if (selectedTopic) {
                  breadcrumbParts.push({
                    label: selectedTopic,
                    color: 'text-cyan-400',
                    isCurrent: true
                  });
                }

                // Fallback if no breadcrumb
                if (breadcrumbParts.length === 0) {
                  return "Asystent Prawny AI";
                }

                return (
                  <div className="flex items-center gap-1.5 overflow-x-auto max-w-full text-xs">
                    {breadcrumbParts.map((part, idx) => (
                      <React.Fragment key={idx}>
                        {idx > 0 && <ChevronRightIcon className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />}
                        {part.onClick ? (
                          <button
                            onClick={part.onClick}
                            className={`flex items-center gap-1 ${part.isCurrent ? 'font-semibold' : 'font-medium'} whitespace-nowrap transition-colors ${part.color}`}
                          >
                            {part.icon && <part.icon className="w-3.5 h-3.5 flex-shrink-0" />}
                            <span>{part.label}</span>
                          </button>
                        ) : (
                          <div className={`flex items-center gap-1 ${part.isCurrent ? 'font-semibold' : 'font-medium'} whitespace-nowrap ${part.color}`}>
                            {part.icon && <part.icon className="w-3.5 h-3.5 flex-shrink-0" />}
                            <span>{part.label}</span>
                          </div>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                );
              })()
            }
            onProfileClick={() => setIsProfileModalOpen(true)}
            onQuickActionsClick={() => setIsQuickActionsModalOpen(true)}
            onHistoryClick={() => setIsHistoryPanelOpen(true)}
            onBackClick={
              (selectedTopic && interactionMode) || (selectedTopic && !interactionMode) || (selectedLawArea && !selectedTopic)
                ? handleUniversalBack
                : undefined
            }
            onHomeClick={handleGoHome}
            onFullScreenClick={toggleFullScreen}
            totalCost={totalCost}
            subscription={userProfile?.subscription}
            onKnowledgeClick={interactionMode ? () => setIsKnowledgeModalOpen(true) : undefined}
            onGenerateKnowledgeClick={selectedTopic ? handleGenerateKnowledge : undefined}
            onInstallApp={deferredPrompt ? handleInstallApp : undefined}
            remindersCount={activeRemindersCount}
            isLocalOnly={isLocalOnly}
            hasConsent={userProfile?.dataProcessingConsent}
            onExportChat={selectedTopic && interactionMode ? handleExportChat : undefined}
            onImportChat={selectedTopic && interactionMode ? (file) => {
              handleImportChat(file, (data) => {
                setSelectedLawArea(data.lawArea);
                setSelectedTopic(data.topic);
                setInteractionMode(data.interactionMode);
              });
            } : undefined}
          />
        )}

        <main ref={chatContainerRef} className="flex-1 overflow-y-auto">
          {!selectedLawArea && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
              <AdminBroadcastInput user={user} />
            </div>
          )}
          {!selectedLawArea ? (
            <LawSelector
              onSelect={handleSelectLawArea}
              onAnalyzeClick={() => {
                setWelcomeModalInitialViewMode('input');
                setIsWelcomeModalOpen(true);
              }}
              isLocalOnly={isLocalOnly}
              setIsLocalOnly={handleToggleLocalMode}
              hasConsent={userProfile.dataProcessingConsent}
              onImport={(file) => {
                handleImportChat(file, (data) => {
                  setSelectedLawArea(data.lawArea);
                  setSelectedTopic(data.topic);
                  setInteractionMode(data.interactionMode);
                });
              }}
            />
          ) : !servicePath ? (
            <ServiceTypeSelector
              lawArea={selectedLawArea}
              onSelect={handleSelectServicePath}
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
          ) : servicePath === 'pro' && !selectedTopic ? (
            <ProCaseInitiator
              lawArea={selectedLawArea}
              existingTopics={filteredTopics.pro}
              onSelectTopic={handleSelectTopic}
              onAddTopic={async (topic) => {
                await handleAddTopic(topic, InteractionMode.StrategicAnalysis, 'pro');
                const h = await loadChatHistories();
                if (h) setChatHistories(h);
                handleLoadHistory(selectedLawArea!, topic);
              }}
              onDeleteTopic={(topic) => requestDeleteTopic(selectedLawArea, topic)}
              onBack={() => setServicePath(null)}
            />
          ) : (interactionMode === InteractionMode.Court && !courtRole) ? (
            <div className="p-6 h-full overflow-y-auto">
              <CourtRoleSelector onSelect={handleSelectCourtRole} />
            </div>
          ) : !selectedTopic ? (
            <TopicSelector
              lawArea={selectedLawArea}
              topics={filteredTopics.standard}
              onSelectTopic={handleSelectTopic}
              onAddTopic={async (topic) => {
                await handleAddTopic(topic, interactionMode, 'standard'); // Use current mode
                const h = await loadChatHistories();
                if (h) setChatHistories(h);
                handleLoadHistory(selectedLawArea!, topic);
              }}
              onAddNegotiationTopic={async (topic) => {
                await handleAddTopic(topic, InteractionMode.Negotiation, 'standard');
                const h = await loadChatHistories();
                if (h) setChatHistories(h);
                handleLoadHistory(selectedLawArea!, topic);
              }}
              onDeleteTopic={(topic) => requestDeleteTopic(selectedLawArea, topic)}
              onChangeMode={() => {
                setInteractionMode(null);
                setCourtRole(null);
              }}
            />
          ) : servicePath === 'pro' ? (
            <ProDashboard
              userId={user.uid}
              chatId={currentChatId}
              lawArea={selectedLawArea}
              topic={selectedTopic}
              onBack={() => setSelectedTopic(null)}
            />
          ) : (
            <div className="flex flex-col h-full bg-slate-900">
              <div className="flex flex-col h-full overflow-hidden">
                <div className="sticky top-0 z-20 bg-slate-800/95 backdrop-blur-sm border-b border-slate-700/50 p-4 hidden md:block" data-case-dashboard>
                  <div className="max-w-4xl mx-auto">
                    <CaseDashboard
                      ref={caseDashboardRef}
                      userId={user.uid}
                      caseId={currentChatId!}
                      onChangeMode={() => {
                        setInteractionMode(null);
                        setCourtRole(null);
                      }}
                    />
                  </div>
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
                    {chatHistory.filter(msg => msg.role !== 'system' && !msg.content.includes('[SYSTEM:')).map((msg, index) => (
                      <ChatBubble key={index} message={msg} onPreviewDocument={handlePreviewDocument} onAddDeadline={handleAddDeadline} onAddTask={handleAddTask} />
                    ))}
                    {isLoading && <LoadingSpinner />}
                    <div ref={messagesEndRef} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>

        <RemindersWidget user={user} />
        <CookieConsent />

        {selectedTopic && interactionMode && servicePath !== 'pro' && (
          <footer className="bg-slate-900 p-4 border-t border-slate-700/50">
            <div className="max-w-4xl mx-auto">
              {showQuickActions && !isFullScreen && <QuickActions interactionMode={interactionMode} onActionClick={handleQuickActionClick} />}
              <div className="flex flex-col gap-3 mt-3">
                {!isFullScreen && (
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center">
                      <label htmlFor="deep-thinking-toggle" className="text-[10px] sm:text-xs leading-tight font-medium text-slate-400 mr-2 cursor-pointer flex flex-col items-center">
                        <span>Głębokie</span>
                        <span>Myślenie</span>
                      </label>
                      <button
                        id="deep-thinking-toggle"
                        onClick={() => setIsDeepThinkingEnabled(!isDeepThinkingEnabled)}
                        className={`relative inline-flex items-center h-5 rounded-full w-10 transition-colors ${isDeepThinkingEnabled ? 'bg-cyan-600' : 'bg-slate-600'}`}
                      >
                        <span className={`inline-block w-3.5 h-3.5 transform bg-white rounded-full transition-transform ${isDeepThinkingEnabled ? 'translate-x-5.5' : 'translate-x-1'}`} />
                      </button>

                      {/* Eksport/Import mobilny obok przełącznika */}
                      <div className="flex items-center gap-1.5 ml-3 md:hidden border-l border-slate-700 pl-3">
                        <button
                          onClick={handleExportChat}
                          className="p-1.5 text-slate-300 hover:text-cyan-400 rounded-lg transition-colors bg-slate-800/50 border border-slate-700"
                          title="Eksportuj czat"
                        >
                          <DownloadIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => document.getElementById('mobile-chat-import')?.click()}
                          className="p-1.5 text-slate-300 hover:text-purple-400 rounded-lg transition-colors bg-slate-800/50 border border-slate-700"
                          title="Importuj czat"
                        >
                          <UploadIcon className="w-4 h-4" />
                        </button>
                        <input
                          id="mobile-chat-import"
                          type="file"
                          accept=".json"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleImportChat(file, (data) => {
                                setSelectedLawArea(data.lawArea);
                                setSelectedTopic(data.topic);
                                setInteractionMode(data.interactionMode);
                              });
                            }
                            e.target.value = '';
                          }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 md:hidden">
                        <button
                          onClick={() => {
                            setIsCaseManagementModalOpen(true);
                          }}
                          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors border border-slate-600 shadow-lg bg-slate-800/50"
                          aria-label="Zarządzaj sprawą"
                          title="Zarządzaj sprawą"
                        >
                          <CaseIcon className="h-5 w-5 text-cyan-400" />
                        </button>
                        {selectedTopic && interactionMode && (
                          <button
                            onClick={() => setIsFullScreen(true)}
                            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
                            aria-label="Pełny ekran"
                            title="Pełny ekran"
                          >
                            <ArrowsExpandIcon className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                {/* Context Badge */}
                {(interactionMode || selectedTopic) && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-slate-900/50 border-t border-slate-700/30 text-xs">
                    {interactionMode && (
                      <>
                        <ScaleIcon className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                        <span className="text-slate-400">Tryb:</span>
                        <span className="text-cyan-400 font-semibold">{interactionMode}</span>
                      </>
                    )}
                    {interactionMode && selectedTopic && (
                      <span className="text-slate-600">|</span>
                    )}
                    {selectedTopic && (
                      <>
                        <CaseIcon className="w-4 h-4 text-amber-400 flex-shrink-0" />
                        <span className="text-slate-400">Sprawa:</span>
                        <span className="text-amber-400 font-semibold truncate">{selectedTopic}</span>
                      </>
                    )}
                  </div>
                )}

                <div className="flex items-end gap-2 bg-slate-800 rounded-xl p-2 border border-slate-700/50">
                  {isFullScreen && (
                    <button
                      onClick={() => setIsFullScreen(false)}
                      className="p-2 text-slate-400 hover:text-cyan-400 rounded-lg transition-colors border border-slate-700 mr-1"
                      title="Wyjdź z pełnego ekranu"
                    >
                      <ArrowsContractIcon className="w-5 h-5" />
                    </button>
                  )}
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
