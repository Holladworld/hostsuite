# HS-002 — HostSuite Product Foundation

## Goal

Define the product model before adding customer-facing flows or provider integrations.

## Core promise

HostSuite gives a person or business one simple place to get online, keep their digital infrastructure running, and choose whether to manage it themselves or have HostSuite manage it.

## Service categories

### Websites
- Website hosting and management
- AI Website Builder
- Custom website/app development

### Domains & Email
- Domain registration and management
- DNS management
- Business email

### Infrastructure
- Hosting
- SSL
- Backups
- Monitoring

### Technical Support
- Guided self-service
- Managed support
- Migration/recovery
- Emergency response
- Managed web operations

## Customer operating modes

Every applicable service supports one or more of:

- `self_service`: customer can perform the operation from HostSuite.
- `managed`: HostSuite performs or manages the operation.
- `hybrid`: customer controls some operations while HostSuite handles agreed responsibilities.

The UI should make these choices obvious and avoid technical jargon.

## Service discovery

The first customer decision should be intent, not infrastructure terminology:

- I need a website
- I need a domain
- I need business email
- I need hosting
- I already have a website
- Something is wrong
- I want to move my website here
- I need custom technology
- I'm not sure

`lib/product.ts` contains the initial deterministic decision rules. These rules can later be supplemented by AI without making AI a dependency for basic onboarding.

## Business email rule

Business email is a first-class service. A customer does not need to arrive with an existing email setup. If they need email and do not have a domain, the onboarding flow should recommend obtaining/connecting a domain first, then configuring a mailbox.

## Website journey

A website customer should be able to choose:

1. Build it themselves with the AI website builder.
2. Connect/migrate an existing website.
3. Ask HostSuite/Vobels to build or manage it.

After publishing, the same HostSuite account should expose domain, hosting, SSL, backup and monitoring actions.

## Provider abstraction

Customer-facing product records must not depend directly on Whogohost/Go54 implementation details. `HostSuiteServiceInstance` can optionally reference an external provider through `ProviderServiceRef`.

Provider-specific provisioning belongs in an adapter/service layer. This allows the reseller provider to be selected after its actual API capabilities are verified.

## Data model direction

The current repository has separate lead/client/domain/ticket types. The next data-model iteration should introduce a normalized service layer around:

- customers
- service instances
- service plans
- provider references
- subscriptions/orders
- domains
- websites
- mailboxes
- monitoring targets
- support requests
- usage/events

Do not remove existing tables/types until their current consumers are migrated.

## Product rules

1. Simplicity is a product requirement, not just marketing copy.
2. Self-service should be the default where a safe automated action exists.
3. Managed service should always be available where manual intervention is appropriate.
4. A customer should never need to know the underlying infrastructure provider to use HostSuite.
5. Automation should reduce repetitive support work.
6. AI is an enhancement; core account, billing, service and support flows must work without an AI model.
7. Real monitoring data must replace simulated marketing metrics before production claims are made.
8. Claims such as uptime SLAs or customer logos must be backed by real evidence.

## Next milestone

HS-003 will implement the customer onboarding/service-discovery flow using this vocabulary. It should be designed as a guided flow that can route a customer into self-service, managed service, or guided support.
