import React, { createContext, useContext, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { LawArea, InteractionMode, UserProfile, CourtRole } from '../types';
import { useUserSession } from '../hooks/useUserSession';
import { useAppNavigation } from '../hooks/useAppNavigation';

interface AppContextType {
    user: User | null;
    authLoading: boolean;
    profileLoading: boolean;
    userProfile: UserProfile | null;
    totalCost: number;
    setTotalCost: React.Dispatch<React.SetStateAction<number>>;
    handleUpdateProfile: (profile: any, silent?: boolean) => Promise<void>;
    isLocalOnly: boolean;
    setIsLocalOnly: React.Dispatch<React.SetStateAction<boolean>>;
    subsLoading: boolean;

    // Navigation
    selectedLawArea: LawArea | null;
    setSelectedLawArea: (area: LawArea | null) => void;
    selectedTopic: string | null;
    setSelectedTopic: (topic: string | null) => void;
    interactionMode: InteractionMode | null;
    setInteractionMode: (mode: InteractionMode | null) => void;
    courtRole: CourtRole | null;
    setCourtRole: (role: CourtRole | null) => void;
    servicePath: 'pro' | 'hub' | 'standard' | null;
    setServicePath: (path: 'pro' | 'hub' | 'standard' | null) => void;
    activeCustomAgent: any | null;
    setActiveCustomAgent: (agent: any | null) => void;
    isAnalysisMode: boolean;
    setIsAnalysisMode: (val: boolean) => void;
    currentChatId: string | null;
    resetNavigation: () => void;
    backToTopic: () => void;
    backToLawArea: () => void;
    topics: Record<LawArea, string[]>;
    setTopics: React.Dispatch<React.SetStateAction<Record<LawArea, string[]>>>;
    customAgents: any[];
    isPro: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const navigation = useAppNavigation();
    const session = useUserSession(navigation.initialTopics);

    const value: AppContextType = {
        ...session,
        ...navigation,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};
