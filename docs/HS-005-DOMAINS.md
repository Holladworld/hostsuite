# HS-005 — Domains

## Scope

This milestone adds a customer-facing domain management view using the repository's existing `domains` data.

## Implemented

- Authenticated `/portal/domains` page.
- Loads domains for the signed-in user from the existing `domains` table.
- Displays connected-domain count, SSL-active count, and domains requiring attention.
- Displays existing domain, plan, status, SSL, uptime and last-backup fields.
- Provides empty state and links into the existing `/get-started` flow.
- Provides a refresh action.
- Reuses existing HostSuite UI primitives and Supabase client.

## Explicitly not implemented

No registrar/provider behaviour is simulated.

The page does not claim to perform:

- domain availability checks
- domain registration
- domain renewal
- domain transfer
- DNS mutations
- provider provisioning

Those capabilities require a verified domain-provider integration and will be implemented only after the provider contract is known.

## Data boundary

The page uses the existing `DomainRow` shape. No new domain tables or columns are assumed in this milestone.

## Security boundary

The page queries domains with the authenticated user's ID, matching the existing portal pattern. Server-side authorization and RLS still need a dedicated security audit before production.

## Next

The next domain milestone should establish the provider integration contract after the actual reseller/registrar capabilities are verified. Until then, the UI remains informational and routes users through existing service/support flows.
