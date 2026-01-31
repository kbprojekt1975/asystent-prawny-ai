# 📖 Konfiguracja Systemu (Firestore)

Ten plik opisuje strukturę i dostępne klucze dla dokumentów konfiguracyjnych w kolekcji `config`. Możesz nimi zarządzać poprzez plik `seed_config.cjs` lub bezpośrednio w konsoli Firebase.

---

## 1. Dokument: `config/system`
Służy do nadpisywania instrukcji systemowych (promptów) dla AI. Jeśli pole jest puste, system używa domyślnych wartości z kodu.

### Struktura:
```json
{
  "core": {
    "pl": "Główne zasady zachowania (Zamiast CORE_RULES_PL)",
    "en": "...",
    "es": "..."
  },
  "pillars": {
    "pl": {
      "Prawo Rodzinne": "Specyficzne instrukcje dla tej dziedziny",
      "Prawo Cywilne": "..."
    }
  },
  "instructions": {
    "pl": {
      "Porada Prawna": "Instrukcja dla trybu porady",
      "Generowanie Pisma": "Instrukcja pisania pism",
      "Analysis": "Instrukcja dla agenta analizującego sprawę na starcie",
      "Andromeda": "Główna instrukcja dla asystenta Andromeda"
    }
  }
}
```

### Dostępne Klucze w `instructions`:
- **`Analysis`**: Prompty dla wstępnej analizy opisu sprawy.
- **`Andromeda`**: Prompty dla uniwersalnego asystenta.
- **`Porada Prawna`**: Tryb rozmowy o problemie.
- **`Generowanie Pisma`**: Tryb tworzenia gotowych dokumentów.
- **`Szkolenie Prawne`**: Tryb edukacyjny.
- **`Zasugeruj Przepisy`**: Tryb wyszukiwania paragrafów.
- **`Znajdź Podobne Wyroki`**: Tryb analizy orzecznictwa.

---

## 2. Dokument: `config/pricing`
Zarządza finansami i limitami aplikacji.

### Klucze:
- **`profit_margin_multiplier`**: Mnożnik marży (np. `500` oznacza 50-krotność ceny bazowej AI).
- **`validity_seconds`**: Czas trwania planu w sekundach.
    - `604800` = 7 dni (produkcja)
    - `600` = 10 minut (testy)
- **`rates`**: Ceny bazowe za 1 mln tokenów dla różnych modeli (używane do kalkulacji kosztów).

---

## 🛠️ Jak zaktualizować?
1. Edytuj plik `functions/seed_config.cjs`.
2. Uruchom `npm run seed`.
3. Odśwież aplikację – zmiany są widoczne natychmiast przy kolejnym zapytaniu do AI.
