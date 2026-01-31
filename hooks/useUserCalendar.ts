import { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import {
    collection,
    onSnapshot,
    query,
    orderBy,
    where,
    setDoc,
    doc,
    deleteDoc,
    serverTimestamp,
    collectionGroup
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { Reminder } from '../types';

export const useUserCalendar = (user: User | null, isLocalOnly: boolean = false) => {
    const [personalReminders, setPersonalReminders] = useState<Reminder[]>([]);
    const [caseDeadlines, setCaseDeadlines] = useState<Reminder[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // 1. Fetch personal reminders
    useEffect(() => {
        if (!user || isLocalOnly) {
            setPersonalReminders([]);
            setIsLoading(false);
            return;
        }

        const remindersRef = collection(db, 'users', user.uid, 'reminders');
        const q = query(remindersRef, orderBy('date', 'asc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                type: 'personal' as const
            } as Reminder));
            setPersonalReminders(data);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [user, isLocalOnly]);

    // 2. Fetch all deadlines from all chats
    useEffect(() => {
        if (!user || isLocalOnly) {
            setCaseDeadlines([]);
            return;
        }

        const timelineQuery = query(
            collectionGroup(db, 'timeline'),
            where('userId', '==', user.uid),
            where('type', '==', 'deadline'),
            orderBy('date', 'asc')
        );

        const unsubscribe = onSnapshot(timelineQuery, (snapshot) => {
            const deadlines = snapshot.docs
                .map(docSnap => {
                    const data = docSnap.data();
                    const pathParts = docSnap.ref.path.split('/');
                    // users/{uid}/chats/{chatId}/timeline/{docId}
                    const topic = data.topic || pathParts[pathParts.length - 3] || 'Nieznany temat';

                    return {
                        id: docSnap.id,
                        ...data,
                        type: 'deadline' as const,
                        topic: topic,
                        _path: docSnap.ref.path
                    } as any;
                })
                .filter(d => {
                    // Filter by user ID if its present in the data or by path
                    return d.userId === user.uid || d._path?.includes(`users/${user.uid}/`);
                });

            setCaseDeadlines(deadlines as Reminder[]);
        }, (error) => {
            console.error("Collection Group query error:", error);
        });

        return () => unsubscribe();
    }, [user, isLocalOnly]);

    const addReminder = useCallback(async (date: string, title: string, description?: string) => {
        if (!user || isLocalOnly) return;
        const remindersRef = collection(db, 'users', user.uid, 'reminders');
        const newReminderRef = doc(remindersRef);
        await setDoc(newReminderRef, {
            date,
            title,
            description,
            completed: false,
            createdAt: serverTimestamp(),
            userId: user.uid
        });
    }, [user, isLocalOnly]);

    const deleteReminder = useCallback(async (id: string) => {
        if (!user || isLocalOnly) return;
        await deleteDoc(doc(db, 'users', user.uid, 'reminders', id));
    }, [user, isLocalOnly]);

    const toggleReminder = useCallback(async (id: string, currentStatus: boolean) => {
        if (!user || isLocalOnly) return;
        const reminderRef = doc(db, 'users', user.uid, 'reminders', id);
        await setDoc(reminderRef, { completed: !currentStatus }, { merge: true });
    }, [user, isLocalOnly]);

    const allEvents = [...personalReminders, ...caseDeadlines].sort((a, b) => a.date.localeCompare(b.date));

    return {
        allEvents,
        personalReminders,
        caseDeadlines,
        isLoading,
        addReminder,
        deleteReminder,
        toggleReminder
    };
};
