import { PersonalData } from "../types";

export interface DocumentTemplate {
    id: string;
    name: string;
    content: string;
}

export const generateDocument = (
    template: string,
    personalData: PersonalData,
    counterpartyData?: any
): string => {
    let content = template;

    // Helper functions for dates and places
    const now = new Date();
    const dateStr = now.toLocaleDateString('pl-PL');
    const city = personalData.city || "[Miejscowość]";

    // Basic replacements
    const replacements: Record<string, string> = {
        "{{MY_NAME}}": personalData.fullName || "[Twoje Imię i Nazwisko]",
        "{{MY_ADDRESS}}": personalData.address || "[Twój Adres]",
        "{{MY_CITY}}": city,
        "{{MY_POSTAL_CODE}}": personalData.postalCode || "[Kod pocztowy]",
        "{{MY_PESEL}}": personalData.pesel || "[Twój PESEL]",
        "{{MY_ID_NUMBER}}": personalData.idNumber || "[Twój Nr Dowodu]",
        "{{DATE}}": dateStr,
        "{{CITY}}": city,
        "{{COUNTERPARTY_NAME}}": counterpartyData?.fullName || "[Imię i Nazwisko Drugiej Strony]",
        "{{COUNTERPARTY_ADDRESS}}": counterpartyData?.address || "[Adres Drugiej Strony]",
    };

    Object.entries(replacements).forEach(([key, value]) => {
        content = content.replaceAll(key, value);
    });

    return content;
};

export const getSmartLetterHeader = (personalData: PersonalData): string => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('pl-PL');
    const city = personalData.city || "[Miejscowość]";

    return `${city}, dnia ${dateStr}\n\n${personalData.fullName || "[Twoje Imię i Nazwisko]"}\n${personalData.address || "[Twój Adres]"}\n${personalData.postalCode || "[Kod]"} ${city}\nPESEL: ${personalData.pesel || ""}\n\n`;
};
