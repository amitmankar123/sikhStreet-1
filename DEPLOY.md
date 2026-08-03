# SikhStreet — Netlify Deployment Guide

## Overview

This is a **monorepo** — the frontend lives in `frontend/` and the backend lives in `backend/`.
Netlify only builds and serves the **frontend**. The backend must be deployed separately (e.g., Railway, Render, or a VPS).

---

## 1. Connect Repo to Netlify

1. Go to [app.netlify.com](https://app.netlify.com) → **Add new site** → **Import an existing project**
2. Authenticate with GitHub and select the `sikhStreet` repository
3. Netlify will auto-detect `netlify.toml` from the repo root

---

## 2. Build Settings (auto-filled from `netlify.toml`)

| Setting | Value |
|---|---|
| **Base directory** | `frontend` |
| **Build command** | `npm run build` |
| **Publish directory** | `dist` |
| **Node version** | `18` |

> These are already set in the root `netlify.toml`. You should not need to change anything in the Netlify UI.

---

## 3. Environment Variables

Add these in: **Netlify Dashboard → Site Settings → Environment Variables**

### Backend API
| Variable | Description | Example |
|---|---|---|
| `VITE_API_BASE_URL` | Your backend REST API base URL | `https://sikhstreet-api.railway.app/api` |

### Firebase (get from Firebase Console → Project Settings → Your apps)
| Variable | Description |
|---|---|
| `VITE_FIREBASE_API_KEY` | Firebase web API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `VITE_FIREBASE_DATABASE_URL` | Realtime database URL |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase app ID |
| `VITE_FIREBASE_MEASUREMENT_ID` | Firebase analytics measurement ID |
| `VITE_FIREBASE_VAPID_KEY` | Firebase Cloud Messaging VAPID key |

> **Never commit .env to git.** The .env file is gitignored. Only .env.example is committed.

---

## 4. SPA Routing (already configured)

The `netlify.toml` and `public/_redirects` both contain:
```
/* /index.html 200
```
This ensures React Router handles all client-side navigation without Netlify returning a 404 on direct URL access or page refresh.

---

## 5. Triggering a Deploy

### Automatic (recommended)
Every push to the `main` branch automatically triggers a Netlify build.

### Manual
- From the Netlify dashboard: Deploys tab → Trigger deploy → Deploy site
- Or via Netlify CLI: `npx netlify-cli deploy --prod --dir=frontend/dist`

---

## 6. Local Build Verification

Before pushing, verify the production build works locally:

```bash
cd frontend
npm install
npm run build
# Check that dist/_redirects exists:
cat dist/_redirects
# Should output: /* /index.html 200
```

---

## 7. Troubleshooting

| Symptom | Fix |
|---|---|
| /vendor, /our-story return 404 | Ensure _redirects is in dist/. Re-deploy. |
| API calls fail on production | Set VITE_API_BASE_URL in Netlify env vars |
| Build fails with dependency errors | NPM_FLAGS = "--legacy-peer-deps" is already set in netlify.toml |
| Old version served after deploy | Hard-refresh the page (Ctrl+Shift+R) — index.html has no-cache headers |
