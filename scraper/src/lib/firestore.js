import { readFileSync } from "node:fs";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
if (!serviceAccountPath) {
  throw new Error("FIREBASE_SERVICE_ACCOUNT_PATH is not set (see scraper/.env.example)");
}

const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf8"));

initializeApp({ credential: cert(serviceAccount) });

export const db = getFirestore();
