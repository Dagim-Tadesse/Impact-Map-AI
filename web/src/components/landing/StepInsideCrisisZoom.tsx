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
          scale: 14,
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
      className="relative w-full bg-[#07090e] text-slate-100 overflow-hidden"
      style={{ minHeight: '100vh' }}
    >
      {/* Background Radial Ambiance */}
      <div
        ref={bgGlowRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-25 transition-transform will-change-transform"
        style={{
          background:
            'radial-gradient(circle at 50% 45%, rgba(6,182,212,0.35), rgba(2,132,199,0.15) 40%, transparent 70%), radial-gradient(circle at 20% 80%, rgba(225,29,72,0.2), transparent 50%)',
        }}
      />

      {/* Grid line texture overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.8) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
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
            className="font-display text-[28vw] sm:text-[24vw] md:text-[22vw] font-black tracking-tighter leading-none text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-100 to-cyan-500 drop-shadow-[0_20px_45px_rgba(0,0,0,0.95)]"
            style={{ fontFamily: "'Figtree', 'Inter', sans-serif" }}
          >
            CRISIS
          </h2>

        </div>

        {/* ── Layer 2: The Target Crisis Briefing (Zooms in to fill screen - Open Spacious Layout) ── */}
        <div
          ref={contentRef}
          className="relative z-10 mx-auto max-w-4xl text-center px-4 will-change-transform"
        >
          <h2 className="font-display text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-snug">
            When the Awash River floods, roads vanish before satellite clouds clear.
          </h2>

          <p className="mx-auto mt-3 sm:mt-5 max-w-3xl text-sm sm:text-base md:text-lg font-normal leading-relaxed text-slate-300">
            Aid coordinators are forced to guess which bridges remain passable. Convoys carrying emergency medical cargo drive blindly into submerged dead ends, while 89 regional clinics lose their referral lifeline.
          </p>

          {/* Key Crisis Metrics */}
          <div className="mt-6 sm:mt-10 grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 divide-y sm:divide-y-0 sm:divide-x divide-white/10">
            <div className="pt-4 sm:pt-0 sm:px-4 text-center">
              <p className="font-display text-2xl sm:text-3xl md:text-4xl font-black text-rose-400 drop-shadow-[0_0_20px_rgba(244,63,94,0.4)] tracking-tight">
                4,200,000+
              </p>
              <p className="mt-1.5 text-xs sm:text-sm md:text-base font-bold text-white">People Exposed in Basin</p>
              <p className="mt-0.5 text-[11px] sm:text-xs text-slate-400">Pastoralist & farming communities at risk</p>
            </div>

            <div className="pt-4 sm:pt-0 sm:px-4 text-center">
              <p className="font-display text-2xl sm:text-3xl md:text-4xl font-black text-amber-400 drop-shadow-[0_0_20px_rgba(245,158,11,0.4)] tracking-tight">
                $1,200M
              </p>
              <p className="mt-1.5 text-xs sm:text-sm md:text-base font-bold text-white">Annual Corridor Losses</p>
              <p className="mt-0.5 text-[11px] sm:text-xs text-slate-400">Critical food spoilage, vehicle loss & delays</p>
            </div>

            <div className="pt-4 sm:pt-0 sm:px-4 text-center">
              <p className="font-display text-2xl sm:text-3xl md:text-4xl font-black text-cyan-400 drop-shadow-[0_0_20px_rgba(6,182,212,0.4)] tracking-tight">
                72 hrs
              </p>
              <p className="mt-1.5 text-xs sm:text-sm md:text-base font-bold text-white">Pre-Impact Advantage</p>
              <p className="mt-0.5 text-[11px] sm:text-xs text-slate-400">Advance notice before flood peak arrives</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
