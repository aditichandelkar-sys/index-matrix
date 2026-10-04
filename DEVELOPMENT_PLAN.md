# INDEX MATRIX — MASTER DEVELOPMENT PLAN & EXECUTION ROADMAP

## 1. Project Phase Breakdown

### Phase 1: Foundation, Data Models & Authentication
- [x] Architecture & Security Specification (`PROJECT_ARCHITECTURE.md`, `SECURITY.md`)
- [x] Next.js 14+ TypeScript Project Setup with Tailwind CSS & Lucide icons
- [x] Prisma ORM Schema Definition with PostgreSQL (with SQLite dual-compatibility for local dev testing)
- [x] Core Data Models: `User`, `CreditWallet`, `CreditTransaction`, `Project`, `Url`, `UrlAnalysis`, `GoogleAccount`, `SearchConsoleProperty`, `GoogleInspection`, `Sitemap`, `IndexJob`, `ApiKey`, `AuditLog`, `SystemSetting`
- [x] Password Hashing (bcryptjs work factor 12) & Secure Session Engine (HttpOnly JWT)
- [x] Role Guards: `OWNER` (creditMode: UNLIMITED) vs `CUSTOMER` (creditMode: LIMITED)
- [x] Public Marketing Website (Home, Features, How It Works, Pricing, Docs, FAQ, Contact, Privacy, Terms, Refund)

### Phase 2: Project Management & URL Engine
- [x] Project CRUD & Workspace Management (`/api/projects`, `/api/projects/[id]`)
- [x] Single and Bulk URL Normalizer & Validator (RFC 3986 compliant)
- [x] Bulk URL Importers: Raw text, CSV, Newline, XML Sitemap, RSS/Atom feeds (`/api/urls/bulk`)
- [x] Status Machine Implementation: `IMPORTED` -> `QUEUED` -> `ANALYZING` -> `ANALYZED` -> `SUBMITTED` -> `INDEXED` / `BLOCKED` / `ERROR`

### Phase 3: SSRF-Hardened Technical URL Analyzer
- [x] Strict SSRF Firewall (DNS resolution, private RFC 1918, loopback, cloud metadata blocking)
- [x] Deep Technical SEO Audit Engine (`src/lib/analyzer.ts`):
  - [x] HTTP Status & Latency
  - [x] Multi-hop Redirect Chain Detection with per-hop SSRF validation
  - [x] Canonical URL Verification & mismatch detection
  - [x] Meta Robots (`noindex`, `nofollow`, `noarchive`, `nosnippet`)
  - [x] HTTP Headers & `X-Robots-Tag`
  - [x] HTML Availability, Title, Description length & health
  - [x] robots.txt discovery and matching
  - [x] Structured Data detection (JobPosting / BroadcastEvent eligibility)

### Phase 4: Google Search Console & URL Inspection Engine
- [x] Google OAuth 2.0 Flow with state verification & AES-256-GCM token encryption
- [x] Search Console Properties Synchronizer (`webmasters.v3.sites.list`)
- [x] Accurate Property Matcher (`src/lib/property-matcher.ts`):
  - [x] Domain properties (`sc-domain:example.com` matching root and subdomains across protocols)
  - [x] URL-Prefix properties (`https://example.com/sub/`)
- [x] Google URL Inspection API integration (`src/lib/google-client.ts`)
- [x] Verdict & Coverage Mapping (Page fetch state, robotsTxtState, indexingState, crawl timestamp)
- [x] Capability-Aware Indexing Engine (`src/lib/indexing-eligibility.ts`):
  - [x] JobPosting / BroadcastEvent official API eligibility gate
  - [x] Educational guidance for standard pages (Inspection + Sitemap)

### Phase 5: Resilient Queue & Background Workers
- [x] Redis + BullMQ Queue Architecture (`src/lib/queue.ts`)
- [x] Dedicated Job Handlers (`url-analysis`, `google-inspection`, `sitemap-processing`)
- [x] In-process fallback queue driver for zero-dependency local environments
- [x] Exponential backoff, concurrency controls, idempotent retries (zero double-charging)
- [x] Dedicated worker runner script (`scripts/worker.js`)

### Phase 6: Immutable Credit Wallet & Transaction Ledger
- [x] Credit Engine with Pessimistic/Serializable Database Transactions (`src/lib/credit-ledger.ts`)
- [x] Owner Unlimited Credit Policy (`creditMode = UNLIMITED`, 0 balance deduction)
- [x] Customer Limited Balance (`creditMode = LIMITED`)
- [x] Full Transaction History with Idempotency Keys (`PURCHASE`, `USAGE`, `ADMIN_ADD`, `ADMIN_REMOVE`, `REFUND`, `BONUS`, `ADJUSTMENT`)
- [x] Configurable Operation Costs (`ANALYZE_URL`: 1, `GOOGLE_INSPECTION`: 2, `SUPPORTED_INDEXING`: 3, `SITEMAP_PROCESS`: 5)

### Phase 7: Payment Abstraction & Verified Webhooks
- [x] Provider-Agnostic Payment Service Interface (`src/lib/payments.ts`)
- [x] Stripe & Razorpay Sandbox Adapters
- [x] Cryptographic Webhook Signature Verification (HMAC SHA-256)
- [x] Idempotent Event Processing (prevent double crediting on replay attacks)

### Phase 8: XML Sitemap Discovery & Monitoring Engine
- [x] Nested Sitemap Index & Standard XML Sitemap Parser (`src/lib/sitemap-parser.ts`)
- [x] Recursive URL discovery and automated project ingestion
- [x] URL monitoring dashboard differentiating application checks, GSC data, and Googlebot crawl dates

### Phase 9: Public Versioned REST API & Key Management
- [x] Cryptographic SHA-256 Hashed API Keys (`src/lib/api-key-auth.ts`)
- [x] Versioned REST Endpoints (`/api/v1/urls`, `/api/v1/credits`, `/api/health`)
- [x] Per-key Usage Tracking & One-time Secret Display

### Phase 10: Owner / Admin Control Center
- [x] Customer Directory & Status Controls (Suspend / Reactivate, toggle creditMode)
- [x] Manual Credit Adjustments with Mandatory Audit Rationale (`/dashboard/admin/credits`)
- [x] System Health & Background Queue Telemetry (`/dashboard/jobs`, `/api/health`)
- [x] Audit Log Explorer (`/dashboard/admin/logs`)
- [x] Global System Settings (`/dashboard/admin/settings`)

### Phase 11: Comprehensive Test Suite & Quality Assurance
- [x] Automated Unit & Integration Tests (Vitest: 29 passed across 5 test suites)
- [x] SSRF Security Regression Tests (`tests/ssrf.test.ts`)
- [x] Credit Ledger Concurrency & Idempotency Tests (`tests/credit-ledger.test.ts`)
- [x] Google Property Matching Accuracy Tests (`tests/property-matcher.test.ts`)
- [x] Google Indexing API Capability Gate Tests (`tests/indexing-eligibility.test.ts`)
- [x] Token Encryption & Hash Tests (`tests/crypto.test.ts`)
- [x] Production Build Verification (`npm run build`: 57 routes compiled, 0 errors, exit code 0)
