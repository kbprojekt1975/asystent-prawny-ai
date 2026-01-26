import React, { useState, useEffect, useCallback } from 'react';
import { doc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { InteractionMode, LawArea, getChatId } from '../types';
import { User } from 'firebase/auth';

export const useTopicManagement = (
    user: User | null,
    topics: Record<LawArea, string[]>,
    setTopics: React.Dispatch<React.SetStateAction<Record<LawArea, string[]>>>,
    selectedLawArea: LawArea | null,
    setInteractionMode: (mode: InteractionMode) => void,
    setSelectedTopic: (topic: string | null) => void,
    isLocalOnly: boolean = false
) => {
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [topicToDelete, setTopicToDelete] = useState<{ lawArea: LawArea, topic: string } | null>(null);



    // Updated handleAddTopic: allow mode to be null initially
    const handleAddTopic = useCallback(async (newTopic: string, mode: InteractionMode | null = null, servicePath: 'pro' | 'standard' = 'standard') => {
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
            const chatId = getChatId(selectedLawArea, trimmedTopic, mode);
            await setDoc(doc(db, 'users', user.uid, 'chats', chatId), {
                messages: [],
                lastUpdated: serverTimestamp(),
                lawArea: selectedLawArea,
                topic: trimmedTopic,
                interactionMode: mode,
                servicePath: servicePath
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
