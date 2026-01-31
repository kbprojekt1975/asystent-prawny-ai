import { useState, useMemo, useEffect } from 'react';
import { LawArea, InteractionMode, CourtRole, getChatId } from '../types';

const initialTopics: Record<LawArea, string[]> = {
    [LawArea.Criminal]: [],
    [LawArea.Family]: [],
    [LawArea.Civil]: [],
    [LawArea.Commercial]: [],
    [LawArea.Labor]: [],
    [LawArea.RealEstate]: [],
    [LawArea.Tax]: [],
    [LawArea.Administrative]: [],
    [LawArea.Universal]: [],
    [LawArea.Custom]: [],
};

const NAV_STORAGE_KEY = 'legal_app_navigation';

export const useAppNavigation = () => {
    // Initial state loading from localStorage
    const savedNav = useMemo(() => {
        const saved = localStorage.getItem(NAV_STORAGE_KEY);
        return saved ? JSON.parse(saved) : null;
    }, []);

    const [selectedLawArea, setSelectedLawArea] = useState<LawArea | null>(savedNav?.selectedLawArea || null);
    const [selectedTopic, setSelectedTopic] = useState<string | null>(savedNav?.selectedTopic || null);
    const [interactionMode, setInteractionMode] = useState<InteractionMode | null>(savedNav?.interactionMode || null);
    const [courtRole, setCourtRole] = useState<CourtRole | null>(savedNav?.courtRole || null);
    const [servicePath, setServicePath] = useState<'pro' | 'hub' | null>(savedNav?.servicePath || null);

    const [isAnalysisMode, setIsAnalysisMode] = useState<boolean>(savedNav?.isAnalysisMode || false);
    const [isFullScreen, setIsFullScreen] = useState<boolean>(savedNav?.isFullScreen || false);
    const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState<boolean>(false);

    // Save state to localStorage whenever it changes
    useEffect(() => {
        const navState = {
            selectedLawArea,
            selectedTopic,
            interactionMode,
            courtRole,
            servicePath,
            isAnalysisMode,
            isFullScreen
        };
        localStorage.setItem(NAV_STORAGE_KEY, JSON.stringify(navState));
    }, [selectedLawArea, selectedTopic, interactionMode, courtRole, servicePath, isAnalysisMode, isFullScreen]);

    const currentChatId = useMemo(() => {
        if (selectedLawArea && selectedTopic) {
            return getChatId(selectedLawArea, selectedTopic, interactionMode);
        }
        return null;
    }, [selectedLawArea, selectedTopic, interactionMode]);

    const resetNavigation = () => {
        setSelectedLawArea(null);
        setSelectedTopic(null);
        setInteractionMode(null);
        setCourtRole(null);
        setServicePath(null);
        setIsAnalysisMode(false);
        setIsFullScreen(false);
    };

    const backToTopic = () => {
        setSelectedTopic(null);
        setInteractionMode(null);
        setCourtRole(null);
        setIsFullScreen(false);
    };

    const backToLawArea = () => {
        setSelectedLawArea(null);
        setSelectedTopic(null);
        setInteractionMode(null);
        setCourtRole(null);
        setServicePath(null);
        setIsAnalysisMode(false);
        setIsFullScreen(false);
    };

    return {
        selectedLawArea, setSelectedLawArea,
        selectedTopic, setSelectedTopic,
        interactionMode, setInteractionMode,
        courtRole, setCourtRole,
        servicePath, setServicePath,
        isAnalysisMode, setIsAnalysisMode,
        isFullScreen, setIsFullScreen,
        currentChatId,
        resetNavigation,
        backToTopic,
        backToLawArea,
        initialTopics
    };
};
