# HS-013 — Admin + CMS

## Product goal

HostSuite should be operable without editing application code for routine business and content changes.

## Admin operations

The admin control centre covers:

- Customers
- Services
- Domains
- Hosting
- Websites
- Business email
- Support
- Incidents
- Payments
- Renewals
- Monitoring
- AI builder usage
- Managed customers

## CMS

The admin area also establishes a CMS boundary for public-site content:

- Site settings
- Branding: logo, favicon, support contact details and approved visual settings
- Pricing plans: create, edit, reorder, activate/deactivate and set billing interval
- Blog: drafts, publishing, editing, slugs, excerpts, author and featured images

## Important boundary

The initial HS-013 UI establishes the control surface and data models. It does not claim that the listed operations are already backed by persistent admin APIs. Provider actions, payment actions and customer-impacting writes must be connected to authenticated server-side APIs and authorization checks.

The CMS should store editable content rather than requiring source-code changes. Public pages will consume this content in a later implementation pass.

## Security requirement

Only authorized administrators may access the admin surface. Provider credentials and service secrets must never be editable or displayed through ordinary CMS controls. Authorization, RLS, API validation, audit logging and rate limiting are finalized in HS-016.
