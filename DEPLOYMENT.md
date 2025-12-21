# Instrukcja Wdrożenia Produkcyjnego (Deployment Guide)

Ta aplikacja została przygotowana do bezpiecznego działania w środowisku produkcyjnym Firebase. Klucz Gemini API jest przechowywany w **Firebase Secret Manager**, co uniemożliwia jego wyciek do kodu źródłowego lub klienta.

## 1. Konfiguracja Sekretów (Wymagane raz)

Przed pierwszym wdrożeniem musisz ustawić klucz API Gemini w swoim projekcie Firebase. Uruchom poniższą komendę w głównym folderze projektu:

```bash
firebase functions:secrets:set GEMINI_API_KEY
```

Po wyświetleniu monitu wklej swój klucz API Gemini.

## 2. Wdrożenie na Produkcję

Aby wdrożyć całą aplikację (Frontend + Funkcje), użyj:

```bash
firebase deploy
```

Jeśli chcesz wdrożyć tylko poszczególne części:

- **Tylko Funkcje:** `firebase deploy --only functions`
- **Tylko Frontend (Hosting):** `firebase deploy --only hosting`

## 3. Testowanie Lokalne (Emulator)

Aplikacja wspiera emulatory Firebase. Aby testować lokalnie, upewnij się, że masz plik `.env` w folderze `functions/` z zawartością:

```env
GEMINI_API_KEY=twoj_klucz_tutaj
```

Następnie uruchom:

```bash
firebase emulators:start
```

## 4. Konfiguracja Własnej Domeny

Jeśli chcesz, aby aplikacja była dostępna pod Twoją własną domeną (np. `mojaszczuplaprawa.pl`):

1.  Wejdź do **Firebase Console** -> **Hosting**.
2.  Kliknij przycisk **"Add Custom Domain"**.
3.  Wpisz swoją domenę i postępuj zgodnie z instrukcjami weryfikacji (będziesz musiał dodać rekord **TXT** w ustawieniach DNS swojego dostawcy domeny).
4.  Po zweryfikowaniu własności, Firebase poda Ci rekordy **A** (adresy IP), które musisz wpisać w panelu zarządzania domeną.
5.  Firebase automatycznie wygeneruje bezpłatny certyfikat SSL (HTTPS) dla Twojej domeny (może to potrwać od godziny do doby).

## Bezpieczeństwo - Co zostało zrobione:
1. **Frontend**: Usunięto bibliotekę `@google/genai` z frontendu. Komunikacja z AI odbywa się wyłącznie przez bezpieczny "proxy" w Cloud Functions.
2. **Backend**: Funkcje Cloud używają `defineSecret`, co oznacza, że klucz API jest wstrzykiwany do pamięci funkcji tylko w momencie jej wykonania i nie jest widoczny w logach ani zmiennych środowiskowych projektu.
3. **Oficjalne SDK**: Zaktualizowano kod do najnowszego oficjalnego SDK `@google/generative-ai`.
