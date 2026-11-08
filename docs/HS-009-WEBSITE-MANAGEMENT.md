# HS-009 — Website Management

## Scope

This milestone establishes the customer-facing website management experience and keeps website runtime infrastructure separate from the HostSuite application server.

## Implemented

- `/portal/websites` customer page.
- Website health, SSL, backup and monitoring status model.
- Links between website builder, domains and hosting.
- Explicit infrastructure ownership messaging.
- Website management action vocabulary for future provider adapters.
- No simulated deployment, SSL issuance, backup execution, monitoring result, or hosting provisioning.

## Infrastructure boundary

HostSuite acts as a control plane. Customer websites should run on HostSuite-managed provider infrastructure, the customer's existing hosting, or customer-owned infrastructure. The Next.js HostSuite application should not become the runtime server for every customer's website.

## Data boundary

The current repository does not yet expose a persistent website-project table that can safely be assumed for this milestone. Therefore the page does not invent a database schema or claim that generated drafts are persisted.

## Next integration work

Later milestones can connect this UI to real website projects, deployment targets, monitoring, backups, SSL and provider APIs. Provider-specific actions must remain behind adapters so the HostSuite application is not coupled to one infrastructure vendor.
