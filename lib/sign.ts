import { createPrivateKey, createPublicKey, sign, verify } from "node:crypto";

function privateKey() {
  const pem = (process.env.ISSUER_PRIVATE_KEY_PEM || "").replace(/\\n/g, "\n");
  if (!pem) throw new Error("ISSUER_PRIVATE_KEY_PEM missing. Run: npm run genkey");
  return createPrivateKey(pem);
}

// credentialJson is stored as a string so key order never changes between signing and verifying
export function signCredential(credential: object) {
  const credentialJson = JSON.stringify(credential);
  const signature = sign(null, Buffer.from(credentialJson), privateKey()).toString("base64");
  return { credentialJson, signature };
}

export function verifyCredential(credentialJson: string, signature: string) {
  try {
    return verify(null, Buffer.from(credentialJson), createPublicKey(privateKey()), Buffer.from(signature, "base64"));
  } catch { return false; }
}
