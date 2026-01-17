import * as logger from "firebase-functions/logger";

export interface JudgmentSearchParams {
    all?: string; // Keywords
    judgmentType?: string;
    courtType?: string;
    pageSize?: number;
}

export interface JudgmentMetadata {
    id: number;
    href: string;
    courtType: string;
    caseNumber: string;
    judgmentDate: string;
    summary?: string;
    textContent?: string;
}

/**
 * Searches for judgments in the SAOS API.
 */
export async function searchJudgments(params: JudgmentSearchParams): Promise<JudgmentMetadata[]> {
    const url = new URL("https://www.saos.org.pl/api/search/judgments");

    if (params.all) url.searchParams.append('all', params.all);
    if (params.judgmentType) url.searchParams.append('judgmentType', params.judgmentType);
    if (params.courtType) url.searchParams.append('courtType', params.courtType);
    if (params.pageSize) url.searchParams.append('pageSize', params.pageSize.toString());

    // Default filters to ensure high quality for RAG
    if (!params.judgmentType) url.searchParams.append('judgmentType', 'SENTENCE');
    if (!params.courtType) url.searchParams.append('courtType', 'COMMON');

    try {
        const response = await fetch(url.toString(), {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        if (!response.ok) {
            throw new Error(`SAOS API Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json() as any;
        const items = (data.items || []) as any[];

        return items.map(item => ({
            id: item.id,
            href: item.href,
            courtType: item.courtType,
            caseNumber: item.courtCases?.[0]?.caseNumber || "N/A",
            judgmentDate: item.judgmentDate,
            summary: item.summary,
            textContent: item.textContent
        }));
    } catch (error) {
        logger.error("Error searching judgments in SAOS", error);
        return [];
    }
}

/**
 * Fetches the FULL text content of a specific judgment.
 */
export async function getJudgmentText(id: number): Promise<string> {
    const url = `https://www.saos.org.pl/api/judgments/${id}`;

    try {
        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        if (!response.ok) {
            throw new Error(`SAOS Details API Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json() as any;
        const htmlContent = data.data?.textContent || "";

        // Basic HTML cleaning
        let text = htmlContent
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        if (text.length < 100 && data.data?.summary) {
            text = data.data.summary;
        }

        return text;
    } catch (error: any) {
        logger.error(`Error fetching judgment content: ${id}`, error);
        throw error;
    }
}
