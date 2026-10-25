import { useState, useEffect, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface HeroSlide {
  src: string;
  alt: string;
  label?: string;
  location?: string;
}

export interface HeroSlideshowProps {
  images: HeroSlide[];
  mobileImage?: string;
  intervalMs?: number;
  className?: string;
  children: ReactNode;
}

export function HeroSlideshow({
  images,
  mobileImage,
  intervalMs = 4500,
  className,
  children,
}: HeroSlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-advance slideshow on PC / desktop
  useEffect(() => {
    if (isPaused || images.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [images.length, intervalMs, isPaused]);

  const defaultMobileSrc =
    mobileImage ||
    images[0]?.src ||
    "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=800&q=75";

  return (
    <div
      className={cn("relative min-h-screen w-full overflow-hidden bg-[#060a14]", className)}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* ── Mobile View: Single Static Background Image (Optimized, lightweight, no slideshow timer) ── */}
      <div className="absolute inset-0 md:hidden z-0 overflow-hidden pointer-events-none">
        <img
          src={defaultMobileSrc}
          alt={images[0]?.alt || "Awash Basin flood intelligence telemetry"}
          className="h-full w-full object-cover object-center opacity-30 scale-100"
          loading="eager"
          fetchPriority="high"
        />
        {/* Mobile Gradient Overlays for 100% Text Legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#060a14] via-[#060a14]/80 to-[#060a14]/60" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,rgba(6,182,212,0.18),transparent_70%)]" />
      </div>

      {/* ── Desktop / PC View: Time-Based Crossfading Background Slideshow ── */}
      <div className="absolute inset-0 hidden md:block z-0 overflow-hidden pointer-events-none">
        {images.map((img, idx) => {
          const isActive = idx === currentIndex;
          return (
            <div
              key={img.src}
              className={cn(
                "absolute inset-0 h-full w-full transition-opacity duration-1000 ease-in-out",
                isActive ? "opacity-35 z-1" : "opacity-0 z-0"
              )}
            >
              <img
                src={img.src}
                alt={img.alt}
                className={cn(
                  "h-full w-full object-cover object-center transition-transform duration-[5500ms] ease-out",
                  isActive ? "scale-105" : "scale-100"
                )}
                loading={idx === 0 ? "eager" : "lazy"}
              />
            </div>
          );
        })}

        {/* Ambient Radial Lights */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 50% 35%, rgba(6,182,212,0.2), rgba(2,132,199,0.08) 45%, transparent 75%), radial-gradient(ellipse at 80% 80%, rgba(14,165,233,0.1), transparent 50%)",
          }}
        />

        {/* Cinematic Vignette Overlays for Maximum Contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#060a14] via-transparent to-[#060a14]" />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 50% 50%, rgba(6,10,20,0.15) 0%, rgba(6,10,20,0.8) 75%, #060a14 100%)",
          }}
        />

        {/* Subtle Cybernetic Dot Grid */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.035]"
          style={{
            backgroundImage: "radial-gradient(rgba(255,255,255,0.9) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
      </div>

      {/* ── Core Hero Content (Title, Pitch, CTAs, Metric Badges) ── */}
      <div className="relative z-10 flex min-h-screen w-full flex-col items-center justify-center">
        {children}
      </div>

      {/* ── Desktop Live Telemetry Slideshow Navigation Ticker ── */}
      <div className="hidden md:flex absolute bottom-6 inset-x-0 z-20 items-center justify-center px-6 pointer-events-auto">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/20 bg-[#070d1a]/85 px-3.5 py-1.5 backdrop-blur-md shadow-2xl">
          <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-cyan-400 mr-1.5">
            <span className="size-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
            <span className="tracking-wider">FEED 0{currentIndex + 1} / 0{images.length}:</span>
            <span className="text-slate-300 font-normal">{images[currentIndex]?.label}</span>
          </div>

          <div className="flex items-center gap-1.5 ml-2 border-l border-white/10 pl-2">
            {images.map((img, idx) => (
              <button
                key={img.label || idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Switch to feed ${idx + 1}: ${img.label}`}
                className={cn(
                  "relative h-1.5 rounded-full transition-all duration-300",
                  idx === currentIndex
                    ? "w-7 bg-gradient-to-r from-cyan-400 to-sky-400 shadow-[0_0_10px_rgba(6,182,212,0.8)]"
                    : "w-2 bg-slate-600 hover:bg-slate-400"
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default HeroSlideshow;
