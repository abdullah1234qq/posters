import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAP4FJ2jDwKztof30W1QGrXARLocdaczr0",
  authDomain: "posters-b5b34.firebaseapp.com",
  projectId: "posters-b5b34",
  storageBucket: "posters-b5b34.firebasestorage.app",
  messagingSenderId: "213729086692",
  appId: "1:213729086692:web:fd4583132d396d15a270f1",
  measurementId: "G-KCETMSNSQ6"
};

export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
