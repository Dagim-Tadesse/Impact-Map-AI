import React, { useEffect, useRef, useState } from 'react';
import { Check } from 'lucide-react';

interface DropdownProps {
  buttonTestId?: string;
  buttonClassName?: string;
  buttonLabel: (open: boolean) => React.ReactNode;
  align?: 'left' | 'right';
  panelClassName?: string;
  children: (close: () => void) => React.ReactNode;
}

export const Dropdown: React.FC<DropdownProps> = ({
  buttonTestId,
  buttonClassName,
  buttonLabel,
  align = 'left',
  panelClassName = '',
  children,
}) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) close();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Capture phase: Escape closes the topmost menu and stops here.
        e.stopPropagation();
        close();
      }
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('keydown', onKeyDown, true);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        data-testid={buttonTestId}
        onClick={() => setOpen((prev) => !prev)}
        className={buttonClassName}
      >
        {buttonLabel(open)}
      </button>
      {open && (
        <div
          role="menu"
          className={`absolute top-full mt-2 z-50 min-w-[250px] max-w-[calc(100vw-20px)] overflow-hidden rounded-2xl border border-white/10 bg-[#0b1018]/95 py-1.5 backdrop-blur-2xl shadow-[0_16px_50px_rgba(0,0,0,0.85)] ${
            align === 'right' ? 'right-0' : 'left-0'
          } max-sm:fixed max-sm:top-[58px] max-sm:left-2.5 max-sm:right-2.5 max-sm:min-w-0 max-sm:w-auto ${panelClassName}`}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
};

export const DropdownSection: React.FC<{ title: string }> = ({ title }) => (
  <div className="px-3.5 pb-1 pt-3 text-[10px] font-mono uppercase tracking-wider text-slate-500">{title}</div>
);

interface DropdownItemProps {
  icon?: React.ReactNode;
  label: React.ReactNode;
  hint?: React.ReactNode;
  active?: boolean;
  muted?: boolean;
  onClick?: () => void;
}

export const DropdownItem: React.FC<DropdownItemProps> = ({ icon, label, hint, active, muted, onClick }) => (
  <button
    type="button"
    role="menuitem"
    onClick={onClick}
    className={`w-full min-h-[44px] flex items-center gap-2.5 px-3.5 py-2 text-left text-sm transition-colors ${
      active
        ? 'bg-cyan-500/15 text-cyan-300'
        : muted
          ? 'text-slate-400'
          : 'text-slate-200 hover:bg-white/[0.06] hover:text-white'
    }`}
  >
    {icon && <span className="w-4 flex justify-center shrink-0">{icon}</span>}
    <span className="flex-1 min-w-0 truncate">{label}</span>
    {hint && <span className="ml-2 shrink-0 text-[10px] font-mono text-slate-500">{hint}</span>}
    {active && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
  </button>
);
