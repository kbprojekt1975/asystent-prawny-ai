
async function testSAOSQueries() {
    const queries = ['rękojmia wada maszyna', 'odszkodowanie rękojmia', 'rękojmia B2B'];

    for (const query of queries) {
        console.log(`\n--- Testing Query: "${query}" ---`);
        const url = `https://www.saos.org.pl/api/search/judgments?all=${encodeURIComponent(query)}&pageSize=5`;

        try {
            const response = await fetch(url, {
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'Mozilla/5.0'
                }
            });

            if (!response.ok) {
                console.error(`Search failed for "${query}":`, response.status, response.statusText);
                continue;
            }

            const data = await response.json();
            console.log(`Results found: ${data.items?.length || 0}`);
            if (data.items && data.items.length > 0) {
                console.log(`First item: ${data.items[0].courtCases?.[0]?.caseNumber} (ID: ${data.items[0].id})`);
            }
        } catch (err) {
            console.error(`Error for "${query}":`, err.message);
        }
    }
}

testSAOSQueries();
