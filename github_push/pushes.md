# Historia zmian i wdrożeń (GitHub Pushes Log)

**Ostatnia aktualizacja:** 2026-01-17 19:38

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
1. **Aktualizacja zależności backendu** (`functions/package.json`): Podbito `firebase-functions` do `^7.0.3`.
2. **Rozwiązanie blokad infrastrukturalnych**: Włączono wymagane API (Cloud Build, Compute Engine, Pub/Sub).
3. **Poprawka tłumaczeń FAQ (Backend)** (`functions/src/index.ts`): Wsparcie dla parametru `language`.
4. **Poprawka tłumaczeń FAQ (Frontend)** (`components/LegalFAQ.tsx`): Tłumaczenie nagłówków dziedzin prawa.
5. **Finalny Deployment**: Wdrążenie funkcji Firebase.

---

### [ZADANIA ARCHIWALNE]
- **Cel**: Pełna lokalizacja na język hiszpański oraz automatyzacja wyboru języka.
- **Wdrożenie**: Hosting & Functions są gotowe do wypchnięcia. Eksperymentalna detekcja IP działa.
