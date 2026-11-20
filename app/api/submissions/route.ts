import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAuth } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const user = await verifyAuth(req);
    if (!user) {
      return NextResponse.json({ error: "Authentication required. Please sign in." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const getAll = searchParams.get("all") === "true";

    if (getAll) {
      if (!user.isMentor) {
        return NextResponse.json({ error: "Forbidden: mentor access only." }, { status: 403 });
      }
      const snap = await db.collection("submissions").orderBy("createdAt", "desc").limit(50).get();
      return NextResponse.json(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    }

    // Query for learner's submissions by uid
    const snap = await db.collection("submissions").where("uid", "==", user.uid).get();
    const list = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));

    return NextResponse.json(list);
  } catch (error: any) {
    console.error("GET /api/submissions error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch submissions" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await verifyAuth(req);
    if (!user) {
      return NextResponse.json({ error: "Authentication required. Please sign in." }, { status: 401 });
    }

    const { title, description, repoUrl } = await req.json();
    if (!title?.trim() || !repoUrl?.trim()) {
      return NextResponse.json({ error: "Title and repo link are required." }, { status: 400 });
    }

    const ref = await db.collection("submissions").add({
      uid: user.uid,
      email: user.email,
      learner: user.name,
      title: title.trim(),
      description: (description || "").trim(),
      repoUrl: repoUrl.trim(),
      status: "pending",
      createdAt: Date.now(),
    });

    return NextResponse.json({ id: ref.id });
  } catch (error: any) {
    console.error("POST /api/submissions error:", error);
    return NextResponse.json({ error: error.message || "Failed to save submission" }, { status: 500 });
  }
}
