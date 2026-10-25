import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';

export default function GlyphPortal({
  word,
  enterLabel,
  scrollLength = 2.2,
  style,
  background,
  front,
  children,
}: {
  word: string;
  enterLabel?: string;
  scrollLength?: number;
  style?: CSSProperties;
  background?: ReactNode;
  front?: ReactNode;
  children?: ReactNode;
}) {
  const wrap = useRef<HTMLElement>(null);
  const hole = useRef<HTMLDivElement>(null);
  const letters = useRef<HTMLDivElement>(null);
  const [picked, setPicked] = useState(Math.max(0, Math.floor(word.length / 2) - 1));
  const chars = [...word];

  useEffect(() => {
    const onScroll = () => {
      const el = wrap.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = el.offsetHeight - innerHeight;
      const p = Math.min(1, Math.max(0, -rect.top / (total || 1)));
      const open = Math.min(1, Math.max(0, (p - 0.08) / 0.42));
      const radius = 8 + open * 140;
      const n = chars.length || 1;
      const cx = ((picked + 0.5) / n) * 100;
      if (hole.current) {
        hole.current.style.clipPath = `circle(${radius}% at ${cx}% 48%)`;
        hole.current.style.opacity = String(Math.min(1, open * 1.4));
      }
      if (letters.current) {
        letters.current.style.opacity = String(1 - open * 0.85);
        letters.current.style.filter = `blur(${open * 10}px)`;
      }
    };
    onScroll();
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll);
    return () => {
      removeEventListener('scroll', onScroll);
      removeEventListener('resize', onScroll);
    };
  }, [picked, chars.length]);

  return (
    <section
      ref={wrap}
      className="relative"
      style={{ height: `${scrollLength * 100}vh`, ...style }}
    >
      <div className="sticky top-0 h-screen overflow-hidden" style={{ background: 'var(--gp-field, #1a0a0e)', color: 'var(--gp-foreground, #efe7da)' }}>
        {background}
        <div
          ref={letters}
          className="absolute inset-0 z-10 flex items-center justify-center px-4"
          style={{ color: 'var(--gp-ink, #120d0b)' }}
        >
          <div
            className="flex select-none items-end justify-center gap-[0.02em] font-black"
            style={{ fontFamily: "var(--font-display), 'Figtree', sans-serif" }}
          >
            {chars.map((ch, i) => (
              <button
                key={`${ch}-${i}`}
                type="button"
                onClick={() => setPicked(i)}
                className="text-[clamp(4.5rem,18vw,14rem)] leading-[0.8] tracking-[0.02em] transition-colors"
                style={{
                  color: i === picked ? 'var(--gp-paper, #efe7da)' : 'color-mix(in srgb, var(--gp-paper, #efe7da) 72%, #7a2430)',
                  textShadow: i === picked ? '0 18px 40px rgba(0,0,0,.45)' : 'none',
                }}
                aria-label={`Enter through ${ch}`}
              >
                {ch}
              </button>
            ))}
          </div>
        </div>
        {front}
        <div className="pointer-events-none absolute inset-x-0 bottom-10 z-20 text-center text-sm tracking-wide" style={{ color: 'var(--gp-paper, #efe7da)' }}>
          {enterLabel}
        </div>
        <div
          ref={hole}
          className="absolute inset-0 z-30 flex items-center overflow-auto px-6 py-24"
          style={{ clipPath: 'circle(8% at 50% 48%)', opacity: 0, background: 'transparent' }}
        >
          {children}
        </div>
      </div>
    </section>
  );
}
