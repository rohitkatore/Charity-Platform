# Golf Charity Subscription Platform - QA Testing Playbook

## 1. Purpose
This document defines a complete functional and regression test plan for the current implementation of the Golf Charity Subscription Platform.

It is written so a QA team can run tests end-to-end without assumptions and report objective pass/fail outcomes.

## 2. Scope
In scope:
- Public pages and visitor flows
- Authentication (signup, login, logout, session)
- Subscription lifecycle (start, renew, cancel, status)
- Subscriber restricted features
- Charity browsing and independent donation intent recording
- Draw simulation and publication
- Winner proof upload, admin review, and payment marking
- Admin user/charity/report workflows
- Role access control and active-subscription gating
- Data persistence across backend restarts (SQLite)
- API-level validation and error handling

Out of scope for strict pass criteria:
- Real payment capture/charge execution (intent wiring exists; actual payment execution is not completed)
- Real SMTP inbox delivery proof unless SMTP is configured
- Deployment/infrastructure checks outside local environment

## 3. Current Tech and Runtime
Frontend:
- React + Vite

Backend:
- Node.js + Express
- JWT cookie authentication
- SQLite persistence using node:sqlite

Default local ports:
- Frontend: 5173 (or next available Vite port)
- Backend API: 4000

## 4. Pre-Test Setup
### 4.1 Required software
- Node.js 20+ recommended
- npm
- Modern browser (Chrome/Edge)

### 4.2 Install dependencies
Run in workspace root:

npm install

### 4.3 Start backend
Run in workspace root:

npm run dev:api

Expected console line:
- API listening on http://localhost:4000

### 4.4 Start frontend
Open second terminal in workspace root:

npm run dev

Expected console line:
- Local: http://localhost:5173 (or similar)

### 4.5 Health check
Open in browser or API client:
- GET http://localhost:4000/api/health

Expected:
- Status 200
- Body contains {"ok": true}

## 5. Test Accounts and Data
### 5.1 Admin account
By default in development, admin auto-seeding is enabled.

Default admin credentials:
- Email: admin@golfcharity.local
- Password: AdminPass123!

### 5.2 Subscriber account
Create during signup tests, example:
- Email: qa.subscriber1@golfcharity.local
- Password: QaPass123!

### 5.3 Existing charities
Two default charities should exist at minimum:
- Hope Links Initiative
- Youth Fairway Foundation

## 6. Test Execution Rules
- Capture screenshot for each failed step.
- Record API request and response for backend failures.
- Do not skip negative tests.
- For each case, record: Result (Pass/Fail), Actual Output, Evidence Link/Screenshot Name, Build/Commit.

## 7. Functional Test Cases

### A. Smoke and Availability
TC-A-001 Backend health endpoint
- Steps:
1. Start backend.
2. Call GET /api/health.
- Expected:
1. 200 OK.
2. Response has ok true.

TC-A-002 Public charities endpoint
- Steps:
1. Call GET /api/public/charities.
- Expected:
1. 200 OK.
2. charities array exists.
3. At least 2 charities available.

TC-A-003 Frontend load
- Steps:
1. Open frontend URL.
2. Navigate home, charities, login, signup pages.
- Expected:
1. Pages render without runtime error.
2. No blocking console errors.

### B. Authentication and Session
TC-B-001 Signup success
- Steps:
1. Open signup page.
2. Enter new email, valid password (>=8 chars), select charity, contribution >=10, choose plan.
3. Submit.
- Expected:
1. Account created.
2. Session cookie set.
3. User is treated as authenticated.
4. Subscription start flow runs and user can enter subscriber area.

TC-B-002 Signup validation required fields
- Steps:
1. Submit signup form with missing email/password/charity/contribution.
- Expected:
1. Validation error shown.
2. API returns 400 with clear message.

TC-B-003 Signup duplicate email
- Steps:
1. Signup once with email.
2. Signup again using same email.
- Expected:
1. API returns 409.
2. Message indicates account already exists.

TC-B-004 Login success subscriber
- Steps:
1. Login with created subscriber credentials.
- Expected:
1. API returns user role subscriber.
2. Session endpoint returns authenticated user.

TC-B-005 Login invalid credentials
- Steps:
1. Login with wrong password.
- Expected:
1. 401 Unauthorized.
2. Error Invalid credentials.

TC-B-006 Admin login success
- Steps:
1. Login with admin@golfcharity.local and AdminPass123!.
- Expected:
1. 200 success.
2. Admin route access granted.

TC-B-007 Logout
- Steps:
1. While logged in, trigger logout.
2. Call /api/auth/session.
- Expected:
1. Logout returns 204.
2. Session call returns 401.

### C. Subscription Lifecycle
TC-C-001 Plan list
- Steps:
1. Call GET /api/subscription/plans.
- Expected:
1. monthly and yearly plans returned.

TC-C-002 Start subscription success
- Steps:
1. Authenticated subscriber calls POST /api/subscription/start with monthly.
- Expected:
1. 201 response.
2. subscription status active.
3. billing object returned.
4. billing provider is stripe or stripe-dev-fallback depending on key config.

TC-C-003 Start subscription invalid plan
- Steps:
1. Start with invalid planId.
- Expected:
1. 400 response.
2. Message indicates valid plan required.

TC-C-004 Cancel subscription
- Steps:
1. Authenticated subscriber calls cancel.
- Expected:
1. status becomes cancellation.
2. cancelledAt is populated.

TC-C-005 Renew subscription
- Steps:
1. Authenticated subscriber calls renew.
- Expected:
1. status transitions to renewal then becomes active after status check logic.
2. renewalDate moves forward by plan cycle.

TC-C-006 Subscription-required access blocked
- Steps:
1. Use subscriber with non-active status.
2. Access subscriber restricted endpoint or dashboard.
- Expected:
1. API 403 with active subscription required.
2. UI redirects to access restricted screen.

### D. Subscriber Features
TC-D-001 Profile fetch
- Steps:
1. GET /api/subscriber/profile as active subscriber.
- Expected:
1. id/email/role returned.

TC-D-002 Profile update email
- Steps:
1. PATCH /api/subscriber/profile with new email.
- Expected:
1. Email updates successfully.

TC-D-003 Profile update password validation
- Steps:
1. PATCH profile with password shorter than 8.
- Expected:
1. 400 response with password length error.

TC-D-004 Charity preference fetch
- Steps:
1. GET /api/subscriber/charity-preference.
- Expected:
1. preference object returned.

TC-D-005 Charity preference update success
- Steps:
1. PUT /api/subscriber/charity-preference with valid charity and percentage >=10.
- Expected:
1. preference updated.

TC-D-006 Charity preference invalid percentage
- Steps:
1. Set contribution below 10.
- Expected:
1. 400 response indicating minimum 10%.

TC-D-007 Add score success
- Steps:
1. POST /api/subscriber/scores with score 1-45 and valid date.
- Expected:
1. score list returned sorted newest first.

TC-D-008 Score validation range
- Steps:
1. Add score 0 or 46.
- Expected:
1. 400 response with range validation message.

TC-D-009 Score validation date
- Steps:
1. Add score with invalid date.
- Expected:
1. 400 response with date validation message.

TC-D-010 Rolling score limit
- Steps:
1. Add 6 valid scores.
2. Fetch scores.
- Expected:
1. Exactly latest 5 retained.
2. Oldest entry removed.

TC-D-011 Edit existing score
- Steps:
1. PATCH valid scoreId with new valid value/date.
- Expected:
1. Score updated.

TC-D-012 Edit missing score
- Steps:
1. PATCH non-existent scoreId.
- Expected:
1. 404 Score not found.

TC-D-013 Participation summary
- Steps:
1. GET /api/subscriber/participation-summary.
- Expected:
1. drawsEntered count present.
2. enteredMonths list present.
3. upcomingDraws list present.

TC-D-014 Subscriber winners list
- Steps:
1. GET /api/subscriber/winners.
- Expected:
1. Returns winner records for the subscriber only.

TC-D-015 Upload proof success
- Preconditions:
1. Subscriber has winner record.
- Steps:
1. POST /api/subscriber/winners/:winnerId/proof with proofScreenshot text.
- Expected:
1. verificationStatus becomes pending.
2. proofUploadedAt populated.

TC-D-016 Upload proof validation
- Steps:
1. Submit empty proofScreenshot.
- Expected:
1. 400 Proof screenshot is required.

### E. Public Charity and Donation
TC-E-001 Charity search
- Steps:
1. GET /api/public/charities?search=Hope.
- Expected:
1. Result filtered by name/description.

TC-E-002 Charity featured filter
- Steps:
1. GET with featured=featured.
2. GET with featured=non-featured.
- Expected:
1. Correct filter behavior.

TC-E-003 Featured charity endpoint
- Steps:
1. GET /api/public/charities/featured.
- Expected:
1. One featured charity or null if none.

TC-E-004 Charity profile endpoint
- Steps:
1. GET charity by valid id.
2. GET charity by invalid id.
- Expected:
1. Valid call returns profile.
2. Invalid call returns 404.

TC-E-005 Independent donation intent success
- Steps:
1. POST /api/public/charities/:id/independent-donations with amount > 0.
- Expected:
1. 201 created.
2. donation object returned.
3. note indicates intent recorded.

TC-E-006 Independent donation invalid amount
- Steps:
1. Submit amount 0 or negative.
- Expected:
1. 400 Donation amount must be greater than 0.

### F. Draw and Winner Workflow (Admin)
TC-F-001 Simulate draw random mode
- Steps:
1. POST /api/admin/draws/simulate with drawMonth and logicMode random.
- Expected:
1. status simulation.
2. drawNumbers length is 5 unique values.
3. prizePool object present.

TC-F-002 Simulate draw algorithmic mode
- Steps:
1. Simulate with logicMode algorithmic and algorithmWeight most-frequent.
2. Simulate with least-frequent.
- Expected:
1. Both return valid draw output.

TC-F-003 Simulate draw input validation
- Steps:
1. Use malformed drawMonth.
- Expected:
1. 400 drawMonth format error.

TC-F-004 Publish draw success
- Steps:
1. POST /api/admin/draws/publish for a new month.
- Expected:
1. 201 created.
2. status published.
3. draw stored in history.
4. winner records generated for qualifying tiers.

TC-F-005 Prevent duplicate publication same month
- Steps:
1. Publish same drawMonth again.
- Expected:
1. 409 Draw already published for this month.

TC-F-006 Eligibility gate for participation
- Steps:
1. Ensure one active subscriber has fewer than 5 scores.
2. Publish draw.
- Expected:
1. That subscriber is not in participants.

TC-F-007 Draw history
- Steps:
1. GET /api/admin/draws.
- Expected:
1. Published draws returned in chronological list.

TC-F-008 Winner list admin
- Steps:
1. GET /api/admin/winners.
- Expected:
1. Winner records available with verification and payment states.

TC-F-009 Review winner proof approved
- Preconditions:
1. Winner proof uploaded.
- Steps:
1. POST /api/admin/winners/:winnerId/review with decision approved.
- Expected:
1. verificationStatus approved.

TC-F-010 Review winner proof rejected
- Steps:
1. Review with decision rejected and note.
- Expected:
1. verificationStatus rejected.
2. payment remains pending.

TC-F-011 Review before proof upload
- Steps:
1. Review winner with no proof.
- Expected:
1. 400 Cannot review winner before proof upload.

TC-F-012 Mark winner paid success
- Preconditions:
1. Winner is approved.
- Steps:
1. POST /api/admin/winners/:winnerId/payment state paid.
- Expected:
1. paymentState becomes paid.

TC-F-013 Mark winner paid without approval
- Steps:
1. Try payment for pending/rejected winner.
- Expected:
1. 400 Winner must be approved before payment can be marked paid.

### G. Admin User and Charity Management
TC-G-001 Admin users list
- Steps:
1. GET /api/admin/users.
- Expected:
1. users array with subscription and scoreCount fields.

TC-G-002 Admin update user email
- Steps:
1. PATCH /api/admin/users/:userId with valid new email.
- Expected:
1. user email updated.

TC-G-003 Admin update user duplicate email
- Steps:
1. Attempt duplicate email update.
- Expected:
1. 409 Email already in use.

TC-G-004 Admin list user scores
- Steps:
1. GET /api/admin/users/:userId/scores.
- Expected:
1. Sorted scores returned.

TC-G-005 Admin add/edit user score
- Steps:
1. POST new score.
2. PATCH existing score.
- Expected:
1. Successful updates and validations same as subscriber flow.

TC-G-006 Admin update subscription
- Steps:
1. PATCH /api/admin/users/:userId/subscription with status active/cancellation/lapsed/renewal.
- Expected:
1. Subscription updated.

TC-G-007 Admin subscription invalid status
- Steps:
1. Send unsupported status.
- Expected:
1. 400 Invalid subscription status.

TC-G-008 Admin charities list
- Steps:
1. GET /api/admin/charities.
- Expected:
1. Charities listed with filters supported.

TC-G-009 Admin create charity
- Steps:
1. POST charity with name, description, optional arrays, isFeatured.
- Expected:
1. 201 with new charity.

TC-G-010 Admin update charity
- Steps:
1. PUT existing charity.
- Expected:
1. Updated charity returned.

TC-G-011 Admin delete charity
- Steps:
1. DELETE existing charity.
- Expected:
1. 204 no content.

TC-G-012 Admin charity validations
- Steps:
1. Create/update without name or description.
- Expected:
1. 400 Charity name and description are required.

### H. Reports and Aggregation
TC-H-001 Admin reports endpoint
- Steps:
1. GET /api/admin/reports.
- Expected:
1. report object includes totalUsers, totalPrizePool, charityContributionTotals, drawStatistics.

TC-H-002 Charity contribution totals include preferences and independent donations
- Steps:
1. Ensure at least one subscriber preference exists.
2. Record one independent donation.
3. Fetch report.
- Expected:
1. charityContributionTotals reflect both contribution sources.

TC-H-003 Draw statistics correctness
- Steps:
1. Publish draws with participants and winners.
2. Fetch report.
- Expected:
1. totalDraws, totalParticipants, totalWinners, rolloverBalanceCurrent are consistent with draw history.

### I. Access Control and Security Behavior
TC-I-001 Unauthenticated access blocked
- Steps:
1. Call protected subscriber/admin endpoint without cookie.
- Expected:
1. 401 Authentication required.

TC-I-002 Subscriber cannot access admin routes
- Steps:
1. Login as subscriber.
2. Call /api/admin/users.
- Expected:
1. 403 Role not permitted.

TC-I-003 Admin cannot access subscriber-only restricted flow
- Steps:
1. Login as admin.
2. Attempt subscriber restricted route.
- Expected:
1. Access blocked by role boundary.

TC-I-004 Invalid or expired token
- Steps:
1. Send invalid auth cookie.
- Expected:
1. 401 Invalid or expired authentication.

TC-I-005 CORS behavior
- Steps:
1. Call API from allowed local origin.
2. Call API from disallowed custom origin.
- Expected:
1. Allowed origin succeeds.
2. Disallowed origin is rejected.

TC-I-006 HTTPS enforcement toggle
- Steps:
1. Set ENFORCE_HTTPS=true in local env.
2. Call API over http.
- Expected:
1. 403 HTTPS is required.

### J. Persistence and Restart
TC-J-001 Data persistence across backend restart
- Steps:
1. Create user, scores, charity preference, and subscription.
2. Stop backend.
3. Start backend again.
4. Fetch same entities.
- Expected:
1. Data remains present (SQLite persisted file).

TC-J-002 Default charity reseed fallback
- Steps:
1. Remove all charities via admin API.
2. Trigger public charities listing.
- Expected:
1. Default charities are reseeded if table becomes empty.

### K. Billing and Notification Integration Checks
TC-K-001 Billing fallback mode
- Preconditions:
1. STRIPE_SECRET_KEY not set.
- Steps:
1. Start subscription.
- Expected:
1. billing.provider is stripe-dev-fallback.

TC-K-002 Stripe mode smoke
- Preconditions:
1. Valid STRIPE_SECRET_KEY set.
- Steps:
1. Start subscription.
- Expected:
1. billing.provider is stripe.
2. billing includes id and clientSecret.

TC-K-003 System update notifications (non-blocking)
- Steps:
1. Start, cancel, and renew subscription.
2. Publish draw.
- Expected:
1. Primary API action succeeds regardless of mail transport.
2. No hard failure if email transport cannot deliver.

## 8. UI Route Coverage Checklist
Public routes:
- /
- /charities
- /charities/:charityId
- /draw-mechanics
- /subscribe
- /login
- /signup
- /access-restricted

Subscriber routes (active subscriber required):
- /dashboard
- /dashboard/subscription
- /dashboard/scores
- /dashboard/charity
- /dashboard/participation
- /dashboard/winnings
- /dashboard/winnings/proof-upload

Admin routes:
- /admin/users
- /admin/draws
- /admin/charities
- /admin/winners
- /admin/reports

## 9. Non-Active or Placeholder Screens to Track Separately
The following files exist but are not part of active routing and should be tracked as informational only unless product asks to activate them:
- AdminHomePage.jsx
- AdminSubscriptionsPage.jsx
- AdminDrawSimulationPage.jsx
- AdminDrawResultsPage.jsx

## 10. Suggested Test Run Order
1. Smoke and setup validation (A)
2. Public flow (E)
3. Auth flow (B)
4. Subscriber flow (C, D)
5. Admin flow (F, G, H)
6. Security/access tests (I)
7. Persistence/integration tests (J, K)

## 11. Defect Report Template
Use this format for each defect:
- Defect ID:
- Test Case ID:
- Environment:
- Preconditions:
- Steps to Reproduce:
- Expected Result:
- Actual Result:
- Severity: Blocker / Critical / Major / Minor
- Evidence: screenshot/video/request-response logs
- Notes:

## 12. Exit Criteria
Testing cycle can be signed off only when:
- All Blocker and Critical defects are closed.
- All must-pass functional cases in sections A through I are passing.
- Persistence check J-001 is passing.
- Any known non-implemented/out-of-scope item is documented and approved.
