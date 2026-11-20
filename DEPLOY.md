# SkillProof Deployment Guide

Project: `skillproof-52076` | Region: `asia-south1`

## 1. Set Secrets in Cloud Secret Manager (names only)
```bash
firebase apphosting:secrets:set GEMINI_API_KEY
firebase apphosting:secrets:set ISSUER_PRIVATE_KEY_PEM
firebase apphosting:secrets:set GITHUB_TOKEN # Optional: higher GitHub rate limits
```

## 2. Create Firebase App Hosting Backend
```bash
firebase apphosting:backends:create --project skillproof-52076 --location asia-south1
```
Connect your GitHub repository and choose the `main` branch.

## 3. Authorize Domain in Firebase Auth
In Firebase Console > Authentication > Settings > Authorized domains:
- Add your backend domain (e.g. `<backend>--skillproof-52076.asia-south1.hosted.app`).

## 4. Set Base URL & Redeploy
- In `apphosting.yaml`, set `NEXT_PUBLIC_BASE_URL` to your live domain (no trailing slash).
- Push to `main` to trigger the production build and rollout.

## 5. Seed Demo Data (Idempotent)
```bash
npm run seed:demo
```

## 6. Live Test Checklist
1. Open `/`: Confirm hero, 3-step strip, sample verify link, and evaluation footer.
2. Open `/verify/sample`: Confirm valid status, Raft consensus demo, and QR code.
3. Open `/mentor`: Confirm "Evaluation access" box displays credentials.
4. Sign in as demo mentor: Confirm queue loads and Gemini analysis works.
5. Sign badge: Confirm seal stamp animation and "DEMO MENTOR" warning on `/verify/[id]`.
6. Open `/learn`: Sign in, submit a project repo, and confirm it appears in the queue.
