import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

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

export { app, auth };
