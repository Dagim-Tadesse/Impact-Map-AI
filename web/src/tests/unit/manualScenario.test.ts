import { describe, it, expect } from 'vitest';
import { calculateDailyRain } from '../../lib/manualScenario';

describe('calculateDailyRain (Golden Tests from Anon Work Division A4.4)', () => {
  it('correctly calculates front_loaded storm distribution: T=120, N=4', () => {
    const result = calculateDailyRain(120, 4, 'front_loaded');
    expect(result).toEqual([48, 36, 24, 12]);
  });

  it('correctly calculates mid_peak storm distribution: T=60, N=4', () => {
    const result = calculateDailyRain(60, 4, 'mid_peak');
    expect(result).toEqual([10, 20, 20, 10]);
  });

  it('correctly calculates back_loaded storm distribution: T=60, N=3', () => {
    const result = calculateDailyRain(60, 3, 'back_loaded');
    expect(result).toEqual([10, 20, 30]);
  });

  it('correctly calculates even storm distribution: T=120, N=5', () => {
    const result = calculateDailyRain(120, 5, 'even');
    expect(result).toEqual([24, 24, 24, 24, 24]);
  });
});
