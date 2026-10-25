import { useRef, type CSSProperties, type ReactNode } from 'react';

type GridImage = { src: string; alt?: string };

export function TiltedGridHero({
  images,
  className = '',
  speed = 5,
  curve = 78,
  children,
}: {
  images: GridImage[];
  className?: string;
  speed?: number;
  curve?: number;
  children?: ReactNode;
}) {
  const grid = useRef<HTMLDivElement>(null);

  return (
    <section
      className={`relative overflow-hidden ${className}`}
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        if (grid.current) {
          grid.current.style.transform = `rotateX(${curve * 0.55 + y * speed}deg) rotateY(${x * speed * 1.4}deg) translateZ(-80px) scale(1.35)`;
        }
      }}
      onPointerLeave={() => {
        if (grid.current) grid.current.style.transform = `rotateX(${curve * 0.55}deg) rotateY(0deg) translateZ(-80px) scale(1.35)`;
      }}
    >
      <div className="pointer-events-none absolute inset-0" style={{ perspective: 1400 }}>
        <div
          ref={grid}
          className="absolute left-1/2 top-[18%] grid w-[160%] max-w-none -translate-x-1/2 grid-cols-3 gap-3 transition-transform duration-500 ease-out"
          style={
            {
              transform: `rotateX(${curve * 0.55}deg) translateZ(-80px) scale(1.35)`,
              transformStyle: 'preserve-3d',
              maskImage: 'linear-gradient(to bottom, transparent 0%, black 18%, black 70%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 18%, black 70%, transparent 100%)',
            } as CSSProperties
          }
        >
          {images.map((img, i) => (
            <div
              key={img.src + i}
              className="aspect-[16/10] overflow-hidden rounded-xl border border-[#c2a36b]/20 bg-[#1a1013]"
              style={{ transform: `translateZ(${(i % 3) * 12}px)` }}
            >
              <img src={img.src} alt={img.alt ?? ''} className="h-full w-full object-cover opacity-80" />
            </div>
          ))}
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#100a0c]/15 via-[#100a0c]/45 to-[#100a0c]" />
      </div>
      <div className="relative z-10 h-full">{children}</div>
    </section>
  );
}
