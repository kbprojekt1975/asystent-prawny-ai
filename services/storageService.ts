import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { collection, doc, setDoc, deleteDoc, serverTimestamp, query, getDocs } from "firebase/firestore";
import { storage, db } from "./firebase";
import { CaseDocument } from "../types";

export const uploadCaseDocument = async (
    userId: string,
    caseId: string,
    file: File
): Promise<CaseDocument> => {
    const filePath = `users/${userId}/cases/${caseId}/documents/${Date.now()}_${file.name}`;
    const storageRef = ref(storage, filePath);

    // Upload file
    await uploadBytes(storageRef, file);

    // Get URL
    const url = await getDownloadURL(storageRef);

    // Create metadata in Firestore
    const docId = `doc_${Date.now()}`;
    const docRef = doc(db, "users", userId, "chats", caseId, "documents", docId);

    const caseDoc: CaseDocument = {
        id: docId,
        name: file.name,
        type: file.type,
        size: file.size,
        url: url,
        uploadedAt: serverTimestamp(),
        path: filePath,
        userId: userId // Essential for global collection group queries
    };

    await setDoc(docRef, caseDoc);

    return caseDoc;
};

export const deleteCaseDocument = async (
    userId: string,
    caseId: string,
    docId: string,
    filePath: string
): Promise<void> => {
    // Delete from Storage
    const storageRef = ref(storage, filePath);
    await deleteObject(storageRef);

    // Delete from Firestore
    const docRef = doc(db, "users", userId, "chats", caseId, "documents", docId);
    await deleteDoc(docRef);
};

export const getCaseDocuments = async (
    userId: string,
    caseId: string
): Promise<CaseDocument[]> => {
    const docsRef = collection(db, "users", userId, "chats", caseId, "documents");
    const q = query(docsRef);
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
        ...doc.data()
    } as CaseDocument));
};
