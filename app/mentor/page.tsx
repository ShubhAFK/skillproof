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
      <main className="min-h-screen bg-[var(--bg)] text-[var(--ink)] flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[var(--muted)] text-sm font-medium">Verifying mentor credentials...</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-[var(--bg)] text-[var(--ink)] py-12 px-4">
        <div className="max-w-md mx-auto paper-card p-8 text-center">
          <div className="flex items-center justify-center mx-auto mb-6 text-[var(--accent)]">
            <svg className="w-12 h-12" viewBox="0 0 48 48" fill="none" aria-hidden="true">
              <path d="M43.5 24.0 Q47.7 28.7 42.0 31.5 Q44.1 37.4 37.8 37.8 Q37.4 44.1 31.5 42.0 Q28.7 47.7 24.0 43.5 Q19.3 47.7 16.5 42.0 Q10.6 44.1 10.2 37.8 Q3.9 37.4 6.0 31.5 Q0.3 28.7 4.5 24.0 Q0.3 19.3 6.0 16.5 Q3.9 10.6 10.2 10.2 Q10.6 3.9 16.5 6.0 Q19.3 0.3 24.0 4.5 Q28.7 0.3 31.5 6.0 Q37.4 3.9 37.8 10.2 Q44.1 10.6 42.0 16.5 Q47.7 19.3 43.5 24.0 Z" stroke="currentColor" strokeWidth="1.6" />
              <circle cx="24" cy="24" r="16.5" stroke="currentColor" strokeWidth="1.1" />
              <circle cx="24" cy="24" r="14" stroke="currentColor" strokeWidth="0.8" />
              <text x="24" y="28.5" textAnchor="middle" fill="currentColor" fontSize="13" fontWeight="700" style={{ fontFamily: "var(--font-display)" }}>SP</text>
            </svg>
          </div>
          <h1 className="text-2xl font-serif font-bold text-[var(--ink-strong)] tracking-tight mb-2">Mentor Portal</h1>
          <p className="text-[var(--muted)] text-sm mb-6 leading-relaxed">
            Sign in with an authorized mentor account to review submissions, run Gemini risk analyses, and sign cryptographic credentials.
          </p>
          <button
            onClick={signInWithGoogle}
            className="w-full min-h-[48px] flex items-center justify-center gap-2 px-4 py-3 rounded-[6px] font-semibold text-[var(--surface)] bg-[var(--accent)] hover:bg-[var(--accent-deep)] transition-colors"
          >
            Continue with Google
          </button>
          <EmailSignIn showDemoAccess />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--ink)] py-12 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        {/* Page Title */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 pb-6 border-b border-[var(--border)]">
          <div>
            <div className="text-[14px] font-semibold text-[var(--muted)] mb-2">
              <span>Mentor review workspace</span>
            </div>
            <h1 className="text-3xl font-serif font-bold text-[var(--ink-strong)] tracking-tight">Mentor Review Queue</h1>
          </div>
          <div className="text-sm text-[var(--muted)]">
            <span>Signed in as: </span>
            <span className="text-[var(--ink-strong)] font-semibold">{user.displayName || user.email}</span>
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
                className="w-full min-h-[48px] bg-[var(--surface)] border border-[var(--border)] rounded-[6px] px-4 py-3 text-sm text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
              />
            </div>

            {/* Status Filter Chips */}
            <div className="flex flex-wrap gap-2 pb-1">
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
                  className={`min-h-[44px] px-3 py-2 rounded-[6px] text-xs font-semibold border transition-colors ${statusFilter === chip.id
                    ? "bg-[var(--accent)] text-[var(--surface)] border-[var(--accent)]"
                    : "bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--ink-strong)] border-[var(--border)] hover:border-[var(--border-strong)]"
                    }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Queue List */}
            <div className="flex flex-col gap-3 max-h-[640px] overflow-y-auto pr-1">
              {!filteredList.length ? (
                <div className="paper-card p-8 text-center text-[var(--muted)] text-sm">
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
                      className={`text-left p-4 rounded-[10px] border transition-colors ${isSelected
                        ? "bg-[var(--surface)] border-[var(--accent)] border-l-4 shadow-[var(--card-shadow)]"
                        : "bg-[var(--surface)] border-[var(--border)] hover:border-[var(--border-strong)] shadow-[var(--card-shadow)]"
                        }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="font-serif font-bold text-[var(--ink-strong)] text-sm sm:text-base line-clamp-1">
                          {x.title}
                        </span>
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-[4px] border shrink-0 bg-transparent ${x.status === "issued"
                            ? "text-[var(--accent)] border-[var(--accent)]"
                            : x.status === "changes_requested"
                              ? "text-[var(--seal)] border-[rgba(140,47,43,0.45)]"
                              : x.status === "live_check"
                                ? "text-[var(--ink-strong)] border-[var(--ink-strong)]"
                                : "text-[var(--muted)] border-[var(--border-strong)]"
                            }`}
                        >
                          {x.status.replace("_", " ")}
                        </span>
                      </div>
                      <div className="text-xs text-[var(--muted)] flex items-center justify-between gap-2">
                        <span className="truncate font-medium">{x.learner}</span>
                        {x.review && <span className="text-[var(--accent)] font-semibold shrink-0">Rating: {x.review.rating}/5</span>}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Review Sheet */}
          <div className="lg:col-span-8">
            <section className="paper-card p-6 sm:p-8 min-h-[480px]">
              {!s ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 sm:p-12 text-[var(--muted)]">
                  <div className="flex items-center justify-center mb-4 text-[var(--accent)]">
                    <svg className="w-12 h-12" viewBox="0 0 48 48" fill="none" aria-hidden="true">
                      <path d="M43.5 24.0 Q47.7 28.7 42.0 31.5 Q44.1 37.4 37.8 37.8 Q37.4 44.1 31.5 42.0 Q28.7 47.7 24.0 43.5 Q19.3 47.7 16.5 42.0 Q10.6 44.1 10.2 37.8 Q3.9 37.4 6.0 31.5 Q0.3 28.7 4.5 24.0 Q0.3 19.3 6.0 16.5 Q3.9 10.6 10.2 10.2 Q10.6 3.9 16.5 6.0 Q19.3 0.3 24.0 4.5 Q28.7 0.3 31.5 6.0 Q37.4 3.9 37.8 10.2 Q44.1 10.6 42.0 16.5 Q47.7 19.3 43.5 24.0 Z" stroke="currentColor" strokeWidth="1.6" />
                      <circle cx="24" cy="24" r="16.5" stroke="currentColor" strokeWidth="1.1" />
                      <circle cx="24" cy="24" r="14" stroke="currentColor" strokeWidth="0.8" />
                      <text x="24" y="28.5" textAnchor="middle" fill="currentColor" fontSize="13" fontWeight="700" style={{ fontFamily: "var(--font-display)" }}>SP</text>
                    </svg>
                  </div>
                  <h3 className="text-lg font-serif font-bold text-[var(--ink-strong)] mb-1">Select a submission</h3>
                  <p className="text-sm max-w-xs leading-relaxed">
                    Choose a project from the left queue to evaluate engineering evidence and issue a signed badge.
                  </p>
                </div>
              ) : (
                <div>
                  {/* Header */}
                  <div className="border-b border-[var(--border)] pb-6 mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-2">
                      <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[var(--ink-strong)] tracking-tight">
                        {s.title}
                      </h2>
                      <span className="self-start text-xs font-semibold px-3 py-1 rounded-[6px] border border-[var(--border-strong)] bg-transparent text-[var(--ink-strong)] shrink-0">
                        {s.status.replace("_", " ")}
                      </span>
                    </div>

                    <p className="text-sm text-[var(--muted)] flex flex-wrap items-center gap-3">
                      <span>Submitted by <strong className="text-[var(--ink-strong)]">{s.learner}</strong></span>
                      <span>•</span>
                      <a
                        href={s.repoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[var(--accent)] hover:text-[var(--accent-deep)] font-mono text-xs underline break-all"
                      >
                        {s.repoUrl} ↗
                      </a>
                    </p>

                    <div className="mt-4 p-4 rounded-[6px] bg-[var(--bg)] border border-[var(--border)] text-[var(--ink)] text-sm leading-relaxed">
                      {s.description || <span className="italic text-[var(--muted)]">No project description submitted.</span>}
                    </div>
                  </div>

                  {/* Gemini Analysis Button if not analysed */}
                  {!s.review && (
                    <div className="p-6 rounded-[10px] border border-dashed border-[var(--border-strong)] bg-[var(--bg)] text-center my-6">
                      <h3 className="text-base font-serif font-bold text-[var(--ink-strong)] mb-2">
                        Gemini Pro Evidence Assessment
                      </h3>
                      <p className="text-sm text-[var(--muted)] max-w-md mx-auto mb-6 leading-relaxed">
                        Analyze codebase trade-offs, detect risk flags (e.g. generic descriptions, claim mismatches), and generate targeted live-check questions.
                      </p>
                      <button
                        onClick={analyse}
                        disabled={!!busy}
                        className="min-h-[48px] inline-flex items-center justify-center gap-2 px-6 py-3 rounded-[6px] text-sm font-semibold text-[var(--surface)] bg-[var(--accent)] hover:bg-[var(--accent-deep)] transition-colors disabled:opacity-50"
                      >
                        {busy === "analyse" ? (
                          <>
                            <span className="w-4 h-4 border-2 border-[var(--surface)] border-t-transparent rounded-full animate-spin" />
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
                    <div className="my-6 p-6 rounded-[10px] bg-[var(--bg)] border border-[var(--border)]">
                      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] pb-4 mb-6">
                        <div>
                          <span className="text-[14px] font-semibold text-[var(--accent)] block">
                            AI evidence assessment
                          </span>
                          <span className="text-xs text-[var(--muted)]">
                            Gemini suggestion only • Final sign-off requires human mentor judgment
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[14px] font-semibold text-[var(--muted)] block">Suggested rating</span>
                          <span className="text-2xl font-serif font-bold text-[var(--accent)]">
                            {s.review.rating}/5
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Left: Skills & Reasons */}
                        <div>
                          <h4 className="text-[14px] font-sans font-semibold text-[var(--muted)] tracking-normal mb-2">
                            Demonstrated skills
                          </h4>
                          <div className="flex flex-wrap gap-2 mb-6">
                            {s.review.skills?.map((k) => (
                              <span
                                key={k}
                                className="px-3 py-1 rounded-[6px] text-xs font-semibold bg-[var(--surface)] border border-[var(--border)] text-[var(--ink-strong)]"
                              >
                                {k}
                              </span>
                            ))}
                          </div>

                          <h4 className="text-[14px] font-sans font-semibold text-[var(--muted)] tracking-normal mb-2">
                            Evidence &amp; rationales
                          </h4>
                          <div className="space-y-3 text-sm text-[var(--ink)] leading-relaxed">
                            {s.review.reasons?.map((r, i) => (
                              <p key={i} className="pl-3 border-l-2 border-[var(--accent)]">
                                {r}
                              </p>
                            ))}
                          </div>
                        </div>

                        {/* Right: Risk Flags & Live Check Questions */}
                        <div>
                          <h4 className="text-[14px] font-sans font-semibold text-[var(--muted)] tracking-normal mb-2">
                            Risk flags
                          </h4>
                          {s.review.riskFlags?.length ? (
                            <div className="space-y-2 mb-6">
                              {s.review.riskFlags.map((rf, i) => (
                                <div
                                  key={i}
                                  className="p-3 rounded-[6px] bg-[rgba(140,47,43,0.07)] border border-[rgba(140,47,43,0.28)] border-l-2 border-l-[var(--seal)] text-[var(--seal)] text-sm font-medium leading-relaxed"
                                >
                                  {rf}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm font-medium text-[var(--accent)] mb-6 flex items-center gap-1">
                              <span>✓</span> No integrity or mismatch risks detected.
                            </p>
                          )}

                          <h4 className="text-[14px] font-sans font-semibold text-[var(--muted)] tracking-normal mb-2">
                            Probe questions for live check
                          </h4>
                          <ol className="list-decimal list-inside space-y-2 text-sm text-[var(--ink)] pl-1 leading-relaxed">
                            {s.review.liveCheckQuestions?.map((q, i) => (
                              <li key={i} className="leading-relaxed">
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
                    <div className="my-6 p-6 rounded-[10px] bg-[var(--bg)] border border-[var(--border-strong)] text-center">
                      <div className="seal-stamp mx-auto">
                        <span className="text-xs font-mono tracking-wider block">ED25519</span>
                        <span className="text-lg font-serif font-bold">SIGNED</span>
                        <span className="text-[11px] font-semibold block">&amp; Attested</span>
                      </div>
                      <p className="text-sm font-medium text-[var(--ink-strong)] mb-4">
                        Badge has been cryptographically signed and published to the public registry!
                      </p>
                      <Link
                        href={`/verify/${issued}`}
                        className="min-h-[48px] inline-flex items-center justify-center gap-2 px-6 py-3 rounded-[6px] text-sm font-semibold text-[var(--surface)] bg-[var(--accent)] hover:bg-[var(--accent-deep)] transition-colors"
                      >
                        Inspect Public Verification Page →
                      </Link>
                    </div>
                  )}

                  {s.status === "issued" && !issued && (
                    <div className="my-4 p-4 rounded-[6px] bg-[var(--bg)] border border-[var(--accent)] flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm text-[var(--accent)] font-semibold">
                        ✓ Badge already issued for this submission
                      </span>
                      <Link
                        href={`/verify/${s.badgeId}`}
                        className="min-h-[44px] inline-flex items-center text-sm font-semibold text-[var(--accent)] hover:text-[var(--accent-deep)] underline"
                      >
                        Open Badge →
                      </Link>
                    </div>
                  )}

                  {/* Mentor Actions & Note */}
                  {s.review && s.status !== "issued" && (
                    <div className="mt-8 pt-6 border-t border-[var(--border)]">
                      <label htmlFor="mentor-note" className="block text-[14px] font-semibold text-[var(--muted)] mb-2">
                        Feedback / instructions for learner
                      </label>
                      <textarea
                        id="mentor-note"
                        rows={2}
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Add required changes, specific questions to address, or praise..."
                        className="w-full min-h-[88px] bg-[var(--bg)] border border-[var(--border)] rounded-[6px] px-4 py-3 text-sm text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-colors mb-4"
                      />

                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={() => decide("accept")}
                          disabled={!!busy}
                          className="min-h-[48px] px-6 py-3 rounded-[6px] font-semibold text-[var(--surface)] bg-[var(--accent)] hover:bg-[var(--accent-deep)] transition-colors disabled:opacity-50 text-sm"
                        >
                          {busy === "accept" ? "Signing with Ed25519..." : "Sign & Issue Badge"}
                        </button>
                        <button
                          onClick={() => decide("changes")}
                          disabled={!!busy}
                          className="min-h-[48px] px-4 py-3 rounded-[6px] text-sm font-semibold text-[var(--ink-strong)] border border-[rgba(27,26,23,0.7)] hover:bg-[rgba(27,26,23,0.07)] transition-colors disabled:opacity-50"
                        >
                          Request changes
                        </button>
                        <button
                          onClick={() => decide("live")}
                          disabled={!!busy}
                          className="min-h-[48px] px-4 py-3 rounded-[6px] text-sm font-semibold text-[var(--ink-strong)] border border-[rgba(27,26,23,0.7)] hover:bg-[rgba(27,26,23,0.07)] transition-colors disabled:opacity-50"
                        >
                          Require live check
                        </button>
                      </div>
                    </div>
                  )}

                  {err && (
                    <div className="mt-4 p-3 rounded-[6px] bg-[rgba(140,47,43,0.07)] border border-[rgba(140,47,43,0.35)] text-[var(--seal)] text-sm font-medium" role="alert">
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
