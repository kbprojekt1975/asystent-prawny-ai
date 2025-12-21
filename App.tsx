import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { LawArea, ChatMessage, InteractionMode, UserProfile, QuickAction, SubscriptionStatus, SubscriptionInfo } from './types';
import { getLegalAdvice, analyzeLegalCase } from './services/geminiService';
import LawSelector from './components/LawSelector';
import TopicSelector from './components/TopicSelector';
import InteractionModeSelector from './components/InteractionModeSelector';
import ChatBubble from './components/ChatBubble';
import LoadingSpinner from './components/LoadingSpinner';
import ConfirmationModal from './components/ConfirmationModal';
import UserProfileModal from './components/UserProfileModal';
import HistoryPanel from './components/HistoryPanel';
import QuickActions from './components/QuickActions';
import { SendIcon, ArrowsContractIcon } from './components/Icons';
import AppHeader from './components/AppHeader';
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

const initialTopics: Record<LawArea, string[]> = {
  [LawArea.Criminal]: ["Obrona w sprawie o kradzież", "Jazda pod wpływem alkoholu", "Zniesławienie"],
  [LawArea.Family]: ["Rozwód", "Alimenty na dziecko", "Ustalenie kontaktów z dzieckiem"],
  [LawArea.Civil]: ["Sprawa o spadek", "Niewykonanie umowy", "Odszkodowanie za wypadek"],
  [LawArea.Commercial]: ["Założenie spółki z o.o.", "Spór z kontrahentem", "Rejestracja znaku towarowego"],
};

const initialProfile: UserProfile = {
  quickActions: [],
  totalCost: 0
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [selectedLawArea, setSelectedLawArea] = useState<LawArea | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [interactionMode, setInteractionMode] = useState<InteractionMode | null>(null);
  const [topics, setTopics] = useState<Record<LawArea, string[]>>(initialTopics);

  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState<string>('');
  const [legalArticles, setLegalArticles] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDeepThinkingEnabled, setIsDeepThinkingEnabled] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [topicToDelete, setTopicToDelete] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(initialProfile);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isQuickActionsModalOpen, setIsQuickActionsModalOpen] = useState(false);
  const [isHistoryPanelOpen, setIsHistoryPanelOpen] = useState(false);
  const [chatHistories, setChatHistories] = useState<{ lawArea: LawArea; topic: string; interactionMode?: InteractionMode; lastUpdated?: any }[]>([]);

  const [isAnalysisMode, setIsAnalysisMode] = useState<boolean>(false);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState<boolean>(false);
  const [totalCost, setTotalCost] = useState<number>(0);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');
  const [todayDeadlines, setTodayDeadlines] = useState<any[]>([]);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // --- OPTYMALIZACJA: Użycie useMemo dla chatId ---
  const currentChatId = useMemo(() => {
    if (selectedLawArea && selectedTopic) {
      // Identyfikator czatu używany do zapisu w Firestore i wywołania funkcji
      return `${selectedLawArea}_${selectedTopic}`;
    }
    return null;
  }, [selectedLawArea, selectedTopic]);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      if (currentUser) {
        setTimeout(() => {
          if (!selectedLawArea) {
            setIsWelcomeModalOpen(true);
          }
        }, 500);
      }
    });
    return () => unsubscribe();
  }, []);

  const loadChatHistories = useCallback(async () => {
    if (!user) return;
    try {
      const chatsColRef = collection(db, 'users', user.uid, 'chats');
      const querySnapshot = await getDocs(chatsColRef);

      const histories: { lawArea: LawArea; topic: string; interactionMode?: InteractionMode; lastUpdated?: any }[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const parts = doc.id.split('_');
        if (parts.length >= 2) {
          const lawArea = parts[0] as LawArea;
          const topic = parts.slice(1).join('_');

          let interactionMode: InteractionMode | undefined = undefined;

          // Try to get explicit metadata first
          if (data.interactionMode && Object.values(InteractionMode).includes(data.interactionMode)) {
            interactionMode = data.interactionMode as InteractionMode;
          }
          // Fallback to parsing system message
          else if (data.messages && data.messages.length > 0 && data.messages[0].role === 'system') {
            const systemMessage = data.messages[0].content;
            const modeMatch = systemMessage.match(/Tryb: (.*)$/);
            if (modeMatch && modeMatch[1]) {
              const modeString = modeMatch[1].trim();
              if (Object.values(InteractionMode).includes(modeString as InteractionMode)) {
                interactionMode = modeString as InteractionMode;
              }
            }
          }
          histories.push({
            lawArea,
            topic,
            interactionMode,
            lastUpdated: data.lastUpdated
          });
        }
      });

      // Sort by lastUpdated desc, or fallback to name
      histories.sort((a, b) => {
        if (a.lastUpdated && b.lastUpdated) {
          return b.lastUpdated.seconds - a.lastUpdated.seconds;
        }
        if (a.lastUpdated) return -1;
        if (b.lastUpdated) return 1;

        const lawAreaCompare = a.lawArea.localeCompare(b.lawArea);
        if (lawAreaCompare !== 0) return lawAreaCompare;
        return a.topic.localeCompare(b.topic);
      });
      setChatHistories(histories);

    } catch (e) {
      console.error("Error loading chat histories:", e);
    }
  }, [user]);

  // Load User Data (Topics & Profile)
  useEffect(() => {
    if (!user) return;

    const userDocRef = doc(db, 'users', user.uid);

    // Use onSnapshot for real-time updates (e.g., admin activating payment)
    const unsubscribe = onSnapshot(userDocRef, async (userDoc) => {
      try {
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.topics) setTopics(data.topics);

          let profile = data.profile || initialProfile;

          // Check for subscription activation/expiration
          if (profile.subscription) {
            const now = new Date();
            let sub = { ...profile.subscription };
            let needsUpdate = false;

            // 1. Check for manual revocation
            if (!sub.isPaid && sub.status === SubscriptionStatus.Active) {
              sub = {
                ...sub,
                status: SubscriptionStatus.Pending
              };
              needsUpdate = true;
            }

            // 2. Check for admin activation
            if (sub.isPaid && sub.status === SubscriptionStatus.Pending) {
              const activatedAt = now;
              const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
              sub = {
                ...sub,
                status: SubscriptionStatus.Active,
                activatedAt: Timestamp.fromDate(activatedAt),
                expiresAt: Timestamp.fromDate(expiresAt)
              };
              needsUpdate = true;
            }

            // 3. Check for expiration
            if (sub.status === SubscriptionStatus.Active && sub.expiresAt) {
              const expiresAtDate = sub.expiresAt instanceof Timestamp
                ? sub.expiresAt.toDate()
                : new Date(sub.expiresAt);

              if (now > expiresAtDate || sub.spentAmount >= sub.creditLimit) {
                sub = {
                  ...sub,
                  status: SubscriptionStatus.Expired
                };
                needsUpdate = true;
              }
            }

            if (needsUpdate) {
              profile = { ...profile, subscription: sub };
              await updateDoc(userDocRef, { profile });
            }
          }

          // Override with session data if exists
          const sessionData = sessionStorage.getItem('personalData');
          if (sessionData) {
            try {
              const parsed = JSON.parse(sessionData);
              profile = { ...profile, personalData: parsed };
            } catch (e) {
              console.error("Session data parse error:", e);
            }
          }

          setUserProfile(profile);
          if (data.totalCost) setTotalCost(data.totalCost);
        } else {
          // Initialize user doc if not exists
          await setDoc(userDocRef, {
            topics: initialTopics,
            profile: initialProfile,
            totalCost: 0
          }, { merge: true });
        }
      } catch (e) {
        console.error("Error handling user data snapshot:", e);
      }
    });

    loadChatHistories();
    return () => unsubscribe();
  }, [user, loadChatHistories]);

  // Request Notification Permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Monitor upcoming deadlines across all chats
  useEffect(() => {
    if (!user) return;

    // We'll monitor current chat's timeline for simplicity in this demo,
    // but in a production app we might want a global 'deadlines' collection or monitor all active chats.
    if (!currentChatId) {
      setTodayDeadlines([]);
      return;
    }

    const timelineRef = collection(db, 'users', user.uid, 'chats', currentChatId, 'timeline');
    const q = query(timelineRef, orderBy('date', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const todayStr = new Date().toISOString().split('T')[0];
      const dueEvents = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as any))
        .filter(ev => ev.type === 'deadline' && ev.date === todayStr);

      setTodayDeadlines(dueEvents);

      // Trigger browser notification for new today's deadlines
      if (dueEvents.length > 0 && Notification.permission === "granted") {
        dueEvents.forEach(ev => {
          // We use a sessionStorage flag to avoid repeating notifications in the same session
          const notifiedKey = `notified_${ev.id}`;
          if (!sessionStorage.getItem(notifiedKey)) {
            new Notification("TERMIN UPŁYWA DZISIAJ!", {
              body: `${ev.title}: ${ev.description || ''}`,
              icon: "/favicon.ico" // assuming there is one
            });
            sessionStorage.setItem(notifiedKey, "true");
          }
        });
      }
    });

    return () => unsubscribe();
  }, [user, currentChatId]);


  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory, isLoading]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${scrollHeight}px`;
    }
  }, [currentMessage]);

  const loadChatData = async (area: LawArea, topic: string) => {
    if (!user) return [];
    const chatId = `${area}_${topic}`;
    try {
      const chatDoc = await getDoc(doc(db, 'users', user.uid, 'chats', chatId));
      if (chatDoc.exists()) {
        return chatDoc.data().messages || [];
      }
    } catch (e) {
      console.error("Error loading chat data:", e);
    }
    return [];
  };

  const handleSelectLawArea = (area: LawArea) => {
    setSelectedLawArea(area);
  };

  const handleSelectTopic = async (topic: string) => {
    setSelectedTopic(topic);
    if (selectedLawArea && user) {
      setIsLoading(true);
      const messages = await loadChatData(selectedLawArea, topic);
      setChatHistory(messages);
      setIsLoading(false);
    }
  }

  const handleAddTopic = useCallback(async (newTopic: string) => {
    if (!selectedLawArea || !newTopic.trim() || !user) return;
    const trimmedTopic = newTopic.trim();
    if (topics[selectedLawArea].includes(trimmedTopic)) return;

    const updatedTopics = {
      ...topics,
      [selectedLawArea]: [...topics[selectedLawArea], trimmedTopic]
    };

    setTopics(updatedTopics);
    setSelectedTopic(trimmedTopic);
    setChatHistory([]); // New topic, empty history

    // Save to Firestore
    try {
      await setDoc(doc(db, 'users', user.uid), { topics: updatedTopics }, { merge: true });
    } catch (e) {
      console.error("Error saving topics:", e);
    }

  }, [selectedLawArea, topics, user]);

  const requestDeleteTopic = useCallback((topic: string) => {
    setTopicToDelete(topic);
    setIsDeleteModalOpen(true);
  }, []);

  const confirmDeleteTopic = useCallback(async () => {
    if (!selectedLawArea || !topicToDelete || !user) return;

    const updatedTopics = {
      ...topics,
      [selectedLawArea]: topics[selectedLawArea].filter(t => t !== topicToDelete)
    };

    setTopics(updatedTopics);

    // Update Firestore topics
    try {
      await setDoc(doc(db, 'users', user.uid), { topics: updatedTopics }, { merge: true });
      // Delete chat document
      const chatId = `${selectedLawArea}_${topicToDelete}`;
      await deleteDoc(doc(db, 'users', user.uid, 'chats', chatId));
    } catch (e) {
      console.error("Error deleting topic/chat:", e);
    }

    loadChatHistories();
    setTopicToDelete(null);
  }, [selectedLawArea, topicToDelete, topics, user, loadChatHistories]);

  const cancelDeleteTopic = () => {
    setIsDeleteModalOpen(false);
    setTopicToDelete(null);
  };

  const handleSelectInteractionMode = (mode: InteractionMode) => {
    if (!selectedLawArea || !selectedTopic) return;
    setInteractionMode(mode);
    // Add system message only if chat is empty
    if (chatHistory.length === 0) {
      let systemContent = `Specjalizacja: ${selectedLawArea}. Temat: ${selectedTopic}. Tryb: ${mode}`;

      if (mode === InteractionMode.Document) {
        systemContent += `\n\nTWOJE ZADANIE: Generowanie pism procesowych i wniosków. 
        Kiedy użytkownik poprosi o projekt pisma, wygeneruj go i OWIŃ go w tagi --- PROJEKT PISMA ---
        Przykład:
        Oto projekt wezwania do zapłaty:
        --- PROJEKT PISMA ---
        [Treść pisma z tagami takimi jak {{MY_NAME}}, {{MY_ADDRESS}}, {{DATE}} itp.]
        --- PROJEKT PISMA ---
        
        WAŻNE: Jeśli wykryjesz w poradzie krytyczne terminy (np. na odwołanie), zasugeruj ich dodanie w formacie:
        --- PROJEKT TERMINU --- [RRRR-MM-DD]|[Tytuł]|[Opis] --- PROJEKT TERMINU ---
        
        Jeśli zasugerujesz listę zadań, dodaj je pojedynczo w formacie:
        --- PROJEKT ZADANIA --- [Treść zadania] --- PROJEKT ZADANIA ---`;
      }

      const initialMessages: ChatMessage[] = [{
        role: 'system',
        content: systemContent
      }];
      setChatHistory(initialMessages);
    }
  };

  const handleBackToLawArea = () => {
    setSelectedLawArea(null);
    setSelectedTopic(null);
    setInteractionMode(null);
    setChatHistory([]);
    setIsAnalysisMode(false);
    setIsFullScreen(false);
    setIsWelcomeModalOpen(false);
  };

  const handleBackToTopic = () => {
    setSelectedTopic(null);
    setInteractionMode(null);
    setChatHistory([]);
    setIsFullScreen(false);
  };

  const handleGoHome = () => {
    setSelectedLawArea(null);
    setSelectedTopic(null);
    setInteractionMode(null);
    setChatHistory([]);
    setIsAnalysisMode(false);
    setIsFullScreen(false);
  };

  const handleSendMessage = useCallback(async (
    messageOverride?: string,
    historyOverride?: ChatMessage[],
    metadataOverride?: { lawArea: LawArea, topic: string, interactionMode: InteractionMode }
  ) => {
    // Determine effective values (use overrides or current state)
    const effectiveLawArea = metadataOverride?.lawArea || selectedLawArea;
    const effectiveTopic = metadataOverride?.topic || selectedTopic;
    const effectiveInteractionMode = metadataOverride?.interactionMode || interactionMode;

    // Używamy ujednoliconego chatId
    const effectiveChatId = metadataOverride
      ? `${metadataOverride.lawArea}_${metadataOverride.topic}`
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

    // BLOCK IF NOT ACTIVE
    if (userProfile?.subscription?.status !== SubscriptionStatus.Active) {
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
      const chatId = effectiveChatId;
      await setDoc(doc(db, 'users', user.uid, 'chats', chatId), {
        messages: newHistory,
        lastUpdated: serverTimestamp(),
        lawArea: effectiveLawArea,
        topic: effectiveTopic,
        interactionMode: effectiveInteractionMode
      }, { merge: true });

      // --- KLUCZOWA POPRAWKA: Przekazanie chatID ---
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
        setTotalCost(prev => prev + cost);
        await updateDoc(doc(db, 'users', user.uid), {
          totalCost: increment(cost)
        });
      }

      // Save to Firestore with timestamp and metadata
      await setDoc(doc(db, 'users', user.uid, 'chats', effectiveChatId), {
        messages: finalHistory,
        lastUpdated: serverTimestamp(),
        lawArea: effectiveLawArea,
        topic: effectiveTopic,
        interactionMode: effectiveInteractionMode
      }, { merge: true });

      // Reload histories to update the list order
      loadChatHistories();

    } catch (error) {
      console.error("AI Error", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentMessage, selectedLawArea, interactionMode, isLoading, legalArticles, isDeepThinkingEnabled, selectedTopic, chatHistory, user, loadChatHistories, currentChatId, userProfile?.subscription?.status]);

  const handleQuickActionClick = (prompt: string) => {
    handleSendMessage(prompt);
  };

  const handleUpdateProfile = async (newProfile: UserProfile, isSessionOnly: boolean = false) => {
    setUserProfile(newProfile);

    if (isSessionOnly) {
      if (newProfile.personalData) {
        sessionStorage.setItem('personalData', JSON.stringify(newProfile.personalData));
      }
      return;
    } else {
      sessionStorage.removeItem('personalData');
    }

    if (!user) return;
    try {
      await setDoc(doc(db, 'users', user.uid), { profile: newProfile }, { merge: true });
    } catch (e) {
      console.error("Error saving profile:", e);
    }
  };

  const handleSelectQuickAction = (action: QuickAction) => {
    setSelectedLawArea(action.lawArea);
    if (action.topic) {
      handleSelectTopic(action.topic);
    } else {
      setSelectedTopic(null);
      setChatHistory([]);
    }
    setInteractionMode(null);
    setIsQuickActionsModalOpen(false);
    setIsAnalysisMode(false);
    setIsFullScreen(false);
    setIsWelcomeModalOpen(false);
  };

  const handleLoadHistory = async (lawArea: LawArea, topic: string) => {
    if (!user) return;

    // Close panels
    setIsHistoryPanelOpen(false);
    setIsWelcomeModalOpen(false);

    // Show global loading state
    setIsLoading(true);

    // Reset state to ensure clean switch
    setChatHistory([]);
    setInteractionMode(null);
    setIsAnalysisMode(false);
    setIsFullScreen(false);

    // Pre-set context
    setSelectedLawArea(lawArea);
    setSelectedTopic(topic);

    const chatId = `${lawArea}_${topic}`;
    try {
      const chatDoc = await getDoc(doc(db, 'users', user.uid, 'chats', chatId));

      if (chatDoc.exists()) {
        const data = chatDoc.data();
        const savedHistory = data.messages || [];

        // Try explicit metadata first
        let savedInteractionMode = data.interactionMode as InteractionMode;

        // Fallback to parsing system message
        if (!savedInteractionMode && savedHistory.length > 0 && savedHistory[0].role === 'system') {
          const systemMessage = savedHistory[0].content;
          const modeMatch = systemMessage.match(/Tryb: (.*)$/);
          if (modeMatch && modeMatch[1]) {
            const parsed = modeMatch[1].trim() as InteractionMode;
            if (Object.values(InteractionMode).includes(parsed)) {
              savedInteractionMode = parsed;
            }
          }
        }

        // Set states atomically
        setChatHistory(savedHistory);
        if (savedInteractionMode) {
          setInteractionMode(savedInteractionMode);
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
    const chatId = `${lawArea}_${topic}`;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'chats', chatId));
      loadChatHistories();
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
        date,
        title,
        description,
        type: 'deadline',
        createdAt: serverTimestamp()
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
        text,
        completed: false,
        createdAt: serverTimestamp()
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
    // Analiza przypadku zwraca również chatId (jeśli back-end zwraca)
    const analysisResponse = await analyzeLegalCase(description);
    const { result, usage, chatId: returnedChatId } = analysisResponse; // Odbieramy chatId

    if (usage && usage.cost > 0) {
      setTotalCost(prev => prev + usage.cost);
      await updateDoc(doc(db, 'users', user.uid), {
        totalCost: increment(usage.cost)
      });
    }

    if (result) {
      if (!topics[result.lawArea].includes(result.topic)) {
        const updatedTopics = {
          ...topics,
          [result.lawArea]: [...topics[result.lawArea], result.topic]
        };
        setTopics(updatedTopics);
        await setDoc(doc(db, 'users', user.uid), { topics: updatedTopics }, { merge: true });
      }

      // Ustawienie stanów
      setSelectedLawArea(result.lawArea);
      setSelectedTopic(result.topic);
      setInteractionMode(result.interactionMode);

      setIsAnalysisMode(false);
      setIsWelcomeModalOpen(false);
      setIsLoading(false);

      const initialHistory: ChatMessage[] = [
        {
          role: 'system',
          content: `Specjalizacja: ${result.lawArea}. Temat: ${result.topic}. Tryb: ${result.interactionMode}`
        },
        {
          role: 'user',
          content: description
        }
      ];

      // Używamy handleSendMessage, aby wysłać pierwszą wiadomość czatu.
      // Dalsze wysyłki będą używać currentChatId, który zostanie automatycznie 
      // zaktualizowany przez useEffect po ustawieniu selectedLawArea/selectedTopic.
      handleSendMessage(undefined, initialHistory, {
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
        creditLimit: 10.00,
        spentAmount: 0
      };

      const updatedProfile = {
        ...userProfile,
        subscription: newSubscription
      };

      setUserProfile(updatedProfile);
      await setDoc(doc(db, 'users', user.uid), { profile: updatedProfile }, { merge: true });
    } catch (e) {
      console.error("Error selecting plan:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const renderUserProfileModal = () => (
    <UserProfileModal
      isOpen={isProfileModalOpen}
      onClose={() => setIsProfileModalOpen(false)}
      onUpdateProfile={handleUpdateProfile}
      profile={userProfile || initialProfile}
      allTopics={topics}
    />
  );

  const renderHistoryPanel = () => (
    <HistoryPanel
      isOpen={isHistoryPanelOpen}
      onClose={() => setIsHistoryPanelOpen(false)}
      histories={chatHistories}
      onLoadHistory={handleLoadHistory}
      onDeleteHistory={handleDeleteHistory}
    />
  );

  const renderQuickActionsModal = () => (
    <QuickActionsModal
      isOpen={isQuickActionsModalOpen}
      onClose={() => setIsQuickActionsModalOpen(false)}
      onSelect={handleSelectQuickAction}
      quickActions={userProfile?.quickActions || []}
    />
  );

  const renderWelcomeModal = () => (
    <WelcomeAnalysisModal
      isOpen={isWelcomeModalOpen}
      onClose={() => setIsWelcomeModalOpen(false)}
      onAnalyze={handleCaseAnalysis}
      isLoading={isLoading}
    />
  );

  const renderPlanSelectionModal = () => (
    <PlanSelectionModal
      isOpen={!userProfile?.subscription || userProfile.subscription.status !== SubscriptionStatus.Active}
      onSelectPlan={handleSelectPlan}
      subscription={userProfile?.subscription}
      isLoading={isLoading}
    />
  );

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

  // Global loading state for full-screen transitions (e.g. loading history)
  if (isLoading && chatHistory.length === 0 && !isAnalysisMode && !isWelcomeModalOpen) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-500"></div>
          <p className="text-slate-400">Ładowanie sprawy...</p>
        </div>
      </div>
    );
  }

  if (isAnalysisMode) {
    return (
      <>
        {renderUserProfileModal()}
        {renderPlanSelectionModal()}
        {renderQuickActionsModal()}
        {renderHistoryPanel()}
        <div className="flex flex-col min-h-screen bg-slate-900">
          <AppHeader
            title="Inteligentna Analiza Sprawy"
            onProfileClick={openProfileModal}
            onQuickActionsClick={() => setIsQuickActionsModalOpen(true)}
            onHistoryClick={() => setIsHistoryPanelOpen(true)}
            onBackClick={() => setIsAnalysisMode(false)}
            onHomeClick={handleGoHome}
            totalCost={totalCost}
            subscription={userProfile?.subscription}
          />
          <main className="flex-1">
            <CaseAnalysisInput
              onAnalyze={handleCaseAnalysis}
              isLoading={isLoading}
              onCancel={() => setIsAnalysisMode(false)}
            />
          </main>
        </div>
      </>
    );
  }

  if (!selectedLawArea) {
    return (
      <>
        {renderUserProfileModal()}
        {renderPlanSelectionModal()}
        {renderQuickActionsModal()}
        {renderHistoryPanel()}
        {renderWelcomeModal()}
        <div className="flex flex-col min-h-screen bg-slate-900">
          <AppHeader
            title="Asystent Prawny AI"
            onProfileClick={openProfileModal}
            onQuickActionsClick={() => setIsQuickActionsModalOpen(true)}
            onHistoryClick={() => setIsHistoryPanelOpen(true)}
            totalCost={totalCost}
            subscription={userProfile?.subscription}
          />
          <main className="flex-1">
            <LawSelector
              onSelect={handleSelectLawArea}
              onAnalyzeClick={() => setIsAnalysisMode(true)}
            />
          </main>
        </div>
      </>
    );
  }

  if (!selectedTopic) {
    return (
      <>
        {renderUserProfileModal()}
        {renderQuickActionsModal()}
        {renderHistoryPanel()}
        {renderUserProfileModal()}
        {renderPlanSelectionModal()}
        {renderQuickActionsModal()}
        {renderHistoryPanel()}
        <ConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={cancelDeleteTopic}
          onConfirm={confirmDeleteTopic}
          title="Potwierdź usunięcie tematu"
          message={`Czy na pewno chcesz usunąć temat "${topicToDelete}" ? Ta operacja usunie również całą powiązaną historię rozmowy z bazy danych.`}
        />
        {renderUserProfileModal()}
        {renderPlanSelectionModal()}
        {renderQuickActionsModal()}
        {renderHistoryPanel()}
        <div className="flex flex-col min-h-screen bg-slate-900">
          <AppHeader
            title={<>
              <span className="text-slate-400 hidden sm:inline">Asystent:</span>
              <span className="text-cyan-400"> {selectedLawArea}</span>
            </>}
            onProfileClick={openProfileModal}
            onQuickActionsClick={() => setIsQuickActionsModalOpen(true)}
            onHistoryClick={() => setIsHistoryPanelOpen(true)}
            onBackClick={handleBackToLawArea}
            onHomeClick={handleGoHome}
            totalCost={totalCost}
            subscription={userProfile?.subscription}
          />
          <main className="flex-1">
            <TopicSelector
              lawArea={selectedLawArea}
              topics={topics[selectedLawArea] || []}
              onSelectTopic={handleSelectTopic}
              onAddTopic={handleAddTopic}
              onDeleteTopic={requestDeleteTopic}
            />
          </main>
        </div>
      </>
    );
  }

  if (!interactionMode) {
    return (
      <>
        {renderUserProfileModal()}
        {renderPlanSelectionModal()}
        {renderQuickActionsModal()}
        {renderHistoryPanel()}
        <div className="flex flex-col min-h-screen bg-slate-900">
          <AppHeader
            title={<>
              <span className="text-slate-400 hidden sm:inline">Asystent:</span>
              <span className="text-cyan-400"> {selectedLawArea} / {selectedTopic}</span>
            </>}
            onProfileClick={openProfileModal}
            onQuickActionsClick={() => setIsQuickActionsModalOpen(true)}
            onHistoryClick={() => setIsHistoryPanelOpen(true)}
            onBackClick={handleBackToTopic}
            onHomeClick={handleGoHome}
            totalCost={totalCost}
            subscription={userProfile?.subscription}
          />
          <main className="flex-1">
            <InteractionModeSelector
              lawArea={selectedLawArea}
              onSelect={handleSelectInteractionMode}
            />
            <div className="max-w-4xl mx-auto px-4 pb-12">
              <LegalFAQ lawArea={selectedLawArea} onSelectQuestion={handleSendMessage} />
            </div>
          </main>
        </div>
      </>
    );
  }

  const showQuickActions = !isLoading && chatHistory.some(msg => msg.role === 'model');

  return (
    <>
      {renderUserProfileModal()}
      {renderPlanSelectionModal()}
      {renderQuickActionsModal()}
      {renderHistoryPanel()}
      <div className="flex flex-col h-screen bg-slate-800">

        {!isFullScreen && (
          <AppHeader
            title={<>
              <span className="text-slate-400 hidden sm:inline">Asystent:</span>
              <span className="text-cyan-400"> {selectedLawArea} / {selectedTopic} / {interactionMode}</span>
            </>}
            onProfileClick={openProfileModal}
            onQuickActionsClick={() => setIsQuickActionsModalOpen(true)}
            onHistoryClick={() => setIsHistoryPanelOpen(true)}
            onChangeClick={handleBackToTopic}
            changeButtonText="Zmień"
            onHomeClick={handleGoHome}
            onFullScreenClick={() => setIsFullScreen(true)}
            totalCost={totalCost}
            subscription={userProfile?.subscription}
          />
        )}

        {isFullScreen && (
          <button
            onClick={() => setIsFullScreen(false)}
            className="fixed top-4 right-4 z-50 p-2 bg-slate-800/80 backdrop-blur-sm rounded-full text-slate-300 hover:text-white hover:bg-slate-700 shadow-lg border border-slate-700 transition-all"
            title="Wyjdź z pełnego ekranu"
          >
            <ArrowsContractIcon className="w-6 h-6" />
          </button>
        )}

        {todayDeadlines.length > 0 && (
          <div className="bg-red-600/20 border-b border-red-500/30 p-2 text-center animate-pulse">
            <p className="text-xs font-bold text-red-400">
              ⚠️ MASZ {todayDeadlines.length} TERMINY DZISIAJ! Sprawdź oś czasu.
            </p>
          </div>
        )}



        {user && currentChatId && (
          <div className="sticky top-0 z-20 bg-slate-800/95 backdrop-blur-sm border-b border-slate-700/50 shadow-md">
            <div className="max-w-4xl mx-auto p-4 pb-0">
              <CaseDashboard userId={user.uid} caseId={currentChatId} />
            </div>
          </div>
        )}

        <main ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-4xl mx-auto">
            {chatHistory.map((msg, index) => (
              <ChatBubble
                key={index}
                message={msg}
                onPreviewDocument={handlePreviewDocument}
                onAddDeadline={handleAddDeadline}
                onAddTask={handleAddTask}
              />
            ))}
            {isLoading && <LoadingSpinner />}
          </div>
        </main>

        {showQuickActions && !isFullScreen && (
          <QuickActions
            interactionMode={interactionMode}
            onActionClick={handleQuickActionClick}
          />
        )}

        <footer className="bg-slate-900 p-4 border-t border-slate-700/50">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col gap-3">
              {!isFullScreen && (
                <div className="flex items-center justify-end">
                  <div className="flex items-center">
                    <label htmlFor="deep-thinking-toggle" className="text-sm font-medium text-slate-300 mr-3 cursor-pointer select-none">
                      Głębokie Myślenie
                    </label>
                    <button
                      id="deep-thinking-toggle"
                      type="button"
                      role="switch"
                      aria-checked={isDeepThinkingEnabled}
                      onClick={() => setIsDeepThinkingEnabled(!isDeepThinkingEnabled)}
                      disabled={isLoading}
                      className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed ${isDeepThinkingEnabled ? 'bg-cyan-600' : 'bg-slate-600'}`}
                    >
                      <span
                        className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-200 ease-in-out ${isDeepThinkingEnabled ? 'translate-x-6' : 'translate-x-1'}`}
                      />
                    </button>
                  </div>
                </div>
              )}

              {!isFullScreen && interactionMode !== InteractionMode.SuggestRegulations && interactionMode !== InteractionMode.FindRulings && interactionMode !== InteractionMode.LegalTraining && (
                <input
                  type="text"
                  value={legalArticles}
                  onChange={(e) => setLegalArticles(e.target.value)}
                  placeholder="Podaj konkretne paragrafy (opcjonalnie), np. art. 278 § 1 k.k."
                  className="w-full bg-slate-800 rounded-xl p-2.5 text-sm text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 border border-slate-700/50"
                  disabled={isLoading}
                />
              )}
              <div className="flex items-end gap-2 bg-slate-800 rounded-xl p-2 border border-slate-700/50 focus-within:ring-2 focus-within:ring-cyan-500 transition-shadow">
                <textarea
                  ref={textareaRef}
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder={
                    interactionMode === InteractionMode.LegalTraining
                      ? "Opisz zagadnienie, z którego chcesz przejść szkolenie..."
                      : interactionMode === InteractionMode.FindRulings
                        ? "Opisz swoją sprawę, aby znaleźć podobne wyroki..."
                        : interactionMode === InteractionMode.SuggestRegulations
                          ? "Opisz sytuację, a ja zasugeruję przepisy..."
                          : "Opisz swoją sytuację lub zadaj pytanie..."
                  }
                  className="w-full bg-transparent text-slate-200 placeholder-slate-400 focus:outline-none resize-none max-h-48"
                  rows={1}
                  disabled={isLoading}
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={isLoading || !currentMessage.trim()}
                  className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white p-2.5 rounded-full hover:from-cyan-400 hover:to-blue-500 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed transition-all duration-300 flex-shrink-0 shadow-lg hover:shadow-cyan-500/30"
                  aria-label="Wyślij wiadomość"
                >
                  <SendIcon />
                </button>
              </div>
            </div>
          </div>
        </footer>
        <DocumentPreviewModal
          isOpen={isPreviewModalOpen}
          onClose={() => setIsPreviewModalOpen(false)}
          content={previewContent}
          title={previewTitle}
        />
      </div>
    </>
  );
};

export default App;