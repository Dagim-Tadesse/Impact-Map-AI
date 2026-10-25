import React, { useEffect, useRef, useState } from 'react';

export const CustomCursor: React.FC = () => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    // Only enable on desktop pointer devices, disable on touch and reduced motion
    if (typeof window === 'undefined') return;
    if (window.matchMedia?.('(pointer: coarse)')?.matches) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) return;

    let mouseX = -100;
    let mouseY = -100;
    let ringX = -100;
    let ringY = -100;
    let rafId: number;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!visible) setVisible(true);

      // Check if target or parent is interactive
      const target = e.target as HTMLElement | null;
      if (target) {
        const isInteractive = target.closest('button, a, input, select, [role="button"], .interactive-hover');
        setHovered(Boolean(isInteractive));
      }
    };

    const onMouseLeave = () => {
      setVisible(false);
    };

    const render = () => {
      // Damped interpolation for trailing ring
      ringX += (mouseX - ringX) * 0.18;
      ringY += (mouseY - ringY) * 0.18;

      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
      }

      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;
      }

      rafId = requestAnimationFrame(render);
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    document.addEventListener('mouseleave', onMouseLeave);
    rafId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', onMouseLeave);
      cancelAnimationFrame(rafId);
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden="true">
      {/* Central Sharp Dot */}
      <div
        ref={cursorRef}
        className="fixed top-0 left-0 w-2 h-2 -ml-1 -mt-1 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(56,189,248,0.9)] will-change-transform"
      />

      {/* Trailing Ethereal Luminous Ring */}
      <div
        ref={ringRef}
        className={`fixed top-0 left-0 rounded-full border border-cyan-400/50 shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-[width,height,margin,border-color,background-color] duration-200 will-change-transform ${
          hovered
            ? 'w-10 h-10 -ml-5 -mt-5 bg-cyan-500/10 border-cyan-300 scale-110'
            : 'w-6 h-6 -ml-3 -mt-3 bg-transparent'
        }`}
      />
    </div>
  );
};
