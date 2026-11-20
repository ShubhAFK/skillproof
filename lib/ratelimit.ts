// Firestore-backed fixed-window rate limiter. Serverless instances don't share memory,
// so counters live in the `ratelimits` collection. Each doc carries `expiresAt` so a
// Firestore TTL policy can clean old windows up automatically (see DEPLOY.md).
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export interface RateRule {
  name: string;
  max: number;
  windowSec: number;
}

export const RULES = {
  reviewPerMinute: { name: "review-min", max: 5, windowSec: 60 },
  reviewPerDay: { name: "review-day", max: 40, windowSec: 86400 },
  refreshPerMinute: { name: "refresh-min", max: 10, windowSec: 60 },
} satisfies Record<string, RateRule>;

// IP keys get a looser limit so people sharing a network (e.g. a venue) aren't blocked together.
const IP_MULTIPLIER = 2;

export class LimitError extends Error {
  status = 429;
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.code = code;
  }
}

function safeKey(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9_.:-]/g, "_").slice(0, 300);
}

export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

/** Atomically counts one hit. Returns ok=false (without counting) once the window is full. */
export async function consume(rule: RateRule, subject: string): Promise<{ ok: boolean; retryAfterSec: number }> {
  const now = Date.now();
  const windowMs = rule.windowSec * 1000;
  const bucket = Math.floor(now / windowMs);
  const resetAt = (bucket + 1) * windowMs;
  const retryAfterSec = Math.max(1, Math.ceil((resetAt - now) / 1000));
  const ref = db.collection("ratelimits").doc(safeKey(`${rule.name}:${subject}:${bucket}`));

  try {
    const ok = await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const count = snap.exists ? Number(snap.get("count")) || 0 : 0;
      if (count >= rule.max) return false;
      tx.set(ref, { count: count + 1, rule: rule.name, expiresAt: new Date(resetAt + 86400000) }, { merge: true });
      return true;
    });
    return { ok, retryAfterSec };
  } catch (err) {
    // Fail open: a Firestore hiccup shouldn't take reviews down.
    console.warn("ratelimit: counter unavailable, allowing request:", (err as { code?: unknown })?.code ?? "unknown");
    return { ok: true, retryAfterSec };
  }
}

function friendlyMessage(rule: RateRule, retryAfterSec: number): string {
  if (rule.windowSec >= 86400) {
    return "Daily limit reached for this account. It resets at midnight UTC.";
  }
  return `You're going a bit fast. Please wait about ${retryAfterSec} seconds and try again.`;
}

/** Checks every rule for the user's uid and IP. Returns a 429 response if any is exceeded, else null. */
export async function enforce(req: Request, uid: string, rules: RateRule[]): Promise<NextResponse | null> {
  const ip = clientIp(req);
  for (const rule of rules) {
    const checks: Array<[RateRule, string]> = [[rule, `uid:${uid}`]];
    if (ip !== "unknown") {
      checks.push([{ ...rule, name: `${rule.name}-ip`, max: rule.max * IP_MULTIPLIER }, `ip:${ip}`]);
    }
    for (const [r, subject] of checks) {
      const result = await consume(r, subject);
      if (!result.ok) {
        return NextResponse.json(
          { error: friendlyMessage(rule, result.retryAfterSec), code: "RATE_LIMITED", retryAfterSec: result.retryAfterSec },
          { status: 429, headers: { "Retry-After": String(result.retryAfterSec) } }
        );
      }
    }
  }
  return null;
}

/** Global daily cap on Gemini calls across all users. Throws LimitError when exhausted. */
export async function consumeGeminiBudget(): Promise<void> {
  const parsed = Number(process.env.GEMINI_DAILY_CAP);
  const cap = Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 300;
  const result = await consume({ name: "gemini-daily", max: cap, windowSec: 86400 }, "global");
  if (!result.ok) {
    throw new LimitError(
      "SkillProof has used today's AI review budget. AI suggestions resume at midnight UTC; mentors can still request changes or a live check manually.",
      "GEMINI_DAILY_CAP"
    );
  }
}
