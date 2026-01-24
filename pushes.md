# Historia zmian i wdrożeń (GitHub Pushes Log)

| Date | Branch | Commit Hash | Message |
| :--- | :--- | :--- | :--- |
| 2026-01-23 | main | f819413 | feat: Andromeda Chat & Knowledge Base - implementation of multi-topic history, file analysis, and responsive UI |
| 2026-01-23 | main | 27d656b | fix: resolve asystent prawny validation error and normalize chat history roles |

---

---
---

### [6ecd228] 2026-01-24 11:50 | style: poprawa UI
**Zadania:**
- **Ikona Andromeda (Header)**:
    - Naprawiono problem z „rozciąganiem” i rozmyciem ikony na urządzeniach mobilnych.
    - Zastosowano stałe wymiary (6px) dla kropek, co zapewnia idealną ostrość i okrągły kształt bez względu na rozdzielczość.
    - Zsynchronizowano wagę linii z ikonami menu hamburger.
- **Notatki Globalne (Admin)**:
    - Dodano funkcję pełnej minimalizacji paska narzędzi administratora do postaci małego, dyskretnego punktu (kropki).
    - Stan zminimalizowania całego paska (nie tylko pojedynczych notatek) jest teraz zapamiętywany w lokalnej pamięci.
- **Inne poprawki**:
    - Usunięto zbędne odznaki kontekstowe z dolnej części czatu.
    - Opóźniono wyświetlanie sugerowanych akcji do momentu wprowadzenia pierwszej wiadomości przez użytkownika (po zapoznaniu się ze sprawą).

### [b9f9b2b] 2026-01-24 00:10 | fix: Absolute Language Override in Andromeda
**Naprawiono:**
- **Nuclear Option**: Dodano sekcję "ABSOLUTE LANGUAGE REQUIREMENT" na samym początku promptu systemowego (przed wszystkimi innymi instrukcjami)
- **Caps Lock + Emoji**: Użyto wielkich liter i emoji ostrzeżenia (⚠️), aby model nie mógł zignorować instrukcji językowej
- **Explicit Override**: Instrukcja wyraźnie stwierdza "THIS INSTRUCTION OVERRIDES ALL OTHER CONTEXT"

### [ff01081] 2026-01-24 00:00 | fix: Clean Console Warnings
**Naprawiono:**
- **CORS Error**: Usunięto wywołanie `ipapi.co` z kodu klienta, które powodowało błędy CORS. Detekcja języka opiera się teraz wyłącznie na ustawieniach przeglądarki.
- **Firestore Deprecation**: Zaktualizowano konfigurację Firestore do `initializeFirestore` z `persistentLocalCache`, eliminując ostrzeżenie o przestarzałym `enableMultiTabIndexedDbPersistence`.

### [8b82238] 2026-01-23 23:50 | fix: Refine Andromeda Persona for International Users
**Naprawiono:**
- **System Prompt**: Zmieniono definicję roli dla EN/ES. Zamiast "Asystent prawny" (co sugerowało polską jurysdykcję i język), Andromeda działa teraz jako "International Legal Consultant", którego misją jest wyjaśnianie polskiego prawa użytkownikom zagranicznym. To eliminuje blokadę "I am designed to provide legal assistance in Polish".

### [035dbd0] 2026-01-23 23:30 | fix: Loading Spinner Localization
**Naprawiono:**
- **UI**: Zastąpiono tekst "Analizuję Twoje zapytanie..." dynamicznym tłumaczeniem w komponencie ładującym.
- **Backend**: (Potwierdzenie) Wymuszenie języka odpowiedzi w promptach systemowych.

### [2357e1e] 2026-01-23 23:00 | fix: Enforce Andromeda Response Language
**Naprawiono:**
- **Prompt Engineering**: Wdrożono "CRITICAL INSTRUCTION" w promptach systemowych, wymuszając odpowiedź w wybranym języku (EN/ES) niezależnie od języka kontekstu prawnego (RAG).

### [56f6105] 2026-01-23 22:30 | fix: Andromeda UI Localization
**Naprawiono:**
- **Tłumaczenie Interfejsu**: Wszystkie elementy UI Andromedy (nagłówki, placeholdery, etykiety) są teraz dynamicznie tłumaczone (PL, EN, ES).
- **Backend**: Poprawiono detekcję języka, aby obsługiwała warianty lokalne (np. en-US).

### [5dbfbb5] 2026-01-23 22:00 | feat: Andromeda Multilingual Support (EN/ES) & Function Rebuild
**Zadania:**
- **Wsparcie Językowe**:
    - **Backend (Cloud Functions)**: Dynamiczne instrukcje systemowe w `askAndromeda`, które dostosowują "osobowość" i język odpowiedzi AI (Polski, Angielski, Hiszpański) w zależności od parametru `language`.
    - **Zachowanie Wiedzy**: System zachowuje dostęp do polskiej bazy prawnej (ISAP/SAOS) niezależnie od języka rozmowy, tłumacząc zawiłości prawne na język użytkownika.
- **Konserwacja**:
    - **Rebuild funkcji**: Przebudowa i ponowne wdrożenie Cloud Functions po zmianach w logice językowej.
    - **Dokumentacja**: Aktualizacja logów wdrożeniowych.

### [f819413] 2026-01-23 21:50 | feat: Andromeda Chat & Knowledge Base implementation
**Zadania:**
- **Historia Wielowątkowa (Multi-Topic History)**:
    - **Panel Boczny (Sidebar)**: Responsywny panel (stały na PC, wysuwany "drawer" na mobile) zarządzający listą rozmów.
    - **Zarządzanie Czatami**: Możliwość tworzenia nowych wątków ("Nowa rozmowa"), przełączania się między nimi i usuwania.
    - **Persystencja**: Czaty i ich historia są teraz trwale zapisywane w Firestore (`andromeda_chats`), co pozwala na powrót do rozmowy w dowolnym momencie.
    - **Tytułowanie**: Automatyczne generowanie tytułów rozmów na podstawie pierwszej wiadomości.
- **Obsługa Plików i Baza Wiedzy**:
    - **Przesyłanie Plików**: Dodano przycisk "spinacza" (PaperClip) w interfejsie czatu. Obsługa formatów tekstowych (.txt, .md, .json, .xml).
    - **Analiza Dokumentów**: Przesłane pliki są automatycznie analizowane przez backend (Gemini).
    - **Trwała Pamięć Sprawy**: Wdrożono narzędzie backendowe `add_to_chat_knowledge`, które pozwala AI zapamiętywać kluczowe fakty z dokumentów w kontekście konkretnego wątku.
- **Zmiany w UI/UX**:
    - **Ergonomia**: Przeniesienie przycisku dodawania plików na lewą stronę pola tekstowego, oddzielając go od przycisku wysyłania.
    - **Ikony**: Dodano brakujące ikony (Bars3Icon, TrashIcon, PaperClipIcon) do systemu ikonografii.
    - **Backend**: Aktualizacja Cloud Functions (`askAndromeda`) o obsługę `chatId` i kontekstowe wczytywanie wiedzy.
    - **Wsparcie Językowe**: Pełna obsługa języka angielskiego (EN) i hiszpańskiego (ES) w Andromedzie, z dedykowanymi promptami systemowymi.

---

### [temp-hash] 2026-01-22 21:00 | fix: FIREBASE history fix!!!!!!!!!! and admin notes minimization
**Zadania:**
- **FIREBASE history fix!!!!!!!!!!**:
    - **Ujednolicenie ID (getChatId)**: Wprowadzenie centralnej funkcji generującej identyfikatory czatów w `types.ts`, co naprawiło błędy znikającej historii w trybach specjalistycznych (Sąd, Negocjacje).
    - **Automatyczne wczytywanie**: Dodano `useEffect` w `App.tsx` wymuszający załadowanie historii po odświeżeniu strony/inicjalizacji aplikacji.
    - **Synchronizacja Usuwania**: Rozszerzono `handleDeleteHistory`, aby usuwał wszystkie wariacje trybów (izolowane sesje) dla danego tematu.
    - **Poprawki UI**: Panel historii (`HistoryPanel.tsx`) poprawnie przekazuje teraz tryb rozmowy do przeglądarki wiedzy i dokumentów.
- **Notatki Administratora**:
    - **Trwała Minimalizacja**: Stan zminimalizowania notatek jest teraz zapisywany w Firestore (`isMinimized`), dzięki czemu notatki pozostają schowane po odświeżeniu strony.
    - **Podgląd Treści**: Zminimalizowane notatki wyświetlają teraz krótki fragment tekstu (pierwsze dwa wyrazy) dla lepszej orientacji.

---

### [06ab397] 2026-01-18 20:10 | feat: implement !!!!!NEW FLOW!!!!! for AI Tools and mobile UI optimization
**Zadania:**
- **AI Tools: !!!!!NEW FLOW!!!!!**:
    - **Bezpośredni Start**: Tryb "Rozpocznij z czystą kartą" prowadzi teraz bezpośrednio do czatu, omijając wybór tematów.
    - **Inteligentne Powitanie**: Asystent wprowadza się w oparciu o wybraną rolę (np. Ekspert ds. Pism), wyjaśnia zakres pomocy i proaktywnie pyta o szczegóły sprawy.
    - **Skupienie na Trybie**: Usunięto promowanie innych narzędzi w trakcie rozmowy; AI trzyma się ściśle wybranej specjalizacji.
    - **Integracja Kontekstu**: Płynne przełączanie między "Obecną sprawą", "Historią" a "Nową kartą" bez błędów typu TypeError.
- **Optymalizacja Mobilna**:
    - Bardziej kompaktowy układ selektora kontekstu (mniejsze paddingi, mniejsze czcionki).
    - Ukrycie zbędnych opisów w siatce narzędzi na mobile dla lepszej przejrzości.
    - Poprawione wyrównanie ikon i etykiet na małych ekranach.
- **Inne**: Naprawiono błąd "martwego" menu bocznego na stronie głównej (dodano domyślny obszar prawa).

---

### [2e77e6b] 2026-01-18 14:40 | feat: implement admin notes and revert theme infrastructure
**Zadania:**
- **Notatki Administratora**:
    - Implementacja globalnych notatek widocznych dla wszystkich użytkowników.
    - Możliwość personalizacji kolorów notatek (Standard, Amber, Emerald, Rose, Indigo).
    - Mechanizm usuwania i edycji notatek przez administratorów.
    - Synchronizacja w czasie rzeczywistym przez Firestore.
- **Rollback motywów**:
    - Całkowite wycofanie infrastruktury "True Black".
    - Przywrócenie pierwotnej estetyki "Deep Slate" (#0f172a).
    - Usunięcie przełącznika motywów z nagłówka.
    - Przywrócenie oryginalnych efektów wizualnych SplashScreen.
- **Bezpieczeństwo**: Aktualizacja reguł Firestore dla bezpiecznego zarządzania notatkami.

---

### [c4e718a] 2026-01-17 19:38 | feat: optimize mobile UI - 2 columns layout for all tile grids
**Zadania:**
- **Optymalizacja widoku mobilnego**: Zmieniono układ kafelków z 1 kolumny na 2 kolumny na urządzeniach mobilnych dla lepszego wykorzystania przestrzeni.
- **Komponenty zoptymalizowane**:
    - `LawSelector.tsx`: Wybór obszaru prawa (8 kafelków)
    - `InteractionModeSelector.tsx`: Wybór trybu interakcji (8 trybów)
    - `LegalFAQ.tsx`: Pytania FAQ (4 pytania)
    - `CourtRoleSelector.tsx`: Wybór roli w symulacji sądowej (4 role)
- **Zmiany responsywne**:
    - Grid: `grid-cols-2` na mobile, `md:grid-cols-2` na tablet, `lg:grid-cols-4` na desktop (LawSelector)
    - Padding: `p-3` na mobile, `md:p-6` na desktop
    - Ikony: `w-8 h-8` na mobile, `md:w-12 md:h-12` na desktop
    - Czcionki: `text-sm` na mobile, `md:text-xl` na desktop
    - Gap: `gap-3` na mobile, `md:gap-6` na desktop
- **Dodatkowe usprawnienia**: Dodano `line-clamp-2` do opisów, aby zapobiec przepełnieniu tekstu.
- **Cel**: Zmniejszenie przewijania pionowego na urządzeniach mobilnych i lepsze wykorzystanie dostępnej przestrzeni ekranu.

---

### [d472979] 2026-01-17 19:33 | fix: enhanced validation logging in getLegalAdvice for debugging 400 errors
**Zadania:**
- **Ulepszone logowanie błędów walidacji**: Dodano szczegółowe komunikaty błędów w `functions/src/index.ts`, które pokazują:
    - Dostępne dziedziny prawa w `systemInstructions`
    - Dostępne tryby interakcji dla wybranej dziedziny
    - Aktualny język interfejsu
    - Znaleziony klucz `areaKey`
- **Poprawa diagnostyki**: Komunikaty błędów zawierają teraz pełną listę dostępnych trybów, co ułatwia identyfikację problemów z walidacją.
- **Migracja plików tłumaczeń**: Przeniesiono pliki `translation.json` z `public/locales/` do `src/locales/` dla wszystkich języków (PL/EN/ES).
- **Cel**: Rozwiązanie problemu z błędami `400 Bad Request` dla nowo dodanych obszarów prawa (Prawo Pracy, Prawo Nieruchomości, Prawo Podatkowe, Prawo Administracyjne).

---

### [temp-hash] 2026-01-17 15:35 | feat: expand B2B warranty knowledge base and improve SAOS synchronization reliability
**Zadania:**
- **Rozszerzenie bazy wiedzy B2B**: Dodano artykuły 556, 558, 560 oraz 563 Kodeksu Cywilnego (tekst jednolity 2025) do bazy wiedzy sprawy.
- **Poprawa niezawodności SAOS**: 
    - Zaktualizowano `saosService.ts`: dodano szczegółowe logowanie błędów API (statusy, body).
    - Zaktualizowano `add_ruling_to_topic_knowledge`: narzędzie obsługuje teraz opcjonalny parametr `content`, pozwalając AI zapisać wyrok bez ponownego pobierania, jeśli treść jest już znana.
    - Zmodyfikowano instrukcje systemowe (PL/EN/ES) w celu optymalizacji zapisu orzeczeń.
- **Udoskonalenie widoku Bazy Wiedzy**: 
    - `LegalKnowledgeModal.tsx`: dodano obsługę sygnatur (`caseNumber`), etykiety "WYROK" oraz linkowanie do serwisu SAOS.
    - `types.ts`: rozszerzono interfejs `LegalAct` o pola specyficzne dla orzeczeń.
- **Prompting & Grounding**: Poprawiono formatowanie kontekstu bazy wiedzy w `getLegalAdvice`, aby AI lepiej rozróżniało akty prawne od wyroków.

---

### [f32e38e] 2026-01-17 12:53 | fix: translate 'I understand' button in HelpModal to all languages (PL/EN/ES)
**Zadania:**
- **Tłumaczenie przycisku "Rozumiem"**: Dodano klucz `app.understand` do plików tłumaczeń PL/EN/ES.
- **Aktualizacja HelpModal.tsx**: Zaimportowano `useTranslation` i zastąpiono hardkodowany tekst "Rozumiem" dynamicznym tłumaczeniem `t('app.understand')`.
- **Dodano nowe pliki**: `functions/src/saosService.ts` (serwis SAOS API) i `services/vectorService.ts` (serwis bazy wiedzy).
- **Cookie consent translations**: Dodano tłumaczenia dla zgody na cookies w PL/EN.

---

### [a511bcb] 2026-01-17 12:27 | Optimize mobile UI: minimalist toolbar, hidden elements when collapsed, reduced padding
**Zadania:**
- **Minimalistyczny przycisk "3 kropki"**: Usunięto tło i ramkę, zmniejszono rozmiar ikony (w-5 h-5).
- **Ukrywanie elementów na mobile**: Quick Actions i Context Badge są teraz ukryte gdy toolbar jest zwinięty.
- **Redukcja paddingu**: Footer ma `py-0.5 px-2` gdy zwinięty na mobile, chat input ma `p-1.5` zamiast `p-2`.
- **Usunięcie ramki górnej**: Usunięto `border-t` z footera dla płynniejszego wyglądu.
- **Zamiana pozycji przycisków**: Przycisk "Ukryj" jest teraz po lewej, toggle "Zawsze pokazuj" po prawej.
- **Tłumaczenia**: Dodano klucze `mobile.showAlways` i `mobile.hide` do PL/EN.

---


### [6ba41aa] 2026-01-16 21:31 | docs: sync log hash with git history
**Zadania:**
- **Synchronizacja**: Aktualizacja hashy w pliku logów w celu zachowania spójności z historią Git.

---

### [9ec1645] 2026-01-16 21:29 | docs: add timestamps to all entries in pushes.md

**Zadania:**
- **Lokalizacja**: Dodanie daty i godziny do każdego wpisu w logach.


---

### [2691564] 2026-01-16 21:28 | docs: correct commit hashes and messages in pushes.md
**Zadania:**
- **Poprawa logów**: Korekta hashy commitów, które zmieniły się po wykonaniu `amend`.

---

### [55ef3c9] 2026-01-16 21:24 | feat: implement Help Sidebar translations (EN/ES) and full Spanish language support with auto-detection
**Zadania:**
- **Lokalizacja bocznego menu pomocniczego** (`AppHelpSidebar.tsx`): Przeniesiono wszystkie hardkodowane teksty do plików tłumaczeń.
- **Aktualizacja plików i18n**: Dodano sekcję `help_sidebar` do `pl/translation.json`, `en/translation.json` oraz `es/translation.json`.
- **Wsparcie języka hiszpańskiego (ES)**: Dodano plik `es/translation.json`, zaktualizowano `i18n.ts` oraz przyciski w `AppHeader` i `SplashScreen`.
- **Automatyczna detekcja języka**: Wdrożono logikę wykrywania kraju na podstawie IP oraz ustawień przeglądarki, z zapisem wyboru w `localStorage`.
- **Backend**: Dostosowano `getLegalFAQ` i `getLegalAdvice` do generowania odpowiedzi w języku hiszpańskim.
- **Weryfikacja**: Potwierdzono poprawne wyświetlanie pomocy w języku polskim, angielskim i hiszpańskim oraz poprawność struktury plików JSON.

---

### [f68b69b] 2026-01-16 19:44 | docs: final update to session log and splash screen text refinement
**Zadania:**
- **Aktualizacja logów**: Uzupełnienie `pushes.md` o najnowsze zadania i naprawę błędów JSON oraz kodowania (UTF-8).

---

### [a16ddd5] 2026-01-16 19:42 | style: exactly match splash screen text as requested
**Zadania:**
- **Korekta napisów na Splash Screenie**: Skrócono opis środowiska do: `Bezpieczne środowisko prawne`.

---

### [da5e3f2] 2026-01-16 19:41 | style: update splash screen credit and environment text
**Zadania:**
- **Aktualizacja napisów na Splash Screenie**: Zmieniono treść na `Powered by LOV2XLR8 & AI` oraz dłuższy opis środowiska prawnego.

---

### [bec13df] 2026-01-16 19:38 | fix: ensure Knowledge Base is accessible from side menu on all screens
**Zadania:**
- **Poprawka dostępności Bazy Wiedzy** (`App.tsx`): Usunięto warunkowe blokowanie przycisku "Baza Wiedzy" w menu bocznym. Przycisk jest teraz zawsze dostępny.

---

### [fd1ed61] 2026-01-16 19:32 | feat: implement FAQ translations, update dependencies, and fix splash screen typo
**Zadania:**
- **Aktualizacja zależności backendu** (`functions/package.json`): Podbito `firebase-functions` do `^7.0.3`.
- **Rozwiązanie blokad infrastrukturalnych**: Włączono wymagane API (Cloud Build, Compute Engine, Pub/Sub).
- **Poprawka tłumaczeń FAQ (Backend)** (`functions/src/index.ts`): Wsparcie dla parametru `language`.
- **Poprawka tłumaczeń FAQ (Frontend)** (`components/LegalFAQ.tsx`): Tłumaczenie nagłówków dziedzin prawa.
- **Finalny Deployment**: Wdrążenie funkcji Firebase.

---

### [ZADANIA ARCHIWALNE]
- **Cel**: Pełna lokalizacja na język hiszpański oraz automatyzacja wyboru języka.
- **Wdrożenie**: Hosting & Functions są gotowe do wypchnięcia. Eksperymentalna detekcja IP działa.
