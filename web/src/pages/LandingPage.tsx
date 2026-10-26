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
import { TiltedGridHero } from '@/components/ui/tilted-grid-hero';
import StepInsideCrisisZoom from '@/components/landing/StepInsideCrisisZoom';
import HorizontalSolutionShowcase from '@/components/landing/HorizontalSolutionShowcase';
import RadialOrbitalTimeline, { type TimelineItem } from '@/components/ui/radial-orbital-timeline';
import Timeline, { type JourneyItem } from '@/components/ui/timeline';
import { LandingNavbar } from '@/components/landing/LandingNavbar';
import { HardestTechnicalProblem } from '@/components/landing/HardestTechnicalProblem';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  (window as any).ScrollTrigger = ScrollTrigger;
}

/* ── Asset URLs & Unsplash Curated Photography ── */
const U = (id: string, w = 1200) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;
const U_HERO = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=380&q=60`;

/* ── Single Unified Background Image for Hero ── */
const HERO_BG_IMAGE = 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1920&q=80';

/* ── PC 3D Cylinder Rotating Image Tiles ── */
const HERO_GRID = [
  { src: U_HERO('photo-1446776811953-b23d57bd21aa'), alt: 'Orbital satellite radar monitoring flood zones' },
  { src: U_HERO('photo-1451187580459-43490279c0fa'), alt: 'High resolution digital elevation model topology' },
  { src: U_HERO('photo-1465447142348-e9952c393450'), alt: 'Flooded critical transport artery in East Africa' },
  { src: U_HERO('photo-1547683905-f686c993aae5'), alt: 'Sudden flash flood stormfront over river basin' },
  { src: U_HERO('photo-1524661135-423995f22d0b'), alt: 'Emergency logistics coordination in remote sector' },
  { src: U_HERO('photo-1489392191049-fc10c97e64b6'), alt: 'Critical bridge infrastructure crossing water channel' },
  { src: U_HERO('photo-1519494026892-80bbd2d6fd0d'), alt: 'Rural clinic and emergency healthcare compound' },
  { src: U_HERO('photo-1584438784894-089d6a62b8fa'), alt: 'Medical humanitarian aid delivery convoy' },
];

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
    }, 120);

    return () => {
      window.removeEventListener('scroll', updateProgress);
      clearTimeout(timer);
    };
  }, []);

  const handleLaunchDemo = () => {
    onOpenDemo();
  };

  return (
    <main className="min-h-screen bg-[#060a14] text-slate-100 selection:bg-cyan-500 selection:text-black">
      {/* ── Floating Curved Navigation Bar ── */}
      <LandingNavbar onLaunchLive={handleLaunchDemo} />

      {/* ── Scroll Progress Indicator ── */}
      <div
        ref={scrollBarRef}
        className="fixed inset-x-0 top-0 z-50 h-[3px] origin-left scale-x-0 bg-gradient-to-r from-cyan-500 via-sky-400 to-emerald-400 shadow-[0_0_12px_rgba(6,182,212,0.8)]"
      />

      {/* ── Section 1: Hero (Single Background Image + PC 3D Cylinder / Mobile Static) ── */}
      <section className="relative min-h-screen w-full bg-[#060a14] overflow-hidden">
        {/* ── Single Unified Background Image for Hero ── */}
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          <img
            src={HERO_BG_IMAGE}
            alt="Orbital satellite radar monitoring flood zones"
            className="h-full w-full object-cover object-center opacity-30 scale-100"
            loading="eager"
            fetchPriority="high"
          />
          {/* Ambient radial glows & cybernetic grid matching rest of page */}
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse at 50% 35%, rgba(6,182,212,0.22), rgba(2,132,199,0.1) 45%, transparent 75%), radial-gradient(ellipse at 20% 80%, rgba(14,165,233,0.12), transparent 55%), radial-gradient(ellipse at 80% 20%, rgba(6,182,212,0.1), transparent 50%)',
            }}
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-[0.035]"
            style={{
              backgroundImage: 'radial-gradient(rgba(255,255,255,0.9) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#060a14]/60 via-transparent to-[#060a14]" />
        </div>

        {/* ── PC / Desktop View: 3D Cylinder Rotating Animation over Single Background Image ── */}
        <div className="hidden md:block absolute inset-0 z-[1] pointer-events-none">
          <TiltedGridHero
            images={HERO_GRID}
            className="h-screen w-full bg-transparent"
            speed={4.5}
            curve={70}
            tileHeight={42}
            aspectRatio={16 / 9}
            axis={50}
          />
        </div>

        {/* ── Unified Hero Content (Title, Pitch, CTAs, Metric Cards) ── */}
        <div className="relative z-10 flex min-h-screen w-full flex-col items-center justify-evenly px-4 sm:px-6 pt-14 sm:pt-20 pb-6 sm:pb-8 text-center md:justify-center md:pb-12">
          <div className="max-w-4xl space-y-3 sm:space-y-6 px-2 sm:px-4">
            <h1 className="font-display text-5xl sm:text-6xl md:text-8xl font-black tracking-tight text-white drop-shadow-[0_4px_30px_rgba(0,0,0,0.95)]">
              ImpactMap <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-teal-300 bg-clip-text text-transparent">AI</span>
            </h1>
            <p className="mx-auto max-w-2xl text-balance text-xs sm:text-lg md:text-xl font-normal leading-relaxed text-slate-100 drop-shadow-[0_2px_18px_rgba(0,0,0,0.95)]">
              <strong className="font-bold text-white">ImpactMap AI</strong> helps humanitarian aid coordinators predict critical supply corridor failure and deploy emergency relief <strong className="font-bold text-cyan-300 underline decoration-cyan-400/60 underline-offset-4">without convoys getting trapped or hospitals cut off</strong>.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-4 pt-1 sm:pt-2">
              <button
                type="button"
                onClick={handleLaunchDemo}
                className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-cyan-400 to-sky-400 px-5 py-2.5 sm:px-8 sm:py-3.5 text-xs sm:text-sm font-bold text-slate-950 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_32px_rgba(6,182,212,0.6)] active:scale-95"
              >
                <Sparkles size={15} className="transition-transform group-hover:rotate-12" />
                <span>Launch Live Explorer</span>
                <ChevronRight size={15} className="transition-transform group-hover:translate-x-1" />
              </button>

              <a
                href={codeUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-900/90 px-4 py-2.5 sm:px-6 sm:py-3.5 text-xs sm:text-sm font-semibold text-slate-100 backdrop-blur-md transition-all duration-200 hover:border-cyan-400 hover:bg-slate-800 hover:text-white"
              >
                <Github size={15} />
                <span>View Code</span>
              </a>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid w-full max-w-3xl grid-cols-2 gap-2.5 sm:gap-3 sm:grid-cols-4 pt-4 sm:pt-4">
            {[
              { label: 'Road Links Scored', value: '3,420', sub: 'Inundation exposure' },
              { label: 'Cascade Speed', value: '< 48ms', sub: 'Topological solver' },
              { label: 'Clinics Protected', value: '89', sub: 'Critical referral centers' },
              { label: 'Calibration ECE', value: '0.023', sub: 'Sentinel-1 benchmark' },
            ].map((m) => (
              <div key={m.label} className="rounded-xl border border-white/10 bg-[#070c18]/90 p-3 sm:p-3 backdrop-blur-md shadow-lg">
                <p className="font-mono text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-300">{m.label}</p>
                <p className="mt-1 font-display text-lg sm:text-lg font-bold text-cyan-300">{m.value}</p>
                <p className="text-[10px] sm:text-[11px] text-slate-400">{m.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 2: The Problem (Step Inside Crisis Zoom-In Scroll Animation) ── */}
      <section id="crisis" className="relative bg-[#060a14] z-10">
        <StepInsideCrisisZoom />
      </section>

      {/* ── Section 3: The Solution (Pinned 5-Card Horizontal Scroll Showcase) ── */}
      <section id="solution" className="relative bg-[#060a14] z-10">
        <HorizontalSolutionShowcase onLaunchDemo={handleLaunchDemo} />
      </section>

      {/* ── Section 4: The Hardest Technical Problem Solved ── */}
      <HardestTechnicalProblem />

      {/* ── Section 5: How It Works (System Architecture - Horizontal Timeline) ── */}
      <section id="architecture" className="relative bg-[#060a14] z-10">
        <Timeline
          heading="From Raindrops to Relief Convoys"
          title="Pipeline"
          periodLabel="5-Stage Engine"
          topItems={ARCH_TOP}
          bottomItems={ARCH_BOTTOM}
          activeColor="#06b6d4"
          backgroundColor="#060a14"
          textColor="#f8fafc"
          mutedTextColor="#94a3b8"
          imageUrl={U('photo-1451187580459-43490279c0fa', 1200)}
          imageAlt="Digital elevation model processing pipeline"
        />
      </section>

      {/* ── Section 5: The Team (Interactive Orbital Graph + 3D Tilt Cards) ── */}
      <section id="team" className="py-12 sm:py-20 bg-[#05080f] relative border-t border-white/5 z-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center space-y-2 sm:space-y-4">
            <h2 className="font-display text-2xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white">
              Meet the Team
            </h2>
            <p className="mx-auto max-w-xl text-xs sm:text-base text-slate-300">
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
      <footer className="border-t border-slate-800 bg-[#04060a] px-4 sm:px-6 py-12 sm:py-20 text-center relative overflow-hidden z-10">
        <div className="mx-auto max-w-4xl space-y-5 sm:space-y-8">
          <h2 className="font-display text-3xl sm:text-6xl md:text-7xl font-black tracking-tight text-white">
            <TextRoll text="Ready to Stress Test?" />
          </h2>
          <p className="mx-auto max-w-lg text-xs sm:text-base text-slate-300">
            Launch the live interactive digital twin now, test what-if bridge barricades, and export field-ready SitReps.
          </p>

          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <button
              type="button"
              onClick={handleLaunchDemo}
              className="rounded-full bg-gradient-to-r from-cyan-400 to-sky-400 px-8 py-3.5 text-sm font-bold text-slate-950 shadow-[0_0_24px_rgba(6,182,212,0.4)] transition hover:scale-105 hover:from-cyan-300 hover:to-sky-300 active:scale-95"
            >
              Launch Live Explorer
            </button>

            <a
              href={codeUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/80 px-6 py-3.5 text-sm font-medium text-slate-300 backdrop-blur transition hover:border-cyan-400 hover:text-white"
            >
              <Github size={16} />
              <span>GitHub Repo</span>
            </a>

            {onOpenAbout && (
              <button
                type="button"
                onClick={onOpenAbout}
                className="inline-flex items-center gap-1.5 text-sm text-cyan-400 hover:text-cyan-300 transition underline underline-offset-4"
              >
                <span>Read Full Methodology</span>
                <ArrowUpRight size={14} />
              </button>
            )}
          </div>

          <div className="border-t border-white/5 pt-8 mt-12 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 font-mono gap-4">
            <p>© 2026 ImpactMap AI • Open Source Humanitarian Digital Twin</p>
            <p>Awash Basin Topological Corridor Intelligence</p>
          </div>
        </div>
      </footer>
    </main>
  );
}

export default LandingPage;
