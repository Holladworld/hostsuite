# HostSuite on Cloudflare

HostSuite is a full-stack Next.js application with server routes, middleware, Supabase access, billing webhooks and provider integrations. It should be deployed to **Cloudflare Workers with the OpenNext adapter**, not as a static Pages export.

Cloudflare's current guidance recommends vinext for new Next.js applications. This repository remains on its existing Next.js version for now, so this change uses the documented OpenNext deployment path without changing the application's framework version.

## Local checks

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

To build and preview the Cloudflare runtime locally:

```bash
npm run preview:cloudflare
```

To deploy from a machine already authenticated with Cloudflare:

```bash
npm run deploy:cloudflare
```

## Cloudflare Workers Builds

Connect the GitHub repository to Cloudflare Workers Builds and use:

- **Production branch:** `staging` while HostSuite is being tested
- **Build command:** `npm run build:cloudflare`
- **Deploy command:** `npx wrangler deploy`

The repository's `wrangler.jsonc` points Wrangler at the OpenNext worker output and static asset directory.

Do not put provider, payment, Supabase service-role, AI, or other secrets in the repository. Configure them as Cloudflare Worker/Build secrets and environment variables.

## HostSuite custom domain

After the Worker is deployed, add:

`hostsuite.vobels.com.ng`

as a custom domain for the HostSuite Worker in Cloudflare. DNS is managed by Cloudflare for `vobels.com.ng`; do not replace or modify the existing apex-domain configuration.

For the first test, keep `staging` as the deployed branch. Production promotion can be handled separately after end-to-end QA.
