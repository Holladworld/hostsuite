# HS-008 — AI Website Builder

## Scope

The repository currently has no AI website builder implementation or AI provider integration. This milestone therefore establishes the customer entry point without pretending that generation, editing, preview, deployment, or AI provider calls already exist.

## Intended journey

Describe business → generate draft → edit → preview → connect domain → publish.

## Current implementation

The authenticated portal now has `/portal/website-builder`, where a customer can enter a business name, website type, and business description. Submission is local to the current browser session and does not publish anything.

## Explicitly not implemented

- AI model/provider calls
- Generated website source
- Persistent builder projects
- Visual/code editor
- Preview deployment
- Domain connection
- Hosting provisioning
- Publishing

## Why the boundary exists

No AI provider or open-source website-builder dependency exists in the repository. Before adding one, we need to evaluate licensing, model/runtime requirements, generated-code quality, sandboxing, persistence and deployment architecture.

## Security requirements for the eventual builder

Generated code must not execute with unrestricted server access. Preview/build execution should be isolated, secrets must never be exposed to generated code, generated content should be validated, and publishing must be an explicit customer action.

## Repository facts verified for this milestone

- Next.js 13.5.1 / React 18 are the application framework versions in `package.json`.
- Supabase is already a dependency and is used by the existing portal.
- No AI website-builder implementation was found by repository search.
- No AI provider SDK was found by repository search.

## Next builder work

Evaluate candidate open-source components/models and select the generation/deployment architecture before implementing actual AI generation.
