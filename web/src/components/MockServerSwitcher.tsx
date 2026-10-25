import React from 'react';
import { Server, CheckCircle2, Clock, AlertTriangle, ShieldAlert, WifiOff, Zap } from 'lucide-react';
import { useAppStore, type MockScenarioBehavior } from '../state/useAppStore';

export const MockServerSwitcher: React.FC = () => {
  const { mockBehavior, setMockBehavior } = useAppStore();

  const options: Array<{
    id: MockScenarioBehavior;
    label: string;
    sub: string;
    statusBadge: string;
    icon: React.ReactNode;
    color: string;
  }> = [
    {
      id: 'cached_200',
      label: 'Cached 200 OK',
      sub: 'Instant simulation response from cloud cache',
      statusBadge: '200 OK',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />,
      color: 'hover:border-emerald-500/50 hover:bg-emerald-950/20',
    },
    {
      id: 'async_202',
      label: 'Async 202 Job Polling',
      sub: 'Simulates progressive queued → running → done states',
      statusBadge: '202 ACCEPTED',
      icon: <Clock className="w-3.5 h-3.5 text-sky-400" />,
      color: 'hover:border-sky-500/50 hover:bg-sky-950/20',
    },
    {
      id: 'error_400',
      label: '400 Validation Error',
      sub: 'Trigger storm rainfall limit validation rejection',
      statusBadge: '400 BAD REQ',
      icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />,
      color: 'hover:border-amber-500/50 hover:bg-amber-950/20',
    },
    {
      id: 'rate_limit_429',
      label: '429 Rate Limit',
      sub: 'Too many requests backoff and retry test',
      statusBadge: '429 TOO MANY',
      icon: <Zap className="w-3.5 h-3.5 text-purple-400" />,
      color: 'hover:border-purple-500/50 hover:bg-purple-950/20',
    },
    {
      id: 'error_500',
      label: '500 Cluster Fault',
      sub: 'Simulation engine internal error with safe recovery',
      statusBadge: '500 SERVER ERR',
      icon: <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />,
      color: 'hover:border-rose-500/50 hover:bg-rose-950/20',
    },
    {
      id: 'offline',
      label: 'Network Disconnected',
      sub: 'Triggers global offline banner & demo fallback mode',
      statusBadge: 'OFFLINE',
      icon: <WifiOff className="w-3.5 h-3.5 text-slate-400" />,
      color: 'hover:border-slate-500/50 hover:bg-slate-900/30',
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white">
          <Server className="w-4 h-4 text-cyan-400" />
          <span>API Resilience &amp; Mock Lifecycle (Task T10)</span>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-bold uppercase">
          Active: {mockBehavior}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {options.map((opt) => {
          const isSelected = mockBehavior === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => {
                setMockBehavior(opt.id);
              }}
              className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                isSelected
                  ? 'bg-cyan-950/50 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)] ring-1 ring-cyan-400/50'
                  : `glass-panel border-white/10 ${opt.color}`
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-1.5">
                  {opt.icon}
                  <span className={`text-xs font-bold ${isSelected ? 'text-cyan-200' : 'text-slate-200'}`}>
                    {opt.label}
                  </span>
                </div>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400">
                  {opt.statusBadge}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                {opt.sub}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
