"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/firebase-client";
import EmailSignIn from "@/components/EmailSignIn";

interface ReviewResult {
  rating: number;
  skills: string[];
  reasons: string[];
  riskFlags: string[];
  liveCheckQuestions: string[];
}

interface SubmissionItem {
  id: string;
  learner: string;
  title: string;
  description?: string;
  repoUrl: string;
  status: string;
  badgeId?: string;
  note?: string;
  review?: ReviewResult;
}

export default function Mentor() {
  const { user, loading, signInWithGoogle, getIdToken } = useAuth();
  const [list, setList] = useState<SubmissionItem[]>([]);
  const [sel, setSel] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const [issued, setIssued] = useState<string | null>(null);
  const [isMentor, setIsMentor] = useState<boolean | null>(null);

  const load = async () => {
    const token = await getIdToken();
    if (!token) return;
    try {
      const r = await fetch("/api/submissions?all=true", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.status === 403) {
        setIsMentor(false);
        return;
      }
      if (!r.ok) {
        setErr("Could not load submissions.");
        return;
      }
      setIsMentor(true);
      const data = await r.json();
      setList(Array.isArray(data) ? data : []);
    } catch {
      setErr("Could not load submissions.");
    }
  };

  useEffect(() => {
    if (user) {
      load();
    }
  }, [user]);

  const s = list.find((x) => x.id === sel);

  // Filtered queue items
  const filteredList = list.filter((item) => {
    const matchesSearch =
      !search ||
      item.title?.toLowerCase().includes(search.toLowerCase()) ||
      item.learner?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  async function post(url: string, body: object, tag: string) {
    setBusy(tag);
    setErr("");
    try {
      const token = await getIdToken();
      const r = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const j = await r.json();
      setBusy("");
      if (!r.ok) {
        setErr(j.error || "Action failed");
        return null;
      }
      await load();
      return j;
    } catch (e: any) {
      setBusy("");
      setErr(e.message || "Request failed");
      return null;
    }
  }

  const analyse = () => post("/api/review", { id: sel }, "analyse");
  const decide = async (action: string) => {
    const j = await post("/api/decision", { id: sel, action, note }, action);
    if (j?.badgeId) setIssued(j.badgeId);
    else if (j) setNote("");
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0B0F17] text-slate-100 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-sm font-mono">Verifying mentor credentials...</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-[#0B0F17] text-slate-100 py-16 px-4">
        <div className="max-w-md mx-auto bg-[#111622] border border-white/10 rounded-2xl p-8 text-center shadow-2xl">
          <div className="w-12 h-12 rounded-full border border-amber-400/30 bg-amber-400/10 text-amber-400 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <h1 className="text-2xl font-serif font-bold text-white mb-2">Mentor Portal</h1>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">
            Sign in with an authorized mentor account to review submissions, run Gemini risk analyses, and sign cryptographic credentials.
          </p>
          <button
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-lg font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 transition-colors shadow-lg shadow-amber-400/15"
          >
            Continue with Google
          </button>
          <EmailSignIn showDemoAccess />
        </div>
      </main>
    );
  }



  return (
    <main className="min-h-screen bg-[#0B0F17] text-slate-100 py-10 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Page Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-white/10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-400/30 bg-amber-400/10 text-amber-300 text-xs font-mono mb-2">
              <span>AUTHORIZED MENTOR REVIEW WORKSPACE</span>
            </div>
            <h1 className="text-3xl font-serif font-bold text-white">Mentor Review Queue</h1>
          </div>
          <div className="text-xs text-slate-400 font-mono">
            <span>Signed in as: </span>
            <span className="text-amber-400 font-medium">{user.displayName || user.email}</span>
          </div>
        </div>

        {/* 2-Column Split: Queue on Left, Review Sheet on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Queue + Filters */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            {/* Search Input */}
            <div className="relative">
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title or learner..."
                className="w-full bg-[#111622] border border-white/15 rounded-lg px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400/70 focus:ring-1 focus:ring-amber-400/30 transition"
              />
            </div>

            {/* Status Filter Chips */}
            <div className="flex flex-wrap gap-1.5 pb-1">
              {[
                { id: "all", label: "All" },
                { id: "pending", label: "Pending" },
                { id: "issued", label: "Issued" },
                { id: "changes_requested", label: "Revision" },
                { id: "live_check", label: "Live Check" },
              ].map((chip) => (
                <button
                  key={chip.id}
                  onClick={() => setStatusFilter(chip.id)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${statusFilter === chip.id
                    ? "bg-amber-400 text-slate-950 font-semibold"
                    : "bg-[#111622] text-slate-400 hover:text-slate-200 border border-white/10"
                    }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Queue List */}
            <div className="flex flex-col gap-2 max-h-[640px] overflow-y-auto pr-1">
              {!filteredList.length ? (
                <div className="p-8 text-center bg-[#111622] border border-white/10 rounded-xl text-slate-400 text-sm">
                  {list.length ? "No submissions match your search." : "No submissions received yet."}
                </div>
              ) : (
                filteredList.map((x) => {
                  const isSelected = x.id === sel;
                  return (
                    <button
                      key={x.id}
                      onClick={() => {
                        setSel(x.id);
                        setIssued(null);
                        setNote("");
                        setErr("");
                      }}
                      className={`text-left p-4 rounded-xl border transition-all ${isSelected
                        ? "bg-[#162032] border-amber-400 shadow-md shadow-amber-500/5 ring-1 ring-amber-400/40"
                        : "bg-[#111622] border-white/10 hover:border-white/20 hover:bg-[#141b2a]"
                        }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="font-serif font-bold text-slate-100 text-sm sm:text-base line-clamp-1">
                          {x.title}
                        </span>
                        <span
                          className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border ${x.status === "issued"
                            ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                            : x.status === "changes_requested"
                              ? "bg-orange-500/10 text-orange-300 border-orange-500/30"
                              : x.status === "live_check"
                                ? "bg-purple-500/10 text-purple-300 border-purple-500/30"
                                : "bg-amber-500/10 text-amber-300 border-amber-500/30"
                            }`}
                        >
                          {x.status.replace("_", " ")}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 flex items-center justify-between">
                        <span>{x.learner}</span>
                        {x.review && <span className="text-amber-400 font-mono font-medium">Rating: {x.review.rating}/5</span>}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Review Sheet */}
          <div className="lg:col-span-8">
            <section className="bg-[#111622] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl min-h-[500px]">
              {!s ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-12 text-slate-500">
                  <div className="w-16 h-16 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-2xl mb-4">
                    📋
                  </div>
                  <h3 className="text-lg font-serif text-slate-300 mb-1">Select a submission</h3>
                  <p className="text-xs max-w-xs">
                    Choose a project from the left queue to evaluate engineering evidence and issue a signed badge.
                  </p>
                </div>
              ) : (
                <div>
                  {/* Header */}
                  <div className="border-b border-white/10 pb-6 mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-2">
                      <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white">
                        {s.title}
                      </h2>
                      <span className="self-start text-xs font-mono px-3 py-1 rounded-full border border-amber-400/30 bg-amber-400/10 text-amber-300">
                        {s.status.replace("_", " ").toUpperCase()}
                      </span>
                    </div>

                    <p className="text-sm text-slate-400 flex flex-wrap items-center gap-3">
                      <span>Submitted by <strong className="text-slate-200">{s.learner}</strong></span>
                      <span>•</span>
                      <a
                        href={s.repoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-amber-400 hover:text-amber-300 font-mono text-xs underline"
                      >
                        {s.repoUrl} ↗
                      </a>
                    </p>

                    <div className="mt-4 p-4 rounded-xl bg-[#0B0F17] border border-white/10 text-slate-300 text-sm leading-relaxed">
                      {s.description || <span className="italic text-slate-500">No project description submitted.</span>}
                    </div>
                  </div>

                  {/* Gemini Analysis Button if not analysed */}
                  {!s.review && (
                    <div className="p-6 rounded-xl border border-dashed border-amber-400/30 bg-amber-400/5 text-center my-6">
                      <h3 className="text-base font-serif font-semibold text-white mb-1">
                        Gemini Pro Evidence Assessment
                      </h3>
                      <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
                        Analyze codebase trade-offs, detect risk flags (e.g. generic descriptions, claim mismatches), and generate targeted live-check questions.
                      </p>
                      <button
                        onClick={analyse}
                        disabled={!!busy}
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 transition-colors disabled:opacity-50"
                      >
                        {busy === "analyse" ? (
                          <>
                            <span className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                            Analyzing with Gemini Pro...
                          </>
                        ) : (
                          "Analyze with Gemini Pro →"
                        )}
                      </button>
                    </div>
                  )}

                  {/* Gemini Evidence Panel */}
                  {s.review && (
                    <div className="my-6 p-6 rounded-xl bg-[#0B0F17] border border-amber-400/30">
                      <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
                        <div>
                          <span className="text-[10px] font-mono tracking-widest text-amber-400 uppercase font-semibold block">
                            AI EVIDENCE ASSESSMENT
                          </span>
                          <span className="text-xs text-slate-400 font-serif">
                            Gemini suggestion only • Final sign-off requires human mentor judgment
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-slate-400 block font-mono">Suggested Rating</span>
                          <span className="text-2xl font-serif font-bold text-amber-400">
                            {s.review.rating}/5
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Left: Skills & Reasons */}
                        <div>
                          <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
                            Demonstrated Skills
                          </h4>
                          <div className="flex flex-wrap gap-1.5 mb-4">
                            {s.review.skills?.map((k) => (
                              <span
                                key={k}
                                className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-400/10 border border-amber-400/25 text-amber-300"
                              >
                                {k}
                              </span>
                            ))}
                          </div>

                          <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
                            Evidence &amp; Rationales
                          </h4>
                          <div className="space-y-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
                            {s.review.reasons?.map((r, i) => (
                              <p key={i} className="pl-3 border-l-2 border-amber-400/40">
                                {r}
                              </p>
                            ))}
                          </div>
                        </div>

                        {/* Right: Risk Flags & Live Check Questions */}
                        <div>
                          <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
                            Risk Flags
                          </h4>
                          {s.review.riskFlags?.length ? (
                            <div className="space-y-2 mb-4">
                              {s.review.riskFlags.map((rf, i) => (
                                <div
                                  key={i}
                                  className="p-2.5 rounded-lg bg-red-500/10 border-l-4 border-red-500 text-red-200 text-xs"
                                >
                                  {rf}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-emerald-400 mb-4 flex items-center gap-1 font-mono">
                              <span>✓</span> No integrity or mismatch risks detected.
                            </p>
                          )}

                          <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
                            Probe Questions for Live Check
                          </h4>
                          <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-300 pl-1">
                            {s.review.liveCheckQuestions?.map((q, i) => (
                              <li key={i} className="leading-normal">
                                {q}
                              </li>
                            ))}
                          </ol>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Stamp Animation & Issued Link */}
                  {issued && (
                    <div className="my-6 p-6 rounded-xl bg-amber-400/10 border border-amber-400/40 text-center">
                      <div className="seal-stamp mx-auto">
                        <span className="text-xs font-mono tracking-widest block">ED25519</span>
                        <span className="text-lg font-serif">SIGNED</span>
                        <span className="text-[10px] font-mono block">&amp; ATTESTED</span>
                      </div>
                      <p className="text-sm font-semibold text-white mb-3">
                        Badge has been cryptographically signed and published to the public registry!
                      </p>
                      <Link
                        href={`/verify/${issued}`}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 transition-colors"
                      >
                        Inspect Public Verification Page →
                      </Link>
                    </div>
                  )}

                  {s.status === "issued" && !issued && (
                    <div className="my-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                      <span className="text-xs text-emerald-300 font-mono">
                        ✓ Badge already issued for this submission
                      </span>
                      <Link
                        href={`/verify/${s.badgeId}`}
                        className="text-xs font-semibold text-amber-400 hover:text-amber-300 underline"
                      >
                        Open Badge →
                      </Link>
                    </div>
                  )}

                  {/* Mentor Actions & Note */}
                  {s.review && s.status !== "issued" && (
                    <div className="mt-8 pt-6 border-t border-white/10">
                      <label htmlFor="mentor-note" className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
                        Feedback / Instructions for Learner
                      </label>
                      <textarea
                        id="mentor-note"
                        rows={2}
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Add required changes, specific questions to address, or praise..."
                        className="w-full bg-[#0B0F17] border border-white/15 rounded-lg px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400/70 focus:ring-1 focus:ring-amber-400/30 transition mb-4"
                      />

                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={() => decide("accept")}
                          disabled={!!busy}
                          className="px-6 py-2.5 rounded-lg font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 transition-all shadow-lg shadow-amber-400/15 disabled:opacity-50 text-sm"
                        >
                          {busy === "accept" ? "Signing with Ed25519..." : "Sign & Issue Badge"}
                        </button>
                        <button
                          onClick={() => decide("changes")}
                          disabled={!!busy}
                          className="px-5 py-2.5 rounded-lg text-sm font-semibold text-slate-300 border border-white/15 hover:bg-white/5 transition-colors disabled:opacity-50"
                        >
                          Request changes
                        </button>
                        <button
                          onClick={() => decide("live")}
                          disabled={!!busy}
                          className="px-5 py-2.5 rounded-lg text-sm font-semibold text-purple-300 border border-purple-500/30 hover:bg-purple-500/10 transition-colors disabled:opacity-50"
                        >
                          Require live check
                        </button>
                      </div>
                    </div>
                  )}

                  {err && (
                    <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs" role="alert">
                      {err}
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
