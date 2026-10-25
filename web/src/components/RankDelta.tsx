import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface RankDeltaProps {
  delta?: number | null;
  className?: string;
}

export const RankDelta: React.FC<RankDeltaProps> = ({ delta, className = '' }) => {
  if (delta === undefined || delta === null || delta === 0) {
    return (
      <span className={`inline-flex items-center text-slate-500 font-mono text-xs ${className}`}>
        <Minus className="w-3 h-3" />
      </span>
    );
  }

  if (delta > 0) {
    // Risk worsening -> higher priority ranking
    return (
      <span
        className={`inline-flex items-center gap-0.5 text-rose-400 font-mono font-medium text-xs ${className}`}
        title={`Rank increased by ${delta} (higher isolation urgency)`}
      >
        <ArrowUpRight className="w-3.5 h-3.5 text-rose-400" />
        <span>+{delta}</span>
      </span>
    );
  }

  // Risk improving -> lower priority ranking
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-emerald-400 font-mono font-medium text-xs ${className}`}
      title={`Rank improved by ${Math.abs(delta)}`}
    >
      <ArrowDownRight className="w-3.5 h-3.5 text-emerald-400" />
      <span>{delta}</span>
    </span>
  );
};
