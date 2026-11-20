// Seeds one demo learner submission and the sample badge that /verify/sample needs.
// Idempotent: uses fixed doc ids; running it repeatedly will never duplicate.
//   npm run seed:demo
// Credentials: Application Default Credentials (gcloud auth application-default login),
// or GOOGLE_APPLICATION_CREDENTIALS if set. Never prints secret values.
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { createPrivateKey, sign, generateKeyPairSync } from "node:crypto";

const DEMO_REPO_URL = process.env.DEMO_REPO_URL || "https://github.com/ShubhAFK/ratelimit-kit";
const SUBMISSION_DOC_ID = "demo-ratelimit-kit";
const BADGE_DOC_ID = "sample";

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
  badgeId: BADGE_DOC_ID,
  demo: true,
  createdAt: Date.now(),
};

const sampleCredential = {
  "@context": [
    "https://www.w3.org/ns/credentials/v2",
    "https://purl.imsglobal.org/spec/ob/v3p0/context.json",
  ],
  id: BADGE_DOC_ID,
  type: ["VerifiableCredential", "OpenBadgeCredential"],
  issuer: {
    name: process.env.ISSUER_NAME || "SkillProof Demo Mentor (evaluation account)",
  },
  validFrom: new Date(Date.now() - 86400000 * 3).toISOString(),
  credentialSubject: {
    name: "Alex Rivera",
    achievement: {
      name: "Distributed Consensus Engine & Raft Implementation",
      description:
        "Demonstrated advanced distributed systems engineering including Raft leader election, fault-tolerant log replication, state machine snapshotting, and network partition recovery under real chaos conditions.",
      skills: [
        "Distributed Systems",
        "Raft Protocol",
        "Go / Concurrency",
        "Network Partitions",
        "Log Compaction",
      ],
      rating: 5,
    },
  },
  evidence: [
    {
      id: "https://github.com/example-learner/raft-consensus-engine",
    },
  ],
};

// Seed submission
const subRef = db.collection("submissions").doc(SUBMISSION_DOC_ID);
const subCreated = await db.runTransaction(async (tx) => {
  const snap = await tx.get(subRef);
  if (snap.exists) return false;
  tx.create(subRef, submission);
  return true;
});

console.log(
  subCreated
    ? `seed-demo: created submissions/${SUBMISSION_DOC_ID} for ${DEMO_REPO_URL}`
    : `seed-demo: submissions/${SUBMISSION_DOC_ID} already exists.`
);

// Seed sample badge
const badgeRef = db.collection("badges").doc(BADGE_DOC_ID);
const badgeCreated = await db.runTransaction(async (tx) => {
  const snap = await tx.get(badgeRef);
  if (snap.exists) return false;

  let pem = (process.env.ISSUER_PRIVATE_KEY_PEM || "").replace(/\\n/g, "\n");
  let key;
  if (pem) {
    key = createPrivateKey(pem);
  } else {
    const { privateKey } = generateKeyPairSync("ed25519");
    key = privateKey;
  }
  const credentialJson = JSON.stringify(sampleCredential);
  const signature = sign(null, Buffer.from(credentialJson), key).toString("base64");

  tx.create(badgeRef, {
    credentialJson,
    signature,
    submissionId: SUBMISSION_DOC_ID,
    createdAt: Date.now() - 86400000 * 3,
  });
  return true;
});

console.log(
  badgeCreated
    ? `seed-demo: created badges/${BADGE_DOC_ID} for /verify/sample`
    : `seed-demo: badges/${BADGE_DOC_ID} already exists.`
);
