// Seeds one demo learner submission. Idempotent: uses a fixed doc id and only creates it
// if it doesn't exist yet, so running it twice never duplicates (or overwrites reviews).
//   npm run seed:demo
// Credentials: Application Default Credentials (gcloud auth application-default login),
// or GOOGLE_APPLICATION_CREDENTIALS if set. Never prints secret values.
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const DEMO_REPO_URL = process.env.DEMO_REPO_URL || "https://github.com/ShubhAFK/ratelimit-kit";
const DOC_ID = "demo-ratelimit-kit";

const projectId =
  process.env.GCP_PROJECT ||
  process.env.GOOGLE_CLOUD_PROJECT ||
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

if (!projectId) {
  console.error("seed-demo: set GCP_PROJECT (or NEXT_PUBLIC_FIREBASE_PROJECT_ID) first.");
  process.exit(1);
}

const app = process.env.GOOGLE_APPLICATION_CREDENTIALS
  ? initializeApp({ credential: applicationDefault(), projectId })
  : initializeApp({ projectId });
const db = getFirestore(app);

const submission = {
  uid: "demo-learner",
  email: "demo-learner@skillproof.demo",
  learner: "Aarav Mehta (demo learner)",
  title: "ratelimit-kit: Token Bucket and Sliding Window rate limiters in TypeScript",
  description:
    "A small dependency-free TypeScript library with two rate limiting algorithms behind one RateLimiter interface. " +
    "TokenBucket (src/tokenBucket.ts) refills lazily on each call from elapsed time instead of using a timer, so idle " +
    "limiters cost nothing and bursts up to capacity are allowed. SlidingWindow (src/slidingWindow.ts) keeps a log of " +
    "timestamps and evicts entries older than the window, which is exact but uses O(limit) memory; I documented that " +
    "trade-off in the README. Both support consuming n units at once and reject requests atomically (no partial spend). " +
    "Tests in src/__tests__ use fake timers to cover refill math, window boundaries, and over-capacity requests. " +
    "examples/demo.ts is a CLI that simulates bursty traffic against both limiters.",
  repoUrl: DEMO_REPO_URL,
  status: "pending",
  demo: true,
  createdAt: Date.now(),
};

const ref = db.collection("submissions").doc(DOC_ID);
const created = await db.runTransaction(async (tx) => {
  const snap = await tx.get(ref);
  if (snap.exists) return false;
  tx.create(ref, submission);
  return true;
});

console.log(
  created
    ? `seed-demo: created submissions/${DOC_ID} for ${DEMO_REPO_URL}`
    : `seed-demo: submissions/${DOC_ID} already exists, nothing to do.`
);
