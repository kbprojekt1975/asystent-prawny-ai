
import * as admin from 'firebase-admin';
import { getFullActContent, searchLegalActs } from '../services/isapService';
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
if (process.env.FIRESTORE_EMULATOR_HOST) {
    console.log(`Connecting to Firestore Emulator at ${process.env.FIRESTORE_EMULATOR_HOST}`);
}
admin.initializeApp({
    projectId: 'low-assit' // Replace with your project ID if different
});

const db = admin.firestore();

/**
 * Intelligent chunking for Polish legal acts.
 * Splits by "Art. X." pattern.
 */
function chunkActContent(text: string): string[] {
    // Decode common HTML entities first
    const decoded = text
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"');

    // Regex matches patterns like "Art. 1.", "Art. 2a.", "Art. 123.", etc.
    // Added 'i' flag for case-insensitive matching (Art. vs art.)
    const chunks = decoded.split(/(?=Art\.\s*\d+[a-z]?\.)/gi);
    return chunks.map(c => c.trim()).filter(c => c.length > 50); // Filter out very small fragments
}

async function importToVector(publisher: string, year: number, pos: number, manualTitle?: string) {
    console.log(`\n--- Rozpoczynam proces dla: ${publisher} ${year} poz. ${pos} ---`);

    let title = manualTitle || "Nieznany tytuł";

    try {
        // 1. Get Metadata (SKIP if manual title provided)
        if (!manualTitle) {
            console.log("1. Pobieram metadane...");
            try {
                const searchResults = await searchLegalActs({ year, publisher: publisher as any });
                const actInfo = searchResults.find((a: any) => a.pos === pos);
                if (actInfo) title = actInfo.title;
            } catch (err) {
                console.warn("   [WARN] Nie udało się pobrać metadanych (tytułu). Używam domyślnego.", err);
            }
        } else {
            console.log(`1. Używam podanego tytułu: "${title}" (pomijam wyszukiwanie)`);
        }

        // 2. Fetch full content
        console.log("2. Pobieram treść aktu...");
        const fullContent = await getFullActContent(publisher, year, pos);

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

            let embedded = false;
            let retries = 0;
            const maxRetries = 3;

            while (!embedded && retries < maxRetries) {
                try {
                    // Rate limiting delay for free tier API key
                    if (i > 0 || retries > 0) await new Promise(resolve => setTimeout(resolve, 3000));

                    // Generate Embedding
                    const result = await embeddingModel.embedContent(chunkText);
                    const embeddingVector = result.embedding.values;

                    // Save to Firestore
                    // The original code used `new (admin.firestore as any).VectorValue(embeddingVector)`.
                    // The provided snippet adds `const { VectorValue } = require('firebase-admin/firestore');`
                    // but then still uses the `admin.firestore` path.
                    // We'll stick to the original `admin.firestore` path for consistency and to avoid redundant `require`.
                    await chunksCollection.doc(`art_${articleNo}`).set({
                        content: chunkText,
                        articleNo,
                        embedding: new (admin.firestore as any).VectorValue(embeddingVector),
                        userId: "GLOBAL", // ISOLATION: Official acts are global
                        metadata: {
                            publisher,
                            year,
                            pos,
                            title
                        }
                    });
                    embedded = true;
                } catch (err: any) {
                    retries++;
                    console.warn(`      [WARN] Błąd przy Art. ${articleNo} (próba ${retries}/${maxRetries}): ${err.message}`);
                    if (retries >= maxRetries) {
                        console.error(`      [ERROR] Nie udało się przetworzyć Art. ${articleNo} po ${maxRetries} próbach.`);
                    }
                }
            }
        }

        console.log(`\n✅ SUKCES: Akt "${title}" został zaindeksowany.`);

    } catch (err) {
        console.error("BŁĄD KRYTYCZNY:", err);
    }
}

// Example usage: 
// importToVector('DU', 2024, 1, "Tytuł");
const args = process.argv.slice(2);
if (args.length >= 3) {
    importToVector(args[0], parseInt(args[1]), parseInt(args[2]), args[3]);
} else {
    console.log("Użycie: ts-node importAct.ts [DU/MP] [ROK] [POZYCJA] [TYTUŁ_OPCJONALNY]");
}
