# 📘 Golf Charity Subscription Platform — Complete Project Documentation

**Version**: 1.0 | **Date**: March 29, 2026

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [Project Structure](#3-project-structure)
4. [Getting Started](#4-getting-started)
5. [Architecture Overview](#5-architecture-overview)
6. [Backend Deep Dive](#6-backend-deep-dive)
7. [Frontend Deep Dive](#7-frontend-deep-dive)
8. [Feature Breakdown](#8-feature-breakdown)
9. [Database Schema](#9-database-schema)
10. [API Reference](#10-api-reference)
11. [Security Implementation](#11-security-implementation)
12. [Environment Variables](#12-environment-variables)

---

## 1. Project Overview

### What Is This Platform?

The **Golf Charity Subscription Platform** (branded "Impact Fairway") is a subscription-driven web application where users:

1. **Subscribe** monthly (£9.99) or yearly (£99.99)
2. **Enter golf scores** in Stableford format (1–45 points)
3. **Participate in monthly prize draws** based on their scores
4. **Contribute to charity** — at least 10% of subscription goes to a chosen charity

### Core Business Flow

```
User Signs Up → Selects Charity (min 10%) → Subscribes via Stripe
→ Enters 5 Golf Scores → Scores become "numbers" for monthly draws
→ Admin runs draw → Winners matched by tier (5/4/3 matches)
→ Winners upload proof → Admin verifies → Payout marked
```

### User Roles

| Role | Access |
|------|--------|
| **Public Visitor** | Homepage, charities, draw mechanics, signup |
| **Subscriber** | Dashboard: scores, charity, draws, winnings, proof upload |
| **Admin** | Manage users, subscriptions, charities, draws, winners, reports |

---

## 2. Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 19 + Vite 8 | Single-page application |
| Routing | React Router DOM v7 | Client-side routing |
| Styling | TailwindCSS 3.4 + Custom CSS | Dark theme, utility-first |
| Backend | Express 5 (Node.js) | REST API server |
| Database | SQLite (`node:sqlite`) | Persistent storage |
| Payments | Stripe SDK v18 | Subscription billing |
| Auth | JWT + bcryptjs | Token-based, httpOnly cookies |
| Email | Nodemailer | Transactional notifications |
| Security | Helmet + CORS + Rate Limiting | HTTP security headers |

---

## 3. Project Structure

```
├── index.html                    # HTML entry point
├── package.json                  # Dependencies & scripts
├── vite.config.js                # Vite build config
├── tailwind.config.js            # Tailwind theme
├── .env / .env.local             # Environment variables
│
├── src/                          # ── FRONTEND ──
│   ├── main.jsx                  # React entry: StrictMode + AuthProvider + Router
│   ├── App.jsx                   # All route definitions
│   ├── app/routes.js             # Route path constants & role definitions
│   ├── auth/
│   │   ├── AuthProvider.jsx      # React context for global auth state
│   │   └── ProtectedRoute.jsx    # 3 guards: auth, role, subscription
│   ├── lib/apiClient.js          # Centralized HTTP client (35+ methods)
│   ├── styles/index.css          # Global CSS, fonts, animations
│   ├── components/ui/            # Button, Card, PageHeader, PlaceholderPanel
│   ├── components/navigation/    # PublicTopNav, SideNav
│   ├── layouts/                  # PublicLayout, SubscriberLayout, AdminLayout
│   └── pages/
│       ├── public/               # 9 pages (home, charities, login, signup, etc.)
│       ├── subscriber/           # 7 dashboard pages
│       ├── admin/                # 9 admin pages
│       ├── auth/                 # Auth flow pages
│       └── shared/               # Access restricted, 404
│
├── server/                       # ── BACKEND ──
│   ├── db/
│   │   ├── platform.sqlite       # SQLite database file
│   │   └── schema.sql            # Reference SQL schema
│   └── src/
│       ├── server.js             # Entry: starts Express, seeds data
│       ├── app.js                # Middleware chain, route mounting
│       ├── config/
│       │   ├── constants.js      # Plans, tiers, roles, percentages
│       │   └── env.js            # Env loader with production guards
│       ├── data/store.js         # Data layer: schema, queries, mappers
│       ├── middleware/            # requireAuth, requireRole, requireActiveSub, rateLimiter
│       ├── modules/              # Route definitions per domain
│       │   ├── auth/             # signup, login, logout, session
│       │   ├── public/           # charities, donations
│       │   ├── subscriber/       # profile, scores, charity, winners
│       │   ├── subscription/     # plans, start, cancel, renew
│       │   ├── admin/            # users, draws, charities, winners, reports
│       │   └── stripe/           # checkout, webhooks
│       └── services/             # Business logic (10 service files)
```

---

## 4. Getting Started

### Prerequisites
- **Node.js** v22+ (needed for `node:sqlite`)
- **npm** v10+

### Installation & Running

```bash
npm install

# Terminal 1: Frontend (port 5173)
npm run dev

# Terminal 2: Backend API (port 4000)
npm run dev:api

# With admin auto-seeded:
npm run dev:api:seedadmin
```

### Default Dev Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@golfcharity.local` | `AdminPass123!` |

> These are **blocked in production** by guards in `env.js`.

---

## 5. Architecture Overview

### Layered Architecture

```
┌────────────────────────────────────────────┐
│              FRONTEND (React SPA)           │
│  AuthProvider → apiClient → fetch → API     │
├────────────────────────────────────────────┤
│            MIDDLEWARE LAYER                  │
│  HTTPS → CORS → Helmet → JSON(1mb) → Cookie│
│  → requireAuth → requireRole → requireSub  │
├────────────────────────────────────────────┤
│             ROUTE MODULES                   │
│  auth | public | subscriber | admin         │
│  subscription | stripe                      │
├────────────────────────────────────────────┤
│            SERVICE LAYER                    │
│  auth | score | draw | charity | sub        │
│  winner | admin | stripe | billing | notify │
├────────────────────────────────────────────┤
│             DATA LAYER (store.js)           │
│  30+ query functions + camelCase mappers    │
├────────────────────────────────────────────┤
│             SQLite Database                 │
│  10 tables with performance indexes         │
└────────────────────────────────────────────┘
```

---

## 6. Backend Deep Dive

### 6.1 Server Startup (`server.js`)

1. Load `.env` via dotenv
2. Register global `unhandledRejection` handler
3. Create Express app
4. Optionally seed admin + demo subscriber
5. Listen on port 4000

### 6.2 Middleware Chain (`app.js`)

Applied in order: HTTPS enforcement → CORS → Helmet → Stripe raw body → JSON parser (1MB limit) → Cookie parser → Routes → Global error handler

### 6.3 Authentication System

```
Signup/Login → bcrypt verify → JWT signed → Set httpOnly cookie (maxAge = JWT TTL)
Every request → Middleware reads cookie → Verifies JWT → Loads user + subscription
→ Real-time subscription status check applied automatically
```

**Key files:** `auth.service.js` (JWT/bcrypt), `requireAuth.js`, `requireRole.js`, `requireActiveSubscription.js`, `rateLimiter.js`

### 6.4 Data Layer (`store.js` — 809 lines)

This single file:
- Creates the SQLite connection
- Defines all 10 tables via `CREATE TABLE IF NOT EXISTS`
- Creates 10 performance indexes
- Seeds default charities
- Exports 30+ query functions

Every table has a `mapXxx(row)` function converting `snake_case` DB columns to `camelCase` JS objects.

### 6.5 Service Layer Summary

| Service | Responsibility |
|---------|---------------|
| `score.service.js` | Validate (integer 1-45, no future dates), enforce 5-score rolling limit, sort |
| `draw.service.js` | Run draws (random/algorithmic), compute prize pools, publish with transaction |
| `charity.service.js` | CRUD charities, user preferences (min 10%), independent donations |
| `subscription.service.js` | Lifecycle: activate, cancel, renew, auto-lapse detection |
| `winner.service.js` | Winner records from draws, proof upload, admin review, payment |
| `admin.service.js` | Admin user/score management, aggregated reports |
| `stripe.service.js` | Checkout sessions, webhook handling, subscription sync |
| `notification.service.js` | Email via SMTP or JSON transport fallback |
| `billing.service.js` | Stripe PaymentIntent creation |
| `adminSeed.service.js` | Admin account seeding |

---

## 7. Frontend Deep Dive

### 7.1 Entry Point

```jsx
// main.jsx
<StrictMode>
  <AuthProvider>     // Global auth context
    <BrowserRouter>  // Client-side routing
      <App />        // Route definitions
    </BrowserRouter>
  </AuthProvider>
</StrictMode>
```

### 7.2 AuthProvider Context

Provides to all components: `loading`, `isAuthenticated`, `role`, `user`, `subscription`, `hasActiveSubscription`, plus `signup()`, `login()`, `clearSession()`, `refreshSession()` methods.

**Tab re-validation:** When user switches back to the tab, session is re-checked to prevent stale state.

### 7.3 Route Protection (3 Layers)

```jsx
<ProtectedRoute>                         // 1. Must be logged in
  <RoleBoundary allow={["subscriber"]}>  // 2. Must have correct role
    <SubscriptionBoundary>               // 3. Must have active subscription
      <PageComponent />
    </SubscriptionBoundary>
  </RoleBoundary>
</ProtectedRoute>
```

### 7.4 API Client (`apiClient.js`)

Centralized HTTP client:
- Base URL from `VITE_API_BASE_URL`
- `credentials: "include"` for cookie auth
- Auto JSON parsing & error handling
- 35+ typed methods for all API endpoints

### 7.5 Pages

**Public (9):** HomePage, CharitiesPage, CharityProfilePage, DrawMechanicsPage, SubscribePage, SubscribeSuccessPage, SubscribeCancelledPage, LoginPage, SignupPage

**Subscriber Dashboard (7):** Overview (4 stat cards + score table + getting started), Subscription management, Scores (add/edit), Charity preference, Participation summary, Winnings, Proof upload

**Admin Panel (5 active):** Users (with inline score/subscription editing), Draws (simulate + publish), Charities (CRUD), Winners (review + pay), Reports (4 metrics)

### 7.6 UI Components

- **`Button`** — 3 variants: `primary` (orange glow), `secondary` (dark), `ghost` (transparent)
- **`Card`** — Glass-morphic container with backdrop blur
- **`PageHeader`** — Eyebrow + h1 + description
- **`SideNav`** / **`PublicTopNav`** — Navigation components

### 7.7 Styling

- **Fonts:** Manrope (body), Space Grotesk (headings)
- **Color scheme:** Dark navy (`#071323`) with orange accent (`#e85d3a`)
- **Background:** Multi-layered radial gradients
- **Animation:** `fade-up` on sections

---

## 8. Feature Breakdown

### 8.1 Subscription Lifecycle

```
User selects plan → Stripe Checkout Session created → User pays on Stripe
→ Redirect to success page → Backend confirms & activates subscription
```

**States:** `active` → `cancellation` → `lapsed` (or `renewal` → `active`)

**Real-time check:** `applyRealtimeStatusCheck()` runs on every auth request — if renewal date has passed, auto-transitions to `lapsed`.

**Stripe webhooks handled:** `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`

### 8.2 Golf Score System

**Rules:**
- Stableford format: **whole integers 1–45**
- Max **5 scores** stored (rolling limit)
- 6th score **replaces oldest** automatically
- **Future dates rejected**
- Scores sorted **newest first**

**Implementation in `score.service.js`:**
- `validateScoreInput()` — Number range + integer + date + no-future
- `enforceRollingLimit()` — Sorts oldest-first, keeps latest 5
- `sortReverseChronological()` — By date desc, then createdAt desc

### 8.3 Monthly Draw Engine

**The most complex feature.** Steps:

1. **Participant numbers** — Each subscriber's 5 unique score values
2. **Draw generation** — Random (`Math.random`) or Algorithmic (frequency-weighted)
3. **Match evaluation** — Count intersections between participant numbers and drawn numbers
4. **Prize tiers** — 5-match (40% pool + rollover), 4-match (35%), 3-match (25%)
5. **Prize split** — Equal split among same-tier winners
6. **Jackpot rollover** — If no 5-match winner, Tier 5 pool carries to next month
7. **Publish** — Wrapped in SQLite transaction (prevents race condition on double-publish)
8. **Winner records** — Created with `pending` verification and `pending` payment

### 8.4 Winner Verification

```
Draw Published → Winner Records (pending) → Winner uploads proof
→ Admin reviews (approve/reject) → Admin marks paid
```

**Constraints:** Can't review before proof uploaded. Can't pay before approval.

### 8.5 Charity System

- Searchable/filterable directory with featured spotlight
- User preference with min 10% contribution
- Cascade-safe deletion (cleans up orphaned preferences)
- Independent donations (intent recorded)

### 8.6 Email Notifications

Sent for: subscription changes, draw results (personalized), winner alerts. Falls back to JSON transport if SMTP not configured.

### 8.7 Admin Reports

Aggregates: total users, total prize pool, per-charity contribution totals, draw statistics (total draws, participants, winners, rollover balance).

---

## 9. Database Schema

| Table | Primary Key | Key Columns |
|-------|------------|-------------|
| `users` | `id` | email (unique), password_hash, role |
| `subscriptions` | `id` | user_id (unique), plan_id, status, renewal_date |
| `scores` | `id` | user_id, score_value (INTEGER CHECK 1-45), score_date |
| `charities` | `id` | name, description, images_json, is_featured |
| `charity_preferences` | `user_id` | charity_id, contribution_percentage |
| `independent_donations` | `id` | charity_id, donor_email, amount, status |
| `draw_publications` | `id` | draw_month (unique), payload_json |
| `winner_records` | `id` | draw_id, user_id, tier, winning_amount, verification_status, payment_state |
| `kv_store` | `key` | value (used for draw rollover balance) |
| `billing_subscriptions` | `user_id` | stripe_customer_id, stripe_subscription_id, status |

**10 performance indexes** on: subscriptions(user_id, status), scores(user_id), winner_records(user_id, draw_id, draw_month), charity_preferences(charity_id), draw_publications(draw_month), etc.

---

## 10. API Reference

### Auth (`/api/auth`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/signup` | No (rate limited) | Create account |
| POST | `/login` | No (rate limited) | Login |
| POST | `/logout` | No | Clear cookie |
| GET | `/session` | Yes | Current user + subscription |

### Public (`/api/public`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/charities` | Search/filter charities |
| GET | `/charities/featured` | Featured charity |
| GET | `/charities/:id` | Charity profile |
| POST | `/charities/:id/independent-donations` | Record donation |

### Subscription (`/api/subscription`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/plans` | No | Plans with prices |
| GET | `/status` | Yes | Current status |
| POST | `/start` | Yes | Start subscription |
| POST | `/cancel` | Yes | Cancel |
| POST | `/renew` | Yes | Renew |

### Stripe (`/api/stripe`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/create-checkout-session` | Yes | Stripe checkout |
| POST | `/confirm-checkout-session` | Yes | Confirm after redirect |
| POST | `/cancel-subscription` | Yes | Cancel via Stripe |
| POST | `/webhook` | No | Stripe webhook receiver |

### Subscriber (`/api/subscriber` — requires auth + subscriber + active sub)
| Method | Path | Description |
|--------|------|-------------|
| GET/PATCH | `/profile` | View/update profile |
| GET/POST | `/scores` | List/add scores |
| PATCH | `/scores/:id` | Edit score |
| GET/PUT | `/charity-preference` | View/update charity |
| GET | `/winners` | Winning records |
| GET | `/participation-summary` | Draw participation |
| POST | `/winners/:id/proof` | Upload proof |

### Admin (`/api/admin` — requires auth + admin)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/users` | All users |
| PATCH | `/users/:id` | Edit user |
| GET/POST | `/users/:id/scores` | User scores |
| PATCH | `/users/:id/scores/:sid` | Edit score |
| PATCH | `/users/:id/subscription` | Manage sub |
| GET/POST | `/charities` | List/create |
| PUT/DELETE | `/charities/:id` | Update/delete |
| GET | `/draws` | Draw history |
| POST | `/draws/simulate` | Simulate draw |
| POST | `/draws/publish` | Publish draw |
| GET | `/winners` | All winners |
| POST | `/winners/:id/review` | Approve/reject |
| POST | `/winners/:id/payment` | Mark paid |
| GET | `/reports` | Analytics |

---

## 11. Security Implementation

| Feature | Detail | Location |
|---------|--------|----------|
| Password hashing | bcrypt, 12 salt rounds | `auth.service.js` |
| JWT cookies | httpOnly, SameSite=lax, maxAge synced to TTL | `auth.service.js` |
| HTTPS enforcement | Middleware in production | `app.js` |
| CORS whitelist | Configurable allowed origins | `app.js` |
| Helmet | Security headers | `app.js` |
| Rate limiting | Login 5/15min, Signup 10/60min | `rateLimiter.js` |
| SQL injection prevention | Parameterized queries | `store.js` |
| Body size limit | 1MB max JSON | `app.js` |
| RBAC | `requireRole()` middleware | `requireRole.js` |
| Subscription gating | `requireActiveSubscription` | middleware |
| Production guards | JWT_SECRET + admin password must change | `env.js` |
| Profile security | Current password required for changes | `subscriber.routes.js` |
| Score ownership | Scoped by userId | `score.service.js` |
| Draw publish safety | SQLite transaction prevents double-publish | `draw.service.js` |

---

## 12. Environment Variables

### Backend (`.env`)

| Variable | Default | Required |
|----------|---------|----------|
| `API_PORT` | `4000` | No |
| `CORS_ORIGIN` | `http://localhost:5173` | No |
| `JWT_SECRET` | `change-me-in-production` | **Yes in prod** |
| `JWT_TTL` | `8h` | No |
| `ADMIN_SEED_EMAIL` | `admin@golfcharity.local` | No |
| `ADMIN_SEED_PASSWORD` | `AdminPass123!` | **Yes in prod** |
| `STRIPE_SECRET_KEY` | — | For payments |
| `STRIPE_WEBHOOK_SECRET` | — | For webhooks |
| `STRIPE_PRICE_MONTHLY` | — | For checkout |
| `STRIPE_PRICE_YEARLY` | — | For checkout |
| `APP_BASE_URL` | `http://localhost:5173` | For redirects |
| `SMTP_HOST/PORT/USER/PASS/FROM` | — | For emails |

### Frontend (`.env.local`)

| Variable | Default |
|----------|---------|
| `VITE_API_BASE_URL` | `http://localhost:4000/api` |

---

## Feature → Code Mapping

| Feature | Page | API | Service | Store |
|---------|------|-----|---------|-------|
| Sign Up | `SignupPage` | `POST /auth/signup` | `auth.service` | `createSubscriber` |
| Login | `LoginPage` | `POST /auth/login` | `auth.service` | `findUserByEmail` |
| Add Score | `SubscriberScoresPage` | `POST /subscriber/scores` | `score.service` | `replaceScoresForUser` |
| Simulate Draw | `AdminDrawsPage` | `POST /admin/draws/simulate` | `draw.service` | `listActiveSubscribers` |
| Publish Draw | `AdminDrawsPage` | `POST /admin/draws/publish` | `draw.service` | `savePublishedDraw` |
| Select Charity | `SubscriberCharityPage` | `PUT /subscriber/charity-preference` | `charity.service` | `saveCharityPreference` |
| Upload Proof | `SubscriberProofUploadPage` | `POST /subscriber/winners/:id/proof` | `winner.service` | `saveWinnerRecord` |
| Review Winner | `AdminWinnersPage` | `POST /admin/winners/:id/review` | `winner.service` | `saveWinnerRecord` |
| View Reports | `AdminReportsPage` | `GET /admin/reports` | `admin.service` | Multiple queries |
| Subscribe | `SubscribePage` | `POST /stripe/create-checkout-session` | `stripe.service` | `saveBillingSubscription` |
