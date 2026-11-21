import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { reviewWithPro } from "@/lib/gemini";
import { requireMentor } from "@/lib/auth-server";

export async function POST(req: Request) {
  const mentorCheck = await requireMentor(req);
  if (mentorCheck.error) {
    return NextResponse.json({ error: mentorCheck.error }, { status: mentorCheck.status });
  }

  const { id } = await req.json();
  const ref = db.collection("submissions").doc(id);
  const s = (await ref.get()).data();
  if (!s) return NextResponse.json({ error: "Submission not found." }, { status: 404 });
  try {
    const review = await reviewWithPro({ title: s.title, description: s.description, repoUrl: s.repoUrl });
    await ref.update({ review });
    return NextResponse.json({ review });
  } catch (e: any) {
    const step = e?.step || "gemini";
    const status = typeof e?.status === "number" ? e.status : 502;
    const model = e?.model || process.env.GEMINI_PRO_MODEL || "gemini-3.8-flash";
    const body = (e?.body || e?.message || "").slice(0, 300);
    console.error(step, status, model, body);
    return NextResponse.json({ error: e.message }, { status: 502 });
  }
}
