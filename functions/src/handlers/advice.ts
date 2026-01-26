import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { SchemaType } from "@google/generative-ai";
import { db, Timestamp, FieldValue, storage } from "../services/db";
import { getAiClient, calculateCost, GEMINI_API_KEY } from "../services/ai";
import { LawAreaType } from "../types";
import {
    CORE_RULES_PL, CORE_RULES_EN, CORE_RULES_ES,
    PILLAR_RULES_PL, PILLAR_RULES_EN, PILLAR_RULES_ES,
    systemInstructions, systemInstructionsEn, systemInstructionsEs
} from "../prompts";
import { searchLegalActs, getActContent } from "../services/isapService";
import { searchJudgments, getJudgmentText } from "../services/saosService";

export const getLegalAdvice = onCall({
    cors: true,
    secrets: [GEMINI_API_KEY]
}, async (request) => {
    logger.info("=== getLegalAdvice (Modular) CALLED ===");
    const genAI = getAiClient();
    if (!genAI) throw new HttpsError('failed-precondition', 'AI Client not initialized.');
    if (!request.auth) throw new HttpsError('unauthenticated', 'User not authenticated.');

    const { history, lawArea, interactionMode, topic, articles, chatId, language = 'pl' } = request.data;
    const uid = request.auth.uid;

    if (!chatId || !history) throw new HttpsError('invalid-argument', "Missing chatId or history.");

    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();
    const userData = userDoc.data();
    const subscription = userData?.profile?.subscription;

    if (!subscription || subscription.status !== 'active' || !subscription.isPaid) {
        throw new HttpsError('permission-denied', "Brak aktywnego planu.");
    }

    // --- FETCH KNOWLEDGE ---
    let existingKnowledgeContext = "BRAK";
    try {
        const knowledgeSnap = await userRef.collection('chats').doc(chatId).collection('legal_knowledge').get();
        if (!knowledgeSnap.empty) {
            existingKnowledgeContext = knowledgeSnap.docs.map(doc => {
                const data = doc.data();
                if (data.source === 'SAOS') return `WYROK SĄDOWY: ${data.caseNumber}\nTREŚĆ: ${data.content?.substring(0, 1500)}`;
                return `AKT PRAWNY: ${data.title} (${data.publisher} ${data.year}/${data.pos})\nTREŚĆ: ${data.content?.substring(0, 1000)}`;
            }).join('\n---\n');
        }
    } catch (e) { logger.error("Knowledge fetch error", e); }

    // --- PREPARE PROMPT ---
    const lawAreaClean = (lawArea || "").trim();
    const areaKey = Object.keys(systemInstructions).find(k => k.toLowerCase() === lawAreaClean.toLowerCase()) as LawAreaType;
    const coreRules = (language === 'en' ? CORE_RULES_EN : language === 'es' ? CORE_RULES_ES : CORE_RULES_PL);
    const pillarRulesMap = (language === 'en' ? PILLAR_RULES_EN : language === 'es' ? PILLAR_RULES_ES : PILLAR_RULES_PL);
    const pillarRules = pillarRulesMap[lawAreaClean] || pillarRulesMap[areaKey] || "";

    const instrMap = (language === 'en' ? systemInstructionsEn : language === 'es' ? systemInstructionsEs : systemInstructions);
    const modeInstructions = instrMap[areaKey]?.[interactionMode] || "";

    const instruction = `
        # ROLE: LEGAL EXPERT (${lawArea || areaKey})
        # TOPIC: ${topic || 'General Query'}
        
        # CORE RULES:
        ${coreRules}
        
        # PILLAR RULES:
        ${pillarRules}
        
        # MODE SPECIFIC:
        ${modeInstructions}
        
        # EXISTING KNOWLEDGE:
        ${existingKnowledgeContext}
        
        # ADDITIONAL CONTEXT (Articles):
        ${articles || "None provided"}
        
        # RESPONSE LANGUAGE: ${language === 'en' ? 'ENGLISH' : language === 'es' ? 'SPANISH' : 'POLISH'}.
    `;

    // --- PREPARE CONTENT ---
    const contents = (history as any[]).map((msg: any) => ({
        role: msg.role === 'model' ? 'model' : 'user',
        parts: [{ text: msg.content || "..." }]
    }));

    const docsSnap = await userRef.collection('chats').doc(chatId).collection('documents').get();
    if (!docsSnap.empty) {
        const docParts = await Promise.all(docsSnap.docs.map(async d => {
            const data = d.data();
            const [buffer] = await storage.bucket().file(data.path).download();
            return { inlineData: { data: buffer.toString('base64'), mimeType: data.type } };
        }));

        // Replace findLast with a traditional loop for better compatibility (ES2020 target)
        let lastUser: any = null;
        for (let i = contents.length - 1; i >= 0; i--) {
            if (contents[i].role === 'user') {
                lastUser = contents[i];
                break;
            }
        }

        if (lastUser) {
            lastUser.parts.unshift(...docParts);
            lastUser.parts[lastUser.parts.length - 1].text = `[ZAŁĄCZONE DOKUMENTY]\n${lastUser.parts[lastUser.parts.length - 1].text}`;
        }
    }

    const tools = [{
        functionDeclarations: [
            { name: "search_legal_acts", description: "Search acts", parameters: { type: SchemaType.OBJECT, properties: { keyword: { type: SchemaType.STRING }, year: { type: SchemaType.NUMBER }, inForce: { type: SchemaType.BOOLEAN } }, required: ["keyword"] } },
            { name: "get_act_content", description: "Read act", parameters: { type: SchemaType.OBJECT, properties: { publisher: { type: SchemaType.STRING }, year: { type: SchemaType.NUMBER }, pos: { type: SchemaType.NUMBER } }, required: ["publisher", "year", "pos"] } },
            { name: "search_court_rulings", description: "Search rulings", parameters: { type: SchemaType.OBJECT, properties: { query: { type: SchemaType.STRING }, courtType: { type: SchemaType.STRING } }, required: ["query"] } },
            { name: "get_judgment_text", description: "Read judgment text", parameters: { type: SchemaType.OBJECT, properties: { judgmentId: { type: SchemaType.NUMBER } }, required: ["judgmentId"] } }
        ]
    }];

    const modelName = 'gemini-2.0-flash-exp';
    const model = genAI.getGenerativeModel({ model: modelName, systemInstruction: instruction, tools: tools as any }, { apiVersion: 'v1beta' });
    const chat = model.startChat({ history: contents.slice(0, -1) });
    let result = await chat.sendMessage(contents[contents.length - 1].parts);

    let loop = 0;
    while (result.response.candidates?.[0]?.content?.parts?.some(p => p.functionCall) && loop < 5) {
        loop++;
        const calls = result.response.candidates[0].content.parts.filter(p => p.functionCall);
        const responses = await Promise.all(calls.map(async (c: any) => {
            const { name, args } = c.functionCall;
            let res;
            if (name === "search_legal_acts") res = await searchLegalActs(args);
            else if (name === "get_act_content") res = await getActContent(args.publisher, args.year, args.pos);
            else if (name === "search_court_rulings") res = await searchJudgments({ all: args.query, courtType: args.courtType });
            else if (name === "get_judgment_text") res = await getJudgmentText(args.judgmentId);
            return { functionResponse: { name, response: { result: res } } };
        }));
        result = await chat.sendMessage(responses);
    }

    const text = result.response.text();
    const usage = result.response.usageMetadata;
    const cost = usage ? calculateCost(modelName, usage) : 0;

    const chatRef = userRef.collection('chats').doc(chatId);
    await chatRef.set({
        messages: FieldValue.arrayUnion({ role: 'model', content: text, timestamp: Timestamp.now() }),
        lastUpdated: Timestamp.now()
    }, { merge: true });

    if (cost > 0) await userRef.set({ totalCost: FieldValue.increment(cost) }, { merge: true });

    return { text, usage };
});
