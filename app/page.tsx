"use client";

import Link from "next/link";
import { useAuth } from "@/lib/firebase-client";

export default function Home() {
  const { user, loading, signInWithGoogle } = useAuth();

  return (
    <main className="landing">
      <div className="wrap">
        <section className="hero">
          <div className="seal-crest" aria-hidden="true">
            <span className="crest-ring">
              <span className="crest-inner">★</span>
            </span>
            <span className="crest-text">NOTARY &amp; VERIFICATION LEDGER</span>
          </div>

          <h1 className="hero-title">
            Skill badges signed by the mentor who saw the work.
          </h1>

          <p className="hero-lead">
            SkillProof is a cryptographic ledger
            where mentors evaluate real codebases with Gemini assistance, sign with Ed25519,
            and provide proof recruiters verify in one click.
          </p>

          <div className="hero-actions">
            {loading ? (
              <span className="dim">Checking session...</span>
            ) : user ? (
              <div className="signed-in-actions">
                <Link className="btn seal" href="/learn">
                  Go to Learner Dashboard →
                </Link>
                <Link className="btn ghost" href="/mentor">
                  Open Mentor Queue
                </Link>
              </div>
            ) : (
              <div className="signed-out-actions">
                <button className="btn seal" onClick={signInWithGoogle} type="button">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    style={{ marginRight: 8, verticalAlign: "middle" }}
                    aria-hidden="true"
                  >
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      fill="#EA4335"
                    />
                  </svg>
                  Continue with Google
                </button>
                <Link className="btn ghost" href="/learn">
                  Explore as Learner
                </Link>
              </div>
            )}
            <Link className="sample-link" href="/verify/sample">
              <span>View sample verified credential →</span>
            </Link>
          </div>
        </section>

        <section className="strip-section">
          <div className="section-header">
            <span className="notary-kicker">THE THREE-STEP NOTARY LEDGER</span>
            <h2>How engineering work becomes verifiable proof</h2>
          </div>

          <div className="steps-strip">
            <div className="step-card">
              <div className="step-num">01</div>
              <h3>Submit</h3>
              <p>
                The learner registers their project repository and details architectural decisions,
                concurrency choices, and trade-offs.
              </p>
              <div className="step-tag">Evidence Ingestion</div>
            </div>

            <div className="step-card featured">
              <div className="step-num">02</div>
              <h3>Mentor reviews with AI help</h3>
              <p>
                Gemini Pro analyzes code complexity, evaluates risk flags, and drafts targeted
                live-check questions before human mentor sign-off.
              </p>
              <div className="step-tag gold">AI Suggestion + Mentor Decides</div>
            </div>

            <div className="step-card">
              <div className="step-num">03</div>
              <h3>Signed badge anyone can verify</h3>
              <p>
                The mentor commits an Ed25519 digital signature over an Open Badges 3.0 credential.
                Stored securely and verified publicly in one click.
              </p>
              <div className="step-tag">Cryptographic Proof</div>
            </div>
          </div>
        </section>

        <section className="preview-banner">
          <div className="preview-inner">
            <div className="preview-content">
              <span className="notary-kicker">PUBLIC VERIFICATION</span>
              <h3>Instant, zero-login proof for recruiters</h3>
              <p>
                Every credential is backed by an immutable cryptographic signature. Recruiters and engineering leads
                can inspect issuer identity, skills, and code repository links directly.
              </p>
              <p>
                <Link className="btn ghost btn-sm" href="/verify/sample">
                  Inspect the verification experience →
                </Link>
              </p>
            </div>
            <div className="preview-seal-art" aria-hidden="true">
              <div className="sample-stamp-badge">
                <span className="stamp-sub">OPEN BADGES 3.0</span>
                <span className="stamp-main">ED25519</span>
                <span className="stamp-sub">VERIFIED LEDGER</span>
              </div>
            </div>
          </div>
        </section>

        <footer className="mt-10 pt-6 border-t border-white/10 text-center text-xs text-slate-500">
          Evaluators can sign in on the Mentor page with the shared demo account; badges it signs are labelled
          &ldquo;SkillProof Demo Mentor (evaluation account)&rdquo; and are for evaluation only.
        </footer>
      </div>
    </main>
  );
}
