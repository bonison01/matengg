// utils/rateMap.ts
export interface Rate {
  upto_1kg: number;
  upto_5kg: number;
  above_5kg: number;
}

// Use "<senderPin>-<receiverPin>" as key
export const rateMap: Record<string, Rate> = {
  "795103-795103": { upto_1kg: 100, upto_5kg: 150, above_5kg: 200 },
  "400002-400001": { upto_1kg: 110, upto_5kg: 160, above_5kg: 210 },
  "400001-400001": { upto_1kg: 90, upto_5kg: 140, above_5kg: 190 },
  // Add more combinations as needed
};
