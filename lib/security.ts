export type SecurityControl = {
  id: string;
  name: string;
  category: 'authentication' | 'authorization' | 'data' | 'api' | 'secrets' | 'payments' | 'operations' | 'abuse';
  required: boolean;
  status: 'planned' | 'review' | 'implemented' | 'needs_attention';
  description: string;
};

export const SECURITY_CONTROLS: SecurityControl[] = [
  { id: 'auth', name: 'Authentication and account recovery', category: 'authentication', required: true, status: 'review', description: 'Protect sign-in, sessions, recovery and privileged access.' },
  { id: 'authorization', name: 'Server-side authorization', category: 'authorization', required: true, status: 'review', description: 'Every protected operation must verify the acting user and role server-side.' },
  { id: 'rls', name: 'Tenant isolation / RLS', category: 'data', required: true, status: 'review', description: 'Customer records must be isolated so one tenant cannot read or modify another tenant’s data.' },
  { id: 'api-validation', name: 'API input validation', category: 'api', required: true, status: 'review', description: 'Validate and constrain all untrusted API input before processing.' },
  { id: 'rate-limit', name: 'Rate limiting and abuse prevention', category: 'abuse', required: true, status: 'planned', description: 'Protect authentication, public APIs, AI endpoints and other abuse-sensitive operations.' },
  { id: 'secrets', name: 'Secret isolation', category: 'secrets', required: true, status: 'review', description: 'AI, payment, provider and webhook secrets remain server-side and are never exposed to clients.' },
  { id: 'webhooks', name: 'Webhook verification', category: 'payments', required: true, status: 'review', description: 'Verify webhook authenticity and make event processing idempotent before changing billing state.' },
  { id: 'billing', name: 'Billing authorization', category: 'payments', required: true, status: 'planned', description: 'Customer billing actions must be scoped to the authenticated account and validated server-side.' },
  { id: 'provider-creds', name: 'Provider credential isolation', category: 'operations', required: true, status: 'planned', description: 'Provider credentials must be inaccessible to customers and ordinary browser code.' },
  { id: 'audit', name: 'Security and admin audit logging', category: 'operations', required: true, status: 'planned', description: 'Record sensitive administrative and infrastructure actions for investigation and accountability.' },
  { id: 'errors', name: 'Safe error handling', category: 'api', required: true, status: 'planned', description: 'Avoid leaking secrets, stack traces, provider credentials or sensitive tenant data in errors.' },
];

export function isProductionReady(controls: SecurityControl[] = SECURITY_CONTROLS) {
  return controls.every((control) => control.status === 'implemented');
}

export const SECURITY_BOUNDARY = 'Security is enforced at the server, database and provider boundaries. A UI control, hidden field or client-side role check is not an authorization mechanism.';
