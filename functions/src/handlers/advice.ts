import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { SchemaType } from "@google/generative-ai";
import { db, Timestamp, FieldValue, storage } from "../services/db";
import { getAiClient, calculateCost, getPricingConfig, calculateAppTokens, getSystemPrompts, getActiveModels, GEMINI_API_KEY } from "../services/ai";
import { LawAreaType, LawArea, InteractionMode } from "../types";
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
    try {
        logger.info("=== getLegalAdvice (Modular) CALLED ===");
        const genAI = getAiClient();
        if (!genAI) throw new HttpsError('failed-precondition', 'AI Client not initialized.');
        if (!request.auth) throw new HttpsError('unauthenticated', 'User not authenticated.');

        const {
            history,
            lawArea,
            interactionMode,
            topic,
            articles,
            chatId,
            language = 'pl',
            isLocalOnly = false,
            agentId,
            agentInstructions
        } = request.data;
        const uid = request.auth.uid;

        logger.info(`Request parameters: LawArea="${lawArea}", InteractionMode="${interactionMode}", Topic="${topic}", LocalOnly=${isLocalOnly}, AgentId=${agentId}`);

        if (!chatId || !history) throw new HttpsError('invalid-argument', "Missing chatId or history.");

        const userRef = db.collection('users').doc(uid);

        // --- FETCH CUSTOM AGENT (if applicable) ---
        // --- FETCH CUSTOM AGENT (if applicable) ---
        let customAgentInstructions = "";
        let isStandalone = false;

        if (agentInstructions) {
            customAgentInstructions = `
                # CUSTOM PERSONA (User Defined):
                ${agentInstructions}
            `;
            logger.info("✅ Custom agent instructions provided in request.");
        } else if (lawArea === "Własny Agent" || lawArea === "Custom" || agentId) {
            const targetAgentId = agentId || topic;
            try {
                const agentDoc = await userRef.collection('custom_agents').doc(targetAgentId).get();
                if (agentDoc.exists) {
                    const agentData = agentDoc.data();
                    isStandalone = agentData?.agentType === 'standalone'; // Check type

                    customAgentInstructions = `
                        # CUSTOM PERSONA: ${agentData?.name || 'Custom Agent'}
                        # IDENTITY/ROLE: ${agentData?.persona || 'Specialized Assistant'}
                        # SPECIFIC INSTRUCTIONS:
                        ${agentData?.instructions || 'Follow user preferences.'}
                    `;
                    logger.info(`✅ Custom agent "${agentData?.name}" (Type: ${agentData?.agentType || 'overlay'}) loaded.`);
                }
            } catch (e) {
                logger.error("Error fetching custom agent", e);
            }
        }

        // --- SUBSCRIPTION CHECK (Simplified to avoid composite index) ---
        const subsRef = db.collection('customers').doc(uid).collection('subscriptions');
        const snapshot = await subsRef
            .where('status', 'in', ['active', 'trialing'])
            .get();

        // Manual filter for expiry to avoid composite index requirement
        const activeSub = snapshot.docs.find(doc => {
            const data = doc.data();
            return data.current_period_end && data.current_period_end.toMillis() > Date.now();
        });

        if (!activeSub) {
            logger.error("!!! SUBSCRIPTION CHECK FAILED: No active/valid subscription found !!!");
            throw new HttpsError('permission-denied', "Brak aktywnego planu lub Twój dostęp wygasł. Odnów subskrypcję.");
        }

        logger.info("✓ Subscription check passed (Stripe collection)");

        // --- CHECK CREDIT LIMIT ---
        const userDoc = await userRef.get();
        const userData = userDoc.data();
        const subscription = userData?.profile?.subscription || {};
        const creditLimit = subscription.creditLimit || 0;
        const spentAmount = subscription.spentAmount || 0;

        if (spentAmount >= creditLimit) {
            logger.warn(`⛔ User ${uid} exceeded limit. Spent: ${spentAmount}/${creditLimit}`);
            throw new HttpsError('resource-exhausted', `Limit środków wyczerpany (${spentAmount.toFixed(2)}/${creditLimit.toFixed(2)} PLN).`);
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

        // --- PREPARE PROMPT (with dynamic overrides) ---
        const dynamicPrompts = await getSystemPrompts(db);
        const languageClean = (language || "pl").toLowerCase();
        const lawAreaClean = (lawArea || "").trim();
        const areaKey = (Object.keys(systemInstructions).find(k => k.toLowerCase() === lawAreaClean.toLowerCase()) || LawArea.Universal) as LawAreaType;

        // 1. CORE RULES
        const coreRulesDefault = (languageClean === 'en' ? CORE_RULES_EN : languageClean === 'es' ? CORE_RULES_ES : CORE_RULES_PL);
        const coreRules = dynamicPrompts?.core?.[languageClean] || coreRulesDefault;

        // 2. PILLAR RULES
        const pillarRulesMapDefault = (languageClean === 'en' ? PILLAR_RULES_EN : languageClean === 'es' ? PILLAR_RULES_ES : PILLAR_RULES_PL);
        const pillarRules = dynamicPrompts?.pillars?.[languageClean]?.[lawAreaClean] ||
            dynamicPrompts?.pillars?.[languageClean]?.[areaKey] ||
            pillarRulesMapDefault[lawAreaClean] ||
            pillarRulesMapDefault[areaKey] || "";

        // 3. MODE SPECIFIC INSTRUCTIONS
        const instrMapDefault = (languageClean === 'en' ? systemInstructionsEn : languageClean === 'es' ? systemInstructionsEs : systemInstructions);
        const modeInstructions = dynamicPrompts?.instructions?.[languageClean]?.[interactionMode] ||
            instrMapDefault[areaKey]?.[interactionMode] || "";

        let instruction = "";

        // ROBUST APP HELP DETECTION
        const isAppHelpMode =
            interactionMode === InteractionMode.AppHelp ||
            interactionMode === 'Pomoc w obsłudze aplikacji' ||
            interactionMode === 'AppHelp' ||
            topic === 'Asystent Aplikacji' ||
            chatId === 'help-sidebar';

        if (isAppHelpMode) {
            // DEDICATED APP HELP PERSONA (Nuclear Fix)
            // We EXPLICITLY strip all legal rules and define a technical persona.
            instruction = `
                # ROLE: SOFTWARE GUIDE & PRODUCT EXPERT
                You are the official Technical Assistant for the "Asystent Prawny AI" platform.
                
                # YOUR IDENTITY:
                - You are NOT a lawyer.
                - You are NOT a legal consultant.
                - You are a TECHNICAL GUIDE for the software.
                
                # YOUR KNOWLEDGE (Application Features):
                1. ANDROMEDA: Elite strategic analysis mode (Expert-Analyst). Focuses on litigation strategy, 24h action plans, and "chess-like" thinking. 
                   *Note: If the user types "adnromeda" or other typos, they mean ANDROMEDA.*
                2. MOJE STUDIO AI: The PRO workspace for creating custom Agents (overlays) and standalone Assistants.
                3. DEEP THINKING: A mode for complex, multi-step logical reasoning in law.
                4. CASE TOOLS: Case files repository, timeline, checklists, and document export.
                
                # YOUR MISSION:
                Exclusively explain the software features. If asked about law, politely remind the user you are here to help with the app, but they can use the "Porada Prawna" mode for legal questions.
                
                # RESPONSE STYLE: Technical, helpful, precise.
                # LANGUAGE: ${languageClean === 'en' ? 'ENGLISH' : languageClean === 'es' ? 'SPANISH' : 'POLISH'}.
            `;
            logger.info("🚀 FORCING DEDICATED APP HELP PERSONA (Topic/Mode Match)");
        } else if (isStandalone) {
            // STANDALONE AGENT PROMPT
            instruction = `
                ${customAgentInstructions}

                # TOPIC/CONTEXT: ${topic || 'User Query'}
                
                # CORE SAFETY RULES:
                ${coreRules}
                
                # EXISTING KNOWLEDGE (If relevant):
                ${existingKnowledgeContext}
                
                # ADDITIONAL CONTEXT (Articles):
                ${articles || "None provided"}
                
                # RESPONSE LANGUAGE: ${languageClean === 'en' ? 'ENGLISH' : languageClean === 'es' ? 'SPANISH' : 'POLISH'}.
            `;
            logger.info("🤖 Using STANDALONE Agent Prompt Structure");
        } else {
            // STANDARD / OVERLAY PROMPT
            instruction = `
                ${customAgentInstructions}

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
                
                # RESPONSE LANGUAGE: ${languageClean === 'en' ? 'ENGLISH' : languageClean === 'es' ? 'SPANISH' : 'POLISH'}.
            `;
        }

        // --- PREPARE CONTENT ---
        let contents = (history as any[]).map((msg: any) => ({
            role: msg.role === 'model' ? 'model' : 'user',
            parts: [{ text: msg.content || "..." }]
        }));

        // CRITICAL: Gemini requires the first message to be from 'user'.
        // Instead of shifting, we prepend a virtual user message if it's a model-first chat (like Help Sidebar).
        if (contents.length > 0 && contents[0].role !== 'user') {
            logger.info("Satisfying user-first requirement by prepending virtual user message");
            contents.unshift({
                role: 'user',
                parts: [{ text: "Dzień dobry, potrzebuję informacji o aplikacji." }]
            });
        }

        if (contents.length === 0) {
            throw new HttpsError('invalid-argument', "Chat history must contain at least one user message.");
        }

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

        const modelsConfig = await getActiveModels(db);
        const modelName = modelsConfig.advice || 'gemini-2.0-flash';
        
        const model = genAI.getGenerativeModel({
            model: modelName,
            systemInstruction: instruction,
            tools: tools as any,
            generationConfig: {
                temperature: 0
            }
        }, { apiVersion: 'v1beta' });
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

        // Fetch dynamic pricing config
        const pricingConfig = await getPricingConfig(db);
        logger.info(`🔍 Pricing Config loaded. Multiplier: ${pricingConfig.profit_margin_multiplier}`);

        let cost = 0;
        let tokensUsed = 0;
        if (usage) {
            cost = calculateCost(modelName, usage, pricingConfig);
            tokensUsed = calculateAppTokens(usage);
            logger.info(`📊 Usage metadata found. Tokens: ${usage.totalTokenCount}. Calculated Cost: ${cost}. AppTokens: ${tokensUsed}`);
        } else {
            logger.warn("⚠️ No usage metadata returned from Gemini.");
        }

        // PERSISTENCE BLOCK
        if (!isLocalOnly) {
            const chatRef = userRef.collection('chats').doc(chatId);
            await chatRef.set({
                messages: FieldValue.arrayUnion({ role: 'model', content: text, timestamp: Timestamp.now() }),
                lastUpdated: Timestamp.now()
            }, { merge: true });
        } else {
            logger.info("🛡️ LocalOnly mode active. Skipping chat history persistence.");
        }

        if (cost > 0) {
            logger.info(`💰 Updating user cost in Firestore: +${cost}, +${tokensUsed} tokens`);
            try {
                await userRef.set({
                    totalCost: FieldValue.increment(cost),
                    profile: {
                        subscription: {
                            spentAmount: FieldValue.increment(cost),
                            tokensUsed: FieldValue.increment(tokensUsed)
                        }
                    }
                }, { merge: true });
            } catch (e) {
                logger.error("❌ Failed to update user cost", e);
            }
        }

        return {
            text,
            usage: {
                ...usage,
                cost,
                appTokens: tokensUsed
            }
        };
    } catch (error: any) {
        logger.error("❌ CRITICAL ERROR in getLegalAdvice:", error);
        if (error instanceof HttpsError) throw error;
        throw new HttpsError('internal', `Wystąpił nieoczekiwany błąd backendu: ${error.message || 'Nieznany błąd'}`);
    }
});
