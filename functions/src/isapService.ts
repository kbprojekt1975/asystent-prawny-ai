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

    if (params.keyword) url.searchParams.append('keyword', params.keyword);
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

        // The API returns an object with 'items' array
        const items = data.items || [];

        return items.slice(0, 5).map((item: any) => ({
            publisher: item.publisher,
            year: item.year,
            pos: item.pos,
            title: item.title,
            announcementDate: item.announcementDate
        }));
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
