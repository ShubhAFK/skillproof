// Fails loudly if secrets are (or are about to be) committed, or .gitignore is missing coverage.
//   npm run check:secrets
// Prints file paths only, never file contents.
import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const SENSITIVE = [
  /(^|\/)\.env(\.[^/]*)?$/i,
  /\.(pem|key|p12|pfx)$/i,
  /(service[-_]?account|firebase-adminsdk|credentials|gcp-key)[^/]*\.json$/i,
  /-key\.json$/i,
];
const ALLOWED = [/(^|\/)\.env\.example$/i];
const REQUIRED_IGNORES = [".env*", "node_modules", ".next", "*.pem", "*firebase-adminsdk*.json", "service-account*.json"];

const isSensitive = (p) => SENSITIVE.some((r) => r.test(p)) && !ALLOWED.some((r) => r.test(p));
let failed = false;

if (!existsSync(".gitignore")) {
  console.error("✖ .gitignore is missing.");
  failed = true;
} else {
  const lines = readFileSync(".gitignore", "utf8").split(/\r?\n/).map((l) => l.trim().replace(/\/$/, ""));
  for (const entry of REQUIRED_IGNORES) {
    if (!lines.includes(entry)) {
      console.error(`✖ .gitignore does not contain "${entry}".`);
      failed = true;
    }
  }
}

let inRepo = true;
try {
  execSync("git rev-parse --is-inside-work-tree", { stdio: "ignore" });
} catch {
  inRepo = false;
  console.warn("! Not a git repository yet; skipped tracked-file scan. Re-run after `git init`.");
}

if (inRepo) {
  const list = (cmd) => execSync(cmd, { encoding: "utf8" }).split(/\r?\n/).filter(Boolean);
  const tracked = list("git ls-files").filter(isSensitive);
  const pending = list("git ls-files --others --exclude-standard").filter(isSensitive);
  for (const p of tracked) console.error(`✖ SENSITIVE FILE IS TRACKED: ${p}  (git rm --cached "${p}")`);
  for (const p of pending) console.error(`✖ Sensitive file is not ignored and could be committed: ${p}`);
  if (tracked.length || pending.length) failed = true;
}

if (failed) {
  console.error("\ncheck-secrets: FAILED. Fix the items above before committing or deploying.");
  process.exit(1);
}
console.log("check-secrets: OK");
