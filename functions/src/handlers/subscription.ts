import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import { db } from "../services/db";
import { getPricingConfig } from "../services/ai";
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

    const pricingConfig = await getPricingConfig(db);
    const planConfig = pricingConfig.plans?.[priceId];

    let creditLimit = 10;
    let tokenLimit = 333000;
    let packageType: 'starter' | 'pro' = 'starter';

    if (planConfig) {
        creditLimit = planConfig.creditLimit;
        tokenLimit = planConfig.tokenLimit;
        packageType = planConfig.name;
        logger.info(`📋 Using dynamic plan config for ${priceId}: ${packageType}`);
    } else {
        logger.warn(`⚠️ Price ID ${priceId} not found in dynamic config plans. Using hardcoded defaults.`);
        const STARTER_ID = "price_1StBSvDXnXONl2svkF51zTnl";
        const PRO_ID = "price_1Sw7KFDXnXONl2svPmtUXAxk";

        if (priceId === STARTER_ID) {
            creditLimit = 10;
            tokenLimit = 333000;
            packageType = 'starter';
        } else if (priceId === PRO_ID) {
            creditLimit = 50;
            tokenLimit = 2166666;
            packageType = 'pro';
        } else {
            // Default fallback if unknown
            creditLimit = 0;
            tokenLimit = 0;
            packageType = 'starter';
            logger.warn(`🛑 Unknown Price ID ${priceId}. Set limits to 0.`);
        }
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
                },
                isActive: true // Auto-activate on valid subscription
            }
        }, { merge: true });

        logger.info(`✅ Successfully synced subscription for ${userId} to ${packageType} plan.`);
    } catch (e) {
        logger.error(`❌ Failed to sync subscription for ${userId}`, e);
    }
});
