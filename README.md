# INDEX MATRIX

Enterprise-Grade SEO URL Intelligence, Google Search Console Integration & Capability-Aware Indexing Platform.

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)]()
[![Tests](https://img.shields.io/badge/tests-29%20passed-brightgreen)]()
[![License](https://img.shields.io/badge/license-MIT-blue)]()

---

## 1. Overview & Vision
**INDEX MATRIX** is an enterprise full-stack SaaS platform built from scratch for technical SEO agencies, site owners, and growth engineers. It combines deterministic server-side URL accessibility auditing with official Google Search Console (GSC) synchronization, XML sitemap extraction, and auditable credit-based billing.

### Core Architecture Highlights
- **SSRF-Hardened Technical Analyzer**: DNS resolution firewall rejects RFC 1918 private subnets, cloud metadata targets (`169.254.169.254`), and tracks up to 5 multi-hop 301/302 redirects with per-hop validation.
- **Accurate Property Matching**: Official GSC matching rules support both Domain properties (`sc-domain:example.com` matching root and all subdomains across protocols) and URL-Prefix properties (`https://example.com/path/`).
- **Capability-Aware Indexing Engine**: Adheres strictly to Google guidelines by reserving direct Google Indexing API calls for eligible `JobPosting` and `BroadcastEvent` structured data schemas, while guiding standard pages to official GSC URL Inspection and XML Sitemap discovery.
- **Double-Entry Credit Ledger**: ACID database transactions guarantee atomic deductions and prevent double charging on network retries. System Owner possesses `creditMode: UNLIMITED`.
- **Public REST API**: Versioned endpoints (`/api/v1/*`) secured via SHA-256 hashed API keys.

---

## 2. Directory Structure

```
c:\Users\Aditi\baby tool\
├── src/
│   ├── app/
│   │   ├── (auth)/                # Login, Register, Logout
│   │   ├── (marketing)/           # Features, How It Works, Pricing, Docs, FAQ, Contact, Privacy, Terms, Refund
│   │   ├── (dashboard)/           # Workspace Overview, Projects, URLs, Bulk Import, GSC, Sitemaps, Jobs, Monitoring, Credits, Payments, API Keys, Settings
│   │   │   └── admin/             # Owner Control Center: Customers, Credit Controls, Audit Logs, Settings
│   │   ├── api/                   # Server-side REST Endpoints (Auth, URLs, Google, Sitemaps, Credits, Payments, Admin)
│   │   │   └── v1/                # Public Versioned REST API with API Key Guard
│   │   ├── layout.tsx             # Root layout with Inter typography and dark theme
│   │   ├── page.tsx               # High-converting Marketing Homepage with Live URL Auditor
│   │   └── globals.css            # Tailored dark color tokens and glassmorphism utilities
│   ├── lib/
│   │   ├── db.ts                  # Prisma Client singleton
│   │   ├── crypto.ts              # AES-256-GCM token encryption & SHA-256 key hashing
│   │   ├── auth.ts                # Session JWT tokens, password hashing, role-based guards
│   │   ├── ssrf.ts                # SSRF firewall (DNS checking, IP range allowlisting)
│   │   ├── analyzer.ts            # Deep technical SEO URL auditor
│   │   ├── property-matcher.ts    # Google Search Console property matching engine
│   │   ├── indexing-eligibility.ts# Google Indexing API capability validator
│   │   ├── google-client.ts       # Google OAuth 2.0 & URL Inspection API client
│   │   ├── credit-ledger.ts       # Atomic credit engine with owner unlimited bypass
│   │   ├── queue.ts               # BullMQ worker queue with resilient in-memory fallback
│   │   ├── payments.ts            # Stripe, Razorpay & Sandbox payment abstraction
│   │   ├── sitemap-parser.ts      # Streaming XML sitemap & index parser
│   │   └── api-key-auth.ts        # API Key hash validator & usage recorder
│   └── components/
│       └── layout/                # Responsive Navbar, Footer, Sidebar, DashboardHeader
├── prisma/
│   ├── schema.prisma              # PostgreSQL production schema (21 models)
│   └── schema.sqlite.prisma       # SQLite local turnkey schema
├── scripts/
│   ├── seed.js                    # Database seed script for Owner, Demo Customer & Settings
│   └── worker.js                  # Standalone background worker process
├── tests/                         # Vitest unit and integration test suites
├── docker-compose.yml             # PostgreSQL 16 & Redis 7 container configuration
├── vitest.config.ts               # Vitest configuration
├── tailwind.config.js             # Tailwind design tokens
└── tsconfig.json                  # TypeScript configuration
```

---

## 3. Quick Start & Local Development

### Prerequisites
- Node.js 18+ (tested on Node.js 20.18 LTS)
- npm 10+
- Optional: Docker Desktop (for containerized PostgreSQL and Redis)

### Step 1: Install Dependencies
```powershell
npm install
```

### Step 2: Database Setup & Migrations
For local zero-dependency development (SQLite):
```powershell
npx prisma db push --schema=prisma/schema.sqlite.prisma
```

To seed the initial Owner account and demo records:
```powershell
node scripts/seed.js
```

### Step 3: Run the Development Server
```powershell
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 4. Default Seeded Credentials

| Account Role | Email Address | Password | Credit Mode | Initial Balance |
| :--- | :--- | :--- | :--- | :--- |
| **System Owner** | `owner@indexmatrix.io` | `ChangeMeImmediately123!` | `UNLIMITED` | Unlimited (Bypasses billing) |
| **Demo Customer** | `customer@indexmatrix.io` | `Customer123!` | `LIMITED` | 150 Credits |

---

## 5. Automated Test Suite

Run the full automated test suite using Vitest:
```powershell
npx vitest run
```

### Included Test Suites
1. `tests/ssrf.test.ts`: SSRF firewall verification (loopback, 169.254.169.254, RFC 1918 private subnets, protocols).
2. `tests/property-matcher.test.ts`: Strict Google Search Console domain vs prefix property matching.
3. `tests/indexing-eligibility.test.ts`: Google Indexing API capability guard (`JobPosting` vs standard pages).
4. `tests/credit-ledger.test.ts`: Atomic deductions, owner unlimited bypass, idempotency, insufficient credit rejections.
5. `tests/crypto.test.ts`: AES-256-GCM token encryption and SHA-256 key hashing.

---

## 6. Google Cloud Setup Guide

To configure live Google Search Console integration:
1. Open the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a project named `INDEX MATRIX`.
3. Navigate to **APIs & Services > Library** and enable:
   - **Google Search Console API**
   - **Webmaster Tools API**
   - **Indexing API**
4. Configure the **OAuth Consent Screen** (User type: External, add scopes `webmasters.readonly` and `indexing`).
5. Create **OAuth 2.0 Client ID Credentials** (Web Application):
   - Authorized redirect URI: `http://localhost:3000/api/v1/google/callback`
6. Add the credentials to your `.env` file:
   ```env
   GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
   GOOGLE_CLIENT_SECRET="your-client-secret"
   GOOGLE_REDIRECT_URI="http://localhost:3000/api/v1/google/callback"
   ```

---

## 7. Production Deployment Checklist
- [ ] Spin up PostgreSQL 16 using `docker-compose up -d postgres redis`
- [ ] Set `DATABASE_URL="postgresql://user:pass@host:5432/index_matrix"`
- [ ] Run `npx prisma migrate deploy`
- [ ] Set cryptographically secure `APP_SECRET` and `ENCRYPTION_KEY`
- [ ] Configure live Stripe / Razorpay keys and webhook secrets
- [ ] Run production build: `npm run build`
- [ ] Start production server: `npm run start`
