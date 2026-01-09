# 01 - Architektura i Stos Technologiczny

## Przegląd Systemu
Asystent Prawny AI to progresywna aplikacja webowa (PWA) zbudowana w modelu **Serverless** na platformie **Firebase**. System umożliwia użytkownikom interakcję z zaawansowanym modelem językowym (Gemini AI) w celu uzyskania porad prawnych, analizy spraw, generowania dokumentów oraz symulacji rozpraw sądowych.

### Kluczowe założenia projektowe:
- **Bezpieczeństwo przede wszystkim**: Klucze AI nigdy nie opuszczają serwera.
- **Kontekstowość**: Persystencja kontekstu sprawy pozwala na wielowątkowe rozmowy w ramach jednego tematu.
- **Płatności i limity**: System zintegrowanego monitorowania kosztów i planów subskrypcyjnych.

## Stos Technologiczny

### Frontend
- **Framework**: React 19 (TypeScript)
- **Build Tool**: Vite 6
- **Stylizacja**: Vanilla CSS + Tailwind CSS (jako narzędzie pomocnicze)
- **Komunikacja**: Firebase Web SDK v12

### Backend (Serverless)
- **Cloud Functions**: Środowisko Node.js 20
- **AI Engine**: Google Gemini API (model `gemini-2.0-flash-exp`)
- **Secret Management**: Firebase Secret Manager (dla `GEMINI_API_KEY`)

### Przechowywanie Danych
- **Baza danych**: Cloud Firestore (NoSQL, Real-time)
- **Pliki**: Cloud Storage for Firebase (dokumenty spraw, dowody)
- **Autentykacja**: Firebase Authentication (Email/Password, Google)

## Przepływ Danych (Data Flow)

1.  **Inicjalizacja**: Użytkownik wybiera dziedzinę prawa (np. Karną) i temat (np. Alimenty).
2.  **Zapytanie**: Frontend wysyła historię czatu oraz metaparametry (rola, tryb) do Cloud Function `getLegalAdvice`.
3.  **Logika Backendowa**:
    - Weryfikacja sesji i uprawnień.
    - Pobranie odpowiedniego zestawu instrukcji systemowych (Persona).
    - Wywołanie Gemini API.
4.  **Odpowiedź**: Model zwraca sformatowany tekst (Markdown), który jest wyświetlany użytkownikowi i zapisywany w Firestore w celu zachowania ciągłości.

---
*Senior Full Stack Developer*
