import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { getLegalAdvice } from '../services/geminiService';
import { LawArea, ChatMessage, InteractionMode, UserProfile, CourtRole, getChatId } from '../types';
import { User } from 'firebase/auth';

// Sub-hooks
import { useChatPersistence } from './useChatPersistence';
import { useChatModes } from './useChatModes';
import { useChatActions } from './useChatActions';

interface UseChatLogicProps {
    user: User | null;
    userProfile: UserProfile;
    selectedLawArea: LawArea | null;
    selectedTopic: string | null;
    interactionMode: InteractionMode | null;
    currentChatId: string | null;
    onAddCost: (cost: number) => void;
    onRefreshHistories: () => void;
    setCourtRole: (role: CourtRole | null) => void;
    chatHistories?: { lawArea: LawArea; topic: string; servicePath?: 'pro' | 'standard' }[];
    isLocalOnly?: boolean;
}

const normalizeHistory = (history: ChatMessage[]): ChatMessage[] => {
    const alternating: ChatMessage[] = [];
    const nonSystem = history.filter(m => m.role !== 'system');

    nonSystem.forEach((msg) => {
        if (alternating.length > 0 && alternating[alternating.length - 1].role === msg.role) {
            alternating[alternating.length - 1].content += "\n\n" + msg.content;
            if (msg.sources) {
                alternating[alternating.length - 1].sources = [...(alternating[alternating.length - 1].sources || []), ...msg.sources];
            }
        } else {
            alternating.push({ ...msg });
        }
    });
    return alternating;
};

export const useChatLogic = ({
    user,
    userProfile,
    selectedLawArea,
    selectedTopic,
    interactionMode,
    currentChatId,
    onAddCost,
    onRefreshHistories,
    setCourtRole,
    chatHistories = [],
    isLocalOnly = false
}: UseChatLogicProps) => {
    const { t, i18n } = useTranslation();
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [currentMessage, setCurrentMessage] = useState<string>('');
    const [legalArticles, setLegalArticles] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isDeepThinkingEnabled, setIsDeepThinkingEnabled] = useState<boolean>(false);

    // Initialize Sub-hooks
    const persistence = useChatPersistence({ user, onAddCost, onRefreshHistories, isLocalOnly });

    const handleSendMessage = useCallback(async (
        messageOverride?: string,
        historyOverride?: ChatMessage[],
        metadataOverride?: { lawArea: LawArea, topic: string, interactionMode: InteractionMode, servicePath?: 'pro' | 'standard' }
    ) => {
        const effectiveLawArea = metadataOverride?.lawArea || selectedLawArea;
        const effectiveTopic = metadataOverride?.topic || selectedTopic;
        const effectiveInteractionMode = metadataOverride?.interactionMode || interactionMode;
        const effectiveChatId = metadataOverride
            ? getChatId(metadataOverride.lawArea, metadataOverride.topic, metadataOverride.interactionMode)
            : getChatId(effectiveLawArea!, effectiveTopic!, effectiveInteractionMode);

        const messageToSend = messageOverride || currentMessage.trim();
        if ((!messageToSend && !historyOverride) || !effectiveLawArea || !effectiveTopic || !effectiveInteractionMode || (isLoading && !historyOverride) || !user || !effectiveChatId) return;

        const currentHistory = historyOverride || chatHistory;
        let newHistory = [...currentHistory];

        if (messageOverride) newHistory.push({ role: 'user', content: messageOverride });

        if (!historyOverride && !messageOverride) {
            const userMessage: ChatMessage = { role: 'user', content: messageToSend };
            newHistory.push(userMessage);
            setChatHistory(newHistory.filter(m => m.role !== 'system'));
        } else if (historyOverride) {
            setChatHistory(historyOverride.filter(m => m.role !== 'system'));
        } else if (messageOverride) {
            setChatHistory(currentHistory.filter(m => m.role !== 'system'));
        }

        if (!messageOverride) setCurrentMessage('');

        if (userProfile?.subscription && !userProfile.subscription.isPaid) {
            console.warn("Blocked: Subscription not paid");
            setIsLoading(false);
            return;
        }

        setIsLoading(true);

        const articlesToPass = effectiveInteractionMode !== InteractionMode.SuggestRegulations &&
            effectiveInteractionMode !== InteractionMode.FindRulings &&
            effectiveInteractionMode !== InteractionMode.LegalTraining
            ? legalArticles.trim() : undefined;

        try {
            const metadata = {
                lawArea: effectiveLawArea,
                topic: effectiveTopic,
                interactionMode: effectiveInteractionMode,
                servicePath: metadataOverride?.servicePath || (chatHistories.filter(h => h.lawArea === effectiveLawArea).find(h => {
                    return getChatId(h.lawArea, h.topic) === getChatId(effectiveLawArea, effectiveTopic);
                })?.servicePath) || 'standard'
            };

            if (!isLocalOnly) await persistence.saveChatHistory(effectiveChatId, newHistory, metadata);

            const aiResponse = await getLegalAdvice(
                newHistory.map(m => ({ role: m.role, content: m.content })),
                metadata.lawArea,
                metadata.interactionMode,
                metadata.topic,
                isDeepThinkingEnabled,
                articlesToPass,
                effectiveChatId,
                i18n.language,
                isLocalOnly
            );

            const aiMessage: ChatMessage = { role: 'model', content: aiResponse.text };
            if (aiResponse.sources) aiMessage.sources = aiResponse.sources;

            const userMsgCount = newHistory.filter(m => m.role === 'user').length;
            if (userMsgCount >= 2) {
                const options: InteractionMode[] = [];
                const lowText = aiResponse.text.toLowerCase();
                if (lowText.includes('pismo') || lowText.includes('wniosek') || lowText.includes('pozew')) options.push(InteractionMode.Document);
                if (lowText.includes('szkolenie') || lowText.includes('nauczyć')) options.push(InteractionMode.LegalTraining);
                if (lowText.includes('sąd') || lowText.includes('rozpraw')) options.push(InteractionMode.Court);
                if (lowText.includes('ugod') || lowText.includes('negocjacj')) options.push(InteractionMode.Negotiation);
                if (options.length > 0) aiMessage.followUpOptions = options;
            }

            const finalHistory = [...newHistory.filter(m => m.role !== 'system'), aiMessage];
            setChatHistory(finalHistory);

            if (aiResponse.usage && aiResponse.usage.cost > 0) await persistence.updateCosts(aiResponse.usage.cost);

            if (!isLocalOnly) await persistence.saveChatHistory(effectiveChatId, finalHistory, metadata);

        } catch (error) {
            console.error("AI Error", error);
        } finally {
            setIsLoading(false);
        }
    }, [currentMessage, selectedLawArea, interactionMode, isLoading, legalArticles, isDeepThinkingEnabled, selectedTopic, chatHistory, user, userProfile?.subscription, isLocalOnly, persistence, chatHistories, i18n.language]);

    const modes = useChatModes({ setChatHistory, handleSendMessage, selectedLawArea, selectedTopic, setCourtRole });
    const actions = useChatActions({ setChatHistory, setIsLoading, handleSendMessage, selectedLawArea, selectedTopic, chatHistory, interactionMode });

    return {
        chatHistory, setChatHistory,
        currentMessage, setCurrentMessage,
        legalArticles, setLegalArticles,
        isLoading, setIsLoading,
        isDeepThinkingEnabled, setIsDeepThinkingEnabled,
        handleSendMessage,
        handleSelectCourtRole: (role: CourtRole) => modes.handleSelectCourtRole(role, chatHistory),
        handleGenerateKnowledge: actions.handleGenerateKnowledge,
        handleFileUpload: actions.handleFileUpload,
        loadChatHistories: persistence.loadChatHistories,
        handleAddCost: persistence.updateCosts,
        handleExportChat: actions.handleExportChat,
        handleImportChat: actions.handleImportChat,
        handleInitialGreeting: modes.handleInitialGreeting
    };
};
