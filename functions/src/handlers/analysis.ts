import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { SchemaType } from "@google/generative-ai";
import { db, Timestamp, FieldValue } from "../services/db";
import { getAiClient, calculateCost, GEMINI_API_KEY } from "../services/ai";
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

    const { description, language = 'pl' } = request.data;
    const uid = request.auth.uid;

    // --- SUBSCRIPTION CHECK ---
    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.data();
    const subscription = userData?.profile?.subscription;

    if (!subscription || subscription.status !== 'active' || !subscription.isPaid) {
        throw new HttpsError('permission-denied', "Brak aktywnego lub opłaconego planu.");
    }

    if (userData?.isActive === false) {
        throw new HttpsError('permission-denied', "Twoje konto oczekuje na aktywację.");
    }

    try {
        const langName = language === 'es' ? 'hiszpańskim' : language === 'en' ? 'angielskim' : 'polskim';
        const prompt = `
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

        const modelName = 'gemini-2.0-flash-exp';
        const model = genAI.getGenerativeModel({
            model: modelName,
            generationConfig: {
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

        let usage = undefined;
        if (resultResponse.response.usageMetadata) {
            usage = {
                promptTokenCount: resultResponse.response.usageMetadata.promptTokenCount || 0,
                candidatesTokenCount: resultResponse.response.usageMetadata.candidatesTokenCount || 0,
                totalTokenCount: resultResponse.response.usageMetadata.totalTokenCount || 0,
                cost: calculateCost(modelName, resultResponse.response.usageMetadata)
            };
        }

        if (!responseText || responseText.trim() === '') {
            return { result: null, usage: usage, chatId: null };
        }

        const result = JSON.parse(responseText.trim());
        const sanitizedTopic = result.topic.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const chatId = `${result.lawArea}_${sanitizedTopic}`;

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

        if (usage) {
            await db.collection('users').doc(uid).set({
                totalCost: FieldValue.increment(usage.cost),
                "profile.subscription.spentAmount": FieldValue.increment(usage.cost)
            }, { merge: true });
        }

        return { result, usage, chatId: chatRef.id };

    } catch (error) {
        logger.error("Analysis API Error", error);
        return { result: null, usage: null, chatId: null };
    }
});
