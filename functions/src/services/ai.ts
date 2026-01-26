import { GoogleGenerativeAI } from "@google/generative-ai";
import { defineSecret } from "firebase-functions/params";
import * as logger from "firebase-functions/logger";

export const GEMINI_API_KEY = defineSecret('GEMINI_API_KEY');

// --- LOGIKA CENOWA ---
// Ceny bazowe (koszt wewnętrzny) w USD za 1 mln tokenów
export const PRICING = {
    'gemini-2.0-flash-exp': { input: 0.25, output: 1.0 },
    'gemini-2.0-flash-thinking-exp': { input: 4.2, output: 16.7 },
    'gemini-1.5-flash': { input: 0.25, output: 1.0 },
    'gemini-1.5-pro': { input: 4.2, output: 16.7 },
};

// Marża: 80% zysku z tego co wpłaca user.
// Jeśli Profit = 0.8 * Price, to Price - Cost = 0.8 * Price => 0.2 * Price = Cost => Price = 5 * Cost.
const PROFIT_MARGIN_MULTIPLIER = 5;

export const calculateCost = (model: string, usage: { promptTokenCount?: number, candidatesTokenCount?: number }): number => {
    const prices = PRICING[model as keyof typeof PRICING];
    if (!prices || !usage) return 0;

    const inputCost = (usage.promptTokenCount || 0) / 1_000_000 * prices.input;
    const outputCost = (usage.candidatesTokenCount || 0) / 1_000_000 * prices.output;

    const internalCost = inputCost + outputCost;
    return internalCost * PROFIT_MARGIN_MULTIPLIER;
};

let aiClient: GoogleGenerativeAI | null = null;

export const getAiClient = () => {
    if (aiClient) return aiClient;

    let apiKey: string | undefined;

    try {
        apiKey = GEMINI_API_KEY.value();
    } catch (e) {
        logger.info("Secret GEMINI_API_KEY not found, falling back to process.env");
    }

    if (!apiKey) {
        apiKey = process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY_LOCAL;
        if (apiKey) logger.info("Using API Key from process.env");
    }

    if (!apiKey) {
        logger.error("KONFIGURACJA BŁĄD: Klucz GEMINI_API_KEY jest pusty.");
        return null;
    }

    apiKey = apiKey.trim();
    const maskedKey = apiKey.substring(0, 8) + "..." + apiKey.substring(apiKey.length - 4);
    logger.info(`Initializing Gemini AI with key: ${maskedKey} (Length: ${apiKey.length})`);

    aiClient = new GoogleGenerativeAI(apiKey);

    return aiClient;
};
