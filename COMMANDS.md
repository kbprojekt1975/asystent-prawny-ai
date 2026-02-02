# 📜 Komendy Projektu - Asystent Prawny AI

Ten plik zawiera listę wszystkich komend potrzebnych do pracy z aplikacją, podzieloną na kategorie.

---

## 🚀 Praca Deweloperska (Frontend)

| Komenda | Opis |
| :--- | :--- |
| `npm run dev` | Uruchamia lokalny serwer deweloperski Frontendu (Vite). Dostępny pod `http://localhost:3000`. |
| `npm run build` | Buduje wersję produkcyjną Frontendu w folderze `dist`. |
| `npm run preview` | Pozwala podejrzeć lokalnie to, co zostało zbudowane komendą `build`. |

---

## ⚙️ Cloud Functions (Backend)

| Komenda | Opis |
| :--- | :--- |
| `npm run build:functions` | Kompiluje kod TypeScript funkcji backendowych do JavaScript (bezpieczne dla produkcji). |
| `npm run watch:functions` | Automatycznie kompiluje funkcje po każdej zmianie w kodzie (idealne do deweloperki). |
| `cd functions && npm install` | Instaluje paczki potrzebne tylko dla backendu. |
| `firebase functions:log` | Wyświetla logi z działających funkcji na produkcji. |

---

## 🛠️ Emulatory (Praca Lokalna)

| Komenda | Opis |
| :--- | :--- |
| `npm run emulators` | Uruchamia emulatory Firebase (Firestore, Auth, Functions) z załadowaniem danych testowych z folderu `emulator_data`. |
| `npm run emulators:clean` | Uruchamia emulatory "na czysto", bez importowania starych danych. |
| `npm run seed` | **Ważne:** Wgrywa aktualny cennik modeli AI do lokalnego emulatora Firestore. Uruchom to, gdy emulatory działają, a cennik jest pusty. |

---

## ☁️ Wdrożenie (Produkcja)

| Komenda | Opis |
| :--- | :--- |
| `firebase deploy` | Wysyła wszystko (Frontend + Funkcje) na serwery Google Firebase. |
| `firebase deploy --only functions` | Wysyła tylko zmiany w kodzie backendu (Cloud Functions). |
| `firebase deploy --only hosting` | Wysyła tylko zmiany w wyglądzie i logice frontendu. |

npm run build && firebase deploy

npm run build && firebase deploy --only hosting

---

## 🔑 Inicjalizacja (Pierwszy Raz)

| Komenda | Opis |
| :--- | :--- |
| `npm install` | Instaluje wszystkie biblioteki potrzebne w głównym folderze projektu. |
| `firebase login` | Loguje Cię do Twojego konta Google/Firebase w konsoli (wymagane przed deployem). |
| `firebase projects:list` | Wyświetla listę Twoich projektów Firebase. |

---

> [!TIP]
> **Najczęstszy proces pracy (Lokalnie):**
> 1. Terminal 1: `npm run emulators` (uruchomienie bazy)
> 2. Terminal 2: `npm run seed` (wgranie cennika - tylko raz po starcie bazy)
> 3. Terminal 3: `npm run watch:functions` (backend w tle)
> 4. Terminal 4: `npm run dev` (praca nad ekranami)


Wylaczenie i wlczenie produkcji:
firebase hosting:disable
firebase deploy --only hosting