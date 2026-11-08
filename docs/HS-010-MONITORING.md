# HS-010 — Monitoring

## Implemented

- Monitoring domain model for uptime, SSL, DNS, response time, website availability, email health and backups.
- Customer monitoring page at `/portal/monitoring`.
- Explicit `Not checked yet` state instead of simulated health results.
- Monitoring status vocabulary for future incidents and support escalation.
- Architecture boundary keeping scheduled checks outside the normal HostSuite web request path.

## Architecture

The HostSuite Next.js application should not become the monitoring engine. A future worker or external monitoring provider should perform scheduled checks and write verified results back to HostSuite.

The eventual flow is:

Check → verify transient failure → record event → notify customer → escalate to support/emergency desk when appropriate.

## Deliberate non-goals

This milestone does not claim to perform real uptime checks, DNS checks, SSL checks, email checks, backup checks, automated remediation or incident creation. Those require a real worker/provider and persistent monitoring data.

## Next integration requirements

When selecting the monitoring implementation, prefer a system that can scale independently of the HostSuite web application and can expose webhook/API results. Provider credentials should remain server-side.
