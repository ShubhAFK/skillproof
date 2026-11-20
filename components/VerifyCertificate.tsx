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
      <main className="min-h-screen bg-[#0B0F17] text-slate-100 py-16 px-4 flex items-center justify-center">
        <div className="max-w-md w-full bg-[#111622] border border-white/10 rounded-2xl p-8 text-center shadow-2xl">
          <div className="w-14 h-14 rounded-full border border-red-500/30 bg-red-500/10 text-red-400 flex items-center justify-center mx-auto mb-4 text-2xl font-mono">
            ✕
          </div>
          <h1 className="text-2xl font-serif font-bold text-white mb-2">Badge Not Found</h1>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">
            No verified skill badge matches credential ID <span className="font-mono text-xs text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded">{badgeId}</span>. The credential may have been revoked or the verification URL is incorrect.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/"
              className="px-5 py-2.5 rounded-lg text-sm font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 transition-colors"
            >
              Return to Home
            </Link>
            <Link
              href="/learn"
              className="px-5 py-2.5 rounded-lg text-sm font-semibold text-slate-300 border border-white/15 hover:bg-white/5 transition-colors"
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
    <main className="min-h-screen bg-[#0B0F17] text-slate-100 py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        {/* Sample Banner if viewing sample */}
        {isSample && (
          <div className="mb-6 p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-center text-xs sm:text-sm text-amber-200 flex items-center justify-center gap-2">
            <span className="font-bold text-amber-400">DEMO VERIFICATION:</span>
            <span>This is an authentic sample badge showing how recruiters inspect signed credentials.</span>
          </div>
        )}

        {/* Demo mentor label (display only; signature validation is unaffected) */}
        {credential.issuer?.name === DEMO_ISSUER_NAME && (
          <div
            role="note"
            className="mb-6 p-3.5 bg-amber-400/10 border border-amber-400/50 rounded-xl text-center text-xs sm:text-sm text-amber-200"
          >
            <span className="font-bold text-amber-400">DEMO MENTOR:</span> for evaluation only. In production, only vetted mentors sign.
          </div>
        )}

        {/* Certificate Card Container */}
        <div className="relative bg-[#111622] border-2 border-amber-400/40 rounded-2xl p-6 sm:p-10 shadow-2xl shadow-amber-500/5 overflow-hidden">
          {/* Subtle Background Radial Glow */}
          <div
            className="absolute -top-24 -right-24 w-80 h-80 bg-amber-400/10 rounded-full blur-3xl pointer-events-none"
            aria-hidden="true"
          />
          <div
            className="absolute -bottom-24 -left-24 w-80 h-80 bg-amber-400/5 rounded-full blur-3xl pointer-events-none"
            aria-hidden="true"
          />

          {/* Certificate Header Banner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-white/10">
            <div>
              <span className="text-[11px] font-mono tracking-widest text-amber-400 uppercase font-semibold block mb-1">
                CRYPTOGRAPHIC ATTESTATION RECORD
              </span>
              <span className="text-xs text-slate-400 font-mono">
                SPEC: OPEN BADGES 3.0 / W3C VERIFIABLE CREDENTIALS
              </span>
            </div>

            {/* Cryptographic Validity Status */}
            <div>
              {isValid ? (
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold tracking-wide">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  SIGNATURE VALID &amp; VERIFIED
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-semibold tracking-wide">
                  <span className="w-2 h-2 rounded-full bg-red-400" />
                  SIGNATURE DOES NOT MATCH
                </div>
              )}
            </div>
          </div>

          {/* Core Achievement Title & Description */}
          <div className="mb-8">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold block mb-2">
              ACHIEVEMENT TITLE
            </span>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-white mb-3 leading-tight">
              {achievement.name}
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              {achievement.description}
            </p>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-6 rounded-xl bg-[#0B0F17]/70 border border-white/10 mb-8">
            <div>
              <span className="text-xs text-slate-500 uppercase tracking-wider block mb-1 font-mono">
                Awarded To (Learner)
              </span>
              <span className="text-base font-semibold text-white">
                {subject.name}
              </span>
            </div>

            <div>
              <span className="text-xs text-slate-500 uppercase tracking-wider block mb-1 font-mono">
                Endorsed &amp; Signed By
              </span>
              <span className="text-base font-semibold text-amber-300 flex items-center gap-2">
                <span className="text-amber-400 text-xs">•</span> {credential.issuer.name}
              </span>
            </div>

            <div>
              <span className="text-xs text-slate-500 uppercase tracking-wider block mb-1 font-mono">
                Issue Date
              </span>
              <span className="text-sm text-slate-200 font-mono">
                {issueDate}
              </span>
            </div>

            <div>
              <span className="text-xs text-slate-500 uppercase tracking-wider block mb-1 font-mono">
                Verified Evidence
              </span>
              {credential.evidence?.[0]?.id ? (
                <a
                  href={credential.evidence[0].id}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-amber-400 hover:text-amber-300 font-mono inline-flex items-center gap-1 transition-colors break-all"
                >
                  <span>{credential.evidence[0].id}</span>
                  <span className="text-xs">↗</span>
                </a>
              ) : (
                <span className="text-sm text-slate-500">None attached</span>
              )}
            </div>

            {achievement.skills && achievement.skills.length > 0 && (
              <div className="sm:col-span-2 pt-2 border-t border-white/10">
                <span className="text-xs text-slate-500 uppercase tracking-wider block mb-2 font-mono">
                  Attested Skills
                </span>
                <div className="flex flex-wrap gap-2">
                  {achievement.skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-400/10 border border-amber-400/25 text-amber-300"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Cryptographic Seal & QR Verification Footer */}
          <div className="p-6 rounded-xl border border-white/10 bg-[#0B0F17] flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              {qrUrl ? (
                <img
                  src={qrUrl}
                  alt="Badge QR Verification"
                  className="w-20 h-20 rounded-lg border border-amber-400/30 p-1 bg-[#EAB308]"
                />
              ) : (
                <div className="w-20 h-20 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-xs text-slate-500">
                  QR...
                </div>
              )}
              <div>
                <span className="text-xs font-mono text-slate-400 block mb-0.5">
                  CREDENTIAL ID
                </span>
                <span className="text-xs font-mono text-amber-400 font-semibold block mb-2 break-all max-w-[220px]">
                  {badgeId}
                </span>
                <button
                  onClick={handleCopyLink}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 transition-colors"
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
            <div className="text-center sm:text-right hidden sm:block">
              <div className="inline-block p-2.5 rounded-full border border-amber-400/30 bg-amber-400/5 mb-1">
                <svg className="w-5 h-5 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <span className="block text-[10px] font-mono tracking-widest text-slate-400 uppercase">
                ED25519 ASYMMETRIC KEYPAIR
              </span>
              <span className="block text-[10px] font-mono text-slate-500">
                CRYPTOGRAPHIC TRUST ROOT
              </span>
            </div>
          </div>

          {/* Collapsible Raw Credential Details */}
          <div className="mt-8 pt-4 border-t border-white/10">
            <details className="group text-xs text-slate-400">
              <summary className="cursor-pointer hover:text-slate-200 transition-colors font-mono select-none flex items-center gap-2">
                <span className="text-amber-400 group-open:rotate-90 transition-transform">▶</span>
                <span>Inspect Raw W3C Verifiable Credential JSON</span>
              </summary>
              <pre className="mt-3 p-4 rounded-lg bg-[#070B12] border border-white/10 overflow-x-auto text-[11px] font-mono text-slate-300 leading-normal">
                {JSON.stringify(credential, null, 2)}
              </pre>
            </details>
          </div>
        </div>
      </div>
    </main>
  );
}
