
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB-m11OcvdJzSXwA2sL3Oa1j5s_9s_8_g4",
  authDomain: "recaudo-seguro.firebaseapp.com",
  projectId: "recaudo-seguro",
  storageBucket: "recaudo-seguro.appspot.com",
  messagingSenderId: "547595522209",
  appId: "1:547595522209:web:57a4f2824bea39f53ba0e0"
};

// Initialize Firebase for SSR
function getFirebaseApp(): FirebaseApp {
  if (!getApps().length) {
    return initializeApp(firebaseConfig);
  }
  return getApp();
}

const app = getFirebaseApp();
const db = getFirestore(app);
const storage = getStorage(app);

export { app, db, storage };
