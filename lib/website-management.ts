export type WebsiteHealthStatus = 'healthy' | 'attention' | 'offline' | 'unknown';

export type WebsiteProject = {
  id: string;
  name: string;
  domain?: string;
  status: WebsiteHealthStatus;
  sslActive: boolean;
  backupAvailable: boolean;
  monitoringEnabled: boolean;
  deploymentTarget?: 'hostsuite' | 'external' | 'customer_owned';
};

export function getWebsiteHealthLabel(status: WebsiteHealthStatus) {
  switch (status) {
    case 'healthy':
      return 'Everything looks healthy';
    case 'attention':
      return 'Needs attention';
    case 'offline':
      return 'Website may be unavailable';
    default:
      return 'Health information unavailable';
  }
}

export const WEBSITE_MANAGEMENT_ACTIONS = [
  'open_site',
  'manage_hosting',
  'backup',
  'restore',
  'connect_domain',
  'manage_ssl',
  'check_health',
  'request_changes',
] as const;
