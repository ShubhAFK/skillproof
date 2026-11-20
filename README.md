# SkillProof (Karbon X)

One Next.js app, two faces: `/learn` (simple) and `/mentor` (showcase), plus public `/verify/<badgeId>`.
Backend = Next API routes on Cloud Run. DB = Firestore. AI = Gemini Pro (review) + Flash (badge draft).

## Run locally
1. `cp .env.example .env.local`, fill it. Get the key line with `npm run genkey`.
2. `gcloud auth application-default login` (Firestore access), enable Firestore (Native mode) in your GCP project.
3. `npm install && npm run dev`

## Deploy to Cloud Run
gcloud run deploy skillproof --source . --region asia-south1 --allow-unauthenticated \
  --set-env-vars GCP_PROJECT=...,GEMINI_API_KEY=...,ISSUER_NAME=...,ISSUER_PRIVATE_KEY_PEM=...

## Not built yet (do at the event)
Firebase Auth (mentor login), Cloud KMS signing instead of env key, git-history summary, learner profiles.
