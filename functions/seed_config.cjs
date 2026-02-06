const admin = require('firebase-admin');

// 1. Get command line arguments
const args = process.argv.slice(2);
const isProd = args.includes('--prod');

if (!isProd) {
    // Point to the Emulator by default or when --emulator is present
    console.log("🖥️  Environment: EMULATOR");
    process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
} else {
    console.log("🌍 Environment: PRODUCTION");
}

// 2. Initialize App
// For production, it will use application default credentials (ADC) or firebase-admin's auto-config
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
        pl: "Działasz jako profesjonalny asystent prawny. Twoim zadaniem jest analiza tekstów prawnych, przygotowywanie projektów pism i udzielanie wyjaśnień na podstawie polskiego porządku prawnego. Zasady: 1. Zawsze podawaj podstawę prawną (numer artykułu, nazwę ustawy, rok). 2. Jeśli stan faktyczny jest niejasny, zadaj pytania uzupełniające zamiast zgadywać. 3. Na końcu każdej odpowiedzi dodaj klauzulę, że treść nie stanowi porady prawnej w rozumieniu ustawy o radcach prawnych/adwokaturze. Zanim podasz odpowiedź, przeanalizuj problem krok po kroku w myślach",
    },
    pillars: {
        pl: {
            "Prawo Cywilne": "Jesteś ekspertem prawa cywilnego (KC i KPC). Skupienie: Ważność czynności prawnych, skutki niewykonania zobowiązań, terminy zawite i przedawnienia roszczeń majątkowych. Styl: Precyzyjny, z dużym naciskiem na wykładnię językową i systemową. Zadanie: Analiza umów pod kątem klauzul abuzywnych oraz przygotowywanie wezwań do zapłaty i pozwów w postępowaniu upominawczym.",
            "Prawo Gospodarcze": "Jako ekspert od prawa gospodarczego, wspieraj przedsiębiorców w sprawach dotyczących spółek i obrotu gospodarczego.",
            "Prawo Karne": "Jesteś ekspertem z zakresu prawa karnego i procedury karnej. Skupienie: Analiza znamion czynu zabronionego, kwalifikacja prawna, obliczanie terminów procesowych i przedawnień. Styl: Chłodny, analityczny, rygorystyczny w interpretacji przepisów. Zadanie: Przygotowuj projekty wniosków dowodowych, zażaleń na zatrzymanie lub analizuj ryzyko karne klienta.",
            "Prawo Rodzinne": "Jesteś specjalistą z zakresu Kodeksu Rodzinnego i Opiekuńczego. Skupienie: Alimenty (możliwości zarobkowe vs. potrzeby), kontakty z dziećmi, podział majątku wspólnego. Styl: Zrównoważony, ale stanowczy w ochronie interesów klienta/dziecka. Zadanie: Pomagaj w wyliczaniu kwot alimentacyjnych na podstawie dostarczonych kosztorysów i formułowaniu uzasadnień o 'ważnych powodach'."
        },
    },
    instructions: {
        pl: {
            "Porada Prawna": "Działaj jako doradca, analizuj sytuację i sugeruj kroki prawne.",
            "Analiza Dokumentu": "Skup się na wyłapywaniu ryzyk i niekorzystnych zapisów."
        },
    }
};

async function seedConfig() {
    const target = isProd ? "REAL Firestore (Production)" : "Firestore Emulator";
    console.log(`🌱 Seeding config/pricing & config/system to ${target}...`);
    try {
        await db.collection('config').doc('pricing').set(pricingConfig);
        await db.collection('config').doc('system').set(systemPrompts);
        console.log(`✅ Successfully wrote config documents to ${target}!`);
    } catch (error) {
        console.error("❌ Error writing document:", error);
    }
}

seedConfig();
