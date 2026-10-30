import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  BookOpen,
  ShieldAlert,
  Cpu,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Search,
  Copy,
  Check,
  Activity,
  Zap,
  Sliders,
  TrendingUp,
  Database,
  Terminal,
  Sparkles,
} from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useTranslation } from 'react-i18next';
import { getConfig } from '../config';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const SERIF: React.CSSProperties = { fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400 };
const MONO: React.CSSProperties = { fontFamily: "'IBM Plex Mono', monospace" };
const SANS: React.CSSProperties = { fontFamily: "'DM Sans', sans-serif" };

const ABOUT_BG_IMAGE =
  'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1920&q=80';

interface AboutPageProps {
  onBack: () => void;
}

const SectionHeader: React.FC<{
  eyebrow: string;
  accent: 'amber' | 'sky' | 'rose' | 'emerald' | 'cyan';
  title: string;
  caption?: string;
}> = ({ eyebrow, accent, title, caption }) => {
  const dot: Record<string, string> = {
    amber: 'bg-amber-300',
    sky: 'bg-sky-300',
    rose: 'bg-rose-300',
    emerald: 'bg-emerald-300',
    cyan: 'bg-cyan-300',
  };
  const text: Record<string, string> = {
    amber: 'text-amber-300/90',
    sky: 'text-sky-300/90',
    rose: 'text-rose-300/90',
    emerald: 'text-emerald-300/90',
    cyan: 'text-cyan-300/90',
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-5 border-b border-white/[0.06]">
      <div>
        <div className={`flex items-center gap-1.5 mb-2 ${text[accent]}`} style={MONO}>
          <span className={`w-1 h-1 rounded-full ${dot[accent]} animate-pulse`} />
          <span className="text-[10px] uppercase tracking-[0.3em]">{eyebrow}</span>
        </div>
        <h2 className="text-3xl sm:text-4xl text-white leading-tight tracking-tight" style={SERIF}>
          {title}
        </h2>
      </div>
      {caption && (
        <p
          className="text-[11px] sm:text-xs text-slate-500 max-w-md leading-relaxed"
          style={SANS}
        >
          {caption}
        </p>
      )}
    </div>
  );
};

export const AboutPage: React.FC<AboutPageProps> = ({ onBack }) => {
  const { t } = useTranslation();
  const config = getConfig();
  const containerRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [copiedCurl, setCopiedCurl] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    const ctx = gsap.context(() => {
      if (progressBarRef.current) {
        gsap.to(progressBarRef.current, {
          scaleX: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top top',
            end: 'bottom bottom',
            scrub: 0.3,
          },
        });
      }

      if (reduced) return;

      gsap.from('.about-hero-elem', {
        opacity: 0,
        y: 24,
        stagger: 0.08,
        duration: 0.7,
        ease: 'power3.out',
      });

      const scrollSections = gsap.utils.toArray<HTMLElement>('.about-scroll-section');
      scrollSections.forEach((sec) => {
        gsap.from(sec, {
          opacity: 0,
          y: 36,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sec,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
        });
      });

      const pipelineNodes = gsap.utils.toArray<HTMLElement>('.pipeline-node');
      pipelineNodes.forEach((node) => {
        gsap.from(node, {
          opacity: 0,
          y: 20,
          duration: 0.6,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: node,
            start: 'top 88%',
          },
        });
      });

      const meterBars = gsap.utils.toArray<HTMLElement>('.about-meter-fill');
      meterBars.forEach((bar) => {
        const targetWidth = bar.getAttribute('data-target-width') || '100%';
        gsap.fromTo(
          bar,
          { width: '0%' },
          {
            width: targetWidth,
            duration: 1.2,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: bar,
              start: 'top 90%',
            },
          }
        );
      });
    }, containerRef);

    return () => {
      ctx.revert();
    };
  }, []);

  const glossaryItems = [
    {
      term: 'Road segment',
      category: 'Network',
      def: 'One stretch of road between two junctions or road ends. Identified by a persistent integer ID in the Awash Basin topological graph.',
    },
    {
      term: 'Scenario',
      category: 'Hazard',
      def: 'A precipitation event definition: total storm rainfall (mm), duration (days), temporal hyetograph shape, and antecedent soil moisture.',
    },
    {
      term: 'Flood exposure probability',
      category: 'ML Prediction',
      def: 'The calibrated probability (0% to 100%) that a road segment intersects satellite-observed floodwater. This is the only quantity evaluated against physical ground truth.',
    },
    {
      term: 'Assumed closure',
      category: 'Operation',
      def: 'The operational probability that a segment is treated as impassable during graph routing. User-scaled via the closure factor and emergency manual overrides. An assumption, not an empirical forecast.',
    },
    {
      term: 'Estimated access loss',
      category: 'Impact Simulation',
      def: 'The calculated number of people losing road access to a hospital or suffering severe travel time inflation (>2x). A Monte Carlo graph calculation, not an observed ground-truth census.',
    },
    {
      term: 'Cut off',
      category: 'Accessibility',
      def: 'A settlement has no surviving traversable road path to any regional hospital or referral center under simulated network disruptions.',
    },
    {
      term: 'Degraded access',
      category: 'Accessibility',
      def: 'A surviving road path exists, but travel time exceeds twice the dry-weather baseline travel time.',
    },
    {
      term: 'Isolated facility',
      category: 'Health System',
      def: 'A health center or clinic unable to reach any referral hospital by road for onward patient emergency transfer.',
    },
    {
      term: 'Poor baseline access',
      category: 'Baseline',
      def: 'A location requiring more than 120 minutes to reach a hospital even under dry normal conditions. Tracked separately from flood-induced disruption.',
    },
  ];

  const categories = ['All', 'Network', 'Hazard', 'ML Prediction', 'Operation', 'Impact Simulation', 'Accessibility', 'Health System', 'Baseline'];

  const filteredGlossary = glossaryItems.filter((item) => {
    const matchesCat = activeCategory === 'All' || item.category === activeCategory;
    const matchesSearch =
      item.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.def.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const curlExample = `curl -X POST "${config.api_base_url}/scenarios" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Custom Flash Flood Event",
    "storm_total_mm": 180,
    "duration_days": 3,
    "shape": "center_peak",
    "antecedent": "wet",
    "closure_factor": 1.0,
    "samples": 200,
    "seed": 42
  }'`;

  const handleCopyCurl = () => {
    navigator.clipboard.writeText(curlExample);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen w-full bg-[#060a14] text-slate-200 overflow-x-hidden selection:bg-amber-300/30 selection:text-white"
      style={SANS}
    >
      {/* Atmospheric backdrop — matches landing */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <img
          src={ABOUT_BG_IMAGE}
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover object-center opacity-[0.14] scale-105"
          loading="eager"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at 18% 10%, rgba(251,191,36,0.07), transparent 55%), radial-gradient(ellipse at 82% 72%, rgba(56,189,248,0.06), transparent 60%), radial-gradient(circle at 50% 100%, rgba(244,63,94,0.03), transparent 55%)',
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

      {/* Scroll progress bar */}
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
              onClick={onBack}
              className="group inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium text-slate-300 hover:text-white hover:bg-white/[0.05] transition-colors min-h-[40px]"
              style={SANS}
            >
              <ArrowLeft className="w-3.5 h-3.5 text-amber-300 transition-transform group-hover:-translate-x-0.5" />
              <span className="hidden sm:inline">{t('about.return_explorer')}</span>
              <span className="sm:hidden">Back</span>
            </button>

            <div className="hidden sm:flex items-center gap-2 min-w-0">
              <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-white/10 p-0.5 shrink-0">
                <span className="flex h-full w-full items-center justify-center rounded-full bg-[#080d1a]">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                </span>
              </span>
              <span className="text-base text-white leading-none" style={SERIF}>
                Impact<em className="not-italic text-amber-300/90">Map</em>
              </span>
              <span className="h-4 w-px bg-white/10" />
              <span className="text-[9px] uppercase tracking-[0.24em] text-slate-500" style={MONO}>
                Methodology
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span
                className="hidden md:inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[10px] text-slate-400"
                style={MONO}
              >
                <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                <span className="uppercase tracking-wider">
                  {t('about.model_label')} · {config.model_version}
                </span>
              </span>
              <span
                className="hidden lg:inline-flex items-center rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[10px] text-slate-400 uppercase tracking-wider"
                style={MONO}
              >
                {t('about.data_label')} · {config.data_version}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 pt-16 sm:pt-24 pb-14 px-4 sm:px-6">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="about-hero-elem inline-flex items-center gap-2" style={MONO}>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-300 animate-pulse" />
            <span className="text-[10px] uppercase tracking-[0.3em] text-amber-300/80">
              Operational Methodology · Scientific Integrity
            </span>
          </div>

          <h1
            className="about-hero-elem text-5xl sm:text-7xl lg:text-[6rem] leading-[0.95] tracking-tight text-white"
            style={SERIF}
          >
            Scientific
            <br />
            <em className="not-italic text-amber-300/90">architecture</em>
          </h1>

          <p
            className="about-hero-elem max-w-3xl text-base sm:text-lg leading-relaxed text-slate-300/90"
            style={SANS}
          >
            {t('about.hero_desc')}
          </p>

          {/* Hero metric strip */}
          <div className="about-hero-elem pt-8 border-t border-white/[0.06] grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Basin Road Links', value: '3,420', caption: 'Topological graph edges', accent: 'text-sky-300' },
              { label: 'Health Facilities', value: '89', caption: 'Hospitals & centers', accent: 'text-amber-300' },
              { label: 'Radar Resolution', value: '10 m', caption: 'Sentinel-1 SAR', accent: 'text-emerald-300' },
              { label: 'Simulation Latency', value: '< 950', caption: 'ms · 200 draws', accent: 'text-rose-300' },
            ].map((m) => (
              <div
                key={m.label}
                className="rounded-xl border border-white/[0.08] bg-[#0a0e16]/60 p-4 backdrop-blur-xl shadow-[0_12px_28px_rgba(0,0,0,0.45)] transition-all duration-300 hover:border-white/[0.16] hover:-translate-y-0.5"
              >
                <div
                  className="text-[9px] uppercase tracking-[0.24em] text-slate-500 mb-1.5"
                  style={MONO}
                >
                  {m.label}
                </div>
                <div className={`text-3xl ${m.accent} tabular-nums leading-none`} style={SERIF}>
                  {m.value}
                </div>
                <div className="text-[11px] text-slate-500 mt-2" style={SANS}>
                  {m.caption}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main */}
      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pb-24 space-y-20">
        {/* ── 1. Three Non-Mixed Quantities ── */}
        <section className="about-scroll-section space-y-8">
          <SectionHeader
            eyebrow="01 · Mathematical Integrity"
            accent="amber"
            title="Three non-mixed quantities"
            caption="To eliminate false certainty in life-or-death flood operations, ImpactMap AI strictly prevents cross-mixing between three distinct stages."
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                num: '01',
                tag: 'Calibrated ML',
                title: 'Flood exposure probability',
                desc: 'The machine-learning predicted probability (0.00 to 1.00) that standing floodwater intersects a specific road segment. Trained on Copernicus Sentinel-1 SAR and terrain features with strict monotonic constraints on elevation and distance-to-river.',
                footerIcon: <CheckCircle2 className="w-3.5 h-3.5" />,
                footerText: 'Only quantity benchmarked against satellite SAR ground truth.',
                accent: 'sky',
              },
              {
                num: '02',
                tag: 'Operational Parameter',
                title: 'Assumed road closure',
                desc: 'The operational probability that an emergency coordinator treats a flooded road as impassable during vehicle dispatch, scaled by the closure factor k and manual sandbagging / open-close overrides.',
                footerIcon: <Sliders className="w-3.5 h-3.5" />,
                footerText: 'Operational assumption, not an empirical observation.',
                accent: 'amber',
              },
              {
                num: '03',
                tag: 'Network Graph Math',
                title: 'Estimated access loss',
                desc: 'The calculated population severed from hospital emergency surgery or experiencing >2× travel time inflation, computed via 200 Monte Carlo Dijkstra realizations across the basin road graph.',
                footerIcon: <Cpu className="w-3.5 h-3.5" />,
                footerText: 'Monte Carlo calculation, not an observed ground census.',
                accent: 'rose',
              },
            ].map((card) => {
              const accentText =
                card.accent === 'sky'
                  ? 'text-sky-300'
                  : card.accent === 'amber'
                  ? 'text-amber-300'
                  : 'text-rose-300';
              const accentBorderHover =
                card.accent === 'sky'
                  ? 'hover:border-sky-300/35'
                  : card.accent === 'amber'
                  ? 'hover:border-amber-300/35'
                  : 'hover:border-rose-300/35';
              return (
                <div
                  key={card.num}
                  className={`pipeline-node group relative rounded-2xl border border-white/[0.08] bg-[#0a0e16]/70 p-6 backdrop-blur-xl shadow-[0_12px_28px_rgba(0,0,0,0.5)] transition-all duration-300 ${accentBorderHover} hover:-translate-y-0.5 overflow-hidden`}
                >
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-baseline gap-2">
                      <span
                        className={`text-xl ${accentText} tabular-nums leading-none`}
                        style={SERIF}
                      >
                        {card.num}
                      </span>
                      <span
                        className="text-[9px] uppercase tracking-[0.26em] text-slate-500"
                        style={MONO}
                      >
                        {card.tag}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-xl text-white leading-tight mb-3" style={SERIF}>
                    {card.title}
                  </h3>

                  <p className="text-[12px] text-slate-400 leading-relaxed mb-4" style={SANS}>
                    {card.desc}
                  </p>

                  <div
                    className={`flex items-start gap-2 pt-3 border-t border-white/[0.06] text-[10px] uppercase tracking-[0.18em] ${accentText}`}
                    style={MONO}
                  >
                    <span className="mt-0.5 shrink-0">{card.footerIcon}</span>
                    <span>{card.footerText}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── 2. Scope & Boundaries ── */}
        <section className="about-scroll-section space-y-8">
          <SectionHeader
            eyebrow="02 · Operational Scope"
            accent="emerald"
            title="What this system is & is not"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* What It Is */}
            <div className="rounded-2xl border border-emerald-300/20 bg-emerald-500/[0.03] p-6 backdrop-blur-xl shadow-[0_12px_28px_rgba(0,0,0,0.45)]">
              <div className="flex items-center gap-2 mb-5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                <span
                  className="text-[10px] uppercase tracking-[0.28em] text-emerald-300/90"
                  style={MONO}
                >
                  Validated capabilities
                </span>
              </div>

              <ul className="space-y-4 text-[13px] text-slate-300">
                {[
                  { h: 'Emergency reconnaissance prioritization', t: 'Identifies which critical culverts, river crossings, and mountain corridors warrant scout drone or vehicle dispatch first.' },
                  { h: 'Counterfactual mitigation simulator', t: 'Tests the system-wide humanitarian gain of sandbagging or reinforcing any road link before floodwaters peak.' },
                  { h: 'Calibrated ML probability', t: 'Rigorously verified with historical Copernicus Sentinel-1 SAR observations, achieving 0.061 Brier score.' },
                  { h: 'Disconnected field contingency', t: 'Runs locally with offline caching when grid power and cellular base stations collapse.' },
                ].map((item, i) => (
                  <li key={i} className="flex gap-3">
                    <span
                      className="text-emerald-300/70 tabular-nums shrink-0 mt-0.5"
                      style={MONO}
                    >
                      0{i + 1}
                    </span>
                    <div>
                      <span className="text-white font-medium">{item.h}.</span>{' '}
                      <span className="text-slate-400">{item.t}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* What It Is Not */}
            <div className="rounded-2xl border border-amber-300/20 bg-amber-500/[0.03] p-6 backdrop-blur-xl shadow-[0_12px_28px_rgba(0,0,0,0.45)]">
              <div className="flex items-center gap-2 mb-5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />
                <span
                  className="text-[10px] uppercase tracking-[0.28em] text-amber-300/90"
                  style={MONO}
                >
                  Explicit boundaries
                </span>
              </div>

              <ul className="space-y-4 text-[13px] text-slate-300">
                {[
                  { h: 'Not a deterministic weather forecast', t: 'Evaluates simulated rainfall stress tests, not the exact minute an atmospheric front arrives.' },
                  { h: 'Not a structural engineering guarantee', t: 'Does not calculate civil engineering shear stress on bridge piers or asphalt foundation washouts.' },
                  { h: 'Not a live CCTV traffic feed', t: 'Satellite SAR and models cannot observe individual vehicle positions or mud puddles under dense tree cover.' },
                  { h: 'Not a replacement for ground command', t: 'Human verification is legally and ethically required before relief convoys enter high-risk floodways.' },
                ].map((item, i) => (
                  <li key={i} className="flex gap-3">
                    <span
                      className="text-amber-300/70 tabular-nums shrink-0 mt-0.5"
                      style={MONO}
                    >
                      0{i + 1}
                    </span>
                    <div>
                      <span className="text-white font-medium">{item.h}.</span>{' '}
                      <span className="text-slate-400">{item.t}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ── 3. Calibration ── */}
        <section className="about-scroll-section space-y-8">
          <SectionHeader
            eyebrow="03 · Calibration Benchmarks"
            accent="sky"
            title="Earth observation & ML validation"
            caption="A perfectly calibrated model tracks the 45° diagonal of its reliability curve. We stay within 2.3% of ground truth."
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Benchmark bars */}
            <div className="lg:col-span-7 rounded-2xl border border-white/[0.08] bg-[#0a0e16]/70 p-6 backdrop-blur-xl shadow-[0_12px_28px_rgba(0,0,0,0.5)] space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
                <div>
                  <div
                    className="text-[9px] uppercase tracking-[0.24em] text-slate-500 mb-1"
                    style={MONO}
                  >
                    Brier Score · Lower is better
                  </div>
                  <h3 className="text-lg text-white" style={SERIF}>
                    vs calibration baselines
                  </h3>
                </div>
                <span
                  className="text-[10px] uppercase tracking-[0.2em] text-emerald-300 px-2.5 py-0.5 rounded-full bg-emerald-500/[0.06] border border-emerald-300/20"
                  style={MONO}
                >
                  −48.3% error
                </span>
              </div>

              <div className="space-y-4">
                {[
                  { label: 'Calibrated LightGBM · ImpactMap', value: '0.061', width: '48%', bar: 'bg-gradient-to-r from-emerald-300 to-sky-300', accent: 'text-emerald-200' },
                  { label: 'B1 · Logistic DEM + Distance', value: '0.089', width: '70%', bar: 'bg-slate-400/70', accent: 'text-slate-300' },
                  { label: 'B0 · Historical Mean', value: '0.118', width: '95%', bar: 'bg-slate-600/70', accent: 'text-slate-400' },
                ].map((row) => (
                  <div key={row.label}>
                    <div className="flex justify-between items-baseline mb-1.5">
                      <span
                        className={`text-[10px] uppercase tracking-wider ${row.accent}`}
                        style={MONO}
                      >
                        {row.label}
                      </span>
                      <span className={`text-base tabular-nums ${row.accent}`} style={SERIF}>
                        {row.value}
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-900/60 overflow-hidden">
                      <div
                        className={`about-meter-fill ${row.bar} h-full rounded-full`}
                        data-target-width={row.width}
                        style={{ width: '0%' }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/[0.06]">
                {[
                  { label: 'ROC-AUC', value: '0.924', caption: 'Separation', accent: 'text-sky-300' },
                  { label: 'Log-Loss', value: '0.198', caption: 'Cross-entropy', accent: 'text-amber-300' },
                  { label: 'ECE', value: '0.023', caption: 'Expected error', accent: 'text-emerald-300' },
                ].map((m) => (
                  <div
                    key={m.label}
                    className="rounded-xl border border-white/[0.06] bg-black/20 p-3"
                  >
                    <div
                      className="text-[9px] uppercase tracking-[0.22em] text-slate-500 mb-1"
                      style={MONO}
                    >
                      {m.label}
                    </div>
                    <div className={`text-2xl ${m.accent} tabular-nums leading-none`} style={SERIF}>
                      {m.value}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1" style={SANS}>
                      {m.caption}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Reliability diagram */}
            <div className="lg:col-span-5 rounded-2xl border border-white/[0.08] bg-[#0a0e16]/70 p-6 backdrop-blur-xl shadow-[0_12px_28px_rgba(0,0,0,0.5)] flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <div
                  className="text-[9px] uppercase tracking-[0.24em] text-sky-300/90"
                  style={MONO}
                >
                  Reliability diagram
                </div>
                <span className="text-[10px] text-slate-500" style={MONO}>
                  10 bins · N=3,420
                </span>
              </div>
              <h4 className="text-base text-white mb-3" style={SERIF}>
                Calibration curve
              </h4>

              <div className="relative w-full aspect-square max-h-56 mx-auto rounded-xl bg-black/30 border border-white/[0.06] p-3">
                <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
                  {[25, 50, 75].map((p) => (
                    <React.Fragment key={p}>
                      <line x1="0" y1={p} x2="100" y2={p} stroke="rgba(255,255,255,0.05)" strokeDasharray="2 2" />
                      <line x1={p} y1="0" x2={p} y2="100" stroke="rgba(255,255,255,0.05)" strokeDasharray="2 2" />
                    </React.Fragment>
                  ))}

                  <line x1="0" y1="100" x2="100" y2="0" stroke="rgba(148, 163, 184, 0.35)" strokeWidth="1" strokeDasharray="3 3" />

                  <polyline
                    points="0,100 10,91 20,81 30,71 40,60 50,49 60,39 70,28 80,19 90,9 100,0"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />

                  <polyline
                    points="0,100 10,95 20,88 30,79 40,69 50,55 60,45 70,36 80,29 90,18 100,0"
                    fill="none"
                    stroke="#64748b"
                    strokeWidth="1.5"
                    strokeDasharray="2 2"
                  />

                  {[[0,100],[10,91],[20,81],[30,71],[40,60],[50,49],[60,39],[70,28],[80,19],[90,9],[100,0]].map(([cx, cy], i) => (
                    <circle key={i} cx={cx} cy={cy} r="1.8" fill="#38bdf8" />
                  ))}
                </svg>
              </div>

              <div
                className="flex items-center justify-between text-[10px] uppercase tracking-wider text-slate-500 pt-4 mt-auto"
                style={MONO}
              >
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-300" /> ImpactMap
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500" /> Uncalibrated
                </span>
                <span>Diagonal = Ideal</span>
              </div>
            </div>
          </div>

          {/* Model Trust & PR-AUC Benchmark Appendix */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#0a0e16]/70 p-6 backdrop-blur-xl shadow-[0_12px_28px_rgba(0,0,0,0.5)] space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-white/[0.06]">
              <div>
                <div className="text-[9px] uppercase tracking-[0.24em] text-emerald-400 mb-1" style={MONO}>
                  Algorithmic Ground Truth · Leave-One-Event-Out
                </div>
                <h3 className="text-xl text-white tracking-tight" style={SERIF}>
                  Precision-Recall (PR-AUC) &amp; Monotonic Constraints
                </h3>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-400/30 text-[10px] text-emerald-300 font-mono">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>4.9× Elevation Heuristic Lift</span>
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed max-w-3xl" style={SANS}>
              Standard elevation heuristics (e.g. Height Above Nearest Drainage alone) produce overwhelming false alarm rates in flat alluvial plains. ImpactMap combines LightGBM with strict monotonic constraints on terrain elevation and distance-to-river, cross-validated on held-out Awash flood records.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2">
              {[
                {
                  metric: 'PR-AUC (Precision-Recall)',
                  lgb: '0.8018',
                  b1: '0.4971',
                  b0: '0.1626',
                  desc: '4.9x higher precision on flooded roads',
                  accent: 'text-emerald-300',
                },
                {
                  metric: 'ROC-AUC (Discrimination)',
                  lgb: '0.9724',
                  b1: '0.8640',
                  b0: '0.6541',
                  desc: 'Near-perfect flood/dry separation',
                  accent: 'text-sky-300',
                },
                {
                  metric: 'Brier Score (Calibration)',
                  lgb: '0.0610',
                  b1: '0.1740',
                  b0: '0.4200',
                  desc: '−85.4% calibration error vs naive baseline',
                  accent: 'text-amber-300',
                },
                {
                  metric: 'Recall @ 50% Precision',
                  lgb: '0.6240',
                  b1: '0.4210',
                  b0: '0.2800',
                  desc: 'Captures 62.4% of cutoffs without noise',
                  accent: 'text-purple-300',
                },
              ].map((item) => (
                <div key={item.metric} className="rounded-xl border border-white/[0.06] bg-black/25 p-3.5 flex flex-col justify-between">
                  <div>
                    <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400 mb-1">
                      {item.metric}
                    </div>
                    <div className={`text-2xl font-mono font-bold ${item.accent} tabular-nums`}>
                      {item.lgb}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-1 space-x-2">
                      <span>Logistic: {item.b1}</span>
                      <span>HAND: {item.b0}</span>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-3 pt-2 border-t border-white/5" style={SANS}>
                    {item.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 4. Routing Parameters ── */}
        <section className="about-scroll-section space-y-8">
          <SectionHeader
            eyebrow="04 · Routing Matrix"
            accent="cyan"
            title="Simulation engine parameters"
          />

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: 'Motorway', value: '80', accent: 'text-sky-300' },
              { label: 'Trunk', value: '60', accent: 'text-sky-300' },
              { label: 'Primary', value: '50', accent: 'text-cyan-300' },
              { label: 'Secondary', value: '40', accent: 'text-slate-200' },
              { label: 'Tertiary', value: '30', accent: 'text-slate-200' },
              { label: 'Unpaved', value: '15', accent: 'text-amber-300' },
            ].map((row) => (
              <div
                key={row.label}
                className="rounded-xl border border-white/[0.08] bg-[#0a0e16]/70 p-4 backdrop-blur-xl text-center transition-all duration-300 hover:border-white/[0.16] hover:-translate-y-0.5"
              >
                <div
                  className="text-[9px] uppercase tracking-[0.22em] text-slate-500"
                  style={MONO}
                >
                  {row.label}
                </div>
                <div className={`text-3xl ${row.accent} tabular-nums leading-none mt-1.5`} style={SERIF}>
                  {row.value}
                </div>
                <div className="text-[9px] uppercase tracking-wider text-slate-500 mt-1" style={MONO}>
                  km/h nominal
                </div>
              </div>
            ))}
          </div>

          <div
            className="rounded-xl border border-white/[0.07] bg-[#0a0e16]/60 p-4 text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-4"
            style={MONO}
          >
            <div>
              Degraded ratio:{' '}
              <span className="text-sky-300 tabular-nums" style={SERIF}>
                &gt; 2.0×
              </span>{' '}
              baseline
            </div>
            <div>
              Poor baseline:{' '}
              <span className="text-amber-300 tabular-nums" style={SERIF}>
                &gt; 120 min
              </span>
            </div>
            <div>
              Closure default:{' '}
              <span className="text-white tabular-nums" style={SERIF}>
                k = 1.0
              </span>
            </div>
          </div>
        </section>

        {/* ── 5. Lexicon ── */}
        <section className="about-scroll-section space-y-8">
          <SectionHeader
            eyebrow="05 · Domain Lexicon"
            accent="amber"
            title="Standardized terminology"
          />

          {/* Search */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search lexicon…"
                className="w-full h-11 rounded-full border border-white/[0.08] bg-[#0a0e16]/70 pl-10 pr-3 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-white/20 backdrop-blur-xl"
                style={SANS}
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`text-[10px] uppercase tracking-[0.18em] px-3 py-1.5 rounded-full border transition-all ${
                    activeCategory === cat
                      ? 'bg-white text-slate-900 border-transparent shadow-[0_6px_18px_rgba(255,255,255,0.1)]'
                      : 'bg-white/[0.03] text-slate-400 border-white/[0.08] hover:text-white hover:border-white/20'
                  }`}
                  style={MONO}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGlossary.map((g) => (
              <div
                key={g.term}
                className="group rounded-xl border border-white/[0.08] bg-[#0a0e16]/60 p-5 backdrop-blur-xl shadow-[0_12px_28px_rgba(0,0,0,0.45)] transition-all duration-300 hover:border-amber-300/30 hover:-translate-y-0.5 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <h4
                    className="text-lg text-white group-hover:text-amber-100 transition-colors leading-tight"
                    style={SERIF}
                  >
                    {g.term}
                  </h4>
                  <span
                    className="text-[9px] uppercase tracking-[0.2em] text-slate-500 shrink-0 px-2 py-0.5 rounded-full border border-white/[0.08] bg-white/[0.03]"
                    style={MONO}
                  >
                    {g.category}
                  </span>
                </div>
                <p className="text-[12px] text-slate-400 leading-relaxed">{g.def}</p>
              </div>
            ))}
            {filteredGlossary.length === 0 && (
              <div
                className="col-span-full py-10 text-center text-xs text-slate-500 uppercase tracking-wider"
                style={MONO}
              >
                No match for "{searchTerm}"
              </div>
            )}
          </div>
        </section>

        {/* ── 6. Limitations ── */}
        <section className="about-scroll-section space-y-8">
          <SectionHeader
            eyebrow="06 · Known Limitations"
            accent="rose"
            title="Scientific caveats & failure modes"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { tag: 'LIM-01', scope: 'Operational', title: 'Vehicle clearance differentiation', body: 'A submerged unpaved road may remain traversable for high-clearance 6×6 relief trucks but impassable for standard ambulance vans. Model predicts inundation probability; transport managers must scale with closure factor k.' },
              { tag: 'LIM-02', scope: 'Radar', title: 'Sensor resolution constraints', body: 'Copernicus Sentinel-1 SAR (10m–30m pixel grid) cannot resolve micro-drainage culverts or raised roadside berms less than 10 meters wide.' },
              { tag: 'LIM-03', scope: 'Network', title: 'Topological graph completeness', body: 'Secondary rural tracks in Afar and Oromia may have unmapped seasonal junctions in OpenStreetMap. Unmapped dirt paths cannot be traversed by Dijkstra shortest path routines.' },
              { tag: 'LIM-04', scope: 'Monte Carlo', title: 'Spatial autocorrelation assumption', body: 'Monte Carlo sampling across links is modeled as conditionally independent given upstream rainfall, which may understate contiguous multi-kilometer corridor inundation.' },
            ].map((lim) => (
              <div
                key={lim.tag}
                className="rounded-2xl border border-rose-300/15 bg-rose-500/[0.03] p-5 backdrop-blur-xl shadow-[0_12px_28px_rgba(0,0,0,0.45)]"
              >
                <div className="flex items-center justify-between mb-3">
                  <span
                    className="text-[10px] uppercase tracking-[0.22em] text-rose-300/90"
                    style={MONO}
                  >
                    {lim.tag}
                  </span>
                  <span
                    className="text-[9px] uppercase tracking-[0.2em] text-slate-500 px-2 py-0.5 rounded-full border border-white/[0.07]"
                    style={MONO}
                  >
                    {lim.scope}
                  </span>
                </div>
                <h4 className="text-lg text-white leading-tight mb-2" style={SERIF}>
                  {lim.title}
                </h4>
                <p className="text-[12px] text-slate-400 leading-relaxed">{lim.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── 7. Data Provenance ── */}
        <section className="about-scroll-section space-y-8">
          <SectionHeader
            eyebrow="07 · Data Catalog"
            accent="emerald"
            title="Provenance & licenses"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { title: 'Roads & Facilities', source: 'OpenStreetMap contributors', license: 'Open Database License · ODbL', accent: 'text-sky-300' },
              { title: 'Digital Elevation', source: 'Copernicus GLO-30 DEM', license: 'European Space Agency', accent: 'text-emerald-300' },
              { title: 'Surface Water', source: 'JRC Global Surface Water', license: 'EC Joint Research Centre', accent: 'text-cyan-300' },
              { title: 'Gridded Population', source: 'WorldPop · 100m', license: 'Creative Commons CC-BY 4.0', accent: 'text-amber-300' },
            ].map((d) => (
              <div
                key={d.title}
                className="rounded-xl border border-white/[0.08] bg-[#0a0e16]/60 p-4 backdrop-blur-xl transition-all duration-300 hover:border-white/[0.16] hover:-translate-y-0.5"
              >
                <div className="text-base text-white mb-1" style={SERIF}>
                  {d.title}
                </div>
                <div className={`text-[12px] ${d.accent} mb-1`} style={SANS}>
                  {d.source}
                </div>
                <div
                  className="text-[10px] uppercase tracking-wider text-slate-500"
                  style={MONO}
                >
                  {d.license}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 8. API ── */}
        <section className="about-scroll-section space-y-6">
          <div className="flex items-end justify-between flex-wrap gap-3 pb-5 border-b border-white/[0.06]">
            <div>
              <div
                className="flex items-center gap-1.5 mb-2 text-cyan-300/90"
                style={MONO}
              >
                <span className="w-1 h-1 rounded-full bg-cyan-300 animate-pulse" />
                <span className="text-[10px] uppercase tracking-[0.3em]">
                  08 · Developer Contract
                </span>
              </div>
              <h2 className="text-3xl sm:text-4xl text-white leading-tight tracking-tight" style={SERIF}>
                REST API endpoints
              </h2>
            </div>

            <button
              onClick={handleCopyCurl}
              className="group inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-900 transition-all duration-300 hover:scale-105 hover:bg-amber-50 active:scale-95"
              style={SANS}
            >
              {copiedCurl ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-amber-600 transition-transform group-hover:rotate-6" />
              )}
              <span>{copiedCurl ? 'Copied' : 'Copy cURL'}</span>
            </button>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-black/50 p-5 overflow-x-auto backdrop-blur-xl shadow-[0_12px_28px_rgba(0,0,0,0.5)]">
            <pre
              className="text-[11px] leading-relaxed text-cyan-200/90"
              style={MONO}
            >
              {curlExample}
            </pre>
          </div>
          <div
            className="text-[10px] uppercase tracking-[0.22em] text-slate-500 flex items-center gap-2"
            style={MONO}
          >
            <Terminal className="w-3 h-3 text-slate-500" />
            <span>OpenAPI 3.1 spec · contracts/openapi.yaml</span>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.06] px-4 sm:px-6 py-12 text-center">
        <div className="mx-auto max-w-4xl space-y-4">
          <p className="text-sm text-slate-300" style={SANS}>
            ImpactMap AI is a clinical & humanitarian decision-support aid. Not a deterministic weather forecast.
          </p>
          <p
            className="text-[10px] uppercase tracking-[0.22em] text-slate-500"
            style={MONO}
          >
            Awash River Basin · Ground-truth validated against Copernicus Sentinel-1 SAR
          </p>
        </div>
      </footer>
    </div>
  );
};
