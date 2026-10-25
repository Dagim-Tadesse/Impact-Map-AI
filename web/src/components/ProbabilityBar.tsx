import React from 'react';
import { getRiskClass } from '../lib/colors';
import { formatPercent } from '../lib/format';

interface ProbabilityBarProps {
  prob: number;
  p10?: number;
  p90?: number;
  showWhiskers?: boolean;
  className?: string;
}

export const ProbabilityBar: React.FC<ProbabilityBarProps> = ({
  prob,
  p10,
  p90,
  showWhiskers = true,
  className = '',
}) => {
  const p = Math.max(0, Math.min(1, prob));
  const risk = getRiskClass(p);

  const hasRange = p10 !== undefined && p90 !== undefined && p90 >= p10;
  const leftPct = hasRange ? Math.max(0, p10! * 100) : 0;
  const widthPct = hasRange ? Math.min(100 - leftPct, (p90! - p10!) * 100) : 0;

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex items-center justify-between text-xs">
        <span className="font-mono font-medium text-slate-200">{formatPercent(p)}</span>
        {hasRange && showWhiskers && (
          <span className="text-[10px] text-slate-400 font-mono">
            [{formatPercent(p10, 0)} – {formatPercent(p90, 0)}]
          </span>
        )}
      </div>

      <div className="relative h-2 w-full bg-slate-800/80 rounded-full overflow-hidden border border-white/5">
        {/* Uncertainty Range Bar (p10 to p90) */}
        {hasRange && showWhiskers && (
          <div
            className="absolute top-0 bottom-0 bg-white/15 rounded-full"
            style={{
              left: `${leftPct}%`,
              width: `${Math.max(2, widthPct)}%`,
            }}
          />
        )}

        {/* Primary Point Estimate Value */}
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${Math.max(2, p * 100)}%`,
            backgroundColor: risk.color,
          }}
        />
      </div>
    </div>
  );
};
