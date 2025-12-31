import { useState, useEffect, useCallback, useRef } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { UserProfile, LawArea } from '../types';

const initialProfile: UserProfile = {
    quickActions: [],
    totalCost: 0
};

export const useUserSession = (initialTopics: Record<LawArea, string[]>, onWelcome: () => void) => {
    const [user, setUser] = useState<User | null>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [userProfile, setUserProfile] = useState<UserProfile>(initialProfile);
    const [totalCost, setTotalCost] = useState<number>(0);
    const [isLocalOnly, setIsLocalOnly] = useState<boolean>(false);

    // Auth Listener
    const welcomeTriggered = useRef<string | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setAuthLoading(false);
            if (currentUser && welcomeTriggered.current !== currentUser.uid) {
                welcomeTriggered.current = currentUser.uid;
                // Delay welcome modal to ensure UI is ready
                setTimeout(() => {
                    onWelcome();
                }, 800);
            }
        });
        return () => unsubscribe();
    }, [onWelcome]);

    // Initialize User in Firestore
    useEffect(() => {
        if (!user || isLocalOnly) return;

        const initializeUser = async () => {
            const userDocRef = doc(db, 'users', user.uid);
            try {
                const userDoc = await getDoc(userDocRef);

                if (!userDoc.exists()) {
                    await setDoc(userDocRef, {
                        email: user.email,
                        displayName: user.displayName,
                        topics: initialTopics,
                        profile: initialProfile,
                        totalCost: 0,
                        createdAt: serverTimestamp(),
                        lastLogin: serverTimestamp()
                    }, { merge: true });
                } else {
                    const data = userDoc.data();
                    const now = Date.now();
                    const lastUpdate = data.lastLogin?.toMillis() || 0;

                    if (now - lastUpdate > 3600000) {
                        await updateDoc(userDocRef, {
                            email: user.email,
                            displayName: user.displayName,
                            lastLogin: serverTimestamp()
                        });
                    }
                }
            } catch (e) {
                console.error("Error initializing user data:", e);
            }
        };

        initializeUser();
    }, [user, initialTopics]);

    // Sync Profile and Cost
    useEffect(() => {
        if (!user || isLocalOnly) return;

        const userDocRef = doc(db, 'users', user.uid);
        const unsubscribe = onSnapshot(userDocRef, (userDoc) => {
            try {
                if (!userDoc.exists()) return;
                const data = userDoc.data();

                if (data.totalCost !== undefined && data.totalCost !== totalCost) {
                    setTotalCost(data.totalCost);
                }

                let profile = data.profile || initialProfile;
                const sessionData = sessionStorage.getItem('personalData');
                if (sessionData) {
                    try {
                        const parsed = JSON.parse(sessionData);
                        profile = { ...profile, personalData: parsed };
                    } catch (e) {
                        console.error("Session data parse error:", e);
                    }
                }

                if (JSON.stringify(profile) !== JSON.stringify(userProfile)) {
                    setUserProfile(profile);
                }
            } catch (e) {
                console.error("Error handling user profile snapshot:", e);
            }
        });

        return () => unsubscribe();
    }, [user, totalCost, userProfile]);

    const handleUpdateProfile = useCallback(async (newProfile: UserProfile, isSessionOnly: boolean = false) => {
        setUserProfile(newProfile);

        if (isSessionOnly) {
            if (newProfile.personalData) {
                sessionStorage.setItem('personalData', JSON.stringify(newProfile.personalData));
            }
            return;
        } else {
            sessionStorage.removeItem('personalData');
        }

        if (!user || isLocalOnly) return;
        try {
            await setDoc(doc(db, 'users', user.uid), { profile: newProfile }, { merge: true });
        } catch (e) {
            console.error("Error saving profile:", e);
        }
    }, [user, isLocalOnly]);

    return {
        user,
        authLoading,
        userProfile,
        setUserProfile,
        totalCost,
        setTotalCost,
        handleUpdateProfile,
        isLocalOnly,
        setIsLocalOnly
    };
};
