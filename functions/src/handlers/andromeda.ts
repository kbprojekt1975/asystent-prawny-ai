import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { SchemaType } from "@google/generative-ai";
import { db, FieldValue, Timestamp } from "../services/db";
import { getAiClient, calculateCost, getPricingConfig, calculateAppTokens, getSystemPrompts, getActiveModels, GEMINI_API_KEY } from "../services/ai";
import { searchLegalActs } from "../services/isapService";
import { searchJudgments } from "../services/saosService";
import {
    CORE_RULES_PL, CORE_RULES_EN, CORE_RULES_ES,
    PILLAR_RULES_PL, PILLAR_RULES_EN, PILLAR_RULES_ES
} from "../prompts";

export const askAndromeda = onCall({
    cors: true,
    secrets: [GEMINI_API_KEY],
    memory: "1GiB",
    timeoutSeconds: 120
}, async (request) => {
    try {
        logger.info("=== askAndromeda (Modular) CALLED ===");
        
        // ... (rest of the initial checks remain the same) ...

        const genAI = getAiClient();
        if (!genAI) throw new HttpsError('failed-precondition', 'AI Client not initialized.');

        const { history, language = 'pl', chatId, isLocalOnly = false } = request.data;
        const uid = request.auth?.uid;
        if (!uid) throw new HttpsError('unauthenticated', 'User not authenticated.');

        // --- SUBSCRIPTION CHECK ---
        const subsRef = db.collection('customers').doc(uid).collection('subscriptions');
        const snapshot = await subsRef
            .where('status', 'in', ['active', 'trialing'])
            .get();

        const validSubs = snapshot.docs.filter(doc => {
            const data = doc.data();
            return data.current_period_end && data.current_period_end.toMillis() > Date.now();
        });

        if (validSubs.length === 0) {
            logger.error("!!! SUBSCRIPTION CHECK FAILED in Andromeda: No active or valid subscription found !!!");
            throw new HttpsError('permission-denied', "Brak aktywnego planu lub dostęp wygasł.");
        }
        logger.info(`✓ Andromeda subscription check passed. LocalOnly=${isLocalOnly}`);

        // --- CHECK LIMIT ---
        const userDoc = await db.collection('users').doc(uid).get();
        const userData = userDoc.data();
        const subscription = userData?.profile?.subscription || {};
        const creditLimit = subscription.creditLimit || 0;
        const spentAmount = subscription.spentAmount || 0;

        if (spentAmount >= creditLimit) {
            logger.warn(`⛔ User ${uid} exceeded limit in Andromeda. Spent: ${spentAmount}/${creditLimit}`);
            throw new HttpsError('resource-exhausted', `Limit środków wyczerpany (${spentAmount.toFixed(2)}/${creditLimit.toFixed(2)} PLN).`);
        }

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

        const dynamicPrompts = await getSystemPrompts(db);
        const dynamicAndromedaPrompt = dynamicPrompts?.instructions?.[language]?.["Andromeda"];

        // 1. CORE RULES
        const coreRulesDefault = (language === 'en' ? CORE_RULES_EN : language === 'es' ? CORE_RULES_ES : CORE_RULES_PL);
        const coreRules = dynamicPrompts?.core?.[language] || coreRulesDefault;

        // 2. PILLAR RULES
        const pillarRulesMapDefault = (language === 'en' ? PILLAR_RULES_EN : language === 'es' ? PILLAR_RULES_ES : PILLAR_RULES_PL);
        const pillarRules = dynamicPrompts?.pillars?.[language]?.['Asystent Prawny'] || pillarRulesMapDefault['Asystent Prawny'] || "";

        const baseInstruction = dynamicAndromedaPrompt || `
        # ROLE: ANDROMEDA - GLOBAL LEGAL COMPASS
        
        # CORE RULES:
        ${coreRules}
        
        # PILLAR RULES (UNIVERSAL):
        ${pillarRules}
        `;
        
        const systemInstruction = `
        REPLY ONLY using the provided structure. DO NOT use web search unless explicitly asked. DO NOT provide action plans. Failure to include the mandatory legal disclaimer at the end will be considered a critical error.

        ${baseInstruction}
        
        # CONTEXT:
        ${existingKnowledgeContext}
        
        Respond in ${language}. Use tools to verify.
        `;

        let contents = (history || []).map((msg: any) => ({
            role: msg.role === 'model' ? 'model' : 'user',
            parts: [{ text: msg.content || "..." }]
        }));

        while (contents.length > 0 && contents[0].role !== 'user') {
            logger.info("Skipping leading non-user message in Andromeda history");
            contents.shift();
        }

        if (contents.length === 0) contents.push({ role: 'user', parts: [{ text: "Dzień dobry." }] });

        const tools = [{
            functionDeclarations: [
                { name: "search_legal_acts", description: "Search acts", parameters: { type: SchemaType.OBJECT, properties: { keyword: { type: SchemaType.STRING } }, required: ["keyword"] } },
                { name: "search_court_rulings", description: "Search rulings", parameters: { type: SchemaType.OBJECT, properties: { query: { type: SchemaType.STRING } }, required: ["query"] } }
            ]
        }];

        const modelsConfig = await getActiveModels(db);
        const modelName = modelsConfig.andromeda || 'gemini-2.1-pro'; // Fallback to 2.1 or 2.5 if missing

        const model = genAI.getGenerativeModel({
            model: modelName,
            systemInstruction,
            tools: tools as any,
            generationConfig: {
                temperature: 0.0
            }
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

        const text = result.response.text();
        const usage = result.response.usageMetadata;

        // --- COST CALCULATION & UPDATE ---
        const pricingConfig = await getPricingConfig(db);
        const cost = usage ? calculateCost(modelName, usage, pricingConfig) : 0;
        const tokensUsed = usage ? calculateAppTokens(usage) : 0;

        if (uid && cost > 0) {
            logger.info(`💰 Andromeda Cost: ${cost} (Tokens: ${usage?.totalTokenCount})`);
            try {
                await db.collection('users').doc(uid).set({
                    totalCost: FieldValue.increment(cost),
                    profile: {
                        subscription: {
                            spentAmount: FieldValue.increment(cost),
                            tokensUsed: FieldValue.increment(tokensUsed)
                        }
                    }
                }, { merge: true });
                logger.info("✅ Andromeda cost & tokens updated.");
            } catch (e) {
                logger.error("❌ Failed to update Andromeda cost", e);
            }
        }

        if (!isLocalOnly && chatId) {
            logger.info("💾 Andromeda: Persisting message to chat history.");
            try {
                const chatRef = db.collection('users').doc(uid).collection('andromeda_chats').doc(chatId);
                await chatRef.set({
                    messages: FieldValue.arrayUnion({ role: 'model', content: text, timestamp: Timestamp.now() }),
                    lastUpdated: Timestamp.now()
                }, { merge: true });
            } catch (e) {
                logger.error("❌ Failed to persist Andromeda message", e);
            }
        } else if (isLocalOnly) {
            logger.info("🛡️ Andromeda: LocalOnly mode active. Content not persisted.");
        }

        return {
            text: text,
            usage: {
                totalTokenCount: usage?.totalTokenCount || 0,
                cost: cost,
                appTokens: tokensUsed
            }
        };

    } catch (error: any) {
        logger.error("CRITICAL ERROR in askAndromeda:", error);
        throw new HttpsError('internal', error.message || "Wystąpił błąd krytyczny asystenta.");
    }
}); 

