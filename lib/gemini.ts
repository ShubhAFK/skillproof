import { consumeGeminiBudget } from "@/lib/ratelimit";

const PRO = process.env.GEMINI_PRO_MODEL || "gemini-3.8-flash";
const FLASH = process.env.GEMINI_FLASH_MODEL || "gemini-3.1-flash-lite";
const FALLBACK = process.env.GEMINI_FALLBACK_MODEL || "gemini-3.7-flash";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function sendRequest(model: string, system: string, input: unknown) {
  let r: Response;
  try {
    r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY! },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: JSON.stringify(input) }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.2 },
      }),
    });
  } catch (netErr: any) {
    const msg = (netErr?.message || "").slice(0, 300);
    console.error("gemini", 0, model, msg);
    throw netErr;
  }

  if (!r.ok) {
    const text = await r.text().catch(() => "");
    const body = text.slice(0, 300);
    console.error("gemini", r.status, model, body);
    if (r.status === 429 || r.status === 503) {
      const err: any = new Error("RATE_LIMIT");
      err.step = "gemini";
      err.status = r.status;
      err.model = model;
      err.body = body;
      throw err;
    }
    const err: any = new Error(`HTTP_${r.status}`);
    err.step = "gemini";
    err.status = r.status;
    err.model = model;
    err.body = body;
    throw err;
  }
  const j = await r.json();
  const t = j.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!t) throw new Error("EMPTY_RESPONSE");
  return JSON.parse(t);
}

const REVIEW_SYS = `You help a human mentor review a learner's project. You only suggest; the mentor decides.
Return JSON only: {"skills":[string],"rating":1-5,"reasons":[string],"riskFlags":[string],"liveCheckQuestions":[string]}.
skills: concrete skills the work demonstrates. reasons: 2-4 evidence-based sentences.
riskFlags: signs the work may not be the learner's own or is thin (generic description, no process evidence, mismatch between claim and repo). Empty list if none.
liveCheckQuestions: 3 short questions only the real author could answer about trade-offs and debugging.`;

const BADGE_SYS = `Draft a verifiable skill badge. Return JSON only: {"title":string,"description":string}.
title: under 8 words. description: 2 plain sentences a recruiter understands, stating what the learner demonstrated.`;

export async function reviewWithPro(s: unknown) {
  // Global daily cap (counted once per logical call, not per retry). Throws LimitError (429).
  await consumeGeminiBudget();

  try {
    return await sendRequest(PRO, REVIEW_SYS, s);
  } catch (err: any) {
    if (err?.message === "RATE_LIMIT" || err?.message === "HTTP_404" || err?.message === "EMPTY_RESPONSE") {
      try {
        return await sendRequest(FALLBACK, REVIEW_SYS, s);
      } catch (fallbackErr: any) {
        if (fallbackErr?.message === "RATE_LIMIT") {
          const finalErr: any = new Error("Gemini is busy, try again in a minute");
          finalErr.step = fallbackErr?.step || "gemini";
          finalErr.status = fallbackErr?.status || 429;
          finalErr.model = fallbackErr?.model || FALLBACK;
          finalErr.body = fallbackErr?.body || "";
          throw finalErr;
        }
        throw fallbackErr;
      }
    }
    throw err;
  }
}

export async function draftBadgeWithFlash(s: unknown) {
  // Global daily cap (counted once per logical call, not per retry). Throws LimitError (429).
  await consumeGeminiBudget();

  const delays = [1000, 2000, 4000];
  for (let i = 0; i <= delays.length; i++) {
    try {
      return await sendRequest(FLASH, BADGE_SYS, s);
    } catch (err: any) {
      if (err?.message === "RATE_LIMIT" && i < delays.length) {
        await sleep(delays[i]);
        continue;
      }
      if (err?.message === "RATE_LIMIT") {
        const finalErr: any = new Error("Gemini is busy, try again in a minute");
        finalErr.step = err?.step || "gemini";
        finalErr.status = err?.status || 429;
        finalErr.model = err?.model || FLASH;
        finalErr.body = err?.body || "";
        throw finalErr;
      }
      throw err;
    }
  }
}
