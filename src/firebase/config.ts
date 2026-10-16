// Firebase SDK imports
import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Firebase configuration — credentials loaded from Vite env vars
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase services
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// ─── Enable IndexedDB offline persistence ────────────────────────────────────
// Allows the app to function in unstable networks without losing data.
// Forms that were saved will be queued and synced once connectivity returns.
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === "failed-precondition") {
    // Multiple tabs open — persistence can only be enabled in one at a time.
    console.warn(
      "[Firebase] Persistencia offline deshabilitada: múltiples pestañas abiertas."
    );
  } else if (err.code === "unimplemented") {
    console.warn(
      "[Firebase] Persistencia offline no soportada en este navegador."
    );
  }
});
