# HS-012 — Flexible Billing

HostSuite billing supports individual services, bundles, recurring services and usage/credit-based products. Prices live in `billing_products`, so Admin/CMS can change selling prices without a deployment.

## Flow

```text
Customer selects service(s)
        ↓
Server reads current catalog price
        ↓
Pending order + immutable line items
        ↓
Invoice
        ↓
Paystack or Flutterwave checkout
        ↓
Signed webhook
        ↓
Server-to-server transaction verification
        ↓
Reference + amount + currency validation
        ↓
Order/invoice paid
        ↓
Service entitlement granted
```

The browser never supplies the authoritative amount. Provider webhooks are signature-checked, stored idempotently, and transaction data is re-verified before value is granted.

Paystack's current API uses backend transaction initialization and verification, expects the amount in the currency subunit, and signs webhooks with `x-paystack-signature` using HMAC-SHA512. citeturn0search3turn0search1

Flutterwave's current documentation supports server-side Standard checkout and signed webhooks; it recommends verifying status, amount, currency and transaction reference before giving value. citeturn0search4turn0search0turn0search7

## Product types

- One-time: website work, setup and selected domain/service purchases.
- Subscription: hosting, email, monitoring and managed operations.
- Metered: variable-cost capabilities such as AI usage.
- Bundles: managed packages composed from multiple services.

## Pricing philosophy

HostSuite is not competing with commodity hosting companies. Customers can buy one service or choose a managed relationship. The customer sees the outcome — **Build it. Launch it. Keep it running. Get help when something goes wrong.** — while provider costs and margins remain internal.

Initial prices should be entered after actual provider costs are known, especially WhoGoHost domain/hosting/email costs and the chosen AI provider's usage costs.

## Production setup

- `SUPABASE_SERVICE_ROLE_KEY` — server-only
- `PAYSTACK_SECRET_KEY` if Paystack is enabled
- Paystack webhook URL: `/api/billing/paystack/webhook`
- `FLW_SECRET_KEY` if Flutterwave is enabled
- `FLW_SECRET_HASH` if Flutterwave is enabled
- Flutterwave webhook URL: `/api/billing/flutterwave/webhook`
- Product/pricing records in `billing_products`
- Test-mode end-to-end payment verification before live mode

No payment credential belongs in the repository.
