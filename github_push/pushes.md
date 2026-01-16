# Historia zmian i wdrożeń (GitHub Pushes Log)

**Ostatnia aktualizacja:** 2026-01-16 21:29

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
