import { useState, type ComponentType, type SVGProps } from 'react';

export type OrbitalNode = {
  id: number;
  title: string;
  date: string;
  content: string;
  category: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  relatedIds: number[];
  status: 'completed' | 'in-progress' | 'pending';
  energy: number;
};

const STATUS: Record<OrbitalNode['status'], string> = {
  completed: '#c2a36b',
  'in-progress': '#efe7da',
  pending: '#efe7da55',
};

export default function RadialOrbitalTimeline({ timelineData }: { timelineData: OrbitalNode[] }) {
  const [active, setActive] = useState(timelineData[0]?.id ?? 1);
  const current = timelineData.find((n) => n.id === active) ?? timelineData[0];
  const r = 168;

  return (
    <div className="relative mx-auto my-16 flex min-h-[520px] max-w-5xl items-center justify-center px-6">
      <div className="relative h-[420px] w-[420px] max-w-full">
        <div className="absolute inset-[18%] rounded-full border border-[#c2a36b]/25" />
        <div className="absolute inset-[4%] rounded-full border border-[#c2a36b]/15" />
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 420 420">
          {timelineData.flatMap((node) =>
            node.relatedIds
              .filter((id) => id > node.id)
              .map((id) => {
                const a = timelineData.findIndex((n) => n.id === node.id);
                const b = timelineData.findIndex((n) => n.id === id);
                if (a < 0 || b < 0) return null;
                const pa = polar(a, timelineData.length, r);
                const pb = polar(b, timelineData.length, r);
                return (
                  <line
                    key={`${node.id}-${id}`}
                    x1={210 + pa.x}
                    y1={210 + pa.y}
                    x2={210 + pb.x}
                    y2={210 + pb.y}
                    stroke="#c2a36b"
                    strokeOpacity="0.35"
                    strokeWidth="1.2"
                  />
                );
              })
          )}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-40 text-center">
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-400 font-semibold">{current?.date}</p>
            <p className="mt-2 text-2xl font-bold leading-tight text-white" style={{ fontFamily: "var(--font-display), 'Figtree', sans-serif" }}>
              {current?.title}
            </p>
            <p className="mt-3 text-xs leading-relaxed text-[#efe7da]/65">{current?.content}</p>
          </div>
        </div>
        {timelineData.map((node, i) => {
          const p = polar(i, timelineData.length, r);
          const Icon = node.icon;
          const on = node.id === active;
          return (
            <button
              key={node.id}
              type="button"
              onClick={() => setActive(node.id)}
              className="absolute flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border bg-[#1a1013] transition hover:scale-110"
              style={{
                left: `calc(50% + ${p.x}px)`,
                top: `calc(50% + ${p.y}px)`,
                borderColor: STATUS[node.status],
                boxShadow: on ? '0 0 0 6px rgba(194,163,107,.18)' : 'none',
              }}
              aria-label={node.title}
            >
              <Icon width={18} height={18} color={STATUS[node.status]} />
              <span className="mt-0.5 text-[9px] uppercase tracking-wide text-[#efe7da]/70">{node.category}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function polar(i: number, n: number, radius: number) {
  const a = (i / n) * Math.PI * 2 - Math.PI / 2;
  return { x: Math.cos(a) * radius, y: Math.sin(a) * radius };
}
