# HS-016 — Security & Production Hardening

## Goal

Before HostSuite connects to real providers, customer infrastructure, payments and AI services, security controls must be verified rather than assumed.

## Required review areas

- Supabase RLS and tenant isolation
- Authentication and account recovery
- Server-side authorization and role checks
- API input validation
- Rate limiting and abuse prevention
- AI, payment, webhook and provider secret handling
- Webhook authenticity and idempotency
- Billing authorization
- Provider credential isolation
- Admin/security audit logging
- Safe error handling

## Security principles

1. Client-side checks are UX only; they are never authorization.
2. Every customer-scoped operation must derive ownership from the authenticated session/server context.
3. Provider secrets stay server-side.
4. Webhooks must be authenticated before changing state.
5. Sensitive operations should be auditable.
6. Errors shown to users must not disclose internal secrets, stack traces or other tenants' data.
7. AI tools must be narrowly scoped and must not gain infrastructure mutation privileges by default.
8. Automated remediation must require an explicit, authenticated provider capability.

## Production gate

The security control centre intentionally reports HostSuite as not production-ready until required controls are individually verified and marked implemented.

This milestone establishes the checklist and security boundary. It does not falsely certify the existing application. The remaining work is to inspect and harden the actual authentication, database policies, APIs, webhooks and deployment configuration before production provider credentials are added.
