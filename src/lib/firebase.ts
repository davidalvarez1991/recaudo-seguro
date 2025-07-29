
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: "recaudo-seguro.firebaseapp.com",
  projectId: "recaudo-seguro",
  storageBucket: "recaudo-seguro.appspot.com",
  messagingSenderId: "547595522209",
  appId: "1:547595522209:web:57a4f2824bea39f53ba0e0"
};

let app: FirebaseApp;
if (!getApps().length) {
    app = initializeApp(firebaseConfig);
} else {
    app = getApp();
}

const db = getFirestore(app);
const storage = getStorage(app);

export { app, db, storage };
