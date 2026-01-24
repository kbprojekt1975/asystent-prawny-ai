import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { LawArea, ChatMessage, InteractionMode, UserProfile, QuickAction, SubscriptionStatus, SubscriptionInfo, CourtRole, CaseNote, getChatId } from './types';
import { analyzeLegalCase } from './services/geminiService';
import LawSelector from './components/LawSelector';
import ServiceTypeSelector from './components/ServiceTypeSelector';
import TopicSelector from './components/TopicSelector';
import ProDashboard from './components/ProDashboard';
import ProCaseInitiator from './components/ProCaseInitiator';
import InteractionModeSelector from './components/InteractionModeSelector';
import AiToolsSidebar from './components/AiToolsSidebar';
import ChatBubble from './components/ChatBubble';
import LoadingSpinner from './components/LoadingSpinner';
import ConfirmationModal from './components/ConfirmationModal';
import UserProfileModal from './components/UserProfileModal';
import HistoryPanel from './components/HistoryPanel';
import QuickActions from './components/QuickActions';
import {
  PaperClipIcon,
  SendIcon,
  ClockIcon,
  HomeIcon,
  ProfileIcon,
  ScaleIcon,
  CaseIcon,
  ChevronRightIcon,
  DownloadIcon,
  UploadIcon,
  ArrowsExpandIcon,
  ArrowsContractIcon,

  AdjustmentsHorizontalIcon,
  EllipsisHorizontalIcon,
  BrainIcon
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
import { doc, addDoc, getDoc, setDoc, collection, getDocs, deleteDoc, serverTimestamp, updateDoc, increment, Timestamp, onSnapshot, query, orderBy } from 'firebase/firestore';
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
import DraggableButton from './components/DraggableButton';
import GlobalAnnouncement from './components/GlobalAnnouncement';
import AdminBroadcastInput from './components/AdminBroadcastInput';
import PWAUpdateNotification from './components/PWAUpdateNotification';
import AppHelpSidebar from './components/AppHelpSidebar';
import AndromedaAssistant from './components/AndromedaAssistant';

const GlobalAdminNotes = React.lazy(() => import('./components/GlobalAdminNotes'));

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

  const { t, i18n } = useTranslation(); // Hook initialization

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

  // --- FETCH NOTES FOR INLINE DISPLAY ---
  const [chatNotes, setChatNotes] = useState<CaseNote[]>([]);

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

  const isAdmin = useMemo(() => {
    if (!user) return false;
    const ADMIN_UIDS = ["Yb23rXe0JdOvieB3grdaN0Brmkjh"];
    const ADMIN_EMAILS = ["kbprojekt1975@gmail.com", "konrad@example.com", "wielki@electronik.com"];
    return ADMIN_UIDS.includes(user.uid) || (user.email && ADMIN_EMAILS.some(email => user.email?.includes(email)));
  }, [user]);

  const currentViewId = useMemo(() => {
    const sanitize = (id: string) => id.replace(/[^a-z0-9]/gi, '_').toLowerCase();

    if (!selectedLawArea) return 'home';
    if (!servicePath) return `law_${sanitize(selectedLawArea)}`;
    if (!interactionMode) return `service_${sanitize(selectedLawArea)}_${sanitize(servicePath)}`;

    if (!selectedTopic) {
      if (interactionMode === InteractionMode.Court && !courtRole) return `court_role_selection`;
      return `mode_${sanitize(selectedLawArea)}_${sanitize(servicePath)}_${sanitize(interactionMode)}`;
    }

    return `topic_${sanitize(selectedLawArea)}_${sanitize(servicePath)}_${sanitize(interactionMode)}_${sanitize(selectedTopic)}`;
  }, [selectedLawArea, servicePath, interactionMode, selectedTopic, courtRole]);

  const handleUpdateNotePosition = async (noteId: string, position: { x: number, y: number } | null) => {
    if (!user || !currentChatId) return;
    try {
      const noteRef = doc(db, 'users', user.uid, 'chats', currentChatId, 'notes', noteId);
      await updateDoc(noteRef, {
        position: position,
        updatedAt: serverTimestamp()
      });
    } catch (e) {
      console.error("Error updating note position:", e);
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
  const [isAiToolsSidebarOpen, setIsAiToolsSidebarOpen] = useState(false);
  const [isAppHelpSidebarOpen, setIsAppHelpSidebarOpen] = useState(false);
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
  const [isWelcomeAssistantOpen, setIsWelcomeAssistantOpen] = useState(false);
  const [welcomeModalInitialViewMode, setWelcomeModalInitialViewMode] = useState<'selection' | 'input'>('selection');
  const [isShowAndromeda, setIsShowAndromeda] = useState(false);

  // Trigger Welcome Assistant for new users
  useEffect(() => {
    if (user && userProfile && userProfile.hasSeenWelcomeAssistant === false) {
      // Delay slightly for smooth transition after splash/auth
      const timer = setTimeout(() => {
        setIsWelcomeAssistantOpen(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [user, userProfile?.hasSeenWelcomeAssistant]);

  // --- Mobile Toolbar Logic ---
  const [mobileToolbarAlwaysShow, setMobileToolbarAlwaysShow] = useState(() => {
    try {
      return localStorage.getItem('mobileToolbarAlwaysShow') === 'true';
    } catch {
      return false;
    }
  });
  const [isMobileToolbarOpen, setIsMobileToolbarOpen] = useState(false);

  const toggleMobileToolbarAlwaysShow = () => {
    const newVal = !mobileToolbarAlwaysShow;
    setMobileToolbarAlwaysShow(newVal);
    localStorage.setItem('mobileToolbarAlwaysShow', String(newVal));
  };

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

  const handleViewKnowledge = (lawArea?: LawArea | null, topic?: string | null, mode?: InteractionMode | null) => {
    let chatId: string | null = null;
    if (lawArea && topic) {
      chatId = getChatId(lawArea, topic, mode);
    } else if (currentChatId) {
      chatId = currentChatId;
    }
    setKnowledgeModalChatId(chatId);
    setIsKnowledgeModalOpen(true);
  };

  const handleViewDocuments = (chatId?: string | null) => {
    setDocumentsModalChatId(chatId || currentChatId || null);
    setIsDocumentsModalOpen(true);
  };

  const handleSelectInteractionMode = async (mode: InteractionMode, context: 'current' | 'select' | 'new' = 'current') => {
    let lawArea = selectedLawArea;

    // If no law area selected (e.g. from sidebar on home page), set a default
    if (!lawArea) {
      lawArea = LawArea.Civil;
      setSelectedLawArea(lawArea);
    }

    // Determine servicePath based on mode
    const newServicePath = mode === InteractionMode.StrategicAnalysis ? 'pro' : 'standard';

    // Handle Contexts
    if (context === 'new') {
      const now = new Date();
      const topicName = `Nowa sprawa (${now.toLocaleDateString()} ${now.getHours()}:${now.getMinutes()})`;

      // Step 1: Create the topic (this will update topics list and set local selectedTopic/mode)
      await handleAddTopic(topicName, mode, newServicePath);

      // Step 2: Set navigation details and load history (which triggers greeting)
      setServicePath(newServicePath);
      handleLoadHistory(lawArea, topicName, mode, newServicePath);
      return;
    }

    if (context === 'select') {
      setServicePath(newServicePath);
      setInteractionMode(mode);
      setSelectedTopic(null); // Direct user to topic list
      return;
    }

    // Default: 'current' context (apply tool to open case)
    const oldMode = interactionMode;
    setServicePath(newServicePath);
    setInteractionMode(mode);

    if (selectedTopic && chatHistory.length > 0 && mode !== oldMode) {
      if (mode !== InteractionMode.Court) {
        // Trigger a mode-change response instead of just resetting history
        // This will cause Gemini to summarize the case in the context of the new mode
        const modeChangeMessage = `[SYSTEM: ZMIANA TRYBU NA ${mode}]
        Użytkownik właśnie przełączył się na ten tryb pracy. 
        TWOJE ZADANIE:
        1. Krótko streść dotychczasowe ustalenia w sprawie: ${selectedTopic}.
        2. Wyjaśnij konkretnie, jak Twój obecnie wybrany tryb pracy wspiera użytkownika w tej sytuacji.
        3. Zaproponuj konkretne działania (np. przygotowanie pisma, analiza konkretnego aspektu) ściśle związane z Twoją specjalizacją w tym trybie.
        
        SKUP SIĘ WYŁĄCZNIE NA OBECNYM TRYBIE. Nie sugeruj innych asystentów ani zmiany trybu. Pisz proaktywnie.`;

        handleSendMessage(modeChangeMessage, chatHistory, {
          lawArea: selectedLawArea,
          topic: selectedTopic,
          interactionMode: mode,
          servicePath: newServicePath
        });
      }
    }
  };

  const getSystemPromptForMode = (mode: InteractionMode, lawArea: LawArea, topic: string) => {
    let prompt = `Specjalizacja: ${lawArea}. Temat: ${topic}. Tryb: ${mode}.\n\n`;
    prompt += `ZASADA KRYTYCZNA: Skup się wyłącznie na obecnym trybie pracy (${mode}). Nie sugeruj zmiany trybu ani korzystania z innych asystentów dostępnych w menu. Twoim celem jest realizacja zadań przypisanych wyłącznie do tej specjalizacji.\n\n`;

    switch (mode) {
      case InteractionMode.StrategicAnalysis:
        prompt += `TWOJE ZADANIE: Jesteś Starszym Strategiem Procesowym. 
        Analizuj całą dostępną dokumentację użytkownika (teczkę sprawy).
        1. Zidentyfikuj MOCNE i SŁABE strony stanowiska użytkownika.
        2. Wskaż ZAGROŻENIA i SZANSE (analiza SWOT).
        3. Szukaj słabych punktów strony przeciwnej.
        4. Oszacuj PROCENTOWO szanse na wygraną na podstawie dowodów.
        5. Sugeruj konkretne przepisy i linie orzecznicze.
        Działaj proaktywnie, wyłapuj sprzeczności w dokumentach.
        Zawsze proponuj dalsze kroki strategiczne.`;
        break;
      case InteractionMode.Document:
        prompt += `TWOJE ZADANIE: Jesteś Ekspertem Legislacyjnym i Redaktorem Pism Procesowych.
        Twój cel to przygotowanie profesjonalnych projektów dokumentów.
        1. Na podstawie rozmowy wybierz odpowiedni rodzaj pisma (pozew, wniosek, apelacja, umowa).
        2. Jeśli brakuje danych (daty, sygnatury, strony), poproś o nie LUB zostaw [MIEJSCE NA UZUPEŁNIENIE].
        3. Generuj pismo w formacie czytelnym dla użytkownika.
        4. Zawsze umieszczaj projekt wewnątrz tagów: --- PROJEKT PISMA --- [treść] --- PROJEKT PISMA ---.
        Sugeruj konkretne rodzaje pism, które mogą teraz pomóc użytkownikowi.`;
        break;
      case InteractionMode.Court:
        prompt += `Tryb formalny, przygotowanie do sali rozpraw. Symuluj sędziego lub pełnomocnika, pomagając użytkownikowi przygotować się do przesłuchania...`;
        break;
      case InteractionMode.Negotiation:
        prompt += `TWOJE ZADANIE: Doradca ds. Negocjacji i Mediacji. 
        Pomóż przygotować argumentację do rozmów ze stroną przeciwną. Skup się na ugodowym załatwieniu sporu, ale dbaj o interes użytkownika.`;
        break;
      default:
        prompt += `Zasugeruj analizę i pomoc w oparciu o temat. Działaj pomocnie i merytorycznie.`;
    }
    return prompt;
  };

  const handleSelectQuickAction = (action: QuickAction) => {
    setSelectedLawArea(action.lawArea);
    if (action.topic) {
      setSelectedTopic(action.topic);
      handleLoadHistory(action.lawArea, action.topic);
    } else {
      setSelectedTopic(null);
      setChatHistory([]);
    }
    setInteractionMode(null);
    setIsQuickActionsModalOpen(false);
    setIsFullScreen(false);
    setIsWelcomeAssistantOpen(false);
  };

  const handleRemoveQuickAction = (index: number) => {
    if (!userProfile?.quickActions) return;
    const updatedActions = [...userProfile.quickActions];
    updatedActions.splice(index, 1);
    handleUpdateProfile({
      ...userProfile,
      quickActions: updatedActions
    }, false);
  };



  const handleQuickActionClick = (prompt: string) => {
    handleSendMessage(prompt);
  };

  const handleLoadHistory = async (lawArea: LawArea, topic: string, mode?: InteractionMode, path?: 'pro' | 'standard') => {
    if (!user) return;
    setIsWelcomeAssistantOpen(false);
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

    const chatId = getChatId(lawArea, topic, mode);

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
          await handleInitialGreeting(lawArea, topic, finalMode);
        } else if (savedHistory.length > 0 && mode && mode !== savedInteractionMode && mode !== InteractionMode.Advice) {
          // Mode change into existing history - Trigger Summary
          const modeChangeMessage = `[SYSTEM: ZMIANA TRYBU NA ${mode}]
          Użytkownik właśnie przełączył się na ten tryb pracy. 
          TWOJE ZADANIE:
          1. Krótko streść dotychczasowe ustalenia w sprawie: ${topic}.
          2. Wyjaśnij konkretnie, jak Twój obecnie wybrany tryb pracy wspiera użytkownika w tej sytuacji.
          3. Zaproponuj konkretne działania (np. przygotowanie pisma, analiza konkretnego aspektu) ściśle związane z Twoją specjalizacją w tym trybie.
          
          SKUP SIĘ WYŁĄCZNIE NA OBECNYM TRYBIE. Nie sugeruj innych asystentów ani zmiany trybu. Pisz proaktywnie.`;

          await handleSendMessage(modeChangeMessage, savedHistory, {
            lawArea: lawArea,
            topic: topic,
            interactionMode: mode,
            servicePath: path || savedServicePath || undefined
          });
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
            await handleInitialGreeting(lawArea, topic, modeToUse);
          }
        }
      }
    } catch (e) {
      console.error("Error loading chat history:", e);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-load history on initialization / refresh
  useEffect(() => {
    if (user && selectedLawArea && selectedTopic && chatHistory.length === 0 && !isLoading) {
      handleLoadHistory(selectedLawArea, selectedTopic, interactionMode || undefined);
    }
  }, [user, selectedLawArea, selectedTopic, interactionMode, chatHistory.length, isLoading, handleLoadHistory]);

  const handleDeleteHistory = async (lawArea: LawArea, topic: string) => {
    if (!user) return;

    try {
      // Delete main/base session
      const mainChatId = getChatId(lawArea, topic);
      await deleteDoc(doc(db, 'users', user.uid, 'chats', mainChatId));

      // Attempt to clean up all specialized variations
      const deletePromises = Object.values(InteractionMode).map(async (m) => {
        if (m === InteractionMode.Advice || m === InteractionMode.Analysis) return;
        const specializedId = getChatId(lawArea, topic, m);
        await deleteDoc(doc(db, 'users', user.uid, 'chats', specializedId));
      });
      await Promise.all(deletePromises);

      const h = await loadChatHistories();
      if (h) setChatHistories(h);

      // Sync with Quick Actions: Remove actions related to this topic
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

      if (linkedRole) {
        payload.linkedRole = linkedRole;
      }

      if (!noteId) {
        payload.createdAt = serverTimestamp();
      }

      await setDoc(doc(notesRef, finalNoteId), payload, { merge: true });

      // alert(noteId ? "Zaktualizowano notatkę." : "Dodano notatkę do wiadomości."); // Removed excessive alerts
    } catch (e) {
      console.error("Error adding/updating note:", e);
    }
  };

  const openProfileModal = () => {
    setIsProfileModalOpen(true);
  };

  const handleCaseAnalysis = async (description: string) => {
    if (!user) return;
    setIsLoading(true);
    const analysisResponse = await analyzeLegalCase(description, i18n.language);
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
      setIsWelcomeAssistantOpen(false);
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
      handleLoadHistory(selectedLawArea, topic, interactionMode || undefined);
    }
  };

  const handleGoHome = () => {
    resetNavigation();
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
      setInteractionMode(InteractionMode.Advice);
    }
  };

  const handleUniversalBack = () => {
    if (selectedTopic) {
      setSelectedTopic(null);
    } else if (!selectedTopic && interactionMode && (servicePath === 'pro')) {
      setServicePath(null);
      setInteractionMode(null);
      setCourtRole(null);
    } else if (!selectedTopic && interactionMode && (servicePath === 'hub' || servicePath === 'standard' || !servicePath)) {
      setServicePath(null);
      setInteractionMode(null);
      setCourtRole(null);
    } else if (!selectedTopic && !interactionMode && (servicePath === 'hub' || servicePath === 'standard')) {
      setServicePath(null);
    } else if (!selectedTopic && !interactionMode && !servicePath && selectedLawArea) {
      setSelectedLawArea(null);
    }
  };

  if (!isSplashDismissed) {
    return (
      <SplashScreen
        isReady={!authLoading && !profileLoading}
        onStart={() => {
          setIsShowAndromeda(true);
          setIsSplashDismissed(true);
        }}
      />
    );
  }


  const isAppDataLoading = authLoading || profileLoading || (isLoading && chatHistory.length === 0 && !interactionMode && !isWelcomeModalOpen && selectedTopic);

  // Consolidated loading experience with marketing messages

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
          <h2 className="text-2xl font-bold text-white mb-4">{t('activation.title')}</h2>
          <p className="text-slate-400 mb-8 leading-relaxed">
            {t('activation.description')}
          </p>
          <div className="space-y-4">
            <div className="bg-slate-700/30 p-4 rounded-xl text-xs text-slate-500 text-left">
              <p className="font-semibold text-slate-400 mb-1">{t('activation.statusTitle')}</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>{t('activation.planLabel')} {t('activation.planValue')}</li>
                <li>{t('activation.paymentLabel')} <span className="text-amber-500">{t('activation.paymentValue')}</span></li>
                <li>{t('activation.verificationLabel')} {t('activation.verificationValue')}</li>
              </ul>
            </div>
            <button
              onClick={() => auth.signOut()}
              className="w-full py-3 px-4 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors font-medium"
            >
              {t('activation.logout')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const showQuickActions = !isLoading && chatHistory.some(msg => msg.role === 'model');

  return (
    <>
      {isShowAndromeda && (
        <AndromedaAssistant
          onProceed={() => setIsShowAndromeda(false)}
          onProfileClick={() => setIsProfileModalOpen(true)}
          language={i18n.language}
        />
      )}
      <PWAUpdateNotification />
      {isAdmin && (
        <React.Suspense fallback={null}>
          <GlobalAdminNotes userEmail={user?.email || null} isAdmin={isAdmin} currentViewId={currentViewId} />
        </React.Suspense>
      )}
      <AdminBroadcastInput user={user} />
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
        handleRemoveQuickAction={handleRemoveQuickAction}
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
        isWelcomeAssistantOpen={isWelcomeAssistantOpen}
        setIsWelcomeAssistantOpen={setIsWelcomeAssistantOpen}
      />

      <PlanSelectionModal
        isOpen={!profileLoading && (!userProfile?.subscription || userProfile.subscription.status === SubscriptionStatus.Expired)}
        onSelectPlan={handleSelectPlan}
        subscription={userProfile?.subscription}
        isLoading={isLoading}
      />







      <GlobalAnnouncement />

      <div className="flex flex-col h-[100dvh] bg-slate-800 relative">
        {/* MODULAR FEATURE: Alimony Calculator (Only for Family Law) */}
        {selectedLawArea === LawArea.Family && !isLoading && !isWelcomeModalOpen && (
          <>
            <DraggableButton
              id="alimony-calculator-v6"
              initialBottom={250}
              initialRight={20}
              onClick={() => setIsAlimonyModalOpen(true)}
              className="bg-pink-600 hover:bg-pink-500 text-white p-4 rounded-full shadow-2xl border border-pink-400/50 transition-all group hover:scale-105 active:scale-95"
              title="Kalkulator Alimentów"
            >
              <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-900 shadow-sm">
                NEW
              </div>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </DraggableButton>

            <AlimonyCalculator
              isOpen={isAlimonyModalOpen}
              onClose={() => setIsAlimonyModalOpen(false)}
              lawArea={selectedLawArea}
            />
          </>
        )}
        {!isFullScreen && (
          <AppHeader
            title={
              (() => {
                const breadcrumbParts = [];

                // Level 1: Service Path (Home/Base)
                if (servicePath) {
                  breadcrumbParts.push({
                    label: servicePath === 'pro' ? t('breadcrumbs.pro_zone') : t('breadcrumbs.ai_tools'),
                    color: 'text-slate-400 hover:text-white',
                    onClick: handleGoHome
                  });
                }

                // Level 2: Law Area
                if (selectedLawArea) {
                  breadcrumbParts.push({
                    label: t(`law.areas.${selectedLawArea.toLowerCase()}`),
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
                  const interactionModeMap: Record<string, string> = {
                    [InteractionMode.Advice]: 'advice',
                    [InteractionMode.Analysis]: 'analysis',
                    [InteractionMode.Document]: 'document',
                    [InteractionMode.LegalTraining]: 'legal_training',
                    [InteractionMode.SuggestRegulations]: 'suggest_regulations',
                    [InteractionMode.FindRulings]: 'find_rulings',
                    [InteractionMode.Court]: 'court',
                    [InteractionMode.Negotiation]: 'negotiation',
                    [InteractionMode.StrategicAnalysis]: 'strategic_analysis',
                    [InteractionMode.AppHelp]: 'app_help' // Fallback if exists or handle explicitly?
                  };

                  breadcrumbParts.push({
                    label: t(`interaction.modes.${interactionModeMap[interactionMode] || 'advice'}`),
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
                  return t('breadcrumbs.home');
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
            onHelpClick={() => setIsAppHelpSidebarOpen(true)}
            onQuickActionsClick={() => setIsQuickActionsModalOpen(true)}
            onHistoryClick={() => setIsHistoryPanelOpen(true)}
            onAiToolsClick={() => setIsAiToolsSidebarOpen(true)}
            onBackClick={
              (selectedTopic && interactionMode) || (selectedTopic && !interactionMode) || (selectedLawArea && !selectedTopic)
                ? handleUniversalBack
                : undefined
            }
            onHomeClick={handleGoHome}
            totalCost={totalCost}
            subscription={userProfile?.subscription}
            onKnowledgeClick={() => handleViewKnowledge()}
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
            onAndromedaClick={() => setIsShowAndromeda(true)}
          />
        )}

        <main ref={chatContainerRef} className="flex-1 overflow-y-auto">
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
                selectedTopic={selectedTopic}
                onSelectTopic={setSelectedTopic}
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
                handleLoadHistory(selectedLawArea!, topic, InteractionMode.StrategicAnalysis, 'pro');
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
                handleLoadHistory(selectedLawArea!, topic, interactionMode || undefined);
              }}
              onAddNegotiationTopic={async (topic) => {
                await handleAddTopic(topic, InteractionMode.Negotiation, 'standard');
                const h = await loadChatHistories();
                if (h) setChatHistories(h);
                handleLoadHistory(selectedLawArea!, topic, InteractionMode.Negotiation);
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
              isFullScreen={isFullScreen}
              setIsFullScreen={setIsFullScreen}
              isDeepThinkingEnabled={isDeepThinkingEnabled}
              setIsDeepThinkingEnabled={setIsDeepThinkingEnabled}
              onAddNote={(content, linkedMsg, noteId, linkedRole) => handleAddNote(content, linkedMsg, noteId, linkedRole)}
              onDeleteNote={deleteNote}
              onUpdateNotePosition={handleUpdateNotePosition}
              existingNotes={
                chatNotes.map(n => ({
                  id: n.id,
                  content: n.content,
                  linkedMessage: n.linkedMessage,
                  linkedRole: n.linkedRole,
                  position: n.position
                }))
              }
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
                    {chatHistory.filter(msg => msg.role !== 'system' && !msg.content.includes('[SYSTEM:')).map((msg, index) => {
                      // Find notes linked to this message (by content snippet match)
                      return (
                        <ChatBubble
                          key={index}
                          message={msg}
                          onPreviewDocument={handlePreviewDocument}
                          onAddDeadline={handleAddDeadline}
                          onAddTask={handleAddTask}
                          onAddNote={(content, linkedMsg, noteId) => handleAddNote(content, linkedMsg, noteId, msg.role as 'user' | 'model' | 'system')}
                          onSelectMode={handleSelectInteractionMode}
                          onDeleteNote={deleteNote}
                          onUpdateNotePosition={handleUpdateNotePosition}
                          existingNotes={chatNotes.filter(n =>
                            n.linkedMessage === msg.content.substring(0, 50) &&
                            (!n.linkedRole || n.linkedRole === msg.role)
                          )}
                          lawArea={selectedLawArea || undefined}
                          topic={selectedTopic || undefined}
                        />
                      )
                    })}
                    {isLoading && <LoadingSpinner />}
                    <div ref={messagesEndRef} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>

        <RemindersWidget user={user} />
        {!profileLoading && (
          <CookieConsent
            userProfile={userProfile}
            onUpdateProfile={handleUpdateProfile}
            isLoading={profileLoading}
          />
        )}
        <AppHelpSidebar
          isOpen={isAppHelpSidebarOpen}
          onClose={() => setIsAppHelpSidebarOpen(false)}
          userId={user?.uid}
        />

        {selectedTopic && interactionMode && servicePath !== 'pro' && (
          <footer className={`bg-slate-900 transition-all duration-200 ${(!isMobileToolbarOpen && !mobileToolbarAlwaysShow && !isFullScreen) ? 'py-0.5 px-2 md:p-4' : 'p-2 md:p-4'}`}>
            <div className="max-w-4xl mx-auto">
              {showQuickActions && !isFullScreen && (
                <div className={`${(!isMobileToolbarOpen && !mobileToolbarAlwaysShow) ? 'hidden md:block' : 'block'}`}>
                  <QuickActions interactionMode={interactionMode} onActionClick={handleQuickActionClick} />
                </div>
              )}
              <div className={`flex flex-col gap-2 md:gap-3 ${(!isMobileToolbarOpen && !mobileToolbarAlwaysShow) ? 'mt-0 md:mt-3' : 'mt-1 md:mt-3'}`}>
                {!isFullScreen && (
                  <>
                    {/* Mobile Collapse Toggle: Visible ONLY on mobile + collapsed + NOT always show */}
                    <div className={`md:hidden ${(!isMobileToolbarOpen && !mobileToolbarAlwaysShow) ? 'block' : 'hidden'}`}>
                      <button
                        onClick={() => setIsMobileToolbarOpen(true)}
                        className="p-1 text-slate-500 hover:text-white transition-colors"
                        title={t('mobile.toolbarOptions')}
                      >
                        <EllipsisHorizontalIcon className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Toolbar Content: Visible on Desktop OR (Mobile + Expanded) OR (Mobile + Always Show) */}
                    <div className={`${(!isMobileToolbarOpen && !mobileToolbarAlwaysShow) ? 'hidden md:flex' : 'flex'} flex-col md:flex-row md:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200 md:animate-none`}>
                      <div className="flex items-center justify-between gap-3 flex-wrap w-full">
                        <div className="flex items-center">
                          <label htmlFor="deep-thinking-toggle" className="text-[10px] sm:text-xs leading-tight font-medium text-slate-400 mr-2 cursor-pointer flex flex-col items-center">
                            <span>{t('chat.deepThinking_l1')}</span>
                            <span>{t('chat.deepThinking_l2')}</span>
                          </label>
                          <button
                            id="deep-thinking-toggle"
                            onClick={() => setIsDeepThinkingEnabled(!isDeepThinkingEnabled)}
                            className={`relative inline-flex items-center h-5 rounded-full w-10 transition-colors ${isDeepThinkingEnabled ? 'bg-cyan-600' : 'bg-slate-600'}`}
                          >
                            <span className={`inline-block w-3.5 h-3.5 transform bg-white rounded-full transition-transform ${isDeepThinkingEnabled ? 'translate-x-5.5' : 'translate-x-1'}`} />
                          </button>

                          {selectedTopic && (
                            <button
                              onClick={handleGenerateKnowledge}
                              className="ml-4 p-1.5 text-slate-300 hover:text-green-400 hover:bg-slate-700/50 rounded-lg transition-all border border-slate-700 bg-slate-800/50 group flex items-center gap-2"
                              title={t('app.generateKnowledge')}
                            >
                              <BrainIcon className="h-5 w-5 text-green-400 group-hover:scale-110 transition-transform" />
                              <span className="text-[10px] font-bold uppercase tracking-tight hidden sm:inline">{t('app.generateKnowledge')}</span>
                            </button>
                          )}

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
                              onClick={() => setIsFullScreen(!isFullScreen)}
                              className={`p-1.5 text-slate-300 hover:text-white rounded-lg transition-colors border border-slate-700 ${isFullScreen ? 'bg-cyan-900/50 text-cyan-400 border-cyan-500/50' : 'bg-slate-800/50'}`}
                              title={isFullScreen ? "Wyjdź z pełnego ekranu" : "Pełny ekran"}
                            >
                              {isFullScreen ? <ArrowsContractIcon className="w-4 h-4" /> : <ArrowsExpandIcon className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => {
                                setIsCaseManagementModalOpen(true);
                              }}
                              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors border border-slate-600 shadow-lg bg-slate-800/50"
                              aria-label="Zarządzaj sprawą"
                              title="Zarządzaj sprawą"
                            >
                              <AdjustmentsHorizontalIcon className="h-5 w-5 text-cyan-400" />
                            </button>

                          </div>
                        </div>
                      </div>

                      <div className="md:hidden w-full flex items-center justify-between border-t border-slate-700/50 mt-2 pt-2">
                        <button
                          onClick={() => setIsMobileToolbarOpen(false)}
                          className="text-[10px] text-slate-500 hover:text-white px-2 py-1 bg-slate-800/50 rounded hover:bg-slate-700 transition-colors"
                        >
                          {t('mobile.hide')}
                        </button>
                        <div className="flex items-center gap-2 cursor-pointer" onClick={toggleMobileToolbarAlwaysShow}>
                          <span className="text-[10px] text-slate-400">{t('mobile.showAlways')}</span>
                          <div className={`relative inline-flex items-center h-4 rounded-full w-8 transition-colors ${mobileToolbarAlwaysShow ? 'bg-cyan-600' : 'bg-slate-700'}`}>
                            <span className={`inline-block w-2.5 h-2.5 transform bg-white rounded-full transition-transform ${mobileToolbarAlwaysShow ? 'translate-x-4.5' : 'translate-x-1'}`} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <div className="flex items-end gap-2 bg-slate-800 rounded-xl p-1.5 md:p-2 border border-slate-700/50">
                  {isFullScreen && (
                    <button
                      onClick={() => setIsFullScreen(false)}
                      className="p-1.5 md:p-2 text-slate-400 hover:text-cyan-400 rounded-lg border border-slate-700 bg-slate-900/50"
                      title="Wyjdź z pełnego ekranu"
                    >
                      <ArrowsContractIcon className="w-5 h-5" />
                    </button>
                  )}
                  <button onClick={() => document.getElementById('chat-file-upload')?.click()} className="p-1.5 md:p-2 text-slate-400 hover:text-cyan-400 rounded-lg"><PaperClipIcon className="w-5 h-5" /></button>
                  <input id="chat-file-upload" type="file" className="hidden" onChange={async (e) => { const file = e.target.files?.[0]; if (file) await handleFileUpload(file); e.target.value = ''; }} />
                  <textarea ref={textareaRef} value={currentMessage} onChange={(e) => setCurrentMessage(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }} placeholder={t('chat.messagePlaceholder')} className="w-full bg-transparent text-slate-200 placeholder-slate-400 focus:outline-none resize-none max-h-48 py-1 md:py-0" rows={1} disabled={isLoading} />
                  <button onClick={() => handleSendMessage()} disabled={isLoading || !currentMessage.trim()} className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white p-2 md:p-2.5 rounded-full"><SendIcon /></button>
                </div>
              </div>
            </div>
          </footer>
        )}
      </div>
      <AiToolsSidebar
        isOpen={isAiToolsSidebarOpen}
        onClose={() => setIsAiToolsSidebarOpen(false)}
        lawArea={selectedLawArea || LawArea.Civil}
        selectedTopic={selectedTopic}
        onSelectTopic={setSelectedTopic}
        onSelectMode={(mode, context) => {
          handleSelectInteractionMode(mode, context);
          setIsAiToolsSidebarOpen(false);
        }}
        onViewDocuments={() => setIsDocumentsModalOpen(true)}
        onViewHistory={() => setIsHistoryPanelOpen(true)}
        onViewKnowledge={() => setIsKnowledgeModalOpen(true)}
      />
    </>
  );
};

export default App;
