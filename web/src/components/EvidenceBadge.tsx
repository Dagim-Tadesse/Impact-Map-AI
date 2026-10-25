import React from 'react';
import { ShieldCheck, AlertTriangle, HelpCircle } from 'lucide-react';

export type EvidenceLevel = 'validated' | 'limited' | 'heuristic';

interface EvidenceBadgeProps {
  level: EvidenceLevel;
  size?: 'sm' | 'md';
}

export const EvidenceBadge: React.FC<EvidenceBadgeProps> = ({ level, size = 'md' }) => {
  const isSm = size === 'sm';

  switch (level) {
    case 'validated':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.15)] ${
            isSm ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs tracking-wide'
          }`}
          title="Validated: Tested and calibrated on held-out satellite flood extents."
        >
          <ShieldCheck className={`${isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-cyan-400`} />
          <span className="font-semibold uppercase tracking-wider">Validated (L0)</span>
        </span>
      );

    case 'limited':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-md bg-amber-950/60 border border-amber-500/40 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.15)] ${
            isSm ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs tracking-wide'
          }`}
          title="Limited: Partial event validation; significant scenario uncertainty."
        >
          <AlertTriangle className={`${isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-amber-400`} />
          <span className="font-semibold uppercase tracking-wider">Limited (L1)</span>
        </span>
      );

    case 'heuristic':
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-sm bg-slate-800/80 border border-slate-600/40 text-slate-300 ${
            isSm ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs tracking-wide'
          }`}
          title="Heuristic: Expert rule-based modeling without satellite empirical calibration."
        >
          <HelpCircle className={`${isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-slate-400`} />
          <span className="font-semibold uppercase tracking-wider">Heuristic (L3)</span>
        </span>
      );
  }
};
