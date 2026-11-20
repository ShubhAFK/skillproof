"use client";

import Link from "next/link";
import { useAuth } from "@/lib/firebase-client";

export default function Header() {
  const { user, loading, signInWithGoogle, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-[var(--bg)] border-b border-[var(--border)] text-[var(--ink)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 min-h-[64px] flex items-center justify-between gap-4">
        {/* Brand & Nav Links */}
        <div className="flex items-center gap-4 sm:gap-8 min-w-0">
          <Link
            href="/"
            className="flex items-center gap-2 min-h-[44px] font-serif font-bold text-lg sm:text-xl text-[var(--ink-strong)] tracking-tight hover:text-[var(--accent)] transition-colors shrink-0"
          >
            <svg className="w-7 h-7 text-[var(--accent)] shrink-0" viewBox="0 0 48 48" fill="none" aria-hidden="true">
              <path d="M43.5 24.0 Q47.7 28.7 42.0 31.5 Q44.1 37.4 37.8 37.8 Q37.4 44.1 31.5 42.0 Q28.7 47.7 24.0 43.5 Q19.3 47.7 16.5 42.0 Q10.6 44.1 10.2 37.8 Q3.9 37.4 6.0 31.5 Q0.3 28.7 4.5 24.0 Q0.3 19.3 6.0 16.5 Q3.9 10.6 10.2 10.2 Q10.6 3.9 16.5 6.0 Q19.3 0.3 24.0 4.5 Q28.7 0.3 31.5 6.0 Q37.4 3.9 37.8 10.2 Q44.1 10.6 42.0 16.5 Q47.7 19.3 43.5 24.0 Z" stroke="currentColor" strokeWidth="1.75" />
              <circle cx="24" cy="24" r="16.5" stroke="currentColor" strokeWidth="1.1" />
              <circle cx="24" cy="24" r="14" stroke="currentColor" strokeWidth="0.8" />
              <text x="24" y="28.5" textAnchor="middle" fill="currentColor" fontSize="13" fontWeight="700" style={{ fontFamily: "var(--font-display)" }}>SP</text>
            </svg>
            <span>SkillProof</span>
          </Link>
          <nav className="flex items-center gap-2 sm:gap-6 text-sm font-semibold">
            <Link
              href="/learn"
              className="min-h-[44px] inline-flex items-center px-2 text-[var(--muted)] hover:text-[var(--ink-strong)] transition-colors"
            >
              Learner
            </Link>
            <Link
              href="/mentor"
              className="min-h-[44px] inline-flex items-center px-2 text-[var(--muted)] hover:text-[var(--ink-strong)] transition-colors"
            >
              Mentor
            </Link>
          </nav>
        </div>

        {/* Right Session Area */}
        <div className="flex items-center gap-3 shrink-0">
          {loading ? (
            <span className="text-sm text-[var(--muted)]">Loading...</span>
          ) : user ? (
            <div className="flex items-center gap-3">
              {user.photoURL && (
                <img
                  src={user.photoURL}
                  alt={user.displayName || "Avatar"}
                  className="w-8 h-8 rounded-full border border-[var(--border)] object-cover"
                  referrerPolicy="no-referrer"
                />
              )}
              <span className="text-sm font-medium text-[var(--ink)] hidden md:inline-block max-w-[140px] truncate">
                {user.displayName || user.email}
              </span>
              <button
                onClick={signOut}
                className="min-h-[44px] px-4 py-2 rounded-[6px] text-sm font-semibold text-[var(--ink-strong)] border border-[rgba(27,26,23,0.7)] hover:bg-[rgba(27,26,23,0.07)] transition-colors"
              >
                Sign out
              </button>
            </div>
          ) : (
            <button
              onClick={signInWithGoogle}
              className="min-h-[44px] flex items-center gap-2 px-4 py-2 rounded-[6px] text-sm font-semibold text-[var(--surface)] bg-[var(--accent)] hover:bg-[var(--accent-deep)] transition-colors"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="currentColor"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="currentColor"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="currentColor"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="currentColor"/>
              </svg>
              <span>Sign in</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
