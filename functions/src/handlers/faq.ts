import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { SchemaType } from "@google/generative-ai";
import { getAiClient, GEMINI_API_KEY } from "../services/ai";
import { LawArea } from "../types";

export const getLegalFAQ = onCall({
    cors: true,
    secrets: [GEMINI_API_KEY]
}, async (request) => {
    const genAI = getAiClient();
    if (!genAI) {
        throw new HttpsError('failed-precondition', 'Klient Gemini AI nie został zainicjowany.');
    }
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'Użytkownik musi być zalogowany.');
    }

    const { lawArea, language = 'pl' } = request.data;
    if (!lawArea) {
        throw new HttpsError('invalid-argument', 'Brak dziedziny prawa.');
    }

    try {
        const areaMap: any = {
            [LawArea.Criminal]: { pl: 'Prawo Karne', en: 'Criminal Law', es: 'Derecho Penal' },
            [LawArea.Family]: { pl: 'Prawo Rodzinne', en: 'Family Law', es: 'Derecho de Familia' },
            [LawArea.Civil]: { pl: 'Prawo Cywilne', en: 'Civil Law', es: 'Derecho Civil' },
            [LawArea.Commercial]: { pl: 'Prawo Gospodarcze', en: 'Commercial Law', es: 'Derecho Mercantil' },
            [LawArea.Labor]: { pl: 'Prawo Pracy', en: 'Labor Law', es: 'Derecho Laboral' },
            [LawArea.RealEstate]: { pl: 'Prawo Nieruchomości', en: 'Real Estate Law', es: 'Derecho Inmobiliario' },
            [LawArea.Tax]: { pl: 'Prawo Podatkowe', en: 'Tax Law', es: 'Derecho Fiscal' },
            [LawArea.Administrative]: { pl: 'Prawo Administracyjne', en: 'Administrative Law', es: 'Derecho Administrativo' }
        };
        const translatedArea = areaMap[lawArea]?.[language] || lawArea;

        let prompt;
        if (language === 'en') {
            prompt = `You are a legal expert. Generate 4 most common, specific and practical questions (FAQ) that citizens ask in the field: ${translatedArea}. 
               The answer must be a simple JSON in the format: ["Question 1?", "Question 2?", "Question 3?", "Question 4?"]. 
               Questions should be short, intriguing and encouraging to ask the AI. Answer in English.`;
        } else if (language === 'es') {
            prompt = `Eres un experto legal español. Tu tarea es generar 4 preguntas frecuentes (FAQ) en ESPAÑOL sobre: ${translatedArea}.
            
            FORMATO REQUERIDO: JSON array con 4 preguntas en español.
            EJEMPLO: ["¿Cómo recuperar deuda de un contrato incumplido?", "¿Qué hacer si mi vecino viola mi propiedad?"]
            
            REGLAS ABSOLUTAS:
            1. TODAS las preguntas DEBEN estar en ESPAÑOL
            2. Las preguntas deben ser prácticas i específicas
            3. Deben ser cortas (máximo 15 palabras)
            4. Deben empezar con signos de interrogación españoles (¿?)
            
            Genera ahora 4 preguntas en ESPAÑOL para: ${translatedArea}`;
        } else {
            prompt = `Jesteś ekspertem prawnym. Wygeneruj 4 najczęstsze, konkretne i praktyczne pytania (FAQ), które obywatele zadają w dziedzinie: ${translatedArea}. 
               Odpowiedź musi być prostym JSONem w formacie: ["Pytanie 1?", "Pytanie 2?", "Pytanie 3?", "Pytanie 4?"]. 
               Pytania powinny być krótkie, intrygujące i zachęcające do zadania ich AI. Odpowiedz po polsku.`;
        }

        const model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash',
            generationConfig: {
                temperature: 0,
                responseMimeType: "application/json",
                responseSchema: {
                    type: SchemaType.ARRAY,
                    items: { type: SchemaType.STRING }
                }
            }
        }, { apiVersion: 'v1beta' });

        const result = await model.generateContent(prompt);
        const questions = JSON.parse(result.response.text());
        return { questions };

    } catch (error: any) {
        logger.error("FAQ API Error", { message: error.message });
        throw new HttpsError('internal', `Błąd podczas generowania FAQ: ${error.message || 'unknown'}`);
    }
});
