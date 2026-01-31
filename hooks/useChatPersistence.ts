import { useCallback } from 'react';
import { doc, updateDoc, setDoc, serverTimestamp, increment, collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { User } from 'firebase/auth';
import { LawArea, InteractionMode, ChatMessage, getChatId } from '../types';

interface UseChatPersistenceProps {
    user: User | null;
    onAddCost?: (cost: number) => void;
    onRefreshHistories?: () => void;
    isLocalOnly?: boolean;
}

export const useChatPersistence = ({
    user,
    onAddCost,
    onRefreshHistories,
    isLocalOnly = false
}: UseChatPersistenceProps) => {

    const saveChatHistory = useCallback(async (
        chatId: string,
        messages: ChatMessage[],
        metadata: {
            lawArea: LawArea;
            topic: string;
            interactionMode: InteractionMode;
            servicePath?: 'pro' | 'standard';
        }
    ) => {
        if (!user || isLocalOnly) return;

        try {
            await setDoc(doc(db, 'users', user.uid, 'chats', chatId), {
                messages: messages.filter(m => m.role !== 'system'),
                lastUpdated: serverTimestamp(),
                ...metadata,
                servicePath: metadata.servicePath || 'standard'
            }, { merge: true });

            onRefreshHistories?.();
        } catch (error) {
            console.error("Error saving chat history:", error);
        }
    }, [user, isLocalOnly, onRefreshHistories]);

    const updateCosts = useCallback(async (cost: number) => {
        if (!user) return;

        onAddCost?.(cost);
    }, [user, onAddCost]);

    const loadChatHistories = useCallback(async () => {
        if (!user || isLocalOnly) return [];
        try {
            const chatsColRef = collection(db, 'users', user.uid, 'chats');
            const querySnapshot = await getDocs(chatsColRef);
            const histories: any[] = [];

            const historyPromises = querySnapshot.docs.map(async (chatDoc) => {
                const data = chatDoc.data();
                const parts = chatDoc.id.split('_');
                if (parts.length >= 2) {
                    const lawArea = (data.lawArea || parts[0]) as LawArea;
                    let topic: string = data.topic || '';

                    if (!topic) {
                        const topicParts = parts.slice(1);
                        const lastPart = topicParts[topicParts.length - 1];
                        const isModeSuffix = Object.values(InteractionMode).some(mode =>
                            mode.replace(/[^a-z0-9]/gi, '_').toLowerCase() === lastPart
                        );
                        topic = isModeSuffix && topicParts.length > 1
                            ? topicParts.slice(0, -1).join('_')
                            : topicParts.join('_');
                    }

                    let docCount = 0;
                    try {
                        const docsRef = collection(db, 'users', user.uid!, 'chats', chatDoc.id, 'documents');
                        const docsSnap = await getDocs(docsRef);
                        docCount = docsSnap.size;
                    } catch (err) {
                        console.warn(`Could not fetch doc count for ${chatDoc.id}`, err);
                    }

                    let interactionMode: InteractionMode | undefined = data.interactionMode || undefined;
                    return {
                        lawArea,
                        topic,
                        interactionMode,
                        servicePath: data.servicePath || 'standard',
                        lastUpdated: data.lastUpdated,
                        docCount
                    };
                }
                return null;
            });

            const results = await Promise.all(historyPromises);
            results.forEach(res => { if (res) histories.push(res); });

            histories.sort((a, b) => {
                if (a.lastUpdated && b.lastUpdated) return b.lastUpdated.seconds - a.lastUpdated.seconds;
                if (a.lastUpdated) return -1;
                if (b.lastUpdated) return 1;
                return a.topic.localeCompare(b.topic);
            });

            return histories;
        } catch (e) {
            console.error("Error loading chat histories:", e);
            return [];
        }
    }, [user, isLocalOnly]);

    return {
        saveChatHistory,
        updateCosts,
        loadChatHistories
    };
};
