// ============================================================
// Leads
// ============================================================
export type LeadSource = 'diagnostic' | 'pricing' | 'manual';
export type LeadStatus = 'new' | 'contacted' | 'won' | 'lost';

export type LeadInsert = {
  source: LeadSource;
  pain_points?: string[];
  company_name?: string;
  domain_url?: string;
  description?: string;
  email?: string;
  whatsapp?: string;
  estimated_tier?: string;
  estimated_cost_min?: number;
  estimated_cost_max?: number;
  turnaround_hours?: number;
};

export type LeadRow = LeadInsert & {
  id: string;
  status: LeadStatus;
  created_at: string;
};

// ============================================================
// Client Profiles
// ============================================================
export type SubscriptionTier = 'starter_ops' | 'managed_growth' | 'enterprise';

export type ClientRow = {
  id: string;
  created_at: string;
  company_name: string | null;
  corporate_email: string | null;
  whatsapp_number: string | null;
  subscription_tier: SubscriptionTier;
};

// ============================================================
// Domains
// ============================================================
export type DomainStatus = 'active' | 'maintenance' | 'backup_complete' | 'security_clean' | 'expiring';
export type PlanTier = 'starter_ops' | 'managed_growth' | 'enterprise';

export type DomainRow = {
  id: string;
  user_id: string;
  domain: string;
  status: DomainStatus;
  plan_tier: PlanTier;
  ssl_active: boolean;
  last_backup: string | null;
  uptime_pct: number;
  created_at: string;
};

// ============================================================
// Support Tickets
// ============================================================
export type TicketType = 'text_update' | 'email_setup' | 'database_backup' | 'downtime' | 'migration' | 'other';
export type TicketPriority = 'low' | 'normal' | 'high' | 'emergency';
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export type TicketInsert = {
  domain?: string;
  request_type: TicketType;
  subject: string;
  details?: string;
  priority?: TicketPriority;
};

export type TicketRow = TicketInsert & {
  id: string;
  user_id: string;
  status: TicketStatus;
  admin_notes?: string | null;
  ticket_type?: string;
  created_at: string;
  resolved_at: string | null;
};

// ============================================================
// Blog
// ============================================================
export type BlogRow = {
  id: string;
  created_at: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  cover_image_url: string | null;
  tags: string[];
  published: boolean;
  published_at: string | null;
};

export type BlogInsert = {
  title: string;
  slug: string;
  excerpt?: string;
  content?: string;
  cover_image_url?: string;
  tags?: string[];
  published?: boolean;
  published_at?: string | null;
};

// ============================================================
// Knowledge Base
// ============================================================
export type KBCategory = 'Email & Deliverability' | 'Access & Recovery' | 'Uptime & Performance' | 'Billing & SLAs';

export type KnowledgeBaseRow = {
  id: string;
  created_at: string;
  title: string;
  slug: string;
  category: KBCategory;
  excerpt: string | null;
  content: string | null;
  views: number;
  published: boolean;
};

export type KnowledgeBaseInsert = {
  title: string;
  slug: string;
  category: KBCategory;
  excerpt?: string;
  content?: string;
  published?: boolean;
};

// ============================================================
// Site Settings
// ============================================================
export type SiteSettings = {
  hero?: {
    headline?: string;
    subheadline?: string;
    hotlineText?: string;
    whatsappDisplay?: string;
  };
  pricing?: {
    starter_ops_monthly?: number;
    starter_ops_annual?: number;
    managed_growth_monthly?: number;
    managed_growth_annual?: number;
  };
};

export type SiteSettingKey = keyof SiteSettings;

// ============================================================
// HostSuite Product Foundation
// ============================================================
export type {
  CustomerIntent,
  HostSuiteServiceDefinition,
  HostSuiteServiceInstance,
  HostSuiteServiceKey,
  HostingProvider,
  ProviderServiceRef,
  ServiceAction,
  ServiceCategory,
  ServiceDecision,
  ServiceLifecycle,
  ServiceMode,
} from './product';
