"use client";

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function StepInsideCrisisZoom() {
  const containerRef = useRef<HTMLDivElement>(null);
  const portalTextRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const bgGlowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Respect motion preference: full zoom for most users, a gentler opacity
    // crossfade (no scale/translate) for reduced-motion so the effect still
    // plays and the layers never overlap into an unreadable stack.
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: container,
          start: 'top top',
          end: '+=150%',
          pin: true,
          scrub: 1,
        },
      });

      if (prefersReducedMotion) {
        // 1. CRISIS dissolves in place (opacity only)
        tl.to(portalTextRef.current, { opacity: 0, ease: 'none', duration: 0.4 }, 0);
        tl.to(bgGlowRef.current, { opacity: 0.4, ease: 'none', duration: 1 }, 0);
        // 2. Briefing fades in only after CRISIS is gone (no overlap)
        tl.fromTo(contentRef.current, { opacity: 0 }, { opacity: 1, ease: 'none', duration: 0.6 }, 0.4);

        return;
      }

      // 1. Zoom in and pierce through the giant CRISIS typography (pure GPU scale & opacity)
      tl.to(
        portalTextRef.current,
        {
          scale: 18,
          opacity: 0,
          ease: 'power2.in',
          duration: 0.45,
        },
        0
      );

      // Subtle atmospheric warp
      tl.to(
        bgGlowRef.current,
        {
          scale: 1.6,
          opacity: 0.4,
          ease: 'none',
          duration: 1,
        },
        0
      );

      // 2. Bring the Crisis Briefing into sharp focus as camera flies through (starts after portal dissolves)
      tl.fromTo(
        contentRef.current,
        {
          scale: 0.8,
          opacity: 0,
          y: 40,
        },
        {
          scale: 1,
          opacity: 1,
          y: 0,
          ease: 'power2.out',
          duration: 0.55,
        },
        0.45
      );
    }, container);

    return () => {
      ctx.revert();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-transparent text-slate-100 overflow-hidden"
      style={{ minHeight: '100vh' }}
    >
      {/* Background Radial Ambiance (Preserving ref for GSAP scroll camera warp) */}
      <div
        ref={bgGlowRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-20 transition-transform will-change-transform"
        style={{
          background:
            'radial-gradient(circle at 50% 45%, rgba(251,191,36,0.08), rgba(56,189,248,0.04) 40%, transparent 70%)',
        }}
      />

      {/* Main Sticky Pin Frame */}
      <div className="relative flex min-h-screen w-full items-center justify-center px-4 sm:px-6 py-6 sm:py-16">
        {/* ── Layer 1: The Initial Dramatic Portal (Zooms into camera) ── */}
        <div
          ref={portalTextRef}
          className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-4 pointer-events-none select-none will-change-transform"
        >
          <h2
            className="text-[35vw] sm:text-[32vw] md:text-[29vw] lg:text-[27vw] tracking-tighter leading-none text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-200 to-slate-500 drop-shadow-[0_25px_60px_rgba(0,0,0,0.95)]"
            style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400 }}
          >
            CRISIS
          </h2>

        </div>

        {/* ── Layer 2: The Target Crisis Briefing (Editorial SitRep Dossier Layout) ── */}
        <div
          ref={contentRef}
          className="relative z-10 mx-auto max-w-6xl w-full px-4 sm:px-6 lg:px-8 will-change-transform"
        >
          {/* Authentic Field Overview Eyebrow */}
          <div className="border-b border-white/[0.08] pb-3 sm:pb-4 mb-6 sm:mb-8 flex items-center justify-between text-xs text-slate-400">
            <span className="text-slate-300 font-serif italic text-sm">Awash River Basin, Ethiopia</span>
            <span className="text-slate-400 text-xs">Humanitarian Ground Reality</span>
          </div>

          {/* Asymmetric Editorial Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 xl:gap-16 items-start">
            {/* Left Column: Headline, Journalism, and Field Note */}
            <div className="lg:col-span-7 text-left space-y-4 sm:space-y-6">
              <h2 className="text-2xl sm:text-4xl md:text-5xl lg:text-5xl tracking-tight text-white leading-[1.08] font-normal" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                When the Awash River floods, roads vanish <em className="italic text-slate-300 font-serif">before satellite clouds clear.</em>
              </h2>

              <p className="text-sm sm:text-base md:text-lg leading-relaxed text-slate-300/85 max-w-xl" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Aid coordinators are forced to guess which bridges remain passable. Convoys carrying emergency medical cargo drive blindly into submerged dead ends, while <span className="text-white font-medium">89 regional clinics</span> lose their referral lifeline.
              </p>

              {/* Field Evidence Pull Note */}
              <div className="border-l-2 border-amber-400/40 pl-3.5 sm:pl-4 py-1 text-xs text-slate-400" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                <p className="text-slate-300">
                  &ldquo;Optical satellites stay blinded by cloud cover for up to 5 days, paralyzing ground operations precisely when flood waves crest.&rdquo;
                </p>
                <p className="mt-1 text-[10px] text-slate-500 uppercase tracking-wider">
                  — UN-OCHA Horn of Africa Humanitarian Briefing
                </p>
              </div>
            </div>

            {/* Right Column: Architectural Tiered Metrics Ledger */}
            <div className="lg:col-span-5 space-y-3 sm:space-y-3.5 w-full">
              {/* Stat 1: Population Exposed */}
              <div className="group rounded-2xl border border-white/[0.08] bg-[#0a0e16]/85 p-5 backdrop-blur-xl shadow-[0_12px_36px_rgba(0,0,0,0.5)] transition-all duration-300 hover:border-white/20 hover:bg-[#0e131d]/90">
                <p className="text-3xl sm:text-4xl text-white font-normal" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                  4,200,000+
                </p>
                <p className="mt-1 text-sm font-medium text-slate-200" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  People Exposed in Basin
                </p>
                <p className="mt-0.5 text-xs text-slate-400 leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  Pastoralist &amp; farming communities at risk of complete isolation
                </p>
              </div>

              {/* Stat 2: Economic Losses */}
              <div className="group rounded-2xl border border-white/[0.08] bg-[#0a0e16]/85 p-5 backdrop-blur-xl shadow-[0_12px_36px_rgba(0,0,0,0.5)] transition-all duration-300 hover:border-white/20 hover:bg-[#0e131d]/90">
                <p className="text-3xl sm:text-4xl text-white font-normal" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                  $1,200M
                </p>
                <p className="mt-1 text-sm font-medium text-slate-200" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  Annual Corridor Losses
                </p>
                <p className="mt-0.5 text-xs text-slate-400 leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  Critical food spoilage, submerged transport fleets &amp; trade delays
                </p>
              </div>

              {/* Stat 3: Pre-Impact Window */}
              <div className="group rounded-2xl border border-white/[0.08] bg-[#0a0e16]/85 p-5 backdrop-blur-xl shadow-[0_12px_36px_rgba(0,0,0,0.5)] transition-all duration-300 hover:border-white/20 hover:bg-[#0e131d]/90">
                <p className="text-3xl sm:text-4xl text-white font-normal" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                  72 hrs
                </p>
                <p className="mt-1 text-sm font-medium text-slate-200" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  Pre-Impact Advantage
                </p>
                <p className="mt-0.5 text-xs text-slate-400 leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  Advance notice before flood peak arrives at critical bridges
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
