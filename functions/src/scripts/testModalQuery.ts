import * as admin from 'firebase-admin';

async function testQuery() {
    console.log("=== TEST ZAPYTANIA BAZY WIEDZY ===");
    process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";

    if (admin.apps.length === 0) {
        admin.initializeApp({ projectId: 'low-assit' });
    }
    const db = admin.firestore();

    // Path from my manual check
    const userId = "TMBPca86SmzalOlx5zBtZeNadkWx";
    const chatId = "Prawo Rodzinne_test";

    const collectionPath = `users/${userId}/chats/${chatId}/legal_knowledge`;
    console.log(`Próba pobrania z: ${collectionPath}`);

    try {
        const snap = await db.collection(collectionPath)
            .orderBy('savedAt', 'desc')
            .get();

        console.log(`SUKCES: Znaleziono ${snap.size} dokumentów.`);
        snap.forEach(doc => {
            console.log(`- [${doc.id}] savedAt: ${doc.data().savedAt?.toDate()}`);
        });
    } catch (err: any) {
        console.error("BŁĄD ZAPYTANIA:", err.message);
        console.error("KOD:", err.code);
    }
}

testQuery();
