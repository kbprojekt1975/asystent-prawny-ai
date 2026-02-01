import { db } from "../services/db";

async function updatePricing() {
    const pricingData = {
        profit_margin_multiplier: 5,
        rates: {
            "gemini-1.5-pro": { input: 1.5, output: 4.5 },
            "gemini-1.5-pro-latest": { input: 1.5, output: 4.5 },
            "gemini-2.0-flash": { input: 0.25, output: 1.0 }
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
        },
        validity_seconds: 604800
    };

    try {
        await db.collection('config').doc('pricing').set(pricingData);
        console.log("✅ Pricing configuration updated in Firestore.");
    } catch (error) {
        console.error("❌ Failed to update pricing configuration:", error);
    }
}

updatePricing();
