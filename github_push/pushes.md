# Historia zmian i wdrożeń (GitHub Pushes Log)

Data: 2026-01-16

### 1. Aktualizacja zależności backendu
- **Plik**: `functions/package.json`
- **Zmiana**: Podbicie wersji `firebase-functions` z `^7.0.0` na `^7.0.3`.
- **Cel**: Usunięcie ostrzeżeń CLI o nieaktualnej wersji podczas deploymentu.

### 2. Rozwiązanie blokad infrastrukturalnych
- **Akcja**: Włączenie API w Google Cloud (Cloud Build, Compute Engine, Pub/Sub).
- **Cel**: Umożliwienie poprawnego pakowania i wdrażania funkcji Firebase v2.

### 3. Poprawka tłumaczeń FAQ (Backend)
- **Plik**: `functions/src/index.ts`
- **Zmiana**: Aktualizacja funkcji `getLegalFAQ`.
- **Opis**: Dodano obsługę parametru `language`. Teraz AI generuje pytania FAQ w języku angielskim, jeśli aplikacja jest przełączona na ten język.

### 4. Poprawka tłumaczeń FAQ (Frontend)
- **Plik**: `components/LegalFAQ.tsx`
- **Zmiana**: Użycie hooka `t` do tłumaczenia nazwy dziedziny prawa w nagłówku.
- **Opis**: Zmieniono wyświetlanie surowej nazwy (np. "Prawo Rodzinne") na klucz tłumaczenia `law.areas.*`, co pozwala na poprawne wyświetlanie nagłówka po angielsku.

### 5. Finalny Deployment
- **Komenda**: `npx firebase deploy --only functions`
- **Status**: Sukces. Wszystkie funkcje są aktywne i wspierają wielojęzyczność.

### 6. Poprawka literówki na Splash Screen (LOV2XLR8)
- **Pliki**: `public/locales/pl/translation.json`, `public/locales/en/translation.json`
- **Opis**: Poprawiono błąd w nazwie twórcy (`LOV2XLR6` -> `LOV2XLR8`).

### 7. Naprawa błędów kodowania i składni JSON
- **Opis**: Rozwiązano problem "white screen" poprzez naprawę struktury plików JSON i przywrócenie poprawnego kodowania znaków (UTF-8). Wszystkie funkcje aplikacji działają poprawnie.
