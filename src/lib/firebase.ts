
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC4Nmc7fs5XRFj0lE4LKhEzBagGr6Ttnyc",
  authDomain: "recaudo-seguro.firebaseapp.com",
  projectId: "recaudo-seguro",
  storageBucket: "recaudo-seguro.appspot.com",
  messagingSenderId: "547595522209",
  appId: "1:547595522209:web:57a4f2824bea39f53ba0e0"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export { app, db };
