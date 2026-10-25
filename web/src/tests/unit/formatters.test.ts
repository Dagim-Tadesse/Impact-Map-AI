import { describe, it, expect } from 'vitest';
import { formatPercent, formatPeople, formatMinutes } from '../../lib/format';
import { getRiskClass, RISK_CLASSES } from '../../lib/colors';

describe('Formatters and Risk Scale', () => {
  it('formats probabilities to percentage strings', () => {
    expect(formatPercent(0.2371)).toBe('23.7%');
    expect(formatPercent(0)).toBe('0.0%');
    expect(formatPercent(1.0)).toBe('100.0%');
  });

  it('formats people estimates with proper label and rounding', () => {
    expect(formatPeople(14200)).toBe('14,200 estimated people');
    expect(formatPeople(14200, false)).toBe('14,200');
  });

  it('formats travel time in minutes', () => {
    expect(formatMinutes(42.5)).toBe('42.5 min');
  });

  it('maps probabilities to the exact 5 risk classes', () => {
    expect(getRiskClass(0.02).threshold).toBe(0.05); // < 5%
    expect(getRiskClass(0.12).threshold).toBe(0.20); // 5 - 20%
    expect(getRiskClass(0.35).threshold).toBe(0.40); // 20 - 40%
    expect(getRiskClass(0.55).threshold).toBe(0.70); // 40 - 70%
    expect(getRiskClass(0.85).threshold).toBe(1.00); // > 70%
  });
});
