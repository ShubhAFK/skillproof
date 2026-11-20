"use client";

import { useState } from "react";
import { useAuth } from "@/lib/firebase-client";
import { DEMO_MENTOR_EMAIL, DEMO_MENTOR_PASSWORD } from "@/lib/demo";

function friendlyAuthError(code?: string): string {
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
    case "auth/invalid-email":
      return "Email or password is incorrect.";
    case "auth/too-many-requests":
      return "Too many attempts. Wait a minute and try again.";
    case "auth/operation-not-allowed":
      return "Email/password sign-in isn't enabled for this project yet.";
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again.";
    default:
      return "Sign-in failed. Please try again.";
  }
}

export default function EmailSignIn({ showDemoAccess = false }: { showDemoAccess?: boolean }) {
  const { signInWithEmail } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");



  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      await signInWithEmail(email, password);
    } catch (error: unknown) {
      setErr(friendlyAuthError((error as { code?: string })?.code));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-6 text-left">
      <div className="flex items-center gap-3 mb-6" aria-hidden="true">
        <span className="h-px flex-1 bg-[var(--border)]" />
        <span className="text-sm font-medium text-[var(--muted)]">or</span>
        <span className="h-px flex-1 bg-[var(--border)]" />
      </div>

      <form onSubmit={submit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="es-email" className="block text-[14px] font-semibold text-[var(--muted)] mb-2">
            Email
          </label>
          <input
            id="es-email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full min-h-[48px] bg-[var(--bg)] border border-[var(--border)] rounded-[6px] px-4 py-3 text-sm text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
          />
        </div>
        <div>
          <label htmlFor="es-password" className="block text-[14px] font-semibold text-[var(--muted)] mb-2">
            Password
          </label>
          <input
            id="es-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full min-h-[48px] bg-[var(--bg)] border border-[var(--border)] rounded-[6px] px-4 py-3 text-sm text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
          />
        </div>

        {err && (
          <p className="text-sm font-medium text-[var(--seal)] bg-[rgba(140,47,43,0.07)] border border-[rgba(140,47,43,0.35)] rounded-[6px] px-3 py-2" role="alert">
            {err}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full min-h-[48px] px-4 py-3 rounded-[6px] text-sm font-semibold text-[var(--ink-strong)] border border-[rgba(27,26,23,0.7)] hover:bg-[rgba(27,26,23,0.07)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {busy ? "Signing in..." : "Sign in with email"}
        </button>
      </form>

      {showDemoAccess && (
        <div className="mt-6 rounded-[10px] border border-[var(--border)] bg-[var(--bg)] px-4 py-4">
          <p className="text-[14px] font-semibold text-[var(--muted)] mb-2">Evaluation access</p>
          <dl className="grid grid-cols-[76px_1fr] gap-y-1 text-sm">
            <dt className="text-[var(--muted)] font-medium">Email</dt>
            <dd className="font-mono text-[var(--ink-strong)] break-all text-xs self-center">{DEMO_MENTOR_EMAIL}</dd>
            <dt className="text-[var(--muted)] font-medium">Password</dt>
            <dd className="font-mono text-[var(--ink-strong)] break-all text-xs self-center">{DEMO_MENTOR_PASSWORD}</dd>
          </dl>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setEmail(DEMO_MENTOR_EMAIL);
                setPassword(DEMO_MENTOR_PASSWORD);
              }}
              className="min-h-[44px] inline-flex items-center text-sm font-semibold text-[var(--accent)] hover:text-[var(--accent-deep)] hover:underline transition-colors"
            >
              Fill login
            </button>
            <span className="text-xs font-medium text-[var(--muted)]">
              For Evaluation Purposes
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
