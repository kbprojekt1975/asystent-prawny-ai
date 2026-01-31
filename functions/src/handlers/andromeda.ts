import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { SchemaType } from "@google/generative-ai";
import { db, FieldValue } from "../services/db";
import { getAiClient, calculateCost, getPricingConfig, calculateAppTokens, GEMINI_API_KEY } from "../services/ai";
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
    if (!uid) throw new HttpsError('unauthenticated', 'User not authenticated.');

    // --- SUBSCRIPTION CHECK (from Stripe Extension collection) ---
    const subsRef = db.collection('customers').doc(uid).collection('subscriptions');
    const snapshot = await subsRef.where('status', 'in', ['active', 'trialing']).get();

    if (snapshot.empty) {
        logger.error("!!! SUBSCRIPTION CHECK FAILED in Andromeda: No active or trialing subscription found !!!");
        throw new HttpsError('permission-denied', "Brak aktywnego planu. Wykup dostęp lub poczekaj na aktywację.");
    }
    logger.info("✓ Andromeda subscription check passed");

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

    const systemInstruction = `
    # ROLE: ANDROMEDA - GLOBAL LEGAL COMPASS
    ${existingKnowledgeContext}
    
    Respond in ${language}. Use tools to verify.
    `;

    let contents = (history || []).map((msg: any) => ({
        role: msg.role === 'model' ? 'model' : 'user',
        parts: [{ text: msg.content || "..." }]
    }));

    // CRITICAL: Gemini requires the first message to be from 'user'.
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

    const modelName = 'gemini-2.0-flash';
    const model = genAI.getGenerativeModel({
        model: modelName,
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

    return {
        text: text,
        usage: {
            totalTokenCount: usage?.totalTokenCount || 0,
            cost: cost
        }
    };
});
