import { httpsCallable } from "firebase/functions";
import { functions } from './firebase';
import { LawArea, InteractionMode, ChatMessage } from '../types';

// Interfaces for Function Responses
export interface TokenUsage {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
    cost: number;
    appTokens?: number;
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
    articles: string | undefined,
    chatId: string,
    language: string = 'pl',
    isLocalOnly: boolean = false,
    agentInstructions?: string
): Promise<{ text: string, sources?: any[], usage?: TokenUsage }> => {
    try {
        const getLegalAdviceFunction = httpsCallable(functions, 'getLegalAdvice');

        const result = await getLegalAdviceFunction({
            history,
            lawArea,
            interactionMode,
            topic,
            isDeepThinkingEnabled,
            articles,
            chatId,
            language,
            isLocalOnly,
            agentInstructions
        });

        const data = result.data as LegalAdviceResponse;
        return data;

    } catch (error) {
        console.error("Error calling Cloud Function getLegalAdvice:", error);
        return { text: "Przepraszam, wystąpił błąd komunikacji. Upewnij się, że ID czatu jest dostępne." };
    }
};

export const analyzeLegalCase = async (description: string, language: string = 'pl', isLocalOnly: boolean = false): Promise<{ result: { lawArea: LawArea, topic: string, interactionMode: InteractionMode } | null, usage?: TokenUsage, chatId: string | null }> => {
    try {
        const analyzeLegalCaseFunction = httpsCallable(functions, 'analyzeLegalCase');

        const result = await analyzeLegalCaseFunction({
            description,
            language,
            isLocalOnly
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
        ];
    }
};

export const askAndromeda = async (history: ChatMessage[], language: string = 'pl', chatId: string | null = null, isLocalOnly: boolean = false): Promise<{ text: string, usage?: TokenUsage }> => {
    try {
        const askAndromedaFunction = httpsCallable(functions, 'askAndromeda');
        const result = await askAndromedaFunction({ history, language, chatId, isLocalOnly });
        return result.data as { text: string, usage?: TokenUsage };
    } catch (error) {
        console.error("Error calling Cloud Function askAndromeda:", error);
        return { text: "Przepraszam, wystąpił błąd podczas łączenia z systemem Andromeda." };
    }
};
