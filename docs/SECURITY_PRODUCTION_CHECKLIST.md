# HostSuite Security & Production Hardening

This checklist is the release gate for HostSuite. Secrets stay server-side and provider integrations are fail-closed.

## Authentication and authorization
- [ ] Every protected API route authenticates the Supabase user.
- [ ] Server-side privileged operations use the service-role key only where required.
- [ ] Customer-owned records are tenant-scoped and protected by RLS.
- [ ] Admin actions require explicit admin authorization; UI visibility is not authorization.
- [ ] Account recovery and session invalidation are verified before production.

## Secrets
- [ ] Never expose `SUPABASE_SERVICE_ROLE_KEY`, payment secrets, AI keys, provider credentials or Cloudflare tokens through `NEXT_PUBLIC_*` variables.
- [ ] Production secrets are stored in the deployment secret manager, not Git.
- [ ] Rotate development/test credentials before production.
- [ ] Provider credentials are isolated from browser code and customer data.

## AI
- [ ] AI requests are authenticated.
- [ ] AI usage is attributed to the authenticated customer/project.
- [ ] Usage limits/credit checks happen server-side.
- [ ] Provider errors do not expose provider responses, keys or internal prompts.
- [ ] Generated code is treated as untrusted output.
- [ ] Code execution/sandboxing is isolated from the HostSuite application and database.
- [ ] Never execute customer-generated code inside the HostSuite web process.

## Payments and webhooks
- [ ] Paystack webhook signatures are verified before processing.
- [ ] Flutterwave webhook authenticity is verified before processing.
- [ ] Webhooks are idempotent using provider event/transaction references.
- [ ] Payment status is verified server-side before granting an entitlement.
- [ ] Amount and currency are validated against the order before fulfillment.

## Provider operations
- [ ] Provider adapter calls happen server-side.
- [ ] Unsupported provider capabilities fail explicitly.
- [ ] Provider credentials are never returned by capability/status endpoints.
- [ ] Provisioning operations are idempotent where provider APIs support it.
- [ ] Failed provisioning does not silently mark a service as active.

## Input and API security
- [ ] Validate request bodies, query parameters and identifiers with schemas.
- [ ] Apply rate limits to authentication, AI generation, payment-sensitive and support endpoints.
- [ ] Avoid returning raw database/provider errors to customers.
- [ ] Use safe error messages while logging actionable server-side diagnostics.
- [ ] Restrict file uploads by type, size and storage policy.
- [ ] Prevent open redirects and unsafe URL handling.

## Database / Supabase
- [ ] RLS is enabled for every customer-facing table containing tenant data.
- [ ] Policies are tested for cross-user access.
- [ ] Service-role access is limited to trusted server code.
- [ ] Sensitive fields are not exposed through public views or APIs.
- [ ] Database migrations are reviewed before production.

## Logging and monitoring
- [ ] Log security-relevant events without secrets or sensitive customer content.
- [ ] Track failed authentication, payment webhook failures, provider failures and suspicious activity.
- [ ] Configure uptime/error monitoring before launch.
- [ ] Have an incident-response contact and recovery procedure.

## Release gate
A production release is not approved merely because the UI works. The security checklist, payment verification, RLS isolation, secret handling and AI sandbox isolation must be tested successfully before `staging` is promoted to `main`.
