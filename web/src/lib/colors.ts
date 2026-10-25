/**
 * 5-class risk scale for road flood exposure and assumed closure styling.
 */

export interface RiskClass {
  threshold: number;
  label: string;
  color: string;
  strokeWidth: number;
  bgClass: string;
  textClass: string;
  borderClass: string;
}

export const RISK_CLASSES: RiskClass[] = [
  {
    threshold: 0.05,
    label: '< 5%',
    color: '#22c55e',
    strokeWidth: 1.5,
    bgClass: 'bg-emerald-500/15',
    textClass: 'text-emerald-400',
    borderClass: 'border-emerald-500/30',
  },
  {
    threshold: 0.20,
    label: '5 – 20%',
    color: '#84cc16',
    strokeWidth: 2.0,
    bgClass: 'bg-lime-500/15',
    textClass: 'text-lime-400',
    borderClass: 'border-lime-500/30',
  },
  {
    threshold: 0.40,
    label: '20 – 40%',
    color: '#eab308',
    strokeWidth: 2.5,
    bgClass: 'bg-amber-500/15',
    textClass: 'text-amber-400',
    borderClass: 'border-amber-500/30',
  },
  {
    threshold: 0.70,
    label: '40 – 70%',
    color: '#f97316',
    strokeWidth: 3.5,
    bgClass: 'bg-orange-500/15',
    textClass: 'text-orange-400',
    borderClass: 'border-orange-500/30',
  },
  {
    threshold: 1.00,
    label: '> 70%',
    color: '#ef4444',
    strokeWidth: 4.5,
    bgClass: 'bg-rose-500/20',
    textClass: 'text-rose-400',
    borderClass: 'border-rose-500/40',
  },
];

export function getRiskClass(prob: number): RiskClass {
  const p = Math.max(0, Math.min(1, prob));
  if (p < 0.05) return RISK_CLASSES[0];
  if (p < 0.20) return RISK_CLASSES[1];
  if (p < 0.40) return RISK_CLASSES[2];
  if (p < 0.70) return RISK_CLASSES[3];
  return RISK_CLASSES[4];
}
