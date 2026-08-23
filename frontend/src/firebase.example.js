// Firebase Console -> Project settings -> Your apps -> SDK setup and configuration
// Copy this file to firebase.js and paste your real config below (see README "Missing Steps").
// firebase.js is gitignored so your real config never gets committed.
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "REPLACE_ME",
  authDomain: "REPLACE_ME.firebaseapp.com",
  projectId: "REPLACE_ME",
  storageBucket: "REPLACE_ME.appspot.com",
  messagingSenderId: "REPLACE_ME",
  appId: "REPLACE_ME",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
