import { initializeStandardCheckout } from '@/lib/billing/checkout-service';

export async function POST(request: Request) {
  return initializeStandardCheckout(request);
}
