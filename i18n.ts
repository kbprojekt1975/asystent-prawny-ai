import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translation files
import translationEN from './public/locales/en/translation.json';
import translationPL from './public/locales/pl/translation.json';
import translationES from './public/locales/es/translation.json';

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

// 5. IP-based Detection (Optional/Async)
// Only run if no language was explicitly saved
if (!localStorage.getItem('i18nextLng')) {
    fetch('https://ipapi.co/json/')
        .then(res => res.json())
        .then(data => {
            const country = data.country_code;
            let detected: string | null = null;

            if (country === 'PL') {
                detected = 'pl';
            } else if (['ES', 'MX', 'AR', 'CO', 'PE', 'CL', 'VE', 'EC', 'GT', 'CU', 'BO', 'DO', 'HN', 'PY', 'SV', 'NI', 'CR', 'UY', 'PA', 'GQ'].includes(country)) {
                detected = 'es';
            }

            if (detected && detected !== i18n.language) {
                console.log(`Auto-detected language for country ${country}: ${detected}`);
                i18n.changeLanguage(detected);
            }
        })
        .catch(err => {
            console.warn('IP-based language detection failed, falling back to browser settings.', err);
        });
}

export default i18n;
