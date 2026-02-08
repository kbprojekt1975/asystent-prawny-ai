import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';

interface UIContextType {
    isFullScreen: boolean;
    setIsFullScreen: (val: boolean) => void;
    isProfileModalOpen: boolean;
    setIsProfileModalOpen: (val: boolean) => void;
    isQuickActionsModalOpen: boolean;
    setIsQuickActionsModalOpen: (val: boolean) => void;
    isHistoryPanelOpen: boolean;
    setIsHistoryPanelOpen: (val: boolean) => void;
    isCaseManagementModalOpen: boolean;
    setIsCaseManagementModalOpen: (val: boolean) => void;
    isAiToolsSidebarOpen: boolean;
    setIsAiToolsSidebarOpen: (val: boolean) => void;
    isAppHelpSidebarOpen: boolean;
    setIsAppHelpSidebarOpen: (val: boolean) => void;
    isPreviewModalOpen: boolean;
    setIsPreviewModalOpen: (val: boolean) => void;
    isKnowledgeModalOpen: boolean;
    setIsKnowledgeModalOpen: (val: boolean) => void;
    isDocumentsModalOpen: boolean;
    setIsDocumentsModalOpen: (val: boolean) => void;
    isWelcomeAssistantOpen: boolean;
    setIsWelcomeAssistantOpen: (val: boolean) => void;
    isInstallPromptOpen: boolean;
    setIsInstallPromptOpen: (val: boolean) => void;
    isAlimonyModalOpen: boolean;
    setIsAlimonyModalOpen: (val: boolean) => void;
    isWelcomeModalOpen: boolean;
    setIsWelcomeModalOpen: (val: boolean) => void;
    welcomeModalInitialViewMode: 'selection' | 'input';
    setWelcomeModalInitialViewMode: (val: 'selection' | 'input') => void;
    deferredPrompt: any;
    setDeferredPrompt: (val: any) => void;
    isDocumentationModalOpen: boolean;
    setIsDocumentationModalOpen: (val: boolean) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isQuickActionsModalOpen, setIsQuickActionsModalOpen] = useState(false);
    const [isHistoryPanelOpen, setIsHistoryPanelOpen] = useState(false);
    const [isCaseManagementModalOpen, setIsCaseManagementModalOpen] = useState(false);
    const [isAiToolsSidebarOpen, setIsAiToolsSidebarOpen] = useState(false);
    const [isAppHelpSidebarOpen, setIsAppHelpSidebarOpen] = useState(false);
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
    const [isKnowledgeModalOpen, setIsKnowledgeModalOpen] = useState(false);
    const [isDocumentsModalOpen, setIsDocumentsModalOpen] = useState(false);
    const [isWelcomeAssistantOpen, setIsWelcomeAssistantOpen] = useState(false);
    const [isInstallPromptOpen, setIsInstallPromptOpen] = useState(false);
    const [isAlimonyModalOpen, setIsAlimonyModalOpen] = useState(false);
    const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(false);
    const [welcomeModalInitialViewMode, setWelcomeModalInitialViewMode] = useState<'selection' | 'input'>('selection');
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isDocumentationModalOpen, setIsDocumentationModalOpen] = useState(false);

    useEffect(() => {
        const handleBeforeInstallPrompt = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const value: UIContextType = {
        isFullScreen, setIsFullScreen,
        isProfileModalOpen, setIsProfileModalOpen,
        isQuickActionsModalOpen, setIsQuickActionsModalOpen,
        isHistoryPanelOpen, setIsHistoryPanelOpen,
        isCaseManagementModalOpen, setIsCaseManagementModalOpen,
        isAiToolsSidebarOpen, setIsAiToolsSidebarOpen,
        isAppHelpSidebarOpen, setIsAppHelpSidebarOpen,
        isPreviewModalOpen, setIsPreviewModalOpen,
        isKnowledgeModalOpen, setIsKnowledgeModalOpen,
        isDocumentsModalOpen, setIsDocumentsModalOpen,
        isWelcomeAssistantOpen, setIsWelcomeAssistantOpen,
        isInstallPromptOpen, setIsInstallPromptOpen,
        isAlimonyModalOpen, setIsAlimonyModalOpen,
        isWelcomeModalOpen, setIsWelcomeModalOpen,
        welcomeModalInitialViewMode, setWelcomeModalInitialViewMode,
        deferredPrompt, setDeferredPrompt,
        isDocumentationModalOpen, setIsDocumentationModalOpen
    };

    return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
};

export const useUIContext = () => {
    const context = useContext(UIContext);
    if (context === undefined) {
        throw new Error('useUIContext must be used within a UIProvider');
    }
    return context;
};
