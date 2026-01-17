
const admin = require('firebase-admin');

process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';

if (!admin.apps.length) {
    admin.initializeApp({
        projectId: 'low-assit'
    });
}

const db = admin.firestore();
const uid = 'wqXhCtEio4kKKnwz96vFbvRTnaNT';
const chatId = 'Prawo Cywilne_test_alfa';

const articles = [
    {
        id: 'KC_Art_556',
        source: 'ISAP',
        publisher: 'Dz.U.',
        year: 2025,
        pos: 1071,
        title: 'Kodeks Cywilny - Art. 556: Rękojmia',
        content: 'Art. 556. [Rękojmia] Sprzedawca jest odpowiedzialny względem kupującego, jeżeli rzecz sprzedana ma wadę fizyczną lub prawną (rękojmia).',
        savedAt: admin.firestore.Timestamp.now()
    },
    {
        id: 'KC_Art_558',
        source: 'ISAP',
        publisher: 'Dz.U.',
        year: 2025,
        pos: 1071,
        title: 'Kodeks Cywilny - Art. 558: Modyfikacja odpowiedzialności',
        content: 'Art. 558. [Modyfikacja odpowiedzialności z tytułu rękojmi] § 1. Strony mogą odpowiedzialność z tytułu rękojmi rozszerzyć, ograniczyć lub wyłączyć. Jeżeli kupującym jest konsument, ograniczenie lub wyłączenie odpowiedzialności z tytułu rękojmi jest dopuszczalne tylko w wypadkach określonych w przepisach szczególnych. § 2. Wyłączenie lub ograniczenie odpowiedzialności z tytułu rękojmi jest bezskuteczne, jeżeli sprzedawca zataił podstępnie wadę przed kupującym.',
        savedAt: admin.firestore.Timestamp.now()
    },
    {
        id: 'KC_Art_563',
        source: 'ISAP',
        publisher: 'Dz.U.',
        year: 2025,
        pos: 1071,
        title: 'Kodeks Cywilny - Art. 563: Badanie rzeczy (B2B)',
        content: 'Art. 563. [Badanie rzeczy i zawiadomienie o wadzie] § 1. Przy sprzedaży między przedsiębiorcami kupujący traci uprawnienia z tytułu rękojmi, jeżeli nie zbadał rzeczy w czasie i w sposób przyjęty przy rzeczach tego rodzaju i nie zawiadomił niezwłocznie sprzedawcy o wadzie, a w przypadku gdy wada wyszła na jaw dopiero później – jeżeli nie zawiadomił sprzedawcy niezwłocznie po jej wykryciu. § 2. (uchylony) § 3. Do zachowania terminów, o których mowa w paragrafach poprzedzających, wystarczy wysłanie przed ich upływem zawiadomienia o wadzie.',
        savedAt: admin.firestore.Timestamp.now()
    },
    {
        id: 'KC_Art_560',
        source: 'ISAP',
        publisher: 'Dz.U.',
        year: 2025,
        pos: 1071,
        title: 'Kodeks Cywilny - Art. 560: Uprawnienia kupującego',
        content: 'Art. 560. [Uprawnienia kupującego w razie wady rzeczy] § 1. Jeżeli rzecz sprzedana ma wadę, kupujący może złożyć oświadczenie o obniżeniu ceny albo odstąpieniu od umowy, chyba że sprzedawca niezwłocznie i bez nadmiernych niedogodności dla kupującego wymieni rzecz wadliwą na wolną od wad albo wadę usunie. Ograniczenie to nie ma zastosowania, jeżeli rzecz była już wymieniona lub naprawiana przez sprzedawcę albo sprzedawca nie uczynił zadość obowiązkowi wymiany rzeczy na wolną od wad lub usunięcia wady. [...] § 4. Kupujący nie może odstąpić od umowy, jeżeli wada jest nieistotna.',
        savedAt: admin.firestore.Timestamp.now()
    }
];

async function addArticles() {
    const batch = db.batch();
    const kbRef = db.collection('users').doc(uid).collection('chats').doc(chatId).collection('legal_knowledge');

    for (const art of articles) {
        const docRef = kbRef.doc(art.id);
        batch.set(docRef, art);
    }

    await batch.commit();
    console.log('ARTICLES_ADDED_SUCCESSFULLY');
}

addArticles();
