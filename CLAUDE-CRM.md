# CLIENT-CRM.md — Client Portal Architecture
## Next.js CRM · Per-Client Dashboard & Authentication

---

## Overview

This is the client-facing web portal. Every client you onboard gets login credentials to this portal. It is their single source of truth — calls, leads, appointments, outreach, and reports all live here.

Clients never see VAPI, n8n, Docker, or any infrastructure. They see a clean dashboard that shows them what their AI assistant is doing for their business.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Auth | NextAuth.js (credentials provider) |
| Database | PostgreSQL (shared, `client_id` scoped) |
| Styling | Tailwind CSS |
| Components | shadcn/ui |
| Email | Resend |
| Deployment | Docker container on Hostinger VPS |
| ORM | Prisma |

---

## Authentication Architecture

### How It Works

Each client has one login. Their session is permanently bound to their `client_id`. Every database query in the portal automatically filters by that `client_id` — they can never see another client's data even if they tried.

```
Client visits portal URL
      ↓
Login page (email + password)
      ↓
NextAuth validates against clients table
      ↓
Session created: { client_id, business_name, plan }
      ↓
All pages read client_id from session
      ↓
All DB queries: WHERE client_id = session.client_id
```

### Session Object

```typescript
interface ClientSession {
  client_id: number;
  business_name: string;
  owner_email: string;
  plan: 'starter' | 'growth' | 'pro';
  vapi_phone_number: string;
}
```

### Auth Rules

- Passwords hashed with bcrypt (salt rounds: 12)
- Sessions expire after 7 days
- No password reset via email until Phase 2
- Operator admin account has separate auth — never shares client login
- Rate limit login attempts: max 5 per 15 minutes per IP

---

## Portal Structure

```
/
├── /login                    ← Public — login page
├── /dashboard                ← Overview / home
├── /calls                    ← All calls list + transcripts
│   └── /calls/[id]          ← Individual call detail + transcript
├── /leads                    ← Scraped leads for this client
│   └── /leads/[id]          ← Individual lead detail
├── /appointments             ← Booked appointments
│   └── /appointments/[id]   ← Appointment detail
├── /outreach                 ← Outreach emails sent + status
├── /reports                  ← Daily/weekly performance reports
└── /settings                 ← Client profile + preferences
```

---

## Page Specifications

### /dashboard

**Purpose:** First thing client sees after login. High-level overview.

**Widgets:**
```
┌─────────────────────────────────────────────────┐
│  Good morning, [Business Name] 👋               │
├──────────┬──────────┬──────────┬────────────────┤
│  Calls   │  Leads   │  Appts   │  Emails Sent   │
│  Today   │  This Wk │  Pending │  This Week     │
│    12    │    47    │    3     │     24         │
├──────────┴──────────┴──────────┴────────────────┤
│  Recent Calls (last 5)                          │
│  ┌─────────────────────────────────────────┐   │
│  │ +1-555-1234  •  2m 14s  •  Appt booked │   │
│  │ +1-555-5678  •  1m 02s  •  Callback    │   │
│  └─────────────────────────────────────────┘   │
├─────────────────────────────────────────────────┤
│  Upcoming Appointments (next 3)                 │
└─────────────────────────────────────────────────┘
```

---

### /calls

**Purpose:** Full call history with transcripts.

**Table columns:** Date/Time, Caller Number, Duration, Outcome, Sentiment

**Call outcomes (enum):**
```
appointment_booked
callback_requested
not_interested
wrong_number
voicemail
no_answer
new_lead
```

**Individual call page `/calls/[id]`:**
- Full transcript (formatted, speaker-labeled)
- AI-generated summary
- Caller info (if identified as lead)
- Outcome tag
- Link to appointment (if booked)

---

### /leads

**Purpose:** All leads scraped for this client.

**Table columns:** Business Name, Email, Location, Industry, ICP Score, Status, Date Added

**Lead statuses:**
```
new
contacted
follow_up_1
follow_up_2
sequence_complete
converted
not_qualified
```

**Filters:** Status, Industry, Date Range, ICP Score threshold

**Individual lead page `/leads/[id]`:**
- Full lead profile
- Outreach history (emails sent, dates)
- Call history (if caller matches lead)
- Notes field (client can add manual notes)

---

### /appointments

**Purpose:** All appointments booked by the AI agent.

**Table columns:** Caller Name, Phone, Date/Time, Status, Notes

**Appointment statuses:**
```
pending_confirmation
confirmed
completed
cancelled
no_show
```

**Actions client can take:**
- Mark as confirmed
- Mark as completed / no-show
- Add internal notes
- (Phase 2) Sync to Google Calendar

---

### /outreach

**Purpose:** All outreach emails sent on behalf of this client.

**Table columns:** Lead Name, Subject, Sent At, Status, Follow-up #

**Email statuses:**
```
sent
delivered
opened
replied
bounced
failed
```

---

### /reports

**Purpose:** Performance summaries — daily and weekly.

**Report components:**
- Calls handled (count + trend vs last period)
- Appointments booked (count + conversion rate)
- Leads added (count)
- Outreach sent (count)
- Top call outcomes (pie chart)
- Calls by day of week (bar chart)

**Export:** Download as PDF (Phase 2)

---

### /settings

**Purpose:** Client profile and preferences.

**Editable fields:**
- Business name display
- Owner name
- Notification email
- Report delivery time preference
- (Phase 2) Google Calendar connection

**Read-only fields (operator managed):**
- VAPI phone number
- Plan type
- Account status

---

## API Routes (Next.js)

All routes protected by NextAuth session middleware. All queries scoped to `session.client_id`.

```
GET  /api/dashboard/stats        → Summary counts for dashboard
GET  /api/calls                  → Paginated call list
GET  /api/calls/[id]             → Single call detail
GET  /api/leads                  → Paginated lead list
GET  /api/leads/[id]             → Single lead detail
PUT  /api/leads/[id]/notes       → Update lead notes
GET  /api/appointments           → Appointment list
PUT  /api/appointments/[id]      → Update appointment status
GET  /api/outreach               → Outreach history
GET  /api/reports/daily          → Daily report data
GET  /api/reports/weekly         → Weekly report data
PUT  /api/settings               → Update client settings
```

**Standard API response format:**

```typescript
// Success
{ success: true, data: T, meta?: { total, page, limit } }

// Error
{ success: false, error: string, code: string }
```

---

## Middleware

```typescript
// middleware.ts — runs on every request
export { default } from "next-auth/middleware"

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/calls/:path*",
    "/leads/:path*",
    "/appointments/:path*",
    "/outreach/:path*",
    "/reports/:path*",
    "/settings/:path*",
    "/api/:path*"
  ]
}
```

---

## Database Queries — Safety Pattern

Every query must follow this pattern. Never query without `client_id`:

```typescript
// ✅ CORRECT
const calls = await prisma.calls.findMany({
  where: {
    client_id: session.client_id,  // Always first
    created_at: { gte: startDate }
  },
  orderBy: { created_at: 'desc' },
  take: 20
});

// ❌ WRONG — never query without client_id
const calls = await prisma.calls.findMany({
  where: { created_at: { gte: startDate } }
});
```

---

## UI Design Principles

- Clean, minimal — business owners not developers
- Mobile responsive — owners check from their phone
- Fast load — dashboard data in under 1 second
- No jargon — "AI Agent" not "VAPI instance"
- Color-coded outcomes — green (booked), yellow (callback), red (not interested)
- Notifications badge on nav when new calls come in (Phase 2 — WebSocket)

---

## Admin Portal (Operator Only)

Separate from client portal. Lives at `/admin` — completely separate auth.

**Admin capabilities:**
- View all clients + status
- Onboard new client (triggers WF-02)
- Suspend / reactivate client account
- View all automation run logs
- Manually trigger scraper per client
- View system health (container status)
- Billing overview per client

**Admin auth:** Separate admin credentials table — never mixed with client logins.

---

## Docker Deployment

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json .
RUN npm ci --production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

```yaml
# docker-compose.yml (excerpt)
pa-crm:
  build: ./crm
  ports:
    - "3000:3000"
  environment:
    - DATABASE_URL=${DATABASE_URL}
    - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
    - NEXTAUTH_URL=${NEXTAUTH_URL}
    - RESEND_API_KEY=${RESEND_API_KEY}
  depends_on:
    - pa-database
  restart: unless-stopped
```

---

## Phase Rollout

### Phase 1 (Launch)
- Login + session
- Dashboard with live stats
- Calls list + transcript view
- Appointments list

### Phase 2
- Leads list + outreach history
- Reports page with charts
- Google Calendar sync toggle
- PDF report export

### Phase 3
- Real-time notifications (WebSocket)
- Client self-service settings
- Mobile app (React Native)

---

## Disallowed Behavior

- Never return data without `client_id` filter
- Never expose other clients' data in any API response
- Never store passwords in plaintext
- Never expose internal IDs (VAPI agent ID, Docker container names) to client
- Never allow client to modify their own `plan` or `status` fields

*Last updated: 2026-02-27*
