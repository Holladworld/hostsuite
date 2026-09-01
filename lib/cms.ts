export type SiteSettings = {
  siteName: string;
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor?: string;
  supportEmail?: string;
  phone?: string;
  address?: string;
};

export type PricingPlan = {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: 'monthly' | 'yearly' | 'one_time';
  features: string[];
  active: boolean;
  sortOrder: number;
};

export type BlogPostStatus = 'draft' | 'published' | 'archived';

export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImageUrl?: string;
  authorName: string;
  status: BlogPostStatus;
  publishedAt?: string;
};

export type AdminSection =
  | 'overview'
  | 'customers'
  | 'services'
  | 'domains'
  | 'hosting'
  | 'websites'
  | 'email'
  | 'support'
  | 'incidents'
  | 'payments'
  | 'renewals'
  | 'monitoring'
  | 'ai_builder'
  | 'managed_customers'
  | 'cms'
  | 'settings';

export const CMS_SECTIONS = [
  { id: 'site_settings', label: 'Site settings' },
  { id: 'branding', label: 'Branding' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'blog', label: 'Blog' },
] as const;
