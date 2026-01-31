import { onDocumentCreated, onDocumentUpdated } from "firebase-functions/v2/firestore";
import { db, Timestamp } from "../services/db";
import * as logger from "firebase-functions/logger";

/**
 * Syncs user subscription limits when a subscription document is created or updated
 * by the Stripe Extension.
 */
export const syncUserSubscription = onDocumentUpdated("customers/{userId}/subscriptions/{subscriptionId}", async (event) => {
    const userId = event.params.userId;
    const subData = event.data?.after.data();

    if (!subData) return;

    logger.info(`🔄 Syncing subscription for user ${userId}. Status: ${subData.status}`);

    // If subscription is not active or trialing, we don't update limits here 
    // (though handles might block access based on status anyway)
    if (!['active', 'trialing'].includes(subData.status)) {
        return;
    }

    const priceId = subData.items?.[0]?.price?.id;
    if (!priceId) {
        logger.warn(`⚠️ No priceId found for subscription ${event.params.subscriptionId}`);
        return;
    }

    const userRef = db.collection('users').doc(userId);

    // Limits based on plan
    let creditLimit = 10;
    let tokenLimit = 1000000;
    let packageType: 'starter' | 'pro' = 'starter';

    // We check against environment variables or placeholders
    // On production, these should match the real Stripe Price IDs
    const STARTER_ID = process.env.VITE_STRIPE_PRICE_STARTER || "price_1StBSvDXnXONl2svkF51zTnl";
    const PRO_ID = process.env.VITE_STRIPE_PRICE_PRO || "price_pro_placeholder";

    if (priceId === PRO_ID) {
        creditLimit = 50;
        tokenLimit = 6500000;
        packageType = 'pro';
    } else if (priceId === STARTER_ID) {
        creditLimit = 10;
        tokenLimit = 1000000;
        packageType = 'starter';
    } else {
        logger.info(`ℹ️ Price ID ${priceId} doesn't match known plans. Using defaults.`);
    }

    try {
        await userRef.set({
            profile: {
                subscription: {
                    creditLimit,
                    tokenLimit,
                    packageType,
                    // Reset spent if it's a fresh activation or period start?
                    // Usually we reset on period start, but Stripe extension handles periods.
                    // For now, we ensure limits are correct.
                    status: subData.status,
                    isPaid: true
                }
            }
        }, { merge: true });

        logger.info(`✅ Successfully synced subscription for ${userId} to ${packageType} plan.`);
    } catch (e) {
        logger.error(`❌ Failed to sync subscription for ${userId}`, e);
    }
});
