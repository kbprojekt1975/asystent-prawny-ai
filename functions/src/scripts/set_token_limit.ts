
import { db } from "../services/db";

async function setTokenLimit() {
    console.log("🔍 Finding users to update token limit...");
    const snapshot = await db.collection('users').get();

    if (snapshot.empty) {
        console.log("❌ No user documents found.");
        return;
    }

    const updates = snapshot.docs.map(async doc => {
        console.log(`Assigning 1,000,000 tokens to user: ${doc.id}`);
        await doc.ref.set({
            profile: {
                subscription: {
                    tokenLimit: 1000000,
                    // safe init of tokensUsed if not exists, but increment handles it usually. 
                    // Let's not overwrite spentAmount
                }
            }
        }, { merge: true });
    });

    await Promise.all(updates);
    console.log("✅ All users updated with tokenLimit: 1,000,000");
}

setTokenLimit().catch(console.error);
