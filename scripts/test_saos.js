
async function testSAOS() {
    const query = 'rękojmia B2B';
    const url = `https://www.saos.org.pl/api/search/judgments?all=${encodeURIComponent(query)}&pageSize=3`;

    console.log('Testing Search URL:', url);

    try {
        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0'
            }
        });

        if (!response.ok) {
            console.error('Search failed:', response.status, response.statusText);
            return;
        }

        const data = await response.json();
        console.log('Search Result Items count:', data.items?.length || 0);

        if (data.items && data.items.length > 0) {
            const item = data.items[0];
            console.log('First Item ID:', item.id);
            console.log('First Item Case Number:', item.courtCases?.[0]?.caseNumber);
            console.log('First Item textContent length:', item.textContent?.length || 0);

            console.log('\nTesting Details URL for ID:', item.id);
            const detailsUrl = `https://www.saos.org.pl/api/judgments/${item.id}`;
            const detailsRes = await fetch(detailsUrl, {
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'Mozilla/5.0'
                }
            });

            if (!detailsRes.ok) {
                console.error('Details fetch failed:', detailsRes.status, detailsRes.statusText);
                return;
            }

            const detailsData = await detailsRes.json();
            console.log('Details Data Keys:', Object.keys(detailsData));
            if (detailsData.data) {
                console.log('Details Data.data Keys:', Object.keys(detailsData.data));
                console.log('Details content length:', detailsData.data.textContent?.length || 0);
            } else {
                console.log('Details content length (top level):', detailsData.textContent?.length || 0);
            }
        } else {
            console.log('No results found for query.');
        }
    } catch (err) {
        console.error('Error:', err);
    }
}

testSAOS();
