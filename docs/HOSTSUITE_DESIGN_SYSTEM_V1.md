# HostSuite Design System v1

Status: foundation specification; visual implementation begins with typography and tokens.
Scope: marketing website, customer portal, and Operations Centre.

## 1. Brand and experience
HostSuite is a digital-services workspace, not a generic hosting storefront. It helps customers obtain, connect, manage, renew and improve websites, hosting, domains and business email. The interface must be premium, composed, reassuring and practical. Preserve the three customer paths: **Do it myself / Let HostSuite do it / Get help**.

## 2. Typography
- Display: Instrument Serif, reserved for editorial headlines and selected emphasis.
- Interface: Manrope for navigation, body copy, forms and controls.
- Technical: IBM Plex Mono for IDs, domains, timestamps, metrics and operational metadata.
- Do not use Inter or Roboto as the default brand typography.
- Use responsive type sizes and readable line lengths; never use display typography for dense data tables.

## 3. Colour tokens
Preserve the existing semantic CSS variables and their names so current Tailwind and shadcn-style components remain compatible.

| Token | Current value | Intended use |
|---|---|---|
| Background | HSL 270 20% 98% | Main page canvas |
| Foreground | HSL 270 34% 12% | Primary text |
| Card | White | Content surfaces |
| Primary | HSL 274 52% 35% | Primary actions and focus |
| Secondary | HSL 270 37% 27% | Deep purple surfaces |
| Muted | HSL 270 16% 94% | Supporting surfaces |
| Muted foreground | HSL 270 8% 42% | Secondary text |
| Border | HSL 270 14% 90% | Dividers and control borders |
| Destructive | HSL 0 72% 51% | Errors and destructive actions |
| Success | HSL 142 71% 45% | Verified success only |
| Warning | HSL 38 92% 50% | Attention and degraded states |
| Info | HSL 199 89% 48% | Neutral information |

Use semantic tokens rather than one-off colours. Never communicate a status through colour alone.

## 4. Composition and surfaces
- Prefer asymmetric editorial layouts, strong left-aligned hierarchy, whitespace, rules and purposeful image crops.
- Use flat surfaces, tonal contrast and restrained borders. Avoid generic gradient hero treatments, glassmorphism as a default, excessive shadows and repeated decorative card grids.
- Use cards only for distinct tasks or information groups. Prefer flat sections and dividers when they scan better.
- Keep controls and compact surfaces restrained; avoid excessive pill shapes and nested rounded containers.
- Use technical typography only for data that benefits from it.

## 5. Interaction foundations
- One clear primary action per decision area; secondary actions must remain visually subordinate.
- Forms need persistent labels, field-level validation, recoverable errors and preserved input after failure.
- Every asynchronous action needs loading, success and error states.
- Prevent duplicate submissions. Show success only after persistence or the underlying operation is confirmed.
- Destructive or irreversible actions require clear confirmation.
- Empty states explain the next useful action.

## 6. Truthful product states
The UI must reflect verified backend state. Keep payment and provisioning states separate. Do not claim a provider is reachable merely because credentials are configured. Do not present an AI draft as published. Do not imply a support ticket was received until it has been persisted.

## 7. Page-level principles
- Homepage: explain HostSuite plainly; preserve service links, diagnostic journey, CMS content, pricing and the three customer paths.
- Customer portal: prioritise services, ownership, current state, next action, billing and support. AI projects belong in the same customer workspace.
- Operations Centre: prioritise queues, exceptions, provisioning, support, customer impact and auditability. Distinguish live, cached, delayed and unavailable data.

## 8. Responsive and accessible behaviour
- Maintain WCAG AA contrast for text and essential controls.
- Provide visible keyboard focus, semantic headings and labels, logical tab order and reduced-motion support.
- Target touch areas of at least 44px for primary mobile interactions.
- Prevent horizontal page overflow. Tables may scroll inside their own containers when needed.
- Test narrow mobile, standard mobile, tablet, laptop and wide desktop layouts.

## 9. Regression guardrails
- Do not remove or bypass authentication, ownership checks, RLS, billing verification, provisioning recovery or customer account boundaries.
- Do not invent customer counts, uptime, activity, provider connections or operational metrics.
- Preserve routes and API contracts unless a migration plan is reviewed.
- Keep homepage, portal and Operations Centre redesigns in separate reviewable steps.
