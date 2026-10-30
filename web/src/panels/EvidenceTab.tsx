import React from 'react';
import { ShieldCheck, AlertTriangle } from 'lucide-react';
import { useEvidenceQuery } from '../api/hooks';
import { EvidenceBadge } from '../components/EvidenceBadge';
import { ReliabilityDiagram } from '../components/ReliabilityDiagram';
import { getConfig } from '../config';
import { useTranslation } from 'react-i18next';

const SERIF: React.CSSProperties = { fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400 };
const MONO: React.CSSProperties = { fontFamily: "'IBM Plex Mono', monospace" };
const SANS: React.CSSProperties = { fontFamily: "'DM Sans', sans-serif" };

export const EvidenceTab: React.FC = () => {
  const { t } = useTranslation();
  const config = getConfig();
  useEvidenceQuery();

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
    <div className="space-y-10 pb-10 text-slate-200" style={SANS}>
      {/* ── Validation Header ── */}
      <section>
        <div className="text-[10px] uppercase tracking-[0.28em] text-emerald-300/90 mb-1.5" style={MONO}>
          01 · Model Validation
        </div>
        <h2 className="text-[22px] text-white leading-tight" style={SERIF}>
          {t('evidence.title')}
        </h2>

        <div className="mt-4 rounded-xl border border-white/[0.08] bg-[#0a0e16]/70 p-4 backdrop-blur-xl shadow-[0_12px_28px_rgba(0,0,0,0.5)]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] uppercase tracking-[0.22em] text-slate-500" style={MONO}>
              Model Version · {config.model_version}
            </span>
            <EvidenceBadge level="validated" size="sm" />
          </div>

          <p className="text-[12px] text-slate-400 leading-relaxed">
            The flood exposure model is strictly evaluated against satellite-observed flood delineations from Copernicus Sentinel-1 radar and JRC Global Surface Water.
          </p>

          <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-sky-500/[0.05] border border-sky-400/20 p-3">
            <ShieldCheck className="w-4 h-4 text-sky-300 shrink-0 mt-0.5" />
            <p className="text-[11px] text-sky-100 leading-relaxed">
              <span className="font-semibold">Validated (L0):</span> Calibrated and evaluated on held-out historical events in the Awash Basin using leave-one-event-out cross-validation.
            </p>
          </div>
        </div>
      </section>

      {/* ── Benchmark Metrics ── */}
      <section>
        <div className="flex items-end justify-between gap-3 mb-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.28em] text-emerald-300/90 mb-1.5" style={MONO}>
              02 · Benchmark
            </div>
            <h3 className="text-[20px] text-white leading-tight" style={SERIF}>
              vs Simpler Baselines
            </h3>
          </div>
          <span className="text-[10px] uppercase tracking-[0.22em] text-slate-500 pb-1" style={MONO}>
            Leave-One-Event-Out
          </span>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-[#0a0e16]/70 overflow-hidden backdrop-blur-xl shadow-[0_12px_28px_rgba(0,0,0,0.5)]">
          <div className="divide-y divide-white/[0.05]">
            {metrics.map((m) => (
              <div key={m.name} className="p-4 space-y-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-[11px] uppercase tracking-[0.2em] text-slate-500" style={MONO}>
                    {m.name}
                  </span>
                  <span className="text-2xl text-white tabular-nums" style={SERIF}>
                    {m.lgb.toFixed(4)}
                  </span>
                </div>

                <div className="space-y-1.5">
                  {[
                    { name: 'ImpactMap ML', value: m.lgb, bar: 'bg-emerald-300', text: 'text-emerald-200', labelText: 'text-slate-300' },
                    { name: 'B1 · Logistic', value: m.b1, bar: 'bg-sky-400/60', text: 'text-slate-400', labelText: 'text-slate-500' },
                    { name: 'B0 · HAND Heuristic', value: m.b0, bar: 'bg-slate-500/60', text: 'text-slate-500', labelText: 'text-slate-500' },
                  ].map((bar) => (
                    <div key={bar.name} className="flex items-center gap-2.5">
                      <span
                        className={`w-28 shrink-0 text-[10px] uppercase tracking-wider ${bar.labelText}`}
                        style={MONO}
                      >
                        {bar.name}
                      </span>
                      <div className="flex-1 h-1.5 bg-slate-800/60 rounded-full overflow-hidden">
                        <div
                          className={`${bar.bar} h-full rounded-full transition-[width] duration-500`}
                          style={{ width: `${Math.min(100, bar.value * 100)}%` }}
                        />
                      </div>
                      <span className={`w-12 text-right text-[11px] tabular-nums ${bar.text}`} style={MONO}>
                        {bar.value.toFixed(3)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Reliability Diagram ── */}
      <section>
        <div className="text-[10px] uppercase tracking-[0.28em] text-emerald-300/90 mb-1.5" style={MONO}>
          03 · Calibration Curve
        </div>
        <h3 className="text-[20px] text-white leading-tight mb-4" style={SERIF}>
          Probability Reliability
        </h3>
        <ReliabilityDiagram />
      </section>

      {/* ── End-to-End Correlation ── */}
      <section className="rounded-xl border border-white/[0.08] bg-[#0a0e16]/70 p-4 backdrop-blur-xl shadow-[0_12px_28px_rgba(0,0,0,0.5)]">
        <div className="text-[10px] uppercase tracking-[0.28em] text-emerald-300/90 mb-1.5" style={MONO}>
          04 · End-to-End
        </div>
        <h3 className="text-[18px] text-white leading-tight mb-2" style={SERIF}>
          Hospital Isolation Correlation
        </h3>
        <p className="text-[12px] text-slate-400 leading-relaxed">
          Predicted facility isolation risk achieves a <span className="text-emerald-300 tabular-nums" style={SERIF}>Spearman ρ = 0.785</span> against ground-truth network traversals simulated on satellite-observed flood footprints.
        </p>
      </section>

      {/* ── Limitations ── */}
      <section className="rounded-xl border border-amber-300/20 bg-amber-500/[0.03] p-4 backdrop-blur-xl shadow-[0_12px_28px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />
          <span className="text-[10px] uppercase tracking-[0.28em] text-amber-300/90" style={MONO}>
            Documented Limitations
          </span>
        </div>

        <ul className="space-y-2.5 text-[12px] text-slate-400 leading-relaxed">
          {[
            'A flooded road segment is not always structurally closed; impassability depends on vehicle clearance.',
            'Independent Monte Carlo sampling understates contiguous multi-segment corridor blockage.',
            'Copernicus DEM 30m resolution cannot detect culverts, ditches, or localized drainage pumps.',
            'Population estimates from WorldPop gridded models reflect residential density, not daytime transit.',
          ].map((line, i) => (
            <li key={i} className="flex gap-3">
              <span className="text-amber-300/70 shrink-0 tabular-nums" style={MONO}>
                0{i + 1}
              </span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};
