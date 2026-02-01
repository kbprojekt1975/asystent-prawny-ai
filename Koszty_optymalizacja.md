# Optymalizacja Kosztów i Jakości AI

Ten dokument podsumowuje strategię cenową i techniczną mającą na celu zapewnienie 80% marży zysku przy jednoczesnym zachowaniu wysokiej precyzji odpowiedzi prawnych.

---

## 1. Model Biznesowy: Marża 80%

Cel: **8 PLN zysku z każdych 10 PLN** wpłaconych przez klienta (Pakiet Startowy).
Budżet na koszty AI (Google Cloud): **2 PLN**.

### Konfiguracja mnożnika (profit_margin_multiplier)
Aby osiągnąć ten cel, cena dla klienta musi być odpowiednio wyższa od kosztów bazowych:

*   **Dla Gemini 1.5 Pro**: Mnożnik = **5**
    *   Matematyka: 2 PLN kosztu * 5 = 10 PLN ceny (Zysk: 8 PLN).
*   **Dla Gemini 2.0 Flash**: Mnożnik = **10**
    *   Matematyka: 1 PLN kosztu * 10 = 10 PLN ceny (Zysk: 9 PLN).
    *   *Uwaga: Wyższy mnożnik dla Flasha pozwala zachować spójność z UI obiecującym "1 000 000 tokenów".*

---

## 2. Porównanie Wydajności (Pakiet 10 PLN)

| Cecha | Gemini 1.5 Pro (Premium) | Gemini 2.0 Flash (Szybki) |
| :--- | :--- | :--- |
| **Główna zaleta** | "Logika sędziowska", precyzja | Ogromna wydajność, szybkość |
| **Analiza akt (100 str.)** | ok. **3 analizy** | ok. **18 analiz** |
| **Czat (30 min)** | ok. **1 godzina** (łącznie) | ok. **4-5 godzin** (łącznie) |
| **Logika biznesowa** | Mało, ale najwyższej jakości | Dużo, stabilnie i tanio |

---

## 3. Strategia poprawy jakości modelu Flash

Aby model **Gemini 2.0 Flash** dorównywał precyzją modelowi Pro, stosujemy następujące optymalizacje:

1.  **Chain of Thought (Łańcuch Myśli)**:
    *   Wymuszenie w prompcie systemowym analizy krok po kroku (najpierw fakty, potem przepisy, na końcu wniosek). Zapobiega to "pójściu na skróty".
2.  **Rygorystyczny RAG**:
    *   Instrukcja opierania się wyłącznie na dostarczonych tekstach ustaw z bazy wiedzy (ISAP/SAOS).
3.  **Temperature = 0**:
    *   Ustawienie zerowej kreatywności modelu, co eliminuje losowość i halucynacje.
4.  **Weryfikacja krzyżowa**:
    *   Przy niskich kosztach Flasha, model może sam sprawdzać swoje odpowiedzi w drugim przebiegu myślowym.

---

## 4. Rekomendacja wdrożeniowa

*   **Pakiet Starter (10 PLN)**: Domyślnie **Gemini 2.0 Flash**. Buduje świetne wrażenie wydajności ("dużo narzędzia za małą cenę").
*   **Plan PRO (50 PLN)**: Domyślnie **Gemini 1.5 Pro**. Uzasadnia wyższą cenę abonamentu flagową precyzją i inteligencją modelu.
