import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getAuth } from "firebase-admin/auth";
import { wipeUserData, storage } from "../services/db";
import { LawArea } from "../types";

export const deleteMyPersonalData = onCall({ cors: true }, async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Musisz być zalogowany.');
    const uid = request.auth.uid;
    try {
        await wipeUserData(uid, false, storage, LawArea);
        return { success: true };
    } catch (error: any) {
        throw new HttpsError('internal', 'Wystąpił błąd podczas usuwania danych.');
    }
});

export const deleteMyAccount = onCall({ cors: true }, async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Musisz być zalogowany.');
    const uid = request.auth.uid;
    try {
        // 1. Wipe all data (Firestore, Storage)
        await wipeUserData(uid, true, storage, LawArea);

        // 2. Delete the user from Firebase Authentication
        await getAuth().deleteUser(uid);

        return { success: true };
    } catch (error: any) {
        throw new HttpsError('internal', 'Wystąpił błąd podczas usuwania konta.');
    }
});
