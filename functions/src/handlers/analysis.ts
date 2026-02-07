import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { SchemaType } from "@google/generative-ai";
import { db, Timestamp, FieldValue } from "../services/db";
import { getAiClient, calculateCost, getPricingConfig, calculateAppTokens, getSystemPrompts, getActiveModels, GEMINI_API_KEY } from "../services/ai";
import { LawArea, InteractionMode } from "../types";

export const analyzeLegalCase = onCall({
    cors: true,
    secrets: [GEMINI_API_KEY]
}, async (request) => {
    const genAI = getAiClient();
    if (!genAI) {
        throw new HttpsError('failed-precondition', 'Klient Gemini AI nie został zainicjowany z powodu braku klucza.');
    }
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'Użytkownik musi być zalogowany.');
    }

    const { description, language = 'pl', isLocalOnly = false } = request.data;
    const uid = request.auth.uid;

    // --- SUBSCRIPTION CHECK (from Stripe Extension collection) ---
    const subsRef = db.collection('customers').doc(uid).collection('subscriptions');
    const snapshot = await subsRef
        .where('status', 'in', ['active', 'trialing'])
        .where('current_period_end', '>', Timestamp.now())
        .get();

    if (snapshot.empty) {
        throw new HttpsError('permission-denied', "Brak aktywnego planu lub Twój dostęp wygasł.");
    }

    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.data();

    // isActive is now an optional master-switch; Stripe subscription is primary access key.
    if (userData?.isActive === false) {
        logger.warn(`User ${uid} has isActive=false, but checking for active Stripe subscription...`);
        throw new HttpsError('permission-denied', "Twoje konto zostało zawieszone. Skontaktuj się z administratorem.");
    }

    const subscription = userData?.profile?.subscription || {};
    const creditLimit = subscription.creditLimit || 0;
    const spentAmount = subscription.spentAmount || 0;

    if (spentAmount >= creditLimit) {
        logger.warn(`⛔ User ${uid} exceeded limit in Analysis. Spent: ${spentAmount}/${creditLimit}`);
        throw new HttpsError('resource-exhausted', `Limit środków został wyczerpany (${spentAmount.toFixed(2)}/${creditLimit.toFixed(2)} PLN). Doładuj konto.`);
    }

    try {
        const dynamicPrompts = await getSystemPrompts(db);
        const langName = language === 'es' ? 'hiszpańskim' : language === 'en' ? 'angielskim' : 'polskim';

        // Check for dynamic override (naming convention: analysis_pl, analysis_en, etc.)
        const dynamicAnalysisPrompt = dynamicPrompts?.instructions?.[language]?.["Analysis"];

        const prompt = dynamicAnalysisPrompt || `
            # ZADANIE: ANALIZA I KLASYFIKACJA SPRAWY
            Jesteś rygorystycznym systemem klasyfikacji prawnej. Twoim zadaniem jest precyzyjna analiza opisu sprawy użytkownika.

            # WYTYCZNE:
            1. Zaklasyfikuj sprawę do jednej z kategorii: "Prawo Karne", "Prawo Rodzinne", "Prawo Cywilne", "Prawo Gospodarcze".
            2. Stwórz precyzyjny temat sprawy (maksymalnie 4-6 słów) w tonie formalnym. Odpowiedz w języku: ${langName}.
            3. Dobierz optymalny tryb interakcji: "Porada Prawna", "Generowanie Pisma", "Szkolenie Prawne", "Zasugeruj Przepisy", "Znajdź Podobne Wyroki".

            # REGUŁY KRYTYCZNE:
            - Jeśli opis jest niejasny, wybierz najbardziej prawdopodobną kategorię i tryb "Porada Prawna".
            - Nie dodawaj żadnego komentarza poza strukturą JSON.

            Opis sprawy: "${description}"
        `;

        const modelsConfig = await getActiveModels(db);
        const modelName = modelsConfig.analysis || 'gemini-2.0-flash';

        const model = genAI.getGenerativeModel({
            model: modelName,
            generationConfig: {
                temperature: 0,
                responseMimeType: "application/json",
                responseSchema: {
                    type: SchemaType.OBJECT,
                    properties: {
                        lawArea: { type: SchemaType.STRING, enum: Object.values(LawArea), format: "enum" },
                        topic: { type: SchemaType.STRING },
                        interactionMode: { type: SchemaType.STRING, enum: Object.values(InteractionMode), format: "enum" }
                    },
                    required: ["lawArea", "topic", "interactionMode"]
                }
            }
        }, { apiVersion: 'v1beta' });

        const resultResponse = await model.generateContent(prompt);
        const responseText = resultResponse.response.text();

        const pricingConfig = await getPricingConfig(db);

        let usage = undefined;
        if (resultResponse.response.usageMetadata) {
            usage = {
                promptTokenCount: resultResponse.response.usageMetadata.promptTokenCount || 0,
                candidatesTokenCount: resultResponse.response.usageMetadata.candidatesTokenCount || 0,
                totalTokenCount: resultResponse.response.usageMetadata.totalTokenCount || 0,
                cost: calculateCost(modelName, resultResponse.response.usageMetadata, pricingConfig),
                appTokens: calculateAppTokens(resultResponse.response.usageMetadata)
            };
        }

        if (!responseText || responseText.trim() === '') {
            return { result: null, usage: usage, chatId: null };
        }

        const result = JSON.parse(responseText.trim());
        const sanitizedTopic = result.topic.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const chatId = `${result.lawArea}_${sanitizedTopic}`;

        if (!isLocalOnly) {
            const chatRef = db.collection('users').doc(uid).collection('chats').doc(chatId);
            await chatRef.set({
                lawArea: result.lawArea,
                interactionMode: result.interactionMode,
                topic: result.topic,
                messages: [{
                    role: 'user',
                    content: description,
                    timestamp: Timestamp.now(),
                    costTokens: usage?.totalTokenCount || 0
                }],
                lastUpdated: Timestamp.now(),
            }, { merge: true });
        } else {
            logger.info("🛡️ Analysis: LocalOnly mode active. Chat content not persisted.");
        }

        if (usage) {
            await db.collection('users').doc(uid).set({
                totalCost: FieldValue.increment(usage.cost),
                profile: {
                    subscription: {
                        spentAmount: FieldValue.increment(usage.cost),
                        tokensUsed: FieldValue.increment(usage.appTokens)
                    }
                }
            }, { merge: true });
            logger.info(`💰 Analysis Cost Updated: ${usage.cost}`);
        }

        return { result, usage, chatId: chatId };

    } catch (error) {
        logger.error("Analysis API Error", error);
        return { result: null, usage: null, chatId: null };
    }
});
