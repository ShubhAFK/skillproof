"use client";

import { useState } from "react";
import { useAuth } from "@/lib/firebase-client";

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

  const demoEmail = process.env.NEXT_PUBLIC_DEMO_MENTOR_EMAIL || "";
  const demoPassword = process.env.NEXT_PUBLIC_DEMO_MENTOR_PASSWORD || "";
  const hasDemo = showDemoAccess && Boolean(demoEmail && demoPassword);

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
      <div className="flex items-center gap-3 mb-5" aria-hidden="true">
        <span className="h-px flex-1 bg-white/10" />
        <span className="text-[11px] font-mono uppercase tracking-widest text-slate-500">or</span>
        <span className="h-px flex-1 bg-white/10" />
      </div>

      <form onSubmit={submit} className="flex flex-col gap-3">
        <div>
          <label htmlFor="es-email" className="block text-xs font-medium text-slate-300 mb-1.5">
            Email
          </label>
          <input
            id="es-email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-[#0B0F17] border border-white/15 rounded-lg px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400/70 focus:ring-1 focus:ring-amber-400/30 transition"
          />
        </div>
        <div>
          <label htmlFor="es-password" className="block text-xs font-medium text-slate-300 mb-1.5">
            Password
          </label>
          <input
            id="es-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full bg-[#0B0F17] border border-white/15 rounded-lg px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400/70 focus:ring-1 focus:ring-amber-400/30 transition"
          />
        </div>

        {err && (
          <p className="text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2" role="alert">
            {err}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full px-5 py-2.5 rounded-lg text-sm font-semibold text-slate-200 border border-white/15 hover:border-amber-400/60 hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {busy ? "Signing in..." : "Sign in with email"}
        </button>
      </form>

      {hasDemo && (
        <div className="mt-5 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3">
          <p className="text-[11px] font-mono uppercase tracking-widest text-slate-400 mb-2">Evaluation access</p>
          <dl className="grid grid-cols-[72px_1fr] gap-y-1 text-xs">
            <dt className="text-slate-500">Email</dt>
            <dd className="font-mono text-slate-300 break-all">{demoEmail}</dd>
            <dt className="text-slate-500">Password</dt>
            <dd className="font-mono text-slate-300 break-all">{demoPassword}</dd>
          </dl>
          <button
            type="button"
            onClick={() => {
              setEmail(demoEmail);
              setPassword(demoPassword);
            }}
            className="mt-2 text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors"
          >
            Fill in demo credentials
          </button>
        </div>
      )}
    </div>
  );
}
