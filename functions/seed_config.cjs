const admin = require('firebase-admin');

// 1. Point to the Emulator
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';

// 2. Initialize App (No credentials needed for emulator)
admin.initializeApp({
    projectId: "low-assit"
});

const db = admin.firestore();

// 3. Define the Pricing Config Data (from screenshots)
const pricingConfig = {
    profit_margin_multiplier: 500,
    rates: {
        "gemini-1.5-flash": {
            input: 0.25,
            output: 1.0
        },
        "gemini-1.5-pro": {
            input: 1.5,
            output: 4.5
        },
        "gemini-1.5-pro-latest": {
            input: 1.5,
            output: 4.5
        },
        "gemini-2.0-flash": {
            input: 0.25,
            output: 1.0
        }
    }
};

async function seedConfig() {
    console.log("🌱 Seeding config/pricing to Firestore Emulator...");
    try {
        await db.collection('config').doc('pricing').set(pricingConfig);
        console.log("✅ Successfully wrote config/pricing!");
        console.log("Data wrote:", JSON.stringify(pricingConfig, null, 2));
    } catch (error) {
        console.error("❌ Error writing document:", error);
    }
}

seedConfig();
