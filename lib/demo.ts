// Shared demo-mentor helpers (safe on client and server: reads only NEXT_PUBLIC_* vars).

export const DEMO_ISSUER_NAME = "SkillProof Demo Mentor (evaluation account)";

export function demoMentorEmail(): string {
  return (process.env.NEXT_PUBLIC_DEMO_MENTOR_EMAIL || "").trim().toLowerCase();
}

export function isDemoMentorEmail(email?: string | null): boolean {
  const demo = demoMentorEmail();
  return Boolean(demo) && (email || "").trim().toLowerCase() === demo;
}
