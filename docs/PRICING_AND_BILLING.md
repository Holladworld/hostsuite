# HostSuite Pricing & Billing Model

## Purpose

HostSuite is not positioned as a low-cost hosting reseller. Hosting, domains and email are infrastructure inputs; the product is the business's digital operations layer: build it, launch it, keep it running, and get help when something goes wrong.

Prices are data, not code. Admin must be able to change prices, costs, promotions, credits and tax/payment rules without a deployment.

## 1. Four revenue categories

### Infrastructure

Supplier-backed or usage-backed products:
- domains
- hosting
- business email
- storage/add-ons
- deployment infrastructure
- AI infrastructure

Target: usually 15–40% gross margin depending on price sensitivity and support burden. Do not use a universal supplier markup.

### Build

Outcome-based services:
- AI website build
- AI app build
- website design
- migration
- custom development

Target: generally 60%+ gross margin where practical because these services consume time and/or AI compute.

### Care

Recurring responsibility:
- monitoring
- backups
- updates
- managed website operations
- managed email/domain operations
- managed hosting

Target: generally 50–70%+ gross margin depending on included human support.

### Help

Human or emergency intervention:
- troubleshooting
- website rescue
- developer takeover
- migration assistance
- emergency technical desk
- custom changes

Use fixed service fees and/or included support time. Do not price these as a percentage of supplier cost.

## 2. Recommended public packaging

Keep the public pricing simple:

### Self-Service

For customers who know what they need. Buy individual products and usage credits.

### Managed

For customers who want HostSuite to keep their digital infrastructure running. Recurring monthly/yearly plan with included monitoring, backups and defined support.

### Business

For businesses where downtime or technical problems have a higher cost. Higher support priority, stronger monitoring and a defined emergency allowance.

Individual products remain available underneath these packages.

## 3. Infrastructure pricing rule

For each supplier-backed product, store:

- supplier
- supplier product/reference
- supplier cost
- supplier currency
- applicable supplier tax/fees
- HostSuite retail price
- target gross margin
- minimum allowed gross margin
- effective date

The billing engine may calculate a suggested retail price, but Admin controls the final retail price.

Gross margin formula:

`(retail_price - total_direct_cost) / retail_price * 100`

Do not confuse markup with margin. A 50% markup on a ₦10,000 cost is ₦15,000 retail and only 33.3% gross margin. A 50% gross margin requires ₦20,000 retail before tax/payment fees.

## 4. Recommended starting margin bands

These are strategy defaults, not hard-coded product prices:

| Category | Starting gross-margin target | Reason |
| --- | ---: | --- |
| Domain | 15–25% | Highly price-sensitive commodity; cross-sell opportunity |
| Basic hosting | 25–40% | Commodity infrastructure plus HostSuite convenience |
| Business email | 35–50% | Includes setup/support burden |
| Monitoring-only | 50–70% | Mostly software/automation |
| Managed care | 50–70%+ | Recurring operational responsibility |
| AI builder | 60–75%+ | Must absorb variable model/sandbox costs |
| Human technical support | 60%+ | Pays for expertise/time |
| Emergency support | 65%+ | Priority and opportunity-cost premium |

These bands can be overridden per product.

## 5. Do not compete on raw hosting price

If a supplier offers very cheap shared hosting, HostSuite should not attempt to win the market by being ₦100 cheaper. The customer is buying convenience and responsibility:

`hosting + monitoring + backup + support + a simple dashboard + someone to call`

A customer who only wants the cheapest raw hosting is not the primary HostSuite customer.

## 6. AI builder billing

AI builder usage must be metered. Never assume one prompt equals one fixed cost.

Track internally:
- model/provider
- input usage
- output usage
- generation/build count
- sandbox/runtime cost where applicable
- deployment cost where applicable

The customer sees HostSuite credits, not model token accounting.

Recommended commercial model:

1. Include a small starter allowance where appropriate.
2. Sell AI credit packs/top-ups.
3. Allow BYOK for advanced users where supported.
4. Keep deployment/hosting as a separate service or managed package.
5. Do not let AI usage silently create unlimited HostSuite liability.

## 7. Discounts

Discounts are rules, not hard-coded exceptions.

Supported mechanisms:
- first-purchase discount
- returning-customer/loyalty discount
- referral reward
- promotional code
- bundle discount
- service-specific discount
- customer-specific credit

Rules must support:
- percentage or fixed discount
- start/end dates
- minimum order amount
- maximum discount amount
- usage limit
- per-customer limit
- eligible products/categories
- first-order-only flag
- stackable/non-stackable flag
- minimum gross-margin guard

Never allow a discount to reduce an order below the configured minimum margin unless an Admin explicitly overrides it.

## 8. Referral rewards

Prefer HostSuite account credit over cash rewards during the early stage. Example:

Customer A refers Customer B -> B completes a qualifying paid order -> A receives HostSuite credit.

Credits should have:
- value
- expiry
- source
- status
- qualifying order/reference

This creates retention without immediately creating cash liabilities.

## 9. Payment fees

Payment processor costs are configurable by provider. Do not bake Paystack or Flutterwave charges into product prices.

For each provider configure:
- percentage fee
- fixed fee
- cap
- currency
- whether HostSuite absorbs the fee
- whether the fee may be passed to the customer

Payment verification must happen through signed/verified provider webhooks or server-side verification before an order is marked paid.

## 10. Tax

Tax is configurable and should not be permanently hard-coded into product prices. For Nigeria, the currently documented VAT rate is 7.5%, but the tax engine must allow the applicable rate and taxable status to change by jurisdiction/product. citeturn0search12

Store:
- jurisdiction
- tax name
- rate
- inclusive/exclusive behavior
- taxable categories
- effective dates
- active status

This is a billing configuration, not tax advice.

## 11. Checkout calculation order

Use this conceptual order:

1. Load active product prices.
2. Freeze a price snapshot for the order.
3. Calculate line totals.
4. Apply eligible promotions.
5. Apply customer credits.
6. Apply tax according to the configured tax rule.
7. Calculate payment fee according to provider configuration.
8. Enforce minimum-margin rules where applicable.
9. Create invoice/order with an immutable pricing snapshot.
10. Redirect to payment.
11. Verify payment server-side/webhook.
12. Mark paid and grant the purchased entitlement.

The order must never depend on today's product price after it has been created.

## 12. Example economics

Illustrative only:

Supplier cost: ₦10,000

Desired gross margin: 50%

Required retail before tax/payment fee:

`₦10,000 / (1 - 0.50) = ₦20,000`

If a promotion reduces the customer price to ₦16,000, gross margin becomes 37.5%. The billing engine should allow it only if the product's configured minimum margin permits it.

## 13. Admin controls

Admin/CMS should eventually provide:

- Products
- Price versions
- Supplier costs
- Margin targets
- Promotions
- Customer credits
- Referral rules
- Tax rules
- Payment fee rules
- AI credit packs
- Subscriptions
- Invoices
- Orders
- Payment events
- Usage
- Pricing history/audit log

The Admin UI must show both customer price and internal economics where appropriate. Internal cost/margin information must never be exposed to customers.

## 14. Initial public pricing strategy

Do not publish a huge table of infrastructure prices until the real supplier contracts and current costs are confirmed.

At launch, use three public anchors:

- **Self-Service:** pay for exactly what you need.
- **Managed:** HostSuite keeps it running for you.
- **Business:** priority support and stronger operational coverage.

Then show a small number of high-intent entry prices only after supplier costs are verified.

This prevents HostSuite from promising prices that become unprofitable when WhoGoHost/Go54, email, AI or payment costs change.

## 15. Non-negotiable business rule

HostSuite should optimize for **customer lifetime value and operational margin**, not the cheapest first transaction.

The desired journey is:

`Domain/Email/Website need -> Build/Launch -> Managed care -> Support/Rescue -> Repeat services`

That lets HostSuite use commodity infrastructure without becoming another commodity hosting company.
