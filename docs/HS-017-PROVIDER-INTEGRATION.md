# HS-017 — Provider Integration

## Verified WhoGoHost / GO54 facts

WhoGoHost states that its reseller hosting is white-label and provides a central management environment. Current public material says shared and reseller hosting use DirectAdmin, while its domain reseller program provides an API. citeturn0search0turn0search7

The official domain-reseller documentation explicitly confirms API operations including domain registration, transfer, renewal, contact details, DNS records, nameservers, email forwarding, registrar lock and EPP-code retrieval. citeturn0search11

WhoGoHost also documents that a custom solution can use the domain reseller API without WHMCS. citeturn0search2turn0search13

Reseller hosting documentation confirms that hosting accounts can be created from WHM using a hosting package, with a control-panel account and resource limits. The current reseller material identifies DirectAdmin as the control panel. citeturn0search18turn0search19

WhoGoHost offers business email hosting, but this milestone does **not** assume that reseller-level mailbox provisioning is available through the same API. That capability must be verified from the actual reseller account/API documentation before HostSuite automates mailbox creation. citeturn0search14

## Adapter architecture

```text
HostSuite customer/admin UI
          ↓
HostSuite server-side service layer
          ↓
Provider adapter interface
          ↓
WhoGoHost / GO54 adapter
          ↓
Provider API / control plane
```

The provider is replaceable. HostSuite business logic must not depend on a provider-specific dashboard or response format.

## Capability status

### Confirmed from public provider documentation

- Domain search / registration workflow
- Domain registration
- Domain transfer
- Domain renewal
- Domain contact management
- DNS read/write
- Nameserver read/write
- Email forwarding
- Registrar lock / EPP operations
- Hosting account creation workflow
- Hosting control-panel access

### Not yet verified for HostSuite automation

- Automated reseller hosting suspension
- Programmatic hosting usage retrieval
- Automated mailbox creation for reseller customers
- Automated mailbox access provisioning
- Backup management API
- SSL automation API

These must remain disabled until the actual account and provider documentation confirm them.

## Critical boundary

No provider credentials are committed to the repository. The adapter currently returns `PROVIDER_NOT_CONFIGURED` rather than pretending to perform a live operation.

Before enabling production operations, configure provider credentials as server-side secrets and verify each capability against a real reseller account.

## HostSuite infrastructure principle

Customer-owned infrastructure remains supported. HostSuite is the control plane, not the runtime for every customer's website. A customer can use HostSuite-managed hosting when they purchase it, or connect infrastructure they already own where the integration supports it.
