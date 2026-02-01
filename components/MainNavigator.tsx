import React from 'react';
import { LawArea, InteractionMode } from '../types';
import LawSelector from './LawSelector';
import ServiceTypeSelector from './ServiceTypeSelector';
import InteractionModeSelector from './InteractionModeSelector';
import LegalFAQ from './LegalFAQ';
import ProCaseInitiator from './ProCaseInitiator';
import CourtRoleSelector from './CourtRoleSelector';
import TopicSelector from './TopicSelector';
import ProDashboard from './ProDashboard';
import ChatView from './ChatView';
import { useAppContext, useChatContext, useUIContext } from '../context';

const MainNavigator: React.FC = () => {
    const {
        selectedLawArea, setSelectedLawArea,
        selectedTopic, setSelectedTopic,
        interactionMode, setInteractionMode,
        courtRole, setCourtRole,
        servicePath, setServicePath,
        currentChatId,
        user,
        userProfile,
        isLocalOnly,
        setIsLocalOnly,
        handleUpdateProfile,
        topics,
        customAgents,
        activeCustomAgent,
        setActiveCustomAgent,
        isPro
    } = useAppContext();

    const {
        handleSendMessage,
        handleLoadHistory,
        handleAddTopic,
        handleImportChat,
        handleSelectCourtRole,
        handleAddNote,
        deleteNote,
        handleUpdateNotePosition,
        handleSelectInteractionMode,
        isDeepThinkingEnabled,
        setIsDeepThinkingEnabled,
        chatNotes,
        chatHistories,
        loadChatHistories,
        setChatHistories
    } = useChatContext();

    const {
        setIsHistoryPanelOpen,
        setIsKnowledgeModalOpen,
        setIsDocumentsModalOpen,
        setIsWelcomeModalOpen,
        setWelcomeModalInitialViewMode,
        isFullScreen,
        setIsFullScreen
    } = useUIContext();

    const handleSelectTopic = async (topic: string) => {
        if (selectedLawArea) {
            handleLoadHistory(selectedLawArea, topic, interactionMode || undefined);
        }
    };

    const handleToggleLocalMode = (val: boolean) => {
        setIsLocalOnly(val);
        if (userProfile?.dataProcessingConsent) {
            handleUpdateProfile({
                ...userProfile,
                manualLocalMode: val
            }, false);
        }
    };

    const filteredTopics = React.useMemo(() => {
        if (!selectedLawArea) return { standard: [], pro: [] };
        const allTopics = topics[selectedLawArea] || [];

        const proTopicNames = chatHistories
            .filter(h => h.lawArea === selectedLawArea && h.servicePath === 'pro')
            .map(h => h.topic);

        return {
            standard: allTopics.filter(t => !proTopicNames.includes(t)),
            pro: allTopics.filter(t => proTopicNames.includes(t))
        };
    }, [topics, selectedLawArea, chatHistories]);

    return (
        <div key={`${selectedLawArea}-${servicePath}-${interactionMode}-${selectedTopic}`} className="flex-1 flex flex-col h-full animate-fade-in">
            {!selectedLawArea ? (
                <LawSelector
                    onSelect={(area) => setSelectedLawArea(area)}
                    onAnalyzeClick={() => {
                        setWelcomeModalInitialViewMode('input');
                        setIsWelcomeModalOpen(true);
                    }}
                    isLocalOnly={isLocalOnly}
                    setIsLocalOnly={handleToggleLocalMode}
                    hasConsent={userProfile?.dataProcessingConsent}
                    onImport={(file) => {
                        handleImportChat(file, (data) => {
                            setSelectedLawArea(data.lawArea);
                            setSelectedTopic(data.topic);
                            setInteractionMode(data.interactionMode);
                        });
                    }}
                    isPro={isPro}
                    customAgents={customAgents}
                    onCustomAgentSelect={(agent) => {
                        setActiveCustomAgent(agent);
                        // Do not navigate yet, wait for user to pick a LawArea
                    }}
                    onDeleteCustomAgent={(agent) => (window as any).deleteCustomAgent?.(agent)}
                    onCreateCustomAgent={() => (window as any).showCustomAgentCreator?.()}
                    activeAgent={activeCustomAgent}
                />
            ) : !servicePath ? (
                <ServiceTypeSelector
                    lawArea={selectedLawArea}
                    onSelect={(path) => {
                        setServicePath(path);
                        if (path === 'pro') {
                            setInteractionMode(InteractionMode.StrategicAnalysis);
                        } else {
                            setInteractionMode(InteractionMode.Advice);
                        }
                    }}
                />
            ) : !interactionMode ? (
                <div className="flex flex-col flex-1">
                    <InteractionModeSelector
                        lawArea={selectedLawArea}
                        selectedTopic={selectedTopic}
                        onSelectTopic={setSelectedTopic}
                        onSelect={(mode, context) => handleSelectInteractionMode(mode, context)}
                        onViewDocuments={() => setIsDocumentsModalOpen(true)}
                        onViewHistory={() => setIsHistoryPanelOpen(true)}
                        onViewKnowledge={() => setIsKnowledgeModalOpen(true)}
                    />
                    <div className="max-w-4xl mx-auto px-4 pb-12">
                        <LegalFAQ lawArea={selectedLawArea} onSelectQuestion={handleSendMessage} />
                    </div>
                </div>
            ) : (servicePath === 'pro' && !selectedTopic) ? (
                <ProCaseInitiator
                    lawArea={selectedLawArea}
                    existingTopics={filteredTopics.pro}
                    onSelectTopic={(topic) => handleLoadHistory(selectedLawArea, topic, interactionMode || undefined)}
                    onAddTopic={async (topic) => {
                        await handleAddTopic(topic, InteractionMode.StrategicAnalysis, 'pro');
                        const h = await loadChatHistories();
                        if (h) setChatHistories(h);
                        handleLoadHistory(selectedLawArea!, topic, InteractionMode.StrategicAnalysis, 'pro');
                    }}
                    onDeleteTopic={(topic) => { /* request delete topic */ }}
                    onBack={() => setServicePath(null)}
                    isLocalOnly={isLocalOnly}
                />
            ) : (interactionMode === InteractionMode.Court && !courtRole) ? (
                <div className="p-6 h-full overflow-y-auto">
                    <CourtRoleSelector onSelect={handleSelectCourtRole} />
                </div>
            ) : !selectedTopic ? (
                <TopicSelector
                    lawArea={selectedLawArea}
                    topics={filteredTopics.standard}
                    onSelectTopic={(topic) => handleLoadHistory(selectedLawArea, topic, interactionMode || undefined)}
                    onAddTopic={async (topic) => {
                        await handleAddTopic(topic, interactionMode, 'standard');
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
                    onDeleteTopic={(topic) => { /* request delete topic */ }}
                    onChangeMode={() => {
                        setInteractionMode(null);
                        setCourtRole(null);
                    }}
                    isLocalOnly={isLocalOnly}
                    activeAgent={activeCustomAgent}
                />
            ) : servicePath === 'pro' ? (
                <ProDashboard
                    userId={user!.uid}
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
                <ChatView />
            )}
        </div>
    );
};

export default MainNavigator;
