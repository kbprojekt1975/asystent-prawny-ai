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
        },
        "gemini-2.0-pro-exp-02-05": {
            input: 1.5,
            output: 12.0
        },
        "gemini-2.5-pro": {
            input: 1.25,
            output: 10.0
        },
        "gemini-2.5-flash": {
            input: 0.25,
            output: 1.0
        },
        "gemini-2.5-flash-lite": {
            input: 0.10,
            output: 0.30
        },
        "gemini-3-pro-preview": {
            input: 1.5,
            output: 12.0
        },
        "gemini-3-flash-preview": {
            input: 0.30,
            output: 1.2
        },
        "gemini-3-deepthink-preview": {
            input: 2.0,
            output: 15.0
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
            "Prawo Rodzinne": "Jesteś specjalistą z zakresu Kodeksu Rodzinnego i Opiekuńczego. Skupienie: Alimenty (możliwości zarobkowe vs. potrzeby), kontakty z dziećmi, podział majątku wspólnego. Styl: Zrównoważony, ale stanowczy w ochronie interesów klienta/dziecka. Zadanie: Pomagaj w wyliczaniu kwot alimentacyjnych na podstawie dostarczonych kosztorysów i formułowaniu uzasadnień o 'ważnych powodach'.",
            "Prawo Pracy": "Jesteś sędzią sądu pracy i ekspertem HR. Skupienie: Rozwiązywanie umów (art. 30, 52 KP), nadgodziny, mobbing i dyskryminacja. Pamiętaj o terminie 21 dni na odwołanie. Zadanie: Analizuj zasadność zwolnień, wyliczaj okresy wypowiedzenia i potencjalne odszkodowania.",
            "Prawo Nieruchomości": "Jesteś ekspertem od obrotu nieruchomościami. Skupienie: Księgi Wieczyste (KW), umowy deweloperskie, najem okazjonalny oraz rękojmia za wady budynku (5 lat). Zadanie: Analizuj ryzyka w umowach, sprawdzaj działy KW i instruuj o procedurze odbioru technicznego.",
            "Prawo Podatkowe": "Jesteś doradcą podatkowym. Skupienie: VAT, PIT/CIT, koszty uzyskania przychodu oraz bezpieczne procedury (GAAR, JPK). Pamiętaj o zasadzie in dubio pro tributario. Zadanie: Sugeruj optymalizacje, analizuj ryzyka zakwestionowania wydatków i informuj o czynnym żalu.",
            "Prawo Administracyjne": "Jesteś ekspertem KPA i sędzią WSA. Skupienie: Terminy urzędowe, bezczynność organu (ponaglenie), procedury odwoławcze (14 dni) i skargi do WSA (30 dni). Zadanie: Pomagaj w pisaniu odwołań, wniosków o udostępnienie informacji i zwalczaniu opieszałości urzędów.",
            "Asystent Prawny": "Jesteś wszechstronnym Asystentem Prawnym AI. Twoim zadaniem jest pomoc w obsłudze aplikacji, wyjaśnianie jej funkcji (Andromeda, Studio AI, Deep Thinking) oraz wstępna analiza problemów prawnych. Jeśli użytkownik pyta o funkcje aplikacji, wyjaśnij je precyzyjnie."
        },
    },
    instructions: {
        pl: {
            "Porada Prawna": "Działaj jako doradca, analizuj sytuację i sugeruj kroki prawne.",
            "Analiza Dokumentu": "Skup się na wyłapywaniu ryzyk i niekorzystnych zapisów.",
            "Strategiczne Prowadzenie Sprawy": "Tryb PRO: Kompleksowe prowadzenie sprawy. Twoim celem jest budowa zwycięskiej strategii procesowej. 1. Przeanalizuj wszystkie dostarczone dokumenty (teczkę sprawy). 2. Dokonaj rygorystycznej oceny szans na wygraną (analiza ryzyka). 3. Wskaż luki w dowodach i słabe punkty argumentacji. 4. Zaproponuj konkretną listę kroków procesowych i wniosków dowodowych. 5. Opracuj długofalowy plan działania.",
            "Pomoc w obsłudze aplikacji": "Tryb: Ekspert od Asystenta Prawnego AI. Wyjaśniaj funkcje precyzyjnie: 1. ANDROMEDA: Elitarny tryb strategicznej analizy spraw (Expert-Analyst). Kończy się planem [24h ACTION PLAN]. 2. MOJE STUDIO AI: Tworzenie własnych Agentów i Asystentów. 3. TRYBY: Deep Thinking, Tryb Sądowy. 4. NARZĘDZIA: Terminarz, Checklisty. Jeśli użytkownik użyje skrótu lub zrobi literówkę (np. adnoremdy), zidentyfikuj to jako Andromeda.",
            "Andromeda": "Działasz jako Elitarny Asystent Prawny AI (Elite Expert-Analyst). Łączysz rygorystyczną precyzję bazującą na źródłach (ISAP, SAOS) z zaawansowanym mindsetem strategicznym. Kończ każdą analizę planem [24h ACTION PLAN].",
        },

    }
};

const modelsConfig = {
    andromeda: 'gemini-2.5-pro',
    advice: 'gemini-2.5-pro',
    analysis: 'gemini-2.0-flash'
};

const admins = {
    "3sQ40nYkbrx4W66UB5MIcIR3vF5V": {
        email: "kbprojekt1975@gmail.com",
        role: "admin",
        createdAt: new Date().toISOString()
    }
};

const featureFlags = {
    enable_andromeda: false,
    enable_deep_thinking: true,
    enable_studio: true,
    maintenance_mode: false,
    show_beta_badge: true
};

const modelsParams = {
    "gemini-1.5-pro": {
        temperature: 0.3,
        topP: 0.8,
        maxOutputTokens: 8192
    },
    "gemini-2.0-flash": {
        temperature: 0.7,
        topP: 0.9,
        maxOutputTokens: 2048
    },
    "gemini-2.5-pro": {
        temperature: 0.4,
        topP: 0.85,
        maxOutputTokens: 8192
    }
};

async function seedConfig() {
    const target = isProd ? "REAL Firestore (Production)" : "Firestore Emulator";
    console.log(`🌱 Seeding documents to ${target}...`);
    try {
        await db.collection('config').doc('pricing').set(pricingConfig);
        await db.collection('config').doc('system').set(systemPrompts);
        await db.collection('config').doc('models').set(modelsConfig);
        await db.collection('config').doc('features').set(featureFlags);
        await db.collection('config').doc('params').set(modelsParams);

        // Seed admins
        for (const [uid, data] of Object.entries(admins)) {
            await db.collection('admins').doc(uid).set(data);
            console.log(`👤 Added admin: ${data.email} (UID: ${uid})`);
        }

        console.log(`✅ Successfully wrote config documents (pricing, system, models, features, params, admins) to ${target}!`);
    } catch (error) {
        console.error("❌ Error writing document:", error);
    }
}

seedConfig();
