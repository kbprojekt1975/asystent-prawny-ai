import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { SchemaType } from "@google/generative-ai";
import { db } from "../services/db";
import { getAiClient, GEMINI_API_KEY } from "../services/ai";
import { searchLegalActs } from "../services/isapService";
import { searchJudgments } from "../services/saosService";

export const askAndromeda = onCall({
    cors: true,
    secrets: [GEMINI_API_KEY]
}, async (request) => {
    logger.info("=== askAndromeda (Modular) CALLED ===");

    const genAI = getAiClient();
    if (!genAI) throw new HttpsError('failed-precondition', 'AI Client not initialized.');

    const { history, language = 'pl', chatId } = request.data;
    const uid = request.auth?.uid;

    let existingKnowledgeContext = "";
    if (chatId && uid) {
        try {
            const knowledgeSnap = await db.collection(`users/${uid}/andromeda_chats/${chatId}/knowledge`).get();
            if (!knowledgeSnap.empty) {
                const list = knowledgeSnap.docs.map(doc => `- ${doc.data().content}`).join('\n');
                existingKnowledgeContext = `\nZGROMADZONA WIEDZA O SPRAWIE:\n${list}\n`;
            }
        } catch (e) {
            logger.error("Error fetching knowledge", e);
        }
    }

    const systemInstruction = `
    # ROLE: ANDROMEDA - GLOBAL LEGAL COMPASS
    ${existingKnowledgeContext}
    
    Respond in ${language}. Use tools to verify.
    `;

    const contents = (history || []).map((msg: any) => ({
        role: msg.role === 'model' ? 'model' : 'user',
        parts: [{ text: msg.content || "..." }]
    }));

    if (contents.length === 0) contents.push({ role: 'user', parts: [{ text: "Dzień dobry." }] });

    const tools = [{
        functionDeclarations: [
            { name: "search_legal_acts", description: "Search acts", parameters: { type: SchemaType.OBJECT, properties: { keyword: { type: SchemaType.STRING } }, required: ["keyword"] } },
            { name: "search_court_rulings", description: "Search rulings", parameters: { type: SchemaType.OBJECT, properties: { query: { type: SchemaType.STRING } }, required: ["query"] } }
        ]
    }];

    const model = genAI.getGenerativeModel({
        model: 'gemini-2.0-flash-exp',
        systemInstruction,
        tools: tools as any
    }, { apiVersion: 'v1beta' });

    const chatManager = model.startChat({ history: contents.slice(0, -1) });
    let result = await chatManager.sendMessage(contents[contents.length - 1].parts);

    let loop = 0;
    while (result.response.candidates?.[0]?.content?.parts?.some(p => p.functionCall) && loop < 5) {
        loop++;
        const calls = result.response.candidates[0].content.parts.filter(p => p.functionCall);
        const responses = await Promise.all(calls.map(async (c: any) => {
            const { name, args } = c.functionCall;
            let toolRes;
            if (name === "search_legal_acts") toolRes = await searchLegalActs(args);
            else if (name === "search_court_rulings") toolRes = await searchJudgments({ all: args.query });
            return { functionResponse: { name, response: { result: toolRes } } };
        }));
        result = await chatManager.sendMessage(responses);
    }

    return {
        text: result.response.text(),
        usage: { totalTokenCount: result.response.usageMetadata?.totalTokenCount || 0 }
    };
});
