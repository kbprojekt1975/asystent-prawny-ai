import { onCall, onRequest, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { db, isMasterAdmin, wipeUserData, storage } from "../services/db";
import { GEMINI_API_KEY } from "../services/ai";
import { LawArea } from "../types";

export const resetGlobalDatabase = onCall({ cors: true }, async (request) => {
    if (!isMasterAdmin(request.auth)) {
        throw new HttpsError('permission-denied', 'Only admin can reset database.');
    }

    logger.info("!!! GLOBAL DATABASE RESET INITIATED !!!");
    try {
        const usersSnap = await db.collection('users').get();
        for (const userDoc of usersSnap.docs) {
            await wipeUserData(userDoc.id, false, storage, LawArea);
        }
        return { success: true };
    } catch (error: any) {
        logger.error("Global database reset error:", error);
        throw new HttpsError('internal', 'Error resetting database.');
    }
});

export const ingestLegalAct = onRequest({
    secrets: [GEMINI_API_KEY],
    timeoutSeconds: 540,
    memory: '1GiB'
}, async (req, res) => {
    // Ingestion logic...
    res.status(200).send("Admin Ingestion Modularized.");
});
