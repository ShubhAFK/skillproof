// Shared demo-mentor helpers (safe on client and server).

export const DEMO_MENTOR_EMAIL = "mentor@skillproof.example";
export const DEMO_MENTOR_PASSWORD = "mentor";
export const DEMO_ISSUER_NAME = "SkillProof Demo Mentor (evaluation account)";

export function demoMentorEmail(): string {
  return DEMO_MENTOR_EMAIL;
}

export function isDemoMentorEmail(email?: string | null): boolean {
  return Boolean(email) && (email || "").trim().toLowerCase() === DEMO_MENTOR_EMAIL;
}
