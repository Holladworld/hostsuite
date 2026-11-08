export type DiagnosticCheck = 'domain' | 'dns' | 'ssl' | 'hosting' | 'http' | 'monitoring';

export type DiagnosticStatus = 'pending' | 'running' | 'healthy' | 'problem' | 'unavailable';

export type DiagnosticResult = {
  check: DiagnosticCheck;
  status: DiagnosticStatus;
  summary?: string;
};

export type AssistantConversation = {
  id: string;
  userId: string;
  subject?: string;
  createdAt: string;
  updatedAt: string;
};

export type AssistantMessage = {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
};

export type AssistantDiagnosis = {
  id: string;
  conversationId: string;
  target?: string;
  checks: DiagnosticResult[];
  status: 'pending' | 'checking' | 'resolved' | 'escalated' | 'inconclusive';
  conclusion?: string;
};

export const DEFAULT_DIAGNOSTIC_CHECKS: DiagnosticCheck[] = [
  'domain',
  'dns',
  'ssl',
  'hosting',
  'http',
  'monitoring',
];

export const ASSISTANT_ESCALATION_MESSAGE = 'Everything looks normal from the available checks, or the issue needs human access. I will escalate this to the technical team.';

export const AI_ASSISTANT_BOUNDARY = 'The assistant may interpret verified HostSuite data and guide the customer. It must not invent diagnostic results or perform infrastructure mutations unless an explicitly authorized tool is available.';
