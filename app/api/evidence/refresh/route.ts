import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireMentor } from "@/lib/auth-server";
import { enforce, RULES } from "@/lib/ratelimit";
import { fetchRepoEvidence } from "@/lib/github";

export const dynamic = "force-dynamic";

// Mentor-only: re-fetch GitHub evidence for a submission and store it as `evidence`.
export async function POST(req: Request) {
  const mentorCheck = await requireMentor(req);
  if (mentorCheck.error) {
    return NextResponse.json({ error: mentorCheck.error }, { status: mentorCheck.status });
  }

  const limited = await enforce(req, mentorCheck.user!.uid, [RULES.refreshPerMinute]);
  if (limited) return limited;

  const body = await req.json().catch(() => ({}));
  const id = typeof body?.id === "string" ? body.id : "";
  if (!id) return NextResponse.json({ error: "Submission id is required." }, { status: 400 });

  const ref = db.collection("submissions").doc(id);
  const s = (await ref.get()).data();
  if (!s) return NextResponse.json({ error: "Submission not found." }, { status: 404 });

  const evidence = await fetchRepoEvidence(s.repoUrl);
  await ref.update({ evidence });
  return NextResponse.json({ evidence });
}
