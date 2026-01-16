import { httpsCallable } from "firebase/functions";
import { functions } from './firebase';
import { LawArea, InteractionMode, ChatMessage } from '../types';

// Interfaces for Function Responses
export interface TokenUsage {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
    cost: number;
}

interface LegalAdviceResponse {
    text: string;
    sources?: any[];
    usage?: TokenUsage;
}

interface AnalysisResponse {
    result: { lawArea: LawArea, topic: string, interactionMode: InteractionMode } | null;
    usage?: TokenUsage;
    chatId: string | null;
}

export const getLegalAdvice = async (
    history: ChatMessage[],
    lawArea: LawArea,
    interactionMode: InteractionMode,
    topic: string,
    isDeepThinkingEnabled: boolean,
    articles: string | undefined, // Zmieniono na undefined, aby było zgodne z back-endem
    chatId: string, // <<< ZMIANA >>>: Dodano wymagane ID czatu
    language: string = 'pl' // Added language parameter with default 'pl'
): Promise<{ text: string, sources?: any[], usage?: TokenUsage }> => {
    try {
        const getLegalAdviceFunction = httpsCallable(functions, 'getLegalAdvice');

        // We send the plain data to the backend
        const result = await getLegalAdviceFunction({
            history,
            lawArea,
            interactionMode,
            topic,
            isDeepThinkingEnabled,
            articles,
            chatId, // <<< ZMIANA >>>: Dodano do ładunku wysyłanego do back-endu
            language // Pass language to backend
        });

        const data = result.data as LegalAdviceResponse;
        return data;

    } catch (error) {
        console.error("Error calling Cloud Function getLegalAdvice:", error);
        // Warto poprawić komunikat błędu, aby odzwierciedlał, że może to być problem z danymi wejściowymi
        return { text: "Przepraszam, wystąpił błąd komunikacji. Upewnij się, że ID czatu jest dostępne." };
    }
};

export const analyzeLegalCase = async (description: string): Promise<{ result: { lawArea: LawArea, topic: string, interactionMode: InteractionMode } | null, usage?: TokenUsage, chatId: string | null }> => {
    try {
        const analyzeLegalCaseFunction = httpsCallable(functions, 'analyzeLegalCase');

        const result = await analyzeLegalCaseFunction({
            description
        });

        const data = result.data as AnalysisResponse;
        return data;

    } catch (error) {
        console.error("Error calling Cloud Function analyzeLegalCase:", error);
        return { result: null, chatId: null };
    }
};

export const getLegalFAQ = async (lawArea: LawArea, language: string = 'pl'): Promise<string[]> => {
    try {
        const getLegalFAQFunction = httpsCallable(functions, 'getLegalFAQ');
        const result = await getLegalFAQFunction({ lawArea, language });
        const data = result.data as { questions: string[] };
        return data.questions || [];
    } catch (error) {
        console.error("Error calling Cloud Function getLegalFAQ:", error);
        return [
            "Jakie są moje pierwsze kroki w tej sprawie?",
            "Jakie dokumenty powinienem przygotować?",
            "Jakie koszty mogą się z tym wiązać?",
            "Ile czasu zazwyczaj trwa taka sprawa?"
        ]; // Fallback questions
    }
};