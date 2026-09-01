export type MonitorCheckType = 'uptime' | 'ssl' | 'dns' | 'response_time' | 'website' | 'email' | 'backup';

export type MonitorStatus = 'healthy' | 'attention' | 'down' | 'unknown';

export type WebsiteMonitor = {
  id: string;
  websiteId: string;
  target: string;
  checks: MonitorCheckType[];
  status: MonitorStatus;
  lastCheckedAt?: string;
  responseTimeMs?: number;
};

export type MonitorEvent = {
  id: string;
  monitorId: string;
  status: MonitorStatus;
  checkedAt: string;
  responseTimeMs?: number;
  message?: string;
};

export function getMonitorStatusLabel(status: MonitorStatus) {
  switch (status) {
    case 'healthy': return 'Healthy';
    case 'attention': return 'Needs attention';
    case 'down': return 'May be unavailable';
    default: return 'Not checked yet';
  }
}

export const MONITOR_CHECKS: Array<{ type: MonitorCheckType; label: string }> = [
  { type: 'uptime', label: 'Uptime' },
  { type: 'ssl', label: 'SSL' },
  { type: 'dns', label: 'DNS' },
  { type: 'response_time', label: 'Response time' },
  { type: 'website', label: 'Website availability' },
  { type: 'email', label: 'Email health' },
  { type: 'backup', label: 'Backup status' },
];

export const MONITORING_BOUNDARY = 'Monitoring runs outside the HostSuite web request path. Checks and scheduled jobs should use a dedicated worker or monitoring provider.';
