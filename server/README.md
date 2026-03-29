# Backend Skeleton (Node.js)

This folder contains Node.js backend modules aligned with the PRD.

Status:
- Auth and subscription lifecycle endpoints implemented
- Subscriber score management implemented (add/edit/list with rolling latest-5 behavior)
- Billing provider is intentionally isolated and unconfigured

Planned module ownership:
- `modules/public` for visitor-facing endpoints
- `modules/auth` for authentication/session endpoints
- `modules/subscriber` for subscriber route boundaries
- `modules/admin` for admin route boundaries

Local demo subscriber seeding:
- Run `npm run dev:api:seed` to start API with one seeded subscriber in memory.
- Demo credentials:
	- Email: `demo.subscriber@golfcharity.local`
	- Password: `DemoPass123!`
	- Subscription: active monthly

Notes:
- Seeded user exists only while the current API process is running (in-memory store).