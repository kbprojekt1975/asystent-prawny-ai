# 04 - Baza Danych i Model Danych

## Cloud Firestore (Database)

Baza danych jest zorganizowana w strukturę hierarchiczną, zoptymalizowaną pod kątem bezpieczeństwa i wydajności zapytań czasu rzeczywistego.

### Kolekcja: `/users`
Główny dokument profilu użytkownika. ID dokumentu = `uid` z Firebase Auth.
- `personalData`: Dane osobowe do generowania pism (imię, adres, PESEL).
- `topics`: Mapa dziedzin prawa do list tematów.
- `subscription`: Status płatności, limity i wydatki.

### Kolekcja: `/users/{uid}/chats`
Dokumenty reprezentujące poszczególne wątki rozmów.
- `lawArea`: Dziedzina (np. Prawo Cywilne).
- `topic`: Nazwa tematu (np. Rozwód).
- `interactionMode`: Ostatnio używany tryb.
- `servicePath`: Ścieżka usługi (`pro` | `standard`). Służy do izolacji spraw strategicznych.
- `messages`: Tablica obiektów `ChatMessage` (role, content).

#### Podkolekcje czatu:
- `/timeline`: Zdarzenia, fakty i terminy (deadlines) powiązane ze sprawą.
- `/checklist`: Lista zadań do wykonania w danej sprawie.
- `/documents`: Metadane przesłanych dokumentów (id, name, type, url, uploadedAt, path, party).
    - `party`: Kategoria strony (`mine` | `opposing`).
- `/legal_knowledge`: Baza wiedzy powiązana bezpośrednio z tematem sprawy.
    - Zawiera akty prawne (ISAP) i wyroki (SAOS) zatwierdzone przez użytkownika.
    - Pola dla wyroków: `source`, `judgmentId`, `caseNumber`, `content` (pełna treść), `savedAt`, `title`.
    - Pola dla aktów: `source`, `publisher`, `year`, `pos`, `title`, `content`, `savedAt`.

### Kolekcja globalna: `/knowledge`
Repozytorium wiedzy prawnej (pliki PDF/TXT przetworzone przez system), do których asystent ma dostęp w celu podawania precyzyjnych źródeł.

## Cloud Storage (Pliki)

Struktura folderów w Firebase Storage:
- `users/{uid}/{chatId}/documents/`: Pliki dowodowe przeznaczone do analizy przez AI.
- `users/{uid}/exports/`: Wygenerowane pisma procesowe gotowe do pobrania.

## Zasady Bezpieczeństwa (Security Rules)

Dostęp do danych jest ściśle ograniczony za pomocą Firebase Security Rules:
- Użytkownik ma dostęp **tylko** do swojego dokumentu w `/users/{uid}` oraz podkolekcji.
- Implementacja **Resource Ownership**: `allow read, write: if request.auth.uid == uid;`

---
*Senior Full Stack Developer*
