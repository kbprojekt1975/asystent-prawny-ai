# 05 - Podręcznik Wdrożenia i Rozwoju

## Środowisko Lokalne

Do rozwoju aplikacji zalecane jest korzystanie z **Firebase Local Emulator Suite**, który symuluje pełne środowisko produkcyjne (Firestore, Functions, Auth, Storage) na lokalnej maszynie.

### Setup deweloperski:
1.  **Instalacja zależności**:
    - Root: `npm install`
    - Functions: `cd functions && npm install`
2.  **Konfiguracja lokalna**:
    Utwórz plik `functions/.env` i dodaj: `GEMINI_API_KEY=twoj_klucz`
3.  **Uruchomienie emulatorów**:
    `firebase emulators:start`
4.  **Uruchomienie frontendu**:
    `npm run dev` (Vite uruchomi się na porcie 5173 lub 5175).

## Proces Budowania (Build Pipeline)

Aplikacja wykorzystuje nowoczesne narzędzia budujące:
- **Frontend**: Vite wykonuje tree-shaking i optymalizację assetów.
- **Backend**: TypeScript (`tsc`) kompiluje pliki z `src/` do folderu `lib/`. **Ważne**: Emulator i wdrożenie korzystają wyłączenie z plików w `lib/`. Zawsze uruchamiaj `npm run build` w folderze `functions` po zmianach w kodzie TS.

## Wdrożenie Produkcyjne (Deployment)

Wdrożenie odbywa się za pomocą Firebase CLI:

### 1. Rejestracja sekretów (jednorazowo)
```bash
firebase functions:secrets:set GEMINI_API_KEY
```

### 2. Pełne wdrożenie
```bash
firebase deploy
```

### 3. Wdrożenie selektywne
- Hosting: `firebase deploy --only hosting`
- Cloud Functions: `firebase deploy --only functions`
- Firestore (Rules/Indexes): `firebase deploy --only firestore`

## Monitoring i Utrzymanie

- **Logi**: Dostępne w Firebase Console w zakładce **Functions -> Logs**. Można je również śledzić lokalnie: `firebase functions:log`.
- **Koszty**: Monitorowane przez pole `totalCost` i `spentAmount` w profilu użytkownika. Możliwość ustawiania twardych limitów (quota) w konsoli Google Cloud.

---
*Senior Full Stack Developer*
