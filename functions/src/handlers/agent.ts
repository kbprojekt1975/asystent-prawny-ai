import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { getAiClient, GEMINI_API_KEY } from "../services/ai";

export const optimizeAgent = onCall({
    cors: true,
    secrets: [GEMINI_API_KEY]
}, async (request) => {
    try {
        const genAI = getAiClient();
        if (!genAI) throw new HttpsError('failed-precondition', 'AI Client not initialized.');
        if (!request.auth) throw new HttpsError('unauthenticated', 'User not authenticated.');

        const { name, persona, instructions } = request.data;

        const prompt = `
            TWOJE ZADANIE: Jesteś ekspertem od inżynierii promptów i tworzenia agentów AI. 
            Twoim celem jest optymalizacja definicji agenta prawnego, aby działał on jak najskuteczniej.

            DANE WEJŚCIOWE OD UŻYTKOWNIKA:
            - Nazwa: ${name || "(brak)"}
            - Persona: ${persona || "(brak)"}
            - Instrukcje: ${instructions || "(brak)"}

            ZADANIE SZCZEGÓŁOWE:
            1. Popraw nazwę, aby była profesjonalna i chwytliwa (jeśli to konieczne).
            2. Rozbuduj personę, dodając jej głębi strategicznej, wiedzy i specyficznego tonu głosu.
            3. Przekształć instrukcje w zestaw konkretnych, technicznych wytycznych dla modelu językowego (np. "Zawsze cytuj podstawę prawną", "Bądź dociekliwy w pytaniach o daty", "Używaj języka zrozumiałego dla laika").

            ZWRÓĆ WYNIK W FORMACIE JSON:
            {
                "name": "Zoptymalizowana nazwa",
                "persona": "Zoptymalizowana persona",
                "instructions": "Zoptymalizowane instrukcje specjalne"
            }

            WAŻNE: Nie dodawaj żadnego tekstu poza formatem JSON. Pisz w języku polskim.
        `;

        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent(prompt);
        const response = result.response;
        let text = response.text();

        // Strip markdown backticks if present
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();

        return JSON.parse(text);
    } catch (error: any) {
        logger.error("Error optimizing agent:", error);
        throw new HttpsError('internal', `Błąd optymalizacji: ${error.message}`);
    }
});
