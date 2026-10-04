# INDEX MATRIX — SECURITY & COMPLIANCE POLICY

## 1. Threat Model & Security Posture

### 1.1 SSRF (Server-Side Request Forgery) Prevention
The URL Analyzer performs HTTP requests against user-provided URLs. To protect internal infrastructure, cloud environments, and sensitive local networks:
- **DNS Resolution First**: The target hostname is resolved using system DNS before establishing TCP connections.
- **Strict Private IP Filtering**:
  - `127.0.0.0/8` (Loopback)
  - `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16` (RFC 1918 Private)
  - `169.254.0.0/16` (Link-local & Cloud Metadata: AWS/GCP/Azure `http://169.254.169.254/`)
  - `0.0.0.0/8`, `224.0.0.0/4`, `240.0.0.0/4` (Multicast, Reserved)
  - IPv6 Equivalents (`::1`, `fe80::/10`, `fc00::/7`)
- **Redirect Destination Validation**: If an HTTP 301/302/307/308 redirect is received, the `Location` header URL is re-resolved and passed through the identical SSRF firewall.
- **Resource Limits**: Max body size capped at 2MB, request timeout set to 8000ms.

### 1.2 Authentication & Authorization
- **Passwords**: Hashed with bcrypt (work factor 12) or Argon2id with cryptographically random salts. Plaintext passwords are never logged, stored, or echoed.
- **Sessions & Tokens**: HttpOnly, SameSite=Lax, Secure cookies. Session tokens stored with expiry.
- **Role Isolation**: Server-side role checks (`OWNER` vs `CUSTOMER`) on every API route handler. Client-side state is never trusted for authorization.
- **Customer Data Isolation**: All database queries for Projects, URLs, Analysis, and Transactions filter strictly by `userId`.

### 1.3 Credit Engine & Financial Integrity
- **Double-Entry Ledger Principles**: Balances are calculated through audited transactions.
- **Pessimistic/Serializable Database Transactions**: Ensures atomic operations and prevents race conditions under high concurrency.
- **Idempotency Keys**: All billable API endpoints and payment webhooks require/generate idempotency keys to ensure duplicate network retries never double-charge or double-credit.

### 1.4 API Keys & Secrets
- **API Keys**: Stored exclusively as SHA-256 hashes in the database. Raw keys are shown to the user exactly once at creation time.
- **Google OAuth Tokens**: Sensitive refresh tokens are stored encrypted at rest using AES-256-GCM.
- **Client-Side Hygiene**: No server secrets, API tokens, or webhook secrets are exposed to client-side bundles.

### 1.5 External API Compliance
- **Google Search Console**: Respects official rate limits and error responses (`429 Too Many Requests`, `403 Forbidden`).
- **Google Indexing API**: Strictly enforced eligibility checks (JobPosting / BroadcastEvent only) to prevent policy violations and domain penalties.
