
import * as admin from 'firebase-admin';
import { getActContent, searchLegalActs } from '../isapService';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables for local execution
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const apiKey = process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY_LOCAL;

if (!apiKey) {
    console.error('BŁĄD: Brak klucza GEMINI_API_KEY w pliku .env');
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);
const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });

// Initialize Admin SDK for local usage (requires service account or default credentials)
// For local usage with emulator or direct access:
admin.initializeApp({
    projectId: 'low-assit' // Replace with your project ID if different
});

const db = admin.firestore();

/**
 * Intelligent chunking for Polish legal acts.
 * Splits by "Art. X." pattern.
 */
function chunkActContent(text: string): string[] {
    // Regex matches patterns like "Art. 1.", "Art. 2a.", "Art. 123.", etc.
    const chunks = text.split(/(?=Art\.\s*\d+[a-z]?\.)/g);
    return chunks.map(c => c.trim()).filter(c => c.length > 50); // Filter out very small fragments
}

async function importToVector(publisher: string, year: number, pos: number) {
    console.log(`\n--- Rozpoczynam proces dla: ${publisher} ${year} poz. ${pos} ---`);

    try {
        // 1. Get Metadata to have the title
        console.log("1. Pobieram metadane...");
        const searchResults = await searchLegalActs({ year, publisher: publisher as any });
        const actInfo = searchResults.find(a => a.pos === pos);
        const title = actInfo?.title || "Nieznany tytuł";

        // 2. Fetch full content
        console.log("2. Pobieram treść aktu...");
        const fullContent = await getActContent(publisher, year, pos);

        // 3. Chunking
        console.log("3. Dzielę treść na artykuły...");
        const chunks = chunkActContent(fullContent);
        console.log(`   Znaleziono ${chunks.length} artykułów/fragmentów.`);

        const actDocumentId = `${publisher}_${year}_${pos}`;
        const actRef = db.collection('knowledge_library').doc(actDocumentId);

        // Store header info
        await actRef.set({
            publisher,
            year,
            pos,
            title,
            updatedAt: admin.firestore.Timestamp.now()
        }, { merge: true });

        const chunksCollection = actRef.collection('chunks');

        // 4. Transform and Save
        console.log("4. Generuję wektory i zapisuję do bazy...");

        for (let i = 0; i < chunks.length; i++) {
            const chunkText = chunks[i];

            // Extract article number for metadata (optional but helpful)
            const artMatch = chunkText.match(/Art\.\s*(\d+[a-z]?)\./i);
            const articleNo = artMatch ? artMatch[1] : `part_${i}`;

            console.log(`   [${i + 1}/${chunks.length}] Przetwarzam Art. ${articleNo}...`);

            try {
                // Generate Embedding
                const result = await embeddingModel.embedContent(chunkText);
                const embeddingVector = result.embedding.values;

                // Save to Firestore
                await chunksCollection.doc(`art_${articleNo}`).set({
                    content: chunkText,
                    articleNo,
                    embedding: embeddingVector,
                    userId: "GLOBAL", // ISOLATION: Official acts are global
                    metadata: {
                        publisher,
                        year,
                        pos,
                        title
                    }
                });
            } catch (embedErr) {
                console.error(`   Błąd przy Art. ${articleNo}:`, embedErr);
            }
        }

        console.log(`\n✅ SUKCES: Akt "${title}" został zaindeksowany.`);

    } catch (err) {
        console.error("BŁĄD KRYTYCZNY:", err);
    }
}

// Example usage: 
// importToVector('DU', 2024, 1); // Replace with real act details
const args = process.argv.slice(2);
if (args.length === 3) {
    importToVector(args[0], parseInt(args[1]), parseInt(args[2]));
} else {
    console.log("Użycie: ts-node importAct.ts [DU/MP] [ROK] [POZYCJA]");
}
