export const BRAND = {
  name: 'HostSuite',
  parent: 'Vobels Limited',
  tagline: 'Simple technology support for growing businesses',
  whatsappNumber: '2348142243764',
  whatsappDisplay: '+234 814 224 3764',
  supportEmail: 'vobels.co@gmail.com',
};

export const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || BRAND.whatsappNumber;

export function waLink(message: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Services', href: '/services' },
  { label: 'About', href: '/about' },
  { label: 'Knowledge', href: '/knowledge' },
  { label: 'Blog', href: '/blog' },
  { label: 'Pricing', href: '/#pricing' },
] as const;

export const FOOTER_LINKS = {
  Solutions: [
    { label: 'Managed Servers', href: '/services#managed-servers' },
    { label: 'Email Fixes', href: '/services#email-deliverability' },
    { label: 'Emergency Recovery', href: '/services#emergency-recovery' },
    { label: 'Migration', href: '/services#zero-downtime-migration' },
    { label: 'App Hosting', href: '/services#custom-app-hosting' },
  ],
  Company: [
    { label: 'About Us', href: '/about' },
    { label: 'Knowledge Center', href: '/knowledge' },
    { label: 'Blog & Guides', href: '/blog' },
    { label: 'Pricing', href: '/#pricing' },
    { label: 'Client Portal', href: '/portal' },
  ],
  Legal: [
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Privacy Policy', href: '/privacy' },
  ],
} as const;

export const SOCIAL_LINKS = [
  { label: 'TikTok', href: 'https://www.tiktok.com/@The_hostsuites', handle: '@The_hostsuites' },
  { label: 'Instagram', href: 'https://www.instagram.com/The_hostsuites', handle: '@The_hostsuites' },
] as const;

export const KB_CATEGORIES = [
  'Email & Deliverability',
  'Access & Recovery',
  'Uptime & Performance',
  'Billing & SLAs',
] as const;

export const ADMIN_EMAIL = 'vobels.co@gmail.com';

export const PAIN_POINTS = [
  {
    id: 'developer-ghosted',
    icon: 'UserX',
    title: 'Developer Ghosted Us / Lost cPanel Access',
    short: 'Lost Access',
    description:
      'Your developer vanished and left you locked out of your own hosting, domain, or cPanel.',
    turnaroundHours: 24,
    costMin: 15000,
    costMax: 45000,
  },
  {
    id: 'email-spam',
    icon: 'MailWarning',
    title: 'Corporate Emails Landing in Spam / Bouncing',
    short: 'Email Deliverability',
    description:
      'Your business emails are going to spam or bouncing back, costing you clients and credibility.',
    turnaroundHours: 48,
    costMin: 20000,
    costMax: 60000,
  },
  {
    id: 'slow-down',
    icon: 'GaugeCircle',
    title: 'Website is Extremely Slow or Frequently Down',
    short: 'Speed & Uptime',
    description:
      'Your site takes forever to load or keeps crashing during traffic spikes and sales.',
    turnaroundHours: 72,
    costMin: 25000,
    costMax: 80000,
  },
  {
    id: 'high-fees',
    icon: 'BadgeDollarSign',
    title: 'High Renewal Fees with Old Host',
    short: 'Overpriced Renewals',
    description:
      'You are overpaying for hosting that underperforms. Time to migrate and save.',
    turnaroundHours: 48,
    costMin: 0,
    costMax: 25000,
  },
  {
    id: 'custom-build',
    icon: 'Wrench',
    title: 'Need Custom App / Backend System Built',
    short: 'Custom Build',
    description:
      'You need a tailored backend, API, dashboard, or full application built and maintained.',
    turnaroundHours: 336,
    costMin: 100000,
    costMax: 750000,
  },
] as const;

export type PainPoint = (typeof PAIN_POINTS)[number];

export const PRICING = [
  {
    id: 'starter_ops',
    name: 'Starter Ops',
    tagline: 'For solo sites & small business landing pages',
    monthly: 5000,
    annual: 50000,
    currency: '₦',
    features: [
      '1 Managed Website',
      '5 Corporate Email Mailboxes',
      'Automated Weekly Backups',
      'Free Migration from any host',
      'SSL Certificate Management',
      'Email & Ticket Support',
    ],
    popular: false,
  },
  {
    id: 'managed_growth',
    name: 'Managed Growth',
    tagline: 'For growing businesses that cannot afford downtime',
    monthly: 12000,
    annual: 120000,
    currency: '₦',
    features: [
      'Up to 15 Corporate Emails',
      'Automated Daily Backups',
      'Priority WhatsApp SLA (Under 2 hours)',
      'Monthly Security Audits',
      'Performance Optimization',
      'Free Migration + Credit Offset',
    ],
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise & Fractional CTO',
    tagline: 'Dedicated infrastructure + a CTO in your corner',
    monthly: null,
    annual: null,
    currency: '₦',
    features: [
      'Dedicated Server Instances',
      'Custom App / Backend Development',
      '24/7 SLA with Dedicated Engineer',
      'Fractional CTO Advisory Sessions',
      'Quarterly Infrastructure Roadmap',
      'Unlimited Support Tickets',
    ],
    popular: false,
  },
] as const;

export const SERVICES = [
  {
    icon: 'Globe2',
    title: 'Get Your Business Online',
    description:
      'Domain, website, hosting and everything you need to get your business looking professional online — without the technical headache.',
    bullets: ['Domain setup', 'Website hosting', 'SSL & backups'],
  },
  {
    icon: 'Sparkles',
    title: 'Build a Website with AI',
    description:
      'Tell us about your business and let our AI website builder help turn your idea into a polished website you can actually use.',
    bullets: ['AI-assisted website creation', 'Live preview', 'Easy next steps'],
  },
  {
    icon: 'MailCheck',
    title: 'Business Email That Works',
    description:
      'Professional email for your business, with the setup and troubleshooting help you need when messages stop reaching customers.',
    bullets: ['Business mailboxes', 'Spam & delivery help', 'DNS setup'],
  },
  {
    icon: 'LifeBuoy',
    title: 'Fix What Is Not Working',
    description:
      'Website down? Lost access? Email acting strange? Bring us the problem in plain English and we will help you work through it.',
    bullets: ['Website & hosting issues', 'Access recovery', 'Emergency help'],
  },
  {
    icon: 'ArrowLeftRight',
    title: 'Move Without the Headache',
    description:
      'Moving from another provider? We handle the technical side of the switch and help keep your website and email running.',
    bullets: ['Website migration', 'Database moves', 'DNS cutover'],
  },
  {
    icon: 'ShieldCheck',
    title: 'Keep It Safe & Healthy',
    description:
      'We help protect your website and keep the important pieces — security, updates, backups and performance — in good shape.',
    bullets: ['Security checks', 'Backups', 'Performance care'],
  },
  {
    icon: 'Headset',
    title: 'A Technical Team When You Need One',
    description:
      'No need to hire a full technical team just to keep your online business running. We can be the people you call when something needs attention.',
    bullets: ['Technical guidance', 'Ongoing support', 'Priority help'],
  },
] as const;

export const HEALTH_METRICS = [
  { label: 'Uptime', value: '99.99%', unit: 'SLA', status: 'operational' as const },
  { label: 'SSL', value: 'Active', unit: 'All Nodes', status: 'operational' as const },
  { label: 'Email Deliverability', value: '100%', unit: 'Score', status: 'operational' as const },
  { label: 'Lagos Ping', value: '14ms', unit: 'Avg', status: 'operational' as const },
] as const;

export const TRUST_LOGOS = [
  'Vobels Limited',
  'Lagos Business Hub',
  'NG Commerce Co.',
  'AfriPay Systems',
  'Meridian Health',
  'Sterling Legal',
] as const;

export const TECH_STACK = [
  { name: 'AWS', category: 'Cloud Infrastructure', description: 'Elastic compute, S3 storage, and Route 53 DNS for globally distributed workloads.' },
  { name: 'DigitalOcean', category: 'VPS & Droplets', description: 'Predictable-cost droplets for managed application hosting and staging environments.' },
  { name: 'Supabase', category: 'Database & Auth', description: 'Postgres, authentication, and edge functions for custom application backends.' },
  { name: 'Cloudflare', category: 'CDN & Security', description: 'Edge caching, DDoS protection, and WAF rules fronting every public endpoint.' },
  { name: 'Node.js', category: 'Runtime', description: 'API servers, webhooks, and background workers across our managed fleet.' },
  { name: 'Next.js', category: 'Framework', description: 'Production React applications with server-side rendering and route handlers.' },
  { name: 'cPanel / DirectAdmin', category: 'Control Panel', description: 'Legacy and self-serve panel administration, migrations, and access recovery.' },
] as const;

export const CORE_COMMITMENTS = [
  { icon: 'Gauge', stat: '99.99%', label: 'Uptime SLA', description: 'Every hosted domain is monitored across redundant nodes with automated failover.' },
  { icon: 'Timer', stat: '15 min', label: 'Emergency Response', description: 'A real engineer is on the WhatsApp desk for critical incidents, day or night.' },
  { icon: 'DatabaseBackup', stat: 'Daily', label: 'Encrypted Offsite Backups', description: 'AES-encrypted snapshots shipped to offsite storage with point-in-time recovery.' },
  { icon: 'ShieldCheck', stat: 'Zero-spam', label: 'DNS Hygiene', description: 'Full SPF, DKIM, and DMARC configuration so your corporate email reaches the inbox.' },
] as const;

export const SERVICE_DETAILS = [
  {
    slug: 'managed-servers',
    icon: 'ServerCog',
    painId: 'slow-down',
    title: 'Managed Server & cPanel/VPS Administration',
    summary: 'We take ownership of your hosting layer — provisioning, patching, monitoring, and tuning — so your team never touches a control panel again.',
    deliverables: [
      'Full cPanel / DirectAdmin / VPS administration',
      'Resource tuning (PHP workers, memory limits, MySQL)',
      'Real-time uptime monitoring with alerting',
      'SSL provisioning and automated renewal',
      'Server hardening and firewall configuration',
    ],
    tools: ['cPanel', 'DirectAdmin', 'DigitalOcean', 'Cloudflare'],
  },
  {
    slug: 'emergency-recovery',
    icon: 'LifeBuoy',
    painId: 'developer-ghosted',
    title: 'Emergency Recovery & Malware Remediation',
    summary: 'Developer vanished, site defaced, or locked out? We recover access, remove malware, and restore clean backups — fast.',
    deliverables: [
      'cPanel, domain registrar, and FTP access recovery',
      'Malware scan, quarantine, and clean restore',
      'Blacklist removal (Google Safe Browsing, Spamhaus)',
      'Post-incident security hardening report',
      '15-minute emergency WhatsApp response',
    ],
    tools: ['ImunifyAV', 'Cloudflare WAF', 'SSH recovery', 'Backup vault'],
  },
  {
    slug: 'email-deliverability',
    icon: 'MailCheck',
    painId: 'email-spam',
    title: 'Corporate Email & Inbox Placement Hygiene',
    summary: 'Stop landing in spam. We engineer your DNS and sender reputation so your business email reaches the inbox every time.',
    deliverables: [
      'SPF, DKIM, and DMARC record configuration',
      'IP and domain reputation audit',
      'Mailbox provisioning and forwarding rules',
      'Blacklist monitoring and delisting',
      'Inbox placement testing across providers',
    ],
    tools: ['Google Workspace', 'MX Toolbox', 'DMARC reports', 'Postmark'],
  },
  {
    slug: 'zero-downtime-migration',
    icon: 'HardDriveDownload',
    painId: 'high-fees',
    title: 'Zero-Downtime Site & Database Migrations',
    summary: 'Move hosts without losing a single visitor or email. We plan, sync, cutover, and verify — then credit your remaining term.',
    deliverables: [
      'Full site + database replication and cutover',
      'DNS timing strategy for zero visitor loss',
      'Email mailbox migration with no downtime',
      'Post-migration validation and performance audit',
      'Credit Offset against your old host\'s unused term',
    ],
    tools: ['rsync', 'mysqldump', 'Cloudflare proxy', 'DNS failover'],
  },
  {
    slug: 'custom-app-hosting',
    icon: 'Code2',
    painId: 'custom-build',
    title: 'Custom Web Application & Monorepo Hosting',
    summary: 'From a Next.js marketing site to a full monorepo — we build, deploy, and maintain Node and Astro applications end to end.',
    deliverables: [
      'Custom app, API, and dashboard development',
      'CI/CD pipelines and preview deployments',
      'Postgres database architecture and migrations',
      'Monorepo hosting (Node.js, Next.js, Astro)',
      'Ongoing maintenance and dependency patching',
    ],
    tools: ['Next.js', 'Supabase', 'Node.js', 'Astro', 'GitHub Actions'],
  },
] as const;
