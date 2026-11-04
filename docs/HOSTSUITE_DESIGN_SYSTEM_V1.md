# HostSuite Design System v1

Status: foundation specification for the redesign
Scope: marketing website, customer portal, and operations centre
Implementation rule: preserve existing product behaviour; redesign presentation and interaction without replacing working workflows.

## 1. Product and brand direction

HostSuite is a digital-services workspace, not a generic hosting storefront. The experience should help customers obtain, connect, manage, renew, and improve their digital services.

Brand attributes:
- Confident and capable, without looking corporate or intimidating.
- Premium and considered, without excessive decoration.
- Clear and reassuring, especially around service status, billing, and support.
- Human and practical; avoid generic AI-generated SaaS patterns.

Visual direction:
- Retain the recognisable deep-purple identity.
- Use warm off-white page backgrounds, clean white surfaces, strong dark text, and restrained violet actions.
- Use purposeful whitespace, clear hierarchy, fine borders, and modest elevation.
- Avoid large gradient washes, glassmorphism as a default surface, excessive rounded cards, decorative dashboard charts, and unverified activity claims.

## 2. Colour foundations

The current CSS variables are the starting point. Preserve their semantic names so existing Tailwind classes and shadcn-style components continue to work.

| Token | Current value | Intended use |
|---|---|---|
| Brand deep | #4A1F6B | Brand marks, selected deep surfaces |
| Primary action | HSL 274 52% 35% (approx. #5D2A86) | Primary buttons, links, focus |
| Background | HSL 270 20% 98% | Main page canvas |
| Foreground | HSL 270 34% 12% | Primary text |
| Card | #FFFFFF | Content surfaces |
| Muted | HSL 270 16% 94% | Secondary surfaces |
| Muted foreground | HSL 270 8% 42% | Supporting text |
| Border | HSL 270 14% 90% | Dividers and control borders |
| Destructive | HSL 0 72% 51% | Errors and destructive actions |
| Success | HSL 142 71% 45% | Verified success only |
| Warning | HSL 38 92% 50% | Attention and degraded states |
| Info | HSL 199 89% 48% | Neutral informational states |

Rules:
- Use semantic tokens, not one-off hex values, in product components.
- Do not communicate status by colour alone; pair it with a label and, where useful, an icon.
- Do not show success styling until the underlying operation has succeeded.
- Check text/background contrast before introducing lighter muted text.

## 3. Typography

Intended hierarchy:
- Display/headings: Poppins, with a robust system sans-serif fallback.
- Body and controls: Inter, with a system sans-serif fallback.
- Dense identifiers and technical values: JetBrains Mono or a system monospace fallback.

Recommended scale:
- Marketing hero: responsive 44–60px, line-height 1.05–1.12.
- Page title: 30–36px, line-height 1.15.
- Section title: 22–28px, line-height 1.25.
- Card title: 16–18px, line-height 1.35.
- Body: 14–16px, line-height 1.5–1.65.
- Supporting metadata: 12–13px, line-height 1.45; never use for essential instructions.

Current implementation discrepancy to resolve before rollout:
- Tailwind declares Poppins/Inter/JetBrains CSS variables.
- The root layout does not currently load those font variables.
- Global .font-display and .font-body utilities both currently force Inter.
- Do not assume the intended fonts are active until the root font loading and utility overrides are corrected and verified.

## 4. Layout, spacing, and shape

- Use a consistent spacing scale based on 4px increments.
- Marketing content width: 1120–1200px maximum, with comfortable side gutters.
- Portal content width: flexible, with a readable maximum for forms and detail pages.
- Operations centre: wider data workspace, with clear table density and responsive overflow.
- Use 8–12px radii for controls and compact surfaces; 12–16px for cards and larger panels.
- Use subtle borders as the default separation method. Shadows should indicate elevation, not decorate every card.
- On mobile, stack columns, preserve touch targets, and avoid horizontal page overflow.

## 5. Component rules

Buttons:
- Primary: one clear primary action per decision area.
- Secondary/outline: supporting actions.
- Destructive: only for irreversible or high-impact actions, with confirmation.
- Disabled and loading states must be explicit; prevent duplicate submissions.

Forms:
- Persistent visible labels; placeholders are examples, not labels.
- Show field-level validation and explain how to recover.
- Preserve entered data when an operation fails.
- Use a clear submitting state and only show confirmation after persistence.

Cards and panels:
- Use cards for distinct tasks or information groups, not every paragraph.
- Prefer flat sections and dividers where they improve scanability.
- Avoid nested cards and repeated large rounded containers.

Tables and lists:
- Keep column labels clear, rows scannable, and actions predictable.
- On mobile, use a deliberate compact layout or horizontal scrolling within the table container.
- Never hide critical status, billing, or ownership information.

Navigation:
- Marketing navigation, customer portal navigation, and operations navigation share visual tokens but have different information architectures.
- Indicate the active destination without trapping hover/focus styles.
- Mobile navigation must remain usable with keyboard and touch.

Feedback:
- Every asynchronous action needs loading, success, and error states.
- Empty states explain what the customer can do next.
- Error states distinguish temporary failure, missing connection, permission denial, and unavailable capability.
- Do not display simulated success.

## 6. Service and workflow status language

The UI must reflect verified backend state. Do not collapse these states into a generic "Active" badge.

External service lifecycle:
1. Added to HostSuite
2. Awaiting connection
3. Connected
4. Management active
5. Needs attention
6. Disconnected or archived

AI website lifecycle:
1. Brief saved
2. Generating
3. Draft ready
4. Editing / awaiting review
5. Approved
6. Deployment in progress
7. Published and verified
8. Failed / needs attention

Support lifecycle:
1. Draft
2. Submitted (only after ticket persistence succeeds)
3. Open
4. In progress
5. Waiting for customer
6. Resolved / closed

Payment and provisioning:
- A paid order remains paid if provisioning fails.
- Show payment and provisioning as separate states.
- Never ask a customer to pay again solely because fulfilment needs recovery.

## 7. Page-level experience principles

Homepage:
- Explain what HostSuite does in plain language.
- Lead with the three customer paths: Do it myself / Let HostSuite do it / Get help.
- Make service categories, trust, pricing, and next steps easy to understand.
- Do not claim uptime, locations, live capacity, or operational activity unless backed by real data.

Customer portal:
- Prioritise the customer's services, current state, next action, billing, and support.
- Make external assets visibly distinct from services purchased/provisioned through HostSuite.
- Make AI projects part of the customer's workspace, not a disconnected application.
- Keep renewal and improvement paths attached to the relevant existing service.

Operations centre:
- Prioritise operational queues, exceptions, provisioning, support, customer impact, and auditability.
- Separate real-time data from cached, delayed, or unavailable data.
- Never manufacture metrics or imply monitoring where no monitoring integration exists.

## 8. Accessibility and responsive behaviour

- Meet WCAG AA contrast for normal text and essential controls.
- Provide visible keyboard focus and logical tab order.
- Use semantic headings, labels, buttons, and landmarks.
- Respect reduced-motion preferences.
- Target at least 44px touch areas for primary mobile interactions.
- Test at narrow mobile, standard mobile, tablet, laptop, and wide desktop widths.

## 9. Redesign implementation sequence

1. Correct and verify font loading and semantic token consistency.
2. Standardise shared primitives: button, input, select, textarea, badge, card, dialog, table, toast, and status indicator.
3. Build the marketing homepage using the system.
4. Apply the system to the customer portal without changing API contracts or workflow semantics.
5. Apply the system to the operations centre, retaining role checks and real operational data.
6. Run visual, accessibility, responsive, and functional regression checks after each area.

## 10. Non-negotiable regression guardrails

- No redesign may remove or bypass authentication, ownership checks, RLS, billing verification, provisioning recovery, or customer account boundaries.
- No UI may claim an external account is connected or managed until verification and management capabilities are actually established.
- No AI draft may be presented as published.
- AI redesigns must create a new version, preview it, obtain customer approval, preserve the live version, and verify deployment before reporting success.
- Support requests are not "received" until saved as real tickets.
- Preserve existing routes and compatibility unless a migration plan and explicit approval exist.
