# HS-013 — Shared Commerce and Customer Onboarding Architecture

**Status:** Architecture baseline / read-only audit  
**Audited branch:** `test/staging-integration-49-61`  
**Audited commit:** `9d34feab99abe40fbd57868e53428bb70977af4d`  
**Scope:** Public catalogue, service discovery, signup/sign-in, checkout, billing, provider fulfilment and customer account continuity.

## 1. Product decision

HostSuite will have one connected commerce and customer-account system. Customers may enter through Domains, Hosting, Business Email, Website/AI Studio, one-off Services, or Managed Care pricing. These are different purchase intents, not separate checkout systems.

The shared system owns:
- customer identity and profile;
- product/service catalogue and recommendations;
- cart/order review and immutable price snapshots;
- invoices, payment attempts and verified payment events;
- subscriptions and renewal consent;
- service instances and managed assets;
- fulfilment status, support tickets and customer communication.

Provider-specific systems (Paystack, Flutterwave, registrar/hosting/email suppliers) are adapters behind HostSuite. They must not create a second customer account, customer portal, order ledger or billing engine.

## 2. Commercial categories and fulfilment rules

| Category | Examples | Commercial model | Fulfilment |
| --- | --- | --- | --- |
| Infrastructure products | Domain registration/renewal, hosting packages, mailbox licences | Usually one-time or supplier-defined recurring term | Automated only where the selected provider capability is configured and verified |
| Optional add-ons | Additional mailboxes, SSL, backups, monitoring, migration | One-time or recurring according to the actual service | Attach to the same order and customer account |
| Managed care | Starter Ops, Managed Growth | Monthly/yearly recurring plan, with explicit renewal authorization and opt-out | Subscription lifecycle and human/automated care operations |
| Defined one-off work | Email repair, DNS setup, malware cleanup, fixed-scope recovery | One-time fixed price | Create a work item/ticket after verified payment |
| Complex work | Migration with dependencies, custom development, specialist infrastructure | Assessment and quote | Customer request → scope → quote revision → customer approval → invoice/payment → delivery |

Do not force a maintenance subscription onto a one-off service customer. Do not describe a one-time payment as a recurring subscription. A customer may buy a product without buying an add-on.

## 3. Target customer journey

1. **Discover:** Browse a product/service and, where useful, answer a short guided requirements flow. No account is required to understand or compare public offerings.
2. **Configure:** Select plan/term, domain or existing-domain choice, mailbox quantity, migration needs and optional recommendations. Collect only information needed for that purchase.
3. **Review:** Display exact line items, quantities, included features, add-ons, billing model, renewal behaviour, taxes/fees if applicable, total and relevant terms. Prices are read from the server-side active catalogue.
4. **Authenticate:** Offer **Sign in** or **Create account** without discarding the configured basket. Existing customers return to the same review. New customers complete account creation and return to the same review.
5. **Complete profile:** Collect required customer identity and contact information. Collect billing address/tax fields only when required. Collect domain registrant contacts only for domain registration and validate them before payment.
6. **Pay:** Create one server-authoritative order, immutable line items/price snapshot and invoice. Initialize the selected payment provider through the shared payment abstraction. A hosted provider payment page is acceptable; it is the payment step, not the product-discovery step.
7. **Verify and fulfil:** Only a signature-checked webhook plus server-side provider verification may mark an order paid or grant value. Route each paid line item to its correct fulfilment handler.
8. **Manage:** Show orders, invoices, subscriptions, service instances, managed assets and work/tickets in the same HostSuite account.

### Authentication and profile rules

- Public product and plan review must render before authentication.
- Authentication must preserve a validated internal return path and the entire configured purchase context.
- Never trust client-supplied price, currency, product status, discount, tax or provider plan identifiers.
- Signup should collect first name, last name, email, phone and password; confirm password in the form only. Company name is optional. Marketing/email subscription is a separate optional consent, never bundled with transactional account notices.
- Persist customer profile fields in a defined profile model linked to the Supabase auth user. Do not assume Supabase Auth metadata alone is a durable billing profile.
- Billing address and tax identifiers are collected at checkout when required, not as a blanket barrier to account creation.
- Domain registrant contact data is purpose-specific, validated and sent only to the registrar when registration is fulfilled.

## 4. Catalogue, recommendations and order model

Use the existing `billing_products` catalogue as the initial product source, extending it deliberately rather than creating a second catalogue. A product must expose a customer-safe description, product type, billing mode, currency, price/term, active state, fulfilment mode and safe configuration schema. Supplier cost, margin, provider credentials and internal notes remain server/admin-only.

Recommendations are catalogue relationships/rules, not hard-coded forced bundles:
- Domain → compatible hosting and business email.
- Hosting → domain (only if the customer does not already have one), business email and migration where relevant.
- Business email → domain, mailbox quantity and optional deliverability care.
- One-off email repair → optional ongoing email care only when that service is actually defined and available.
- Hosting/domain → optional monitoring, backup or security only when the exact coverage and fulfilment are defined.

Recommendations are optional, never preselected paid extras. Check existing customer services and the current basket to avoid duplicates. Explain why each add-on is recommended and show its incremental price.

A basket may contain multiple compatible products, but the server must validate compatibility, currency, quantity limits, product activity, pricing, add-on dependencies and service-specific configuration before order creation. Keep managed-care subscription consent separate from ordinary service terms.

## 5. Existing implementation audit

### Reusable foundations

- `billing_products`, `billing_orders`, `billing_order_items`, `billing_invoices`, `billing_subscriptions` and `billing_webhook_events` already exist.
- `app/api/billing/initialize/route.ts` already provides an authenticated generic product-ID checkout initializer, reading active products and prices on the server and creating order, items and invoice.
- `components/service-purchase-flow.tsx` already has a three-step Plan → Configure → Review & Pay journey for domain, hosting, email and website, including domain registrant fields and email-address configuration.
- `service_instances` and `lib/services/provisioning.ts` provide a durable purchased-service lifecycle.
- `managed_assets` is the separate model for customer-owned services HostSuite manages.
- Provider interfaces, capability reporting and WhoGoHost adapter exist.
- PR #67 added managed-care review, recurring consent, provider subscription handling, cancellation and billing UI. Preserve these safeguards.

### Gaps and blockers confirmed in the audited branch

1. `app/portal/page.tsx` signup currently asks only for email and password. It does not collect name, phone, password confirmation or customer billing profile. The sign-up call does not pass profile metadata.
2. `app/portal/managed-plan/page.tsx` redirects unauthenticated visitors to `/portal` before fetching/rendering the selected plan. This directly explains why the pricing CTA appears to go to login first.
3. `components/service-purchase-flow.tsx` redirects unauthenticated visitors to `/portal` before loading the catalogue or showing its purchase steps. The flow is not currently a public pre-auth checkout.
4. `app/domains/domain-search.tsx` sends an available domain to `/portal?mode=signup` without carrying the searched domain into the next step. The separate service purchase flow can search a domain, but it is also authentication-gated.
5. `app/hosting/page.tsx` has three WhatsApp CTAs and no public plan catalogue. Its copy explicitly says verified supplier package names/prices are not configured.
6. The current `WhoGoHost` adapter advertises domain search/register/renew/transfer/DNS/lock capabilities only. Its hosting provisioning, usage, control-panel and mailbox methods return `NOT_SUPPORTED`. The mock adapter supports these only as simulated operations. Therefore a live WhoGoHost setting does not currently prove that HostSuite can provision hosting or email.
7. `lib/services/provisioning.ts` attempts hosting and email fulfilment through the selected provider. Those purchases will fail unless a provider adapter with the relevant capabilities is configured. Product visibility must be capability-aware.
8. `components/service-purchase-flow.tsx` reads products only after authentication and posts to a Paystack-specific initializer. There is also a generic billing initializer. Reconcile these paths into one shared order/payment service rather than growing parallel checkout implementations.
9. The current generic checkout creates an order for selected product IDs, but the customer-facing purchase flow is single-product and has no shared basket/add-on recommendation model.
10. The managed-plan checkout is a separate order/invoice implementation. It must be reconciled with shared order creation without weakening subscription-specific consent and provider lifecycle rules.
11. Domain registrant details are already collected in the purchase flow, but general signup/profile details and billing address are not part of the same defined profile model in the reviewed signup path.
12. Existing product and pricing documentation says supplier costs must be verified before publishing infrastructure rates. Do not invent hosting packages or prices to make the page look complete.

## 6. Provider and payment boundaries

- Paystack and Flutterwave are payment processors, not the reason checkout must start at login. They may host the final payment form after HostSuite has shown the order and authenticated the customer.
- Use one provider-neutral payment initialization/verification interface and retain provider-specific webhook adapters.
- Keep supplier fulfilment separate from payment collection. A successful payment does not prove supplier provisioning succeeded; represent paid, provisioning, active and provisioning-failed states separately.
- Expose only verified provider capabilities in public catalogue availability and admin operations.
- WhoGoHost may remain the registrar/domain supplier where its documented and tested domain capabilities are sufficient. Hosting/email require a separately verified adapter or supplier product/API. Supplier choice is an operational decision, not a customer-facing product category.
- Supplier cost and HostSuite labour/margin must remain distinct. Do not silently bundle unverified backup, monitoring, uptime or support promises.

## 7. Recommended implementation sequence

### Phase 0 — Architecture and data contract
- Document the shared customer journey and catalogue/checkout boundaries.
- Inventory current route consumers, order creation, webhooks, fulfilment and database constraints.
- Define customer profile fields and where they are stored.
- Define product/add-on relationship metadata and service-specific configuration schemas.
- Confirm existing catalogue products, supplier costs, currencies and provider capabilities before publishing.

### Phase 1 — Authentication and customer profile
- Build a signup form with first/last name, email, phone, password and confirmation.
- Add optional company name and separate optional marketing consent.
- Persist profile safely against the authenticated user; validate email confirmation and preserve return context.
- Keep existing customer sign-in and password recovery working.

### Phase 2 — Shared public review and authentication handoff
- Create a public checkout/review route that resolves product IDs and prices from the server.
- Show selected products and compatible optional recommendations before login.
- Preserve basket/configuration across sign-in or signup and return to the same review.
- Make managed-plan review public while retaining explicit recurring authorization and opt-out.
- Carry domain search selection into the basket and review.

### Phase 3 — Shared order and payment service
- Consolidate duplicate order/invoice creation into one server-side order service.
- Support multiple compatible line items, quantities, immutable price snapshots and idempotency.
- Keep provider payment adapters behind one interface.
- Preserve verified webhook settlement, invoice transitions and ticket-quote settlement.

### Phase 4 — Capability-aware fulfilment and catalogue
- Add only verified hosting/email supplier integrations and product records.
- Prevent checkout for a product whose fulfilment route is unavailable; offer a clearly labelled request/quote alternative.
- Keep domain, hosting, email and one-off work as distinct service instances under one customer account.
- Add optional add-ons/recommendations based on actual catalogue availability and customer-owned services.

### Phase 5 — Validation
- Unit-test pricing, basket validation, add-on compatibility, auth return paths, profile validation, recurring consent, webhook idempotency and fulfilment state transitions.
- Run typecheck, lint, tests and normal/Cloudflare builds.
- Test Paystack and Flutterwave sandbox flows only after the test database migration and provider settings are ready.
- Verify domain and hosting provisioning separately; never treat mock success as live supplier success.
- No production migration, live charge, DNS change or production deployment without explicit approval.

## 8. Acceptance criteria

- A visitor can select and review a product or managed plan before signing in.
- Sign in and signup both return to the same complete basket/review.
- New signup captures the required identity/contact data and stores a customer profile.
- A domain selected during search remains selected through signup and checkout.
- Optional recommendations are relevant, explainable, priced and never forced.
- One order/invoice can represent compatible multiple line items.
- Server-side catalogue prices are authoritative and snapshotted into the order.
- One payment abstraction handles one-time and recurring flows without merging their consent semantics.
- Webhooks are verified and idempotent before orders are marked paid.
- Paid-but-unprovisioned services are visible as such; no false active status is shown.
- Hosting/email are purchasable only when their actual supplier fulfilment capability is configured and verified.
- One customer account contains orders, invoices, subscriptions, service instances, managed assets and support work.
- WhatsApp remains an optional contact path for guided help and custom work, not the default checkout for ordinary products.

## 9. Safety boundary for this work

This document is an architecture baseline, not evidence that payment or supplier fulfilment is production-ready. The audited integration branch is not the live branch. The managed-plan migration has not been applied to Supabase; no live payment, supplier provisioning, production configuration or deployment was performed during this audit.
