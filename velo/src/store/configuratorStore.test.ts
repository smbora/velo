import { describe, expect, it } from 'vitest';
import {
  calculateInstallment,
  calculateTotalPrice,
  formatPrice,
  type CarConfiguration,
} from './configuratorStore';

const baseConfiguration: CarConfiguration = {
  exteriorColor: 'glacier-blue',
  interiorColor: 'carbon-black',
  wheelType: 'aero',
  optionals: [],
};

describe('calculateTotalPrice', () => {
  it('returns base price for default configuration', () => {
    expect(calculateTotalPrice(baseConfiguration)).toBe(40_000);
  });

  it('adds sport wheels surcharge', () => {
    expect(
      calculateTotalPrice({ ...baseConfiguration, wheelType: 'sport' })
    ).toBe(42_000);
  });

  it('adds optional prices independently', () => {
    expect(
      calculateTotalPrice({
        ...baseConfiguration,
        optionals: ['precision-park'],
      })
    ).toBe(45_500);

    expect(
      calculateTotalPrice({
        ...baseConfiguration,
        optionals: ['flux-capacitor'],
      })
    ).toBe(45_000);
  });

  it('combines sport wheels and all optionals', () => {
    expect(
      calculateTotalPrice({
        ...baseConfiguration,
        wheelType: 'sport',
        optionals: ['precision-park', 'flux-capacitor'],
      })
    ).toBe(52_500);
  });

  it('does not change price when only colors differ', () => {
    expect(
      calculateTotalPrice({
        ...baseConfiguration,
        exteriorColor: 'midnight-black',
        interiorColor: 'deep-blue',
      })
    ).toBe(40_000);
  });
});

describe('calculateInstallment', () => {
  it('calculates 12x installment with 2% monthly compound interest', () => {
    const total = 40_000;
    const monthlyRate = 0.02;
    const months = 12;
    const expected =
      Math.round(
        ((total * monthlyRate * Math.pow(1 + monthlyRate, months)) /
          (Math.pow(1 + monthlyRate, months) - 1)) *
          100
      ) / 100;

    expect(calculateInstallment(total)).toBe(expected);
  });

  it('recalculates proportionally for financed amount after down payment', () => {
    const amountToFinance = 20_000;
    expect(calculateInstallment(amountToFinance)).toBe(1_891.19);
  });
});

describe('formatPrice', () => {
  it('formats values as Brazilian Real currency', () => {
    expect(formatPrice(40_000)).toBe('R$\u00a040.000,00');
    expect(formatPrice(42_000)).toBe('R$\u00a042.000,00');
    expect(formatPrice(3_782.12)).toBe('R$\u00a03.782,12');
  });
});
