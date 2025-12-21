import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
import { getStorage, connectStorageEmulator } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCu_1o6I_hyV21Xk2m-TfWJ9kwPjX0wCf8",
  authDomain: "low-assit.firebaseapp.com",
  projectId: "low-assit",
  storageBucket: "low-assit.firebasestorage.app",
  messagingSenderId: "1092592744132",
  appId: "1:1092592744132:web:7306d6c45a9f389b90fb91",
  measurementId: "G-HJ19Y2S1WE"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app, 'us-central1'); // Region MUST match your deployment
export const googleProvider = new GoogleAuthProvider();

// Connect to emulators if running locally
if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
  console.log("Connecting to Firebase Emulators...");
  // Port 9099 for Auth, 8080 for Firestore, 5001 for Functions, 9199 for Storage
  connectAuthEmulator(auth, "http://127.0.0.1:9099");
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
  connectFunctionsEmulator(functions, "127.0.0.1", 5001);
  connectStorageEmulator(storage, "127.0.0.1", 9199);
}