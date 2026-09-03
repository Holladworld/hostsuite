import type { PaymentInitializeInput, PaymentInitializeResult, PaymentProvider } from './types';

class PaystackProvider implements PaymentProvider {
  readonly name = 'paystack' as const;
  isConfigured() { return Boolean(process.env.PAYSTACK_SECRET_KEY); }

  async initialize(input: PaymentInitializeInput): Promise<PaymentInitializeResult> {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) throw new Error('PAYMENT_PROVIDER_NOT_CONFIGURED');
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: input.email, amount: Math.round(input.amount * 100), currency: input.currency, reference: input.reference, callback_url: input.callbackUrl, metadata: { order_id: input.orderId, user_id: input.userId } }),
      cache: 'no-store',
    });
    const result = await response.json();
    if (!response.ok || !result.status || !result.data?.authorization_url) throw new Error('PAYMENT_INITIALIZATION_FAILED');
    return { authorizationUrl: result.data.authorization_url };
  }
}

class FlutterwaveProvider implements PaymentProvider {
  readonly name = 'flutterwave' as const;
  isConfigured() { return Boolean(process.env.FLW_SECRET_KEY); }

  async initialize(input: PaymentInitializeInput): Promise<PaymentInitializeResult> {
    const secret = process.env.FLW_SECRET_KEY;
    if (!secret) throw new Error('PAYMENT_PROVIDER_NOT_CONFIGURED');
    const response = await fetch('https://api.flutterwave.com/v3/payments', {
      method: 'POST',
      headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ tx_ref: input.reference, amount: input.amount, currency: input.currency, redirect_url: input.callbackUrl, customer: { email: input.email }, meta: { order_id: input.orderId, user_id: input.userId } }),
      cache: 'no-store',
    });
    const result = await response.json();
    if (!response.ok || result.status !== 'success' || !result.data?.link) throw new Error('PAYMENT_INITIALIZATION_FAILED');
    return { authorizationUrl: result.data.link };
  }
}

const providers: Record<string, PaymentProvider> = {
  paystack: new PaystackProvider(),
  flutterwave: new FlutterwaveProvider(),
};

export function getPaymentProvider(name = process.env.PAYMENT_PROVIDER || 'paystack'): PaymentProvider {
  const provider = providers[name.toLowerCase()];
  if (!provider) throw new Error(`Unsupported payment provider: ${name}`);
  return provider;
}

export function getPaymentProviderStatus() {
  const provider = getPaymentProvider();
  return { provider: provider.name, configured: provider.isConfigured() };
}
