"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import { DEMO_ISSUER_NAME } from "@/lib/demo";

interface CredentialSubject {
  name: string;
  achievement: {
    name: string;
    description: string;
    skills?: string[];
    rating?: number | null;
  };
}

interface CredentialData {
  id: string;
  issuer: {
    name: string;
  };
  validFrom: string;
  credentialSubject: CredentialSubject;
  evidence: Array<{ id: string }>;
}

interface VerifyCertificateProps {
  badgeId: string;
  credential: CredentialData | null;
  signature: string;
  isValid: boolean;
  isSample?: boolean;
}

export default function VerifyCertificate({
  badgeId,
  credential,
  signature,
  isValid,
  isSample = false,
}: VerifyCertificateProps) {
  const [copied, setCopied] = useState(false);
  const [qrUrl, setQrUrl] = useState<string>("");

  // Canonical public link: NEXT_PUBLIC_BASE_URL, else current origin, else localhost.
  const shareUrl = () => {
    const base = (
      process.env.NEXT_PUBLIC_BASE_URL ||
      (typeof window !== "undefined" ? window.location.origin : "") ||
      "http://localhost:3000"
    ).replace(/\/+$/, "");
    return `${base}/verify/${encodeURIComponent(badgeId)}`;
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      QRCode.toDataURL(shareUrl(), {
        margin: 1,
        width: 130,
        color: {
          dark: "#0B0F17",
          light: "#EAB308",
        },
      })
        .then((url) => setQrUrl(url))
        .catch(() => {});
    }
  }, []);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(shareUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  // 404 / Not Found State
  if (!credential) {
    return (
      <main className="min-h-screen bg-[var(--bg-deep)] text-[var(--ink)] py-12 px-4 flex items-center justify-center">
        <div className="max-w-md w-full paper-card p-8 text-center">
          <div className="w-14 h-14 rounded-full border border-[rgba(140,47,43,0.45)] bg-[rgba(140,47,43,0.07)] text-[var(--seal)] flex items-center justify-center mx-auto mb-4 text-2xl font-mono">
            ✕
          </div>
          <h1 className="text-2xl font-serif font-bold text-[var(--ink-strong)] tracking-tight mb-2">Badge Not Found</h1>
          <p className="text-[var(--muted)] text-sm mb-6 leading-relaxed">
            No verified skill badge matches credential ID <span className="font-mono text-xs text-[var(--ink-strong)] bg-[var(--bg)] border border-[var(--border)] px-2 py-0.5 rounded-[4px]">{badgeId}</span>. The credential may have been revoked or the verification URL is incorrect.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/"
              className="min-h-[48px] inline-flex items-center justify-center px-6 py-3 rounded-[6px] text-sm font-semibold text-[var(--surface)] bg-[var(--accent)] hover:bg-[var(--accent-deep)] transition-colors"
            >
              Return to Home
            </Link>
            <Link
              href="/learn"
              className="min-h-[48px] inline-flex items-center justify-center px-6 py-3 rounded-[6px] text-sm font-semibold text-[var(--ink-strong)] border border-[rgba(27,26,23,0.7)] hover:bg-[rgba(27,26,23,0.07)] transition-colors"
            >
              Learner Portal
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const subject = credential.credentialSubject;
  const achievement = subject.achievement;
  const issueDate = new Date(credential.validFrom).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <main className="min-h-screen bg-[var(--bg-deep)] text-[var(--ink)] py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        {/* Sample Banner if viewing sample */}
        {isSample && (
          <div className="mb-6 p-4 paper-card text-center text-sm text-[var(--ink)] flex flex-wrap items-center justify-center gap-2">
            <span className="font-semibold text-[var(--accent)]">Demo verification:</span>
            <span className="text-[var(--muted)]">This is an authentic sample badge showing how recruiters inspect signed credentials.</span>
          </div>
        )}

        {/* Demo mentor label (display only; signature validation is unaffected) */}
        {credential.issuer?.name === DEMO_ISSUER_NAME && (
          <div
            role="note"
            className="mb-6 p-4 paper-card text-center text-sm text-[var(--muted)]"
          >
            <span className="font-semibold text-[var(--ink-strong)]">Demo mentor:</span> for evaluation only. In production, only vetted mentors sign.
          </div>
        )}

        {/* Certificate Card Container — Double-Rule Frame (2px outer, 1px inner) */}
        <div className="bg-[var(--surface)] border-2 border-[rgba(27,26,23,0.7)] rounded-[10px] p-2 sm:p-3 shadow-[var(--card-shadow)]">
          <div className="relative border border-[var(--border)] rounded-[6px] p-6 sm:p-12 overflow-hidden">
            {/* Background Glows removed for paper aesthetic */}
            <div className="hidden" aria-hidden="true" />
            <div className="hidden" aria-hidden="true" />

            {/* Certificate Header with Large Rotated Ink-Red Seal Stamp */}
            <div className="flex flex-col items-center text-center pb-8 mb-8 border-b border-[var(--border)]">
              <div className="mb-6">
                {isValid ? (
                  <div className="cert-seal valid">
                    <svg className="w-[90px] h-[90px]" viewBox="0 0 48 48" fill="none" aria-hidden="true">
                      <path d="M43.5 24.0 Q47.7 28.7 42.0 31.5 Q44.1 37.4 37.8 37.8 Q37.4 44.1 31.5 42.0 Q28.7 47.7 24.0 43.5 Q19.3 47.7 16.5 42.0 Q10.6 44.1 10.2 37.8 Q3.9 37.4 6.0 31.5 Q0.3 28.7 4.5 24.0 Q0.3 19.3 6.0 16.5 Q3.9 10.6 10.2 10.2 Q10.6 3.9 16.5 6.0 Q19.3 0.3 24.0 4.5 Q28.7 0.3 31.5 6.0 Q37.4 3.9 37.8 10.2 Q44.1 10.6 42.0 16.5 Q47.7 19.3 43.5 24.0 Z" stroke="currentColor" strokeWidth="1.9" />
                      <circle cx="24" cy="24" r="16.5" stroke="currentColor" strokeWidth="1.25" />
                      <circle cx="24" cy="24" r="14" stroke="currentColor" strokeWidth="0.9" />
                      <text x="24" y="28.5" textAnchor="middle" fill="currentColor" fontSize="13" fontWeight="700" style={{ fontFamily: "var(--font-display)" }}>SP</text>
                    </svg>
                    <span className="text-sm font-serif font-bold tracking-tight leading-none">
                      Verified
                    </span>
                  </div>
                ) : (
                  <div className="cert-seal invalid">
                    <span className="text-xl font-mono font-bold leading-none">✕</span>
                    <span className="text-sm font-serif font-bold leading-tight">
                      Not verified
                    </span>
                  </div>
                )}
              </div>

              {/* Core Achievement Title & Description — Centered Editorial Serif Weight 700 */}
              <h1 className="text-2xl sm:text-4xl font-serif font-bold text-[var(--ink-strong)] tracking-tight mb-4 leading-tight max-w-2xl">
                {achievement.name}
              </h1>
              <p className="text-[var(--ink)] text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
                {achievement.description}
              </p>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-6 rounded-[10px] bg-[var(--bg)] border border-[var(--border)] mb-8">
              <div>
                <span className="text-[14px] font-semibold text-[var(--muted)] block mb-1">
                  Awarded to (learner)
                </span>
                <span className="text-base font-serif font-bold text-[var(--ink-strong)]">
                  {subject.name}
                </span>
              </div>

              <div>
                <span className="text-[14px] font-semibold text-[var(--muted)] block mb-1">
                  Endorsed &amp; signed by
                </span>
                <span className="text-base font-serif font-bold text-[var(--ink-strong)] block">
                  {credential.issuer.name}
                </span>
              </div>

              <div>
                <span className="text-[14px] font-semibold text-[var(--muted)] block mb-1">
                  Issue date
                </span>
                <span className="text-sm font-medium text-[var(--ink-strong)]">
                  {issueDate}
                </span>
              </div>

              <div>
                <span className="text-[14px] font-semibold text-[var(--muted)] block mb-1">
                  Verified evidence
                </span>
                {credential.evidence?.[0]?.id ? (
                  <a
                    href={credential.evidence[0].id}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-[var(--accent)] hover:text-[var(--accent-deep)] hover:underline font-mono transition-colors break-all"
                  >
                    <span>{credential.evidence[0].id}</span>
                    <span className="text-xs ml-1 whitespace-nowrap">↗</span>
                  </a>
                ) : (
                  <span className="text-sm text-[var(--muted)]">None attached</span>
                )}
              </div>

              {achievement.skills && achievement.skills.length > 0 && (
                <div className="sm:col-span-2 pt-4 border-t border-[var(--border)]">
                  <span className="text-[14px] font-semibold text-[var(--muted)] block mb-3">
                    Attested skills
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {achievement.skills.map((skill) => (
                      <span
                        key={skill}
                        className="px-3 py-1 rounded-[6px] text-xs font-semibold bg-[var(--surface)] border border-[var(--border)] text-[var(--ink-strong)]"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Cryptographic Seal & QR Verification Footer */}
            <div className="p-6 rounded-[10px] border border-[var(--border)] bg-[var(--bg)] flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto text-center sm:text-left">
                {qrUrl ? (
                  <img
                    src={qrUrl}
                    alt="Badge QR Verification"
                    className="w-20 h-20 rounded-[6px] border border-[var(--border)] p-1 bg-[var(--surface)] qr-paper shrink-0"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-[6px] bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-xs text-[var(--muted)] shrink-0">
                    QR...
                  </div>
                )}
                <div className="min-w-0">
                  <span className="text-[14px] font-semibold text-[var(--muted)] block mb-1">
                    Credential ID
                  </span>
                  <span className="text-xs font-mono text-[var(--muted)] font-medium block mb-3 break-all max-w-[240px]">
                    {badgeId}
                  </span>
                  <button
                    onClick={handleCopyLink}
                    className="min-h-[48px] inline-flex items-center justify-center gap-2 px-4 py-2 rounded-[6px] text-sm font-semibold text-[var(--surface)] bg-[var(--accent)] hover:bg-[var(--accent-deep)] transition-colors"
                  >
                    {copied ? (
                      <>
                        <span>✓</span> Copied Link!
                      </>
                    ) : (
                      <>
                        <span>🔗</span> Copy verification link
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Seal Graphic */}
              <div className="text-center sm:text-right">
                <div className="inline-flex items-center justify-center mb-2 text-[var(--accent)]">
                  <svg className="w-11 h-11" viewBox="0 0 48 48" fill="none" aria-hidden="true">
                    <path d="M43.5 24.0 Q47.7 28.7 42.0 31.5 Q44.1 37.4 37.8 37.8 Q37.4 44.1 31.5 42.0 Q28.7 47.7 24.0 43.5 Q19.3 47.7 16.5 42.0 Q10.6 44.1 10.2 37.8 Q3.9 37.4 6.0 31.5 Q0.3 28.7 4.5 24.0 Q0.3 19.3 6.0 16.5 Q3.9 10.6 10.2 10.2 Q10.6 3.9 16.5 6.0 Q19.3 0.3 24.0 4.5 Q28.7 0.3 31.5 6.0 Q37.4 3.9 37.8 10.2 Q44.1 10.6 42.0 16.5 Q47.7 19.3 43.5 24.0 Z" stroke="currentColor" strokeWidth="1.6" />
                    <circle cx="24" cy="24" r="16.5" stroke="currentColor" strokeWidth="1.1" />
                    <circle cx="24" cy="24" r="14" stroke="currentColor" strokeWidth="0.8" />
                    <text x="24" y="28.5" textAnchor="middle" fill="currentColor" fontSize="13" fontWeight="700" style={{ fontFamily: "var(--font-display)" }}>SP</text>
                  </svg>
                </div>
                <span className="block text-xs font-semibold text-[var(--ink-strong)]">
                  Ed25519 signature
                </span>
                <span className="block text-xs text-[var(--muted)] font-mono max-w-[160px] truncate">
                  {signature}
                </span>
              </div>
            </div>

            {/* Collapsible Raw Credential Details */}
            <div className="mt-8 pt-6 border-t border-[var(--border)]">
              <details className="group text-sm text-[var(--muted)]">
                <summary className="min-h-[44px] cursor-pointer hover:text-[var(--ink-strong)] transition-colors font-semibold select-none flex items-center gap-2">
                  <span className="text-[var(--accent)] group-open:rotate-90 transition-transform">▶</span>
                  <span>Inspect Raw W3C Verifiable Credential JSON</span>
                </summary>
                <pre className="mt-3 p-4 rounded-[6px] bg-[var(--bg)] border border-[var(--border)] overflow-x-auto text-xs font-mono text-[var(--muted)] leading-relaxed">
                  {JSON.stringify(credential, null, 2)}
                </pre>
              </details>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
