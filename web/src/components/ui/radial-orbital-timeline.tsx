"use client";

import { useState, useEffect, useRef } from "react";
import {
  Github,
  Linkedin,
  ExternalLink,
} from "lucide-react";

export interface TimelineItem {
  id: number;
  title: string;
  date: string;
  content: string;
  category: string;
  icon: React.ElementType;
  relatedIds: number[];
  status: "completed" | "in-progress" | "pending";
  energy: number;
  photo?: string;
  github?: string;
  linkedin?: string;
  tags?: string[];
}

export interface RadialOrbitalTimelineProps {
  timelineData: TimelineItem[];
  className?: string;
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((word) => word[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function RadialOrbitalTimeline({
  timelineData,
  className = "",
}: RadialOrbitalTimelineProps) {
  const [rotationAngle, setRotationAngle] = useState<number>(0);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [userPinnedId, setUserPinnedId] = useState<number | null>(null);
  const [countdown, setCountdown] = useState<number>(5);
  const [radius, setRadius] = useState<number>(275);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const autoResumeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimers = () => {
    if (autoResumeTimerRef.current) {
      clearTimeout(autoResumeTimerRef.current);
      autoResumeTimerRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  };

  const start5SecTimer = () => {
    clearTimers();
    setCountdown(5);

    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    autoResumeTimerRef.current = setTimeout(() => {
      setUserPinnedId(null);
      setAutoRotate(true);
      clearTimers();
    }, 5000);
  };

  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, []);

  // Responsive radius calculation
  useEffect(() => {
    const updateSize = () => {
      const width = window.innerWidth;
      const mobile = width < 640;
      setIsMobile(mobile);
      if (mobile) {
        setRadius(95);
      } else if (width < 1024) {
        setRadius(210);
      } else {
        setRadius(275);
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // Continuous orbital rotation
  useEffect(() => {
    if (!autoRotate) return;

    const timer = setInterval(() => {
      setRotationAngle((prev) => (prev + 0.25) % 360);
    }, 45);

    return () => clearInterval(timer);
  }, [autoRotate]);

  // Determine which node is at the top (angle ~270 degrees)
  const getTopNode = (): TimelineItem | null => {
    if (!timelineData.length) return null;
    let closestItem = timelineData[0];
    let minDistance = 999;

    timelineData.forEach((item, index) => {
      const angle = ((index / timelineData.length) * 360 + rotationAngle) % 360;
      const diff = Math.abs(angle - 270);
      const dist = Math.min(diff, 360 - diff);
      if (dist < minDistance) {
        minDistance = dist;
        closestItem = item;
      }
    });

    return closestItem;
  };

  const topNode = getTopNode();
  const activeMember = userPinnedId
    ? timelineData.find((item) => item.id === userPinnedId) || topNode
    : topNode;

  const handleNodeClick = (id: number) => {
    if (userPinnedId === id) {
      clearTimers();
      setUserPinnedId(null);
      setAutoRotate(true);
    } else {
      setUserPinnedId(id);
      setAutoRotate(false);
      start5SecTimer();
    }
  };

  const handleResumeOrbit = () => {
    clearTimers();
    setUserPinnedId(null);
    setAutoRotate(true);
  };

  const calculateNodePosition = (index: number, total: number) => {
    const angle = ((index / total) * 360 + rotationAngle) % 360;
    const radian = (angle * Math.PI) / 180;
    const x = radius * Math.cos(radian);
    const y = radius * Math.sin(radian);
    const zIndex = Math.round(100 + 50 * Math.sin(radian));
    const isTop = Math.abs(angle - 270) < 30 || Math.abs(angle - 270) > 330;

    return { x, y, angle, zIndex, isTop };
  };

  if (isMobile) {
    const ActiveIconMobile = activeMember ? activeMember.icon : null;

    return (
      <div
        ref={containerRef}
        className={`relative w-full flex flex-col items-center justify-center py-2 bg-transparent select-none overflow-hidden ${className}`}
      >
        {/* Mobile Radar Orbiter */}
        <div className="relative h-[260px] w-full max-w-[340px] flex items-center justify-center overflow-visible">
          {/* Ambient decorative rotating rings */}
          <div
            className="pointer-events-none absolute rounded-full border border-white/5 animate-spin [animation-duration:80s]"
            style={{ width: `${radius * 2 + 50}px`, height: `${radius * 2 + 50}px` }}
          />
          <div
            className="pointer-events-none absolute rounded-full border border-white/10 border-dashed animate-spin [animation-duration:50s] [animation-direction:reverse]"
            style={{ width: `${radius * 2 + 25}px`, height: `${radius * 2 + 25}px` }}
          />
          {/* Primary Orbit Ring */}
          <div
            className="pointer-events-none absolute rounded-full border border-white/15 shadow-[0_0_24px_rgba(255,255,255,0.05)]"
            style={{ width: `${radius * 2}px`, height: `${radius * 2}px` }}
          />

          {/* Central Active Avatar Core (Monogram + Role Icon Badge) */}
          {activeMember && (
            <div className="relative z-10 h-16 w-16 flex items-center justify-center">
              <div className="relative h-full w-full rounded-full border-2 border-white/30 bg-gradient-to-b from-[#141b2a] via-[#0d131f] to-[#070b14] flex flex-col items-center justify-center shadow-[0_8px_24px_rgba(0,0,0,0.6)]">
                <span className="text-lg font-normal tracking-wider text-white" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                  {getInitials(activeMember.title)}
                </span>
                <span className="text-[8px] font-medium tracking-widest text-slate-400 uppercase" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                  {activeMember.category.slice(0, 4)}
                </span>
              </div>
              {ActiveIconMobile && (
                <div className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full border border-white/30 bg-[#0a0e16] shadow-md">
                  <ActiveIconMobile size={10} className="text-slate-300" />
                </div>
              )}
            </div>
          )}

          {/* Orbiting Nodes around center */}
          {timelineData.map((item, index) => {
            const { x, y } = calculateNodePosition(index, timelineData.length);
            const isActive = activeMember?.id === item.id;
            const Icon = item.icon;

            return (
              <div
                key={item.id}
                data-testid={`orbital-node-${item.id}`}
                onClick={() => handleNodeClick(item.id)}
                className="absolute z-30 cursor-pointer group flex flex-col items-center justify-center transition-transform duration-300 will-change-transform"
                style={{
                  transform: `translate(${x}px, ${y}px)`,
                }}
              >
                <div
                  className={`relative flex items-center justify-center rounded-full transition-all duration-300 ${
                    isActive
                      ? 'h-11 w-11 border-2 border-white/60 bg-[#0e1422] shadow-[0_0_16px_rgba(255,255,255,0.2)] scale-110'
                      : 'h-9 w-9 border border-white/10 bg-[#0a0e16] hover:border-white/30 hover:scale-105 shadow-md'
                  }`}
                >
                  <div className="flex flex-col items-center justify-center">
                    <Icon size={isActive ? 14 : 12} className={isActive ? 'text-white' : 'text-slate-400'} />
                    <span className={`text-[8px] font-bold tracking-tighter ${isActive ? 'text-white' : 'text-slate-400'}`} style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                      {getInitials(item.title)}
                    </span>
                  </div>

                  {isActive && (
                    <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-400 border border-black" />
                    </span>
                  )}
                </div>

                <div
                  className={`mt-1 rounded-full px-2 py-0.5 text-[9px] font-medium tracking-wider transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-white text-slate-950 shadow-md font-semibold'
                      : 'bg-[#0a0e16]/90 text-slate-400 border border-white/10'
                  }`}
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  {item.title}
                </div>
              </div>
            );
          })}
        </div>

        {/* Member Detail HUD Card for Mobile */}
        {activeMember && (
          <div className="relative z-20 w-full max-w-[340px] rounded-2xl border border-white/10 bg-[#0a0e16]/95 p-4 text-center backdrop-blur-2xl shadow-[0_16px_40px_rgba(0,0,0,0.6)] mt-1">
            <h3 className="text-lg font-normal text-white tracking-tight" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
              {activeMember.title}
            </h3>
            <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wider text-slate-400" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
              {activeMember.date}
            </p>

            <p className="mt-2 text-xs leading-relaxed text-slate-300" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              {activeMember.content}
            </p>

            {activeMember.tags && activeMember.tags.length > 0 && (
              <div className="mt-2.5 flex flex-wrap justify-center gap-1">
                {activeMember.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[9px] text-slate-400"
                    style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-3 flex items-center justify-center gap-2 pt-2.5 border-t border-white/10">
              {activeMember.github && (
                <a
                  href={activeMember.github}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-medium text-slate-300 hover:border-white/30 hover:text-white transition"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  <Github size={11} />
                  <span>GitHub</span>
                </a>
              )}
              {activeMember.linkedin && (
                <a
                  href={activeMember.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-medium text-slate-300 hover:border-white/30 hover:text-white transition"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  <Linkedin size={11} />
                  <span>LinkedIn</span>
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  const ActiveIconDesktop = activeMember ? activeMember.icon : null;

  return (
    <div
      ref={containerRef}
      className={`relative w-full min-h-[640px] sm:min-h-[700px] lg:min-h-[740px] flex items-center justify-center bg-transparent select-none overflow-hidden ${className}`}
    >
      {/* Outer ambient glow and decorative rings */}
      <div
        className="pointer-events-none absolute rounded-full border border-white/5 animate-spin [animation-duration:90s]"
        style={{ width: `${radius * 2 + 140}px`, height: `${radius * 2 + 140}px` }}
      />
      <div
        className="pointer-events-none absolute rounded-full border border-white/10 border-dashed animate-spin [animation-duration:60s] [animation-direction:reverse]"
        style={{ width: `${radius * 2 + 70}px`, height: `${radius * 2 + 70}px` }}
      />
      {/* Primary Orbit Ring */}
      <div
        className="pointer-events-none absolute rounded-full border border-white/15 shadow-[0_0_30px_rgba(255,255,255,0.05)]"
        style={{ width: `${radius * 2}px`, height: `${radius * 2}px` }}
      />

      {/* ── Active Member Center Stage HUD ── */}
      {activeMember && (
        <div className="relative z-20 w-[90vw] max-w-[340px] sm:max-w-[390px] rounded-3xl border border-white/10 bg-[#0a0e16]/90 p-5 sm:p-6 text-center backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] transition-all duration-300">
          {/* Monogram Avatar with Pulsing Ring and Role Icon Badge */}
          <div className="relative mx-auto h-20 w-20 sm:h-22 sm:w-22 flex items-center justify-center">
            <div className="relative h-full w-full rounded-full border-2 border-white/30 bg-gradient-to-b from-[#141b2a] via-[#0d131f] to-[#070b14] flex flex-col items-center justify-center shadow-[0_8px_24px_rgba(0,0,0,0.6)]">
              <span className="text-2xl sm:text-3xl font-normal text-white" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                {getInitials(activeMember.title)}
              </span>
              <span className="mt-0.5 text-[9px] font-medium tracking-widest text-slate-400 uppercase" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                {activeMember.category.split(' ')[0]}
              </span>
            </div>
            {ActiveIconDesktop && (
              <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border border-white/30 bg-[#0a0e16] shadow-md">
                <ActiveIconDesktop size={14} className="text-slate-300" />
              </div>
            )}
          </div>

          {/* Name & Role */}
          <h3 className="mt-3.5 text-2xl font-normal text-white tracking-tight" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
            {activeMember.title}
          </h3>
          <p className="mt-1 text-xs font-medium uppercase tracking-wider text-slate-400" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
            {activeMember.date}
          </p>

          {/* Bio Content */}
          <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-300" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            {activeMember.content}
          </p>

          {/* Tech Stack Tags */}
          {activeMember.tags && activeMember.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap justify-center gap-1.5">
              {activeMember.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] text-slate-400"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Profile Links */}
          <div className="mt-4 flex items-center justify-center gap-3 pt-3 border-t border-white/10">
            {activeMember.github && (
              <a
                href={activeMember.github}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-slate-300 hover:border-white/30 hover:text-white transition"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                <Github size={13} />
                <span>GitHub</span>
              </a>
            )}
            {activeMember.linkedin && (
              <a
                href={activeMember.linkedin}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-slate-300 hover:border-white/30 hover:text-white transition"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                <Linkedin size={13} />
                <span>LinkedIn</span>
              </a>
            )}
          </div>
        </div>
      )}

      {/* ── Orbiting Team Member Nodes ── */}
      {timelineData.map((item, index) => {
        const { x, y } = calculateNodePosition(index, timelineData.length);
        const isActive = activeMember?.id === item.id;
        const Icon = item.icon;

        return (
          <div
            key={item.id}
            data-testid={`orbital-node-${item.id}`}
            onClick={() => handleNodeClick(item.id)}
            className="absolute z-30 cursor-pointer group flex flex-col items-center justify-center transition-transform duration-300 will-change-transform"
            style={{
              transform: `translate(${x}px, ${y}px)`,
            }}
          >
            {/* Glowing Node Button */}
            <div
              className={`relative flex items-center justify-center rounded-full transition-all duration-300 ${
                isActive
                  ? 'h-15 w-15 sm:h-16 sm:w-16 border-2 border-white/60 bg-[#0e1422] shadow-[0_0_24px_rgba(255,255,255,0.25)] scale-110'
                  : 'h-12 w-12 sm:h-13 sm:w-13 border border-white/15 bg-[#0a0e16] hover:border-white/30 hover:scale-105 shadow-md'
              }`}
            >
              <div className="flex flex-col items-center justify-center">
                <Icon size={isActive ? 19 : 16} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'} />
                <span className={`text-[9px] font-bold tracking-tighter ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`} style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                  {getInitials(item.title)}
                </span>
              </div>

              {isActive && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-amber-400 border border-black" />
                </span>
              )}
            </div>

            {/* Label below node */}
            <div
              className={`mt-2 rounded-full px-2.5 py-0.5 text-[11px] font-medium tracking-wider transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-white text-slate-950 font-semibold shadow-md'
                  : 'bg-[#0a0e16]/90 text-slate-400 border border-white/10 group-hover:border-white/30 group-hover:text-white'
              }`}
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              {item.title}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export { RadialOrbitalTimeline };
