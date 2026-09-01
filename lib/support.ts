export type SupportPriority = 'normal' | 'high' | 'emergency';
export type SupportStatus = 'open' | 'in_progress' | 'waiting_for_customer' | 'resolved';
export type SupportProblemType = 'website_down' | 'email_not_working' | 'website_slow' | 'account_access' | 'domain_problem' | 'website_change' | 'other';

export type SupportTicket = {
  id: string;
  subject: string;
  problemType: SupportProblemType;
  priority: SupportPriority;
  status: SupportStatus;
  createdAt: string;
  updatedAt: string;
};

export const SUPPORT_PROBLEM_TYPES: Array<{ type: SupportProblemType; label: string; priority: SupportPriority }> = [
  { type: 'website_down', label: 'My website is down', priority: 'emergency' },
  { type: 'email_not_working', label: "My email isn't working", priority: 'high' },
  { type: 'website_slow', label: 'My website is slow', priority: 'high' },
  { type: 'account_access', label: "I can't access my account", priority: 'high' },
  { type: 'domain_problem', label: "My domain isn't working", priority: 'high' },
  { type: 'website_change', label: 'I need a website change', priority: 'normal' },
  { type: 'other', label: 'Something else', priority: 'normal' },
];

export function getSupportPriorityLabel(priority: SupportPriority) {
  if (priority === 'emergency') return 'Emergency';
  if (priority === 'high') return 'High priority';
  return 'Normal';
}
