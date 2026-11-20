import { db } from "@/lib/db";
import { verifyCredential } from "@/lib/sign";
import VerifyCertificate from "@/components/VerifyCertificate";

export const dynamic = "force-dynamic";

export default async function Verify({ params }: { params: { id: string } }) {
  const badgeId = params.id;
  let credential: any = null;
  let signature: string = "";
  let isValid: boolean = false;
  let isSample: boolean = false;

  // Handle sample fallback
  if (badgeId === "sample") {
    try {
      const doc = await db.collection("badges").doc("sample").get();
      const b = doc.data();
      if (b) {
        credential = JSON.parse(b.credentialJson);
        signature = b.signature;
        isValid = verifyCredential(b.credentialJson, b.signature);
      }
    } catch {
      // ignore db error for sample fallback
    }

    // If not found in DB, use rich authentic fallback demo
    if (!credential) {
      isSample = true;
      isValid = true;
      signature = "ed25519_sig_v1_d4a9f2e7b8c14092b3a7c6e5d8f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9";
      credential = {
        "@context": [
          "https://www.w3.org/ns/credentials/v2",
          "https://purl.imsglobal.org/spec/ob/v3p0/context.json",
        ],
        id: "sample",
        type: ["VerifiableCredential", "OpenBadgeCredential"],
        issuer: {
          name: "Dr. Elena Vance, Staff Distributed Systems Lead",
        },
        validFrom: new Date(Date.now() - 86400000 * 3).toISOString(),
        credentialSubject: {
          name: "Shubh Sharma",
          achievement: {
            name: "ratelimit-kit: Token Bucket & Sliding Window Rate Limiting Engine",
            description:
              "Engineered a zero-dependency, high-throughput TypeScript rate limiting library implementing Token Bucket (lazy refill) and Sliding Window log algorithms with atomic multi-unit consumption, zero timer drift, and 100% fake-timer test coverage.",
            skills: [
              "TypeScript",
              "Rate Limiting",
              "Token Bucket Algorithm",
              "Sliding Window Log",
              "Concurrency & Atomicity",
              "Unit Testing",
            ],
            rating: 5,
          },
        },
        evidence: [
          {
            id: "https://github.com/ShubhAFK/ratelimit-kit",
          },
        ],
      };
    }
  } else {
    // Normal lookup from Firestore
    try {
      const doc = await db.collection("badges").doc(badgeId).get();
      const b = doc.data();
      if (b) {
        credential = JSON.parse(b.credentialJson);
        signature = b.signature;
        isValid = verifyCredential(b.credentialJson, b.signature);
      }
    } catch (err) {
      console.error("Error retrieving badge from Firestore:", err);
    }
  }

  return (
    <VerifyCertificate
      badgeId={badgeId}
      credential={credential}
      signature={signature}
      isValid={isValid}
      isSample={isSample}
    />
  );
}
