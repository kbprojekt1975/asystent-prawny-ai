# 02 - Frontend (React + Vite)

## Struktura Kodu

Projekt stosuje płaską strukturę komponentów w folderze `components/` oraz dedykowane hooki w `hooks/`.

### Główne Komponenty:
- `App.tsx`: Centralny punkt sterujący (Orchestrator). Zarządza nawigacją między LawSelector, TopicSelector i Chatem.
- `ChatBubble.tsx`: Prezentacja wiadomości (Markdown, źródła, akcje).
- `LawSelector.tsx`: Wybór dziedziny prawa z opcją AI Case Analysis.
- `TopicSelector.tsx`: Zarządzanie wątkami wewnątrz dziedziny (Sprawy vs Negocjacje).
- `InteractionModeSelector.tsx`: Wybór trybu pracy asystenta (Porada, Sąd, Dokumenty).

## Logika Biznesowa (Custom Hooks)

Aplikacja przenosi ciężką logikę stanową do reużywalnych hooków:

### 1. `useChatLogic.ts`
Zarządza pełnym cyklem życia rozmowy:
- Wysyłanie wiadomości do Gemini (via `geminiService.ts`).
- Przetwarzanie odpowiedzi (Markdown, tokeny).
- Zarządzanie przesyłaniem plików i integracją z wiedzą prawną.

### 2. `useTopicManagement.ts`
Odpowiada za CRUD tematów:
- Synchronizacja list tematów z Firestore.
- Automatyczne kategoryzowanie (np. Negocjacje).
- Zarządzanie usuwaniem i czyszczeniem historii.

### 3. `useAppNavigation.ts`
Liniowa nawigacja stanowa:
- Zarządzanie stosem nawigacji (Wybór Prawa -> Temat -> Tryb -> Chat).
- Persystencja wybranego ID czatu.

## Stylizacja (Theming)

Projekt stawia na **Visual Excellence** i **Premium Look**:
- **Technologia**: CSS Variables + Tailwind Utility Classes.
- **Paleta**: Ciemne motywy (`slate-900`, `slate-800`) z akcentami `cyan` (standard) oraz `purple` (negocjacje).
- **Interakcje**: Subtelne mikro-animacje (transition, scale), backdrop-blur na modalach i szklane wykończenia (glassmorphism).

---
*Senior Full Stack Developer*
