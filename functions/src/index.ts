/**
 * UŻYTO BIBLIOTEKI @google/genai. 
 * Pamiętaj o instalacji w folderze /functions: 
 * 1. npm install firebase-admin
 * 2. npm install @google/genai@0.1.0 
 * 3. npm install dotenv (dla testów lokalnych)
 * 4. npm install -D @types/dotenv (dla TypeScript)
 *
 * Konfiguracja klucza Gemini (w głównym folderze projektu):
 * firebase functions:secrets:set GEMINI_API_KEY
 */
import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { defineSecret } from "firebase-functions/params";
import 'dotenv/config'; // Load .env file

// --- DEKLARACJA SEKRETU ---
// Używane do bezpiecznego wstrzykiwania klucza na środowisku produkcyjnym
const GEMINI_API_KEY_SECRET = defineSecret('GEMINI_API_KEY');

// --- INICJALIZACJA ADMIN SDK ---
// --- INICJALIZACJA ADMIN SDK ---
import { initializeApp } from "firebase-admin/app";
import { getFirestore, Timestamp, FieldValue } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

initializeApp();
const db = getFirestore();

/**
 * Klient AI jest inicjowany wewnątrz funkcji lub leniwie, 
 * aby upewnić się, że sekrety są dostępne.
 */
let aiClient: GoogleGenerativeAI | null = null;

const getAiClient = () => {
    if (aiClient) return aiClient;
    // Try to get key from Secret, then process.env (for local dev), then fallback
    let apiKey: string | undefined = GEMINI_API_KEY_SECRET.value();

    if (!apiKey) {
        apiKey = process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY_LOCAL;
    }

    if (!apiKey) {
        logger.error("KONFIGURACJA BŁĄD: Klucz GEMINI_API_KEY jest pusty.");
        return null;
    }
    aiClient = new GoogleGenerativeAI(apiKey as string);
    return aiClient;
};


// --- TYPY I ENUMY ---
type LawAreaType = 'Prawo Karne' | 'Prawo Rodzinne' | 'Prawo Cywilne' | 'Prawo Gospodarcze';
type InteractionModeType = 'Porada Prawna' | 'Generowanie Pisma' | 'Szkolenie Prawne' | 'Zasugeruj Przepisy' | 'Znajdź Podobne Wyroki' | 'Tryb Sądowy';

const LawArea = {
    Criminal: 'Prawo Karne' as LawAreaType,
    Family: 'Prawo Rodzinne' as LawAreaType,
    Civil: 'Prawo Cywilne' as LawAreaType,
    Commercial: 'Prawo Gospodarcze' as LawAreaType
};

const InteractionMode = {
    Advice: 'Porada Prawna' as InteractionModeType,
    Document: 'Generowanie Pisma' as InteractionModeType,
    LegalTraining: 'Szkolenie Prawne' as InteractionModeType,
    SuggestRegulations: 'Zasugeruj Przepisy' as InteractionModeType,
    FindRulings: 'Znajdź Podobne Wyroki' as InteractionModeType,
    Court: 'Tryb Sądowy' as InteractionModeType
};

// --- LOGIKA CENOWA ---
const PRICING = {
    'gemini-2.5-flash': { input: 0.075, output: 0.30 }, // za 1M tokenów w USD
    'gemini-2.5-pro': { input: 3.50, output: 10.50 },
};

const calculateCost = (model: 'gemini-2.5-flash' | 'gemini-2.5-pro', usage: { promptTokenCount?: number, candidatesTokenCount?: number }): number => {
    const prices = PRICING[model];
    if (!prices || !usage) return 0;

    const inputCost = (usage.promptTokenCount || 0) / 1_000_000 * prices.input;
    const outputCost = (usage.candidatesTokenCount || 0) / 1_000_000 * prices.output;

    return inputCost + outputCost;
};


// --- SYSTEM INSTRUCTIONS ---
const commonRules = "ZASADA: Twoim priorytetem jest dokładne ustalenie stanu faktycznego przed udzieleniem porady. Rozpoczynaj każdą nową sprawę od wywiadu z użytkownikiem. Kluczowa reguła: ZADAWAJ PYTANIA POJEDYNCZO. W jednej odpowiedzi zadaj tylko jedno, najważniejsze w danej chwili pytanie. Nie generuj list pytań w jednej wiadomości. Czekaj na odpowiedź użytkownika przed zadaniem kolejnego pytania. Zadaj maksymalnie 5 pytań w toku całej rozmowy. Dopiero po uzyskaniu jasnego obrazu sytuacji, udziel pełnej porady lub sporządź pismo.";

const systemInstructions: Record<LawAreaType, Record<InteractionModeType, string>> = {
    [LawArea.Criminal]: {
        [InteractionMode.Advice]: `Jesteś ekspertem w dziedzinie polskiego prawa karnego. ${commonRules} Rozpocznij od zadania kluczowego pytania o szczegóły zdarzenia lub status sprawy. Nie podawaj źródeł, chyba że użytkownik zapyta.`,
        [InteractionMode.Document]: `Jesteś ekspertem w dziedzinie polskiego prawa karnego. ${commonRules} Jeśli masz napisać pismo, najpierw zapytaj o jeden brakujący element formalny (np. sygnaturę lub datę zdarzenia).`,
        [InteractionMode.LegalTraining]: `Jesteś mentorem prawa karnego. ${commonRules} Jeśli użytkownik pyta o teorię, zapytaj o kontekst praktyczny, aby lepiej wytłumaczyć zagadnienie.`,
        [InteractionMode.SuggestRegulations]: `Jesteś ekspertem prawa karnego. ${commonRules} Zapytaj o szczegóły czynu, aby precyzyjnie dobrać kwalifikację prawną.`,
        [InteractionMode.FindRulings]: `Jesteś asystentem prawnym. ${commonRules} Zapytaj o konkretne okoliczności lub zarzuty, aby znaleźć adekwatne wyroki.`,
        [InteractionMode.Court]: `Jesteś rygorystycznym asystentem przygotowującym użytkownika do rozprawy karnej. Używaj formalnego języka. Skup się na procedurze karnej, dowodach i linii obrony/oskarżenia. ${commonRules}`
    },
    [LawArea.Family]: {
        [InteractionMode.Advice]: `Jesteś ekspertem w dziedzinie polskiego prawa rodzinnego. ${commonRules} Rozpocznij od pytania o sytuację rodzinną lub majątkową klienta. Nie podawaj źródeł, chyba że użytkownik zapyta.`,
        [InteractionMode.Document]: `Jesteś ekspertem prawa rodzinnego. ${commonRules} Przed napisaniem pisma, zapytaj o konkretne żądanie (np. kwotę alimentów).`,
        [InteractionMode.LegalTraining]: `Jesteś mentorem prawa rodzinnego. ${commonRules} Zapytaj, na jakim etapie jest sprawa, aby dostosować wyjaśnienia.`,
        [InteractionMode.SuggestRegulations]: `Jesteś ekspertem prawa rodzinnego. ${commonRules} Zapytaj o relacje między stronami, aby wskazać właściwe przepisy KRO.`,
        [InteractionMode.FindRulings]: `Jesteś asystentem prawnym. ${commonRules} Zapytaj o przedmiot sporu, aby znaleźć trafne orzecznictwo.`,
        [InteractionMode.Court]: `Jesteś rygorystycznym asystentem przygotowującym użytkownika do rozprawy rodzinnej. Używaj formalnego języka. Skup się na dobru dziecka, dowodach i sytuacji majątkowej. ${commonRules}`
    },
    [LawArea.Civil]: {
        [InteractionMode.Advice]: `Jesteś ekspertem w dziedzinie polskiego prawa cywilnego. ${commonRules} Rozpocznij od pytania o dowody, umowy lub daty zdarzeń. Nie podawaj źródeł, chyba że użytkownik zapyta.`,
        [InteractionMode.Document]: `Jesteś ekspertem prawa cywilnego. ${commonRules} Zapytaj o wartość przedmiotu sporu lub treść żądania, zanim napiszesz pozew.`,
        [InteractionMode.LegalTraining]: `Jesteś mentorem prawa cywilnego. ${commonRules} Zapytaj o tło problemu prawnego.`,
        [InteractionMode.SuggestRegulations]: `Jesteś ekspertem prawa cywilnego. ${commonRules} Zapytaj o rodzaj umowy lub zdarzenia, aby wskazać artykuły KC.`,
        [InteractionMode.FindRulings]: `Jesteś asystentem prawnym. ${commonRules} Zapytaj o szczegóły roszczenia, aby wyszukać wyroki.`,
        [InteractionMode.Court]: `Jesteś rygorystycznym asystentem przygotowującym użytkownika do rozprawy cywilnej. Używaj formalnego języka. Skup się na ciężarze dowodu, roszczeniach i podstawach prawnych. ${commonRules}`
    },
    [LawArea.Commercial]: {
        [InteractionMode.Advice]: `Jesteś ekspertem w dziedzinie polskiego prawa gospodarczego. ${commonRules} Rozpocznij od pytania o formę prawną działalności lub treść kontraktu. Nie podawaj źródeł, chyba że użytkownik zapyta.`,
        [InteractionMode.Document]: `Jesteś ekspertem prawa handlowego. ${commonRules} Zapytaj o strukturę spółki lub reprezentację, zanim sporządzisz dokument.`,
        [InteractionMode.LegalTraining]: `Jesteś mentorem prawa gospodarczego. ${commonRules} Zapytaj o specyfikę biznesu użytkownika.`,
        [InteractionMode.SuggestRegulations]: `Jesteś ekspertem prawa gospodarczego. ${commonRules} Zapytaj o formę działalności, aby wskazać przepisy KSH.`,
        [InteractionMode.FindRulings]: `Jesteś asystentem prawnym. ${commonRules} Zapytaj o branżę i przedmiot sporu.`,
        [InteractionMode.Court]: `Jesteś rygorystycznym asystentem przygotowującym użytkownika do rozprawy sądowej. Używaj bardzo formalnego, fachowego języka prawniczego. Bądź precyzyjny i wymagaj precyzji od użytkownika. Skup się na faktach i dowodach. ${commonRules}`
    }
} as Record<LawAreaType, Record<InteractionModeType, string>>;


// --- FUNCTION: getLegalAdvice (GŁÓWNA LOGIKA CZATU) ---
export const getLegalAdvice = onCall({
    cors: true,
    secrets: [GEMINI_API_KEY_SECRET] // KLUCZOWE DLA ONLINE!
}, async (request) => {
    const genAI = getAiClient();
    if (!genAI) {
        throw new HttpsError('failed-precondition', 'Klient Gemini AI nie został zainicjowany z powodu braku klucza.');
    }
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'Użytkownik musi być zalogowany.');
    }

    const { history, lawArea, interactionMode, topic, isDeepThinkingEnabled, articles, chatId } = request.data;
    const uid = request.auth.uid;

    if (!chatId) {
        throw new HttpsError('invalid-argument', "Wymagany jest ID czatu (chatId) do kontynuowania rozmowy.");
    }

    // --- SUBSCRIPTION CHECK ---
    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();
    const userData = userDoc.data();
    const subscription = userData?.profile?.subscription;

    if (!subscription || subscription.status !== 'active' || !subscription.isPaid) {
        throw new HttpsError('permission-denied', "Brak aktywnego lub opłaconego planu. Wykup dostęp lub poczekaj na aktywację.");
    }
    // --------------------------

    try {
        const baseInstruction = systemInstructions[lawArea as LawAreaType]?.[interactionMode as InteractionModeType];
        if (!baseInstruction) {
            throw new HttpsError('invalid-argument', "Nieprawidłowy obszar prawa lub tryb interakcji.");
        }

        const timelineInstruction = `
        WAŻNE: Jeśli w rozmowie (teraz lub wcześniej) pojawiły się konkretne daty, fakty lub terminy zdarzeń dotyczące tej sprawy, wyodrębnij je.
        Na samym końcu swojej odpowiedzi, jeśli odkryłeś nowe fakty, dołącz DOKŁADNIE taki blok tekstowy:
        [TIMELINE_EXTRACT]
        [
          {"date": "YYYY-MM-DD lub opis", "title": "Krótki tytuł", "description": "Krótki opis", "type": "fact|deadline|status"}
        ]
        [/TIMELINE_EXTRACT]
        Zwróć tylko te zdarzenia, które nie zostały jeszcze jasno ustalone w poprzednich wiadomościach (jeśli potrafisz to ocenić) lub wszystkie istotne które właśnie padły.
        Formatuj daty jako RRRR-MM-DD jeśli to możliwe, w przeciwnym razie użyj opisu (np. "Wczoraj", "10 lat temu").
        `;

        const instruction = `Jesteś ekspertem w dziedzinie prawa: ${lawArea}, ze szczególnym uwzględnieniem sprawy o temacie: "${topic}".\n\n${baseInstruction}\n\n${timelineInstruction}`;

        const lastUserMessage = history.length > 0 ? history[history.length - 1].content.toLowerCase() : "";
        const isSourceRequested = /źródł|link|stron|gdzie|skąd|podstaw/i.test(lastUserMessage);

        const useSearch = interactionMode === InteractionMode.FindRulings || isSourceRequested;

        const modelName = 'gemini-2.5-pro';
        const model = genAI.getGenerativeModel({
            model: modelName,
            systemInstruction: instruction,
            ...(isDeepThinkingEnabled && { thinkingConfig: { thinkingBudget: 32768 } }),
        });

        // --- FETCH DOCUMENTS ---
        const docsRef = userRef.collection('chats').doc(chatId).collection('documents');
        const docsSnapshot = await docsRef.get();
        const docParts: any[] = [];

        for (const doc of docsSnapshot.docs) {
            const data = doc.data();
            if (data.path && (data.type === 'application/pdf' || data.type.startsWith('image/'))) {
                try {
                    const [fileBuffer] = await getStorage().bucket().file(data.path).download();
                    const base64Content = fileBuffer.toString('base64');
                    docParts.push({
                        inlineData: {
                            data: base64Content,
                            mimeType: data.type
                        }
                    });
                } catch (err) {
                    logger.error(`Error downloading file ${data.path}`, err);
                }
            }
        }

        const contents = history
            .filter((msg: any) => msg.role !== 'system')
            .map((msg: any, index: number, arr: any[]) => {
                let text = msg.content;
                if (index === arr.length - 1 && articles && articles.trim() !== '' && msg.role === 'user') {
                    text = `Opieraj się na poniższych przepisach: ${articles}\n\nPytanie użytkownika: ${text}`;
                }

                const parts: any[] = [{ text: text }];

                // Add documents context to the LAST user message
                if (index === arr.length - 1 && msg.role === 'user' && docParts.length > 0) {
                    parts.unshift(...docParts);
                    parts[parts.length - 1].text = `[ZAŁĄCZONE DOKUMENTY DO ANALIZY]\n${parts[parts.length - 1].text}`;
                }

                return {
                    role: msg.role === 'model' ? 'model' : 'user',
                    parts
                };
            });

        const result = await model.generateContent({
            contents,
            ...(useSearch && { tools: [{ googleSearchRetrieval: {} }] })
        });

        const modelResponseText = result.response.text() || "Brak odpowiedzi tekstowej.";

        const sources = useSearch ? (result.response as any).candidates?.[0]?.groundingMetadata?.groundingChunks : undefined;

        let usage = undefined;
        if (result.response.usageMetadata) {
            usage = {
                promptTokenCount: result.response.usageMetadata.promptTokenCount || 0,
                candidatesTokenCount: result.response.usageMetadata.candidatesTokenCount || 0,
                totalTokenCount: result.response.usageMetadata.totalTokenCount || 0,
                cost: calculateCost(modelName, result.response.usageMetadata)
            };
        }

        // --- ZAPIS DO FIRESTORE ---
        const chatRef = db.collection('users').doc(uid).collection('chats').doc(chatId);

        // --- EXTRACT TIMELINE EVENTS ---
        let finalResponseText = modelResponseText;
        const timelineRegex = /\[TIMELINE_EXTRACT\]([\s\S]*?)\[\/TIMELINE_EXTRACT\]/gi;
        const timelineMatch = modelResponseText.match(/\[TIMELINE_EXTRACT\]([\s\S]*?)\[\/TIMELINE_EXTRACT\]/i);

        if (timelineMatch && timelineMatch[1]) {
            try {
                // Clean potential markdown backticks
                let jsonStr = timelineMatch[1].trim();
                jsonStr = jsonStr.replace(/^```json/, "").replace(/^```/, "").replace(/```$/, "").trim();

                const extractedEvents = JSON.parse(jsonStr);
                if (Array.isArray(extractedEvents)) {
                    const timelineRef = chatRef.collection('timeline');
                    for (const event of extractedEvents) {
                        const eventId = `ev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
                        await timelineRef.doc(eventId).set({
                            ...event,
                            id: eventId,
                            createdAt: Timestamp.now()
                        });
                    }
                }
            } catch (err) {
                logger.error("Error parsing timeline JSON", err);
            }
            // ALWAYS remove the tags from the final text
            finalResponseText = modelResponseText.replace(timelineRegex, "").trim();
        }

        // 1. Dodanie nowej wiadomości AI do tablicy 'messages'
        const newMessage = {
            role: 'model',
            content: finalResponseText,
            timestamp: Timestamp.now(),
            costTokens: usage?.totalTokenCount || 0
        };

        // 2. Aktualizacja czatu i daty
        await chatRef.update({
            messages: FieldValue.arrayUnion(newMessage),
            lastUpdated: Timestamp.now()
        });

        // 3. Aktualizacja kosztów i limitu w profilu użytkownika
        if (usage) {
            await userRef.set({
                totalCost: FieldValue.increment(usage.cost),
                profile: {
                    subscription: {
                        spentAmount: FieldValue.increment(usage.cost)
                    }
                }
            }, { merge: true });
        }
        // ---------------------------

        return {
            text: finalResponseText,
            sources,
            usage
        };

    } catch (error) {
        logger.error("Gemini API Error", error);
        if (error instanceof HttpsError) {
            throw error;
        }
        throw new HttpsError('internal', "Błąd podczas przetwarzania zapytania AI.");
    }
});


// --- FUNCTION: analyzeLegalCase (KLASYFIKACJA SPRAWY) ---
export const analyzeLegalCase = onCall({
    cors: true,
    secrets: [GEMINI_API_KEY_SECRET] // KLUCZOWE DLA ONLINE!
}, async (request) => {
    const genAI = getAiClient();
    if (!genAI) {
        throw new HttpsError('failed-precondition', 'Klient Gemini AI nie został zainicjowany z powodu braku klucza.');
    }
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'Użytkownik musi być zalogowany.');
    }

    const { description } = request.data;
    const uid = request.auth.uid;

    // --- SUBSCRIPTION CHECK ---
    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.data();
    const subscription = userData?.profile?.subscription;

    if (!subscription || subscription.status !== 'active' || !subscription.isPaid) {
        throw new HttpsError('permission-denied', "Brak aktywnego lub opłaconego planu. Wykup dostęp lub poczekaj na aktywację.");
    }
    // --------------------------

    try {
        const prompt = `
            Jesteś zaawansowanym asystentem prawnym. Przeanalizuj poniższy opis sprawy użytkownika i zaklasyfikuj go.
            
            Twoim zadaniem jest:
            1. Przypisać sprawę do jednej z kategorii: "Prawo Karne", "Prawo Rodzinne", "Prawo Cywilne", "Prawo Gospodarcze".
            2. Stworzyć krótki, zwięzły temat sprawy (maksymalnie 4-6 słów).
            3. Zasugerować najbardziej odpowiedni tryb interakcji spośród: "Porada Prawna", "Generowanie Pisma", "Szkolenie Prawne", "Zasugeruj Przepisy", "Znajdź Podobne Wyroki". Domyślnie "Porada Prawna".

            Opis sprawy: "${description}"
        `;

        const modelName = 'gemini-2.5-flash';
        const model = genAI.getGenerativeModel({
            model: modelName,
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: SchemaType.OBJECT,
                    properties: {
                        lawArea: { type: SchemaType.STRING, enum: Object.values(LawArea) },
                        topic: { type: SchemaType.STRING },
                        interactionMode: { type: SchemaType.STRING, enum: Object.values(InteractionMode) }
                    },
                    required: ["lawArea", "topic", "interactionMode"]
                }
            }
        });

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

        // ZABEZPIECZENIE: Sprawdzenie poprawności odpowiedzi JSON
        if (!responseText || responseText.trim() === '') {
            logger.error("Analysis API Error: Brak tekstu JSON w odpowiedzi Gemini.");
            return { result: null, usage: usage, chatId: null };
        }

        const result = JSON.parse(responseText.trim());

        if (!result.lawArea || !result.topic || !result.interactionMode) {
            logger.error("Analysis API Error: Niepoprawny format JSON zwrócony przez Gemini.");
            return { result: null, usage: usage, chatId: null };
        }

        // --- ZAPIS DO FIRESTORE ---

        // 1. UTWORZENIE NOWEGO CZATU
        const chatData = {
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
        };

        const chatRef = db.collection('users').doc(uid).collection('chats').doc();
        await chatRef.set(chatData);

        // 2. AKTUALIZACJA CAŁKOWITEGO KOSZTU UŻYTKOWNIKA
        if (usage) {
            const userRef = db.collection('users').doc(uid);
            await userRef.set({
                totalCost: FieldValue.increment(usage.cost),
            }, { merge: true });
        }
        // ---------------------------

        // Zwróć wynik analizy i ID nowo utworzonego czatu
        return { result, usage, chatId: chatRef.id };

    } catch (error) {
        logger.error("Analysis API Error", error);
        return { result: null, usage: null, chatId: null };
    }
});

// --- FUNCTION: getLegalFAQ (GENEROWANIE FAQ DLA DZIEDZINY) ---
export const getLegalFAQ = onCall({
    cors: true,
    secrets: [GEMINI_API_KEY_SECRET]
}, async (request) => {
    const genAI = getAiClient();
    if (!genAI) {
        throw new HttpsError('failed-precondition', 'Klient Gemini AI nie został zainicjowany.');
    }
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'Użytkownik musi być zalogowany.');
    }

    const { lawArea } = request.data;
    if (!lawArea) {
        throw new HttpsError('invalid-argument', 'Brak dziedziny prawa.');
    }

    try {
        const prompt = `Jesteś ekspertem prawnym. Wygeneruj 4 najczęstsze, konkretne i praktyczne pytania (FAQ), które obywatele zadają w dziedzinie: ${lawArea}. 
        Odpowiedź musi być prostym JSONem w formacie: ["Pytanie 1?", "Pytanie 2?", "Pytanie 3?", "Pytanie 4?"]. 
        Pytania powinny być krótkie, intrygujące i zachęcające do zadania ich AI.`;

        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: SchemaType.ARRAY,
                    items: { type: SchemaType.STRING }
                }
            }
        });

        const result = await model.generateContent(prompt);
        const questions = JSON.parse(result.response.text());
        return { questions };

    } catch (error) {
        logger.error("FAQ API Error", error);
        throw new HttpsError('internal', "Błąd podczas generowania FAQ.");
    }
});