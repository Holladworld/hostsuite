export type Currency = 'NGN' | 'USD' | 'GBP' | string;

export type BillingProductType =
  | 'domain'
  | 'hosting'
  | 'email'
  | 'website'
  | 'monitoring'
  | 'support'
  | 'managed_service'
  | 'ai_builder'
  | 'other';

export type BillingMode = 'one_time' | 'subscription' | 'metered';
export type BillingInterval = 'monthly' | 'yearly';
export type BillingStatus = 'pending' | 'paid' | 'failed' | 'cancelled' | 'refunded';
export type SubscriptionStatus = 'active' | 'past_due' | 'cancelled' | 'paused';
export type PaymentProvider = 'paystack' | 'flutterwave' | 'manual' | 'other';

export type BillingProduct = {
  id: string;
  name: string;
  description?: string;
  type: BillingProductType;
  billingMode: BillingMode;
  currency: Currency;
  price: number;
  interval?: BillingInterval;
  active: boolean;
  includedCredits?: number;
  unitLabel?: string;
  metadata?: Record<string, unknown>;
};

export type BillingEntitlement = {
  productId: string;
  quantity: number;
  startsAt: string;
  endsAt?: string;
  source: 'purchase' | 'subscription' | 'admin' | 'bundle';
};

export type PaymentRecord = {
  id: string;
  userId: string;
  reference: string;
  provider: PaymentProvider;
  amount: number;
  currency: Currency;
  status: BillingStatus;
  idempotencyKey: string;
  paidAt?: string;
  metadata?: Record<string, unknown>;
};

export type Invoice = {
  id: string;
  userId: string;
  invoiceNumber: string;
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
  subtotal: number;
  total: number;
  currency: Currency;
  dueAt?: string;
  paidAt?: string;
  createdAt: string;
};

export type Subscription = {
  id: string;
  userId: string;
  productId: string;
  serviceName: string;
  amount: number;
  currency: Currency;
  interval: BillingInterval;
  status: SubscriptionStatus;
  nextBillingAt?: string;
  autoRenew: boolean;
};

export type UsageLedgerEntry = {
  id: string;
  userId: string;
  productId: string;
  units: number;
  unitLabel: string;
  reference?: string;
  createdAt: string;
};

export const BILLING_STATUS_LABELS: Record<BillingStatus, string> = {
  pending: 'Pending',
  paid: 'Paid',
  failed: 'Failed',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};

export const DEFAULT_BILLING_CURRENCY: Currency = 'NGN';

/**
 * Customer-facing pricing is intentionally not hard-coded here.
 * Products and prices belong in the database/CMS so admin can change them
 * without a code deployment. Provider cost/margin data must remain internal.
 */
export const BILLING_RULES = {
  supportsIndividualServices: true,
  supportsBundles: true,
  supportsOneTime: true,
  supportsSubscriptions: true,
  supportsMeteredUsage: true,
  supportsCredits: true,
  supportsAutoRenew: true,
  supportsMultipleProviders: true,
} as const;
