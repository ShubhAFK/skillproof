import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { draftBadgeWithFlash } from "@/lib/gemini";
import { signCredential } from "@/lib/sign";
import { requireMentor } from "@/lib/auth-server";
import { DEMO_ISSUER_NAME, isDemoMentorEmail } from "@/lib/demo";

export async function POST(req: Request) {
  const mentorCheck = await requireMentor(req);
  if (mentorCheck.error) {
    return NextResponse.json({ error: mentorCheck.error }, { status: mentorCheck.status });
  }

  const { id, action, note } = await req.json();
  const ref = db.collection("submissions").doc(id);
  const s = (await ref.get()).data();
  if (!s) return NextResponse.json({ error: "Submission not found." }, { status: 404 });

  if (action === "changes") {
    await ref.update({ status: "changes_requested", note: note || "" });
    return NextResponse.json({ ok: true });
  }
  if (action === "live") {
    await ref.update({ status: "live_check", note: note || "" });
    return NextResponse.json({ ok: true });
  }
  if (action !== "accept") {
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  }

  try {
    const draft = await draftBadgeWithFlash({ title: s.title, description: s.description, review: s.review });
    const badgeRef = db.collection("badges").doc();
    // The shared evaluation account is always labelled as such on the credential.
    const issuer = isDemoMentorEmail(mentorCheck.user?.email)
      ? DEMO_ISSUER_NAME
      : mentorCheck.user?.name || process.env.ISSUER_NAME || "SkillProof Mentor";
    const credential = {
      "@context": ["https://www.w3.org/ns/credentials/v2", "https://purl.imsglobal.org/spec/ob/v3p0/context.json"],
      id: badgeRef.id,
      type: ["VerifiableCredential", "OpenBadgeCredential"],
      issuer: { name: issuer },
      validFrom: new Date().toISOString(),
      credentialSubject: {
        name: s.learner,
        achievement: {
          name: draft.title,
          description: draft.description,
          skills: s.review?.skills || [],
          rating: s.review?.rating ?? null,
        },
      },
      evidence: [{ id: s.repoUrl }],
    };
    const { credentialJson, signature } = signCredential(credential);
    await badgeRef.set({ credentialJson, signature, submissionId: id, createdAt: Date.now() });
    await ref.update({ status: "issued", badgeId: badgeRef.id });
    return NextResponse.json({ badgeId: badgeRef.id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, code: e.code }, { status: e?.status === 429 ? 429 : 502 });
  }
}
