import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAQM8iWQX0pr5t81TzAl7nJsktX2lKfbJ8",
  authDomain: "ambulancias-villarrica.firebaseapp.com",
  projectId: "ambulancias-villarrica",
  storageBucket: "ambulancias-villarrica.firebasestorage.app",
  messagingSenderId: "115797701475",
  appId: "1:115797701475:web:39fb079e59f211616bd956"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const email = "gonzalop14@gmail.com";
const password = "AdminVillarrica2026!";

async function run() {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    console.log("SUCCESS_CREATED:", cred.user.uid, cred.user.email);
  } catch (err) {
    if (err.code === "auth/email-already-in-use") {
      console.log("ALREADY_EXISTS: Attempting login test...");
      try {
        const loginCred = await signInWithEmailAndPassword(auth, email, password);
        console.log("LOGIN_OK:", loginCred.user.uid);
      } catch (loginErr) {
        console.log("LOGIN_FAILED:", loginErr.code, loginErr.message);
      }
    } else {
      console.error("ERROR:", err.code, err.message);
    }
  }
}

run();
