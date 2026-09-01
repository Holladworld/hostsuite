# HS-014 — Automation

## Goal

Reduce routine manual work without allowing unsafe automation to mutate customer infrastructure from the browser.

## Initial event types

- Domain approaching expiry
- Website outage
- SSL approaching expiry
- Backup failure
- Email health issue
- Payment failure

## Response pattern

For infrastructure incidents:

1. Receive event.
2. Verify the condition.
3. Record the result.
4. Notify the customer when appropriate.
5. Create an incident for confirmed outages.
6. Attempt remediation only when a provider adapter explicitly supports the operation and the action is safe.
7. Create a support task when automation cannot resolve the issue.
8. Notify an administrator for cases requiring human intervention.

## Domain renewal messaging

The model includes the intended warning thresholds without claiming that domain expiry data is currently connected to a registrar:

- More than 18 days: no expiry alert.
- 18 days or fewer: renewal planning notice.
- 7 days or fewer: urgent renewal notice.
- Expired: attention required.

## Safety boundary

Automation is a control-plane workflow. Browser code must never directly perform provider mutations. Scheduled jobs, webhooks and provider actions must be authenticated, idempotent where possible, auditable and isolated from customer credentials.

Actual scheduled execution and provider mutations are deferred until the provider integration and security milestones are complete.
