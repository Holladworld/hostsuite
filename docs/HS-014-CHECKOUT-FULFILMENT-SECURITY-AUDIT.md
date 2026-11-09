# HostSuite Checkout and Fulfilment Security Audit

**Audit date:** 9 November 2026  
**Audited ref:** `test/staging-integration-49-61`  
**Audited commit:** `9d34feab99abe40fbd57868e53428bb70977af4d`  
**Scope:** Existing billing initialization, managed-plan checkout, Paystack and Flutterwave webhooks, subscription settlement, service-instance provisioning, and the proposed public pre-authentication purchase/review flow.

## Executive decision

**Do not expose the proposed public purchase flow yet.** The current code has meaningful protections: checkout initialization endpoints require a verified Supabase user; prices are read from the server-side product catalogue; provider webhooks authenticate their signatures and verify transactions with the provider; the main entitlement-grant RPC is restricted to `service_role`; and the provisioning function only accepts service instances in paid or retryable provisioning-failed states.

Those controls are a good foundation, but they do not yet establish the complete invariant:

> A service can only be fulfilled from a server-created order whose exact items, amount, currency, customer and payment reference have been verified, and whose state is eligible for settlement.

The public flow should remain a review/configuration experience only. No order, payment or fulfilment authority should move into the browser.

## Findings

### Critical / release blocker

#### 1. Generic checkout accepts unbounded fractional quantities

**Evidence:** `app/api/billing/initialize/route.ts` and `app/api/billing/paystack/initialize/route.ts`.

The request schema accepts any positive JavaScript number for each quantity. It does not require an integer, apply a maximum, or enforce product-specific quantity rules. The server multiplies the catalogue price by that value. For products representing a service instance (domain, hosting, mailbox or website), fractional quantities can produce an underpayment while the webhook still sees an order whose amount matches the amount HostSuite itself calculated.

**Required fix:** define quantity policy per product type. Default service products to exactly one; only permit integer quantities with a strict maximum for products that genuinely support multiples. Validate safe integer/decimal precision and total bounds server-side.

#### 2. Client-supplied order-item metadata is trusted by fulfilment

**Evidence:** both generic checkout initializers copy `metadata[productId]` from the request into `billing_order_items.metadata`; `components/service-purchase-flow.tsx` supplies values such as `serviceType`, `domain`, `domainContact`, `emailAddresses`, and `managementMode`; `lib/services/provisioning.ts` later consumes the resulting service-instance configuration.

Customer configuration must be accepted, but it is currently an open-ended object rather than a server-validated, product-specific schema. The generic endpoint also accepts arbitrary nested metadata keys and values. The provisioning layer assumes configuration shape and completeness rather than validating a canonical order snapshot before fulfilment.

**Required fix:** define strict Zod schemas for each sellable product/service type; reject unknown keys; normalize and validate domain names, email addresses, contact fields, mailbox count and management mode; derive service type and provider plan reference from the server-side product record, never from the browser. Persist only the validated, normalized configuration snapshot.

#### 3. Provisioning does not independently verify the paid order

**Evidence:** `lib/services/provisioning.ts` loads a `service_instances` row and permits provisioning when its status is `paid` or `provisioning_failed`. It does not independently load and verify the associated `billing_orders` row, its paid status, provider reference, amount/currency, or the order item relationship before calling the external provider.

The current webhook calls the entitlement and service-instance RPCs after provider verification, which is an important upstream control. However, the fulfilment function itself relies on a mutable service-instance status as its authorization boundary.

**Required fix:** enforce paid-order eligibility in the database function that begins provisioning and in the server-side provisioning service. Join the instance to its order and order item; require the order to be paid, the item to belong to that order, and the instance to be derived from that item. Reject cancelled, failed, refunded, disputed, stale or mismatched orders. Keep retries limited to explicitly retryable states.

### High

#### 4. Payment webhooks do not consistently enforce order state or full transaction/order binding

**Evidence:** `app/api/billing/paystack/webhook/route.ts` and `app/api/billing/flutterwave/webhook/route.ts`.

Both handlers verify the provider transaction and compare amount/currency when a matching order is found. However, ordinary successful-payment handling updates a matching order to `paid` without first requiring the order to be `pending` or routing non-payable states to reconciliation. The handlers do not consistently assert that the verified transaction's own reference and provider metadata (order ID/customer identity, where supplied) match the exact HostSuite order. The Flutterwave path looks up the order using webhook `tx_ref` but does not explicitly compare the verified transaction's `tx_ref` to it.

**Required fix:** centralize settlement validation. Verify provider transaction status, provider, exact reference, order ID metadata where supported, customer identity where supported, amount in provider units, currency, and payable order state. A payment arriving for a cancelled, failed, expired or otherwise non-payable order must be recorded as received and routed to reconciliation/refund—not automatically fulfilled.

#### 5. Webhook idempotency is not atomic across concurrent deliveries

**Evidence:** both webhook handlers perform a read of `billing_webhook_events.processed`, then upsert an event row, process settlement, and finally mark the event processed. The read/upsert/process sequence is not an atomic claim/lock. Concurrent duplicate deliveries can both pass the initial check and execute downstream work. The Flutterwave fallback event ID can also use a generated random UUID when the payload lacks stable identifiers.

**Required fix:** use a database-backed atomic event claim/lease or a settlement RPC that locks the order and event row. Add unique constraints on provider transaction references and renewal references. Make every downstream grant, subscription settlement and provisioning enqueue idempotent under concurrent webhook delivery. Never synthesize a random event ID for a payment event if a stable provider transaction identifier is available.

#### 6. Generic and Paystack-specific checkout create orders independently

**Evidence:** `app/api/billing/initialize/route.ts` and `app/api/billing/paystack/initialize/route.ts`.

Both endpoints independently create orders, order items and invoices. The service purchase component calls the Paystack-specific endpoint, while the provider abstraction and generic endpoint already exist. The two implementations have different product fields, reference formats and error handling. This creates a risk that validation or security fixes are applied to one path but not the other.

**Required fix:** consolidate on one server-side order-creation and payment-initialization service. Keep provider-specific code behind the payment provider abstraction. Managed-plan checkout may retain its distinct recurring-consent and subscription-settlement rules, but should reuse the common order creation primitives where safe.

#### 7. Order creation is a multi-step non-transactional sequence

**Evidence:** both generic initialization routes insert the order, then order items, then invoice using separate database requests. If a later insert fails, a pending order or incomplete invoice record can remain. There is no atomic rollback across these writes.

**Required fix:** create order, immutable item snapshots and invoice in one database transaction/RPC. Use a server-generated idempotency key and enforce uniqueness. Repeated requests should return the same pending order or a clear conflict, not create multiple payable orders unintentionally.

#### 8. Callback URL is caller-controlled

**Evidence:** generic initialization accepts an arbitrary optional `callbackUrl` URL and passes it to the provider.

This does not itself grant a service, but it permits payment completion to redirect a customer to a caller-selected destination and creates a phishing/open-redirect risk.

**Required fix:** construct the callback URL on the server from a configured canonical application origin and a fixed allow-listed route. Do not accept arbitrary callback hosts from the browser.

#### 9. Managed-plan renewal can be linked to the wrong pending order

**Evidence:** Paystack `subscription.create` handling searches by provider plan ID and customer email, then chooses the newest pending or paid managed-plan order. It does not bind the provider subscription event to a unique checkout reference/order ID.

If a customer has more than one pending checkout for the same plan, this heuristic can associate provider credentials with the wrong order.

**Required fix:** bind the recurring subscription to a unique checkout/order identifier returned in provider metadata or verified initial transaction data. If the provider event cannot be correlated unambiguously, leave it unmatched for reconciliation rather than selecting the newest order.

#### 10. Auto-renew may be represented as active before provider mandate details are confirmed

**Evidence:** `activateManagedPlanSubscription` creates an active subscription with `auto_renew=true` from order metadata even when the provider subscription ID/token is not yet available; it can store null provider credentials.

**Required fix:** distinguish “paid term active” from “provider mandate confirmed”. Do not represent automatic renewal as operational until a valid provider subscription/mandate is linked. If mandate creation fails after the initial charge, preserve the paid period but flag renewal setup for reconciliation and communicate the actual state.

### Medium / operational readiness

#### 11. Product visibility is not capability-aware

**Evidence:** `lib/services/provisioning.ts` calls hosting and mailbox operations on the configured provider, while the current WhoGoHost adapter's hosting provisioning and mailbox methods are not supported (as established in the architecture audit). A paid order can therefore reach a predictable provisioning failure.

**Required fix:** only expose online purchase for product types whose selected provider reports the required capability and whose package/plan reference is configured. Otherwise offer a clearly labelled assisted request/quote route, not a normal “buy now” promise.

#### 12. Domain availability is not rechecked immediately before registration

**Evidence:** the client checks availability in `components/service-purchase-flow.tsx`; the provisioning path later calls `registerDomain` directly.

Availability can change between review, payment and fulfilment.

**Required fix:** recheck availability and registration requirements at the server/provider boundary before registration. If unavailable after payment, do not mark active; route to customer choice, refund or manual resolution.

#### 13. Renewal settlement does not visibly validate subscription lifecycle state

**Evidence:** `recordManagedPlanRenewal` matches provider subscription credentials and amount/currency, then updates the subscription to active. It does not first reject a locally cancelled/non-renewing subscription or compare the renewal against the expected provider mandate state.

**Required fix:** reconcile provider mandate state and local consent/cancellation state before extending the paid period. A verified charge received after cancellation must be recorded and routed for reconciliation/refund as appropriate, not silently reactivating the subscription.

## Existing protections confirmed

- Both generic checkout initialization routes use `getVerifiedUser` and return 401 without a verified user/email.
- Product existence, active status, price and currency are loaded from `billing_products` server-side; the browser does not directly set the total.
- Managed-plan checkout separately requires authenticated user, accepted service terms and explicit recurring consent when auto-renew is enabled.
- Paystack webhook verifies the HMAC signature and then verifies the transaction with Paystack.
- Flutterwave webhook checks its configured webhook secret hash and verifies the transaction with Flutterwave.
- Both webhook paths compare verified amount/currency with a matching order before ordinary settlement.
- `grant_billing_order_value(uuid)` was explicitly revoked from PUBLIC/anon/authenticated and granted to `service_role` in migration `20261108150000_harden_billing_entitlement_execution.sql`.
- Provider subscription credentials are placed in a separate table with RLS enabled and no customer-facing policy in migration `20261109100000_managed_plan_checkout.sql`.
- The provisioning function rejects service instances outside `paid` and `provisioning_failed` states and has a database RPC to prevent concurrent attempts for one instance.

## Public purchase-flow safety contract

The new public flow may:
- read active, publicly sellable catalogue data through a server endpoint;
- configure a product using a strict product-specific schema;
- request a server-calculated price/review;
- preserve a non-authoritative basket/configuration through login or signup.

It must not:
- create a paid order, invoice, entitlement, subscription or service instance before authentication and server-side validation;
- accept a browser-supplied amount, currency, provider plan ID, service type or fulfilment status;
- treat a browser redirect, query parameter, local storage value or client callback as payment proof;
- invoke provisioning from a public route;
- mark a product as deliverable unless the selected supplier capability and package are configured.

After authentication, the server must revalidate the basket and create an immutable order snapshot. Payment success is established only by verified provider data. Fulfilment is authorized only after atomic settlement confirms the exact payable order and creates a durable, idempotent fulfilment job.

## Recommended remediation order

1. Lock down product quantity rules and product-specific configuration schemas.
2. Add an atomic order/item/invoice creation transaction and idempotency.
3. Centralize provider transaction verification and payable-order state checks.
4. Add atomic webhook event claiming and idempotent settlement.
5. Enforce paid-order linkage inside the provisioning database boundary.
6. Correct recurring mandate correlation and cancellation-state settlement.
7. Hide unsupported hosting/email purchase products until supplier capability is live.
8. Add adversarial tests before implementing public pre-auth review.
9. Only then implement public browse/configure/review and preserve the basket through authentication.

## Verification limits

This is a source-code audit of the named branch, not a live penetration test. The managed-plan migration has not been applied to Supabase; no live payment was attempted; no supplier provisioning was triggered; and no DNS, Cloudflare or production settings were changed. The audit did not query the live Supabase schema or inspect secrets/provider dashboards. Database function and RLS behavior must be rechecked against the actual applied migration history before release.
