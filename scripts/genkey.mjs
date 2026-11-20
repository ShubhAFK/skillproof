import { generateKeyPairSync } from "node:crypto";
const { privateKey } = generateKeyPairSync("ed25519");
const pem = privateKey.export({ type: "pkcs8", format: "pem" });
console.log("ISSUER_PRIVATE_KEY_PEM=" + JSON.stringify(pem));
