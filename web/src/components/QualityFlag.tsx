import React from 'react';
import { AlertCircle, Clock, Database, MapPinOff } from 'lucide-react';

interface QualityFlagProps {
  flag?: string;
  poorBaseline?: boolean;
}

export const QualityFlag: React.FC<QualityFlagProps> = ({ flag, poorBaseline }) => {
  return (
    <div className="flex flex-wrap items-center gap-1">
      {poorBaseline && (
        <span
          className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-purple-950/60 border border-purple-500/40 text-purple-300"
          title="Long travel time even without a flood (> 120 min in dry weather)"
        >
          <Clock className="w-2.5 h-2.5 text-purple-400" />
          <span>Poor Baseline Access</span>
        </span>
      )}

      {flag === 'long_snap' && (
        <span
          className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-950/60 border border-amber-500/40 text-amber-300"
          title="Location is distant from mapped road network (> 3,000m snap distance)"
        >
          <MapPinOff className="w-2.5 h-2.5 text-amber-400" />
          <span>Long Snap</span>
        </span>
      )}

      {flag === 'low_road_density' && (
        <span
          className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-950/60 border border-blue-500/40 text-blue-300"
          title="Rural area with sparse road network mapping"
        >
          <Database className="w-2.5 h-2.5 text-blue-400" />
          <span>Low Road Density</span>
        </span>
      )}

      {flag === 'weak_source' && (
        <span
          className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-800 border border-slate-600/40 text-slate-300"
          title="Unverified source taxonomy; fallback level guess"
        >
          <AlertCircle className="w-2.5 h-2.5 text-slate-400" />
          <span>Weak Source</span>
        </span>
      )}
    </div>
  );
};
