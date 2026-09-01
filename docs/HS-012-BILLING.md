# HS-012 — Flexible Billing

## Product model

HostSuite does not require every customer to buy a bundle. A customer may buy a single service, combine services, subscribe to a managed package, or consume metered/credit-based features.

Supported billing modes:

- One-time: website work, selected setup services, etc.
- Subscription: hosting, email, monitoring, managed operations, etc.
- Metered: usage-based features such as AI credits when the final provider cost requires it.

Prices are stored as data in `billing_products`, so the Admin/CMS can change selling prices without a code deployment. Provider costs and margins are internal and are not exposed to customers.

## Billing flow

```text
Customer selects service(s)
        ↓
HostSuite reads active catalog prices
        ↓
Create pending order + immutable line items
        ↓
Create invoice
        ↓
Payment provider checkout
        ↓
Provider webhook
        ↓
Verify transaction server-to-server
        ↓
Match reference + amount + currency
        ↓
Mark order/invoice paid
        ↓
Grant the appropriate service entitlement
```

The browser is never trusted for the final amount. The server reads the current product price from Supabase before creating the order.

## Payment provider boundary

Paystack initialization is server-side and uses the provider's current transaction initialization API. Paystack expects amounts in the currency subunit and provides transaction verification by reference. Its webhook events carry an `x-paystack-signature` HMAC-SHA512 signature. citeturn0search3turn0search1

Flutterwave remains supported as a second provider boundary. Its current documentation requires signed webhook handling and recommends re-verifying transaction status, amount, currency and reference before granting value. citeturn0search0turn0search7

## Idempotency

Orders have an `idempotency_key`. Provider webhook events have a unique `(provider,event_id)` key. Duplicate webhook delivery must not grant the customer the service twice.

## Pricing strategy

Initial prices should be configured after actual provider costs are known. This is especially important for WhoGoHost hosting/domain/email costs and AI provider usage. The billing engine therefore does not contain arbitrary hard-coded customer prices.

Recommended customer-facing structure:

- Individual services for customers who need one thing.
- Managed packages for customers who want HostSuite to handle their digital operations.
- Add-ons for extra capacity or specialized support.
- AI credits/allowances for AI usage where the underlying model has variable cost.

The customer should experience the outcome — **Build it. Launch it. Keep it running. Get help when something goes wrong.** — rather than provider-specific infrastructure pricing.

## Production setup still required

- Paystack secret key
- Paystack webhook URL/configuration
- Flutterwave secret key and webhook secret hash if Flutterwave is enabled
- Supabase service-role key in the server environment only
- Real product prices entered through Admin/CMS
- Provider cost/margin review before publishing prices
- End-to-end test payments in provider test/sandbox mode before live mode

No production payment credential is committed to this repository.
