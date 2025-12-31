# 03 - Backend (Cloud Functions)

## Przegląd Funkcji

Backend hostowany jest na **Cloud Functions for Firebase (v2)**. Głównym celem jest zapewnienie bezpiecznego mostka między interfejsem użytkownika a modelami językowymi Google Gemini.

### Główna Funkcja: `getLegalAdvice`
Jest to funkcja typu `onCall`, która:
1.  **Waliduje żądanie**: Sprawdza autentykację użytkownika i poprawność parametrów (`lawArea`, `interactionMode`).
2.  **Konfiguruje Personę**: Wybiera odpowiedni prompt systemowy z mapy `systemInstructions` na podstawie kontekstu.
3.  **Inicjalizuje Gemini**: Wykorzystuje `@google/generative-ai` do wygenerowania odpowiedzi.
4.  **Zarządza Historią**: Przyjmuje pełną historię czatu, co pozwala modelowi na zachowanie ciągłości bez konieczności przechowywania stanu na serwerze (Stateless logic).

## Integracja z Gemini AI

System wykorzystuje zaawansowany prompt-engineering:
- **Common Rules**: Zestaw uniwersalnych zasad (zakaz podawania dat, zakaz gwarantowania wyników, wymóg rzetelności).
- **Specialized Modes**: 
    - `Advice`: Skupienie na diagnozie prawnej.
    - `Court`: Symulacja ról procesowych (Sędzia, Prokurator).
    - `Negotiation`: Styl mediatora, pomoc w redagowaniu korespondencji ugodowej.

## Zarządzanie Sekretami

Dla zapewnienia najwyższego poziomu bezpieczeństwa, klucz API Gemini nie jest przechowywany w zmiennych środowiskowych (`.env`), lecz w **Cloud Secret Manager**.

```typescript
// Przykład użycia w kodzie
const GEMINI_API_KEY = defineSecret('GEMINI_API_KEY');

export const getLegalAdvice = onCall({ 
    secrets: [GEMINI_API_KEY],
    cors: true 
}, async (request) => {
    const apiKey = GEMINI_API_KEY.value();
    // ... logic
});
```

## Obsługa Błędów

Backend implementuje szczegółowe logowanie błędów walidacji oraz błędów API Gemini, zwracając użytkownikowi czytelne komunikaty `HttpsError` wraz ze wskazówkami dotyczącymi poprawy parametrów.

---
*Senior Full Stack Developer*
