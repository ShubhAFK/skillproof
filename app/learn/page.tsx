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
    className: "bg-amber-500/10 text-amber-300 border-amber-500/30",
  },
  changes_requested: {
    label: "Needs Revision",
    className: "bg-orange-500/10 text-orange-300 border-orange-500/30",
  },
  live_check: {
    label: "Live Check Required",
    className: "bg-purple-500/10 text-purple-300 border-purple-500/30",
  },
  issued: {
    label: "Verified & Issued",
    className: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
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
      <main className="min-h-screen bg-[#0B0F17] text-slate-100 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-sm">Verifying session...</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-[#0B0F17] text-slate-100 py-16 px-4">
        <div className="max-w-md mx-auto bg-[#111622] border border-white/10 rounded-xl p-8 text-center shadow-2xl">
          <div className="w-12 h-12 rounded-full border border-amber-400/30 bg-amber-400/10 text-amber-400 flex items-center justify-center mx-auto mb-5 text-xl font-serif">
            ◆
          </div>
          <h1 className="text-2xl font-serif font-bold text-white mb-2">Submit Your Work</h1>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">
            Sign in with your Google account to record your project evidence, request mentor evaluation, and receive cryptographic skill badges.
          </p>
          <button
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-lg font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 transition-colors shadow-lg shadow-amber-400/15"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
            </svg>
            Continue with Google
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0B0F17] text-slate-100 py-12 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-400/30 bg-amber-400/10 text-amber-300 text-xs font-mono mb-3">
            <span>LEARNER NOTARY SUBMISSION</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-white mb-2">
            Submit your work
          </h1>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Submitting as <span className="text-slate-200 font-medium">{user.displayName || user.email}</span>. A human mentor reviews your engineering trade-offs and issues a cryptographically signed badge.
          </p>
        </div>

        {/* Submission Form Card */}
        <div className="bg-[#111622] border border-white/10 rounded-xl p-6 sm:p-8 shadow-2xl mb-12">
          <form onSubmit={submit} className="flex flex-col gap-6">
            <div>
              <label htmlFor="t" className="block text-sm font-medium text-slate-200 mb-1">
                Project title
              </label>
              <span className="text-xs text-slate-400 mb-2 block">
                Give your build a concise, representative name
              </span>
              <input
                id="t"
                type="text"
                value={f.title}
                onChange={(e) => setF({ ...f, title: e.target.value })}
                placeholder="e.g. Distributed Consensus Engine"
                required
                className="w-full bg-[#0B0F17] border border-white/15 rounded-lg px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400/70 focus:ring-1 focus:ring-amber-400/30 transition"
              />
            </div>

            <div>
              <label htmlFor="d" className="block text-sm font-medium text-slate-200 mb-1">
                What did you build, and what did you decide along the way?
              </label>
              <span className="text-xs text-slate-400 mb-2 block">
                Explain your system architecture, concurrency models, trade-offs, and tricky bugs you solved
              </span>
              <textarea
                id="d"
                value={f.description}
                onChange={(e) => setF({ ...f, description: e.target.value })}
                placeholder="We opted for a Raft-based state machine replication over Paxos because... A key challenge was handling split-brain network partitions during leader election..."
                rows={5}
                className="w-full min-h-[140px] resize-y bg-[#0B0F17] border border-white/15 rounded-lg px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400/70 focus:ring-1 focus:ring-amber-400/30 transition"
              />
            </div>

            <div>
              <label htmlFor="r" className="block text-sm font-medium text-slate-200 mb-1">
                Repo or demo link
              </label>
              <span className="text-xs text-slate-400 mb-2 block">
                A public GitHub / GitLab URL or live interactive demo where a mentor can inspect the code
              </span>
              <input
                id="r"
                type="url"
                value={f.repoUrl}
                onChange={(e) => setF({ ...f, repoUrl: e.target.value })}
                placeholder="https://github.com/username/project"
                required
                className="w-full bg-[#0B0F17] border border-white/15 rounded-lg px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400/70 focus:ring-1 focus:ring-amber-400/30 transition"
              />
            </div>

            {err && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-sm" role="alert">
                {err}
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={busy}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 transition-all shadow-lg shadow-amber-400/15 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {busy ? (
                  <>
                    <span className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
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
            <h2 className="text-xl font-serif font-bold text-white">Your submissions</h2>
            <span className="text-xs text-slate-400 font-mono">
              {list.length} {list.length === 1 ? "entry" : "entries"} recorded
            </span>
          </div>

          {fetchingList && !list.length ? (
            <div className="bg-[#111622] border border-white/10 rounded-xl p-8 text-center text-slate-400 text-sm">
              Loading your records...
            </div>
          ) : !list.length ? (
            <div className="border border-dashed border-white/15 rounded-xl p-8 sm:p-10 text-center bg-[#111622]/40">
              <div className="w-12 h-12 rounded-full border border-white/10 bg-white/5 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-base font-medium text-slate-200 mb-1">No submissions yet</h3>
              <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto">
                Submit your first project above. Once submitted, its review status and signed verifiable badge will appear here.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {list.map((s) => {
                const badge = statusMap[s.status] || {
                  label: s.status,
                  className: "bg-slate-700/30 text-slate-300 border-white/10",
                };
                return (
                  <div
                    key={s.id}
                    className="bg-[#111622] border border-white/10 hover:border-white/20 transition-all rounded-xl p-5 sm:p-6"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-2">
                      <div>
                        <h3 className="text-lg font-serif font-bold text-white mb-1">
                          {s.title}
                        </h3>
                        {s.repoUrl && (
                          <a
                            href={s.repoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 transition-colors font-mono"
                          >
                            <span>{s.repoUrl}</span>
                            <span className="text-[10px]">↗</span>
                          </a>
                        )}
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      </div>
                    </div>

                    {s.description && (
                      <p className="text-xs sm:text-sm text-slate-400 line-clamp-2 mt-2">
                        {s.description}
                      </p>
                    )}

                    {s.note && (
                      <div className="mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-200/90 text-xs sm:text-sm">
                        <span className="font-semibold text-amber-300">Mentor note:</span> {s.note}
                      </div>
                    )}

                    {s.badgeId && (
                      <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                        <span className="text-xs text-emerald-400 flex items-center gap-1 font-mono">
                          <span>✓</span> Cryptographically signed
                        </span>
                        <Link
                          href={`/verify/${s.badgeId}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors"
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
