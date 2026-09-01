# HS-018 — Landing + CMS completion

## Public site

The homepage is now positioned around HostSuite's actual product promise:

- Domains
- Hosting
- Business email
- Websites / digital infrastructure
- Monitoring
- Self-service
- Managed support
- Emergency technical desk

The public homepage reads its branding, hero copy, pricing and published blog posts from Supabase `site_settings` / `blogs`, with safe defaults when content is unavailable.

## CMS

`/admin/cms` now allows an administrator to:

- Change site name
- Upload/change the public logo
- Change homepage headline and subheadline
- Change CTA labels
- Change the two current pricing values
- Publish/unpublish existing blog posts

The CMS uses the existing Supabase content schema already present in the repository. `site_settings` is the flexible store for homepage/branding/pricing JSON, while `blogs` stores public articles.

## Important limitation

This milestone does not invent a new blog database or duplicate the existing content schema. The next CMS enhancement can add a richer post editor (create/edit/delete) on top of the existing `blogs` table if needed.

## Provider/email note

Current WhoGoHost public reseller API documentation clearly exposes domain operations and email forwarding, but I did not find public documentation proving a reseller mailbox-provisioning API. HostSuite therefore keeps mailbox provisioning as an unverified provider capability until a real reseller account/API documentation confirms it.

## Security

The existing `hostsuite-assets` bucket remains public-read for website assets, but HS-018 adds a migration restricting uploads, updates and deletes to the HostSuite admin. This closes the earlier overly-broad authenticated-write policy.
