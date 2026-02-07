import { GoogleGenerativeAI } from "@google/generative-ai";
import { defineSecret } from "firebase-functions/params";
import * as logger from "firebase-functions/logger";

export const GEMINI_API_KEY = defineSecret('GEMINI_API_KEY');

// --- LOGIKA CENOWA ---
export const getPricingConfig = async (db: any) => {
    try {
        const doc = await db.collection('config').doc('pricing').get();
        if (doc.exists) {
            const data = doc.data();
            logger.info("✅ Pricing config fetched:", data);
            return data;
        } else {
            logger.warn("⚠️ config/pricing document does not exist in Firestore.");
        }
    } catch (e) {
        logger.error("❌ Error fetching pricing config", e);
    }
    // Fallback defaults
    logger.warn("⚠️ Using fallback pricing config");
    return {
        profit_margin_multiplier: 5,
        validity_seconds: 604800,
        rates: {
            'gemini-2.0-flash': { input: 0.25, output: 1.0 },
            'gemini-1.5-flash': { input: 0.25, output: 1.0 },
            'gemini-1.5-pro': { input: 1.5, output: 4.5 },
            'gemini-2.5-pro': { input: 1.25, output: 10.0 }
        },
        plans: {
            "price_1StBSvDXnXONl2svkF51zTnl": {
                name: "starter",
                creditLimit: 10,
                tokenLimit: 333000
            },
            "price_1Sw7KFDXnXONl2svPmtUXAxk": {
                name: "pro",
                creditLimit: 50,
                tokenLimit: 2166666
            }
        }
    };
};

export const getSystemPrompts = async (db: any) => {
    try {
        const doc = await db.collection('config').doc('system').get();
        if (doc.exists) {
            return doc.data();
        }
    } catch (e) {
        logger.error("❌ Error fetching system prompts", e);
    }
    return null;
};

export const getActiveModels = async (db: any) => {
    try {
        const doc = await db.collection('config').doc('models').get();
        if (doc.exists) {
            const data = doc.data();
            logger.info("✅ Active models config fetched:", data);
            return data;
        }
    } catch (e) {
        logger.error("❌ Error fetching active models config", e);
    }
    
    // Fallback defaults
    return {
        andromeda: 'gemini-2.5-pro',
        advice: 'gemini-2.0-flash',
        analysis: 'gemini-2.0-flash'
    };
};

export const calculateCost = (model: string, usage: { promptTokenCount?: number, candidatesTokenCount?: number }, config: any): number => {
    // Normalize model name (remove version suffixes if needed, though usually exact match is best)
    // The config keys in user screenshot are 'gemini-1.5-flash', etc.
    const prices = config.rates?.[model];

    if (!prices || !usage) {
        logger.warn(`⚠️ calculateCost: Missing prices or usage for model ${model}. Prices found: ${!!prices}, Usage found: ${!!usage}`);
        return 0;
    }

    const inputCost = (usage.promptTokenCount || 0) / 1_000_000 * prices.input;
    const outputCost = (usage.candidatesTokenCount || 0) / 1_000_000 * prices.output;

    const internalCost = inputCost + outputCost;
    const multiplier = config.profit_margin_multiplier || 10;

    const finalCost = internalCost * multiplier;
    logger.info(`💰 Cost calculated: Model=${model}, In=${usage.promptTokenCount}, Out=${usage.candidatesTokenCount}, Base=${internalCost.toFixed(6)}, Multiplier=${multiplier}, Final=${finalCost.toFixed(6)}`);

    return finalCost;
};

export const calculateAppTokens = (usage: { promptTokenCount?: number, candidatesTokenCount?: number }): number => {
    // Standardized 'App Token' = 1 Gemini 1.5 Pro Input Token
    // Output tokens are 4x more expensive ($5.00 vs $1.25)

    const input = usage.promptTokenCount || 0;
    const output = usage.candidatesTokenCount || 0;

    return input + (output * 4);
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
