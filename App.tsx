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

  const handleAddNegotiationTopic = (topic: string) => {
    handleAddTopic(topic, InteractionMode.Negotiation);
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

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, isLoading, currentMessage]); // Trigger on history update, loading change, or typing (optional)

  // ... (rest of the file until the rendering part)

  {
    chatHistory.filter(msg => msg.role !== 'system').map((msg, index) => (
      <ChatBubble key={index} message={msg} onPreviewDocument={handlePreviewDocument} onAddDeadline={handleAddDeadline} onAddTask={handleAddTask} />
    ))
  }
  { isLoading && <LoadingSpinner /> }
  <div ref={messagesEndRef} />
                    </div >
                  </div >
                </div >
              )}
            </div >
          )}
        </main >

        <RemindersWidget user={user} />
        <CookieConsent />

{
  selectedTopic && interactionMode && (
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
  )
}
      </div >
    </>
  );
};

export default App;

