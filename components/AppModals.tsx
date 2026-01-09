import React from 'react';
import { LawArea, InteractionMode, UserProfile, LawArea as LawAreaType } from '../types';
import UserProfileModal from './UserProfileModal';
import HistoryPanel from './HistoryPanel';
import QuickActionsModal from './QuickActionsModal';
import WelcomeAnalysisModal from './WelcomeAnalysisModal';
import LegalKnowledgeModal from './LegalKnowledgeModal';
import DocumentsRepositoryModal from './DocumentsRepositoryModal';
import ConfirmationModal from './ConfirmationModal';
import PlanSelectionModal from './PlanSelectionModal';
import DocumentPreviewModal from './DocumentPreviewModal';
import CaseManagementModal from './CaseManagementModal';

interface AppModalsProps {
    isProfileModalOpen: boolean;
    setIsProfileModalOpen: (open: boolean) => void;
    user: any;
    userProfile: UserProfile;
    handleUpdateProfile: (profile: UserProfile, sessionOnly?: boolean) => void;
    topics: Record<LawArea, string[]>;

    isHistoryPanelOpen: boolean;
    setIsHistoryPanelOpen: (open: boolean) => void;
    chatHistories: any[];
    handleLoadHistory: (lawArea: LawArea, topic: string) => void;
    handleDeleteHistory: (lawArea: LawArea, topic: string) => void;
    handleViewKnowledge: (lawArea?: LawArea | null, topic?: string | null) => void;
    handleViewDocuments: (chatId?: string | null) => void;

    isQuickActionsModalOpen: boolean;
    setIsQuickActionsModalOpen: (open: boolean) => void;
    handleSelectQuickAction: (action: any) => void;

    isWelcomeModalOpen: boolean;
    setIsWelcomeModalOpen: (open: boolean) => void;
    handleCaseAnalysis: (description: string) => void;
    isLoading: boolean;
    welcomeModalInitialViewMode?: 'selection' | 'input';

    isKnowledgeModalOpen: boolean;
    setIsKnowledgeModalOpen: (open: boolean) => void;
    knowledgeModalChatId: string | null;

    isDocumentsModalOpen: boolean;
    setIsDocumentsModalOpen: (open: boolean) => void;
    documentsModalChatId: string | null;

    isDeleteModalOpen: boolean;
    cancelDeleteTopic: () => void;
    confirmDeleteTopic: () => void;

    isPreviewModalOpen: boolean;
    setIsPreviewModalOpen: (open: boolean) => void;
    previewContent: string;
    previewTitle: string;
    isCaseManagementModalOpen: boolean;
    setIsCaseManagementModalOpen: (open: boolean) => void;
    currentChatId: string | null;
    onChangeMode?: () => void;
}

const AppModals: React.FC<AppModalsProps> = ({
    isProfileModalOpen, setIsProfileModalOpen, user, userProfile, handleUpdateProfile, topics,
    isHistoryPanelOpen, setIsHistoryPanelOpen, chatHistories, handleLoadHistory, handleDeleteHistory, handleViewKnowledge, handleViewDocuments,
    isQuickActionsModalOpen, setIsQuickActionsModalOpen, handleSelectQuickAction,
    isWelcomeModalOpen, setIsWelcomeModalOpen, handleCaseAnalysis, isLoading, welcomeModalInitialViewMode,
    isKnowledgeModalOpen, setIsKnowledgeModalOpen, knowledgeModalChatId,
    isDocumentsModalOpen, setIsDocumentsModalOpen, documentsModalChatId,
    isDeleteModalOpen, cancelDeleteTopic, confirmDeleteTopic,
    isPreviewModalOpen, setIsPreviewModalOpen, previewContent, previewTitle,
    isCaseManagementModalOpen, setIsCaseManagementModalOpen, currentChatId, onChangeMode
}) => {
    return (
        <>
            <UserProfileModal
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
                onUpdateProfile={handleUpdateProfile}
                user={user}
                profile={userProfile}
                allTopics={topics}
            />

            <HistoryPanel
                isOpen={isHistoryPanelOpen}
                onClose={() => setIsHistoryPanelOpen(false)}
                histories={chatHistories}
                onLoadHistory={handleLoadHistory}
                onDeleteHistory={handleDeleteHistory}
                onViewKnowledge={handleViewKnowledge}
                onViewDocuments={(lawArea, topic) => {
                    const chatId = `${lawArea}_${topic}`;
                    handleViewDocuments(chatId);
                }}
            />

            <QuickActionsModal
                isOpen={isQuickActionsModalOpen}
                onClose={() => setIsQuickActionsModalOpen(false)}
                onSelect={handleSelectQuickAction}
                quickActions={userProfile?.quickActions || []}
            />

            <WelcomeAnalysisModal
                isOpen={isWelcomeModalOpen}
                onClose={() => setIsWelcomeModalOpen(false)}
                onAnalyze={handleCaseAnalysis}
                isLoading={isLoading}
                initialViewMode={welcomeModalInitialViewMode}
            />

            <LegalKnowledgeModal
                isOpen={isKnowledgeModalOpen}
                onClose={() => setIsKnowledgeModalOpen(false)}
                userId={user?.uid}
                chatId={knowledgeModalChatId}
            />

            <DocumentsRepositoryModal
                isOpen={isDocumentsModalOpen}
                onClose={() => setIsDocumentsModalOpen(false)}
                userId={user?.uid}
                chatId={documentsModalChatId}
            />

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                title="Usuń temat"
                message="Czy na pewno chcesz usunąć ten temat wraz z całą historią czatu? Te operacji nie można cofnąć."
                onConfirm={confirmDeleteTopic}
                onClose={cancelDeleteTopic}
            />

            <DocumentPreviewModal
                isOpen={isPreviewModalOpen}
                onClose={() => setIsPreviewModalOpen(false)}
                content={previewContent}
                title={previewTitle}
            />

            <CaseManagementModal
                isOpen={isCaseManagementModalOpen}
                onClose={() => setIsCaseManagementModalOpen(false)}
                userId={user?.uid || ''}
                caseId={currentChatId || ''}
                onChangeMode={onChangeMode}
            />
        </>
    );
};

export default AppModals;
