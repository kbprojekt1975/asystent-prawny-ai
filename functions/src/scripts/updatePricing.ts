import { db } from "../services/db";

async function updatePricing() {
    const pricingData = {
        profit_margin_multiplier: 500,
        rates: {
            "gemini-1.5-flash": { input: 0.25, output: 1.0 },
            "gemini-1.5-pro": { input: 1.5, output: 4.5 },
            "gemini-2.0-flash": { input: 0.25, output: 1.0 }
        }
    };

    try {
        await db.collection('config').doc('pricing').set(pricingData);
        console.log("✅ Pricing configuration updated in Firestore.");
    } catch (error) {
        console.error("❌ Failed to update pricing configuration:", error);
    }
}

updatePricing();
