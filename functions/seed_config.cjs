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
    profit_margin_multiplier: 5,
    validity_seconds: 604800, // Fixed to 7 days in seconds as in ai.ts fallback
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

const systemPrompts = {
    core: {
        pl: "", // Fill this to override CORE_RULES_PL
        en: "",
        es: ""
    },
    pillars: {
        pl: {}, // e.g., "Prawo Rodzinne": "..."
        en: {},
        es: {}
    },
    instructions: {
        pl: {}, // e.g., "Porada Prawna": "..."
        en: {},
        es: {}
    }
};

async function seedConfig() {
    console.log("🌱 Seeding config/pricing & config/system to Firestore Emulator...");
    try {
        await db.collection('config').doc('pricing').set(pricingConfig);
        await db.collection('config').doc('system').set(systemPrompts);
        console.log("✅ Successfully wrote config documents!");
    } catch (error) {
        console.error("❌ Error writing document:", error);
    }
}

seedConfig();
