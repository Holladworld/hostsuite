# HostSuite HS-001 — Architecture & Production Audit

Date: 2026-09-01
Branch: `feature/hs-001-audit`

## Scope

This audit establishes the baseline for the HostSuite rebuild. `main` is intentionally untouched. Work will be developed on feature branches and merged into `staging` only after each feature is reviewed.

## Product direction

HostSuite is a digital infrastructure platform for businesses and individual users. It combines:

- self-service domains, hosting, websites, business email and related infrastructure;
- managed web/IT operations for customers who prefer HostSuite to handle the work;
- monitoring and proactive issue detection;
- technical support and emergency response;
- website development and custom engineering;
- an open-source AI website builder that can take a user from business description to a published website.

The central UX principle is: **simple for the customer, sophisticated behind the scenes.**

For major actions, HostSuite should offer three paths where appropriate: **Do it myself**, **Let HostSuite do it**, or **Get help**.

## Current technical baseline

- Next.js 13.5.1 / React 18.2
- TypeScript 5.2
- Tailwind CSS + shadcn/Radix UI
- Supabase authentication/data
- Framer Motion
- Recharts
- Nodemailer
- Netlify Next.js plugin

The current application already contains public pages, services, pricing, diagnostic tooling, portal authentication, customer dashboard, admin routes, API routes, blog/knowledge content and Supabase helpers. These are valuable foundations and should be refactored rather than discarded wholesale.

## Key findings

### P0 — Production/security

1. **Admin route protection is client-side only.** `middleware.ts` explicitly allows every `/admin/*` request through because it cannot read the current localStorage session. Server-side authorization/RLS must become the real security boundary before production.
2. **Customer data model is too domain-centric.** Current types primarily model clients, domains and support tickets. The target model needs first-class service instances for hosting, websites, email, SSL, backups, monitoring, subscriptions and provider identifiers.
3. **Provider integration is not yet abstracted.** Whogohost/Go54 must sit behind a provider adapter/service layer. The UI and business logic must not depend directly on provider-specific details.

### P1 — Product/UX

4. The current public messaging is technically sophisticated but too infrastructure-heavy for nontechnical business owners.
5. The current portal is a useful support/domain dashboard but needs to become a unified digital-infrastructure control center.
6. Support currently starts with ticket terminology. The target UX should start with the user's problem and route it to automation, self-service or human support.
7. Business email must be a first-class onboarding/service flow, including the case where a customer has neither a domain nor email.
8. The current diagnostic/health experience should evolve from presentation/demo behavior into real checks and actionable remediation.

### P1 — Trust/claims

9. Marketing claims and customer/trust references must be evidence-based. Any simulated uptime/ping/health figures, unsupported customer logos, guaranteed metrics or absolute deliverability claims must not be presented as real operational evidence.

### P2 — Architecture

10. The existing types should be expanded around a service-oriented model rather than continuing to add unrelated fields to `DomainRow`.
11. Billing, provisioning, monitoring and support should be represented as separate bounded capabilities connected through stable internal IDs.
12. AI website generation should be isolated from deployment/infrastructure so the model or open-source builder can change without rewriting HostSuite.

## Target architecture

```text
                         HOSTSUITE
                             |
             +---------------+----------------+
             |                                |
       Customer Experience               Operations
             |                                |
   +---------+----------+             +-------+--------+
   |         |          |             |        |       |
 Portal   Onboarding  Website      Billing  Monitor  Support
   |         |          |             |        |       |
   +---------+----------+-------------+--------+-------+
                             |
                     HostSuite Service Layer
                             |
        +--------------------+--------------------+
        |                    |                    |
   Provisioning          Automation          AI Services
        |                    |                    |
   Provider Adapter     Jobs/Events        Website Builder
        |
   +----+----------------------+
   |                           |
Whogohost/Go54             Future provider
```

## Target customer journey

### Customer with no digital infrastructure

`Need a website` → choose/build website → domain search → business email → hosting/deployment → SSL → monitoring → publish.

### Customer with an existing website

`I already have a website` → identify provider → connect or migrate → choose DIY/Managed/Hybrid → verify domain/SSL → monitor.

### Customer with a problem

`Something is wrong` → diagnostic questions/checks → automated fix if safe → self-service instructions if appropriate → support/escalation when needed.

## Initial data model direction

The eventual schema should include concepts similar to:

- `profiles`
- `organizations`
- `organization_members`
- `services`
- `service_instances`
- `domains`
- `websites`
- `hosting_accounts`
- `email_accounts`
- `ssl_certificates`
- `backups`
- `monitoring_checks`
- `incidents`
- `support_tickets`
- `subscriptions`
- `invoices`
- `payments`
- `provider_accounts`
- `provider_resources`
- `website_projects`
- `website_generations`
- `automation_jobs`
- `audit_logs`

All customer-owned resources must have a clear tenant/organization boundary and enforce access through server-side authorization and Supabase RLS.

## Branching/merge policy

- `main`: protected by process; no work directly on it during this project.
- `staging`: integration branch for user acceptance testing.
- `feature/*`: isolated work for each feature or audit milestone.
- Bug fixes found during staging are handled in `fix/*` branches and merged back into `staging`.
- `staging` is merged into `main` only after explicit user approval.

## Build order

1. HS-001 audit and foundation
2. HS-002 product/service model
3. HS-003 onboarding and service discovery
4. HS-004 customer portal
5. HS-005 domains
6. HS-006 hosting/provider abstraction
7. HS-007 business email
8. HS-008 AI website builder
9. HS-009 website management
10. HS-010 monitoring
11. HS-011 support/emergency desk
12. HS-012 billing
13. HS-013 admin operations
14. HS-014 automation
15. HS-015 AI assistant
16. HS-016 security hardening
17. HS-017 provider integration
18. HS-018 public website/landing redesign
19. full QA and staging acceptance
20. explicit approval → merge staging to main

## Exit criteria for HS-001

- Audit is committed to the feature branch.
- `main` remains untouched.
- `staging` exists and remains the integration branch.
- Major production/security/product risks are documented.
- Target architecture and build order are documented.
- Subsequent feature branches use this document as the baseline.
