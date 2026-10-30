// Built using Hyperiux Vault: https://vault.hyperiux.com
"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Settings2, CheckCircle2, Layers } from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export type JourneyItem = {
  id: string;
  year: string;
  month: string;
  content: string;
};

export type TimelineProps = {
  title?: string;
  periodLabel?: string;
  badge?: string;
  heading?: string;
  subheading?: string;
  textColor?: string;
  mutedTextColor?: string;
  activeColor?: string;
  backgroundColor?: string;
  imageUrl?: string;
  imageAlt?: string;
  duration?: number;
  scrollDuration?: number;
  topItems?: JourneyItem[];
  bottomItems?: JourneyItem[];
};

export default function Timeline({
  badge = "",
  heading = "From Raindrops to Relief Convoys",
  subheading = "",
  imageUrl = "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80",
  imageAlt = "Digital elevation model processing pipeline",
  topItems = [],
  bottomItems = [],
}: TimelineProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const wholeSliderRef = useRef<HTMLDivElement>(null);

  // Combine and sort all stages sequentially: Stage 01 through Stage 05
  const allJourneyItems: JourneyItem[] = [
    ...topItems,
    ...bottomItems,
  ].sort((a, b) => {
    const numA = parseInt(a.year.replace(/\D/g, "") || "0", 10);
    const numB = parseInt(b.year.replace(/\D/g, "") || "0", 10);
    return numA - numB;
  });

  useEffect(() => {
    const section = sectionRef.current;
    const slider = wholeSliderRef.current;
    if (!section || !slider) return;

    const mm = gsap.matchMedia();

    // ── Desktop / PC (>= 1024px): Smooth Horizontal Scrub with Dynamic Pop-Out Stage Entrances ──
    mm.add("(min-width: 1024px)", () => {
      const getScrollDistance = () => {
        return Math.max(0, slider.scrollWidth - window.innerWidth + 160);
      };

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => `+=${Math.max(1400, getScrollDistance())}`,
          pin: true,
          anticipatePin: 1,
          scrub: 0.5,
          invalidateOnRefresh: true,
        },
      });

      // 1. Translate horizontal track smoothly over normalized duration 1.0
      tl.to(
        slider,
        {
          x: () => -getScrollDistance(),
          ease: "none",
          duration: 1.0,
        },
        0
      );

      // 2. Expand cybernetic timeline connecting line in sync
      tl.to(
        ".journey-line",
        {
          width: "100%",
          ease: "none",
          duration: 1.0,
        },
        0
      );

      // 3. Telemetry Input Overview Card focus
      tl.fromTo(
        ".arch-input-card",
        { opacity: 0.8, scale: 0.94 },
        { opacity: 1, scale: 1, ease: "power2.out", duration: 0.08 },
        0
      );

      // 4. Staggered Pop-Out for the 5 Architecture Stages as scroll reaches each
      const stageCards = gsap.utils.toArray<HTMLElement>(".arch-stage-card");
      const stageNodes = gsap.utils.toArray<HTMLElement>(".arch-stage-node");
      const stageStems = gsap.utils.toArray<HTMLElement>(".arch-stage-stem");

      // Progress intervals across 0.0 -> 1.0
      const stageTimings = [
        { start: 0.01, dur: 0.13 }, // Stage 01: Hydrologic Ingestion
        { start: 0.16, dur: 0.14 }, // Stage 02: Calibrated Inundation
        { start: 0.35, dur: 0.15 }, // Stage 03: Cascade Topology Solver
        { start: 0.54, dur: 0.15 }, // Stage 04: What-If Interventions
        { start: 0.72, dur: 0.14 }, // Stage 05: Ground Truth Verification
      ];

      stageCards.forEach((card, i) => {
        const isTop = i % 2 === 0;
        const timing = stageTimings[i] || { start: 0.15 * i, dur: 0.12 };
        const node = stageNodes[i];
        const stem = stageStems[i];

        // Animate Pulse Node on center line
        if (node) {
          tl.fromTo(
            node,
            { scale: 0.35, opacity: 0.25, boxShadow: "0 0 0px rgba(0,0,0,0)" },
            {
              scale: 1,
              opacity: 1,
              boxShadow: "0 0 14px rgba(255,255,255,0.25)",
              ease: "back.out(2)",
              duration: timing.dur * 0.7,
            },
            timing.start
          );
        }

        // Animate Connecting Vertical Stem
        if (stem) {
          tl.fromTo(
            stem,
            { scaleY: 0, opacity: 0, transformOrigin: isTop ? "bottom center" : "top center" },
            { scaleY: 1, opacity: 1, ease: "power2.out", duration: timing.dur * 0.75 },
            timing.start
          );
        }

        // Animate Stage Card Pop-Out!
        tl.fromTo(
          card,
          {
            opacity: 0,
            scale: 0.76,
            y: isTop ? -45 : 45,
            filter: "blur(4px)",
            boxShadow: "0 0 0px rgba(0,0,0,0)",
          },
          {
            opacity: 1,
            scale: 1,
            y: 0,
            filter: "blur(0px)",
            boxShadow: "0 16px 40px rgba(0,0,0,0.6)",
            ease: "back.out(1.8)",
            duration: timing.dur,
          },
          timing.start + 0.01
        );
      });

      // 5. Output Gateway Card Pop-Out at final arrival
      tl.fromTo(
        ".arch-output-card",
        {
          opacity: 0,
          scale: 0.78,
          x: 50,
          boxShadow: "0 0 0px rgba(0,0,0,0)",
        },
        {
          opacity: 1,
          scale: 1,
          x: 0,
          boxShadow: "0 16px 40px rgba(0,0,0,0.6)",
          ease: "back.out(1.7)",
          duration: 0.12,
        },
        0.87
      );
    }, section);

    // ── Mobile / Less Pixel Devices (< 1024px): Keep As It Is ──
    mm.add("(max-width: 1023px)", () => {
      const getScrollDistance = () => {
        return Math.max(0, slider.scrollWidth - window.innerWidth + 80);
      };

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => `+=${Math.max(1200, getScrollDistance())}`,
          pin: true,
          anticipatePin: 1,
          scrub: 0.5,
          invalidateOnRefresh: true,
        },
      });

      // Standard translation without pop-out hiding (cards stay 100% visible naturally)
      tl.to(slider, {
        x: () => -getScrollDistance(),
        ease: "none",
      });

      tl.to(
        ".journey-line",
        {
          width: "100%",
          ease: "none",
        },
        0
      );
    }, section);

    return () => {
      mm.revert();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="journey"
      className="relative h-screen min-h-[640px] max-h-[980px] w-full bg-transparent text-slate-100 overflow-hidden flex flex-col justify-between pt-16 sm:pt-20 pb-4 sm:pb-8 select-none"
    >
      {/* ── Section Header (Pinned at top of frame) ── */}
      <div className="mx-auto max-w-6xl w-full px-4 sm:px-6 text-center space-y-2 shrink-0 z-10">
        {badge && (
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3.5 py-1 text-[10px] sm:text-[11px] uppercase tracking-widest text-cyan-300 font-mono">
            <Layers size={12} className="text-cyan-400" />
            <span>{badge}</span>
          </div>
        )}
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
          {heading}
        </h2>
        {subheading && (
          <p className="mx-auto max-w-2xl text-xs sm:text-sm text-slate-200 leading-relaxed font-normal" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            {subheading}
          </p>
        )}
      </div>

      {/* ── Horizontal Stages Pipeline Track ── */}
      <div className="relative w-full overflow-hidden flex-1 flex items-center my-auto">
        <div
          ref={wholeSliderRef}
          className="flex items-center gap-6 sm:gap-10 px-6 sm:px-12 w-max will-change-transform relative"
        >
          {/* Card 0: Telemetry Overview Hero Card */}
          <div className="arch-input-card w-[280px] sm:w-[340px] shrink-0 rounded-2xl border border-slate-700/60 bg-[#161B26] p-4 sm:p-5 shadow-[0_16px_40px_rgba(0,0,0,0.6)] backdrop-blur-xl transform-gpu will-change-transform">
            <div className="relative h-28 sm:h-36 w-full overflow-hidden rounded-xl border border-slate-700/60 bg-slate-900">
              <img
                src={imageUrl}
                alt={imageAlt}
                draggable={false}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#161B26] via-transparent to-transparent" />
              <div className="absolute bottom-2 left-2.5 inline-flex items-center gap-1.5 rounded-md bg-black/80 px-2 py-0.5 text-[9px] sm:text-[10px] text-cyan-300 border border-slate-700/60 font-mono">
                <Layers size={11} className="text-cyan-400" />
                <span>INPUT TELEMETRY</span>
              </div>
            </div>
            <h3 className="mt-3 text-base sm:text-lg font-bold text-white tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
              Satellite &amp; Terrain Inputs
            </h3>
            <p className="mt-1 text-xs text-slate-200 leading-relaxed font-sans">
              Sentinel-1 SAR synthetic aperture radar, CHIRPS rainfall telemetry, and Copernicus 30m digital elevation slope.
            </p>
          </div>

          {/* Continuous Center Timeline Line */}
          <div className="absolute left-[300px] sm:left-[360px] right-[280px] sm:right-[340px] top-1/2 -translate-y-1/2 h-1 rounded-full bg-white/[0.06] border border-white/[0.04] pointer-events-none">
            <div className="journey-line h-full w-0 rounded-full bg-gradient-to-r from-cyan-400/50 via-sky-300/60 to-cyan-400/80 shadow-[0_0_12px_rgba(6,182,212,0.3)]" />
          </div>

          {/* The 5 Architecture Pipeline Stages */}
          {allJourneyItems.map((item, index) => {
            const isTop = index % 2 === 0;

            return (
              <div
                key={item.id}
                className="arch-stage-wrapper relative w-[300px] sm:w-[360px] h-[340px] sm:h-[400px] shrink-0 flex flex-col justify-between py-2"
                style={{ perspective: 1000 }}
              >
                {/* ── Top Half ── */}
                <div className="h-[155px] sm:h-[180px] flex flex-col justify-end">
                  {isTop && (
                    <div className="arch-stage-card relative rounded-2xl border border-slate-700/60 bg-[#161B26] p-4 sm:p-5 shadow-[0_16px_40px_rgba(0,0,0,0.6)] backdrop-blur-xl hover:border-cyan-500/50 hover:bg-[#1a2230] transition-all transform-gpu will-change-transform">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] sm:text-[11px] font-bold text-cyan-400 tracking-wider uppercase font-mono">
                          {item.year}
                        </span>
                        <span className="text-[9px] font-semibold text-slate-300 bg-white/[0.04] px-2 py-0.5 rounded-full border border-slate-700/60 font-mono">
                          STAGE PIPELINE
                        </span>
                      </div>
                      <h4 className="mt-1.5 text-base sm:text-lg font-bold text-white leading-snug tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
                        {item.month}
                      </h4>
                      <p className="mt-1.5 text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
                        {item.content}
                      </p>
                    </div>
                  )}
                </div>

                {/* ── Center Node on Timeline ── */}
                <div className="relative h-6 flex items-center justify-center my-auto">
                  {/* Vertical connecting stems */}
                  {isTop ? (
                    <div className="arch-stage-stem origin-bottom absolute bottom-3 w-px h-6 sm:h-8 bg-gradient-to-t from-cyan-400/50 to-transparent transform-gpu will-change-transform" />
                  ) : (
                    <div className="arch-stage-stem origin-top absolute top-3 w-px h-6 sm:h-8 bg-gradient-to-b from-cyan-400/50 to-transparent transform-gpu will-change-transform" />
                  )}

                  {/* Pulsing Center Node */}
                  <div className="arch-stage-node relative z-20 size-5 sm:size-6 rounded-full bg-[#161B26] border-2 border-cyan-400/80 flex items-center justify-center shadow-[0_0_12px_rgba(6,182,212,0.4)] transform-gpu will-change-transform">
                    <div className="size-2 rounded-full bg-cyan-300 animate-pulse" />
                  </div>
                </div>

                {/* ── Bottom Half ── */}
                <div className="h-[155px] sm:h-[180px] flex flex-col justify-start">
                  {!isTop && (
                    <div className="arch-stage-card relative rounded-2xl border border-slate-700/60 bg-[#161B26] p-4 sm:p-5 shadow-[0_16px_40px_rgba(0,0,0,0.6)] backdrop-blur-xl hover:border-cyan-500/50 hover:bg-[#1a2230] transition-all transform-gpu will-change-transform">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] sm:text-[11px] font-bold text-cyan-400 tracking-wider uppercase font-mono">
                          {item.year}
                        </span>
                        <span className="text-[9px] font-semibold text-slate-300 bg-white/[0.04] px-2 py-0.5 rounded-full border border-slate-700/60 font-mono">
                          STAGE PIPELINE
                        </span>
                      </div>
                      <h4 className="mt-1.5 text-base sm:text-lg font-bold text-white leading-snug tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
                        {item.month}
                      </h4>
                      <p className="mt-1.5 text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
                        {item.content}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Card Final: Output Convoy Milestone Card */}
          <div className="arch-output-card w-[260px] sm:w-[320px] shrink-0 rounded-2xl border border-slate-700/60 bg-[#161B26] p-4 sm:p-5 shadow-[0_16px_40px_rgba(0,0,0,0.6)] backdrop-blur-xl transform-gpu will-change-transform">
            <div className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[9px] sm:text-[10px] font-semibold text-emerald-300 border border-emerald-500/30 font-mono">
              <CheckCircle2 size={11} className="text-emerald-400" />
              <span>OUTPUT GATEWAY</span>
            </div>
            <h3 className="mt-3 text-base sm:text-lg font-bold text-white tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
              Tactical Relief Convoys
            </h3>
            <p className="mt-1 text-xs text-slate-200 leading-relaxed font-sans">
              Safe routing corridors, 28 clinics connected, 0 trapped vehicles, and bilingual field SitReps for UN-OCHA &amp; EDRMC.
            </p>
            <div className="mt-3 pt-3 border-t border-white/[0.08] flex items-center justify-between text-[11px] text-slate-300 font-mono">
              <span>PIPELINE VERIFIED</span>
              <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export { Timeline };
