/**
 * Manual scenario hyetograph and antecedent rainfall calculators.
 */

export type StormShape = 'even' | 'front_loaded' | 'mid_peak' | 'back_loaded';
export type WetnessClass = 'dry' | 'normal' | 'wet';

export const ANTECEDENT_VALUES: Record<WetnessClass, number> = {
  dry: 40,
  normal: 120,
  wet: 220,
};

export function calculateDailyRain(
  totalMm: number,
  numDays: number,
  shape: StormShape
): number[] {
  if (numDays <= 0) return [];
  if (numDays === 1) return [Math.round(totalMm * 10) / 10];

  let rawWeights: number[] = [];

  switch (shape) {
    case 'even':
      rawWeights = new Array(numDays).fill(1);
      break;

    case 'front_loaded':
      rawWeights = Array.from({ length: numDays }, (_, i) => numDays - i);
      break;

    case 'back_loaded':
      rawWeights = Array.from({ length: numDays }, (_, i) => i + 1);
      break;

    case 'mid_peak': {
      const mid = (numDays - 1) / 2;
      rawWeights = Array.from({ length: numDays }, (_, i) => {
        const distFromCenter = Math.abs(i - mid);
        const maxDist = mid;
        // Linear peak: highest at center, 1 at edges
        return Math.max(1, Math.round(mid + 1 - distFromCenter));
      });
      break;
    }
  }

  const weightSum = rawWeights.reduce((a, b) => a + b, 0);
  return rawWeights.map((w) => Math.round(((w * totalMm) / weightSum) * 10) / 10);
}
