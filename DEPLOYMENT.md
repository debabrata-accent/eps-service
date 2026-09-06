# Deployment Guide — Path B

**Architecture:**
- **Frontend** (React) → Hostinger (static files)
- **Backend** (Node/Express) → Railway *(free tier)* — Render is an alternative
- **Database** → MongoDB Atlas *(free tier)*
- **Files** → Cloudinary *(free tier)*
- **Payments** → Razorpay
- **Push** → Firebase Cloud Messaging

Do the steps in order. Each service is free to start.

---

## STEP 1 — Push the code to GitHub

Railway and Hostinger both deploy from Git, so the code needs to be on GitHub first.

```bash
cd electrical-panel-service
git init
git add .
git commit -m "Initial commit — EPS service app"
```

Create an empty repo on github.com (e.g. `eps-service`), then:

```bash
git remote add origin https://github.com/<your-username>/eps-service.git
git branch -M main
git push -u origin main
```

> `.env` files are gitignored, so no secrets get pushed. Good.

---

## STEP 2 — MongoDB Atlas (database)

1. Go to https://www.mongodb.com/cloud/atlas → sign up (free).
2. Create a **free M0 cluster** (any region near India, e.g. Mumbai).
3. **Database Access** → Add a database user (username + password). Save these.
4. **Network Access** → Add IP → **Allow access from anywhere** (`0.0.0.0/0`).
   *(Railway/Render use dynamic IPs, so this is required.)*
5. **Connect → Drivers** → copy the connection string. It looks like:
   ```
   mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Add a database name before the `?`:
   ```
   mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/eps-service?retryWrites=true&w=majority
   ```
   Keep this — it's your `MONGODB_URI`.

---

## STEP 3 — Cloudinary (file uploads)

1. Sign up at https://cloudinary.com (free).
2. Dashboard → copy **Cloud Name**, **API Key**, **API Secret**.
   These become `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.

---

## STEP 4 — Deploy the Backend on Railway

1. Go to https://railway.app → sign in with GitHub.
2. **New Project → Deploy from GitHub repo** → select `eps-service`.
3. Railway detects `railway.json` and builds the backend automatically.
4. Open the service → **Variables** tab → add:

   | Variable | Value |
   |---|---|
   | `NODE_ENV` | `production` |
   | `MONGODB_URI` | *(from Step 2)* |
   | `JWT_ACCESS_SECRET` | *(a long random string)* |
   | `JWT_REFRESH_SECRET` | *(a different long random string)* |
   | `CLIENT_URL` | `https://yourdomain.com` *(your Hostinger site URL — fill after Step 5)* |
   | `CLOUDINARY_CLOUD_NAME` | *(from Step 3)* |
   | `CLOUDINARY_API_KEY` | *(from Step 3)* |
   | `CLOUDINARY_API_SECRET` | *(from Step 3)* |
   | `RAZORPAY_KEY_ID` | *(from Step 7)* |
   | `RAZORPAY_KEY_SECRET` | *(from Step 7)* |
   | `RAZORPAY_WEBHOOK_SECRET` | *(from Step 7)* |
   | `FIREBASE_SERVICE_ACCOUNT_JSON` | *(from Step 8, one line)* |

   > Generate a secret quickly: run `openssl rand -hex 32` in a terminal.

5. **Settings → Networking → Generate Domain**. You'll get something like
   `https://eps-service-production.up.railway.app`.
   This is your **backend URL**. Test it: open `<backend-url>/health` → should return `{"status":"ok"}`.

6. **Seed the users** (one-time): Railway → your service → open a shell (or use the
   "Deploy Logs" run command) and run:
   ```
   npm run seed:prod --workspace=backend
   ```
   This creates the 5 test users in your Atlas database.

---

## STEP 5 — Deploy the Frontend on Hostinger

The frontend must be **built** with the backend URL baked in, then uploaded.

### 5a. Build locally with the production API URL

```bash
cd frontend
# Point at your Railway backend from Step 4 (note the /api suffix)
echo "VITE_API_BASE_URL=https://eps-service-production.up.railway.app/api" > .env.production
npm run build
```

This produces `frontend/dist/` containing `index.html`, `assets/`, and `.htaccess`.

### 5b. Upload to Hostinger

**Option 1 — Git deploy (Hostinger hPanel):**
1. hPanel → **Websites** → your site → **Advanced → Git**.
2. Create a repository pointing at your GitHub repo, branch `main`.
3. Set the deploy path to `public_html`.
4. Because Hostinger deploys the *repo*, not a build, the simplest reliable route is
   **Option 2** below (upload the built `dist/`). Hostinger's Git deploy does not run
   `npm build` on shared hosting.

**Option 2 — Upload built files (recommended for shared hosting):**
1. hPanel → **File Manager** → open `public_html`.
2. Delete any default files there.
3. Upload **everything inside `frontend/dist/`** (not the folder itself — its contents)
   into `public_html`, including the hidden `.htaccess`.
   *(In File Manager, enable "show hidden files" to see `.htaccess`.)*
4. Visit your domain — the login page should load.

> Whenever you change the frontend: re-run `npm run build` and re-upload `dist/` contents.

### 5c. Point the backend at your real domain

Go back to Railway → Variables → set `CLIENT_URL` to your Hostinger domain
(e.g. `https://yourdomain.com`, no trailing slash). Railway redeploys automatically.

---

## STEP 6 — Verify

1. Open `https://yourdomain.com` → login screen loads.
2. Log in as `ce_admin_01` / `Admin@1234`.
3. If login works and stays logged in, cross-domain auth + CORS are correct.

---

## STEP 7 — Razorpay (payments) — when ready

1. Sign up at https://razorpay.com, complete KYC for live mode (test mode works immediately).
2. **Settings → API Keys** → generate Key ID + Key Secret → set in Railway variables.
3. Also set `VITE_RAZORPAY_KEY_ID` in `frontend/.env.production`, rebuild, re-upload.
4. **Settings → Webhooks** → add webhook:
   - URL: `https://<your-backend>.up.railway.app/api/payments/webhook`
   - Secret: any string → also set as `RAZORPAY_WEBHOOK_SECRET` in Railway
   - Active event: `payment.captured`

---

## STEP 8 — Firebase (push notifications) — when ready

1. Create a project at https://console.firebase.google.com.
2. **Project Settings → Service accounts → Generate new private key** → download JSON.
   Paste its entire contents (one line) as `FIREBASE_SERVICE_ACCOUNT_JSON` in Railway.
3. **Project Settings → General → Your apps → Web app** → copy the config values into
   `frontend/.env.production` (`VITE_FIREBASE_*`), and into
   `frontend/public/firebase-messaging-sw.js` (replace the `REPLACE_WITH_*` placeholders).
4. **Cloud Messaging → Web Push certificates** → generate key pair →
   set `VITE_FIREBASE_VAPID_KEY`. Rebuild + re-upload frontend.

---

## Costs summary
- MongoDB Atlas M0, Railway free tier, Cloudinary free, Firebase free → **₹0 to start.**
- Razorpay charges a per-transaction fee only (no monthly cost).
- Railway free tier sleeps after inactivity; upgrade (~$5/mo) for always-on when you go live.

---

## Redeploy cheatsheet
- **Backend change:** `git push` → Railway auto-redeploys.
- **Frontend change:** `cd frontend && npm run build` → re-upload `dist/` contents to `public_html`.
