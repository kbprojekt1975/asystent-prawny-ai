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
import { createCheckoutSession } from './services/stripeService';
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

const GlobalAdminNotes = React.lazy(() => import('./components/GlobalAdminNotes'));
import FullScreenLoader from './components/FullScreenLoader';

const App: React.FC = () => {
  const { t, i18n } = useTranslation();

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
  } = useAppContext();

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
    handleSelectInteractionMode
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

  const [previewContent, setPreviewContent] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');
  const [knowledgeModalChatId, setKnowledgeModalChatId] = useState<string | null>(null);
  const [documentsModalChatId, setDocumentsModalChatId] = useState<string | null>(null);
  const [isSplashDismissed, setIsSplashDismissed] = useState(false);
  const [isShowAndromeda, setIsShowAndromeda] = useState(false);

  const { allEvents } = useUserCalendar(user);
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
    try {
      const url = await createCheckoutSession(user.uid, planId);
      window.location.href = url;
    } catch (error: any) {
      console.error("Payment Error:", error);
      alert(t('plan.paymentError') || "Payment initialization failed. Please try again.");
    }
  };

  if (!isSplashDismissed) {
    return (
      <SplashScreen
        isReady={!authLoading && !profileLoading && !subsLoading}
        onStart={() => {
          setIsShowAndromeda(true);
          setIsSplashDismissed(true);
        }}
      />
    );
  }

  if (!user) {
    return <Auth />;
  }

  // Blocking Loader for Logged-In Users awaiting data
  if (authLoading || profileLoading || subsLoading) {
    return <FullScreenLoader />;
  }

  const isAwaitingActivation = userProfile?.subscription && userProfile.subscription.isPaid === false;
  if (isAwaitingActivation) {
    return <AwaitingActivation />;
  }

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
        setIsWelcomeAssistantOpen={setIsWelcomeAssistantOpen}
        isInstallPromptOpen={isInstallPromptOpen}
        setIsInstallPromptOpen={setIsInstallPromptOpen}
        onInstall={handleInstallApp}
      />

      <PlanSelectionModal
        isOpen={!authLoading && !profileLoading && !subsLoading && !userProfile?.isActive && (!userProfile?.subscription || userProfile.subscription.status === SubscriptionStatus.Expired)}
        onSelectPlan={handleSelectPlan}
        subscription={userProfile?.subscription}
        isLoading={isLoading}
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
            title={selectedTopic || t('breadcrumbs.home')}
            onProfileClick={() => setIsProfileModalOpen(true)}
            onHelpClick={() => setIsAppHelpSidebarOpen(true)}
            onQuickActionsClick={() => setIsQuickActionsModalOpen(true)}
            onHistoryClick={() => setIsHistoryPanelOpen(true)}
            onAiToolsClick={() => setIsAiToolsSidebarOpen(true)}
            onBackClick={selectedLawArea ? backToLawArea : undefined}
            onHomeClick={resetNavigation}
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

        <main className="flex-1 overflow-y-auto">
          <MainNavigator />
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

        <ChatFooter />
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
