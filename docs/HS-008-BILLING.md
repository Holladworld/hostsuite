# HS-008 — Billing Foundation

## Why this milestone exists

HostSuite will eventually sell domains, hosting, email, websites, support and managed services. Billing needs to be defined before provider provisioning is wired in so a paid service cannot be confused with a merely requested service.

## Current repository reality

A repository search found no existing Paystack or Flutterwave implementation. This milestone therefore does not pretend either gateway is already connected.

## Implemented

`lib/billing.ts` defines:

- payment providers (`paystack`, `flutterwave`, `manual`)
- NGN/USD currency vocabulary
- one-time/monthly/annual billing intervals
- invoice status
- payment status
- line items
- quotes
- invoices
- payment attempts
- minor-unit currency calculations
- provider capability boundary

## Important boundary

No payment API keys, checkout redirects, webhook handlers, subscription creation, refunds or provider calls are added in this milestone.

Those require verification of the actual merchant accounts, credentials, webhook requirements, supported currencies and recurring-payment capabilities.

## Architecture rule

Payment completion and service provisioning must be separate state transitions:

`invoice/payment confirmed -> service provisioning -> service active`

A client-side success page must never be treated as proof that money was received.

## Provider plan

- Paystack: likely primary Nigerian payment provider, subject to account/API verification.
- Flutterwave: supported as a second provider, subject to account/API verification.
- USD receiving/payment provider: do not assume that a receiving account is equivalent to a checkout/payment gateway. It should be evaluated separately for merchant payments, settlement, supported countries/currencies and API/webhook capabilities.

## Next billing work

After the merchant accounts and desired currencies are confirmed, implement a server-side payment adapter and webhook verification. Do not put secret keys in client-side code.
