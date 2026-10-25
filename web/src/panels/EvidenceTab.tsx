import React from 'react';
import { ShieldCheck, Award, AlertTriangle, CheckCircle, Database } from 'lucide-react';
import { useEvidenceQuery } from '../api/hooks';
import { EvidenceBadge } from '../components/EvidenceBadge';
import { ReliabilityDiagram } from '../components/ReliabilityDiagram';
import { getConfig } from '../config';
import { useTranslation } from 'react-i18next';

export const EvidenceTab: React.FC = () => {
  const { t } = useTranslation();
  const config = getConfig();
  const { data: evidenceData, isLoading } = useEvidenceQuery();

  const metrics = [
    {
      name: t('evidence.pr_auc'),
      lgb: 0.8018,
      b1: 0.4971,
      b0: 0.1626,
      best: 'lgb',
    },
    {
      name: t('evidence.auc_roc'),
      lgb: 0.9724,
      b1: 0.864,
      b0: 0.6541,
      best: 'lgb',
    },
    {
      name: t('evidence.brier_score'),
      lgb: 0.061,
      b1: 0.174,
      b0: 0.42,
      best: 'lgb',
      lowerIsBetter: true,
    },
    {
      name: 'Recall @ 50% Precision',
      lgb: 0.624,
      b1: 0.421,
      b0: 0.28,
      best: 'lgb',
    },
  ];

  return (
    <div className="space-y-6 pb-12 text-slate-200">
      {/* Top Banner with Evidence Badge */}
      <div className="glass-panel p-4 rounded-xl border border-white/10">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">
              {t('evidence.title')}
            </h2>
          </div>
          <EvidenceBadge level="validated" size="sm" />
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          The flood exposure model (<span className="font-mono text-cyan-300">{config.model_version}</span>) is strictly evaluated against satellite-observed flood delineations from Copernicus Sentinel-1 radar and JRC Global Surface Water.
        </p>

        <div className="mt-3 p-2.5 rounded-lg bg-cyan-950/40 border border-cyan-500/20 text-[11px] text-cyan-200 flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <span>
            <strong>Validated (L0):</strong> Calibrated and evaluated on held-out historical events in the Awash Basin using leave-one-event-out cross-validation.
          </span>
        </div>
      </div>

      {/* Model vs Baselines Comparison Table */}
      <div className="glass-panel rounded-xl overflow-hidden border border-white/10">
        <div className="px-3.5 py-2.5 bg-white/[0.02] border-b border-white/10 flex items-center justify-between">
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            Benchmark vs Baselines
          </span>
          <span className="text-[10px] font-mono text-slate-400">Leave-One-Event-Out</span>
        </div>

        <div className="divide-y divide-white/5">
          {metrics.map((m) => (
            <div key={m.name} className="p-3 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-300">{m.name}</span>
                <span className="font-mono font-bold text-cyan-400">
                  {m.lgb.toFixed(4)}
                </span>
              </div>

              {/* Comparative Visual Bars */}
              <div className="space-y-1 font-mono text-[10px]">
                <div className="flex items-center gap-2">
                  <span className="w-24 text-slate-400 truncate">ImpactMap ML</span>
                  <div className="flex-1 bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-cyan-400 h-full rounded-full"
                      style={{ width: `${Math.min(100, m.lgb * 100)}%` }}
                    />
                  </div>
                  <span className="w-12 text-right text-cyan-300">{m.lgb.toFixed(3)}</span>
                </div>

                <div className="flex items-center gap-2 text-slate-500">
                  <span className="w-24 truncate">B1 Logistic</span>
                  <div className="flex-1 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-slate-400 h-full rounded-full"
                      style={{ width: `${Math.min(100, m.b1 * 100)}%` }}
                    />
                  </div>
                  <span className="w-12 text-right">{m.b1.toFixed(3)}</span>
                </div>

                <div className="flex items-center gap-2 text-slate-500">
                  <span className="w-24 truncate">B0 HAND Heuristic</span>
                  <div className="flex-1 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-slate-600 h-full rounded-full"
                      style={{ width: `${Math.min(100, m.b0 * 100)}%` }}
                    />
                  </div>
                  <span className="w-12 text-right">{m.b0.toFixed(3)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Reliability Diagram (Calibration Curve) */}
      <ReliabilityDiagram />

      {/* End-to-End Simulation Validation Statement */}
      <div className="glass-panel p-3.5 rounded-xl border border-white/10 text-xs space-y-1.5">
        <h3 className="font-bold text-white uppercase tracking-wider text-[11px]">
          End-to-End Hospital Isolation Correlation
        </h3>
        <p className="text-slate-300 leading-relaxed">
          Predicted facility isolation risk achieves a <strong>Spearman rank correlation of 0.785</strong> against ground-truth network traversals simulated on satellite-observed flood footprints.
        </p>
      </div>

      {/* Honest Limitations List */}
      <div className="glass-panel p-3.5 rounded-xl border border-white/10 space-y-2 text-xs">
        <div className="flex items-center gap-2 text-amber-300 font-bold uppercase tracking-wider text-[11px]">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Documented Model Limitations</span>
        </div>

        <ul className="space-y-1.5 text-slate-400 list-disc list-inside text-[11px] leading-relaxed">
          <li>A flooded road segment is not always structurally closed; impassability depends on vehicle clearance.</li>
          <li>Independent Monte Carlo sampling understates contiguous multi-segment corridor blockage.</li>
          <li>Copernicus DEM 30m resolution cannot detect culverts, ditches, or localized drainage pumps.</li>
          <li>Population estimates from WorldPop gridded models reflect residential density, not daytime transit.</li>
        </ul>
      </div>
    </div>
  );
};
