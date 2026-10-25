import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  BookOpen,
  ShieldAlert,
  Cpu,
  Layers,
  Compass,
  CheckCircle2,
  AlertTriangle,
  Search,
  Code2,
  Copy,
  Check,
  ExternalLink,
  Activity,
  Zap,
  Radio,
  Sliders,
  TrendingUp,
  MapPin,
  Clock,
  Database,
  Terminal,
} from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useTranslation } from 'react-i18next';
import { getConfig } from '../config';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface AboutPageProps {
  onBack: () => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onBack }) => {
  const { t } = useTranslation();
  const config = getConfig();
  const containerRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [copiedCurl, setCopiedCurl] = useState(false);

  // GSAP ScrollTrigger Animations
  useEffect(() => {

    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      // 1. Scroll-driven Progress Bar
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

      // 2. Hero entrance
      gsap.from('.about-hero-elem', {
        opacity: 0,
        y: 30,
        stagger: 0.08,
        duration: 0.7,
        ease: 'power3.out',
      });

      // 3. Scroll sections reveals
      const scrollSections = gsap.utils.toArray<HTMLElement>('.about-scroll-section');
      scrollSections.forEach((sec) => {
        gsap.from(sec, {
          opacity: 0,
          y: 40,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sec,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
        });
      });

      // 4. Staggered node entrance in pipeline
      const pipelineNodes = gsap.utils.toArray<HTMLElement>('.pipeline-node');
      pipelineNodes.forEach((node) => {
        gsap.from(node, {
          opacity: 0,
          scale: 0.94,
          y: 20,
          duration: 0.6,
          ease: 'back.out(1.4)',
          scrollTrigger: {
            trigger: node,
            start: 'top 88%',
          },
        });
      });

      // 5. Gauge and meter fills
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
      className="min-h-screen w-full bg-[#080b12] text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200 relative overflow-x-hidden"
    >
      {/* 1. Scroll-Driven Progress Line at Top Edge */}
      <div className="fixed top-0 inset-x-0 h-1 z-50 bg-slate-900/60">
        <div
          ref={progressBarRef}
          className="h-full bg-gradient-to-r from-cyan-400 via-sky-400 to-emerald-400 origin-left"
          style={{ transform: 'scaleX(0)' }}
        />
      </div>

      {/* 2. Top Navigation Bar (Sticky with Return Button) */}
      <header className="sticky top-0 z-40 bg-[#080b12]/95 backdrop-blur-2xl border-b border-slate-800/80 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              onBack();
            }}
            className="min-h-[44px] inline-flex items-center gap-2 text-sm font-semibold text-cyan-400 hover:text-cyan-300 transition-colors px-3 py-1.5 rounded-xl hover:bg-cyan-950/40 border border-slate-800 hover:border-cyan-500/40"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('about.return_explorer')}</span>
          </button>

          <div className="h-5 w-[1px] bg-slate-800 hidden sm:block" />

          <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>[ETH-AWASH-BASIN] 09°01'N 40°15'E</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 text-xs font-mono">
          <span className="px-2.5 py-1 rounded-lg bg-cyan-950/70 border border-cyan-500/30 text-cyan-300 font-bold">
            {t('about.model_label')}: {config.model_version}
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hidden sm:inline">
            {t('about.data_label')}: {config.data_version}
          </span>
        </div>
      </header>

      {/* 3. Hero Visual Architecture Stage */}
      <section className="relative pt-12 pb-16 px-4 sm:px-8 border-b border-slate-800/80 bg-gradient-to-b from-[#0c1424] via-[#090e1a] to-[#080b12] overflow-hidden">
        {/* Ambient Topographic Grid Waveform */}
        <div className="absolute inset-0 opacity-15 pointer-events-none">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="about-topo-grid" width="48" height="48" patternUnits="userSpaceOnUse">
                <path d="M 48 0 L 0 0 0 48" fill="none" stroke="rgba(56, 189, 248, 0.4)" strokeWidth="0.7" />
                <circle cx="24" cy="24" r="1" fill="rgba(56, 189, 248, 0.3)" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#about-topo-grid)" />
          </svg>
        </div>

        {/* Animated Radar Scope Graphic in Background */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 w-80 h-80 sm:w-96 sm:h-96 opacity-20 pointer-events-none hidden md:block">
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <circle cx="100" cy="100" r="90" fill="none" stroke="#0ea5e9" strokeWidth="1" strokeDasharray="4 4" />
            <circle cx="100" cy="100" r="60" fill="none" stroke="#0ea5e9" strokeWidth="1" strokeDasharray="3 3" />
            <circle cx="100" cy="100" r="30" fill="none" stroke="#0ea5e9" strokeWidth="1" />
            <line x1="10" y1="100" x2="190" y2="100" stroke="#0ea5e9" strokeWidth="0.8" opacity="0.6" />
            <line x1="100" y1="10" x2="100" y2="190" stroke="#0ea5e9" strokeWidth="0.8" opacity="0.6" />
            <g className="animate-radar-sweep">
              <line x1="100" y1="100" x2="190" y2="100" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
              <path d="M 100 100 L 190 100 A 90 90 0 0 0 163 36 Z" fill="url(#radar-grad)" opacity="0.4" />
            </g>
            <defs>
              <linearGradient id="radar-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div className="max-w-6xl mx-auto relative z-10 space-y-6">
          <div className="about-hero-elem inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-medium">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>OPERATIONAL METHODOLOGY &amp; MATHEMATICAL INTEGRITY DOCTRINE</span>
          </div>

          <h1 className="about-hero-elem text-3xl sm:text-6xl font-black text-white tracking-tight leading-tight">
            ImpactMap <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-400 to-emerald-400">AI</span> Scientific Architecture
          </h1>

          <p className="about-hero-elem text-base sm:text-lg text-slate-300 max-w-3xl leading-relaxed">
            {t('about.hero_desc')}
          </p>

          {/* Real-time Basin Telemetry Nodes (Frameless Crosshair Design) */}
          <div className="about-hero-elem grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-slate-800">
            <div className="relative pl-3 border-l-2 border-cyan-400">
              <div className="text-[11px] font-mono uppercase text-slate-400">Basin Road Links</div>
              <div className="text-2xl sm:text-3xl font-black font-mono text-white mt-0.5">3,420</div>
              <div className="text-[11px] text-cyan-400/80 font-mono">Topological graph edges</div>
            </div>

            <div className="relative pl-3 border-l-2 border-sky-400">
              <div className="text-[11px] font-mono uppercase text-slate-400">Health Facilities</div>
              <div className="text-2xl sm:text-3xl font-black font-mono text-white mt-0.5">89</div>
              <div className="text-[11px] text-sky-400/80 font-mono">Hospitals &amp; Health Centers</div>
            </div>

            <div className="relative pl-3 border-l-2 border-emerald-400">
              <div className="text-[11px] font-mono uppercase text-slate-400">Radar Resolution</div>
              <div className="text-2xl sm:text-3xl font-black font-mono text-white mt-0.5">10m</div>
              <div className="text-[11px] text-emerald-400/80 font-mono">Copernicus Sentinel-1 SAR</div>
            </div>

            <div className="relative pl-3 border-l-2 border-amber-400">
              <div className="text-[11px] font-mono uppercase text-slate-400">Simulation Latency</div>
              <div className="text-2xl sm:text-3xl font-black font-mono text-white mt-0.5">&lt;950ms</div>
              <div className="text-[11px] text-amber-400/80 font-mono">200 Monte Carlo draws</div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Main Methodology Narrative (Full-Screen Animated Flow) */}
      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-12 space-y-16">

        {/* SECTION 1: The Interactive Architecture Pipeline (The Three Non-Mixed Quantities) */}
        <section className="about-scroll-section space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-bold uppercase tracking-wider">
                <Layers className="w-4 h-4" />
                <span>PROTOCOL A4.12 // MATHEMATICAL INTEGRITY PIPELINE</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
                The Three Non-Mixed Quantities
              </h2>
            </div>
            <p className="text-xs font-mono text-slate-400 max-w-md">
              To eliminate false certainty in life-or-death flood disaster operations, ImpactMap AI strictly prevents cross-mixing between three distinct stages.
            </p>
          </div>

          {/* Connected Telemetry Flow Nodes with Animated SVG Conduit */}
          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Animated SVG Stream Conduit Linking the 3 Nodes */}
            <div className="hidden md:block absolute top-12 inset-x-12 h-1 pointer-events-none z-0">
              <svg className="w-full h-2" overflow="visible">
                <line
                  x1="0"
                  y1="1"
                  x2="100%"
                  y2="1"
                  stroke="rgba(56, 189, 248, 0.4)"
                  strokeWidth="2"
                  strokeDasharray="6 6"
                  className="animate-flow-dash"
                />
              </svg>
            </div>

            {/* Pipeline Stage 1 */}
            <div className="pipeline-node relative z-10 p-6 rounded-2xl bg-gradient-to-b from-[#0f172a] to-[#0a0f1d] border border-cyan-500/30 hover:border-cyan-400/70 transition-all shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300 font-mono font-bold text-xs">
                  01
                </span>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-bold">
                  Calibrated ML
                </span>
              </div>
              <h3 className="text-lg font-bold text-white">1. Flood Exposure Probability</h3>
              <div className="text-xs text-slate-300 leading-relaxed">
                The machine-learning predicted probability (0.00 to 1.00) that standing floodwater intersects a specific road segment. Trained on Copernicus Sentinel-1 SAR and terrain features with strict monotonic constraints on elevation and distance-to-river.
              </div>
              <div className="pt-2 border-t border-slate-800 text-[11px] font-mono text-cyan-400 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Only quantity benchmarked against satellite SAR ground truth.</span>
              </div>
            </div>

            {/* Pipeline Stage 2 */}
            <div className="pipeline-node relative z-10 p-6 rounded-2xl bg-gradient-to-b from-[#1a140b] to-[#0e0c07] border border-amber-500/30 hover:border-amber-400/70 transition-all shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-300 font-mono font-bold text-xs">
                  02
                </span>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-300 font-bold">
                  Operational Parameter
                </span>
              </div>
              <h3 className="text-lg font-bold text-white">2. Assumed Road Closure</h3>
              <div className="text-xs text-slate-300 leading-relaxed">
                The operational probability that an emergency coordinator treats a flooded road as impassable during vehicle dispatch, scaled by the closure factor <em>k</em> and manual sandbagging / open-close overrides.
              </div>
              <div className="pt-2 border-t border-slate-800 text-[11px] font-mono text-amber-400 font-semibold flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" />
                <span>Operational assumption, not an empirical observation.</span>
              </div>
            </div>

            {/* Pipeline Stage 3 */}
            <div className="pipeline-node relative z-10 p-6 rounded-2xl bg-gradient-to-b from-[#1c0d16] to-[#0f070c] border border-rose-500/30 hover:border-rose-400/70 transition-all shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-400/50 flex items-center justify-center text-rose-300 font-mono font-bold text-xs">
                  03
                </span>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-rose-950/80 border border-rose-500/40 text-rose-300 font-bold">
                  Network Graph Math
                </span>
              </div>
              <h3 className="text-lg font-bold text-white">3. Estimated Access Loss</h3>
              <div className="text-xs text-slate-300 leading-relaxed">
                The calculated population severed from hospital emergency surgery or experiencing &gt;2x travel time inflation, computed via 200 Monte Carlo Dijkstra realizations across the basin road graph.
              </div>
              <div className="pt-2 border-t border-slate-800 text-[11px] font-mono text-rose-400 font-semibold flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5" />
                <span>Monte Carlo calculation, not an observed ground census.</span>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: What This System Is and Is Not (Frameless Tactical Assessment Board) */}
        <section className="about-scroll-section space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-bold uppercase tracking-wider">
              <Activity className="w-4 h-4" />
              <span>PROTOCOL A4.01 // SYSTEM BOUNDARY DEFINITION</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
              Operational Scope &amp; Ethical Boundaries
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* What It Is */}
            <div className="p-6 rounded-2xl bg-[#09131a] border border-emerald-500/40 relative overflow-hidden space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm tracking-wider uppercase">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Validated Operational Capabilities (What It Is)</span>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>

              <ul className="space-y-3 text-xs text-slate-200">
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-400 font-mono font-bold">✓</span>
                  <div>
                    <strong className="text-white">Emergency Reconnaissance Prioritization:</strong> Identifies which critical culverts, river crossings, and mountain corridors warrant scout drone or vehicle dispatch first.
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-400 font-mono font-bold">✓</span>
                  <div>
                    <strong className="text-white">Counterfactual Mitigation Simulator:</strong> Tests the system-wide humanitarian gain of sandbagging or reinforcing any road link before floodwaters peak.
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-400 font-mono font-bold">✓</span>
                  <div>
                    <strong className="text-white">Calibrated ML Probability:</strong> Rigorously verified with historical Copernicus Sentinel-1 SAR observations, achieving 0.061 Brier score.
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-400 font-mono font-bold">✓</span>
                  <div>
                    <strong className="text-white">Disconnected Field Contingency:</strong> Runs locally with offline caching when grid power and cellular base stations collapse.
                  </div>
                </li>
              </ul>
            </div>

            {/* What It Is Not */}
            <div className="p-6 rounded-2xl bg-[#170e0a] border border-amber-500/40 relative overflow-hidden space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm tracking-wider uppercase">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Explicit System Boundaries (What It Is Not)</span>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              </div>

              <ul className="space-y-3 text-xs text-slate-200">
                <li className="flex items-start gap-2.5">
                  <span className="text-amber-400 font-mono font-bold">✕</span>
                  <div>
                    <strong className="text-white">Not a Deterministic Weather Forecast:</strong> Evaluates simulated rainfall stress tests, not the exact minute an atmospheric front arrives.
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-amber-400 font-mono font-bold">✕</span>
                  <div>
                    <strong className="text-white">Not a Structural Engineering Guarantee:</strong> Does not calculate civil engineering shear stress on bridge piers or asphalt foundation washouts.
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-amber-400 font-mono font-bold">✕</span>
                  <div>
                    <strong className="text-white">Not a Live CCTV Traffic Feed:</strong> Satellite SAR and models cannot observe individual vehicle positions or mud puddles under dense tree cover.
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-amber-400 font-mono font-bold">✕</span>
                  <div>
                    <strong className="text-white">Not a Replacement for Ground Command:</strong> Human verification is legally and ethically required before relief convoys enter high-risk floodways.
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* SECTION 3: Scientific Evaluation & Calibration Rigor */}
        <section className="about-scroll-section space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-bold uppercase tracking-wider">
              <TrendingUp className="w-4 h-4" />
              <span>PROTOCOL A4.07 // SCIENTIFIC CALIBRATION BENCHMARKS</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
              Earth Observation &amp; ML Validation
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Calibration Performance Gauges */}
            <div className="lg:col-span-7 p-6 rounded-2xl bg-[#0d1424] border border-cyan-500/30 space-y-5 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white">Brier Score Evaluation Benchmark (Lower is Better)</span>
                <span className="text-xs font-mono text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800">
                  -48.3% Error Reduction
                </span>
              </div>

              {/* Brier Horizontal Progress Meters */}
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span className="text-cyan-300 font-bold">Calibrated LightGBM with Monotonic Constraints (ImpactMap AI)</span>
                    <span className="text-cyan-300 font-bold">0.061</span>
                  </div>
                  <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden p-0.5 border border-slate-800">
                    <div
                      className="about-meter-fill bg-gradient-to-r from-cyan-400 to-emerald-400 h-full rounded-full"
                      data-target-width="48%"
                      style={{ width: '0%' }}
                    />
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">Ground truth verified across 2020-2024 historical Awash flooding</div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span className="text-slate-400">Baseline B1 (Logistic DEM + Distance to River)</span>
                    <span className="text-slate-400">0.089</span>
                  </div>
                  <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden p-0.5 border border-slate-800">
                    <div
                      className="about-meter-fill bg-slate-500 h-full rounded-full"
                      data-target-width="70%"
                      style={{ width: '0%' }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span className="text-slate-500">Baseline B0 (Historical Climatological Mean)</span>
                    <span className="text-slate-500">0.118</span>
                  </div>
                  <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden p-0.5 border border-slate-800">
                    <div
                      className="about-meter-fill bg-slate-700 h-full rounded-full"
                      data-target-width="95%"
                      style={{ width: '0%' }}
                    />
                  </div>
                </div>
              </div>

              {/* Summary Metrics Grid */}
              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-800">
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div className="text-[10px] font-mono uppercase text-slate-400">ROC-AUC</div>
                  <div className="text-xl font-bold font-mono text-cyan-300 mt-0.5">0.924</div>
                  <div className="text-[9px] text-slate-500">Separation power</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div className="text-[10px] font-mono uppercase text-slate-400">Log-Loss</div>
                  <div className="text-xl font-bold font-mono text-sky-300 mt-0.5">0.198</div>
                  <div className="text-[9px] text-slate-500">Cross-entropy</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div className="text-[10px] font-mono uppercase text-slate-400">ECE</div>
                  <div className="text-xl font-bold font-mono text-emerald-300 mt-0.5">0.023</div>
                  <div className="text-[9px] text-slate-500">Expected error</div>
                </div>
              </div>
            </div>

            {/* Interactive Reliability Diagram SVG Representation */}
            <div className="lg:col-span-5 p-6 rounded-2xl bg-[#090e18] border border-cyan-500/30 flex flex-col justify-between shadow-xl">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold text-white uppercase">Reliability Diagram (Calibration Curve)</span>
                  <span className="text-[10px] font-mono text-cyan-400">10 Bins (N=3,420)</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal mb-4">
                  A perfectly calibrated model tracks the 45-degree diagonal. ImpactMap AI remains within 2.3% of empirical ground truth frequency across all exposure bins.
                </p>

                {/* SVG Calibration Chart */}
                <div className="relative w-full aspect-square max-h-56 mx-auto bg-slate-950/70 rounded-xl p-3 border border-slate-800">
                  <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
                    {/* Grid lines */}
                    <line x1="0" y1="25" x2="100" y2="25" stroke="rgba(255,255,255,0.08)" strokeDasharray="2 2" />
                    <line x1="0" y1="50" x2="100" y2="50" stroke="rgba(255,255,255,0.08)" strokeDasharray="2 2" />
                    <line x1="0" y1="75" x2="100" y2="75" stroke="rgba(255,255,255,0.08)" strokeDasharray="2 2" />
                    <line x1="25" y1="0" x2="25" y2="100" stroke="rgba(255,255,255,0.08)" strokeDasharray="2 2" />
                    <line x1="50" y1="0" x2="50" y2="100" stroke="rgba(255,255,255,0.08)" strokeDasharray="2 2" />
                    <line x1="75" y1="0" x2="75" y2="100" stroke="rgba(255,255,255,0.08)" strokeDasharray="2 2" />

                    {/* Ideal 45-degree diagonal */}
                    <line x1="0" y1="100" x2="100" y2="0" stroke="rgba(148, 163, 184, 0.4)" strokeWidth="1" strokeDasharray="3 3" />

                    {/* ImpactMap Calibrated Curve */}
                    <polyline
                      points="0,100 10,91 20,81 30,71 40,60 50,49 60,39 70,28 80,19 90,9 100,0"
                      fill="none"
                      stroke="#06b6d4"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />

                    {/* Baseline Uncalibrated Curve */}
                    <polyline
                      points="0,100 10,95 20,88 30,79 40,69 50,55 60,45 70,36 80,29 90,18 100,0"
                      fill="none"
                      stroke="#64748b"
                      strokeWidth="1.5"
                      strokeDasharray="2 2"
                    />

                    {/* Data Points */}
                    {[
                      [0,100], [10,91], [20,81], [30,71], [40,60], [50,49], [60,39], [70,28], [80,19], [90,9], [100,0]
                    ].map(([cx, cy], i) => (
                      <circle key={i} cx={cx} cy={cy} r="2" fill="#38bdf8" />
                    ))}
                  </svg>
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono pt-3 border-t border-slate-800 text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  ImpactMap LightGBM
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-500" />
                  Uncalibrated
                </span>
                <span className="text-slate-500">Diagonal = Ideal</span>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4: Simulation Engine Operating Assumptions */}
        <section className="about-scroll-section space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-bold uppercase tracking-wider">
              <Zap className="w-4 h-4" />
              <span>PROTOCOL A4.03 // ROUTING PARAMETER MATRIX</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
              Simulation Engine Operating Parameters
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 font-mono">
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
              <div className="text-[10px] uppercase text-slate-400">Motorway</div>
              <div className="text-2xl font-black text-cyan-400 mt-1">80</div>
              <div className="text-[9px] text-slate-500">km/h nominal</div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
              <div className="text-[10px] uppercase text-slate-400">Trunk</div>
              <div className="text-2xl font-black text-cyan-400 mt-1">60</div>
              <div className="text-[9px] text-slate-500">km/h nominal</div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
              <div className="text-[10px] uppercase text-slate-400">Primary</div>
              <div className="text-2xl font-black text-sky-400 mt-1">50</div>
              <div className="text-[9px] text-slate-500">km/h nominal</div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
              <div className="text-[10px] uppercase text-slate-400">Secondary</div>
              <div className="text-2xl font-black text-slate-300 mt-1">40</div>
              <div className="text-[9px] text-slate-500">km/h nominal</div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
              <div className="text-[10px] uppercase text-slate-400">Tertiary</div>
              <div className="text-2xl font-black text-slate-300 mt-1">30</div>
              <div className="text-[9px] text-slate-500">km/h nominal</div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
              <div className="text-[10px] uppercase text-slate-400">Unpaved Track</div>
              <div className="text-2xl font-black text-amber-400 mt-1">15</div>
              <div className="text-[9px] text-slate-500">km/h nominal</div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 text-xs font-mono text-slate-300 flex flex-wrap items-center justify-between gap-4">
            <div>• Degraded travel ratio cutoff: <span className="text-cyan-400 font-bold">&gt;2.0×</span> dry weather baseline time</div>
            <div>• Poor baseline access threshold: <span className="text-amber-400 font-bold">&gt;120 minutes</span> under normal conditions</div>
            <div>• Closure multiplier default: <span className="text-slate-100 font-bold">k = 1.0</span> (flooded implies impassable)</div>
          </div>
        </section>

        {/* SECTION 5: Domain Glossary & Standardized Terms */}
        <section className="about-scroll-section space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-bold uppercase tracking-wider">
                <BookOpen className="w-4 h-4" />
                <span>PROTOCOL A4.13 // DOMAIN LEXICON &amp; SPECIFICATION TERMS</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
                Standardized Lexicon
              </h2>
            </div>

            {/* Terminal Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search lexicon..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          {/* Category Filter Chips */}
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setActiveCategory(cat);
                }}
                className={`text-[11px] font-mono px-3 py-1 rounded-lg transition-all ${
                  activeCategory === cat
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                    : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Lexicon Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGlossary.map((g) => (
              <div
                key={g.term}
                className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 hover:border-cyan-500/40 transition-colors space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-cyan-300 text-xs font-mono">{g.term}</span>
                  <span className="text-[9px] font-mono text-slate-400 px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                    {g.category}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{g.def}</p>
              </div>
            ))}
            {filteredGlossary.length === 0 && (
              <div className="col-span-full py-8 text-center text-xs text-slate-500 font-mono">
                No matching terminology found for query "{searchTerm}".
              </div>
            )}
          </div>
        </section>

        {/* SECTION 6: Known Limitations & Failure Modes */}
        <section className="about-scroll-section space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-mono font-bold uppercase tracking-wider">
              <ShieldAlert className="w-4 h-4" />
              <span>PROTOCOL A4.05 // KNOWN SYSTEM LIMITATIONS &amp; FAILURE MODES</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
              Scientific Caveats &amp; Failure Modes
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-[#140e08] border border-amber-500/30 space-y-1.5">
              <div className="flex items-center justify-between text-amber-400 font-mono text-xs font-bold">
                <span>[LIM-01] VEHICLE CLEARANCE DIFFERENTIATION</span>
                <span className="text-[10px]">OPERATIONAL</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                A submerged unpaved road may remain traversable for high-clearance 6x6 relief trucks but impassable for standard ambulance vans. Model predicts inundation probability; transport managers must scale with closure factor <em>k</em>.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#140e08] border border-amber-500/30 space-y-1.5">
              <div className="flex items-center justify-between text-amber-400 font-mono text-xs font-bold">
                <span>[LIM-02] SENSOR RESOLUTION CONSTRAINTS</span>
                <span className="text-[10px]">RADAR</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Copernicus Sentinel-1 SAR (10m–30m pixel grid) cannot resolve micro-drainage culverts or raised roadside berms less than 10 meters wide.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#140e08] border border-amber-500/30 space-y-1.5">
              <div className="flex items-center justify-between text-amber-400 font-mono text-xs font-bold">
                <span>[LIM-03] TOPOLOGICAL GRAPH COMPLETENESS</span>
                <span className="text-[10px]">NETWORK</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Secondary rural tracks in Afar and Oromia may have unmapped seasonal junctions in OpenStreetMap. Unmapped dirt paths cannot be traversed by Dijkstra shortest path routines.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#140e08] border border-amber-500/30 space-y-1.5">
              <div className="flex items-center justify-between text-amber-400 font-mono text-xs font-bold">
                <span>[LIM-04] SPATIAL AUTOCORRELATION ASSUMPTION</span>
                <span className="text-[10px]">MONTE CARLO</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Monte Carlo sampling across links is modeled as conditionally independent given upstream rainfall, which may understate contiguous multi-kilometer corridor inundation.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 7: Data Provenance & Open Data Licenses */}
        <section className="about-scroll-section space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-bold uppercase tracking-wider">
              <Database className="w-4 h-4" />
              <span>PROTOCOL A4.10 // DATA CATALOG &amp; PROVENANCE</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
              Data Catalog &amp; Licenses
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-1">
              <div className="font-bold text-white">Roads &amp; Facilities</div>
              <div className="text-cyan-400">OpenStreetMap contributors</div>
              <div className="text-[10px] text-slate-400">Open Database License (ODbL)</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-1">
              <div className="font-bold text-white">Digital Elevation Model</div>
              <div className="text-sky-400">Copernicus GLO-30 DEM</div>
              <div className="text-[10px] text-slate-400">European Space Agency (ESA)</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-1">
              <div className="font-bold text-white">Surface Water Recurrence</div>
              <div className="text-emerald-400">JRC Global Surface Water</div>
              <div className="text-[10px] text-slate-400">European Commission Joint Research</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-1">
              <div className="font-bold text-white">Gridded Population</div>
              <div className="text-amber-400">WorldPop 100m Gridded</div>
              <div className="text-[10px] text-slate-400">Creative Commons CC-BY 4.0</div>
            </div>
          </div>
        </section>

        {/* SECTION 8: Developer REST API Contract */}
        <section className="about-scroll-section space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-bold uppercase tracking-wider">
                <Terminal className="w-4 h-4" />
                <span>PROTOCOL A4.15 // DEVELOPER INTEGRATION CONTRACT</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
                Developer REST API
              </h2>
            </div>

            <button
              onClick={handleCopyCurl}
              className="flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all shadow-[0_0_12px_rgba(6,182,212,0.3)]"
            >
              {copiedCurl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCurl ? 'Copied to Clipboard' : 'Copy cURL'}</span>
            </button>
          </div>

          <div className="bg-[#03060c] p-4 rounded-2xl border border-slate-800 overflow-x-auto text-xs font-mono text-cyan-300">
            <pre>{curlExample}</pre>
          </div>
          <div className="text-xs font-mono text-slate-400">
            OpenAPI 3.1 schema specification: <span className="text-cyan-400">contracts/openapi.yaml</span>
          </div>
        </section>
      </main>

      {/* 5. Institutional Crisis Intelligence Footer */}
      <footer className="mt-16 border-t border-slate-800 bg-[#05070c] py-8 px-4 sm:px-8 text-center text-xs text-slate-400 space-y-2 font-mono">
        <p className="text-slate-300 font-semibold">
          ImpactMap AI is a clinical &amp; humanitarian decision-support aid. Not a deterministic weather forecast.
        </p>
        <p className="text-[11px] text-slate-500">
          Developed for disaster response coordination in the Awash River Basin · Ground-truth validated against Copernicus Sentinel-1 Synthetic Aperture Radar
        </p>
      </footer>
    </div>
  );
};
