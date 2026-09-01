// HostSuite billing vocabulary.
// This milestone defines payment-independent billing concepts only.
// Do not put Paystack, Flutterwave, or provider API calls in this module.

export const PAYMENT_PROVIDERS = ['paystack', 'flutterwave', 'manual'] as const;
export type PaymentProvider = (typeof PAYMENT_PROVIDERS)[number];

export type Currency = 'NGN' | 'USD';

export type BillingInterval = 'one_time' | 'monthly' | 'annual';

export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'paid'
  | 'failed'
  | 'cancelled'
  | 'refunded';

export type InvoiceStatus = 'draft' | 'pending' | 'paid' | 'void' | 'overdue';

export type BillingLineItem = {
  serviceKey: string;
  name: string;
  quantity: number;
  unitAmountMinor: number;
  currency: Currency;
};

export type BillingQuote = {
  id: string;
  userId: string;
  items: BillingLineItem[];
  subtotalMinor: number;
  totalMinor: number;
  currency: Currency;
  interval: BillingInterval;
  createdAt: string;
  expiresAt?: string;
};

export type Invoice = {
  id: string;
  userId: string;
  items: BillingLineItem[];
  totalMinor: number;
  currency: Currency;
  status: InvoiceStatus;
  dueAt?: string;
  paidAt?: string;
  createdAt: string;
};

export type PaymentAttempt = {
  id: string;
  invoiceId: string;
  provider: PaymentProvider;
  status: PaymentStatus;
  currency: Currency;
  amountMinor: number;
  providerReference?: string;
  createdAt: string;
  completedAt?: string;
};

export function calculateQuoteTotal(items: BillingLineItem[]): number {
  return items.reduce((total, item) => total + item.unitAmountMinor * item.quantity, 0);
}

/**
 * Prevents accidental floating-point currency calculations.
 * Amounts are always stored in the smallest currency unit (e.g. kobo/cents).
 */
export function assertValidAmount(amountMinor: number): void {
  if (!Number.isInteger(amountMinor) || amountMinor < 0) {
    throw new Error('Billing amounts must be non-negative integers in minor currency units.');
  }
}

/**
 * Provider selection is deliberately kept outside the product/service layer.
 * Actual checkout implementations belong in provider adapters after credentials,
 * webhook contracts and supported currencies have been verified.
 */
export type PaymentProviderCapabilities = {
  provider: PaymentProvider;
  currencies: Currency[];
  supportsOneTime: boolean;
  supportsRecurring: boolean;
  supportsWebhooks: boolean;
};
