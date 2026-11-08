export type PaymentProviderName = 'paystack' | 'flutterwave';

export type PaymentInitializeInput = {
  email: string;
  amount: number;
  currency: string;
  reference: string;
  callbackUrl?: string;
  orderId: string;
  userId: string;
};

export type PaymentInitializeResult = {
  authorizationUrl: string;
};

export interface PaymentProvider {
  readonly name: PaymentProviderName;
  isConfigured(): boolean;
  initialize(input: PaymentInitializeInput): Promise<PaymentInitializeResult>;
}
