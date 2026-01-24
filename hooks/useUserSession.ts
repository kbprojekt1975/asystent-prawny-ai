import { useState, useEffect, useCallback, useRef } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, onSnapshot, collection } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { UserProfile, LawArea, SubscriptionStatus } from '../types';

const initialProfile: UserProfile = {
    quickActions: [],
    totalCost: 0,
    isActive: false
};

export const useUserSession = (initialTopics: Record<LawArea, string[]>) => {
    const [user, setUser] = useState<User | null>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [profileLoading, setProfileLoading] = useState(true); // Moved up
    const [userProfile, setUserProfile] = useState<UserProfile>(initialProfile);
    const [totalCost, setTotalCost] = useState<number>(0);
    const [isLocalOnly, setIsLocalOnly] = useState<boolean>(false);
    const [subsLoading, setSubsLoading] = useState(true);

    // Auth Listener
    const welcomeTriggered = useRef<string | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setProfileLoading(true);
            }
            setUser(currentUser);
            setAuthLoading(false);
            if (currentUser && welcomeTriggered.current !== currentUser.uid) {
                welcomeTriggered.current = currentUser.uid;
            }
        });
        return () => unsubscribe();
    }, []);

    // Initialize User in Firestore
    useEffect(() => {
        if (!user) return;

        const initializeUser = async () => {
            const userDocRef = doc(db, 'users', user.uid);
            try {
                const userDoc = await getDoc(userDocRef);

                if (!userDoc.exists()) {
                    const pendingConsentValue = sessionStorage.getItem('pendingConsent');
                    const isConsentDefaulted = pendingConsentValue === 'true';

                    let finalDisplayName = user.displayName;
                    if (!finalDisplayName && user.email?.endsWith('@internal.asystent-ai.pl')) {
                        finalDisplayName = user.email.split('@')[0];
                    }

                    await setDoc(userDocRef, {
                        email: user.email,
                        displayName: finalDisplayName,
                        topics: initialTopics,
                        profile: {
                            ...initialProfile,
                            displayName: finalDisplayName,
                            isActive: true,
                            dataProcessingConsent: isConsentDefaulted,
                            consentDate: isConsentDefaulted ? serverTimestamp() : null,
                            hasSeenWelcomeAssistant: false
                        },
                        totalCost: 0,
                        createdAt: serverTimestamp(),
                        lastLogin: serverTimestamp()
                    }, { merge: true });

                    if (pendingConsentValue !== null) {
                        sessionStorage.removeItem('pendingConsent');
                    }
                } else {
                    const data = userDoc.data();
                    const now = Date.now();
                    const lastUpdate = data.lastLogin?.toMillis() || 0;

                    const pendingConsentValue = sessionStorage.getItem('pendingConsent');
                    const isConsentFromAuth = pendingConsentValue === 'true';

                    // Ensure displayName is synced if it's missing but it's a dummy email
                    let finalDisplayName = data.displayName || data.profile?.displayName;
                    let needsUpdate = false;

                    if (!finalDisplayName && user.email?.endsWith('@internal.asystent-ai.pl')) {
                        finalDisplayName = user.email.split('@')[0];
                        needsUpdate = true;
                    }

                    // Also check if we need to update consent (e.g. user toggled it at login)
                    if (pendingConsentValue !== null && data.profile?.dataProcessingConsent !== isConsentFromAuth) {
                        needsUpdate = true;
                    }

                    if (now - lastUpdate > 3600000 || needsUpdate) {
                        const previousConsent = data.profile?.dataProcessingConsent ?? false;
                        const newConsent = pendingConsentValue !== null ? isConsentFromAuth : previousConsent;
                        // Prevent downgrade: if it was true, keep it true unless we want an explicit way to withdraw (not implemented here)
                        const finalConsent = previousConsent || newConsent;

                        await updateDoc(userDocRef, {
                            email: user.email,
                            displayName: finalDisplayName || user.displayName,
                            "profile.displayName": finalDisplayName || user.displayName,
                            "profile.dataProcessingConsent": finalConsent,
                            "profile.consentDate": (finalConsent && !previousConsent) ? serverTimestamp() : (data.profile?.consentDate ?? null),
                            lastLogin: serverTimestamp()
                        });
                    }

                    if (pendingConsentValue !== null) {
                        sessionStorage.removeItem('pendingConsent');
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
        if (!user) {
            setProfileLoading(false);
            return;
        }

        // CORRECT PLACE: Reset loading state when we actually start listening to a new user
        setProfileLoading(true);

        const userDocRef = doc(db, 'users', user.uid);
        const unsubscribe = onSnapshot(userDocRef, (userDoc) => {
            try {
                if (!userDoc.exists()) {
                    // If doc doesn't exist yet, we stick with initial. profileLoading done.
                    setProfileLoading(false);
                    return;
                }
                const data = userDoc.data();

                // Explicit fallback to 0 if totalCost is missing
                const backendCost = data.totalCost ?? 0;
                setTotalCost(backendCost);

                let profile = data.profile || initialProfile;

                // Derive Local Only state from consent OR manual preference
                // FORCE Local Only if no consent. Allow preference if consent granted.
                if (profile.dataProcessingConsent === true) {
                    setIsLocalOnly(profile.manualLocalMode === true);
                } else {
                    setIsLocalOnly(true);
                }

                const sessionData = sessionStorage.getItem('personalData');
                if (sessionData) {
                    try {
                        const parsed = JSON.parse(sessionData);
                        profile = { ...profile, personalData: parsed };
                    } catch (e) {
                        console.error("Session data parse error:", e);
                    }
                }

                setUserProfile(profile);
            } catch (e) {
                console.error("Error handling user profile snapshot:", e);
            } finally {
                setProfileLoading(false);
            }
        });

        return () => unsubscribe();
    }, [user]);

    // Sync Stripe Subscriptions
    useEffect(() => {
        if (!user) return;

        const subsRef = collection(db, 'customers', user.uid, 'subscriptions');
        const unsubscribe = onSnapshot(subsRef, (snapshot) => {
            try {
                const activeSub = snapshot.docs
                    .map(doc => ({ id: doc.id, ...doc.data() } as any))
                    .find(sub => ['active', 'trialing'].includes(sub.status));

                if (activeSub) {
                    setUserProfile(prev => ({
                        ...prev,
                        subscription: {
                            status: activeSub.status as SubscriptionStatus,
                            isPaid: activeSub.status === 'active',
                            activatedAt: activeSub.created,
                            expiresAt: activeSub.current_period_end,
                            priceId: activeSub.items?.[0]?.price?.id, // Useful for multi-plan
                            creditLimit: 10.00, // Hardcoded for now per user req
                            spentAmount: prev.subscription?.spentAmount || 0
                        }
                    }));
                }
            } catch (e) {
                console.error("Error in subscription listener:", e);
            } finally {
                setSubsLoading(false);
            }
        }, (error) => {
            console.error("Subscription listener failed:", error);
            setSubsLoading(false);
        });

        return () => unsubscribe();
    }, [user, isLocalOnly]);

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

        // BLOCK if no consent.
        if (!user || !newProfile.dataProcessingConsent) return;

        try {
            await setDoc(doc(db, 'users', user.uid), { profile: newProfile }, { merge: true });
            // Update effective state immediately for snappy UI
            setIsLocalOnly(newProfile.manualLocalMode === true);
        } catch (e) {
            console.error("Error saving profile:", e);
        }
    }, [user]);

    return {
        user,
        authLoading,
        profileLoading,
        subsLoading,
        userProfile,
        setUserProfile,
        totalCost,
        setTotalCost,
        handleUpdateProfile,
        isLocalOnly,
        setIsLocalOnly
    };
};
