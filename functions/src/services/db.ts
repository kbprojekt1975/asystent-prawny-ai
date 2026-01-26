import { initializeApp } from "firebase-admin/app";
import { getFirestore, Timestamp, FieldValue } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import * as logger from "firebase-functions/logger";

initializeApp();

export const db = getFirestore();
export const storage = getStorage();
export { Timestamp, FieldValue };

export const isMasterAdmin = (auth: any): boolean => {
    if (!auth) return false;
    const uid = auth.uid;
    const email = auth.token?.email || "";

    return uid === "Yb23rXe0JdOvieB3grdaN0Brmkjh" ||
        email.includes("kbprojekt1975@gmail.com") ||
        email.includes("konrad@example.com") ||
        email.includes("wielki@electronik.com");
};

export async function deleteCollection(collectionRef: any) {
    const snapshot = await collectionRef.get();
    if (snapshot.empty) return;

    // Process in batches of 500
    const chunks = [];
    for (let i = 0; i < snapshot.docs.length; i += 500) {
        chunks.push(snapshot.docs.slice(i, i + 500));
    }

    for (const chunk of chunks) {
        const batch = db.batch();
        chunk.forEach((doc: any) => batch.delete(doc.ref));
        await batch.commit();
    }
}

export async function wipeUserData(uid: string, deleteUserDoc: boolean, storage: any, LawArea: any) {
    const userRef = db.collection('users').doc(uid);

    try {
        const bucket = storage.bucket();
        await bucket.deleteFiles({ prefix: `users/${uid}/` });


        const topSubs = ['legal_knowledge', 'reminders', 'timeline', 'chats', 'knowledge_bases'];
        for (const sub of topSubs) {
            const subRef = userRef.collection(sub);
            if (sub === 'chats') {
                const chatsSnap = await subRef.get();
                for (const chatDoc of chatsSnap.docs) {
                    const chatRef = chatDoc.ref;
                    const chatSubs = ['legal_knowledge', 'documents', 'timeline', 'checklist'];
                    for (const cSub of chatSubs) {
                        await deleteCollection(chatRef.collection(cSub));
                    }
                    await chatRef.delete();
                }
            } else {
                await deleteCollection(subRef);
            }
        }

        // Delete Stripe Customers Data
        const customerRef = db.collection('customers').doc(uid);
        const customerSubs = ['subscriptions', 'checkout_sessions', 'payments', 'tax_ids']; // Common Stripe Extension subcollections
        for (const sub of customerSubs) {
            await deleteCollection(customerRef.collection(sub));
        }
        await customerRef.delete();

        if (deleteUserDoc) {
            await userRef.delete();
        } else {
            await userRef.update({
                personalData: FieldValue.delete(),
                totalCost: 0,
                "profile.personalData": FieldValue.delete(),
                topics: {
                    [LawArea.Criminal]: [],
                    [LawArea.Family]: [],
                    [LawArea.Civil]: [],
                    [LawArea.Commercial]: []
                }
            });
        }
    } catch (error) {
        logger.error(`Error wiping data for user ${uid}:`, error);
        throw error;
    }
}
