import { describe, expect, it } from 'vitest';

describe('HostSuite billing rules', () => {
  it('distinguishes markup from gross margin', () => {
    const cost = 10_000;
    const priceAt50PercentMarkup = cost * 1.5;
    const margin = (priceAt50PercentMarkup - cost) / priceAt50PercentMarkup;
    expect(priceAt50PercentMarkup).toBe(15_000);
    expect(margin).toBeCloseTo(1 / 3, 5);
  });

  it('calculates a price for a target gross margin', () => {
    const cost = 10_000;
    const targetMargin = 0.5;
    const price = cost / (1 - targetMargin);
    expect(price).toBe(20_000);
  });

  it('does not permit a discount that breaches the configured minimum margin', () => {
    const cost = 10_000;
    const price = 20_000;
    const discount = 0.5;
    const minimumMargin = 0.2;
    const finalPrice = price * (1 - discount);
    const margin = (finalPrice - cost) / finalPrice;
    expect(margin).toBeLessThan(minimumMargin);
  });

  it('keeps a qualifying discount above the minimum margin', () => {
    const cost = 10_000;
    const price = 20_000;
    const discount = 0.2;
    const minimumMargin = 0.2;
    const finalPrice = price * (1 - discount);
    const margin = (finalPrice - cost) / finalPrice;
    expect(margin).toBeGreaterThanOrEqual(minimumMargin);
  });
});
