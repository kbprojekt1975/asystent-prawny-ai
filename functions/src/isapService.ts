import * as logger from "firebase-functions/logger";

export interface ActSearchParams {
    keyword?: string;
    year?: number;
    publisher?: 'DU' | 'MP';
    inForce?: boolean;
}

export interface ActMetadata {
    publisher: string;
    year: number;
    pos: number;
    title: string;
    announcementDate: string;
}

/**
 * Searches for legal acts in the Sejm/ELI API.
 */
export async function searchLegalActs(params: ActSearchParams): Promise<ActMetadata[]> {
    const url = new URL("https://api.sejm.gov.pl/eli/acts/search");

    // Intelligent keyword sanitization: remove metadata words that break ISAP search
    let query = (params.keyword || "")
        .replace(/tekst jednolity/gi, '')
        .replace(/obwieszczenie/gi, '')
        .replace(/\bustawa\b/gi, '')
        .replace(/\bo\b/gi, '')
        .replace(/art\.?\s*\d+[a-z]*/gi, '') // Remove Art. 123
        .replace(/artykuł\s*\d+/gi, '')
        .replace(/paragraf\s*\d+/gi, '')
        .replace(/\s+/g, ' ')
        .trim();

    // Fallback: If stripping leaves nothing (e.g. user just searched "Ustawa"), revert to original
    if (query.length < 3) query = params.keyword || "";

    url.searchParams.append('keyword', query);
    if (params.year) url.searchParams.append('year', params.year.toString());
    if (params.publisher) url.searchParams.append('publisher', params.publisher);
    if (params.inForce) url.searchParams.append('inForce', '1');

    try {
        const response = await fetch(url.toString(), {
            headers: { 'Accept': 'application/json' }
        });

        if (!response.ok) {
            throw new Error(`ISAP API Error: ${response.statusText}`);
        }

        const data = await response.json() as any;

        // The API returns an object with 'items' array. Increase limit to 30 to find consolidated texts.
        const items = (data.items || []) as any[];

        // PRIORITY HEURISTIC: Put consolidated texts (teksty jednolite) at the top
        const mappedItems = items.map((item: any) => ({
            publisher: item.publisher,
            year: item.year,
            pos: item.pos,
            title: item.title,
            announcementDate: item.announcementDate
        }));

        const prioritized = mappedItems.sort((a, b) => {
            const kwLower = (params.keyword || "").toLowerCase();
            const aTitle = a.title.toLowerCase();
            const bTitle = b.title.toLowerCase();

            const aIsConsolidated = aTitle.includes('jednolitego tekstu');
            const bIsConsolidated = bTitle.toLowerCase().includes('jednolitego tekstu');

            const aIsUstawa = aTitle.includes('ustawy');
            const bIsUstawa = bTitle.includes('ustawy');

            const aIsKodeks = aTitle.includes('kodeks');
            const bIsKodeks = bTitle.includes('kodeks');

            const aMatchesKw = aTitle.includes(kwLower);
            const bMatchesKw = bTitle.includes(kwLower);

            // 1. Consolidated Law + Kodeks + Kw Match (Perfect Match)
            const aIsPerfect = aIsConsolidated && aIsUstawa && aIsKodeks && aMatchesKw;
            const bIsPerfect = bIsConsolidated && bIsUstawa && bIsKodeks && bMatchesKw;
            if (aIsPerfect && !bIsPerfect) return -1;
            if (!aIsPerfect && bIsPerfect) return 1;

            // 2. Consolidated Law + Matches Kw
            const aIsConsolLawKw = aIsConsolidated && aIsUstawa && aMatchesKw;
            const bIsConsolLawKw = bIsConsolidated && bIsUstawa && bMatchesKw;
            if (aIsConsolLawKw && !bIsConsolLawKw) return -1;
            if (!aIsConsolLawKw && bIsConsolLawKw) return 1;

            // 3. Any Consolidated
            if (aIsConsolidated && !bIsConsolidated) return -1;
            if (!aIsConsolidated && bIsConsolidated) return 1;

            // Otherwise sort by year descending (newest first)
            return b.year - a.year;
        });

        return prioritized.slice(0, 15);
    } catch (error) {
        logger.error("Error searching acts in ISAP", error);
        return [];
    }
}

/**
 * Fetches the text content of a specific act.
 * Note: Sejm API returns HTML, so we perform basic cleaning.
 */
export async function getActContent(publisher: string, year: number, pos: number): Promise<string> {
    const url = `https://api.sejm.gov.pl/eli/acts/${publisher}/${year}/${pos}/text.html`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`ISAP Text API Error: ${response.statusText}`);
        }

        const html = await response.text();

        // Basic HTML cleaning for Gemini context
        // Removes tags and redundant whitespace
        let text = html
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        // Limit content length for the prototype (e.g., first 10k characters)
        return text.substring(0, 15000);
    } catch (error) {
        logger.error(`Error fetching act content: ${publisher}/${year}/${pos}`, error);
        return "Błąd podczas pobierania treści aktu prawnego.";
    }
}

/**
 * Fetches the FULL text content of a specific act (no character limit).
 * Use this for ingestion purposes only.
 */
export async function getFullActContent(publisher: string, year: number, pos: number): Promise<string> {
    const url = `https://api.sejm.gov.pl/eli/acts/${publisher}/${year}/${pos}/text.html`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`ISAP Text API Error: ${response.statusText}`);
        }

        const html = await response.text();

        // Basic HTML cleaning
        let text = html
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        return text; // NO LIMIT
    } catch (error) {
        logger.error(`Error fetching full act content: ${publisher}/${year}/${pos}`, error);
        return "Błąd podczas pobierania treści aktu prawnego.";
    }
}
