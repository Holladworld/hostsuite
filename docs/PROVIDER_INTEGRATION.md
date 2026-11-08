# HostSuite Provider Integration

## Goal
HostSuite is the customer-facing control layer. Supplier/provider implementations stay behind adapters so changing a registrar, hosting provider, email provider, or deployment target does not require rewriting customer flows.

## Current state
WhoGoHost/Go54 has **not** been hard-coded as a live provisioning integration because the reseller/API capabilities and credentials have not yet been verified. The adapter contract is implemented first; live provider operations remain unavailable until the provider's documented API and account capabilities are confirmed.

## Provider layers

- `domain`: search, register, renew, transfer, DNS, nameservers, contacts, expiry
- `hosting`: provision, suspend, unsuspend, usage, control-panel access
- `email`: mailbox creation, password/reset, webmail, MX/SPF/DKIM/DMARC status
- `deployment`: deploy project, deployment status, custom domain mapping

Each provider should implement only the capabilities it actually supports. Unsupported operations return a typed `NOT_SUPPORTED` result rather than pretending the action succeeded.

## Security

Provider API credentials are server-only. Never put them in `NEXT_PUBLIC_*`, browser code, generated projects, or customer-visible responses.

Store secrets in the deployment platform's encrypted environment/secret store. HostSuite should persist provider account identifiers and non-secret metadata, not raw provider passwords/tokens.

## WhoGoHost / Go54 setup later

When the reseller account is purchased, verify from official documentation/account support:

1. reseller API availability and authentication method
2. domain registration/renewal/transfer endpoints
3. DNS management capabilities
4. hosting provisioning/control-panel endpoints
5. email/mailbox provisioning API, if available
6. suspension/unsuspension and renewal hooks
7. usage/quota information
8. webhook/event support
9. API rate limits
10. reseller terms and permitted automation

Only after verification should a live provider adapter be enabled.

## Configuration

The adapter selection is environment/configuration driven. A development environment can use a mock provider. Production can enable the verified provider without changing customer-facing code.

Suggested server variables (names may change after provider documentation is verified):

- `HOSTING_PROVIDER`
- `WHOGOHOST_API_BASE_URL`
- `WHOGOHOST_API_KEY`
- `WHOGOHOST_API_SECRET`
- `WHOGOHOST_RESELLER_ID`

Do not add real credentials to git.
