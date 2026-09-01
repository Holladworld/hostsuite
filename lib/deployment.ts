export type DeploymentTargetType = 'hostsuite' | 'external' | 'customer_owned';

export type DeploymentTarget = {
  type: DeploymentTargetType;
  label: string;
  description: string;
  requiresProviderConnection: boolean;
  keepsRuntimeOutsideHostSuiteApp: boolean;
};

export const DEPLOYMENT_TARGETS: DeploymentTarget[] = [
  {
    type: 'hostsuite',
    label: 'HostSuite-managed hosting',
    description: 'HostSuite manages the hosting infrastructure for you.',
    requiresProviderConnection: true,
    keepsRuntimeOutsideHostSuiteApp: true,
  },
  {
    type: 'external',
    label: 'My existing hosting',
    description: 'Keep your website on hosting you already use.',
    requiresProviderConnection: false,
    keepsRuntimeOutsideHostSuiteApp: true,
  },
  {
    type: 'customer_owned',
    label: 'My own infrastructure',
    description: 'Use infrastructure you control and keep the project there.',
    requiresProviderConnection: false,
    keepsRuntimeOutsideHostSuiteApp: true,
  },
];

export function getDeploymentTarget(type: DeploymentTargetType) {
  return DEPLOYMENT_TARGETS.find((target) => target.type === type);
}
