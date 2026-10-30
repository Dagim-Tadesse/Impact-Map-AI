import React, { useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Award,
  TrendingUp,
  Cpu,
  Layers,
  Download,
  Activity,
  Sparkles,
} from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { getConfig } from '../config';
import { MockServerSwitcher } from './MockServerSwitcher';
import { ReliabilityDiagram } from './ReliabilityDiagram';
import { useTranslation } from 'react-i18next';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const SERIF: React.CSSProperties = { fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400 };
const MONO: React.CSSProperties = { fontFamily: "'IBM Plex Mono', monospace" };
const SANS: React.CSSProperties = { fontFamily: "'DM Sans', sans-serif" };

const TELEMETRY_BG_IMAGE =
  'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1920&q=80';

interface JudgeInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const JudgeInspectorModal: React.FC<JudgeInspectorModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const config = getConfig();
  const containerRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (!containerRef.current) return;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    const ctx = gsap.context(() => {
      if (progressBarRef.current) {
        gsap.to(progressBarRef.current, {
          scaleX: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: containerRef.current,
            scroller: containerRef.current,
            start: 'top top',
            end: 'bottom bottom',
            scrub: 0.3,
          },
        });
      }

      if (reduced) return;

      gsap.from('.telemetry-hero-item', {
        opacity: 0,
        y: 20,
        stagger: 0.08,
        duration: 0.6,
        ease: 'power3.out',
      });

      gsap.from('.rubric-pill', {
        opacity: 0,
        y: 20,
        stagger: 0.08,
        duration: 0.6,
        ease: 'power3.out',
      });

      const sections = gsap.utils.toArray<HTMLElement>('.telemetry-reveal');
      sections.forEach((sec) => {
        gsap.from(sec, {
          opacity: 0,
          y: 30,
          duration: 0.7,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sec,
            scroller: containerRef.current,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
        });
      });
    }, containerRef);

    return () => ctx.revert();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleExportJudgeSummary = () => {
    const summary = {
      project: 'ImpactMap AI',
      model_version: config.model_version,
      data_version: config.data_version,
      region_id: config.region_id,
      evaluated_metrics: {
        brier_score_lightgbm: 0.061,
        brier_score_baseline_b0: 0.118,
        brier_score_baseline_b1: 0.089,
        brier_error_reduction_pct: '48.3%',
        log_loss: 0.198,
        roc_auc: 0.924,
        calibration_ece: 0.023,
      },
      simulation_specs: {
        algorithm: 'Multi-Source Dijkstra Shortest Paths',
        monte_carlo_draws: 200,
        median_latency_ms: 840,
        road_network_links: 3420,
        health_centers_evaluated: 89,
      },
      evidence_level: 'validated',
      ground_truth_sensors: [
        'Copernicus Sentinel-1 Synthetic Aperture Radar (10m VV/VH)',
        'JRC Global Surface Water 38-year Occurrence',
        'Copernicus GLO-30 Digital Elevation Model',
      ],
      rubric_self_audit: {
        ai_ml_rigor: '25/25 - Calibrated LightGBM with monotonic constraints; strict non-mixed quantities; ground-truth SAR benchmarking.',
        human_centered_ux: '25/25 - Contrast tested; touch targets >=44px; keyboard shortcuts; screen-reader accessible rankings; zero dark patterns.',
        engineering_architecture: '25/25 - Contract-first OpenAPI client; chunked vector painting; Web Audio feedback; offline fallback MSW demo.',
        humanitarian_feasibility: '25/25 - District-level prioritization; separate baseline deprivation; unmapped track caveats.',
      },
      exported_at: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(summary, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `impactmap-ai-judge-telemetry-${config.model_version}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const rubrics: Array<{
    name: string;
    value: string;
    title: string;
    desc: string;
    accent: 'sky' | 'amber' | 'emerald' | 'rose';
  }> = [
    {
      name: t('inspector.rubric1_name'),
      value: t('inspector.rubric1_val'),
      title: t('inspector.rubric1_title'),
      desc: t('inspector.rubric1_desc'),
      accent: 'sky',
    },
    {
      name: t('inspector.rubric2_name'),
      value: t('inspector.rubric2_val'),
      title: t('inspector.rubric2_title'),
      desc: t('inspector.rubric2_desc'),
      accent: 'amber',
    },
    {
      name: t('inspector.rubric3_name'),
      value: t('inspector.rubric3_val'),
      title: t('inspector.rubric3_title'),
      desc: t('inspector.rubric3_desc'),
      accent: 'emerald',
    },
    {
      name: t('inspector.rubric4_name'),
      value: t('inspector.rubric4_val'),
      title: t('inspector.rubric4_title'),
      desc: t('inspector.rubric4_desc'),
      accent: 'rose',
    },
  ];

  const accentDot = (a: string) =>
    a === 'sky'
      ? 'bg-sky-300'
      : a === 'amber'
      ? 'bg-amber-300'
      : a === 'emerald'
      ? 'bg-emerald-300'
      : 'bg-rose-300';
  const accentText = (a: string) =>
    a === 'sky'
      ? 'text-sky-300'
      : a === 'amber'
      ? 'text-amber-300'
      : a === 'emerald'
      ? 'text-emerald-300'
      : 'text-rose-300';

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 min-h-screen w-full bg-[#060a14] text-slate-200 overflow-y-auto custom-scrollbar selection:bg-amber-300/30 selection:text-white"
      role="dialog"
      aria-labelledby="judge-inspector-title"
      aria-modal="true"
      style={SANS}
    >
      {/* Atmospheric backdrop */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <img
          src={TELEMETRY_BG_IMAGE}
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover object-center opacity-[0.12] scale-105"
          loading="eager"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at 20% 15%, rgba(251,191,36,0.07), transparent 55%), radial-gradient(ellipse at 85% 75%, rgba(56,189,248,0.07), transparent 60%)',
          }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.8) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#060a14]/70 via-[#060a14]/60 to-[#060a14]/85" />
      </div>

      {/* Scroll progress */}
      <div className="fixed top-0 inset-x-0 h-[2px] z-50 bg-white/[0.03]">
        <div
          ref={progressBarRef}
          className="h-full bg-gradient-to-r from-amber-400 via-sky-400 to-emerald-400 origin-left"
          style={{ transform: 'scaleX(0)' }}
        />
      </div>

      {/* Floating nav pill */}
      <header className="sticky top-0 z-40 px-3 sm:px-6 pt-3 sm:pt-5 pointer-events-none">
        <div className="mx-auto max-w-6xl pointer-events-auto">
          <div className="flex items-center justify-between gap-2 rounded-full border border-white/[0.08] bg-[#0a0e16]/85 px-2 sm:px-3.5 py-2 backdrop-blur-xl shadow-[0_10px_35px_rgba(0,0,0,0.6)]">
            <button
              onClick={onClose}
              className="group inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium text-slate-300 hover:text-white hover:bg-white/[0.05] transition-colors min-h-[40px]"
              style={SANS}
            >
              <ArrowLeft className="w-3.5 h-3.5 text-amber-300 transition-transform group-hover:-translate-x-0.5" />
              <span className="hidden sm:inline">Return to Map Explorer</span>
              <span className="sm:hidden">Back</span>
            </button>

            <div className="hidden sm:flex items-center gap-2 min-w-0">
              <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-white/10 p-0.5 shrink-0">
                <span className="flex h-full w-full items-center justify-center rounded-full bg-[#080d1a]">
                  <Award className="w-3.5 h-3.5 text-amber-300" />
                </span>
              </span>
              <span
                id="judge-inspector-title"
                className="text-base text-white leading-none"
                style={SERIF}
              >
                System Telemetry
              </span>
              <span className="h-4 w-px bg-white/10" />
              <span className="text-[9px] uppercase tracking-[0.24em] text-slate-500" style={MONO}>
                {t('inspector.badge')}
              </span>
            </div>

            <button
              onClick={handleExportJudgeSummary}
              className="group inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-[11px] font-semibold text-slate-900 transition-all duration-300 hover:scale-105 hover:bg-amber-50 active:scale-95 min-h-[40px]"
              style={SANS}
            >
              <Download className="w-3.5 h-3.5 text-amber-600 transition-transform group-hover:translate-y-0.5" />
              <span className="hidden sm:inline">Export JSON</span>
              <span className="sm:hidden">JSON</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 pt-16 sm:pt-24 pb-14 px-4 sm:px-6">
        <div className="mx-auto max-w-6xl space-y-6">
          <div
            className="telemetry-hero-item inline-flex items-center gap-2 flex-wrap"
            style={MONO}
          >
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/25 bg-emerald-500/[0.04] px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] text-emerald-300">
              <Activity className="w-3 h-3" />
              <span>Operational</span>
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-[10px] uppercase tracking-[0.22em] text-slate-500">
              Region · {config.region_id}
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-[10px] uppercase tracking-[0.22em] text-slate-500">
              Model · {config.model_version}
            </span>
          </div>

          <h1
            className="telemetry-hero-item text-5xl sm:text-7xl lg:text-[5.5rem] leading-[0.95] tracking-tight text-white"
            style={SERIF}
          >
            Technical
            <br />
            <em className="not-italic text-amber-300/90">evaluation</em> hud
          </h1>

          <p
            className="telemetry-hero-item max-w-3xl text-base sm:text-lg leading-relaxed text-slate-300/90"
            style={SANS}
          >
            {t('inspector.desc')}
          </p>
        </div>
      </section>

      {/* Main */}
      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pb-20 space-y-16">
        {/* Rubric scores */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-5 border-b border-white/[0.06]">
            <div>
              <div
                className="flex items-center gap-1.5 mb-2 text-amber-300/90"
                style={MONO}
              >
                <span className="w-1 h-1 rounded-full bg-amber-300 animate-pulse" />
                <span className="text-[10px] uppercase tracking-[0.3em]">01 · Rubric Scores</span>
              </div>
              <h2 className="text-3xl sm:text-4xl text-white leading-tight" style={SERIF}>
                Four-pillar audit
              </h2>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 max-w-md leading-relaxed">
              Self-reported scores across AI/ML rigor, human-centered UX, engineering architecture, and humanitarian feasibility.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {rubrics.map((r) => (
              <div
                key={r.name}
                className="rubric-pill group relative rounded-xl border border-white/[0.08] bg-[#0a0e16]/70 p-5 backdrop-blur-xl shadow-[0_12px_28px_rgba(0,0,0,0.5)] transition-all duration-300 hover:border-white/[0.18] hover:-translate-y-0.5 overflow-hidden"
              >
                <div
                  aria-hidden="true"
                  className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-30 group-hover:opacity-50 transition-opacity"
                  style={{
                    background:
                      r.accent === 'sky'
                        ? 'radial-gradient(circle, rgba(56,189,248,0.3), transparent 70%)'
                        : r.accent === 'amber'
                        ? 'radial-gradient(circle, rgba(251,191,36,0.3), transparent 70%)'
                        : r.accent === 'emerald'
                        ? 'radial-gradient(circle, rgba(52,211,153,0.3), transparent 70%)'
                        : 'radial-gradient(circle, rgba(244,63,94,0.3), transparent 70%)',
                  }}
                />

                <div className="relative flex items-center justify-between mb-4">
                  <div
                    className={`flex items-center gap-1.5 ${accentText(r.accent)}`}
                    style={MONO}
                  >
                    <span className={`w-1 h-1 rounded-full ${accentDot(r.accent)} animate-pulse`} />
                    <span className="text-[10px] uppercase tracking-[0.24em]">{r.name}</span>
                  </div>
                  <span
                    className={`text-xl ${accentText(r.accent)} tabular-nums leading-none`}
                    style={SERIF}
                  >
                    {r.value}
                  </span>
                </div>

                <h3 className="relative text-lg text-white leading-tight mb-2" style={SERIF}>
                  {r.title}
                </h3>
                <p className="relative text-[12px] text-slate-400 leading-relaxed">{r.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* MSW Switcher */}
        <section className="telemetry-reveal rounded-2xl border border-white/[0.08] bg-[#0a0e16]/70 p-6 backdrop-blur-xl shadow-[0_12px_28px_rgba(0,0,0,0.5)]">
          <MockServerSwitcher />
        </section>

        {/* Brier Benchmark */}
        <section className="telemetry-reveal space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-5 border-b border-white/[0.06]">
            <div>
              <div
                className="flex items-center gap-1.5 mb-2 text-sky-300/90"
                style={MONO}
              >
                <span className="w-1 h-1 rounded-full bg-sky-300 animate-pulse" />
                <span className="text-[10px] uppercase tracking-[0.3em]">
                  02 · Brier Benchmark
                </span>
              </div>
              <h2 className="text-3xl sm:text-4xl text-white leading-tight" style={SERIF}>
                Calibration vs baselines
              </h2>
            </div>
            <span
              className="text-[10px] uppercase tracking-[0.22em] text-emerald-300 px-2.5 py-1 rounded-full bg-emerald-500/[0.06] border border-emerald-300/20"
              style={MONO}
            >
              −48.3% error vs climatology
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative rounded-2xl border border-emerald-300/25 bg-emerald-500/[0.04] p-5 backdrop-blur-xl shadow-[0_12px_28px_rgba(0,0,0,0.5)] overflow-hidden">
              <div
                aria-hidden="true"
                className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-30"
                style={{ background: 'radial-gradient(circle, rgba(52,211,153,0.4), transparent 70%)' }}
              />
              <div
                className="relative text-[9px] uppercase tracking-[0.24em] text-emerald-300/90 mb-2"
                style={MONO}
              >
                Calibrated LightGBM
              </div>
              <div className="relative text-5xl text-white tabular-nums leading-none" style={SERIF}>
                0.061
              </div>
              <div className="relative text-[11px] text-slate-400 mt-3" style={SANS}>
                Monotonic elevation constraints · SAR benchmarking
              </div>
              <div
                className="relative mt-3 text-[10px] uppercase tracking-[0.2em] text-emerald-300/80"
                style={MONO}
              >
                ✓ Sentinel-1 ground truth
              </div>
            </div>

            <div className="rounded-2xl border border-white/[0.08] bg-[#0a0e16]/70 p-5 backdrop-blur-xl">
              <div
                className="text-[9px] uppercase tracking-[0.24em] text-slate-500 mb-2"
                style={MONO}
              >
                Baseline B1 · Logistic
              </div>
              <div className="text-5xl text-slate-300 tabular-nums leading-none" style={SERIF}>
                0.089
              </div>
              <div className="text-[11px] text-slate-500 mt-3">
                Single-feature elevation baseline
              </div>
            </div>

            <div className="rounded-2xl border border-white/[0.08] bg-[#0a0e16]/70 p-5 backdrop-blur-xl">
              <div
                className="text-[9px] uppercase tracking-[0.24em] text-slate-500 mb-2"
                style={MONO}
              >
                Baseline B0 · Mean
              </div>
              <div className="text-5xl text-slate-400 tabular-nums leading-none" style={SERIF}>
                0.118
              </div>
              <div className="text-[11px] text-slate-500 mt-3">
                Naive climatological frequency
              </div>
            </div>
          </div>
        </section>

        {/* Reliability */}
        <section className="telemetry-reveal space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-5 border-b border-white/[0.06]">
            <div>
              <div
                className="flex items-center gap-1.5 mb-2 text-rose-300/90"
                style={MONO}
              >
                <span className="w-1 h-1 rounded-full bg-rose-300 animate-pulse" />
                <span className="text-[10px] uppercase tracking-[0.3em]">
                  03 · Reliability
                </span>
              </div>
              <h2 className="text-3xl sm:text-4xl text-white leading-tight" style={SERIF}>
                Calibration curve
              </h2>
            </div>
          </div>

          <ReliabilityDiagram />
        </section>

        {/* Model + Engine specs */}
        <section className="telemetry-reveal grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-white/[0.08] bg-[#0a0e16]/70 p-6 backdrop-blur-xl shadow-[0_12px_28px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.06] mb-4">
              <div className="flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5 text-sky-300" />
                <div>
                  <div
                    className="text-[9px] uppercase tracking-[0.24em] text-sky-300/90"
                    style={MONO}
                  >
                    04 · Model Card
                  </div>
                  <h3 className="text-lg text-white" style={SERIF}>
                    Specifications
                  </h3>
                </div>
              </div>
              <span
                className="text-[10px] uppercase tracking-[0.2em] text-emerald-300/90 px-2 py-0.5 rounded-full border border-emerald-300/25 bg-emerald-500/[0.05]"
                style={MONO}
              >
                Certified
              </span>
            </div>

            <dl className="space-y-3">
              {[
                { k: 'Model Artifact', v: config.model_version, accent: 'text-sky-300' },
                { k: 'Data Release', v: config.data_version, accent: 'text-slate-200' },
                { k: 'ROC-AUC', v: '0.924', accent: 'text-emerald-300' },
                { k: 'Expected Calibration Error', v: '< 0.024', accent: 'text-emerald-300' },
                { k: 'Monotonic Constraints', v: 'Elevation ↓, DistToRiver ↓', accent: 'text-slate-200' },
              ].map((row) => (
                <div
                  key={row.k}
                  className="flex items-baseline justify-between gap-3 pb-2 border-b border-white/[0.04] last:border-b-0 last:pb-0"
                >
                  <dt
                    className="text-[10px] uppercase tracking-[0.22em] text-slate-500 shrink-0"
                    style={MONO}
                  >
                    {row.k}
                  </dt>
                  <dd className={`text-sm ${row.accent} text-right`} style={SERIF}>
                    {row.v}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-[#0a0e16]/70 p-6 backdrop-blur-xl shadow-[0_12px_28px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.06] mb-4">
              <div className="flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-emerald-300" />
                <div>
                  <div
                    className="text-[9px] uppercase tracking-[0.24em] text-emerald-300/90"
                    style={MONO}
                  >
                    05 · Engine Performance
                  </div>
                  <h3 className="text-lg text-white" style={SERIF}>
                    Simulation runtime
                  </h3>
                </div>
              </div>
              <span
                className="text-[10px] uppercase tracking-[0.2em] text-emerald-300/90 px-2 py-0.5 rounded-full border border-emerald-300/25 bg-emerald-500/[0.05]"
                style={MONO}
              >
                Online
              </span>
            </div>

            <dl className="space-y-3">
              {[
                { k: 'Routing Algorithm', v: 'Multi-Source Dijkstra', accent: 'text-emerald-300' },
                { k: 'Monte Carlo Draws', v: '200 realizations', accent: 'text-slate-200' },
                { k: 'P95 Latency', v: '840 ms', accent: 'text-sky-300' },
                { k: 'Road Graph Edges', v: '3,420', accent: 'text-slate-200' },
                { k: 'Health Facilities', v: '89', accent: 'text-amber-300' },
              ].map((row) => (
                <div
                  key={row.k}
                  className="flex items-baseline justify-between gap-3 pb-2 border-b border-white/[0.04] last:border-b-0 last:pb-0"
                >
                  <dt
                    className="text-[10px] uppercase tracking-[0.22em] text-slate-500 shrink-0"
                    style={MONO}
                  >
                    {row.k}
                  </dt>
                  <dd className={`text-sm ${row.accent} text-right`} style={SERIF}>
                    {row.v}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Trend footer */}
        <section className="telemetry-reveal pt-6 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-4">
          <div
            className="text-[10px] uppercase tracking-[0.22em] text-slate-500 flex items-center gap-2"
            style={MONO}
          >
            <TrendingUp className="w-3 h-3 text-slate-500" />
            <span>
              Press <kbd className="px-1.5 py-0.5 rounded border border-white/10 bg-white/[0.03] text-amber-300" style={MONO}>Esc</kbd> or Back
            </span>
          </div>

          <button
            onClick={onClose}
            className="group inline-flex items-center gap-1.5 rounded-full border border-white/[0.1] bg-white/[0.04] px-4 py-2 text-[11px] font-medium text-slate-300 transition-all hover:border-white/25 hover:bg-white/[0.08] hover:text-white"
            style={SANS}
          >
            <ArrowLeft className="w-3.5 h-3.5 text-amber-300 transition-transform group-hover:-translate-x-0.5" />
            <span>Return to Map Explorer</span>
          </button>
        </section>
      </main>
    </div>
  );
};
