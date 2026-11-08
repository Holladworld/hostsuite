# HostSuite — Editorial Art Direction v1

## Intent
HostSuite should feel like a premium digital-infrastructure partner with the confidence of an established editorial brand. The experience must feel authored, composed and precise—not like a stock SaaS theme.

## Non-negotiable exclusions
- No generic gradients or gradient-filled hero treatments.
- No centered, template-style hero with floating pill badges.
- No repeated three- or four-column feature-card grids with decorative icons.
- No Inter or Roboto as the default brand typography.
- No sterile stock photography or generic smiling-team imagery.
- No decorative UI that implies a capability, status or activity that the product cannot actually deliver.

## Typography
- **Display:** Instrument Serif for expressive, high-contrast editorial headlines and selected pull quotes.
- **Interface:** Manrope for readable navigation, forms, body copy and product controls.
- **Technical:** IBM Plex Mono for IDs, domain names, timestamps, metrics and operational metadata.
- Use strong scale contrast, deliberate line lengths and restrained uppercase labels. Do not apply the display face indiscriminately to dense interface text.

## Composition
- Prefer asymmetric editorial grids, left-aligned headlines, deliberate off-centre composition and clear visual pacing.
- Use whitespace, rules, large numerals, typography and image crops to establish hierarchy.
- Let important sections occupy different proportions; do not force every section into identical cards.
- Use full-width or split compositions when the content deserves them. Keep responsive layouts intentional rather than simply stacking desktop cards.
- Avoid pill-shaped labels as a default decoration. Use compact status labels only when they communicate real state.

## Colour and materials
- Retain HostSuite's deep-purple identity as a considered brand accent.
- Build contrast from ink-dark typography, warm paper-like surfaces, clean white and restrained purple.
- Prefer flat, confident colour fields, borders and tonal contrast over gradients, glass effects and excessive shadows.
- Reserve strong colour for actions, meaningful status and deliberate editorial emphasis.

## Imagery and product visuals
- Do not use generic stock-photo libraries as a shortcut for visual richness.
- Prefer bespoke diagrams, purposeful crops, real product-interface captures, infrastructure details or commissioned photography with a clear art direction.
- Product visuals must represent real HostSuite capabilities and real states. Never invent dashboards, uptime, customer counts, provider connections or operational activity.

## Product experience
- Preserve the clear customer paths: **Do it myself / Let HostSuite do it / Get help**.
- Keep pricing, service ownership, provider connection and operational status honest and legible.
- The customer portal should feel like a considered workspace, not a marketing page.
- The operations centre may be information-dense, but must remain calm, structured and highly scannable.

## Implementation sequence
1. Establish and verify typography and semantic design tokens.
2. Audit the existing homepage, CMS-fed content and customer paths before changing composition.
3. Redesign the homepage while preserving working content, CMS and service journeys.
4. Apply the system to the portal and operations centre in separate, reviewable steps.
5. Test responsive behavior, accessibility, content states and existing workflows after each step.

## Guardrails
- This branch is based on the Cloudflare/Next.js 16 integration branch, not the older staging-only design branch.
- Do not merge, deploy or run database migrations without explicit approval.
- Do not replace existing features simply to achieve a visual effect.
- Report tests as passed only when they have actually been run.
