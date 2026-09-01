export type BillingItemType = 'domain' | 'hosting' | 'email' | 'website' | 'support' | 'other';
export type BillingStatus = 'pending' | 'paid' | 'failed' | 'cancelled' | 'refunded';
export type SubscriptionStatus = 'active' | 'past_due' | 'cancelled' | 'paused';

export type BillingItem = {
  id: string;
  name: string;
  type: BillingItemType;
  amount: number;
  currency: string;
  interval?: 'monthly' | 'yearly' | 'one_time';
};

export type PaymentRecord = {
  id: string;
  reference: string;
  amount: number;
  currency: string;
  status: BillingStatus;
  paidAt?: string;
};

export type Subscription = {
  id: string;
  serviceName: string;
  amount: number;
  currency: string;
  interval: 'monthly' | 'yearly';
  status: SubscriptionStatus;
  nextBillingAt?: string;
  autoRenew: boolean;
};

export const BILLING_STATUS_LABELS: Record<BillingStatus, string> = {
  pending: 'Pending',
  paid: 'Paid',
  failed: 'Failed',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};
