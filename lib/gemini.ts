import { consumeGeminiBudget } from "@/lib/ratelimit";

const PRO = process.env.GEMINI_PRO_MODEL || "gemini-3.8-flash";
const FLASH = process.env.GEMINI_FLASH_MODEL || "gemini-3.1-flash-lite";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function sendRequest(model: string, system: string, input: unknown) {
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: JSON.stringify(input) }] }],
      generationConfig: { responseMimeType: "application/json", temperature: 0.2 },
    }),
  });

  if (r.status === 429 || r.status === 503) {
    throw new Error("RATE_LIMIT");
  }
  if (!r.ok) {
    throw new Error(`HTTP_${r.status}`);
  }
  const j = await r.json();
  const t = j.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!t) throw new Error("EMPTY_RESPONSE");
  return JSON.parse(t);
}

async function call(model: string, system: string, input: unknown) {
  // Global daily cap (counted once per logical call, not per retry). Throws LimitError (429).
  await consumeGeminiBudget();

  const delays = [1000, 2000, 4000];

  for (let i = 0; i <= delays.length; i++) {
    try {
      return await sendRequest(model, system, input);
    } catch (err: any) {
      if (err?.message === "RATE_LIMIT" && i < delays.length) {
        await sleep(delays[i]);
        continue;
      }
      break;
    }
  }

  const fallback = process.env.GEMINI_FALLBACK_MODEL || "gemini-3.7-flash";
  if (fallback) {
    try {
      return await sendRequest(fallback, system, input);
    } catch {
      // Fallback failed
    }
  }

  throw new Error("Gemini is busy, try again in a minute");
}

const REVIEW_SYS = `You help a human mentor review a learner's project. You only suggest; the mentor decides.
Return JSON only: {"skills":[string],"rating":1-5,"reasons":[string],"riskFlags":[string],"liveCheckQuestions":[string]}.
skills: concrete skills the work demonstrates. reasons: 2-4 evidence-based sentences.
riskFlags: signs the work may not be the learner's own or is thin (generic description, no process evidence, mismatch between claim and repo). Empty list if none.
liveCheckQuestions: 3 short questions only the real author could answer about trade-offs and debugging.`;

const BADGE_SYS = `Draft a verifiable skill badge. Return JSON only: {"title":string,"description":string}.
title: under 8 words. description: 2 plain sentences a recruiter understands, stating what the learner demonstrated.`;

export const reviewWithPro = (s: unknown) => call(PRO, REVIEW_SYS, s);
export const draftBadgeWithFlash = (s: unknown) => call(FLASH, BADGE_SYS, s);
