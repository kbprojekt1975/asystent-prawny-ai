import { useState, useEffect, useCallback, useRef } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, onSnapshot, collection } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { UserProfile, LawArea, SubscriptionStatus } from '../types';

const initialProfile: UserProfile = {
    quickActions: [],
    totalCost: 0,
    isActive: false,
    hasSeenWelcomeAssistant: false,
    subscription: {
        status: 'active' as SubscriptionStatus,
        isPaid: true,
        creditLimit: 10,
        tokenLimit: 1000000,
        spentAmount: 0,
        tokensUsed: 0
    }
};

export const useUserSession = (initialTopics: Record<LawArea, string[]>) => {
    const [user, setUser] = useState<User | null>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [profileLoading, setProfileLoading] = useState(true); // Moved up
    const [userProfile, setUserProfile] = useState<UserProfile>(initialProfile);
    const [topics, setTopics] = useState<Record<LawArea, string[]>>(initialTopics);
    const [totalCost, setTotalCost] = useState<number>(0);
    const [isLocalOnly, setIsLocalOnly] = useState<boolean>(true);
    const [subsLoading, setSubsLoading] = useState(true);
    const [customAgents, setCustomAgents] = useState<any[]>([]);
    const [isPro, setIsPro] = useState(false);

    // Auth Listener
    const welcomeTriggered = useRef<string | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setProfileLoading(true);
                setSubsLoading(true);
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
                            isActive: false,
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

                        console.log("[useUserSession] initializeUser: Updating existing user.", {
                            needsUpdate,
                            pendingConsentValue,
                            finalConsent
                        });

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

                let profile = { ...initialProfile, ...(data.profile || {}) };

                // Derive Local Only state from consent OR manual preference
                // FORCE Local Only if no consent. Allow preference if consent granted.
                const effectiveLocalOnly = profile.dataProcessingConsent === true ? (profile.manualLocalMode === true) : true;
                setIsLocalOnly(effectiveLocalOnly);

                const sessionData = sessionStorage.getItem('personalData');
                if (sessionData) {
                    try {
                        const parsed = JSON.parse(sessionData);
                        profile = { ...profile, personalData: parsed };
                    } catch (e) {
                        console.error("Session data parse error:", e);
                    }
                }

                if (!effectiveLocalOnly && data.topics && JSON.stringify(data.topics) !== JSON.stringify(topics)) {
                    setTopics(data.topics);
                }

                // Unified Stripe Migration
                const { subscription: firestoreSub, ...profileWithoutLegacySub } = profile;

                setUserProfile(prev => ({
                    ...profileWithoutLegacySub,
                    subscription: {
                        ...(prev.subscription || {}),
                        // Merge the spentAmount from Firestore (User Doc) with the Status/Limit from Stripe (prev state)
                        spentAmount: firestoreSub?.spentAmount ?? prev.subscription?.spentAmount ?? 0,
                        tokensUsed: firestoreSub?.tokensUsed ?? prev.subscription?.tokensUsed ?? 0,
                    } as any
                }));
            } catch (e) {
                console.error("Error handling user profile snapshot:", e);
            } finally {
                setProfileLoading(false);
            }
        });

        return () => unsubscribe();
    }, [user, topics]);

    // Sync Stripe Subscriptions
    useEffect(() => {
        if (!user) {
            setSubsLoading(false);
            setIsPro(false);
            return;
        };

        const subsRef = collection(db, 'customers', user.uid, 'subscriptions');
        const unsubscribe = onSnapshot(subsRef, (snapshot) => {
            try {
                const activeSub = snapshot.docs
                    .map(doc => ({ id: doc.id, ...doc.data() } as any))
                    .find(sub => ['active', 'trialing'].includes(sub.status));

                console.log("[useUserSession] Subscription snapshot updated", {
                    foundActive: !!activeSub,
                    status: activeSub?.status || 'none'
                });

                if (activeSub) {
                    const priceId = activeSub.items?.[0]?.price?.id;
                    const STARTER_ID = import.meta.env.VITE_STRIPE_PRICE_STARTER || "price_1StBSvDXnXONl2svkF51zTnl";
                    const PRO_ID = import.meta.env.VITE_STRIPE_PRICE_PRO || "price_1Sw7KFDXnXONl2svPmtUXAxk";

                    const isSubPro = priceId === PRO_ID;
                    setIsPro(isSubPro);

                    setUserProfile(prev => ({
                        ...prev,
                        subscription: {
                            status: activeSub.status as SubscriptionStatus,
                            isPaid: activeSub.status === 'active',
                            activatedAt: activeSub.created,
                            expiresAt: activeSub.current_period_end,
                            priceId: priceId,
                            creditLimit: isSubPro ? 50.00 : 10.00,
                            spentAmount: prev.subscription?.spentAmount || 0,
                            packageType: isSubPro ? 'pro' : 'starter'
                        }
                    }));
                } else {
                    setIsPro(false);
                    setUserProfile(prev => ({
                        ...prev,
                        subscription: {
                            status: SubscriptionStatus.None,
                            isPaid: false,
                            creditLimit: 0,
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

    // Sync Custom Agents
    useEffect(() => {
        if (!user) {
            setCustomAgents([]);
            return;
        }

        const agentsRef = collection(db, 'users', user.uid, 'custom_agents');
        const unsubscribe = onSnapshot(agentsRef, (snapshot) => {
            const agents = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setCustomAgents(agents);
        });

        return () => unsubscribe();
    }, [user]);

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

        // BLOCK if no consent, UNLESS we are updating functional UI flags.
        // Functional flags like hasSeenWelcomeAssistant are necessary for UI stability.
        // If they haven't given consent yet, we allow the update but only if they haven't tried to add personal data.
        const prevConsent = userProfile.dataProcessingConsent;
        const newConsent = newProfile.dataProcessingConsent;

        if (!user) return;

        let profileToSave = { ...newProfile };

        // If they haven't given consent yet, we allow the technical update but we STRIP personal data.
        if (!newConsent && !prevConsent) {
            if (profileToSave.personalData && Object.keys(profileToSave.personalData).length > 0) {
                console.warn("[useUserSession] Consent not granted. Stripping personal data from Firestore update.");
                const { personalData, ...rest } = profileToSave;
                profileToSave = rest;
            }
        }

        try {
            // Firestore throws if any field is undefined. We must sanitize.
            const sanitize = (obj: any): any => {
                const newObj: any = {};
                Object.keys(obj).forEach(key => {
                    const value = obj[key];
                    if (value !== undefined) {
                        if (value && typeof value === 'object' && !Array.isArray(value)) {
                            newObj[key] = sanitize(value);
                        } else {
                            newObj[key] = value;
                        }
                    }
                });
                return newObj;
            };

            const dataToSave = sanitize(profileToSave);

            await setDoc(doc(db, 'users', user.uid), { profile: dataToSave }, { merge: true });
            // Update effective state immediately for snappy UI
            setIsLocalOnly(profileToSave.manualLocalMode === true);
        } catch (e) {
            console.error("Error saving profile:", e);
        }
    }, [user, userProfile]);

    return {
        user,
        authLoading,
        profileLoading,
        subsLoading,
        userProfile,
        setUserProfile,
        topics,
        setTopics,
        totalCost,
        setTotalCost,
        handleUpdateProfile,
        isLocalOnly,
        setIsLocalOnly,
        customAgents,
        isPro
    };
};
