/**
 * UŻYTO BIBLIOTEKI @google/generative-ai (wersja ^0.21.0).
 * Pamiętaj o instalacji w folderze /functions: 
 * 1. npm install firebase-admin
 * 2. npm install @google/generative-ai
 * 3. npm install dotenv (dla testów lokalnych)
 * 4. npm install -D @types/dotenv (dla TypeScript)
 *
 * Konfiguracja klucza Gemini (w głównym folderze projektu):
 * firebase functions:secrets:set GEMINI_API_KEY
 */
import { onCall, onRequest, HttpsError } from "firebase-functions/v2/https";
// import { onObjectFinalized } from "firebase-functions/v2/storage";
import { setGlobalOptions } from "firebase-functions/v2";
import * as logger from "firebase-functions/logger";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { defineSecret } from "firebase-functions/params";
import 'dotenv/config'; // Load .env file
import { searchLegalActs, getActContent, getFullActContent } from "./isapService";

// --- GLOBAL OPTIONS ---
setGlobalOptions({
    region: 'us-central1',
    maxInstances: 10,
});

// --- DEKLARACJA SEKRETU ---
const GEMINI_API_KEY = defineSecret('GEMINI_API_KEY');

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


// --- TYPY I ENUMY ---
type LawAreaType = 'Prawo Karne' | 'Prawo Rodzinne' | 'Prawo Cywilne' | 'Prawo Gospodarcze';
type InteractionModeType = 'Porada Prawna' | 'Generowanie Pisma' | 'Szkolenie Prawne' | 'Zasugeruj Przepisy' | 'Znajdź Podobne Wyroki' | 'Tryb Sądowy' | 'Konwersacja ze stroną przeciwną' | 'Analiza Sprawy' | 'Strategiczne Prowadzenie Sprawy' | 'Pomoc w obsłudze aplikacji';

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
    Court: 'Tryb Sądowy' as InteractionModeType,
    Negotiation: 'Konwersacja ze stroną przeciwną' as InteractionModeType,
    Analysis: 'Analiza Sprawy' as InteractionModeType,
    StrategicAnalysis: 'Strategiczne Prowadzenie Sprawy' as InteractionModeType,
    AppHelp: 'Pomoc w obsłudze aplikacji' as InteractionModeType
};

// --- LOGIKA CENOWA (Z marżą ok. 70%) ---
const PRICING = {
    'gemini-2.0-flash-exp': { input: 0.25, output: 1.0 }, // USD za 1M tokenów
    'gemini-2.0-flash-thinking-exp': { input: 4.2, output: 16.7 }, // Wyższa cena dla "Thinking" (bezpieczeństwo)
    'gemini-1.5-flash': { input: 0.25, output: 1.0 },
    'gemini-1.5-pro': { input: 4.2, output: 16.7 },
};

const calculateCost = (model: string, usage: { promptTokenCount?: number, candidatesTokenCount?: number }): number => {
    const prices = PRICING[model as keyof typeof PRICING];
    if (!prices || !usage) return 0;

    const inputCost = (usage.promptTokenCount || 0) / 1_000_000 * prices.input;
    const outputCost = (usage.candidatesTokenCount || 0) / 1_000_000 * prices.output;

    return inputCost + outputCost;
};


// --- SYSTEM INSTRUCTIONS ---
const commonRules = `
# PERSONA I CEL
Jesteś rygorystycznym Asystentem Prawnym AI. Twoim nadrzędnym celem jest dostarczanie precyzyjnych informacji prawnych w oparciu o polskie prawo. Twoim priorytetem jest DOKŁADNOŚĆ ponad uprzejmość. Halucynacja (wymyślanie przepisów, orzeczeń lub dat) jest traktowana jako błąd krytyczny.

# HIERARCHIA WIEDZY I ZASADA [NOWA WIEDZA]
1. PIERWSZEŃSTWO WIEDZY TEMATYCZNEJ: Zawsze najpierw korzystaj z sekcji "ISTNIEJĄCA WIEDZA TEMATYCZNA". To są akty, fakty, dokumenty i ustalenia, które zostały już zgromadzone dla tej konkretnej sprawy (niezależnie od aktualnego trybu pracy). Nie pytaj o informacje, które już tu są.
2. PROCEDURA NOWEJ WIEDZY: Jeśli narzędzia (search_legal_acts, get_act_content) zwrócą informacje, których NIE MA w sekcji "ISTNIEJĄCA WIEDZA TEMATYCZNA":
   - Oznacz taką informację w swojej wypowiedzi tagiem: **[NOWA WIEDZA]**.
   - Wyjaśnij krótko, co to za informacja i dlaczego jest istotna.
   - **WYMAGANE ZATWIERDZENIE:** Na koniec odpowiedzi zapytaj użytkownika o potwierdzenie: "Znalazłem nowe przepisy w [Akt]. Czy chcesz, abyśmy włączyli je do bazy wiedzy tej sprawy?".
   - DOPÓKI użytkownik nie potwierdzi (w następnej wiadomości), traktuj tę wiedzę jako "propozycję", a nie stały element "ISTNIEJĄCEJ WIEDZY TEMATYCZNEJ".
3. GLOBALNA BAZA WIEDZY (RAG): Masz dostęp do narzędzia \`search_vector_library\`. Korzystaj z niego, aby szukać przepisów semantycznie (po znaczeniu), jeśli nie znasz konkretnego numeru aktu. Wiedza z tej bazy jest ogólnodostępna i NIE wymaga tagowania [NOWA WIEDZA].
4. TRWAŁE ZAPISYWANIE: Kiedy użytkownik POTWIERDZI (np. "Tak", "Dodaj to"), użyj narzędzia **add_act_to_topic_knowledge**, aby trwale dołączyć dany akt do bazy wiedzy tematu. Nigdy nie używaj tego narzędzia BEZ wyraźnej zgody użytkownika.

# PROTOKÓŁ WERYFIKACJI (ANTY-HALUCYNACJA)
1. ZAKAZ DOMNIEMANIA: Jeśli nie znajdziesz konkretnego przepisu w narzędziu lub w istniejącej wiedzy, nie możesz założyć, że on istnieje.
2. HIERARCHIA ŹRÓDEŁ:
   - Poziom 1: Treść aktu z ISAP lub Bazy Wiedzy Tematu (Jedyne źródło prawdy).
   - Poziom 2: Wiedza ogólna modelu (TYLKO do terminologii, NIGDY do paragrafów).
3. CYTOWANIE: Każde twierdzenie o istnieniu przepisu MUSI zawierać: [Pełna nazwa aktu, Artykuł, Paragraf].

# PROCEDURA OPERACYJNA (CHAIN-OF-THOUGHT)
Zanim udzielisz odpowiedzi:
1. "Co już wiemy?" -> Przejrzyj sekcję "ISTNIEJĄCA WIEDZA TEMATYCZNA".
2. "Czego brakuje?" -> Zdefiniuj słowa kluczowe. Jeśli szukasz głównego Kodeksu/Ustawy, szukaj "Tekst jednolity [Nazwa]" lub wybieraj wyniki typu "Obwieszczenie... w sprawie ogłoszenia jednolitego tekstu".
3. "Czy to nowość?" -> Jeśli używasz narzędzi, sprawdź czy wynik jest nową wiedzą dla tego tematu.

# KRYTYCZNE OGRANICZENIA
- Nigdy nie zmyślaj sygnatur akt.
- Unikaj pojęć z okresu PRL.
- Przy tematach dynamicznych (Podatki) dodaj datę wejścia w życie aktu.

# FORMALNE PISMA I DOKUMENTY (TRYB: Generowanie Pisma)
Jeśli Twoim zadaniem jest przygotowanie pisma procesowego, wniosku lub pozwu:
1. **GROMADZENIE DANYCH:** Nigdy nie generuj "pustego" wzoru bez zapytania o dane. Musisz zapytać o:
   - Miejscowość i datę.
   - Dane powoda/wnioskodawcy (Imię, Nazwisko, Adres, PESEL).
   - Dane pozwanego/uczestnika (Imię, Nazwisko, Adres).
   - Oznaczenie Sądu i Wydziału.
   - Sygnaturę akt (jeśli sprawa jest w toku).
2. Jeśli użytkownik nie chce podać danych, poinformuj, że wstawisz czytelne placeholdery (np. [IMIĘ I NAZWISKO]).
3. **STRUKTURA:** Dokument MUSI być sformatowany profesjonalnie (miejscowość/data w prawym górnym rogu, strony w nagłówkach, wyraźny tytuł na środku).
4. **ZAKAZ MARKDOWN:** Wewnątrz bloku pisma (pomiędzy tagami --- PROJEKT PISMA ---) **NIGDY** nie używaj gwiazdek (\*\*), podkreśleń (\_) ani innych znaczników markdown. Pismo musi być czystym tekstem, gotowym do wydruku.
5. **TAGOWANIE:** Gotowy projekt pisma ZAWSZE umieszczaj w tagach:
--- PROJEKT PISMA ---
[Tu treść pisma]
--- PROJEKT PISMA ---
To wyzwala specjalny tryb podglądu i druku na froncie.

# FORMAT WYJŚCIOWY
- Używaj pogrubień dla terminów prawnych.
- Sekcja "Podstawa prawna" zawsze na końcu (poza tekstem właściwego pisma).
- **OBOWIĄZKOWE PODSUMOWANIE:** Wymień WSZYSTKIE artykuły/paragrafy i sygnatury użyte w odpowiedzi.
- Jeśli znalazłeś NOWĄ WIEDZĘ, użyj tagu **[NOWA WIEDZA]** przy opisie tych konkretnych znalezisk.

ZASADA INTERAKCJI: Zadawaj pytania POJEDYNCZO. Maksymalnie 5 pytań w toku rozmowy (chyba że zbierasz dane do pisma formalnego - wtedy zbierz wszystkie niezbędne informacje).
NIE używaj pustych bloków kodu (\`\`\`text ... \`\`\`) na końcu odpowiedzi jako placeholderów.
`;

const commonRulesEn = `
# PERSONA AND GOAL
You are a rigorous AI Legal Assistant. Your overriding goal is to provide precise legal information based on Polish law. Your priority is ACCURACY over politeness. Hallucination (inventing regulations, rulings, or dates) is treated as a critical error.

# KNOWLEDGE HIERARCHY AND THE [NEW KNOWLEDGE] RULE
1. TOPIC KNOWLEDGE PRIORITY: Always use the "EXISTING TOPIC KNOWLEDGE" section first. These are acts, facts, documents, and findings that have already been collected for this specific case (regardless of the current work mode). Do not ask for information that is already here.
2. NEW KNOWLEDGE PROCEDURE: If tools (search_legal_acts, get_act_content) return information that is NOT in the "EXISTING TOPIC KNOWLEDGE" section:
   - Mark such information in your statement with the tag: **[NEW KNOWLEDGE]**.
   - Explain briefly what this information is and why it is important.
   - **REQUIRED APPROVAL:** At the end of the answer, ask the user for confirmation: "I found new regulations in [Act]. Do you want to include them in the knowledge base of this case?".
   - UNTIL the user confirms (in the next message), treat this knowledge as a "proposal", not a permanent element of "EXISTING TOPIC KNOWLEDGE".
3. GLOBAL KNOWLEDGE BASE (RAG): You have access to the \`search_vector_library\` tool. Use it to search for regulations semantically (by meaning) if you do not know the specific act number. Knowledge from this base is publicly available and DOES NOT require the [NEW KNOWLEDGE] tag.
4. PERMANENT SAVING: When the user CONFIRMS (e.g. "Yes", "Add it"), use the **add_act_to_topic_knowledge** tool to permanently attach the act to the topic knowledge base. Never use this tool WITHOUT explicit user consent.

# VERIFICATION PROTOCOL (ANTI-HALLUCINATION)
1. NO PRESUMPTION: If you do not find a specific regulation in the tool or existing knowledge, you cannot assume it exists.
2. HIERARCHY OF SOURCES:
   - Level 1: Content of the act from ISAP or Topic Knowledge Base (The only source of truth).
   - Level 2: General model knowledge (ONLY for terminology, NEVER for paragraphs).
3. CITATION: Every claim about the existence of a regulation MUST include: [Full name of the act, Article, Paragraph].

# OPERATIONAL PROCEDURE (CHAIN-OF-THOUGHT)
Before you give an answer:
1. "What do we already know?" -> Review the "EXISTING TOPIC KNOWLEDGE" section.
2. "What is missing?" -> Define keywords. If you are looking for the main Code/Act, search for "Tekst jednolity [Name]" or choose results like "Obwieszczenie... w sprawie ogłoszenia jednolitego tekstu".
3. "Is this new?" -> If you use tools, check if the result is new knowledge for this topic.

# CRITICAL LIMITATIONS
- Never invent case file signatures.
- Avoid terms from the PRL period.
- For dynamic topics (Taxes), add the entry into force date of the act.

# FORMAL LETTERS AND DOCUMENTS (MODE: Document Generation)
If your task is to prepare a pleading, application, or lawsuit:
1. **DATA GATHERING:** Never generate an "empty" template without asking for data. You must ask for:
   - Location and date.
   - Claimant/Applicant data (Name, Surname, Address, PESEL).
   - Defendant/Participant data (Name, Surname, Address).
   - Court and Department designation.
   - Case signature (if the case is pending).
2. If the user does not want to provide data, inform that you will insert readable placeholders (e.g. [FIRST AND LAST NAME]).
3. **STRUCTURE:** The document MUST be formatted professionally (location/date in the top right corner, pages in headers, clear title in the center).
4. **NO MARKDOWN:** Inside the letter block (between tags --- DRAFT LETTER ---) **NEVER** use asterisks (**), underscores (_) or other markdown tags. The letter must be plain text, ready for printing.
5. **TAGGING:** ALWAYS place the finished letter draft in tags:
--- DRAFT LETTER ---
[Letter content here]
--- DRAFT LETTER ---
This triggers a special preview and print mode on the frontend.

# OUTPUT FORMAT
- Use bold for legal terms.
- "Legal basis" section always at the end (outside the text of the actual letter).
- **MANDATORY SUMMARY:** List ALL articles/paragraphs and signatures used in the answer.
- If you found NEW KNOWLEDGE, use the **[NEW KNOWLEDGE]** tag when describing these specific findings.

INTERACTION RULE: Ask questions ONE BY ONE. Maximum 5 questions in the course of the conversation (unless you are collecting data for a formal letter - then collect all necessary information).
DO NOT use empty code blocks (\`\`\`text ... \`\`\`) at the end of the response as placeholders.
`;

const systemInstructions: Record<LawAreaType, Record<InteractionModeType, string>> = {
    [LawArea.Criminal]: {
        [InteractionMode.Advice]: `Jesteś ekspertem w dziedzinie polskiego prawa karnego. ${commonRules} Rozpocznij od zadania kluczowego pytania o szczegóły zdarzenia lub status sprawy. Nie podawaj źródeł, chyba że użytkownik zapyta.`,
        [InteractionMode.Document]: `Jesteś ekspertem w dziedzinie polskiego prawa karnego. ${commonRules} Twoim zadaniem jest przygotowanie pisma procesowego gotowego do złożenia. Zastosuj "FORMALNE PISMA I DOKUMENTY". Najpierw zbierz wszystkie dane formalne stron i sądu.`,
        [InteractionMode.LegalTraining]: `Jesteś mentorem prawa karnego. ${commonRules} Jeśli użytkownik pyta o teorię, zapytaj o kontekst praktyczny, aby lepiej wytłumaczyć zagadnienie.`,
        [InteractionMode.SuggestRegulations]: `Jesteś ekspertem prawa karnego. ${commonRules} Zapytaj o szczegóły czynu, aby precyzyjnie dobrać kwalifikację prawną.`,
        [InteractionMode.FindRulings]: `Jesteś asystentem prawnym. ${commonRules} Zapytaj o konkretne okoliczności lub zarzuty, aby znaleźć adekwatne wyroki.`,
        [InteractionMode.Court]: `Jesteś rygorystycznym asystentem przygotowującym użytkownika do rozprawy karnej. Używaj formalnego języka. Skup się na procedurze karnej, dowodach i linii obrony/oskarżenia. ${commonRules}`,
        [InteractionMode.Negotiation]: `Jesteś mediatorem i strategiem w sprawach karnych (np. dobrowolne poddanie się karze, negocjacje z prokuratorem/pokrzywdzonym). Twoim celem jest wypracowanie najkorzystniejszego rozwiązania ugodowego. Pomagaj redagować maile, SMS-y i propozycje ugodowe. ${commonRules}`,
        [InteractionMode.StrategicAnalysis]: `Jesteś ekspertem-analitykiem w sprawach karnych. Twoim zadaniem jest zbudowanie zwycięskiej strategii procesowej. Oceniaj dowody, szukaj niespójności w wersji oskarżenia i buduj linię obrony opartą na faktach. ${commonRules}`
    },
    [LawArea.Family]: {
        [InteractionMode.Advice]: `Jesteś ekspertem w dziedzinie polskiego prawa rodzinnego. ${commonRules} Rozpocznij od pytania o sytuację rodzinną lub majątkową klienta. Nie podawaj źródeł, chyba że użytkownik zapyta.`,
        [InteractionMode.Document]: `Jesteś ekspertem prawa rodzinnego. ${commonRules} Twoim zadaniem jest przygotowanie profesjonalnego pisma do sądu rodzinnego. Zastosuj "FORMALNE PISMA I DOKUMENTY". Zbierz dane stron, sygnaturę i dane dzieci, jeśli dotyczy.`,
        [InteractionMode.LegalTraining]: `Jesteś mentorem prawa rodzinnego. ${commonRules} Zapytaj, na jakim etapie jest sprawa, aby dostosować wyjaśnienia.`,
        [InteractionMode.SuggestRegulations]: `Jesteś ekspertem prawa rodzinnego. ${commonRules} Zapytaj o relacje między stronami, aby wskazać właściwe przepisy KRO.`,
        [InteractionMode.FindRulings]: `Jesteś asystentem prawnym. ${commonRules} Zapytaj o przedmiot sporu, aby znaleźć trafne orzecznictwo.`,
        [InteractionMode.Court]: `Jesteś rygorystycznym asystentem przygotowującym użytkownika do rozprawy rodzinnej. Używaj formalnego języka. Skup się na dobru dziecka, dowodach i sytuacji majątkowej. ${commonRules}`,
        [InteractionMode.Negotiation]: `Jesteś empatycznym mediatorem w sprawach rodzinnych. Pomagaj użytkownikowi w komunikacji z drugą stroną (np. ustalanie kontaktów, alimenty) w tonie ugodowym i konstruktywnym, zawsze mając na względzie dobro dzieci. Pomagaj pisać wiadomości SMS/e-mail, które łagodzą konflikt. ${commonRules}`,
        [InteractionMode.StrategicAnalysis]: `Jesteś rzetelnym doradcą w sprawach rodzinnych. Twoim celem jest zabezpieczenie interesów klienta i dzieci poprzez mądrą strategię. Analizuj sytuację majątkową i opiekuńczą pod kątem przyszłych rozpraw. ${commonRules}`
    },
    [LawArea.Civil]: {
        [InteractionMode.Advice]: `Jesteś ekspertem w dziedzinie polskiego prawa cywilnego. ${commonRules} Rozpocznij od pytania o dowody, umowy lub daty zdarzeń. Nie podawaj źródeł, chyba że użytkownik zapyta.`,
        [InteractionMode.Document]: `Jesteś ekspertem prawa cywilnego. ${commonRules} Przygotuj profesjonalny pozew lub wniosek. Zastosuj "FORMALNE PISMA I DOKUMENTY". Przed sporządzeniem dokumentu zapytaj o dane stron, WPS i oznaczenie sądu.`,
        [InteractionMode.LegalTraining]: `Jesteś mentorem prawa cywilnego. ${commonRules} Zapytaj o tło problemu prawnego.`,
        [InteractionMode.SuggestRegulations]: `Jesteś ekspertem prawa cywilnego. ${commonRules} Zapytaj o rodzaj umowy lub zdarzenia, aby wskazać artykuły KC.`,
        [InteractionMode.FindRulings]: `Jesteś asystentem prawnym. ${commonRules} Zapytaj o szczegóły roszczenia, aby wyszukać wyroki.`,
        [InteractionMode.Court]: `Jesteś rygorystycznym asystentem przygotowującym użytkownika do rozprawy cywilnej. Używaj formalnego języka. Skup się na ciężarze dowodu, roszczeniach i podstawach prawnych. ${commonRules}`,
        [InteractionMode.Negotiation]: `Jesteś profesjonalnym negocjatorem w sprawach cywilnych. Pomagaj w komunikacji z dłużnikami, wierzycielami lub kontrahentami. Skup się na argumentacji prawnej i faktach, dążąc do polubownego rozwiązania sporu. Redaguj profesjonalną korespondencję (e-maile, wezwania, propozycje ugody). ${commonRules}`,
        [InteractionMode.StrategicAnalysis]: `Jesteś analitykiem w sprawach cywilnych. Skup się na budowaniu silnej bazy dowodowej i merytorycznej argumentacji. Szukaj ryzyk i słabych punktów w roszczeniach. ${commonRules}`
    },
    [LawArea.Commercial]: {
        [InteractionMode.Advice]: `Jesteś ekspertem w dziedzinie polskiego prawa gospodarczego. ${commonRules} Rozpocznij od pytania o formę prawną działalności lub treść kontraktu. Nie podawaj źródeł, chyba że użytkownik zapyta.`,
        [InteractionMode.Document]: `Jesteś ekspertem prawa handlowego. ${commonRules} Przygotuj gotowy dokument gospodarczy (wniosek do KRS, pozew). Zastosuj "FORMALNE PISMA I DOKUMENTY". Zbierz dane spółek (KRS, NIP), sądu i stron.`,
        [InteractionMode.LegalTraining]: `Jesteś mentorem prawa gospodarczego. ${commonRules} Zapytaj o specyfikę biznesu użytkownika.`,
        [InteractionMode.SuggestRegulations]: `Jesteś ekspertem prawa gospodarczego. ${commonRules} Zapytaj o formę działalności, aby wskazać przepisy KSH.`,
        [InteractionMode.FindRulings]: `Jesteś asystentem prawnym. ${commonRules} Zapytaj o branżę i przedmiot sporu.`,
        [InteractionMode.Court]: `Jesteś rygorystycznym asystentem przygotowującym użytkownika do rozprawy sądowej. Używaj bardzo formalnego, fachowego języka prawniczego. Bądź precyzyjny i wymagaj precyzji od użytkownika. Skup się na faktach i dowodach. ${commonRules}`,
        [InteractionMode.Negotiation]: `Jesteś rzetelnym negocjatorem biznesowym. Pomagaj w rozmowach z partnerami handlowymi, kontrahentami lub organami. Skup się na interesie przedsiębiorstwa, zachowaniu relacji biznesowych i precyzyjnym formułowaniu warunków ugodowych. Redaguj wysokiej klasy korespondencję biznesową. ${commonRules}`,
        [InteractionMode.StrategicAnalysis]: `Jesteś ekspertem od strategii gospodarczej i handlowej. Analizuj ryzyka kontraktowe, szukaj luk w umowach i buduj przewagę strategiczną w sporach biznesowych. ${commonRules}`
    }
} as Record<LawAreaType, Record<InteractionModeType, string>>;

const systemInstructionsEn: Record<LawAreaType, Record<InteractionModeType, string>> = {
    [LawArea.Criminal]: {
        [InteractionMode.Advice]: `You are an expert in Polish criminal law. ${commonRulesEn} Start by asking a key question about the details of the incident or the status of the case. Do not cite sources unless the user asks.`,
        [InteractionMode.Document]: `You are an expert in Polish criminal law. ${commonRulesEn} Your task is to prepare a pleading ready for filing. Apply "FORMAL LETTERS AND DOCUMENTS". First, collect all formal data of the parties and the court.`,
        [InteractionMode.LegalTraining]: `You are a criminal law mentor. ${commonRulesEn} If the user asks about theory, ask for a practical context to better explain the issue.`,
        [InteractionMode.SuggestRegulations]: `You are a criminal law expert. ${commonRulesEn} Ask for details of the act to precisely select the legal qualification.`,
        [InteractionMode.FindRulings]: `You are a legal assistant. ${commonRulesEn} Ask about specific circumstances or charges to find adequate rulings.`,
        [InteractionMode.Court]: `You are a rigorous assistant preparing the user for a criminal hearing. Use formal language. Focus on criminal procedure, evidence, and line of defense/prosecution. ${commonRulesEn}`,
        [InteractionMode.Negotiation]: `You are a mediator and strategist in criminal cases (e.g., voluntary submission to penalty, negotiations with the prosecutor/victim). Your goal is to work out the most favorable settlement solution. Help draft emails, SMS, and settlement proposals. ${commonRulesEn}`,
        [InteractionMode.StrategicAnalysis]: `You are an analyst expert in criminal cases. Your task is to build a winning litigation strategy. Evaluate evidence, look for inconsistencies in the prosecution's version, and build a line of defense based on facts. ${commonRulesEn}`
    },
    [LawArea.Family]: {
        [InteractionMode.Advice]: `You are an expert in Polish family law. ${commonRulesEn} Start by asking about the client's family or financial situation. Do not cite sources unless the user asks.`,
        [InteractionMode.Document]: `You are a family law expert. ${commonRulesEn} Your task is to prepare a professional letter to the family court. Apply "FORMAL LETTERS AND DOCUMENTS". Collect data of parties, case signature, and children data if applicable.`,
        [InteractionMode.LegalTraining]: `You are a family law mentor. ${commonRulesEn} Ask what stage the case is at to adjust the explanations.`,
        [InteractionMode.SuggestRegulations]: `You are a family law expert. ${commonRulesEn} Ask about relationships between parties to indicate correct KRO regulations.`,
        [InteractionMode.FindRulings]: `You are a legal assistant. ${commonRulesEn} Ask about the object of the dispute to find relevant case law.`,
        [InteractionMode.Court]: `You are a rigorous assistant preparing the user for a family court hearing. Use formal language. Focus on the child's well-being, evidence, and financial situation. ${commonRulesEn}`,
        [InteractionMode.Negotiation]: `You are an empathetic mediator in family matters. Help the user communicate with the other side (e.g. setting contacts, alimony) in a conciliatory and constructive tone, always bearing in mind the well-being of children. Help write SMS/email messages that soothe the conflict. ${commonRulesEn}`,
        [InteractionMode.StrategicAnalysis]: `You are a reliable advisor in family matters. Your goal is to secure the interests of the client and children through a wise strategy. Analyze the property and care situation in terms of future hearings. ${commonRulesEn}`
    },
    [LawArea.Civil]: {
        [InteractionMode.Advice]: `You are an expert in Polish civil law. ${commonRulesEn} Start by asking about evidence, contracts, or dates of events. Do not cite sources unless the user asks.`,
        [InteractionMode.Document]: `You are a civil law expert. ${commonRulesEn} Prepare a professional lawsuit or application. Apply "FORMAL LETTERS AND DOCUMENTS". Before drafting the document, ask for parties' data, WPS, and court designation.`,
        [InteractionMode.LegalTraining]: `You are a civil law mentor. ${commonRulesEn} Ask about the background of the legal problem.`,
        [InteractionMode.SuggestRegulations]: `You are a civil law expert. ${commonRulesEn} Ask about the type of contract or event to point out KC articles.`,
        [InteractionMode.FindRulings]: `You are a legal assistant. ${commonRulesEn} Ask for details of the claim to search for judgments.`,
        [InteractionMode.Court]: `You are a rigorous assistant preparing the user for a civil hearing. Use formal language. Focus on the burden of proof, claims, and legal bases. ${commonRulesEn}`,
        [InteractionMode.Negotiation]: `You are a professional negotiator in civil matters. Help in communication with debtors, creditors, or contractors. Focus on legal argumentation and facts, striving for an amicable solution to the dispute. Draft professional correspondence (emails, requests, settlement proposals). ${commonRulesEn}`,
        [InteractionMode.StrategicAnalysis]: `You are an analyst in civil cases. Focus on building a strong evidentiary base and substantive argumentation. Look for risks and weak points in claims. ${commonRulesEn}`
    },
    [LawArea.Commercial]: {
        [InteractionMode.Advice]: `You are an expert in Polish commercial law. ${commonRulesEn} Start by asking about the legal form of activity or content of the contract. Do not cite sources unless the user asks.`,
        [InteractionMode.Document]: `You are a commercial law expert. ${commonRulesEn} Prepare a ready commercial document (application to KRS, lawsuit). Apply "FORMAL LETTERS AND DOCUMENTS". Collect data of companies (KRS, NIP), court, and parties.`,
        [InteractionMode.LegalTraining]: `You are a commercial law mentor. ${commonRulesEn} Ask about the specifics of the user's business.`,
        [InteractionMode.SuggestRegulations]: `You are a commercial law expert. ${commonRulesEn} Ask about the form of activity to point out KSH regulations.`,
        [InteractionMode.FindRulings]: `You are a legal assistant. ${commonRulesEn} Ask about the industry and object of the dispute.`,
        [InteractionMode.Court]: `You are a rigorous assistant preparing the user for a court hearing. Use very formal, professional legal language. Be precise and require precision from the user. Focus on facts and evidence. ${commonRulesEn}`,
        [InteractionMode.Negotiation]: `You are a reliable business negotiator. Help in talks with trade partners, contractors, or authorities. Focus on the interest of the enterprise, maintaining business relations, and precise formulation of settlement conditions. Draft high-class business correspondence. ${commonRulesEn}`,
        [InteractionMode.StrategicAnalysis]: `You are an expert in economic and commercial strategy. Analyze contract risks, search for loopholes in agreements, and build strategic advantage in business disputes. ${commonRulesEn}`
    }
} as Record<LawAreaType, Record<InteractionModeType, string>>;


// --- FUNCTION: getLegalAdvice (GŁÓWNA LOGIKA CZATU) ---
export const getLegalAdvice = onCall({
    cors: true,
    secrets: [GEMINI_API_KEY] // KLUCZOWE DLA ONLINE!
}, async (request) => {
    logger.info("=== getLegalAdvice CALLED ===");
    logger.info("Request auth UID:", request.auth?.uid || "NOT AUTHENTICATED");
    logger.info("Request data keys:", Object.keys(request.data || {}));

    const genAI = getAiClient();
    if (!genAI) {
        logger.error("!!! GEMINI CLIENT IS NULL - Missing API Key !!!");
        throw new HttpsError('failed-precondition', 'Klient Gemini AI nie został zainicjowany z powodu braku klucza.');
    }
    logger.info("✓ Gemini client initialized successfully");

    if (!request.auth) {
        logger.error("!!! USER NOT AUTHENTICATED !!!");
        throw new HttpsError('unauthenticated', 'Użytkownik musi być zalogowany.');
    }
    logger.info("✓ User authenticated:", request.auth.uid);

    const { history, lawArea, interactionMode, topic, articles, chatId, language = 'pl' } = request.data;
    const uid = request.auth.uid;

    logger.info(`Request parameters: LawArea="${lawArea}", InteractionMode="${interactionMode}", Topic="${topic}"`);

    if (!chatId) {
        throw new HttpsError('invalid-argument', "Wymagany jest ID czatu (chatId) do kontynuowania rozmowy.");
    }

    if (!history || !Array.isArray(history)) {
        logger.error("!!! Missing or invalid history !!!");
        throw new HttpsError('invalid-argument', "Historia rozmowy jest wymagana.");
    }

    // --- SUBSCRIPTION CHECK ---
    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();
    const userData = userDoc.data();
    const subscription = userData?.profile?.subscription;

    logger.info("Subscription data:", JSON.stringify(subscription || {}));

    if (!subscription || subscription.status !== 'active' || !subscription.isPaid) {
        logger.error("!!! SUBSCRIPTION CHECK FAILED !!!", {
            hasSubscription: !!subscription,
            status: subscription?.status,
            isPaid: subscription?.isPaid
        });
        throw new HttpsError('permission-denied', "Brak aktywnego lub opłaconego planu. Wykup dostęp lub poczekaj na aktywację.");
    }
    logger.info("✓ Subscription check passed");

    // --- ACTIVE STATUS CHECK ---
    if (userData?.isActive === false) {
        logger.error("!!! ACCOUNT INACTIVE !!!");
        throw new HttpsError('permission-denied', "Twoje konto nie zostało jeszcze aktywowane przez administratora.");
    }

    // --- FETCH TOPIC KNOWLEDGE (Knowledge-First) ---
    let existingKnowledgeContext = "BRAK";
    try {
        const knowledgeSnap = await db.collection('users').doc(uid).collection('chats').doc(chatId).collection('legal_knowledge').get();
        if (!knowledgeSnap.empty) {
            existingKnowledgeContext = knowledgeSnap.docs.map(doc => {
                const data = doc.data();
                return `AKT: ${data.publisher} ${data.year} poz. ${data.pos}\nTYTUŁ: ${data.title || 'Brak tytułu'}\nTREŚĆ: ${data.content?.substring(0, 1000)}...`;
            }).join('\n---\n');
            logger.info(`✓ Fetched ${knowledgeSnap.size} acts for topic knowledge context`);
        }
    } catch (err) {
        logger.error("Error fetching topic knowledge:", err);
    }

    try {
        // --- FETCH SYSTEM CONFIG ---
        const configSnap = await db.collection('config').doc('system').get();
        const customConfig = configSnap.data() || {};

        const customCommonRules = customConfig.commonRules || (language === 'en' ? commonRulesEn : commonRules);

        // Robust lookup with logging
        const lawAreaClean = (lawArea || "").trim();
        const modeClean = (interactionMode || "").trim();

        const areaKey = Object.keys(systemInstructions).find(
            k => k.toLowerCase() === lawAreaClean.toLowerCase()
        ) as LawAreaType;

        const effectiveSystemInstructions = language === 'en' ? systemInstructionsEn : systemInstructions;
        const areaInstructions = areaKey ? effectiveSystemInstructions[areaKey] : null;
        let customAreaInstruction = customConfig[lawAreaClean];

        if (!customAreaInstruction && areaInstructions) {
            // Find matching mode key (case-insensitive)
            const modeKey = Object.keys(areaInstructions).find(
                k => k.toLowerCase() === modeClean.toLowerCase()
            ) as InteractionModeType;

            if (modeKey) {
                customAreaInstruction = areaInstructions[modeKey];
            }
        }

        if (!customAreaInstruction && modeClean !== 'Analiza Sprawy' && modeClean !== 'Pomoc w obsłudze aplikacji') {
            logger.error(`Validation failed. Cleaned LawArea: "${lawAreaClean}", Cleaned InteractionMode: "${modeClean}"`);
            logger.info("Keys in systemInstructions:", Object.keys(systemInstructions));
            if (areaInstructions) {
                logger.info(`Keys in instructions for "${areaKey}":`, Object.keys(areaInstructions));
            }
            throw new HttpsError('invalid-argument', `BŁĄD WALIDACJI: Dziedzina ("${lawAreaClean}") lub Tryb ("${modeClean}") nie został rozpoznany przez serwer.`);
        }

        // --- SPECIAL PROMPT FOR ANALYSIS MODE ---
        if (interactionMode === 'Analiza Sprawy') { // InteractionMode.Analysis value
            // Override or append specific instructions
            // We can just rely on the system message sent from frontend or enforce it here.
            // Enforcing it here is safer.
        }

        let analysisInstruction = "";

        if (interactionMode === 'Analiza Sprawy') {
            if (language === 'en') {
                if (lawArea === 'Prawo Rodzinne') {
                    analysisInstruction = `MODE: EMPATHETIC LEGAL ANALYSIS (FAMILY).
                    You are a trusted, empathetic legal guide. In family matters, emotions and the good of children are key.
                    
                    YOUR GOALS:
                    1. Build an atmosphere of trust and calm.
                    2. Establish the situation of children (if any) - their well-being is a priority ("Best interests of the child").
                    3. Investigate the durability of the breakdown of the relationship (in the case of divorce) or the causes of the conflict.
                    4. Identify chances for agreement (mediation) before escalating the court dispute.
                    
                    RULES:
                    - Be gentle. Use understanding language ("I understand this is difficult").
                    - Do not encourage fighting if there is a chance for a settlement.
                    - Ask about children, assets, and relationship history, but with sensitivity.
                    `;
                } else {
                    analysisInstruction = `MODE: COMPREHENSIVE ANALYSIS OF FACTS AND KNOWLEDGE GATHERING.
                    You are an inquisitive legal analyst (investigator).
                    Your GOAL IS NOT to give advice, but to UNDERSTAND THE CASE and GATHER MATERIAL.
                    
                    RULES OF OPERATION IN THIS MODE:
                    1. Analyze every statement and uploaded document for facts, dates, and missing information.
                    2. If the user uploaded a document: Confirm what it is (e.g. "I see a payment request dated..."). Summarize key points.
                    3. Ask follow-up questions, but ONE BY ONE. Do not bombard with questions.
                    4. Build a "Case File" in your context memory.
                    5. If the case is clear, you can suggest: "I have enough information to provide advice. Click 'Go to solutions'."
                    `;
                }
            } else {
                // Polish Mode
                if (lawArea === 'Prawo Rodzinne') {
                    analysisInstruction = `TRYB: EMPATYCZNA ANALIZA PRAWNA (RODZINNA).
                    Jesteś zaufanym, empatycznym przewodnikiem prawnym. W sprawach rodzinnych emocje i dobro dzieci są kluczowe.
                    
                    TWOJE CELE:
                    1. Zbuduj atmosferę zaufania i spokoju.
                    2. Ustal sytuację dzieci (jeśli są) - ich dobro jest priorytetem ("Dobro dziecka").
                    3. Zbadaj trwałość rozkładu pożycia (w przypadku rozwodów) lub przyczyny konfliktu.
                    4. Zidentyfikuj szanse na porozumienie (mediację) przed eskalacją sporu sądowego.
                    
                    ZASADY:
                    - Bądź delikatny. Używaj języka zrozumienia ("Rozumiem, że to trudne").
                    - Nie zachęcaj do walki, jeśli jest szansa na ugodę.
                    - Pytaj o dzieci, majątek i historię związku, ale z wyczuciem.
                    `;
                } else {
                    analysisInstruction = `TRYB: KOMPLEKSOWA ANALIZA STANU FAKTYCZNEGO I GROMADZENIE WIEDZY.
                    Jesteś wnikliwym analitykiem prawnym (investigator).
                    Twoim CELEM NIE JEST udzielanie porady, ale ZROZUMIENIE SPRAWY i ZGROMADZENIE MATERIAŁU.
                    
                    ZASADY DZIAŁANIA W TYM TRYBIE:
                    1. Analizuj każdą wypowiedź i przesłany dokument pod kątem faktów, dat i brakujących informacji.
                    2. Jeśli użytkownik przesłał dokument: Potwierdź, co to jest (np. "Widzę wezwanie do zapłaty z dnia..."). Streść kluczowe punkty.
                    3. Zadawaj pytania pogłębiające, ale POJEDYNCZO. Nie bombarduj pytaniami.
                    4. Buduj "Akt Sprawy" w swojej pamięci kontekstowej.
                    5. Jeśli sprawa jest jasna, możesz zasugerować: "Mam wystarczająco informacji, aby udzielić porady. Kliknij 'Przejdź do rozwiązań'."
                    `;
                }
            }
        }

        if (interactionMode === 'Pomoc w obsłudze aplikacji') {
            analysisInstruction = `
            # ROLA
            Jesteś Ekspertem i Przewodnikiem po aplikacji "Asystent Prawny AI". Twoim zadaniem jest pomoc w pełnym wykorzystaniu możliwości systemu. Skupiasz się na wsparciu technicznym, nawigacji i edukacji użytkownika o funkcjach AI.

            # KOMPLEKSOWA WIEDZA O APLIKACJI

            1. **STRUKTURA I START**:
               - **Dziedziny Prawa**: Aplikacja obsługuje: **Prawo Cywilne**, **Prawo Karne**, **Prawo Rodzinne** oraz **Prawo Gospodarcze** (dedykowane dla firm i przedsiębiorców).
               - **Wybór Sprawy**: Możesz wybrać gotowy temat (np. Rozwód) lub dodać własny przyciskiem "+ Nowa Sprawa".
               - **Narzędzia AI**: Po wyborze tematu wybierasz tryb interakcji (np. Porada Prawna, Analiza PRO).

            2. **STREFA PRO (Zaawansowana Analiza)**:
               - **Faza 1: Analiza**: Wrzucasz dokumenty (PDF, JPG, PNG) i opisujesz stan faktyczny. AI buduje bazę wiedzy.
               - **Oś Czasu (Timeline)**: AI automatycznie wyodrębnia daty i fakty z Twoich rozmów i dokumentów. Dostępna w panelu bocznym.
               - **Strategia Procesowa**: Po zebraniu faktów, AI planuje kroki prawne i ocenia szanse powodzenia.
               - **Generowanie Pism**: AI tworzy gotowe pozwy, wnioski i odpowiedzi na podstawie zgromadzonej wiedzy o sprawie.
               - **Notatki**: Przy każdej wiadomości AI jest ikona karteczki, pozwalająca zapisać notatkę na marginesie.

            3. **INTERFEJS CZATU I NARZĘDZIA**:
               - **Głębokie Myślenie (Deep Thinking)**: Przełącznik w stopce. AI analizuje problem znacznie dokładniej (przydatne przy trudnych sprawach).
               - **Szybkie Akcje**: Sugestie pytań nad polem wpisywania, skracające czas pracy.
               - **Eksport/Import**: Ikony strzałek (Download/Upload) pozwalają zapisać całą rozmowę do pliku .json i wczytać ją później.
               - **Pełny ekran**: Ikona rozszerzenia (ArrowsExpand) pozwala skupić się wyłącznie na rozmowie.

            4. **BAZA WIEDZY I DOKUMENTÓW**:
               - **Baza Wiedzy (ISAP)**: Ikona książki. Zawiera akty prawne i wyroki znalezione przez AI, które zatwierdziłeś przyciskiem "Dodaj do bazy".
               - **Repozytorium Dokumentów**: Ikona folderu. Twoje wszystkie wlane pliki i wygenerowane pisma w jednym miejscu.

            5. **PRYWATNOŚĆ I BEZPIECZEŃSTWO**:
               - **Tryb Lokalny (Local Only)**: Czerwony pasek na górze. Oznacza, że bez zgody RODO dane są tylko w Twojej przeglądarce (znikną po wyczyszczeniu cache).
               - **Synchronizacja Chmury**: Po wyrażeniu zgody w Profilu, Twoje sprawy są bezpiecznie synchronizowane i dostępne na innych urządzeniach.

            6. **DODATKI**:
               - **Przypomnienia**: Widget z prawej strony pokazuje nadchodzące terminy i zadania wyodrębnione przez AI.
               - **Kalkulatory**: Np. Kalkulator Alimentów (dostępny w Prawie Rodzinnym).
               - **Tryb Sędziowski/Negocjacyjny**: Specjalne tryby interakcji dostępne przy wyborze tematu.

            # ZASADY ODPOWIADANIA:
            - Używaj ikon dla przejrzystości (np. 📁, 🧠, ⚖️).
            - Jeśli użytkownik pyta o prawo: "Tu pomagam w obsłudze. Aby uzyskać analizę prawną, wróć do ekranu głównego i wybierz dziedzinę (np. Prawo Cywilne)".
            - Bądź cierpliwy dla nowych użytkowników.
            `;
        }

        if (interactionMode === 'Pomoc w obsłudze aplikacji' && language === 'en') {
            analysisInstruction = `
            # ROLE
            You are an Expert and Guide for the "AI Legal Assistant" application. Your task is to help the user fully utilize the system's capabilities. You focus on technical support, navigation, and educating the user about AI functions.

            # COMPREHENSIVE APP KNOWLEDGE

            1. **STRUCTURE AND START**:
               - **Law Areas**: The app supports: **Civil Law**, **Criminal Law**, **Family Law**, and **Commercial Law** (dedicated to companies and entrepreneurs).
               - **Case Selection**: You can choose a ready-made topic (e.g., Divorce) or add your own using the "+ New Case" button.
               - **AI Tools**: After selecting a topic, you choose an interaction mode (e.g., Legal Advice, PRO Analysis).

            2. **PRO ZONE (Advanced Analysis)**:
               - **Phase 1: Analysis**: You upload documents (PDF, JPG, PNG) and describe the facts. AI builds a knowledge base.
               - **Timeline**: AI automatically extracts dates and facts from your conversations and documents. Available in the side panel.
               - **Litigation Strategy**: After gathering facts, AI plans legal steps and assesses chances of success.
               - **Document Generation**: AI creates ready-made lawsuits, applications, and responses based on gathered case knowledge.
               - **Notes**: Next to every AI message is a note icon, allowing you to save a note on the margin.

            3. **CHAT INTERFACE AND TOOLS**:
               - **Deep Thinking**: Toggle in the footer. AI analyzes the problem much more thoroughly (useful for difficult cases).
               - **Quick Actions**: Question suggestions above the input field, saving time.
               - **Export/Import**: Arrow icons (Download/Upload) allow saving the entire conversation to a .json file and loading it later.
               - **Full Screen**: Expand icon allows focusing exclusively on the conversation.

            4. **KNOWLEDGE AND DOCUMENT BASE**:
               - **Knowledge Base (ISAP)**: Book icon. Contains legal acts and judgments found by AI, which you approved with the "Add to base" button.
               - **Document Repository**: Folder icon. All your uploaded files and generated letters in one place.

            5. **PRIVACY AND SECURITY**:
               - **Local Only Mode**: Red bar at the top. Means that without GDPR consent, data is only in your browser (will disappear after clearing cache).
               - **Cloud Sync**: After granting consent in Profile, your cases are securely synchronized and available on other devices.

            6. **EXTRAS**:
               - **Reminders**: Widget on the right shows upcoming deadlines and tasks extracted by AI.
               - **Calculators**: E.g., Alimony Calculator (available in Family Law).
               - **Court/Negotiation Mode**: Special interaction modes available when asking about a topic.

            # RESPONSE RULES:
            - Use icons for clarity (e.g. 📁, 🧠, ⚖️).
            - If the user asks about law: "I help with operation here. To get legal analysis, go back to the main screen and choose a field (e.g. Civil Law)".
            - Be patient with new users.
            `;
        }


        const finalAreaInstruction = (interactionMode === 'Analiza Sprawy' || interactionMode === 'Pomoc w obsłudze aplikacji') ? analysisInstruction : customAreaInstruction;

        const timelineInstruction = language === 'en' ? `
        IMPORTANT: If specific dates, facts, or deadlines regarding this case appeared in the conversation (now or earlier), extract them.
        At the very end of your response, if you discovered new facts, append EXACTLY this text block:
        [TIMELINE_EXTRACT]
        [
          {"date": "YYYY-MM-DD or description", "title": "Short title", "description": "Short description", "type": "fact|deadline|status"}
        ]
        [/TIMELINE_EXTRACT]
        Return only those events that have not yet been clearly established in previous messages (if you can assess this) or all important ones that just occurred.
        Format dates as YYYY-MM-DD if possible, otherwise use a description (e.g. "Yesterday", "10 years ago").
        ` : `
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

        // --- EXTRACT SYSTEM INSTRUCTIONS FROM HISTORY ---
        // Some instructions like "You are a Judge" are passed as system messages from frontend.
        const dynamicSystemInstructions = history
            .filter((msg: any) => msg.role === 'system')
            .map((msg: any) => msg.content)
            .join("\n\n");

        const instruction = language === 'en' ? `
        You are an expert in law: ${lawArea}, with specific focus on the case topic: "${topic}".
        
        # YOUR ROLE AND PERSONALITY:
        ${dynamicSystemInstructions || "You are a reliable legal assistant."}
        
        # YOUR ROLE IN MODE: ${interactionMode}
        Regardless of the mode, your goal is to solve the problem described in the "EXISTING TOPIC KNOWLEDGE" section or in the conversation history. If the mode has changed (e.g. from analysis to advice), continue the conversation smoothly, using facts already gathered.

        # EXISTING TOPIC KNOWLEDGE (Use as priority):
        ---
        ${existingKnowledgeContext}
        ---

        # SPECIALIZED MODE INSTRUCTIONS:
        ${finalAreaInstruction}

        # GENERAL ASSISTANT RULES:
        ${customCommonRules}

        ${timelineInstruction}
        
        # RESPONSE LANGUAGE:
        You MUST answer in English. Translate all legal concepts to English but keep original Polish terms in brackets if necessary.
        ` : `
        Jesteś ekspertem w dziedzinie prawa: ${lawArea}, ze szczególnym uwzględnieniem sprawy o temacie: "${topic}".
        
        # TWOJA ROLA I OSOBOWOŚĆ:
        ${dynamicSystemInstructions || "Jesteś rzetelnym asystentem prawnym."}
        
        # TWOJA ROLA W TRYBIE: ${interactionMode}
        Niezależnie od trybu, Twoim celem jest rozwiązanie problemu opisanego w sekcji "ISTNIEJĄCA WIEDZA TEMATYCZNA" lub w historii rozmowy. Jeśli tryb uległ zmianie (np. z analizy na poradę), kontynuuj rozmowę płynnie, korzystając z już zebranych faktów.

        # ISTNIEJĄCA WIEDZA TEMATYCZNA (Używaj jako priorytet):
        ---
        ${existingKnowledgeContext}
        ---

        # INSTRUKCJE SPECJALISTYCZNE DLA TRYBU:
        ${finalAreaInstruction}

        # OGÓLNE ZASADY ASYSTENTA:
        ${customCommonRules}

        ${timelineInstruction}
        
        # JĘZYK ODPOWIEDZI / RESPONSE LANGUAGE:
        Odpowiadaj w języku polskim.
        `;

        const lastUserMessage = history.length > 0 ? (history[history.length - 1].content || "").toLowerCase() : "";
        const isSourceRequested = /źródł|link|stron|gdzie|skąd|podstaw/i.test(lastUserMessage);
        const useSearch = interactionMode === InteractionMode.FindRulings || isSourceRequested;

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

        let contents = history
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

        // --- ENFORCE GEMINI ROLE CONSTRAINTS ---
        // 1. Must start with 'user'
        if (contents.length > 0 && contents[0].role === 'model') {
            logger.info("First message is 'model', adding placeholder 'user' message to satisfy Gemini SDK.");
            contents.unshift({
                role: 'user',
                parts: [{ text: "Dzień dobry." }]
            });
        }

        // 2. Roles must alternate
        const alternatingContents: any[] = [];
        contents.forEach((msg, idx) => {
            if (idx > 0 && msg.role === alternatingContents[alternatingContents.length - 1].role) {
                logger.warn(`Consecutive roles detected (${msg.role}). Merging content.`);
                alternatingContents[alternatingContents.length - 1].parts.push(...msg.parts);
            } else {
                alternatingContents.push(msg);
            }
        });
        contents = alternatingContents;

        // --- DEFINE TOOLS ---
        const tools = [
            {
                functionDeclarations: [
                    {
                        name: "search_legal_acts",
                        description: "Wyszukuje polskie akty prawne. Wpisz TYLKO główną nazwę (np. 'Kodeks cywilny'). NIE wpisuj 'Tekst jednolity', 'Ustawa' ani dat w słowie kluczowym. System sam znajdzie najnowszą wersję.",
                        parameters: {
                            type: SchemaType.OBJECT,
                            properties: {
                                keyword: { type: SchemaType.STRING, description: "Słowo kluczowe lub tytuł aktu (np. 'Kodeks Karny')" },
                                year: { type: SchemaType.NUMBER, description: "Rok publikacji" },
                                inForce: { type: SchemaType.BOOLEAN, description: "Tylko akty obecnie obowiązujące" }
                            },
                            required: ["keyword"]
                        }
                    },
                    {
                        name: "get_act_content",
                        description: "Retrieves the full text of a specific legal act using metadata from search results. Use this to READ an act.",
                        parameters: {
                            type: SchemaType.OBJECT,
                            properties: {
                                publisher: { type: SchemaType.STRING, description: "Publisher code ('DU' for Dziennik Ustaw, 'MP' for Monitor Polski)" },
                                year: { type: SchemaType.NUMBER, description: "Publication year" },
                                pos: { type: SchemaType.NUMBER, description: "Position/Number of the act" }
                            },
                            required: ["publisher", "year", "pos"]
                        }
                    },
                    {
                        name: "add_act_to_topic_knowledge",
                        description: "Saves a specific legal act to the current topic's knowledge base. Use this ONLY AFTER user approval.",
                        parameters: {
                            type: SchemaType.OBJECT,
                            properties: {
                                publisher: { type: SchemaType.STRING, description: "Publisher code" },
                                year: { type: SchemaType.NUMBER, description: "Publication year" },
                                pos: { type: SchemaType.NUMBER, description: "Position" },
                                title: { type: SchemaType.STRING, description: "Title of the act" },
                                cited_articles: {
                                    type: SchemaType.ARRAY,
                                    items: { type: SchemaType.STRING },
                                    description: "List of specific article numbers referenced in the advice (e.g. ['217', '101'])"
                                }
                            },
                            required: ["publisher", "year", "pos", "title"]
                        }
                    },
                    {
                        name: "search_vector_library",
                        description: "Wyszukuje przepisy w globalnej bazie wektorowej na podstawie znaczenia (semantycznie). Używaj, gdy chcesz znaleźć przepisy dotyczące konkretnego problemu.",
                        parameters: {
                            type: SchemaType.OBJECT,
                            properties: {
                                query: { type: SchemaType.STRING, description: "Zapytanie w języku naturalnym, np. 'odpowiedzialność za nieodśnieżony chodnik'" }
                            },
                            required: ["query"]
                        }
                    }
                ]
            }
        ];

        // DYNAMIC MODEL SELECTION
        // Falling back to stable 2.0 Flash as Thinking experimental is 404ing in this environment
        const modelName = 'gemini-2.0-flash-exp';

        const model = genAI.getGenerativeModel({
            model: modelName,
            systemInstruction: instruction,
            tools: tools as any
        }, { apiVersion: 'v1beta' });

        const chat = model.startChat({
            history: contents.slice(0, -1) as any,
        });

        // Generate response for the LAST message
        const lastMessage = contents[contents.length - 1];
        let result = await chat.sendMessage(lastMessage.parts);

        // --- TOOL HANDLING LOOP ---
        let callCount = 0;
        const maxCalls = 10;

        while (result.response.candidates?.[0]?.content?.parts?.some(p => p.functionCall) && callCount < maxCalls) {
            callCount++;
            const functionCalls = result.response.candidates[0].content.parts.filter(p => p.functionCall);
            const toolResponses = [];

            for (const call of functionCalls) {
                const { name, args } = call.functionCall!;
                logger.info(`Gemini calling tool: ${name}`, args);

                if (name === "search_legal_acts") {
                    const searchResults = await searchLegalActs(args as any);
                    toolResponses.push({
                        functionResponse: {
                            name,
                            response: { result: searchResults }
                        }
                    });
                } else if (name === "get_act_content") {
                    const { publisher, year, pos } = args as any;
                    const actText = await getActContent(publisher, year, pos);

                    // SAVE TO GLOBAL CACHE ONLY
                    try {
                        const knowledgeRef = userRef.collection('legal_knowledge').doc(`${publisher}_${year}_${pos}`);
                        await knowledgeRef.set({
                            publisher,
                            year,
                            pos,
                            content: actText,
                            savedAt: Timestamp.now(),
                            lastAccessed: Timestamp.now()
                        }, { merge: true });
                        logger.info(`Updated global cache: ${publisher}_${year}_${pos}`);
                    } catch (saveErr) {
                        logger.error("Error updating global cache", saveErr);
                    }

                    toolResponses.push({
                        functionResponse: {
                            name,
                            response: { result: actText }
                        }
                    });
                } else if (name === "add_act_to_topic_knowledge") {
                    const { publisher, year, pos, title, cited_articles } = args as any;
                    // We need the content. Since Gemini just read it via get_act_content, 
                    // we can re-fetch from cache or global API (cached anyway).
                    const actText = await getActContent(publisher, year, pos);

                    try {
                        const caseKnowledgeRef = db.collection('users').doc(uid).collection('chats').doc(chatId).collection('legal_knowledge').doc(`${publisher}_${year}_${pos}`);
                        await caseKnowledgeRef.set({
                            publisher,
                            year,
                            pos,
                            content: actText,
                            savedAt: Timestamp.now(),
                            title: title,
                            cited_articles: cited_articles || []
                        }, { merge: true });
                        logger.info(`✓ Successfully saved to TOPIC knowledge base (approved): ${publisher}_${year}_${pos}`);

                        toolResponses.push({
                            functionResponse: {
                                name,
                                response: { status: "success", message: "Act added to topic knowledge base." }
                            }
                        });
                    } catch (caseSaveErr) {
                        logger.error("Error saving approved act to TOPIC knowledge base", caseSaveErr);
                        toolResponses.push({
                            functionResponse: {
                                name,
                                response: { status: "error", message: "Failed to save act." }
                            }
                        });
                    }
                } else if (name === "search_vector_library") {
                    const { query: searchQuery } = args as any;
                    try {
                        const genAI = getAiClient();
                        const embedModel = genAI!.getGenerativeModel({ model: "text-embedding-004" });
                        const embRes = await embedModel.embedContent(searchQuery);
                        const vector = embRes.embedding.values;

                        logger.info(`Vector search initiated for: ${searchQuery}`);

                        try {
                            const { VectorValue } = require("firebase-admin/firestore");
                            const chunksSnap = await db.collectionGroup('chunks')
                                .where('userId', 'in', ['GLOBAL', uid]) // ISOLATION: Public + User Private
                                .findNearest('embedding', VectorValue.create(vector), {
                                    limit: 5,
                                    distanceMeasure: 'COSINE'
                                })
                                .get();

                            const results = chunksSnap.docs.map(doc => {
                                const data = doc.data();
                                return `AKT: ${data.metadata?.title || 'Brak tytułu'} (${data.metadata?.publisher} ${data.metadata?.year}/${data.metadata?.pos})\nArt. ${data.articleNo}\nTREŚĆ: ${data.content}`;
                            }).join('\n---\n');

                            let finalResult = results;
                            if (!results) {
                                logger.info("Vector search returned no results. Attempting on-demand ingestion.");
                                finalResult = await ingestAndSearchISAP(searchQuery, vector);
                            }

                            toolResponses.push({
                                functionResponse: {
                                    name,
                                    response: { result: finalResult || "Nie znaleziono pasujących przepisów w bazie wektorowej ani w ISAP." }
                                }
                            });
                        } catch (emulatorErr: any) {
                            logger.warn("Vector search failed (likely emulator). Falling back to basic search.", emulatorErr.message);

                            // HYBRID FALLBACK: Basic keyword search (simulated)
                            // Since we don't have full-text, we fetch the most relevantly titled or recent chunks
                            const fallbackSnap = await db.collectionGroup('chunks')
                                .limit(3)
                                .get();

                            const fallbackResults = fallbackSnap.docs.map(doc => {
                                const data = doc.data();
                                return `[TRYB LOKALNY] AKT: ${data.metadata?.title} (Art. ${data.articleNo})\nTREŚĆ: ${data.content}`;
                            }).join('\n---\n');

                            toolResponses.push({
                                functionResponse: {
                                    name,
                                    response: {
                                        result: "UWAGA: Działasz w trybie lokalnym/emulatora. Wyniki mogą być mniej precyzyjne.\n\n" + (fallbackResults || "Brak danych w lokalnej bazie.")
                                    }
                                }
                            });
                        }
                    } catch (vecErr) {
                        logger.error("Error in search_vector_library module", vecErr);
                        toolResponses.push({
                            functionResponse: {
                                name,
                                response: { result: "Wystąpił błąd krytyczny podczas przetwarzania zapytania wektorowego." }
                            }
                        });
                    }
                }
            }

            result = await chat.sendMessage(toolResponses);
        }

        const modelResponseText = result.response.text() || "Brak odpowiedzi tekstowej.";
        logger.info("RAW GEMINI RESPONSE:", modelResponseText); // DEBUG LOG
        const sources = useSearch ? (result.response as any).candidates?.[0]?.groundingMetadata?.groundingChunks : undefined;

        let usage = undefined;
        if (result.response.usageMetadata) {
            usage = {
                promptTokenCount: result.response.usageMetadata.promptTokenCount || 0,
                candidatesTokenCount: result.response.usageMetadata.candidatesTokenCount || 0,
                totalTokenCount: result.response.usageMetadata.totalTokenCount || 0,
                cost: calculateCost(modelName as any, result.response.usageMetadata as any)
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
                            userId: uid,
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
        await chatRef.set({
            messages: FieldValue.arrayUnion(newMessage),
            lastUpdated: Timestamp.now()
        }, { merge: true });

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

    } catch (error: any) {
        logger.error("Gemini API Error in getLegalAdvice", {
            message: error.message,
            stack: error.stack,
            details: error.details,
            code: error.code
        });
        if (error instanceof HttpsError) {
            throw error;
        }
        throw new HttpsError('internal', `Błąd podczas przetwarzania zapytania AI: ${error.message || 'unknown'}`);
    }
});


// --- FUNCTION: analyzeLegalCase (KLASYFIKACJA SPRAWY) ---
export const analyzeLegalCase = onCall({
    cors: true,
    secrets: [GEMINI_API_KEY] // KLUCZOWE DLA ONLINE!
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

    if (userData?.isActive === false) {
        throw new HttpsError('permission-denied', "Twoje konto oczekuje na aktywację.");
    }
    // --------------------------

    try {
        const prompt = `
            # ZADANIE: ANALIZA I KLASYFIKACJA SPRAWY
            Jesteś rygorystycznym systemem klasyfikacji prawnej. Twoim zadaniem jest precyzyjna analiza opisu sprawy użytkownika.

            # WYTYCZNE:
            1. Zaklasyfikuj sprawę do jednej z kategorii: "Prawo Karne", "Prawo Rodzinne", "Prawo Cywilne", "Prawo Gospodarcze".
            2. Stwórz precyzyjny temat sprawy (maksymalnie 4-6 słów) w tonie formalnym.
            3. Dobierz optymalny tryb interakcji: "Porada Prawna", "Generowanie Pisma", "Szkolenie Prawne", "Zasugeruj Przepisy", "Znajdź Podobne Wyroki".

            # REGUŁY KRYTYCZNE:
            - Jeśli opis jest niejasny, wybierz najbardziej prawdopodobną kategorię i tryb "Porada Prawna".
            - Nie dodawaj żadnego komentarza poza strukturą JSON.

            Opis sprawy: "${description}"
        `;

        const modelName = 'gemini-2.0-flash-exp';
        const model = genAI.getGenerativeModel({
            model: modelName,
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: SchemaType.OBJECT,
                    properties: {
                        lawArea: { type: SchemaType.STRING, enum: Object.values(LawArea), format: "enum" },
                        topic: { type: SchemaType.STRING },
                        interactionMode: { type: SchemaType.STRING, enum: Object.values(InteractionMode), format: "enum" }
                    },
                    required: ["lawArea", "topic", "interactionMode"]
                }
            }
        }, { apiVersion: 'v1beta' });

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

        // DETERMINISTIC ID: {lawArea}_{topic} (sanitized)
        const sanitizedTopic = result.topic.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const chatId = `${result.lawArea}_${sanitizedTopic}`;

        const chatRef = db.collection('users').doc(uid).collection('chats').doc(chatId);
        await chatRef.set(chatData, { merge: true });

        // 2. AKTUALIZACJA CAŁKOWITEGO KOSZTU UŻYTKOWNIKA
        if (usage) {
            const userRef = db.collection('users').doc(uid);
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
    secrets: [GEMINI_API_KEY]
}, async (request) => {
    const genAI = getAiClient();
    if (!genAI) {
        throw new HttpsError('failed-precondition', 'Klient Gemini AI nie został zainicjowany.');
    }
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'Użytkownik musi być zalogowany.');
    }

    const { lawArea, language = 'pl' } = request.data;
    if (!lawArea) {
        throw new HttpsError('invalid-argument', 'Brak dziedziny prawa.');
    }

    try {
        const prompt = language === 'en'
            ? `You are a legal expert. Generate 4 most common, specific and practical questions (FAQ) that citizens ask in the field: ${lawArea}. 
               The answer must be a simple JSON in the format: ["Question 1?", "Question 2?", "Question 3?", "Question 4?"]. 
               Questions should be short, intriguing and encouraging to ask the AI. Answer in English.`
            : `Jesteś ekspertem prawnym. Wygeneruj 4 najczęstsze, konkretne i praktyczne pytania (FAQ), które obywatele zadają w dziedzinie: ${lawArea}. 
               Odpowiedź musi być prostym JSONem w formacie: ["Pytanie 1?", "Pytanie 2?", "Pytanie 3?", "Pytanie 4?"]. 
               Pytania powinny być krótkie, intrygujące i zachęcające do zadania ich AI. Odpowiedz po polsku.`;

        const model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash-exp',
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: SchemaType.ARRAY,
                    items: { type: SchemaType.STRING }
                }
            }
        }, { apiVersion: 'v1beta' });

        const result = await model.generateContent(prompt);
        const questions = JSON.parse(result.response.text());
        return { questions };

    } catch (error: any) {
        logger.error("FAQ API Error", { message: error.message });
        throw new HttpsError('internal', `Błąd podczas generowania FAQ: ${error.message || 'unknown'}`);
    }
});

// --- DATA MANAGEMENT HELPERS ---

const isMasterAdmin = (auth: any): boolean => {
    if (!auth) return false;
    const uid = auth.uid;
    const email = auth.token?.email || "";

    return uid === "Yb23rXe0JdOvieB3grdaN0Brmkjh" ||
        email.includes("kbprojekt1975@gmail.com") ||
        email.includes("konrad@example.com");
};

async function deleteCollection(collectionRef: any) {
    const snapshot = await collectionRef.get();
    if (snapshot.empty) return;

    // Process in batches of 500
    const chunks = [];
    for (let i = 0; i < snapshot.docs.length; i += 500) {
        chunks.push(snapshot.docs.slice(i, i + 500));
    }

    for (const chunk of chunks) {
        const batch = db.batch();
        chunk.forEach((doc: any) => batch.delete(doc.ref));
        await batch.commit();
    }
}

async function wipeUserData(uid: string, deleteUserDoc: boolean) {
    const userRef = db.collection('users').doc(uid);

    try {
        // 1. Delete all files from Storage
        const bucket = getStorage().bucket();
        await bucket.deleteFiles({ prefix: `users/${uid}/` });
        logger.info(`✓ Storage files deleted for user: ${uid}`);

        // 2. Delete Firestore collections
        // Top-level subcollections to wipe
        const topSubs = ['legal_knowledge', 'reminders', 'timeline', 'chats', 'knowledge_bases'];
        for (const sub of topSubs) {
            const subRef = userRef.collection(sub);
            if (sub === 'chats') {
                const chatsSnap = await subRef.get();
                for (const chatDoc of chatsSnap.docs) {
                    const chatRef = chatDoc.ref;
                    const chatSubs = ['legal_knowledge', 'documents', 'timeline', 'checklist'];
                    for (const cSub of chatSubs) {
                        await deleteCollection(chatRef.collection(cSub));
                    }
                    await chatRef.delete();
                }
            } else {
                await deleteCollection(subRef);
            }
        }

        if (deleteUserDoc) {
            await userRef.delete();
        } else {
            // Just clear personal data and reset costs
            await userRef.update({
                personalData: FieldValue.delete(),
                totalCost: 0,
                "profile.personalData": FieldValue.delete(),
                topics: {
                    [LawArea.Criminal]: [],
                    [LawArea.Family]: [],
                    [LawArea.Civil]: [],
                    [LawArea.Commercial]: []
                }
            });
        }
        logger.info(`✓ Firestore data wiped for user: ${uid}`);
    } catch (error) {
        logger.error(`Error wiping data for user ${uid}:`, error);
        throw error;
    }
}

// --- DATA MANAGEMENT FUNCTIONS ---

export const deleteMyPersonalData = onCall({ cors: true }, async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Musisz być zalogowany.');
    const uid = request.auth.uid;
    logger.info(`Deleting personal data for user: ${uid}`);
    try {
        await wipeUserData(uid, false);
        return { success: true };
    } catch (error: any) {
        logger.error(`Error deleting personal data for ${uid}:`, error);
        throw new HttpsError('internal', 'Wystąpił błąd podczas usuwania danych.');
    }
});

export const deleteMyAccount = onCall({ cors: true }, async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Musisz być zalogowany.');
    const uid = request.auth.uid;
    logger.info(`Deleting account and data for user: ${uid}`);
    try {
        await wipeUserData(uid, true);
        return { success: true };
    } catch (error: any) {
        logger.error(`Error deleting account for ${uid}:`, error);
        throw new HttpsError('internal', 'Wystąpił błąd podczas usuwania konta.');
    }
});

export const resetGlobalDatabase = onCall({ cors: true }, async (request) => {
    if (!isMasterAdmin(request.auth)) {
        logger.warn(`Unauthorized attempt to reset database by: ${request.auth?.uid}`);
        throw new HttpsError('permission-denied', 'Tylko administrator może zrestartować bazę danych.');
    }

    logger.info("!!! GLOBAL DATABASE RESET INITIATED !!!");
    try {
        const usersSnap = await db.collection('users').get();
        for (const userDoc of usersSnap.docs) {
            await wipeUserData(userDoc.id, false);
        }
        logger.info("✓ Global database reset completed.");
        return { success: true };
    } catch (error: any) {
        logger.error("Global database reset error:", error);
        throw new HttpsError('internal', 'Błąd podczas restartu bazy danych.');
    }
});

/**
 * Simple chunking for general documents.
 */
/*
function chunkText(text: string): string[] {
    const doubleNewlineChunks = text.split(/\n\s*\n/);
    const finalChunks: string[] = [];

    for (const chunk of doubleNewlineChunks) {
        const trimmed = chunk.trim();
        if (trimmed.length < 50) continue;
        if (trimmed.length > 2000) {
            for (let i = 0; i < trimmed.length; i += 2000) {
                finalChunks.push(trimmed.substring(i, i + 2000));
            }
        } else {
            finalChunks.push(trimmed);
        }
    }
    return finalChunks;
}
*/

/*
export const vectorizeOnUpload = onObjectFinalized({
    secrets: [GEMINI_API_KEY],
    memory: '512MiB'
}, async (event) => {
    const fileBucket = event.data.bucket;
    const filePath = event.data.name;

    if (!filePath || (!filePath.endsWith(".txt") && !filePath.endsWith(".md"))) {
        return;
    }

    logger.info(`Vectorizing uploaded file: ${filePath}`);

    try {
        const bucket = getStorage().bucket(fileBucket);
        const file = bucket.file(filePath);
        const [content] = await file.download();
        const textStr = content.toString('utf-8');

        const chunks = chunkText(textStr);
        const genAI = getAiClient();
        if (!genAI) return;

        // Extract UID from path: users/{uid}/cases/{caseId}/documents/...
        const pathParts = filePath.split('/');
        const ownerUid = pathParts[1] || "UNKNOWN";

        const embedModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
        const fileName = filePath.split('/').pop() || filePath;
        const libraryDocRef = db.collection('knowledge_library').doc(fileName.replace(/\./g, '_'));

        await libraryDocRef.set({
            title: fileName,
            source: "upload",
            path: filePath,
            userId: ownerUid, // ISOLATION: Tag as private
            updatedAt: Timestamp.now()
        }, { merge: true });

        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            const result = await embedModel.embedContent(chunk);
            const vector = result.embedding.values;

            await libraryDocRef.collection('chunks').doc(`upload_${i}`).set({
                content: chunk,
                articleNo: `p_${i}`,
                embedding: vector,
                userId: ownerUid, // ISOLATION: Tag as private
                metadata: {
                    title: fileName,
                    source: "upload",
                    year: new Date().getFullYear(),
                    publisher: "UPLOAD"
                }
            });
        }
        logger.info(`✓ Successfully indexed ${chunks.length} chunks from: ${filePath}`);
    } catch (err: any) {
        logger.error(`Error vectorizing ${filePath}:`, err);
    }
});


/**
 * Admin utility to ingest a legal act into the vector database.
 * Usage: /ingestLegalAct?publisher=DU&year=2023&pos=2809
 */
export const ingestLegalAct = onRequest({
    secrets: [GEMINI_API_KEY],
    timeoutSeconds: 540,
    memory: '1GiB'
}, async (req, res) => {
    const publisher = req.query.publisher as string;
    const year = parseInt(req.query.year as string);
    const pos = parseInt(req.query.pos as string);
    const manualTitle = req.query.title as string;

    if (!publisher || !year || !pos) {
        res.status(400).send("Missing parameters: publisher, year, pos");
        return;
    }

    try {
        const genAI = getAiClient();
        if (!genAI) {
            res.status(500).send("AI Client not initialized");
            return;
        }

        // 0. Resolve Title
        let title = manualTitle;
        if (!title) {
            try {
                const searchResults = await searchLegalActs({ year, publisher: publisher as any });
                const actInfo = searchResults.find(a => a.pos === pos);
                if (actInfo) title = actInfo.title;
            } catch (err) {
                logger.warn("Failed to fetch title from ISAP, using placeholder", err);
            }
        }
        if (!title) title = `Act ${publisher} ${year}/${pos}`;

        // 1. Fetch FULL content (no character limit)
        const fullContent = await getFullActContent(publisher, year, pos);
        if (!fullContent || fullContent.length < 50) {
            throw new Error(`Pobrana treść aktu jest zbyt krótka (${fullContent?.length || 0} znaków).`);
        }

        const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" }, { apiVersion: 'v1beta' });

        // 2. Decode HTML entities
        let decoded = fullContent
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"');

        // 3. Intelligent Chunking - try multiple patterns
        let chunks: string[] = [];

        // Try Pattern 1: "Art. 123."
        chunks = decoded.split(/(?=Art\.\s*\d+[a-z]?\.)/gi)
            .map(c => c.trim())
            .filter(c => c.length > 50);

        if (chunks.length < 5) {
            // Try Pattern 2: "Artykuł 123"
            chunks = decoded.split(/(?=Artykuł\s+\d+[a-z]?)/gi)
                .map(c => c.trim())
                .filter(c => c.length > 50);
        }

        if (chunks.length < 5) {
            // Try Pattern 3: "§ 1."
            chunks = decoded.split(/(?=§\s*\d+\.)/g)
                .map(c => c.trim())
                .filter(c => c.length > 50);
        }

        if (chunks.length < 5) {
            // Fallback: Fixed-size chunks (2000 chars)
            logger.warn("All regex patterns failed, using fixed-size chunking");
            chunks = decoded.match(/.{1,2000}/gs) || [decoded];
        }

        if (!chunks || chunks.length === 0) {
            res.status(200).send(`Success (Warning). Ingested 0 chunks, but text length was ${decoded.length}. Sample: ${decoded.substring(0, 100)}`);
            return;
        }

        logger.info(`Chunking complete: ${chunks.length} chunks found`);

        const actDocumentId = `${publisher}_${year}_${pos}`;
        const actRef = db.collection('knowledge_library').doc(actDocumentId);
        const chunksCollection = actRef.collection('chunks');

        // 3. Save Metadata
        await actRef.set({
            publisher,
            year,
            pos,
            title,
            updatedAt: FieldValue.serverTimestamp()
        }, { merge: true });

        // 4. Generate Embeddings & Save
        let savedCount = 0;
        const batchSize = 10;
        let lastError = "";

        for (let i = 0; i < chunks.length; i += batchSize) {
            const batch = chunks.slice(i, i + batchSize);
            await Promise.all(batch.map(async (chunkText, idx) => {
                try {
                    const result = await embeddingModel.embedContent(chunkText);
                    const embeddingVector = result.embedding.values;

                    const globalIdx = i + idx;
                    const artMatch = chunkText.match(/Art\.\s*(\d+[a-z]?)\./i);
                    const articleNo = artMatch ? artMatch[1] : `part_${globalIdx}`;

                    await chunksCollection.doc(`art_${articleNo}`).set({
                        content: chunkText,
                        articleNo,
                        embedding: embeddingVector,
                        userId: "GLOBAL",
                        metadata: {
                            publisher,
                            year,
                            pos,
                            title
                        }
                    });
                    savedCount++;
                } catch (e: any) {
                    logger.error("Embedding error", e);
                    lastError = e.message;
                }
            }));
            logger.info(`Batch ${Math.floor(i / batchSize) + 1} complete. Saved ${savedCount} chunks so far.`);
        }

        if (savedCount === 0 && chunks.length > 0) {
            res.status(200).send(`Error. Ingested 0/ ${chunks.length} chunks. Last error: ${lastError}. Sample text: ${decoded.substring(0, 100)}`);
            return;
        }

        res.status(200).send(`Success. Ingested ${savedCount} chunks for ${publisher} ${year}/${pos}.`);

    } catch (error: any) {
        logger.error("Ingestion failed", error);
        res.status(500).send(`Error: ${error.message}`);
    }
});

/**
 * Helper for On-Demand Vector Ingestion.
 * Searches ISAP, fetches, and indexes the first few articles to unblock the AI immediately.
 */
async function ingestAndSearchISAP(query: string, vector: number[]): Promise<string> {
    logger.info(`On-Demand Ingestion triggered for: ${query}`);

    try {
        // 1. Search ISAP for candidates
        const acts = await searchLegalActs({ keyword: query, inForce: true });
        if (acts.length === 0) {
            logger.info("No candidates found in ISAP for on-demand ingestion.");
            return "";
        }

        const candidate = acts[0];
        const actId = `${candidate.publisher}_${candidate.year}_${candidate.pos}`;
        logger.info(`Found candidate act in ISAP: ${candidate.title} (${actId})`);

        // 2. Fetch content
        const content = await getActContent(candidate.publisher, candidate.year, candidate.pos);
        if (!content || content.length < 100) return "";

        // 3. Simple chunking (splits by Art.)
        const chunks = content.split(/(?=Art\.\s*\d+[a-z]?\.)/g).map(c => c.trim()).filter(c => c.length > 50);

        const genAI = getAiClient();
        if (!genAI) return "";

        const embedModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
        const libraryDocRef = db.collection('knowledge_library').doc(actId);

        // Save metadata
        await libraryDocRef.set({
            title: candidate.title,
            source: "ISAP_AUTO",
            publisher: candidate.publisher,
            year: candidate.year,
            pos: candidate.pos,
            userId: "GLOBAL", // ISOLATION: Official acts are global
            updatedAt: Timestamp.now()
        }, { merge: true });

        // 4. Index FIRST 10 chunks synchronously
        const firstChunks = chunks.slice(0, 10);
        const results: string[] = [];

        for (let i = 0; i < firstChunks.length; i++) {
            const chunk = firstChunks[i];
            try {
                const res = await embedModel.embedContent(chunk);
                const emb = res.embedding.values;

                await libraryDocRef.collection('chunks').doc(`auto_${i}`).set({
                    content: chunk,
                    articleNo: chunk.match(/Art\.\s*(\d+[a-z]?)\./i)?.[1] || `p_${i}`,
                    embedding: emb,
                    userId: "GLOBAL", // ISOLATION: Official acts are global
                    metadata: {
                        title: candidate.title,
                        source: "ISAP_AUTO",
                        year: candidate.year,
                        publisher: candidate.publisher
                    }
                });
                results.push(`[SYSTEM: AUTO-INGEST] AKT: ${candidate.title} (Frag. ${i + 1})\nTREŚĆ: ${chunk}`);
            } catch (e: any) {
                logger.error(`Error embedding chunk ${i} during auto-ingest`, e.message);
            }
        }

        return results.join('\n---\n');
    } catch (err: any) {
        logger.error("Error in ingestAndSearchISAP", err.message);
        return "";
    }
}
