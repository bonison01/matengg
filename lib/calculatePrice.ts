// Pricing Tier Types
type FixedRateTier = {
  maxKm: number;
  rate: number;
  type: 'fixed';
};

type VariableRateTier = {
  maxKm: number;
  base: number;
  perKm: number;
  type: 'variable';
};

type PricingTier = FixedRateTier | VariableRateTier;

// Light vehicle pricing tiers
const lightVehicleTiers: PricingTier[] = [
  { maxKm: 5, rate: 350, type: 'fixed' },
  { maxKm: 10, base: 350, perKm: 20, type: 'variable' },
  { maxKm: 20, rate: 1000, type: 'fixed' },
  { maxKm: 30, rate: 1300, type: 'fixed' },
  { maxKm: 50, rate: 1700, type: 'fixed' },
  { maxKm: Infinity, base: 1500, perKm: 10, type: 'variable' },
];

/**
 * Calculates the total delivery price based on distance and vehicle type.
 * - Two-wheelers use fixed if-else logic.
 * - Light vehicles use tier-based logic.
 *
 * @param distance The delivery distance in kilometers.
 * @param vehicleType Either 'two-wheeler' or 'light-vehicle'.
 * @returns The calculated price as a number.
 */
export const calculatePrice = (
  distance: number,
  vehicleType: 'two-wheeler' | 'light-vehicle'
): number => {
  // Two-wheeler pricing with direct conditional logic
  if (vehicleType === 'two-wheeler') {
    if (distance < 4) {
      return 60;
    } else if (distance < 7) {
      const baseCharge = 20;
      const perKmRate = 15;
      return baseCharge + perKmRate * distance;
    } else if (distance < 7) {
      return 130;
    } else if (distance < 10) {
      return 150;
      } else if (distance < 15) {
      return 200;
    } else if (distance < 20) {
      return 230;
    } else if (distance < 24) {
      return 250;
    } else if (distance < 26) {
      return 270;
    } else if (distance < 30) {
      return 300;
    } else {
      return 330;
    }
  }

  // Light vehicle pricing using tiers
  const tiers = lightVehicleTiers;
  for (const tier of tiers) {
    if (distance <= tier.maxKm) {
      if (tier.type === 'fixed') {
        return tier.rate;
      } else {
        return tier.base + tier.perKm * distance;
      }
    }
  }

  // Fallback for safety (should never be hit because of Infinity tier)
  const lastTier = tiers[tiers.length - 1];
  if (lastTier.type === 'fixed') {
    return lastTier.rate;
  } else {
    return lastTier.base + lastTier.perKm * distance;
  }
};
