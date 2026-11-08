# HS-007 — Business Email Service Entry

## Scope

Adds the customer-facing entry point for HostSuite business email.

## Implemented

- `/portal/email`
- Existing HostSuite visual primitives
- Existing `/get-started` entry point
- Separate guidance for customers who already have a domain and customers who do not
- Explicit provider-integration boundary

## Not implemented

This milestone does not invent or simulate:

- mailbox creation
- mailbox credentials
- email provider APIs
- DNS/MX changes
- mailbox billing
- email delivery monitoring

Those require a verified provider contract.

## Product behavior

Business email is treated as a first-class HostSuite service. A customer can start the journey even when they do not already have a domain. The domain-first dependency is explained without requiring the customer to understand DNS or mail infrastructure.

## Next

When an actual email provider/reseller is selected and its capabilities are verified, add provider adapters and real provisioning behind this page rather than changing the customer-facing product concept.
