import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
import { getStorage, connectStorageEmulator } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCu_1o6I_hyV21Xk2m-TfWJ9kwPjX0wCf8",
  authDomain: "asystent-prawny.pro",
  projectId: "low-assit",
  storageBucket: "low-assit.firebasestorage.app",
  messagingSenderId: "1092592744132",
  appId: "1:1092592744132:web:7306d6c45a9f389b90fb91",
  measurementId: "G-HJ19Y2S1WE"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});
export const storage = getStorage(app);
export const functions = getFunctions(app, 'us-central1');
export const googleProvider = new GoogleAuthProvider();

// 1. Connect to emulators if running locally (Must happen before ANY other Firestore method)
const isLocalhost = location.hostname === "localhost" || location.hostname === "127.0.0.1";
const isNgrok = location.hostname.endsWith(".ngrok-free.app") || location.hostname.endsWith(".ngrok.io");
const isLocalNetwork = /^192\.168\.|^10\.|^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(location.hostname);

const USE_EMULATORS = localStorage.getItem('useEmulators') === 'true';

if ((isLocalhost || isNgrok || isLocalNetwork) && USE_EMULATORS) {
  const host = isLocalhost ? "127.0.0.1" : location.hostname;
  console.log(`Connecting to Firebase Emulators on ${host}...`);

  connectAuthEmulator(auth, `http://${host}:9099`, { disableWarnings: true });
  connectFirestoreEmulator(db, host, 8080);
  connectFunctionsEmulator(functions, host, 5001);
  connectStorageEmulator(storage, host, 9199);
} else {
  console.log("Using production Firebase environment.");
}

// 2. Persistence is now handled via initializeFirestore options above.