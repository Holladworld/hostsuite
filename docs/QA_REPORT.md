# HostSuite Full QA Audit — Pre-Staging

## Scope

Reviewed the current security/provider/AI/pricing work on `feature/hs-016-security-final` and the repository history. This is a code/repository audit; live provider credentials and production webhooks are not available, so those integrations cannot be truthfully marked passed.

## Current findings

### Build/tooling
- `package.json` exposes `build`, `lint`, and `typecheck` scripts.
- No repository test script was found in `package.json`.
- No automated test files were found through repository code search.
- Therefore build/typecheck/lint must be executed in a real checkout before staging is approved.

### Security
- Security checklist exists and explicitly requires RLS, authorization, secret isolation, webhook verification, rate limiting, and AI sandbox isolation.
- These are release requirements, not proof of successful runtime testing.
- AI-generated code must never execute in the HostSuite web process.

### Payments
- Paystack and Flutterwave webhook work exists in branch history and was previously reverted from `main` after accidental writes; this is a repository hygiene issue to keep monitoring.
- Webhook signature verification and idempotency still require end-to-end tests with provider test credentials.
- Entitlements must only activate after verified server-side payment state.

### Provider integration
- The provider abstraction deliberately avoids inventing undocumented WhoGoHost/Go54 APIs.
- Live provisioning, domain registration, email creation and hosting creation cannot be passed until reseller/API credentials and documentation are available.
- Unsupported provider capabilities must fail explicitly.

### AI builder
- HostSuite has an AI gateway/usage architecture.
- OpenThorn integration remains infrastructure-dependent and must be tested in an isolated environment.
- Generated code must run outside the HostSuite application runtime.
- Cloudflare deployment must be tested with a dedicated non-production Cloudflare project/token.

### Billing/pricing
- Pricing must remain configuration-driven.
- Checkout must snapshot the price/discount/tax used for an order.
- Discounts must respect minimum-margin rules.
- AI usage must be metered server-side and cannot be granted merely because a client reports a successful generation.

## Required automated checks before staging

1. `npm install`
2. `npm run typecheck`
3. `npm run lint`
4. `npm run build`
5. Add unit/integration tests for pricing calculations.
6. Add tests for discount stacking and minimum-margin protection.
7. Add tests for Paystack signature rejection/acceptance/idempotency.
8. Add tests for Flutterwave authenticity rejection/acceptance/idempotency.
9. Add RLS tests proving user A cannot read/write user B's records.
10. Add authorization tests for admin-only routes.
11. Add AI credit/usage tests proving limits are enforced server-side.
12. Add provider adapter tests for success, unsupported capability and failure states.

## Manual staging checks

- Signup/login/logout/recovery.
- Customer onboarding and service discovery.
- Portal navigation.
- CMS editing and publishing.
- Pricing creation/editing and effective dates.
- Coupon creation and expiry.
- Referral credit issuance.
- Checkout and payment callback.
- Failed/duplicate webhook handling.
- Domain/hosting/email provider flows using sandbox/test credentials.
- AI build → preview → isolated execution → deployment.
- Monitoring → incident → notification → support escalation.
- Admin authorization and audit visibility.

## Storage architecture decision

Supabase should not be treated as the permanent storage provider for large customer files. Keep the application database/storage boundary abstracted so object storage can move to Cloudflare R2 later.

Cloudflare R2 is S3-compatible, supports presigned/direct uploads, and currently has no Internet egress fee; this makes it a strong future object-storage target. R2 is not a replacement for the relational database or authentication layer by itself.

Migration plan: introduce a storage adapter (`putObject`, `getObject`, `deleteObject`, `createSignedUploadUrl`, `createSignedDownloadUrl`) and keep object keys/metadata in the database. Then changing from Supabase Storage to R2 becomes a provider migration rather than a UI/database rewrite.

## Release status

**NOT READY FOR STAGING MERGE YET.**

Reason: the repository currently lacks automated tests, and several critical integrations require real test credentials. The correct next step is to add the automated test suite, run build/typecheck/lint, fix all failures, then perform staging smoke tests.
