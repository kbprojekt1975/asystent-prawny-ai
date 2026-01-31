import { db } from "../services/db";

async function fixTokensUsed() {
    console.log("🔧 Fixing tokensUsed for all users...");
    const snapshot = await db.collection('users').get();

    if (snapshot.empty) {
        console.log("❌ No user documents found.");
        return;
    }

    const updates = snapshot.docs.map(async doc => {
        const data = doc.data();
        const tokensUsed = data.profile?.subscription?.tokensUsed;

        if (tokensUsed === undefined) {
            console.log(`Setting tokensUsed: 0 for user: ${doc.id}`);
            await doc.ref.set({
                profile: {
                    subscription: {
                        tokensUsed: 0
                    }
                }
            }, { merge: true });
        } else {
            console.log(`User ${doc.id} already has tokensUsed: ${tokensUsed}`);
        }
    });

    await Promise.all(updates);
    console.log("✅ All users fixed!");
}

fixTokensUsed().catch(console.error);
