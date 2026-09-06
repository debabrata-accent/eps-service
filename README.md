# Electrical Panel Service App — MVP1

A web-based service management platform for an Electrical Panel Service Business.  
Three roles: **Factory Owner**, **Engineer**, **Customer Executive** (admin).

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + TypeScript + Tailwind CSS |
| Backend | Node.js + Express + TypeScript |
| Database | MongoDB Atlas + Mongoose |
| File Storage | Cloudinary |
| Payments | Razorpay |
| Push Notifications | Firebase Cloud Messaging (Web Push) |
| Auth | JWT (access + refresh tokens) + bcrypt |

---

## Project Structure

```
electrical-panel-service/
├── backend/          ← Node.js + Express API
├── frontend/         ← React SPA
├── shared/           ← Shared TypeScript types
└── package.json      ← Monorepo root
```

---

## Getting Started

### Prerequisites
- Node.js >= 18
- MongoDB Atlas account
- Cloudinary account
- Razorpay account (test mode)
- Firebase project (for Web Push)

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

**Backend** — copy and fill in values:
```bash
cp backend/.env.example backend/.env
```

**Frontend** — copy and fill in values:
```bash
cp frontend/.env.example frontend/.env
```

### 3. Seed the database

```bash
npm run seed
```

This creates the following test users:

| Role | Username | Password |
|---|---|---|
| Customer Executive | ce_admin_01 | Admin@1234 |
| Factory Owner | factory_owner_01 | Owner@1234 |
| Factory Owner | factory_owner_02 | Owner@1234 |
| Engineer | engineer_01 | Eng@1234 |
| Engineer | engineer_02 | Eng@1234 |

### 4. Start development servers

```bash
# Terminal 1 — Backend (port 5000)
npm run dev:backend

# Terminal 2 — Frontend (port 5173)
npm run dev:frontend
```

---

## Deployment

- **Backend**: Railway or Render — set environment variables from `.env.example`
- **Frontend**: Vercel or Netlify — set `VITE_*` environment variables in project settings

---

## Ticket Lifecycle

```
Draft → Submitted → Under Review → Cost Proposed
→ Awaiting Customer Approval → Advance Pending
→ Approved → Open for Engineer Assignment
→ [Engineer] Assigned → Visited Factory → Issue Identified
→ Solution Proposed → Issue Fixed → Completed
```

Terminal statuses: **Rejected**, **Cancelled**, **Completed**
