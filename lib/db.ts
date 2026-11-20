import { initializeApp, getApps, getApp, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

if (!getApps().length) {
  const projectId = process.env.GCP_PROJECT ?? "skillproof-52076";
  initializeApp({
    credential: applicationDefault(),
    ...(projectId ? { projectId } : {}),
  });
}

export const adminApp = getApp();
export const db = getFirestore(adminApp);