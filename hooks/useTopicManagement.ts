import { useState, useEffect, useCallback } from 'react';
import { doc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { InteractionMode, LawArea } from '../types';
import { User } from 'firebase/auth';

export const useTopicManagement = (
    user: User | null,
    initialTopics: Record<LawArea, string[]>,
    selectedLawArea: LawArea | null,
    setInteractionMode: (mode: InteractionMode) => void,
    setSelectedTopic: (topic: string | null) => void,
    isLocalOnly: boolean = false
) => {
    const [topics, setTopics] = useState<Record<LawArea, string[]>>(initialTopics);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [topicToDelete, setTopicToDelete] = useState<{ lawArea: LawArea, topic: string } | null>(null);

    // Sync topics from Firestore
    useEffect(() => {
        if (!user || isLocalOnly) return;
        const userDocRef = doc(db, 'users', user.uid);
        const unsubscribe = onSnapshot(userDocRef, (userDoc) => {
            if (userDoc.exists()) {
                const data = userDoc.data();
                if (data.topics && JSON.stringify(data.topics) !== JSON.stringify(topics)) {
                    setTopics(data.topics);
                }
            }
        });
        return () => unsubscribe();
    }, [user, topics, isLocalOnly]); // Added isLocalOnly to dependency array



    // Updated handleAddTopic based on the instruction
    const handleAddTopic = useCallback(async (newTopic: string, mode: InteractionMode = InteractionMode.Analysis) => {
        if (!user || !selectedLawArea || !newTopic.trim()) return; // Added newTopic.trim() check back
        const trimmedTopic = newTopic.trim(); // Re-introduced trimmedTopic

        // Check for existing topic before adding
        if (topics[selectedLawArea] && topics[selectedLawArea].includes(trimmedTopic)) {
            setInteractionMode(mode);
            setSelectedTopic(trimmedTopic);
            return; // Topic already exists, just set mode and selected topic
        }

        const updatedTopics = {
            ...topics,
            [selectedLawArea]: [...(topics[selectedLawArea] || []), trimmedTopic] // Use trimmedTopic
        };
        setTopics(updatedTopics);
        setInteractionMode(mode);
        setSelectedTopic(trimmedTopic); // Use trimmedTopic

        if (isLocalOnly || !user) return;

        try {
            await setDoc(doc(db, 'users', user.uid), { topics: updatedTopics }, { merge: true });

            // Also create the initial chat document so it appears in history immediately
            const chatId = `${selectedLawArea}_${trimmedTopic.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`;
            await setDoc(doc(db, 'users', user.uid, 'chats', chatId), {
                messages: [],
                lastUpdated: serverTimestamp(),
                lawArea: selectedLawArea,
                topic: trimmedTopic,
                interactionMode: mode
            }, { merge: true });

        } catch (e) {
            console.error("Error saving topics:", e);
        }
    }, [user, topics, isLocalOnly, selectedLawArea, setInteractionMode, setSelectedTopic]);

    const requestDeleteTopic = useCallback((lawArea: LawArea, topic: string) => {
        setTopicToDelete({ lawArea, topic });
        setIsDeleteModalOpen(true);
    }, []);

    const cancelDeleteTopic = useCallback(() => {
        setIsDeleteModalOpen(false);
        setTopicToDelete(null);
    }, []);

    const confirmDeleteTopic = useCallback(async (onConfirmed?: (topic: string) => Promise<void>) => {
        if (!user || !topicToDelete) return;

        const { lawArea, topic: topicToRemove } = topicToDelete;
        const updatedTopics = {
            ...topics,
            [lawArea]: topics[lawArea].filter(t => t !== topicToRemove)
        };

        // UI update first
        setTopics(updatedTopics);
        setIsDeleteModalOpen(false);
        setTopicToDelete(null);

        if (isLocalOnly || !user) {
            if (onConfirmed) await onConfirmed(topicToRemove);
            return;
        }

        try {
            await setDoc(doc(db, 'users', user.uid), { topics: updatedTopics }, { merge: true });
            if (onConfirmed) {
                await onConfirmed(topicToRemove);
            }
        } catch (e) {
            console.error("Error deleting topic:", e);
        }
    }, [user, topics, topicToDelete, isLocalOnly, setTopics, setIsDeleteModalOpen, setTopicToDelete]);

    return {
        topics,
        setTopics,
        isDeleteModalOpen,
        setIsDeleteModalOpen,
        topicToDelete,
        setTopicToDelete,
        handleAddTopic,
        requestDeleteTopic,
        cancelDeleteTopic,
        confirmDeleteTopic
    };
};
