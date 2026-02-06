# Dokumentacja Techniczna: Panel Zarządzania Backendem (Admin Panel)

Ten dokument zawiera specyfikację techniczną i wymagania dotyczące wdrożenia panelu administratora w projekcie Legal Assistant AI. Jest przeznaczony dla agenta AI realizującego zadanie implementacji.

## 1. Kontekst Projektu i Stos Techniczny

- **Frontend**: React (TS), Tailwind CSS, Vite.
- **Backend/Baza**: Firebase (Firestore, Auth, Functions, Storage).
- **Lokalne Środowisko**: Emulatory Firebase.

## 2. Integracja z Firebase

Panel musi w pełni integrować się z istniejącą infrastrukturą Firebase.

### Konfuzja Środowiska (Lokalne)

- **Project ID**: `low-assit`
- **Emulator Hosts/Ports**:
  - Firestore: `127.0.0.1:8080`
  - Auth: `127.0.0.1:9099`
  - Functions: `127.0.0.1:5001`
  - Storage: `127.0.0.1:9199`

### Autoryzacja i Bezpieczeństwo

Dostęp do panelu musi być ograniczony tylko dla administratorów.
Logika sprawdzania uprawnień (pobrana z `App.tsx`):

```typescript
const ADMIN_UIDS = ["Yb23rXe0JdOvieB3grdaN0Brmkjh"];
const ADMIN_EMAILS = ["kbprojekt1975@gmail.com", "wielki@electronik.com"];

const isAdmin =
  user &&
  (ADMIN_UIDS.includes(user.uid) ||
    (user.email && ADMIN_EMAILS.some((email) => user.email?.includes(email))));
```

## 3. Struktura Danych (Firestore)

Panel zarządza trzema głównymi obszarami:

### A. Konfiguracja Systemu (Prompty AI)

- **Kolekcja**: `config`
- **Dokument**: `system`
- **Pola**:
  - `core`: Główne zasady (Mapa: język -> tekst).
  - `pillars`: Instrukcje dla dziedzin prawa (Mapa: język -> Mapa dziedzin).
  - `instructions`: Tryby pracy (Mapa: język -> Mapa trybów: `Porada Prawna`, `Analiza Dokumentu`, `Andromeda` itp.).

### B. Cennik i Limity (Pricing)

- **Kolekcja**: `config`
- **Dokument**: `pricing`
- **Pola**:
  - `profit_margin_multiplier`: Mnożnik marży (number).
  - `validity_seconds`: Czas trwania planu w sekundach (number).
  - `rates`: Ceny za 1 mln tokenów dla modeli Gemini (Mapa: model -> `{ input: number, output: number }`).
  - `plans`: Definicje planów Stripe (Mapa: price_id -> `{ name: string, creditLimit: number, tokenLimit: number }`).

### C. Zarządzanie Użytkownikami

- **Kolekcja**: `users`
- **Dokumenty**: `{userId}`
- **Zadania**:
  - Podgląd profili (`userProfile`).
  - Ręczna modyfikacja limitów kredytowych/tokenowych w `subscription`.
  - Aktywacja/dezaktywacja kont (`isActive`).

## 4. Wymagania Funkcjonalne Panelu

1. **Dashboard Promptów**: Edytor tekstowy dla promptów systemowych z podziałem na języki (PL/EN).
2. **Zarządzanie Cennikiem**: Formularz do zmiany stawek API i marży.
3. **Lista Użytkowników**: Tabela z filtrowaniem, statystykami zużycia tokenów i możliwością edycji subskrypcji.
4. **Broadcast**: Integracja z istniejącym `AdminBroadcastInput.tsx` do wysyłania ogłoszeń.
5. **Logi**: (Opcjonalnie) Integracja z Cloud Functions do podglądu błędów AI.

## 5. Wytyczne Implementacyjne

- **Komponenty**: Wykorzystaj istniejące wzorce z `components/GlobalAdminNotes.tsx` (real-time sync przez `onSnapshot`).
- **Stylistyka**: Dark mode, spójny z resztą aplikacji (Slate/Emerald/Amber).
- **Routing**: Dodaj dedykowaną ścieżkę `/admin` dostępną tylko po weryfikacji `isAdmin`.

---

_Dokument wygenerowany na podstawie analizy kodu źródłowego i konfiguracji Firestore projektu._
