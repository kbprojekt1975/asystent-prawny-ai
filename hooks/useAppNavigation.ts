import { useState, useMemo } from 'react';
import { LawArea, InteractionMode, CourtRole } from '../types';

const initialTopics: Record<LawArea, string[]> = {
    [LawArea.Criminal]: ["Obrona w sprawie o kradzież", "Jazda pod wpływem alkoholu", "Zniesławienie"],
    [LawArea.Family]: ["Rozwód", "Alimenty na dziecko", "Ustalenie kontaktów z dzieckiem"],
    [LawArea.Civil]: ["Sprawa o spadek", "Niewykonanie umowy", "Odszkodowanie za wypadek"],
    [LawArea.Commercial]: ["Założenie spółki z o.o.", "Spór z kontrahentem", "Rejestracja znaku towarowego"],
};

export const useAppNavigation = () => {
    const [selectedLawArea, setSelectedLawArea] = useState<LawArea | null>(null);
    const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
    const [interactionMode, setInteractionMode] = useState<InteractionMode | null>(null);
    const [courtRole, setCourtRole] = useState<CourtRole | null>(null);
    const [topics, setTopics] = useState<Record<LawArea, string[]>>(initialTopics);

    const [isAnalysisMode, setIsAnalysisMode] = useState<boolean>(false);
    const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
    const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState<boolean>(false);

    const currentChatId = useMemo(() => {
        if (selectedLawArea && selectedTopic) {
            const sanitizedTopic = selectedTopic.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            return `${selectedLawArea}_${sanitizedTopic}`;
        }
        return null;
    }, [selectedLawArea, selectedTopic]);

    const resetNavigation = () => {
        setSelectedLawArea(null);
        setSelectedTopic(null);
        setInteractionMode(null);
        setCourtRole(null);
        setIsAnalysisMode(false);
        setIsFullScreen(false);
        setIsWelcomeModalOpen(false);
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
        setIsAnalysisMode(false);
        setIsFullScreen(false);
        setIsWelcomeModalOpen(false);
    };

    return {
        selectedLawArea, setSelectedLawArea,
        selectedTopic, setSelectedTopic,
        interactionMode, setInteractionMode,
        courtRole, setCourtRole,
        topics, setTopics,
        isAnalysisMode, setIsAnalysisMode,
        isFullScreen, setIsFullScreen,
        isWelcomeModalOpen, setIsWelcomeModalOpen,
        currentChatId,
        resetNavigation,
        backToTopic,
        backToLawArea,
        initialTopics
    };
};
