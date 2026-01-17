
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

async function verifyImprovedSync() {
    console.log('Testing add_ruling_to_topic_knowledge with provided content...');

    // Simulate what the tool handler does
    const judgmentId = 999999; // Mock ID
    const caseNumber = 'VERIFY-123/24';
    const mockContent = 'This is a mock ruling content provided by AI to avoid fetch.';
    const mockTitle = 'Mock Ruling Title';

    const caseKnowledgeRef = db.collection('users').doc(uid).collection('chats').doc(chatId).collection('legal_knowledge').doc(`SAOS_${judgmentId}`);

    await caseKnowledgeRef.set({
        source: 'SAOS',
        judgmentId,
        caseNumber,
        content: mockContent,
        savedAt: admin.firestore.Timestamp.now(),
        title: mockTitle
    });

    const savedDoc = await caseKnowledgeRef.get();
    if (savedDoc.exists && savedDoc.data().content === mockContent) {
        console.log('SUCCESS: Ruling saved with provided content.');
    } else {
        console.error('FAILURE: Ruling not saved correctly.');
    }
}

verifyImprovedSync();
