type Month =
  | 'January'
  | 'February'
  | 'March'
  | 'April'
  | 'May'
  | 'June'
  | 'July'
  | 'August'
  | 'September'
  | 'October'
  | 'November'
  | 'December';

export type TimelineItem = {
  id: string;
  year: string;
  month: Month;
  content: string;
};

export default function Timeline({
  title,
  periodLabel,
  topItems,
  bottomItems,
  activeColor = '#c2a36b',
  backgroundColor = '#100a0c',
  textColor = '#efe7da',
  mutedTextColor = '#efe7da99',
  imageUrl,
  imageAlt,
}: {
  title: string;
  periodLabel: string;
  topItems: TimelineItem[];
  bottomItems: TimelineItem[];
  activeColor?: string;
  backgroundColor?: string;
  textColor?: string;
  mutedTextColor?: string;
  imageUrl?: string;
  imageAlt?: string;
}) {
  const all = [...topItems, ...bottomItems];

  return (
    <div className="mx-auto mt-20 max-w-6xl px-6" style={{ backgroundColor, color: textColor }}>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm" style={{ color: activeColor }}>
            {periodLabel}
          </p>
          <h3 className="mt-2 text-4xl sm:text-5xl font-bold tracking-tight" style={{ fontFamily: "var(--font-display), 'Figtree', sans-serif" }}>
            {title}
          </h3>
        </div>
        {imageUrl && (
          <img src={imageUrl} alt={imageAlt ?? ''} className="h-28 w-full max-w-sm rounded-2xl object-cover opacity-85 lg:h-36" />
        )}
      </div>

      <div className="relative mt-16 overflow-x-auto pb-8">
        <div className="relative min-w-[720px]">
          <div className="mb-10 grid grid-cols-4 gap-6">
            {topItems.map((item) => (
              <Card key={item.id} item={item} activeColor={activeColor} muted={mutedTextColor} />
            ))}
          </div>
          <div className="relative h-px" style={{ background: `${activeColor}55` }}>
            {all.map((item, i) => (
              <span
                key={item.id}
                className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{ left: `${((i + 0.5) / all.length) * 100}%`, background: activeColor }}
              />
            ))}
          </div>
          <div className="mt-10 grid grid-cols-3 gap-6">
            {bottomItems.map((item) => (
              <Card key={item.id} item={item} activeColor={activeColor} muted={mutedTextColor} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Card({ item, activeColor, muted }: { item: TimelineItem; activeColor: string; muted: string }) {
  return (
    <div className="rounded-2xl border border-[#c2a36b]/20 bg-[#1a1013] p-5">
      <p className="text-xs uppercase tracking-[0.16em]" style={{ color: activeColor }}>
        {item.month} {item.year}
      </p>
      <p className="mt-3 text-sm leading-relaxed" style={{ color: muted }}>
        {item.content}
      </p>
    </div>
  );
}
