
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';

initializeApp({
    projectId: 'low-assit'
});

const db = getFirestore();

async function findActiveChat() {
    const usersSnap = await db.collection('users').get();
    for (const userDoc of usersSnap.docs) {
        const userId = userDoc.id;
        const chatsSnap = await db.collection('users').doc(userId).collection('chats').orderBy('lastUpdated', 'desc').limit(1).get();
        if (!chatsSnap.empty) {
            const chatDoc = chatsSnap.docs[0];
            console.log(`FOUND_USER_ID: ${userId}`);
            console.log(`FOUND_CHAT_ID: ${chatDoc.id}`);
            return;
        }
    }
    console.log('NO_CHAT_FOUND');
}

findActiveChat();
