export type PaymentProviderName = 'paystack' | 'flutterwave';

export type PaymentInitializeInput = {
  email: string;
  amount: number;
  currency: string;
  reference: string;
  callbackUrl?: string;
  orderId: string;
  userId: string;
  /** Provider plan code/ID. When present, the first charge enrolls the customer in native recurring billing. */
  recurringPlanId?: string;
};

export type PaymentInitializeResult = {
  authorizationUrl: string;
};

export interface PaymentProvider {
  readonly name: PaymentProviderName;
  isConfigured(): boolean;
  initialize(input: PaymentInitializeInput): Promise<PaymentInitializeResult>;
}
