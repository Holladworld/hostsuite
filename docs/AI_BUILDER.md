# HostSuite AI Builder

## Product boundary
HostSuite has two AI capabilities:

1. **AI Assistant** — support, diagnostics, explanations and escalation.
2. **AI Builder** — prompt-to-website/app generation, preview and deployment.

They are separate product capabilities even though they share the same AI gateway and billing/usage system.

## Current HostSuite implementation
The existing generator produces a validated structured website definition. The server-side AI gateway is provider-agnostic and uses an OpenAI-compatible HTTP contract so the model/provider can change without changing the customer UI.

This is intentionally not described as a full Bolt/Lovable clone. A full agentic builder needs a project workspace, iterative file editing, preview/build execution, deployment and isolation.

## OpenThorn integration decision
OpenThorn is the selected candidate for the full agentic builder. It is MIT-licensed and currently provides prompt-to-code generation, browser preview, code export and Cloudflare Pages deployment. It supports BYOK providers and stores provider keys encrypted. See the upstream project before each upgrade:

https://github.com/BuildingTechAlternatives/OpenThorn

HostSuite should integrate OpenThorn as the builder engine rather than reimplement its agent loop. The integration boundary should be:

`HostSuite -> authenticated builder session/project -> OpenThorn -> preview/export/deploy`

Do not copy provider credentials into HostSuite's browser, generated projects, or customer-visible API responses.

## Deployment model
Generated customer websites should not run on the HostSuite application server. The preferred path is:

`HostSuite -> builder -> Cloudflare Pages -> customer domain`

HostSuite may manage DNS/domain connection, monitoring and support, but the generated production site should be deployed to the customer's external deployment target.

## Commercial model
- HostSuite-managed AI: customer buys configurable AI credits.
- BYOK: customer supplies their own supported provider key and pays that provider directly.
- Hosting/deployment/managed care are separate billable products or included entitlements in a package.

AI usage is metered internally by provider/model/tokens and optionally converted to HostSuite credits. Never assume one prompt has one fixed provider cost.

## Required production configuration
The exact provider/model and OpenThorn deployment URL are configuration, not source-code constants.

- `AI_PROVIDER`
- `AI_BASE_URL`
- `AI_MODEL`
- `AI_API_KEY` (server-only for HostSuite-managed AI)
- `OPEN_THORN_BASE_URL` (server-side integration target once deployed)
- Cloudflare deployment credentials belong to the builder deployment environment, never to browser code.

## Before enabling production
1. Deploy OpenThorn in a separate environment.
2. Apply its Supabase schema and RLS policies.
3. Configure encrypted provider-key storage if BYOK is enabled.
4. Configure Cloudflare Pages deployment credentials server-side.
5. Verify generated projects are isolated from HostSuite's application runtime.
6. Verify code export and deployment work without keeping the customer's production site on HostSuite.
7. Add HostSuite project/deployment IDs and billing references.
8. Run security and abuse tests before exposing the feature publicly.
