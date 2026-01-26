export type LawAreaType = 'Prawo Karne' | 'Prawo Rodzinne' | 'Prawo Cywilne' | 'Prawo Gospodarcze' | 'Prawo Pracy' | 'Prawo Nieruchomości' | 'Prawo Podatkowe' | 'Prawo Administracyjne' | 'Asystent Prawny';
export type InteractionModeType = 'Porada Prawna' | 'Generowanie Pisma' | 'Szkolenie Prawne' | 'Zasugeruj Przepisy' | 'Znajdź Podobne Wyroki' | 'Tryb Sądowy' | 'Konwersacja ze stroną przeciwną' | 'Analiza Sprawy' | 'Strategiczne Prowadzenie Sprawy' | 'Pomoc w obsłudze aplikacji';

export const LawArea = {
    Criminal: 'Prawo Karne' as LawAreaType,
    Family: 'Prawo Rodzinne' as LawAreaType,
    Civil: 'Prawo Cywilne' as LawAreaType,
    Commercial: 'Prawo Gospodarcze' as LawAreaType,
    Labor: 'Prawo Pracy' as LawAreaType,
    RealEstate: 'Prawo Nieruchomości' as LawAreaType,
    Tax: 'Prawo Podatkowe' as LawAreaType,
    Administrative: 'Prawo Administracyjne' as LawAreaType,
    Universal: 'Asystent Prawny' as LawAreaType
};

export const InteractionMode = {
    Advice: 'Porada Prawna' as InteractionModeType,
    Document: 'Generowanie Pisma' as InteractionModeType,
    LegalTraining: 'Szkolenie Prawne' as InteractionModeType,
    SuggestRegulations: 'Zasugeruj Przepisy' as InteractionModeType,
    FindRulings: 'Znajdź Podobne Wyroki' as InteractionModeType,
    Court: 'Tryb Sądowy' as InteractionModeType,
    Negotiation: 'Konwersacja ze stroną przeciwną' as InteractionModeType,
    Analysis: 'Analiza Sprawy' as InteractionModeType,
    StrategicAnalysis: 'Strategiczne Prowadzenie Sprawy' as InteractionModeType,
    AppHelp: 'Pomoc w obsłudze aplikacji' as InteractionModeType
};
