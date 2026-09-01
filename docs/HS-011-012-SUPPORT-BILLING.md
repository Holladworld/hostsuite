# HS-011 + HS-012 — Support and Billing Foundation

This combined branch intentionally delivers the customer-facing foundations for support and billing together. The roadmap numbers remain HS-011 (Support + Emergency Desk) and HS-012 (Billing).

## Support

- Customer-friendly problem selection.
- Priority classification: normal, high and emergency.
- Emergency categories include website outage.
- Support intake form.
- Explicit future path for diagnostics, notifications and escalation.

The current UI does not claim to create a persisted ticket or perform emergency remediation. Those require a backend and real notification/monitoring integrations.

## Billing

- Customer billing page.
- Data model for one-time purchases, recurring services, payments and subscriptions.
- Support for monthly/yearly/one-time service intervals.
- Payment states including pending, paid, failed, cancelled and refunded.
- Renewal and auto-renew fields.

The current UI does not claim that a payment was charged. Paystack/Flutterwave checkout, signature-verified webhooks, reconciliation, recurring charging, invoices and service suspension/recovery require production payment configuration.

## Infrastructure rule

Support and billing are control-plane concerns. Customer websites and application runtimes must remain on their selected infrastructure; these features must not turn the HostSuite web server into a customer runtime.

## Required production setup later

- Payment provider credentials.
- Server-side webhook verification secret/signature configuration.
- Public HTTPS webhook URL.
- Email/notification provider for support and billing messages.
- Database persistence for tickets, invoices, subscriptions and payment events.
- Provider-specific recurring billing support, if offered by the selected payment provider.
