import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { SchemaType } from "@google/generative-ai";
import { db, FieldValue } from "../services/db";
import { getAiClient, calculateCost, getPricingConfig, calculateAppTokens, GEMINI_API_KEY } from "../services/ai";

export const suggestNextSteps = onCall({
    cors: true,
    secrets: [GEMINI_API_KEY]
}, async (request) => {
    try {
        logger.info("=== suggestNextSteps CALLED ===");
        const genAI = getAiClient();
        if (!genAI) throw new HttpsError('failed-precondition', 'AI Client not initialized.');
        if (!request.auth) throw new HttpsError('unauthenticated', 'User not authenticated.');

        const {
            conversationHistory,
            lawArea,
            topic,
            language = 'pl'
        } = request.data;
        const uid = request.auth.uid;

        if (!conversationHistory || conversationHistory.length < 6) {
            throw new HttpsError('invalid-argument', "History too short for suggestions (min 6 messages).");
        }

        // --- SUBSCRIPTION CHECK ---
        const subsRef = db.collection('customers').doc(uid).collection('subscriptions');
        const snapshot = await subsRef
            .where('status', 'in', ['active', 'trialing'])
            .get();

        const activeSub = snapshot.docs.find(doc => {
            const data = doc.data();
            return data.current_period_end && data.current_period_end.toMillis() > Date.now();
        });

        if (!activeSub) {
            throw new HttpsError('permission-denied', "Brak aktywnego planu.");
        }

        const userRef = db.collection('users').doc(uid);
        const userDoc = await userRef.get();
        const userData = userDoc.data();
        const subscription = userData?.profile?.subscription || {};
        const creditLimit = subscription.creditLimit || 0;
        const spentAmount = subscription.spentAmount || 0;

        if (spentAmount >= creditLimit) {
            throw new HttpsError('resource-exhausted', "Limit środków wyczerpany.");
        }

        // --- PREPARE PROMPT ---
        const systemPrompt = `
Jesteś zaawansowanym asystentem prawnym analizującym historię rozmowy w celu przedstawienia proaktywnych sugestii dalszych kroków.
Twoim zadaniem jest na podstawie dostarczonego kontekstu:
1. Zidentyfikować rolę użytkownika (powód/oskarżyciel, pozwany/obwiniony lub niejasna).
2. Wygenerować konkretne, oparte na faktach sugestie podzielone na kategorie.

KONTEKST:
- Dziedzina: ${lawArea}
- Temat: ${topic}
- Język odpowiedzi: ${language === 'en' ? 'ENGLISH' : language === 'es' ? 'SPANISH' : 'POLISH'}

WYMOGI DOTYCZĄCE KATEGORII:
- defenseTactics: sugestie obronne (tylko jeśli użytkownik jest pozwanym/obwinionym).
- attackStrategies: sugestie ofensywne (tylko jeśli użytkownik jest powodem/oskarżycielem).
- evidenceToGather: jakie dokumenty, nagrania, świadkowie są potrzebni.
- importantDeadlines: na jakie terminy ustawowe lub procesowe należy zwrócić uwagę.
- mitigatingCircumstances: okoliczności łagodzące (jeśli dotyczy).
- alternativeSolutions: ugody, mediacje, kroki polubowne.

Analizuj CAŁĄ historię rozmowy, aby wyciągnąć jak najwięcej konkretów. Nie pisz ogólników, jeśli w rozmowie padły konkretne fakty.
        `;

        const contents = (conversationHistory as any[]).map((msg: any) => ({
            role: msg.role === 'model' ? 'model' : 'user',
            parts: [{ text: msg.content || "..." }]
        }));

        // Gemini requires first message from user
        while (contents.length > 0 && contents[0].role !== 'user') {
            contents.shift();
        }

        const schema: any = {
            type: SchemaType.OBJECT,
            properties: {
                suggestions: {
                    type: SchemaType.OBJECT,
                    properties: {
                        defenseTactics: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                        attackStrategies: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                        evidenceToGather: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                        importantDeadlines: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                        mitigatingCircumstances: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                        alternativeSolutions: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
                    }
                },
                userRole: { type: SchemaType.STRING, enum: ["plaintiff", "defendant", "unclear"] }
            },
            required: ["suggestions", "userRole"]
        };

        const modelName = 'gemini-1.5-flash';
        const model = genAI.getGenerativeModel({
            model: modelName,
            systemInstruction: systemPrompt,
            generationConfig: {
                temperature: 0.2,
                responseMimeType: "application/json",
                responseSchema: schema
            }
        });

        const result = await model.generateContent({ contents });
        const responseText = result.response.text();
        const output = JSON.parse(responseText);
        const usage = result.response.usageMetadata;

        const pricingConfig = await getPricingConfig(db);
        let cost = 0;
        let tokensUsed = 0;
        if (usage) {
            cost = calculateCost(modelName, usage, pricingConfig);
            tokensUsed = calculateAppTokens(usage);
        }

        if (cost > 0) {
            await userRef.set({
                totalCost: FieldValue.increment(cost),
                profile: {
                    subscription: {
                        spentAmount: FieldValue.increment(cost),
                        tokensUsed: FieldValue.increment(tokensUsed)
                    }
                }
            }, { merge: true });
        }

        return {
            suggestions: output.suggestions,
            userRole: output.userRole,
            usage: {
                ...usage,
                cost,
                appTokens: tokensUsed
            }
        };

    } catch (error: any) {
        logger.error("❌ Error in suggestNextSteps:", error);
        if (error instanceof HttpsError) throw error;
        throw new HttpsError('internal', `Wystąpił błąd: ${error.message}`);
    }
});
