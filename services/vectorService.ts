import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

export interface BuildKnowledgeBaseParams {
    chatId: string;
    topic: string;
    lawArea: string;
    judgmentsCount?: number;
}

export interface BuildKnowledgeBaseResult {
    success: boolean;
    chunksCount: number;
}

export const buildTopicKnowledgeBase = async (params: BuildKnowledgeBaseParams): Promise<BuildKnowledgeBaseResult> => {
    const buildFn = httpsCallable<BuildKnowledgeBaseParams, BuildKnowledgeBaseResult>(functions, 'buildTopicKnowledgeBase');
    const response = await buildFn(params);
    return response.data;
};
