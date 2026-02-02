import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { LawArea, InteractionMode, ChatMessage, SubscriptionStatus, SubscriptionInfo, CourtRole, ChecklistItem, TimelineEvent, CaseNote, UserProfile, getChatId, QuickAction } from './types';
import { auth, db } from './services/firebase';
import LawSelector from './components/LawSelector';
import ServiceTypeSelector from './components/ServiceTypeSelector';
import TopicSelector from './components/TopicSelector';
import ProDashboard from './components/ProDashboard';
import ProCaseInitiator from './components/ProCaseInitiator';
import InteractionModeSelector from './components/InteractionModeSelector';
import AiToolsSidebar from './components/AiToolsSidebar';
import ChatBubble from './components/ChatBubble';
import LoadingSpinner from './components/LoadingSpinner';
import UserProfileModal from './components/UserProfileModal';
import {
  PaperClipIcon,
  SendIcon,
  ClockIcon,
  ScaleIcon,
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
import WelcomeAnalysisModal from './components/WelcomeAnalysisModal';
import Auth from './components/Auth';
import PlanSelectionModal from './components/PlanSelectionModal';
import DocumentPreviewModal from './components/DocumentPreviewModal';
import LegalFAQ from './components/LegalFAQ';
import { generateDocument } from './services/documentService';
import { createCheckoutSession, PRICE_IDS } from './services/stripeService';
import AppModals from './components/AppModals';
import SplashScreen from './components/SplashScreen';
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
import AwaitingActivation from './components/AwaitingActivation';
import MainNavigator from './components/MainNavigator';
import ChatFooter from './components/ChatFooter';
import { useAppContext, useChatContext, useUIContext } from './context';
import CustomAgentCreator from './components/CustomAgentCreator';

const GlobalAdminNotes = React.lazy(() => import('./components/GlobalAdminNotes'));
import FullScreenLoader from './components/FullScreenLoader';

// Emulator Check
const USE_EMULATORS = import.meta.env.VITE_USE_EMULATORS === 'true' || localStorage.getItem('useEmulators') === 'true';

const App: React.FC = () => {
  const { t, i18n } = useTranslation();

  const [previewContent, setPreviewContent] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');
  const [knowledgeModalChatId, setKnowledgeModalChatId] = useState<string | null>(null);
  const [documentsModalChatId, setDocumentsModalChatId] = useState<string | null>(null);
  const [isSplashDismissed, setIsSplashDismissed] = useState(false);
  const [isRecharging, setIsRecharging] = useState(() => sessionStorage.getItem('recharge_in_progress') === 'true');
  const [isShowAndromeda, setIsShowAndromeda] = useState(false);
  const [hasDismissedAssistantSession, setHasDismissedAssistantSession] = useState(false);
  const [isCustomAgentCreatorOpen, setIsCustomAgentCreatorOpen] = useState(false);
  // Default to true to be safe on initial mount, but clear quickly if not needed
  const [isStabilizing, setIsStabilizing] = useState(true);
  const [isLoginFlow, setIsLoginFlow] = useState(false);

  const {
    user,
    userProfile,
    authLoading,
    profileLoading,
    subsLoading,
    totalCost,
    handleUpdateProfile,
    selectedLawArea,
    setSelectedLawArea,
    selectedTopic,
    setSelectedTopic,
    interactionMode,
    setInteractionMode,
    servicePath,
    setServicePath,
    courtRole,
    setCourtRole,
    currentChatId,
    resetNavigation,
    backToTopic,
    backToLawArea,
    isLocalOnly,
    topics,
    customAgents,
    isPro,
    activeCustomAgent,
    setActiveCustomAgent,
  } = useAppContext();

  const { allEvents } = useUserCalendar(user, isLocalOnly);
  const todayStr = new Date().toISOString().split('T')[0];
  const activeRemindersCount = useMemo(() =>
    allEvents.filter(e => !e.completed && e.date === todayStr).length,
    [allEvents, todayStr]);

  const isAdmin = useMemo(() => {
    if (!user) return false;
    const ADMIN_UIDS = ["Yb23rXe0JdOvieB3grdaN0Brmkjh"];
    const ADMIN_EMAILS = ["kbprojekt1975@gmail.com", "konrad@example.com", "wielki@electronik.com"];
    return ADMIN_UIDS.includes(user.uid) || (user.email && ADMIN_EMAILS.some(email => user.email?.includes(email)));
  }, [user]);

  const handleDeleteCustomAgent = useCallback(async (agent: any) => {
    if (!user) return;
    try {
      const { doc, deleteDoc, collection, getDocs, writeBatch } = await import('firebase/firestore');

      // 1. Delete the agent document
      await deleteDoc(doc(db, 'users', user.uid, 'custom_agents', agent.id));

      // 2. Delete chat history for this agent
      const historyRef = collection(db, 'users', user.uid, 'topics', LawArea.Custom, 'chats', agent.id, 'messages');
      const messages = await getDocs(historyRef);

      if (!messages.empty) {
        const batch = writeBatch(db);
        messages.forEach((doc) => batch.delete(doc.ref));

        // Also delete the chat metadata doc
        batch.delete(doc(db, 'users', user.uid, 'topics', LawArea.Custom, 'chats', agent.id));

        await batch.commit();
      } else {
        // Try to delete the chat metadata doc anyway in case it exists without messages
        try {
          await deleteDoc(doc(db, 'users', user.uid, 'topics', LawArea.Custom, 'chats', agent.id));
        } catch (metadataErr) {
          console.warn("Could not delete metadata doc (maybe not exists):", metadataErr);
        }
      }

      console.log(`Agent ${agent.name} and history deleted.`);
    } catch (e) {
      console.error("Failed to delete custom agent:", e);
      alert("Wystąpił błąd podczas usuwania agenta.");
    }
  }, [user]);

  useEffect(() => {
    (window as any).showCustomAgentCreator = () => setIsCustomAgentCreatorOpen(true);
    (window as any).deleteCustomAgent = (agent: any) => handleDeleteCustomAgent(agent);
    return () => {
      delete (window as any).showCustomAgentCreator;
      delete (window as any).deleteCustomAgent;
    };
  }, [handleDeleteCustomAgent]);


  const {
    chatHistory,
    setChatHistory,
    isLoading,
    handleSendMessage,
    handleLoadHistory,
    handleAddTopic,
    loadChatHistories,
    handleImportChat,
    handleExportChat,
    handleGenerateKnowledge,
    chatHistories,
    setChatHistories,
    handleSelectCourtRole,
    handleInitialGreeting,
    // Merged from below:
    handleDeleteHistory,
    handleCaseAnalysis,
    isDeleteModalOpen,
    cancelDeleteTopic,
    confirmDeleteTopic,
    requestDeleteTopic,
    handleSelectInteractionMode,
    handleAddCost
  } = useChatContext();

  const {
    isFullScreen, setIsFullScreen,
    isProfileModalOpen, setIsProfileModalOpen,
    isQuickActionsModalOpen, setIsQuickActionsModalOpen,
    isHistoryPanelOpen, setIsHistoryPanelOpen,
    isCaseManagementModalOpen, setIsCaseManagementModalOpen,
    isAiToolsSidebarOpen, setIsAiToolsSidebarOpen,
    isAppHelpSidebarOpen, setIsAppHelpSidebarOpen,
    isPreviewModalOpen, setIsPreviewModalOpen,
    isKnowledgeModalOpen, setIsKnowledgeModalOpen,
    isDocumentsModalOpen, setIsDocumentsModalOpen,
    isWelcomeAssistantOpen, setIsWelcomeAssistantOpen,
    isInstallPromptOpen, setIsInstallPromptOpen,
    isAlimonyModalOpen, setIsAlimonyModalOpen,
    isWelcomeModalOpen, setIsWelcomeModalOpen,
    welcomeModalInitialViewMode,
    deferredPrompt,
  } = useUIContext();



  // Auto-trigger Onboarding Flow when subscription is detected
  useEffect(() => {
    // CRITICAL: Wait for stabilization to finish before triggering potential popups
    if (!authLoading && !profileLoading && !subsLoading && userProfile && !isRecharging && !isStabilizing) {
      const hasActiveSub = ['active', 'trialing'].includes(userProfile.subscription?.status || '');

      console.log("[App] Checking Welcome Trigger:", {
        hasActiveSub,
        hasSeen: userProfile.hasSeenWelcomeAssistant,
        dismissed: hasDismissedAssistantSession,
        consent: userProfile.dataProcessingConsent,
        subStatus: userProfile.subscription?.status,
        isStabilizing
      });

      // If user is PAID but hasn't seen the welcome assistant yet AND hasn't dismissed it this session, show it.
      if (hasActiveSub && !userProfile.hasSeenWelcomeAssistant && !hasDismissedAssistantSession) {
        console.log("[App] Triggering Welcome Assistant!");
        setIsWelcomeAssistantOpen(true);
      }
    }
  }, [authLoading, profileLoading, subsLoading, userProfile?.subscription?.status, userProfile?.hasSeenWelcomeAssistant, setIsWelcomeAssistantOpen, hasDismissedAssistantSession, isRecharging, isStabilizing]);

  // Manage Recharge / Stabilization Delay
  useEffect(() => {
    if (isRecharging && !authLoading && !profileLoading && !subsLoading) {
      const timer = setTimeout(() => {
        setIsRecharging(false);
        sessionStorage.removeItem('recharge_in_progress');
      }, 1000); // Minimum 1s delay for stabilization
      return () => clearTimeout(timer);
    }
  }, [isRecharging, authLoading, profileLoading, subsLoading]);

  // STABILIZATION LOGIC (Fix for flickering login/register)
  // Use useLayoutEffect to prevent painting the "gap" frame between Auth and Dashboard.
  React.useLayoutEffect(() => {
    if (user && isSplashDismissed) {
      // User is authenticated.
      // If we came from a state where we were NOT authenticated (captured by isStabilizing or just the flow)
      // We want to ensure isLoginFlow handles the transition.
      setIsStabilizing(true);
    }

    // Detect login flow start: if we have no user and splash is gone, we are in auth mode
    if (!user && isSplashDismissed) {
      setIsLoginFlow(true);
    }
  }, [user, isSplashDismissed]);

  // Clear stabilization when data is ready
  useEffect(() => {
    // CRITICAL: If in login flow, skip stabilization entirely - Auth component handles its own loading state
    if (isLoginFlow && isStabilizing) {
      setIsStabilizing(false);
      return;
    }

    // If we are stabilizing or in login flow, check if we are truly ready regardless of timer
    const isReady = user && !authLoading && !profileLoading && !subsLoading && !isRecharging;

    if (isReady) {
      // If purely stabilizing, wait a bit. If Login Flow, we can be snappier or wait too.
      // User requested "Screen changes ONLY after loading everything". 
      // So we wait until isReady is true to clear LoginFlow.
      setIsLoginFlow(false);
    }

    if (isStabilizing) {
      // If user is missing, we shouldn't be stabilizing, we should show auth immediately.
      if (!user && !authLoading) {
        setIsStabilizing(false);
        return;
      }

      // If user exists, wait for everything to load + buffer
      if (isReady) {
        const timer = setTimeout(() => {
          setIsStabilizing(false);
        }, 1500); // Keep stabilization as backup for non-login flows (e.g. reload)
        return () => clearTimeout(timer);
      }
    }
  }, [isStabilizing, user, authLoading, profileLoading, subsLoading, isRecharging, isLoginFlow]);

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

  const handleInstallApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      handleUpdateProfile({
        ...userProfile,
        hasDismissedPwaInstall: true
      }, false);
    }
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

  const onConfirmTopicDeletion = async () => {
    await confirmDeleteTopic(async (topicName) => {
      if (selectedLawArea) {
        await handleDeleteHistory(selectedLawArea, topicName);
      }
    });
  };

  const handleSelectPlan = async (planId: string) => {
    if (!user) return;

    setIsRecharging(true);
    sessionStorage.setItem('recharge_in_progress', 'true');

    // LOCAL DEVELOPMENT BYPASS
    // On emulators, we don't have Stripe Extension running by default.
    // We allow developers to "self-activate" by writing directly to the customers collection.
    if (import.meta.env.VITE_USE_EMULATORS === 'true') {
      console.warn("DEVELOPER MODE: Bypassing Stripe and auto-activating subscription locally.");
      try {
        const { setDoc, doc, serverTimestamp, updateDoc, getDoc, collection, getDocs, deleteDoc } = await import('firebase/firestore');
        const { db } = await import('./services/firebase');

        console.log("Mocking subscription for UID:", user.uid);

        // Fetch validity from config
        // Fetch validity from config
        const configRef = doc(db, 'config', 'pricing');
        const configDoc = await getDoc(configRef);

        const validitySeconds = configDoc.exists() ? (configDoc.data().validity_seconds || 604800) : 604800;

        console.log(`Mocking subscription with validity: ${validitySeconds}s`);

        // CLEANUP
        const subsRef = collection(db, 'customers', user.uid, 'subscriptions');
        const existingSubs = await getDocs(subsRef);
        await Promise.all(existingSubs.docs.map(d => deleteDoc(d.ref)));

        // Mock a successful Stripe subscription
        await setDoc(doc(db, 'customers', user.uid, 'subscriptions', 'local_dev_sub'), {
          status: 'active',
          role: 'premium',
          items: [{ price: { id: planId } }],
          created: serverTimestamp(),
          current_period_start: serverTimestamp(),
          current_period_end: new Date(Date.now() + (validitySeconds * 1000)),
        });

        console.log("Subscription doc created. Resetting onboarding...");

        // RESET ONBOARDING FLAGS FOR TESTING
        await updateDoc(doc(db, 'users', user.uid), {
          "profile.hasSeenWelcomeAssistant": false,
          "profile.cookieConsent": false,
          "profile.isActive": true, // Ensure profile is active
          "profile.subscription.spentAmount": 0, // Reset spent amount on recharge
          "profile.subscription.creditLimit": planId === PRICE_IDS.PRO_50PLN ? 50 : 10,
          "profile.subscription.tokenLimit": planId === PRICE_IDS.PRO_50PLN ? 2166666 : 333000,
          "profile.subscription.packageType": planId === PRICE_IDS.PRO_50PLN ? 'pro' : 'starter'
        });

        // CLEAR LOCAL CACHE FOR COOKIE CONSENT
        localStorage.removeItem('cookieConsent');

        console.log("Local activation complete! Reloading...");
        alert(`Developer: Valid for ${validitySeconds}s. Restarting session...`);
        window.location.reload();
        return;
      } catch (err) {
        console.error("Local activation error:", err);
        alert("Local activation failed: " + (err as any).message);
      }
    }

    try {
      const url = await createCheckoutSession(user.uid, planId);
      window.location.href = url;
    } catch (error: any) {
      console.error("Payment Error:", error);
      alert(t('plan.paymentError') || "Payment initialization failed. Please try again.");
    }
  };

  const handleSaveCustomAgent = async (agent: any) => {
    if (!user) return;
    try {
      const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
      const docRef = await addDoc(collection(db, 'users', user.uid, 'custom_agents'), {
        ...agent,
        createdAt: serverTimestamp()
      });

      setIsCustomAgentCreatorOpen(false);

      // Auto-open created agent
      setActiveCustomAgent({ id: docRef.id, ...agent });

    } catch (e) {
      console.error("Failed to save custom agent:", e);
      throw e;
    }
  };

  // Blocking states logic
  const showSplash = !isSplashDismissed;

  // Auth screen visibility logic:
  // CRITICAL: If isLoginFlow is active, Auth MUST stay visible until everything is fully loaded.
  // This prevents flashing during the login process - user clicks "Login", sees spinner in button,
  // and screen only changes when the app is 100% ready (profile + subscription loaded).
  // If NOT in login flow, show Auth only when there's no user and auth is not loading.
  const showAuth = isSplashDismissed && (isLoginFlow || (!user && !authLoading));

  const hasActiveStripeSub = ['active', 'trialing'].includes(userProfile?.subscription?.status || '');
  const isExpired = userProfile?.subscription?.expiresAt && (
    (typeof userProfile.subscription.expiresAt === 'number' && userProfile.subscription.expiresAt < Date.now()) ||
    (userProfile.subscription.expiresAt.toMillis && userProfile.subscription.expiresAt.toMillis() < Date.now())
  );

  const isLimitReached = (userProfile?.subscription?.spentAmount || 0) >= (userProfile?.subscription?.creditLimit || 0) && hasActiveStripeSub;
  const hasActiveAccess = hasActiveStripeSub && !isLimitReached && !isExpired;

  const isAwaitingActivation = userProfile?.subscription?.status === SubscriptionStatus.Pending;
  // Activation screen only shows if we are NOT in the middle of a recharge/loading process
  const showActivation = isSplashDismissed && user && isAwaitingActivation && !profileLoading && !subsLoading && !isRecharging;

  // Force Andromeda on successful activation
  const prevIsAwaitingActivation = useRef(isAwaitingActivation);
  useEffect(() => {
    // If transitioning from Awaiting=true to Awaiting=false, and we have a user
    if (prevIsAwaitingActivation.current && !isAwaitingActivation && user) {
      setIsShowAndromeda(true);
    }
    prevIsAwaitingActivation.current = isAwaitingActivation;
  }, [isAwaitingActivation, user]);

  // Removed isNavigating logic to prevent full screen blocking during navigation

  const handleSmartBack = () => {
    if (activeCustomAgent) {
      setActiveCustomAgent(null);
      return;
    }
    if (selectedTopic) {
      setSelectedTopic(null);
      return;
    }
    // SKIP clearing interactionMode directly to avoid showing the "Tools Grid".
    // Instead, go straight back to Service Path selection.

    if (servicePath) {
      setServicePath(null);
      setInteractionMode(null); // Clean reset
      return;
    }
    if (selectedLawArea) {
      setSelectedLawArea(null);
    }
  };

  // Simplified Loader logic for authenticated users:
  // Only show full-screen loader during initial app stabilization OR during auth flow
  // For logged-in users, all loading states use LOCAL spinners (in components, not full-screen)
  const showLoader = !isLoginFlow && (isStabilizing || (isSplashDismissed && !showAuth && !showSplash && authLoading));

  return (
    <div className="min-h-screen w-full bg-slate-900 animate-fade-in relative">
      {/* 1. Splash Screen */}
      {showSplash && (
        <SplashScreen
          isReady={!authLoading && !profileLoading && !subsLoading && !isRecharging}
          onStart={() => {
            setIsShowAndromeda(true);
            setIsSplashDismissed(true);
          }}
        />
      )}

      {/* 2. Full Screen blocking states */}
      {showAuth && <Auth isPostAuthLoading={!!user && (profileLoading || subsLoading || isRecharging)} />}

      {showActivation && <AwaitingActivation />}

      {showLoader && (
        <FullScreenLoader transparent={user !== null && !isStabilizing} />
      )}

      {/* 3. Main Application UI */}
      {!showSplash && !showAuth && !showActivation && (
        <div className="animate-fade-in min-h-screen flex flex-col">
          {isShowAndromeda && (
            <AndromedaAssistant
              onProceed={() => {
                setIsShowAndromeda(false);
                resetNavigation();
              }}
              onProfileClick={() => setIsProfileModalOpen(true)}
              language={i18n.language}
              onAddCost={handleAddCost}
            />
          )}
          <PWAUpdateNotification />
          {isAdmin && (
            <React.Suspense fallback={null}>
              <GlobalAdminNotes userEmail={user?.email || null} isAdmin={isAdmin} currentViewId="home" />
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
            setIsWelcomeAssistantOpen={(open) => {
              setIsWelcomeAssistantOpen(open);
              if (!open) setHasDismissedAssistantSession(true);
            }}
            isInstallPromptOpen={isInstallPromptOpen}
            setIsInstallPromptOpen={setIsInstallPromptOpen}
            onInstall={handleInstallApp}
          />


          <PlanSelectionModal
            isOpen={!authLoading && !profileLoading && !subsLoading && !hasActiveAccess}
            onSelectPlan={handleSelectPlan}
            subscription={userProfile?.subscription}
            isLoading={isLoading}
          />

          <CustomAgentCreator
            isOpen={isCustomAgentCreatorOpen}
            onClose={() => setIsCustomAgentCreatorOpen(false)}
            onSave={handleSaveCustomAgent}
          />

          <GlobalAnnouncement />

          <div className="flex flex-col h-[100dvh] bg-slate-800 relative">
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
                breadcrumbs={(() => {
                  const paths = [];

                  // 1. Root / Agent Name
                  if (activeCustomAgent) {
                    paths.push(activeCustomAgent.name);
                  } else if (selectedLawArea === LawArea.Custom) {
                    // If viewing custom agents list but no specific agent active (shouldn't happen often in this view, but good safety)
                    const agentName = customAgents.find(a => a.id === selectedTopic)?.name;
                    paths.push(agentName || t('law.areas.custom'));
                  } else if (selectedLawArea) {
                    // Standard Law Area
                    const areaName = Object.values(LawArea).includes(selectedLawArea)
                      ? t(`law.areas.${selectedLawArea}`, { defaultValue: selectedLawArea })
                      : selectedLawArea;
                    paths.push(areaName);
                  } else {
                    // Home
                    paths.push(t('breadcrumbs.home') || 'Strona Główna');
                  }

                  // 2. Interaction Mode
                  if (interactionMode) {
                    const modeName = Object.values(InteractionMode).includes(interactionMode)
                      ? t(`interactionModes.${interactionMode}`, { defaultValue: interactionMode })
                      : interactionMode;
                    paths.push(modeName);
                  }

                  // 3. Topic
                  if (selectedTopic && !activeCustomAgent) {
                    // If standard mode, show topic. For custom agent, topic IS the agent usually or handled above.
                    // But wait, user's logic was:
                    // activeCustomAgent ? (selectedTopic ? `${activeCustomAgent.name}: ${selectedTopic}` ...
                    // So if custom agent is active, topic is essentially a sub-state?
                    // Let's align with previous title logic:
                    if (selectedLawArea === LawArea.Custom) {
                      // Already pushed agent name above if found
                    } else {
                      paths.push(selectedTopic);
                    }
                  } else if (selectedTopic && activeCustomAgent) {
                    // Custom agent + topic selected (e.g. chat session details?)
                    paths.push(selectedTopic);
                  }

                  return paths;
                })()}
                title="" // Fallback/Hidden when breadcrumbs exist
                onProfileClick={() => setIsProfileModalOpen(true)}
                onHelpClick={() => setIsAppHelpSidebarOpen(true)}
                onQuickActionsClick={() => setIsQuickActionsModalOpen(true)}
                onHistoryClick={() => setIsHistoryPanelOpen(true)}
                onAiToolsClick={() => setIsAiToolsSidebarOpen(true)}
                onBackClick={selectedLawArea ? handleSmartBack : undefined}
                onHomeClick={selectedLawArea ? resetNavigation : undefined}
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
                onHomeGridClick={() => setIsShowAndromeda(!isShowAndromeda)}
                isCrossedOut={!isShowAndromeda}
              />
            )}

            <main className="flex-1 overflow-y-auto">
              <MainNavigator />
            </main>

            <RemindersWidget user={user} />

            <AppHelpSidebar
              isOpen={isAppHelpSidebarOpen}
              onClose={() => setIsAppHelpSidebarOpen(false)}
              userId={user?.uid}
            />

            {/* Only show ChatFooter when we are in a conversation context */}
            {(selectedTopic || activeCustomAgent) && interactionMode && (
              <>
                <ChatFooter />
              </>
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
        </div>
      )}
      <CookieConsent />
    </div>
  );
};

export default App;
