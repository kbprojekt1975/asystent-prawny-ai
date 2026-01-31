import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { db, Timestamp } from "../services/db";
import * as logger from "firebase-functions/logger";

/**
 * Trigger when a new user document is created in Firestore.
 * Automatically initializes subscription limits.
 */
export const initializeNewUser = onDocumentCreated("users/{userId}", async (event) => {
    const userId = event.params.userId;
    const userData = event.data?.data();

    logger.info(`👶 New user document created: ${userId}. Initializing subscription...`);

    // Check if subscription already exists (to avoid overwriting)
    if (userData?.profile?.subscription?.tokenLimit) {
        logger.info(`⏭️ User ${userId} already has subscription initialized. Skipping.`);
        return;
    }

    const userRef = db.collection('users').doc(userId);

    const subscriptionDefaults = {
        profile: {
            subscription: {
                creditLimit: 10,  // 10 PLN
                tokenLimit: 1000000, // 1M Tokens (Gemini 1.5 Pro Input equivalent)
                spentAmount: 0,
                tokensUsed: 0,
                activatedAt: Timestamp.now(),
                expiresAt: Timestamp.fromMillis(Date.now() + 30 * 24 * 60 * 60 * 1000) // +30 days
            }
        }
    };

    try {
        await userRef.set(subscriptionDefaults, { merge: true });
        logger.info(`✅ Initialized subscription for ${userId} with Credit:10, Tokens:1M`);
    } catch (e) {
        logger.error(`❌ Failed to initialize subscription for ${userId}`, e);
    }
});
