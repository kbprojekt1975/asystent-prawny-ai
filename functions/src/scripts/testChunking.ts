import { getFullActContent } from '../isapService';

async function test() {
    const content = await getFullActContent('DU', 2023, 2809);

    // Decode HTML entities
    let decoded = content
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"');

    console.log("=== DECODED CONTENT (first 3000 chars) ===");
    console.log(decoded.substring(0, 3000));

    console.log("\n=== TESTING ALL PATTERNS ===");

    // Pattern 1
    let chunks1 = decoded.split(/(?=Art\.\s*\d+[a-z]?\.)/gi)
        .map(c => c.trim())
        .filter(c => c.length > 50);
    console.log(`Pattern 1 (Art. X.): ${chunks1.length} chunks`);

    // Pattern 2
    let chunks2 = decoded.split(/(?=Artykuł\s+\d+[a-z]?)/gi)
        .map(c => c.trim())
        .filter(c => c.length > 50);
    console.log(`Pattern 2 (Artykuł X): ${chunks2.length} chunks`);

    // Pattern 3
    let chunks3 = decoded.split(/(?=§\s*\d+\.)/g)
        .map(c => c.trim())
        .filter(c => c.length > 50);
    console.log(`Pattern 3 (§ X.): ${chunks3.length} chunks`);

    // Fallback
    let chunks4 = decoded.match(/.{1,2000}/gs) || [decoded];
    console.log(`Fallback (fixed 2000): ${chunks4.length} chunks`);

    if (chunks1.length > 5) {
        console.log("\n=== FIRST 3 CHUNKS (Pattern 1) ===");
        chunks1.slice(0, 3).forEach((c, i) => {
            console.log(`\n--- Chunk ${i + 1} (${c.length} chars) ---`);
            console.log(c.substring(0, 300));
        });
    }
}

test();
