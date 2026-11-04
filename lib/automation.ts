export type AutomationEventType =
  | 'domain_expiring'
  | 'website_down'
  | 'ssl_expiring'
  | 'backup_failed'
  | 'email_health_issue'
  | 'payment_failed';

export type AutomationAction =
  | 'notify_customer'
  | 'verify_issue'
  | 'create_incident'
  | 'create_support_task'
  | 'attempt_remediation'
  | 'notify_admin';

export type AutomationRule = {
  id: string;
  name: string;
  event: AutomationEventType;
  enabled: boolean;
  actions: AutomationAction[];
};

export type AutomationRunStatus = 'queued' | 'running' | 'completed' | 'failed' | 'needs_human';

export type AutomationRun = {
  id: string;
  ruleId: string;
  status: AutomationRunStatus;
  startedAt?: string;
  completedAt?: string;
  error?: string;
};

export const DEFAULT_AUTOMATION_RULES: AutomationRule[] = [
  { id: 'domain-expiry-warning', name: 'Domain expiry warning', event: 'domain_expiring', enabled: true, actions: ['notify_customer'] },
  { id: 'website-outage', name: 'Website outage response', event: 'website_down', enabled: true, actions: ['verify_issue', 'create_incident', 'notify_customer', 'attempt_remediation', 'create_support_task'] },
  { id: 'ssl-expiry-warning', name: 'SSL expiry warning', event: 'ssl_expiring', enabled: true, actions: ['notify_customer', 'notify_admin'] },
  { id: 'backup-failure', name: 'Backup failure response', event: 'backup_failed', enabled: true, actions: ['notify_admin', 'create_support_task'] },
  { id: 'email-health', name: 'Email health issue', event: 'email_health_issue', enabled: true, actions: ['notify_customer', 'create_support_task'] },
  { id: 'payment-failure', name: 'Payment failure reminder', event: 'payment_failed', enabled: true, actions: ['notify_customer'] },
];

export function getDomainExpiryMessage(daysRemaining: number) {
  if (daysRemaining <= 0) return 'Your domain requires attention.';
  if (daysRemaining <= 7) return 'Your domain expires soon. Renew now.';
  if (daysRemaining <= 18) return 'Your domain expires in 18 days. Plan your renewal.';
  return null;
}

export const AUTOMATION_BOUNDARY = 'Automation is a control-plane workflow. Provider mutations and scheduled execution must run through authenticated server-side jobs or provider adapters, never from the browser.';
