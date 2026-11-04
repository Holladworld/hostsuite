# HS-015 — AI HostSuite Assistant

## Goal

Give customers a simple technical-help interface while reducing unnecessary manual investigation by the HostSuite team.

## Customer experience

A customer can describe a problem in normal language, for example:

> My website isn't working.

The assistant can then use verified HostSuite diagnostic tools to inspect:

- Domain
- DNS
- SSL
- Hosting
- HTTP availability
- Monitoring

For email-related problems, the assistant can later use the email-health checks established by the monitoring/provider layers.

## Response rules

The assistant must distinguish between:

1. Verified healthy condition.
2. Verified problem.
3. Check unavailable.
4. Inconclusive diagnosis.
5. Human escalation required.

It must never claim that a check was performed when it was not.

## Escalation

When the available checks do not explain or resolve the problem, the assistant should create or update a support/incident workflow and explain to the customer that a technical team member needs to handle it.

## Tool boundary

The AI model is not itself the infrastructure control plane. It should receive narrowly scoped, authenticated tool results. Infrastructure mutations require explicit server-side tools with authorization, validation, auditability and provider adapters.

## API key

The production AI provider/API key will be configured later as a server-side secret. It must never be exposed to browser code.

## Current milestone

HS-015 establishes the customer interface and diagnostic domain model. Live AI inference, authenticated diagnostic tools, support integration, provider-specific checks and production credentials are intentionally connected in the later integration/security work rather than simulated here.
