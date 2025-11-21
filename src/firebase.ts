import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, setPersistence, browserSessionPersistence } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyB-dhq9I2KnUdI0m98z8nla95cVLFjzV84",
  authDomain: "todo-99ca7.firebaseapp.com",
  projectId: "todo-99ca7",
  storageBucket: "todo-99ca7.firebasestorage.app",
  messagingSenderId: "105838416010",
  appId: "1:105838416010:web:1e99a8ff11401d13791d73",
  measurementId: "G-MQDWXYPK5E"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Use session persistence so that the user stays signed in across page refreshes
// but not across other browser sessions/tabs. This stores the auth state in
// the session storage (similar to session cookies behavior for a single tab).
setPersistence(auth, browserSessionPersistence).catch((err) => {
  // Non-fatal — if persistence can't be set we still have a working auth instance.
  // Log for visibility during development.
  // eslint-disable-next-line no-console
  console.warn('Could not set auth persistence to session:', err);
});
const db = getFirestore(app);

export { app, auth, db };
