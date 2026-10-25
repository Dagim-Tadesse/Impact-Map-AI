"use client";

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { AlertTriangle, ArrowRight, ShieldAlert } from 'lucide-react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface StepInsideCrisisZoomProps {
  onExploreClick?: () => void;
}

export default function StepInsideCrisisZoom({ onExploreClick }: StepInsideCrisisZoomProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const backdropTextRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const bgGlowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      // Parallax drift on the background CRISIS watermark typography
      gsap.to(backdropTextRef.current, {
        yPercent: 30,
        scale: 1.1,
        ease: 'none',
        scrollTrigger: {
          trigger: container,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      });

      // Smooth cinematic entrance for the briefing content
      gsap.fromTo(
        contentRef.current,
        {
          opacity: 0,
          y: 50,
          scale: 0.96,
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: container,
            start: 'top 75%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      // Subtle atmospheric warp
      gsap.to(bgGlowRef.current, {
        scale: 1.3,
        opacity: 0.45,
        duration: 1.2,
        ease: 'sine.inOut',
        scrollTrigger: {
          trigger: container,
          start: 'top 80%',
          end: 'bottom 20%',
          scrub: true,
        },
      });
    }, container);

    return () => {
      ctx.revert();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-[#07090e] text-slate-100 overflow-hidden py-24 sm:py-32"
    >
      {/* Background Radial Ambiance */}
      <div
        ref={bgGlowRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-25 transition-transform will-change-transform"
        style={{
          background:
            'radial-gradient(circle at 50% 40%, rgba(6,182,212,0.25), rgba(2,132,199,0.1) 45%, transparent 70%), radial-gradient(circle at 20% 80%, rgba(225,29,72,0.18), transparent 50%)',
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

      {/* ── Background Giant Typography (Atmospheric Watermark - Never Obscures Content) ── */}
      <div
        ref={backdropTextRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center select-none overflow-hidden will-change-transform"
      >
        <span
          className="font-display text-[26vw] sm:text-[22vw] font-black tracking-tighter leading-none text-white/[0.04] select-none"
          style={{ fontFamily: "'Figtree', 'Inter', sans-serif" }}
        >
          CRISIS
        </span>
      </div>

      {/* ── Foreground Content Frame (Always Fully Legible & Clean) ── */}
      <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div ref={contentRef} className="text-center will-change-transform">
          {/* Animated Alert Badge */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 backdrop-blur-md text-rose-300 text-xs sm:text-sm font-semibold tracking-wide shadow-[0_0_20px_rgba(244,63,94,0.15)] mb-6 sm:mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
            </span>
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>Awash Basin Humanitarian Flashpoint</span>
          </div>

          <h2 className="font-display text-2xl sm:text-3xl md:text-5xl font-black tracking-tight text-white leading-tight sm:leading-tight">
            When the Awash River floods, roads vanish{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-sky-300">
              before satellite clouds clear.
            </span>
          </h2>

          <p className="mx-auto mt-4 sm:mt-6 max-w-3xl text-sm sm:text-base md:text-lg font-normal leading-relaxed text-slate-300">
            Aid coordinators are forced to guess which bridges remain passable. Convoys carrying emergency medical cargo drive blindly into submerged dead ends, while 89 regional clinics lose their referral lifeline.
          </p>

          {/* Key Crisis Metrics Cards */}
          <div className="mt-10 sm:mt-14 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <div className="relative group rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-md p-6 sm:p-7 text-center transition-all duration-300 hover:border-rose-500/40 hover:bg-slate-900/80 hover:shadow-[0_0_25px_rgba(244,63,94,0.15)]">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-rose-500/5 to-transparent pointer-events-none" />
              <p className="font-display text-3xl sm:text-4xl md:text-5xl font-black text-rose-400 tracking-tight drop-shadow-[0_0_20px_rgba(244,63,94,0.3)]">
                4,200,000+
              </p>
              <p className="mt-2 text-sm sm:text-base font-bold text-white">People Exposed in Basin</p>
              <p className="mt-1 text-xs text-slate-400">Pastoralist & farming communities at risk</p>
            </div>

            <div className="relative group rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-md p-6 sm:p-7 text-center transition-all duration-300 hover:border-amber-500/40 hover:bg-slate-900/80 hover:shadow-[0_0_25px_rgba(245,158,11,0.15)]">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-amber-500/5 to-transparent pointer-events-none" />
              <p className="font-display text-3xl sm:text-4xl md:text-5xl font-black text-amber-400 tracking-tight drop-shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                $1,200M
              </p>
              <p className="mt-2 text-sm sm:text-base font-bold text-white">Annual Corridor Losses</p>
              <p className="mt-1 text-xs text-slate-400">Critical food spoilage, vehicle loss & delays</p>
            </div>

            <div className="relative group rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-md p-6 sm:p-7 text-center transition-all duration-300 hover:border-cyan-500/40 hover:bg-slate-900/80 hover:shadow-[0_0_25px_rgba(6,182,212,0.15)]">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none" />
              <p className="font-display text-3xl sm:text-4xl md:text-5xl font-black text-cyan-400 tracking-tight drop-shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                72 hrs
              </p>
              <p className="mt-2 text-sm sm:text-base font-bold text-white">Pre-Impact Advantage</p>
              <p className="mt-1 text-xs text-slate-400">Advance notice before flood peak arrives</p>
            </div>
          </div>

          {/* Quick CTA to live digital twin */}
          {onExploreClick && (
            <div className="mt-10 sm:mt-12 flex justify-center">
              <button
                type="button"
                onClick={onExploreClick}
                className="group inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 text-slate-950 font-bold text-sm shadow-[0_0_25px_rgba(6,182,212,0.35)] transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_0_35px_rgba(6,182,212,0.5)] active:scale-[0.98]"
              >
                <ShieldAlert className="w-4 h-4 text-slate-950" />
                <span>Simulate Disaster Impact Live</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
