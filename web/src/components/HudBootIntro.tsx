import React, { useEffect, useState, useRef } from 'react';
import { Radio, Sparkles, CheckCircle2 } from 'lucide-react';
import gsap from 'gsap';

export const HudBootIntro: React.FC = () => {
  const [active, setActive] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only show once per session, and skip if user prefers reduced motion
    const seen = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('impactmap_boot_seen') : null;
    if (seen || window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) {
      return;
    }

    setActive(true);

    const timer = setTimeout(() => {
      dismissIntro();
    }, 1400);

    return () => clearTimeout(timer);
  }, []);

  const dismissIntro = () => {
    if (!overlayRef.current) {
      setActive(false);
      return;
    }

    sessionStorage.setItem('impactmap_boot_seen', '1');

    gsap.to(contentRef.current, {
      opacity: 0,
      y: -20,
      duration: 0.35,
      ease: 'power2.in',
    });

    gsap.to(overlayRef.current, {
      clipPath: 'inset(50% 0% 50% 0%)',
      opacity: 0,
      duration: 0.55,
      delay: 0.2,
      ease: 'expo.inOut',
      onComplete: () => {
        setActive(false);
      },
    });
  };

  if (!active) return null;

  return (
    <div
      ref={overlayRef}
      onClick={dismissIntro}
      className="fixed inset-0 z-50 bg-[#07090e] flex flex-col items-center justify-center p-6 cursor-pointer select-none"
      style={{ clipPath: 'inset(0% 0% 0% 0%)' }}
    >
      {/* Background Grid & Scanline */}
      <div className="absolute inset-0 bg-[radial-gradient(#06b6d4_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none" />
      <div className="hologram-scanline" />

      <div ref={contentRef} className="relative z-10 max-w-md w-full text-center space-y-4">
        {/* Animated Beacon Ring */}
        <div className="mx-auto w-14 h-14 rounded-2xl bg-cyan-950/80 border border-cyan-400/50 flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.4)]">
          <Radio className="w-7 h-7 text-cyan-400 animate-pulse" />
        </div>

        <div>
          <div className="text-[10px] font-mono tracking-widest text-cyan-400 uppercase">
            AASTU &middot; AWS COMMUNITY DAY 2026
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
            ImpactMap<span className="text-cyan-400 font-normal">AI</span>
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Flood-Driven Healthcare Isolation Telemetry
          </p>
        </div>

        {/* Diagnostic Boot Logs */}
        <div className="glass-panel p-3.5 rounded-xl border border-white/10 text-left font-mono text-[11px] space-y-1.5 shadow-2xl">
          <div className="flex items-center justify-between text-slate-300">
            <span>[ 0.1s ] AWASH HYDROLOGICAL BASIN</span>
            <span className="text-emerald-400 flex items-center gap-1 font-bold">
              <CheckCircle2 className="w-3 h-3" /> ONLINE
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span>[ 0.3s ] MONTE CARLO STOCHASTIC ENGINE</span>
            <span className="text-emerald-400 flex items-center gap-1 font-bold">
              <CheckCircle2 className="w-3 h-3" /> READY
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span>[ 0.5s ] 3D VECTOR HIGHWAYS &amp; FACILITIES</span>
            <span className="text-cyan-400 flex items-center gap-1 font-bold">
              <Sparkles className="w-3 h-3" /> SYNCED
            </span>
          </div>
        </div>

        <div className="text-[10px] text-slate-500 font-mono">
          Click or press any key to enter immediately &rarr;
        </div>
      </div>
    </div>
  );
};
