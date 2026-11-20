"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/firebase-client";

interface StatusBadgeConfig {
  label: string;
  className: string;
}

const statusMap: Record<string, StatusBadgeConfig> = {
  pending: {
    label: "Pending Review",
    className: "bg-transparent text-[var(--muted)] border-[var(--border-strong)]",
  },
  changes_requested: {
    label: "Needs Revision",
    className: "bg-transparent text-[var(--seal)] border-[rgba(140,47,43,0.45)]",
  },
  live_check: {
    label: "Live Check Required",
    className: "bg-transparent text-[var(--ink)] border-[var(--ink)]",
  },
  issued: {
    label: "Verified & Issued",
    className: "bg-transparent text-[var(--accent)] border-[var(--accent)]",
  },
};

export default function Learn() {
  const { user, loading, signInWithGoogle, getIdToken } = useAuth();
  const [f, setF] = useState({ title: "", description: "", repoUrl: "" });
  const [list, setList] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [fetchingList, setFetchingList] = useState(true);
  const [err, setErr] = useState("");

  const load = async () => {
    const token = await getIdToken();
    if (!token) {
      setFetchingList(false);
      return;
    }
    try {
      setFetchingList(true);
      const r = await fetch("/api/submissions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await r.json();
      if (Array.isArray(data)) setList(data);
    } catch {
      // silently handle network errors in background polling
    } finally {
      setFetchingList(false);
    }
  };

  useEffect(() => {
    if (user) {
      load();
    } else if (!loading) {
      setFetchingList(false);
    }
  }, [user, loading]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const token = await getIdToken();
      if (!token) {
        setErr("You must be signed in to submit.");
        setBusy(false);
        return;
      }

      const r = await fetch("/api/submissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(f),
      });
      const data = await r.json();
      if (!r.ok) {
        setErr(data.error || "Submission failed.");
      } else {
        setF({ title: "", description: "", repoUrl: "" });
        load();
      }
    } catch (e: any) {
      setErr(e.message || "Failed to submit.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[var(--bg)] text-[var(--ink)] flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[var(--muted)] text-sm font-medium">Verifying session...</p>
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
          <h1 className="text-2xl font-serif font-bold text-[var(--ink-strong)] tracking-tight mb-2">Submit Your Work</h1>
          <p className="text-[var(--muted)] text-sm mb-6 leading-relaxed">
            Sign in with your Google account to record your project evidence, request mentor evaluation, and receive cryptographic skill badges.
          </p>
          <button
            onClick={signInWithGoogle}
            className="w-full min-h-[48px] flex items-center justify-center gap-2 px-4 py-3 rounded-[6px] font-semibold text-[var(--surface)] bg-[var(--accent)] hover:bg-[var(--accent-deep)] transition-colors"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="currentColor" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="currentColor" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="currentColor" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="currentColor" />
            </svg>
            Continue with Google
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--ink)] py-12 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="text-[14px] font-semibold text-[var(--muted)] mb-2">
            <span>Learner project submission</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[var(--ink-strong)] tracking-tight mb-3">
            Submit your work
          </h1>
          <p className="text-[var(--muted)] text-sm sm:text-base leading-relaxed">
            Submitting as <span className="text-[var(--ink-strong)] font-semibold">{user.displayName || user.email}</span>. A human mentor reviews your engineering trade-offs and issues a cryptographically signed badge.
          </p>
        </div>

        {/* Submission Form Card */}
        <div className="paper-card p-6 sm:p-8 mb-12">
          <form onSubmit={submit} className="flex flex-col gap-6">
            <div>
              <label htmlFor="t" className="block text-[14px] font-semibold text-[var(--ink-strong)] mb-1">
                Project title
              </label>
              <span className="text-xs text-[var(--muted)] mb-2 block">
                Give your build a concise, representative name
              </span>
              <input
                id="t"
                type="text"
                value={f.title}
                onChange={(e) => setF({ ...f, title: e.target.value })}
                placeholder="e.g. Distributed Consensus Engine"
                required
                className="w-full min-h-[48px] bg-[var(--bg)] border border-[var(--border)] rounded-[6px] px-4 py-3 text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
              />
            </div>

            <div>
              <label htmlFor="d" className="block text-[14px] font-semibold text-[var(--ink-strong)] mb-1">
                What did you build, and what did you decide along the way?
              </label>
              <span className="text-xs text-[var(--muted)] mb-2 block">
                Explain your system architecture, concurrency models, trade-offs, and tricky bugs you solved
              </span>
              <textarea
                id="d"
                value={f.description}
                onChange={(e) => setF({ ...f, description: e.target.value })}
                placeholder="We opted for a Raft-based state machine replication over Paxos because... A key challenge was handling split-brain network partitions during leader election..."
                rows={5}
                className="w-full min-h-[140px] resize-y bg-[var(--bg)] border border-[var(--border)] rounded-[6px] px-4 py-3 text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
              />
            </div>

            <div>
              <label htmlFor="r" className="block text-[14px] font-semibold text-[var(--ink-strong)] mb-1">
                Repo or demo link
              </label>
              <span className="text-xs text-[var(--muted)] mb-2 block">
                A public GitHub / GitLab URL or live interactive demo where a mentor can inspect the code
              </span>
              <input
                id="r"
                type="url"
                value={f.repoUrl}
                onChange={(e) => setF({ ...f, repoUrl: e.target.value })}
                placeholder="https://github.com/username/project"
                required
                className="w-full min-h-[48px] bg-[var(--bg)] border border-[var(--border)] rounded-[6px] px-4 py-3 text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
              />
            </div>

            {err && (
              <div className="p-3 bg-[rgba(140,47,43,0.07)] border border-[rgba(140,47,43,0.35)] rounded-[6px] text-[var(--seal)] text-sm font-medium" role="alert">
                {err}
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={busy}
                className="w-full sm:w-auto min-h-[48px] inline-flex items-center justify-center gap-2 px-6 py-3 rounded-[6px] font-semibold text-[var(--surface)] bg-[var(--accent)] hover:bg-[var(--accent-deep)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {busy ? (
                  <>
                    <span className="w-4 h-4 border-2 border-[var(--surface)] border-t-transparent rounded-full animate-spin" />
                    Sending to mentor queue...
                  </>
                ) : (
                  "Send for review →"
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Submissions Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-serif font-bold text-[var(--ink-strong)] tracking-tight">Your submissions</h2>
            <span className="text-sm font-medium text-[var(--muted)]">
              {list.length} {list.length === 1 ? "entry" : "entries"} recorded
            </span>
          </div>

          {fetchingList && !list.length ? (
            <div className="paper-card p-8 text-center text-[var(--muted)] text-sm">
              Loading your records...
            </div>
          ) : !list.length ? (
            <div className="paper-card border-dashed p-8 text-center">
              <div className="flex items-center justify-center mx-auto mb-4 text-[var(--accent)]">
                <svg className="w-11 h-11" viewBox="0 0 48 48" fill="none" aria-hidden="true">
                  <path d="M43.5 24.0 Q47.7 28.7 42.0 31.5 Q44.1 37.4 37.8 37.8 Q37.4 44.1 31.5 42.0 Q28.7 47.7 24.0 43.5 Q19.3 47.7 16.5 42.0 Q10.6 44.1 10.2 37.8 Q3.9 37.4 6.0 31.5 Q0.3 28.7 4.5 24.0 Q0.3 19.3 6.0 16.5 Q3.9 10.6 10.2 10.2 Q10.6 3.9 16.5 6.0 Q19.3 0.3 24.0 4.5 Q28.7 0.3 31.5 6.0 Q37.4 3.9 37.8 10.2 Q44.1 10.6 42.0 16.5 Q47.7 19.3 43.5 24.0 Z" stroke="currentColor" strokeWidth="1.6" />
                  <circle cx="24" cy="24" r="16.5" stroke="currentColor" strokeWidth="1.1" />
                  <circle cx="24" cy="24" r="14" stroke="currentColor" strokeWidth="0.8" />
                  <text x="24" y="28.5" textAnchor="middle" fill="currentColor" fontSize="13" fontWeight="700" style={{ fontFamily: "var(--font-display)" }}>SP</text>
                </svg>
              </div>
              <h3 className="text-base font-serif font-bold text-[var(--ink-strong)] mb-1">No submissions yet</h3>
              <p className="text-sm text-[var(--muted)] max-w-sm mx-auto leading-relaxed">
                Submit your first project above. Once submitted, its review status and signed verifiable badge will appear here.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {list.map((s) => {
                const badge = statusMap[s.status] || {
                  label: s.status,
                  className: "bg-transparent text-[var(--muted)] border-[var(--border)]",
                };
                return (
                  <div
                    key={s.id}
                    className="paper-card hover:border-[var(--border-strong)] transition-colors p-6"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-2">
                      <div className="min-w-0">
                        <h3 className="text-lg font-serif font-bold text-[var(--ink-strong)] mb-1">
                          {s.title}
                        </h3>
                        {s.repoUrl && (
                          <a
                            href={s.repoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-[var(--accent)] hover:text-[var(--accent-deep)] hover:underline transition-colors font-mono break-all"
                          >
                            <span>{s.repoUrl}</span>
                            <span className="text-[10px] ml-1 whitespace-nowrap">↗</span>
                          </a>
                        )}
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-[6px] text-xs font-semibold border ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      </div>
                    </div>

                    {s.description && (
                      <p className="text-sm text-[var(--muted)] line-clamp-2 mt-2 leading-relaxed">
                        {s.description}
                      </p>
                    )}

                    {s.note && (
                      <div className="mt-4 p-4 rounded-[6px] bg-[var(--bg)] border border-[var(--border)] border-l-2 border-l-[var(--accent)] text-[var(--ink)] text-sm">
                        <span className="font-semibold text-[var(--ink-strong)]">Mentor note:</span> {s.note}
                      </div>
                    )}

                    {s.badgeId && (
                      <div className="mt-4 pt-4 border-t border-[var(--border)] flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-medium text-[var(--accent)] flex items-center gap-1">
                          <span>✓</span> Cryptographically signed
                        </span>
                        <Link
                          href={`/verify/${s.badgeId}`}
                          className="min-h-[44px] inline-flex items-center gap-1 text-sm font-semibold text-[var(--accent)] hover:text-[var(--accent-deep)] hover:underline transition-colors"
                        >
                          <span>View verified badge</span>
                          <span>→</span>
                        </Link>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
