"use client";

import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  CloudRain,
  Brain,
  Route,
  Siren,
  RefreshCw,
  Github,
  Linkedin,
  ArrowUpRight,
  ShieldAlert,
  Layers,
  Activity,
  Cpu,
  ChevronRight,
  Sparkles,
  Radio,
  MapPin,
  CheckCircle2,
  BarChart3,
  Globe,
  Database,
  ArrowRight,
  Server,
  Zap,
} from 'lucide-react';
import StepInsideCrisisZoom from '@/components/landing/StepInsideCrisisZoom';
import HorizontalSolutionShowcase from '@/components/landing/HorizontalSolutionShowcase';
import RadialOrbitalTimeline, { type TimelineItem } from '@/components/ui/radial-orbital-timeline';
import Timeline, { type JourneyItem } from '@/components/ui/timeline';
import { LandingNavbar } from '@/components/landing/LandingNavbar';
import { HardestTechnicalProblem } from '@/components/landing/HardestTechnicalProblem';
import { RotatingGlobe } from '@/components/ui/RotatingGlobe';
import { FlowingParticleBackdrop } from '@/components/landing/FlowingParticleBackdrop';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  (window as any).ScrollTrigger = ScrollTrigger;
}

/* ── Asset URLs & Unsplash Curated Photography ── */
const U = (id: string, w = 1200) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;
/* ── Unified Continuous Background Image across entire Landing Page ── */
const HERO_BG_IMAGE = 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1920&q=80';


/* ── Architecture Pipeline Stages (Horizontal Timeline) ── */
const ARCH_TOP: JourneyItem[] = [
  {
    id: 'arch-1',
    year: 'Stage 01',
    month: 'Hydrologic Ingestion',
    content: 'CHIRPS rainfall telemetry, 24h storm hyetographs, and antecedent soil moisture indices initialize the basin state vector.',
  },
  {
    id: 'arch-3',
    year: 'Stage 03',
    month: 'Cascade Topology Solver',
    content: 'Monte Carlo Dijkstra runs 10,000 passes across 3,420 road links to uncover failure cascades and bridge bottlenecks.',
  },
  {
    id: 'arch-5',
    year: 'Stage 05',
    month: 'Ground Truth Verification',
    content: 'Leave-one-event-out holdouts benchmark predictions against real SAR floods, maintaining statistical honesty.',
  },
];

const ARCH_BOTTOM: JourneyItem[] = [
  {
    id: 'arch-2',
    year: 'Stage 02',
    month: 'Calibrated Inundation',
    content: 'Isotonically calibrated LightGBM evaluates Sentinel-1 SAR backscatter to compute true water exposure per 100m segment (ECE 0.023).',
  },
  {
    id: 'arch-4',
    year: 'Stage 04',
    month: 'What-If Interventions',
    content: 'Field commanders pin critical culverts and sandbag barriers to test counterfactual access gains before dispatching trucks.',
  },
];

/* ── Team Orbital Nodes ── */
const TEAM_ORBITAL: TimelineItem[] = [
  {
    id: 1,
    title: 'Yabets Maregn',
    date: 'Frontend & Interactive Systems Lead',
    content: 'Architected the high-frequency HUD, GSAP camera choreography, MapLibre GL 3D vector integration, and Web Audio synthesis.',
    category: 'Frontend & UX',
    icon: Layers,
    relatedIds: [2, 3],
    status: 'completed',
    energy: 100,
    github: 'https://github.com/Dagim-Tadesse/Impact-Map-AI',
    linkedin: 'https://linkedin.com',
    tags: ['React 19', 'MapLibre GL', 'GSAP', 'Web Audio'],
  },
  {
    id: 2,
    title: 'Dagim Tadesse',
    date: 'Tech Lead & Simulation Systems',
    content: 'Designed the FastAPI microservices, NetworkX topological cascade solver, Monte Carlo Dijkstra algorithms, and geospatial pipelines.',
    category: 'Architecture',
    icon: Cpu,
    relatedIds: [1, 3, 4],
    status: 'completed',
    energy: 98,
    github: 'https://github.com/Dagim-Tadesse',
    linkedin: 'https://linkedin.com',
    tags: ['FastAPI', 'NetworkX', 'GeoPandas', 'Monte Carlo'],
  },
  {
    id: 3,
    title: 'Yared Getachew',
    date: 'AI & Earth Observation Lead',
    content: 'Trained isotonically calibrated LightGBM flood classifiers on Copernicus Sentinel-1 SAR imagery and WorldPop demographic rasters.',
    category: 'Machine Learning',
    icon: Brain,
    relatedIds: [2, 4],
    status: 'completed',
    energy: 95,
    github: 'https://github.com/Dagim-Tadesse/Impact-Map-AI',
    linkedin: 'https://linkedin.com',
    tags: ['Sentinel-1 SAR', 'LightGBM', 'Gemini 2.5 Flash', 'PyTorch'],
  },
  {
    id: 4,
    title: 'Yeabsira Tilaye',
    date: 'Geospatial & Hydro-Telemetry Lead',
    content: 'Engineered Copernicus 30m DEM hydrological processing pipelines, flow accumulation matrices, and real-time precipitation sensor telemetry ingestion.',
    category: 'Geospatial',
    icon: Globe,
    relatedIds: [2, 5],
    status: 'completed',
    energy: 92,
    github: 'https://github.com/Dagim-Tadesse/Impact-Map-AI',
    linkedin: 'https://linkedin.com',
    tags: ['Copernicus DEM', 'CHIRPS Ingestion', 'PostGIS', 'Rasterio'],
  },
  {
    id: 5,
    title: 'Yeabsira Misganaw',
    date: 'Field Edge & Logistics Resilience Lead',
    content: 'Developed offline-first PWA caching with IndexedDB, bilingual English/Amharic voice telemetry generation, and SMS emergency relay channels.',
    category: 'Field Ops',
    icon: Radio,
    relatedIds: [1, 4],
    status: 'completed',
    energy: 94,
    github: 'https://github.com/Dagim-Tadesse/Impact-Map-AI',
    linkedin: 'https://linkedin.com',
    tags: ['Offline Edge', 'IndexedDB', 'Bilingual Audio', 'Field Ops'],
  },
];

/* ── Interactive Animated Counter ── */
function AnimatedCount({ to, suffix = '', prefix = '' }: { to: number; suffix?: string; prefix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      const start = performance.now();
      const duration = 1800;
      const step = (now: number) => {
        const progress = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - progress, 3);
        setVal(Math.round(to * eased));
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [to]);

  return (
    <span ref={ref}>
      {prefix}
      {val.toLocaleString()}
      {suffix}
    </span>
  );
}

/* ── Animated Text Roll Effect ── */
function TextRoll({ text, highlight = false }: { text: string; highlight?: boolean }) {
  return (
    <span className="group inline-flex overflow-hidden leading-tight">
      {[...text].map((char, i) => (
        <span
          key={i}
          className="inline-block transition-transform duration-500 ease-out group-hover:-translate-y-full"
          style={{ transitionDelay: `${i * 18}ms` }}
        >
          <span className="block">{char === ' ' ? '\u00a0' : char}</span>
          <span className={`block ${highlight ? 'text-cyan-400' : 'text-sky-400'}`}>
            {char === ' ' ? '\u00a0' : char}
          </span>
        </span>
      ))}
    </span>
  );
}

/* ── Main Landing Page Component ── */
export function LandingPage({
  onOpenDemo,
  onOpenAbout,
  codeUrl = 'https://github.com/Dagim-Tadesse/Impact-Map-AI',
}: {
  onOpenDemo: () => void;
  onOpenAbout?: () => void;
  codeUrl?: string;
}) {
  const scrollBarRef = useRef<HTMLDivElement>(null);

  // Scroll Progress Bar Tracker & ScrollTrigger Calibration
  useEffect(() => {
    const updateProgress = () => {
      if (!scrollBarRef.current) return;
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = totalScroll > 0 ? window.scrollY / totalScroll : 0;
      scrollBarRef.current.style.transform = `scaleX(${progress})`;
    };
    window.addEventListener('scroll', updateProgress, { passive: true });

    // Calibrate all pinned scroll animations across Crisis, Solution, and Architecture
    const timer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 150);

    const onLoad = () => ScrollTrigger.refresh();
    window.addEventListener('load', onLoad);
    if (typeof document !== 'undefined' && document.fonts) {
      document.fonts.ready.then(() => {
        ScrollTrigger.refresh();
      });
    }

    return () => {
      window.removeEventListener('scroll', updateProgress);
      window.removeEventListener('load', onLoad);
      clearTimeout(timer);
    };
  }, []);

  const handleLaunchDemo = () => {
    onOpenDemo();
  };

  return (
    <main className="relative min-h-screen bg-[#060a14] text-slate-200 selection:bg-amber-400/30 selection:text-white">
      {/* ── Continuous Global Backdrop (Fixed across entire Landing Page) ── */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <img
          src={HERO_BG_IMAGE}
          alt="Earth orbital satellite radar monitoring flood zones"
          className="h-full w-full object-cover object-center opacity-30 scale-105"
          loading="eager"
          fetchPriority="high"
        />
        {/* Global Ambient Radial Illumination */}
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at 30% 25%, rgba(251,191,36,0.07), transparent 60%), radial-gradient(ellipse at 75% 60%, rgba(56,189,248,0.05), transparent 65%), radial-gradient(circle at 50% 90%, rgba(244,63,94,0.03), transparent 50%)',
          }}
        />
        {/* Atmospheric fine stipple texture */}
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.8) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
        {/* Smooth unified vertical vignette */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#060a14]/60 via-[#060a14]/30 to-[#060a14]/80" />
      </div>

      {/* ── Continuous Flowing Particles Layer (Fixed across entire Landing Page) ── */}
      <FlowingParticleBackdrop particleCount={165} />

      {/* ── Floating Curved Navigation Bar ── */}
      <LandingNavbar onLaunchLive={handleLaunchDemo} />

      {/* ── Scroll Progress Indicator ── */}
      <div
        ref={scrollBarRef}
        className="fixed inset-x-0 top-0 z-50 h-[2px] origin-left scale-x-0 bg-gradient-to-r from-amber-400 via-orange-300 to-rose-400"
      />

      {/* ── Section 1: Hero (Unified Content + Rotating 3D Globe) ── */}
      <section className="relative min-h-screen w-full bg-transparent overflow-hidden z-10">
        {/* ── Unified Hero Content (Left: Copy + Cards | Right: Rotating 3D Globe) ── */}
        <div className="relative z-10 flex min-h-screen w-full items-center px-4 sm:px-6 lg:px-12 pt-20 sm:pt-24 pb-12 sm:pb-16">
          <div className="mx-auto max-w-7xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 xl:gap-14 items-center">
            {/* Left Column: Title, Narrative Pitch, Action Buttons, and Metric Cards */}
            <div className="lg:col-span-7 space-y-6 sm:space-y-7 text-left">
              <h1 className="text-5xl sm:text-6xl lg:text-[5.5rem] leading-[0.93] tracking-tight text-white drop-shadow-[0_4px_30px_rgba(0,0,0,0.95)]" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400 }}>
                Impact<em className="text-amber-300/90 font-normal">Map</em>
              </h1>

              <p className="max-w-xl text-base sm:text-lg lg:text-xl leading-relaxed text-slate-300/90 drop-shadow-[0_2px_18px_rgba(0,0,0,0.95)]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Predict critical supply corridor failure and deploy emergency relief—<span className="text-white font-medium">before convoys get trapped or hospitals get cut off</span>.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-1 sm:pt-2">
                <button
                  type="button"
                  onClick={handleLaunchDemo}
                  className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-white px-6 py-3 sm:px-8 sm:py-3.5 text-xs sm:text-sm font-semibold text-slate-900 transition-all duration-300 hover:scale-105 hover:bg-amber-50 active:scale-95" style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  <Sparkles size={15} className="text-amber-600 transition-transform group-hover:rotate-12" />
                  <span>Launch Live Explorer</span>
                  <ChevronRight size={15} className="transition-transform group-hover:translate-x-1" />
                </button>

                <a
                  href={codeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-3 sm:px-6 sm:py-3.5 text-xs sm:text-sm font-medium text-slate-200 backdrop-blur-md transition-all duration-200 hover:border-white/30 hover:bg-white/10 hover:text-white" style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  <Github size={15} />
                  <span>View Code</span>
                </a>
              </div>

              {/* Metric Cards Ledger (Integrated on the Left underneath the copy) */}
              <div className="pt-3 sm:pt-5 grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                {/* Card 1 */}
                <div className="rounded-xl border border-white/[0.08] bg-[#0a0e16]/80 p-3 sm:p-3.5 backdrop-blur-xl shadow-[0_12px_28px_rgba(0,0,0,0.5)] transition-all duration-300 hover:border-white/20">
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-mono">
                    Road Links
                  </p>
                  <p className="my-1 text-2xl sm:text-3xl font-normal text-white" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                    3,420
                  </p>
                  <p className="text-[11px] text-slate-400 leading-tight" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    Scored per 100m
                  </p>
                </div>

                {/* Card 2 */}
                <div className="rounded-xl border border-white/[0.08] bg-[#0a0e16]/80 p-3 sm:p-3.5 backdrop-blur-xl shadow-[0_12px_28px_rgba(0,0,0,0.5)] transition-all duration-300 hover:border-white/20">
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-mono">
                    Cascade Speed
                  </p>
                  <p className="my-1 text-2xl sm:text-3xl font-normal text-white" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                    &lt; 48ms
                  </p>
                  <p className="text-[11px] text-slate-400 leading-tight" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    Topological solver
                  </p>
                </div>

                {/* Card 3 */}
                <div className="rounded-xl border border-white/[0.08] bg-[#0a0e16]/80 p-3 sm:p-3.5 backdrop-blur-xl shadow-[0_12px_28px_rgba(0,0,0,0.5)] transition-all duration-300 hover:border-white/20">
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-mono">
                    Clinics Protected
                  </p>
                  <p className="my-1 text-2xl sm:text-3xl font-normal text-white" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                    89
                  </p>
                  <p className="text-[11px] text-slate-400 leading-tight" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    Referral centers
                  </p>
                </div>

                {/* Card 4 */}
                <div className="rounded-xl border border-white/[0.08] bg-[#0a0e16]/80 p-3 sm:p-3.5 backdrop-blur-xl shadow-[0_12px_28px_rgba(0,0,0,0.5)] transition-all duration-300 hover:border-white/20">
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-mono">
                    Calibration ECE
                  </p>
                  <p className="my-1 text-2xl sm:text-3xl font-normal text-white" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                    0.023
                  </p>
                  <p className="text-[11px] text-slate-400 leading-tight" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    SAR ground truth
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Rotating 3D Globe with Awash Basin Logistics Hub */}
            <div className="lg:col-span-5 w-full flex items-center justify-center">
              <RotatingGlobe className="w-full h-[360px] sm:h-[440px] lg:h-[520px]" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 2: The Problem (Step Inside Crisis Zoom-In Scroll Animation) ── */}
      <section id="crisis" className="relative bg-transparent z-10">
        <StepInsideCrisisZoom />
      </section>

      {/* ── Section 3: The Solution (Pinned 5-Card Horizontal Scroll Showcase) ── */}
      <section id="solution" className="relative bg-transparent z-10">
        <HorizontalSolutionShowcase onLaunchDemo={handleLaunchDemo} />
      </section>

      {/* ── Section 4: The Hardest Technical Problem Solved ── */}
      <HardestTechnicalProblem />

      {/* ── Section 5: How It Works (System Architecture - Horizontal Timeline) ── */}
      <section id="architecture" className="relative bg-transparent z-10">
        <Timeline
          heading="From Raindrops to Relief Convoys"
          title="Pipeline"
          periodLabel="5-Stage Engine"
          topItems={ARCH_TOP}
          bottomItems={ARCH_BOTTOM}
          activeColor="#06b6d4"
          backgroundColor="transparent"
          textColor="#f8fafc"
          mutedTextColor="#94a3b8"
          imageUrl={U('photo-1451187580459-43490279c0fa', 1200)}
          imageAlt="Digital elevation model processing pipeline"
        />
      </section>

      {/* ── Section 5: The Team (Interactive Orbital Graph + 3D Tilt Cards) ── */}
      <section id="team" className="py-12 sm:py-20 bg-transparent relative z-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center space-y-2 sm:space-y-4">
            <h2 className="text-2xl sm:text-5xl md:text-6xl tracking-tight text-white" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400 }}>
              Meet the Team
            </h2>
            <p className="mx-auto max-w-xl text-xs sm:text-base text-slate-400" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Engineering solutions at the intersection of remote sensing, network topology, and humanitarian crisis intelligence.
            </p>
          </div>

          {/* Interactive Team Orbital Graph (Full-screen apex rotation + center HUD) */}
          <div className="mt-4 sm:mt-8 w-full">
            <RadialOrbitalTimeline timelineData={TEAM_ORBITAL} />
          </div>
        </div>
      </section>

      {/* ── Section 6: Final CTA & Footer ── */}
      <footer className="border-t border-white/[0.06] bg-transparent px-4 sm:px-6 py-12 sm:py-20 text-center relative overflow-hidden z-10">
        <div className="mx-auto max-w-4xl space-y-5 sm:space-y-8">
          <h2 className="text-3xl sm:text-6xl md:text-7xl tracking-tight text-white" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400 }}>
            <TextRoll text="Ready to Stress Test?" />
          </h2>
          <p className="mx-auto max-w-lg text-xs sm:text-base text-slate-400" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Launch the live interactive digital twin now, test what-if bridge barricades, and export field-ready SitReps.
          </p>

          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <button
              type="button"
              onClick={handleLaunchDemo}
              className="rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-slate-900 transition hover:scale-105 hover:bg-amber-50 active:scale-95" style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              Launch Live Explorer
            </button>

            <a
              href={codeUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3.5 text-sm font-medium text-slate-300 backdrop-blur transition hover:border-white/25 hover:text-white" style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              <Github size={16} />
              <span>GitHub Repo</span>
            </a>

            {onOpenAbout && (
              <button
                type="button"
                onClick={onOpenAbout}
                className="inline-flex items-center gap-1.5 text-sm text-slate-300 hover:text-white transition underline decoration-white/20 underline-offset-4 hover:decoration-white/50" style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                <span>Read Full Methodology</span>
                <ArrowUpRight size={14} />
              </button>
            )}
          </div>

          <div className="border-t border-white/[0.04] pt-8 mt-12 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
            <p>© 2026 ImpactMap AI • Open Source Humanitarian Digital Twin</p>
            <p>Awash Basin Topological Corridor Intelligence</p>
          </div>
        </div>
      </footer>
    </main>
  );
}

export default LandingPage;
