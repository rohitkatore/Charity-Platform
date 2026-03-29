# 🚀 Deployment Guide — Golf Charity Subscription Platform

## Deployment Requirements (from PRD)

> **PRD Section 15 — Mandatory Deliverables:**
> - Deploy to a **new Vercel account** (not personal/existing)
> - Use a **new Supabase project** (not personal/existing)
> - Environment variables must be properly configured
> - Live Website: Fully deployed, publicly accessible URL

---

## Complete Step-by-Step Deployment

### Step 1: Create Accounts

1. **Vercel** — Go to [vercel.com](https://vercel.com) → Sign up with a **new account**
   - Use your work/project email
   - Choose the "Hobby" (free) plan

2. **Supabase** — Go to [supabase.com](https://supabase.com) → Sign up with a **new account**
   - Create a new project → Choose a region close to your users
   - Set a strong database password → Save it securely
   - Note down the **Project URL** and **anon key** from Settings → API

3. **Stripe** — Go to [stripe.com](https://stripe.com)
   - You already have test keys configured in `.env`
   - For production, create live keys from Dashboard → Developers → API keys

---

### Step 2: Push Code to GitHub

```bash
# Initialize git if not already
git init
git add .
git commit -m "Initial deployment"

# Create a new GitHub repo and push
git remote add origin https://github.com/YOUR_USERNAME/golf-charity-platform.git
git branch -M main
git push -u origin main
```

> ⚠️ **IMPORTANT**: Add `.env` to `.gitignore` before pushing — never commit secrets!

Ensure your `.gitignore` includes:
```
node_modules/
dist/
.env
.env.local
server/db/platform.sqlite
```

---

### Step 3: Deploy Frontend to Vercel

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click **"Add New" → "Project"**
3. **Import** your GitHub repository
4. Vercel auto-detects Vite — confirm these settings:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

5. **Add Environment Variables** in the Vercel dashboard:

   | Variable | Value |
   |----------|-------|
   | `VITE_API_BASE_URL` | `https://your-backend-url.vercel.app/api` (or your backend URL) |
   | `VITE_STRIPE_PUBLISHABLE_KEY` | `pk_test_...` (your Stripe publishable key) |

6. Click **"Deploy"**

---

### Step 4: Deploy Backend

Since the backend is an Express server with SQLite, it needs a **persistent server** (not Vercel serverless). Here are two options:

#### Option A: Railway (Recommended for Express + SQLite)

1. Go to [railway.app](https://railway.app) → Sign up
2. Click **"New Project" → "Deploy from GitHub repo"**
3. Select your repository
4. Set the **Root Directory** to `server`
5. Set **Start Command**: `node src/server.js`
6. Add **Environment Variables**:

   | Variable | Value |
   |----------|-------|
   | `NODE_ENV` | `production` |
   | `API_PORT` | `4000` |
   | `CORS_ORIGIN` | `https://your-frontend.vercel.app` |
   | `APP_BASE_URL` | `https://your-frontend.vercel.app` |
   | `JWT_SECRET` | Generate: `openssl rand -base64 32` |
   | `JWT_TTL` | `8h` |
   | `SECURE_COOKIES` | `true` |
   | `AUTO_SEED_ADMIN` | `true` |
   | `ADMIN_SEED_EMAIL` | `admin@yourdomain.com` |
   | `ADMIN_SEED_PASSWORD` | Your strong admin password |
   | `STRIPE_SECRET_KEY` | `sk_test_...` |
   | `STRIPE_WEBHOOK_SECRET` | `whsec_...` |
   | `STRIPE_PRICE_MONTHLY` | `price_...` |
   | `STRIPE_PRICE_YEARLY` | `price_...` |
   | `STRIPE_CURRENCY` | `gbp` |

7. Deploy → Note the public URL (e.g., `https://golf-api.up.railway.app`)
8. Go back to Vercel → Update `VITE_API_BASE_URL` to point to this URL + `/api`

#### Option B: Render (Free Tier Available)

1. Go to [render.com](https://render.com) → Sign up
2. **New** → **Web Service** → Connect GitHub repo
3. Settings:
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `node src/server.js`
   - **Environment**: Node
4. Add the same environment variables as Option A
5. Deploy

---

### Step 5: Configure Stripe Webhook (Production)

1. Go to Stripe Dashboard → **Developers → Webhooks**
2. Click **"Add endpoint"**
3. **Endpoint URL**: `https://your-backend-url/api/stripe/webhook`
4. **Events to listen for**:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
5. Copy the **Signing Secret** → Set as `STRIPE_WEBHOOK_SECRET` env var on your backend

---

### Step 6: Configure CORS

After deployment, update the backend's `CORS_ORIGIN` to include your Vercel frontend URL:

```
CORS_ORIGIN=https://your-app.vercel.app
```

Also update the frontend's `VITE_API_BASE_URL`:

```
VITE_API_BASE_URL=https://your-backend-url/api
```

---

### Step 7: Create Admin Account

The admin account is auto-created on first server start when `AUTO_SEED_ADMIN=true`.

**Default credentials (development):**

| Field | Value |
|-------|-------|
| Email | `admin@golfcharity.local` |
| Password | `AdminPass123!` |

**For production**, set custom values via environment variables:

```env
AUTO_SEED_ADMIN=true
ADMIN_SEED_EMAIL=admin@yourdomain.com
ADMIN_SEED_PASSWORD=YourStrongPassword123!
```

> After the admin is created, you can set `AUTO_SEED_ADMIN=false` to disable auto-seeding.

**To login as admin:**
1. Go to `/login`
2. Enter the admin email and password
3. You'll be redirected to `/admin`

---

### Step 8: Verify Deployment

Run through this checklist:

| Test | Expected Result |
|------|----------------|
| Visit homepage | Dark themed landing page loads |
| Click "Start Subscription" | Redirects to login |
| Sign up new user | Account created, charity selected |
| Login | Redirected to `/dashboard` |
| Add 5 scores | Scores saved, displayed reverse chronological |
| Add 6th score | Oldest score replaced |
| Visit `/subscribe` | Prices shown (£9.99/month, £99.99/year) |
| Click Subscribe | Redirects to Stripe checkout |
| Login as admin | Redirected to `/admin` panel |
| Admin: Simulate draw | Draw simulation runs |
| Admin: Publish draw | Draw published, winners created |
| Visit `/draw-mechanics` | Prize pool %s displayed (40/35/25) |

---

## Environment Variables Quick Reference

### Backend (Server)

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | Yes | `production` for deployed |
| `API_PORT` | No | Default: `4000` |
| `CORS_ORIGIN` | Yes | Frontend URL |
| `JWT_SECRET` | **Yes** | Strong random string |
| `JWT_TTL` | No | Default: `8h` |
| `SECURE_COOKIES` | Yes | `true` in production |
| `AUTO_SEED_ADMIN` | Yes | `true` on first deploy |
| `ADMIN_SEED_EMAIL` | Yes | Admin login email |
| `ADMIN_SEED_PASSWORD` | Yes | Admin login password |
| `STRIPE_SECRET_KEY` | Yes | From Stripe dashboard |
| `STRIPE_WEBHOOK_SECRET` | Yes | From Stripe webhook setup |
| `STRIPE_PRICE_MONTHLY` | Yes | Stripe Price ID |
| `STRIPE_PRICE_YEARLY` | Yes | Stripe Price ID |
| `APP_BASE_URL` | Yes | Frontend URL for redirects |

### Frontend (Vercel)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_BASE_URL` | Yes | Backend API URL |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Yes | Stripe publishable key |

---

## Admin Panel Access

**The admin panel is a fully functional dashboard accessible at `/admin`.**

To provide admin credentials for evaluation:

1. Set environment variables for admin seed (see Step 7)
2. Start/restart the server with `AUTO_SEED_ADMIN=true`
3. Login at `/login` with the admin email/password
4. The system detects the `admin` role and redirects to `/admin`

**Admin features available:**
- `/admin/users` — View/edit all users, manage subscriptions, edit scores
- `/admin/draws` — Configure draw logic, run simulations, publish results
- `/admin/charities` — Add, edit, delete charity listings
- `/admin/winners` — Review proof submissions, approve/reject, mark paid
- `/admin/reports` — Analytics dashboard (users, pools, contributions, stats)

---

## Test Credentials to Provide

When submitting your project, include these credentials:

```
=== USER PANEL ===
Signup URL: https://your-app.vercel.app/signup
(Evaluator can create their own account)

=== ADMIN PANEL ===
Login URL: https://your-app.vercel.app/login
Email: admin@yourdomain.com
Password: [your admin password]
```

---

## Troubleshooting

| Issue | Solution |
|-------|---------|
| "Unable to reach API server" | Check `VITE_API_BASE_URL` points to correct backend URL |
| CORS errors | Ensure `CORS_ORIGIN` includes your frontend URL exactly |
| Stripe checkout fails | Verify `STRIPE_SECRET_KEY` and Price IDs are correct |
| Admin login fails | Ensure `AUTO_SEED_ADMIN=true` on first deploy, check credentials |
| Cookies not working | Ensure `SECURE_COOKIES=true` and using HTTPS |
| "JWT_SECRET must be configured" | Set `JWT_SECRET` to a strong random string in env vars |
