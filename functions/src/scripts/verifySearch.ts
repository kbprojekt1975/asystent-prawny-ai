import * as admin from 'firebase-admin';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function verify() {
    console.log("=== DIAGNOSTYKA WYSZUKIWANIA WEKTOROWEGO ===");

    const apiKey = process.env.GEMINI_API_KEY_LOCAL;
    const genAI = new GoogleGenerativeAI(apiKey!);
    const model = genAI.getGenerativeModel({ model: "text-embedding-004" });

    const query = "przeszkody w zawarciu małżeństwa";
    console.log(`1. Generuję wektor dla: "${query}"...`);

    try {
        const embRes = await model.embedContent(query);
        const vector = embRes.embedding.values;

        console.log("2. Łączę z emulatorem Firestore...");
        process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
        if (admin.apps.length === 0) {
            admin.initializeApp({ projectId: 'low-assit' });
        }
        const db = admin.firestore();

        console.log("3. Testowa imigracja dokumentu z VectorValue...");
        const testDocRef = db.collection('knowledge_library').doc('test_act').collection('chunks').doc('test_chunk');

        await testDocRef.set({
            content: "To jest unikalny dokument o przeszkodach w zawarciu małżeństwa.",
            userId: "GLOBAL",
            embedding: new (admin.firestore as any).VectorValue(vector),
            metadata: { title: "Test Act" }
        });
        console.log("   Dokument testowy zapisany.");

        console.log("4. Wykonuję findNearest...");
        const snap = await db.collectionGroup('chunks')
            .where('userId', 'in', ['GLOBAL'])
            .findNearest('embedding', new (admin.firestore as any).VectorValue(vector), {
                limit: 5,
                distanceMeasure: 'COSINE'
            })
            .get();

        console.log(`   WYNIK: Znaleziono ${snap.size} wyników.`);
        snap.forEach(doc => {
            console.log(`   - [${doc.id}] ${doc.data().content.substring(0, 50)}...`);
        });

    } catch (e: any) {
        console.error("Błąd diagnostyki:", e.message);
    }
}

verify();
