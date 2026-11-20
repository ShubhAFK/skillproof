import { getAuth } from "firebase-admin/auth";
import { adminApp } from "@/lib/db"; // ADC-based admin app (no key file required)
import { DEMO_MENTOR_EMAIL } from "@/lib/demo";

export interface AuthUser {
  uid: string;
  email: string;
  name: string;
  isMentor: boolean;
}

export async function verifyAuth(req: Request): Promise<AuthUser | null> {
  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.substring(7).trim();
  if (!token) return null;

  try {
    const decoded = await getAuth(adminApp).verifyIdToken(token);
    const email = (decoded.email || "").trim().toLowerCase();
    const name = decoded.name || decoded.displayName || email.split("@")[0] || "Learner";
    const mentorEmails = (process.env.MENTOR_EMAILS || "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    const isMentor = Boolean(
      email &&
      (email === DEMO_MENTOR_EMAIL.toLowerCase() || mentorEmails.includes(email))
    );

    return {
      uid: decoded.uid,
      email: decoded.email || "",
      name,
      isMentor,
    };
  } catch (err) {
    console.error("verifyAuth failed:", (err as { code?: unknown })?.code ?? "unknown");
    return null;
  }
}

export async function requireAuth(req: Request): Promise<{ user?: AuthUser; error?: string; status?: number }> {
  const user = await verifyAuth(req);
  if (!user) {
    return { error: "Authentication required. Please sign in.", status: 401 };
  }
  return { user };
}

export async function requireMentor(req: Request): Promise<{ user?: AuthUser; error?: string; status?: number }> {
  const user = await verifyAuth(req);
  if (!user) {
    return { error: "Authentication required. Please sign in.", status: 401 };
  }
  if (!user.isMentor) {
    return { error: "Forbidden: mentor access only.", status: 403 };
  }
  return { user };
}
