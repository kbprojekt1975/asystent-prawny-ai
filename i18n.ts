import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translation files
import translationEN from './src/locales/en/translation.json';
import translationPL from './src/locales/pl/translation.json';
import translationES from './src/locales/es/translation.json';

// the translations
const resources = {
    en: {
        translation: translationEN
    },
    pl: {
        translation: translationPL
    },
    es: {
        translation: translationES
    }
};

const getInitialLanguage = (): string => {
    // 1. Check Local Storage
    const saved = localStorage.getItem('i18nextLng');
    if (saved && ['en', 'pl', 'es'].includes(saved)) {
        return saved;
    }

    // 2. Browser Detection (Fallback 1)
    const browserLng = navigator.language.split('-')[0].toLowerCase();
    if (['en', 'pl', 'es'].includes(browserLng)) {
        return browserLng;
    }

    // 3. Default to English
    return 'en';
};

i18n
    .use(initReactI18next) // passes i18n down to react-i18next
    .init({
        resources,
        lng: getInitialLanguage(),
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false // react already safes from xss
        }
    });

// 4. Persistence: Update localStorage whenever language changes
i18n.on('languageChanged', (lng) => {
    localStorage.setItem('i18nextLng', lng);
});

// 5. IP-based Detection removed due to CORS issues.
// Browser detection in getInitialLanguage is sufficient.

export default i18n;
