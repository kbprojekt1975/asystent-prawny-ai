# Historia zmian i wdrożeń (GitHub Pushes Log)

**Data:** 2026-01-16

---

### [fd1ed61] feat: implement FAQ translations, update dependencies, and fix splash screen typo
**Zadania:**
1. **Aktualizacja zależności backendu** (`functions/package.json`): Podbito `firebase-functions` do `^7.0.3`.
2. **Rozwiązanie blokad infrastrukturalnych**: Włączono wymagane API (Cloud Build, Compute Engine, Pub/Sub).
3. **Poprawka tłumaczeń FAQ (Backend)** (`functions/src/index.ts`): Wsparcie dla parametru `language`.
4. **Poprawka tłumaczeń FAQ (Frontend)** (`components/LegalFAQ.tsx`): Tłumaczenie nagłówków dziedzin prawa.
5. **Finalny Deployment**: Wdrążenie funkcji Firebase.

---

### [bec13df] fix: ensure Knowledge Base is accessible from side menu on all screens
**Zadania:**
- **Poprawka dostępności Bazy Wiedzy** (`App.tsx`): Usunięto warunkowe blokowanie przycisku "Baza Wiedzy" w menu bocznym. Przycisk jest teraz zawsze dostępny.

---

### [da5e3f2] style: update splash screen credit and environment text
**Zadania:**
- **Aktualizacja napisów na Splash Screenie**: Zmieniono treść na `Powered by LOV2XLR8 & AI` oraz dłuższy opis środowiska prawnego.

---

### [a16ddd5] style: exactly match splash screen text as requested
**Zadania:**
- **Korekta napisów na Splash Screenie**: Skrócono opis środowiska do: `Bezpieczne środowisko prawne`.

---

### [f68b69b] docs: final update to session log and splash screen text refinement
**Zadania:**
- **Aktualizacja logów**: Uzupełnienie `pushes.md` o najnowsze zadania i naprawę błędów JSON oraz kodowania (UTF-8).

---

### [ZADANIE BIEŻĄCE]
- **Cel**: Dodanie nazw commitów do `pushes.md` dla każdego wypchnięcia zmian.
- **Wdrożenie**: Hosting & Functions są aktualne (https://low-assit.web.app).
