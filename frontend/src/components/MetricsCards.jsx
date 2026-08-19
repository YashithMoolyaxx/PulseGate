import React from 'react';
import { Activity, ShieldCheck, KeyRound, AlertOctagon } from 'lucide-react';

export default function MetricsCards({ healthStatus, activeKeysCount, totalRequests, throttledCount }) {
  const cards = [
    { 
      title: 'Gateway Status', 
      value: healthStatus ? 'Operational' : 'Unavailable', 
      icon: ShieldCheck, 
      color: healthStatus ? 'text-emerald-600' : 'text-rose-600',
      badge: healthStatus ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
    },
    { 
      title: 'Total Proxied Requests', 
      value: Number(totalRequests).toLocaleString(), 
      icon: Activity, 
      color: 'text-blue-600',
      badge: 'bg-blue-50 text-blue-700 border-blue-200'
    },
    { 
      title: 'Active API Keys', 
      value: activeKeysCount, 
      icon: KeyRound, 
      color: 'text-zinc-700',
      badge: 'bg-zinc-100 text-zinc-700 border-zinc-200'
    },
    { 
      title: 'Rate-Limit (429) Drops', 
      value: throttledCount, 
      icon: AlertOctagon, 
      color: throttledCount > 0 ? 'text-amber-600' : 'text-zinc-400',
      badge: throttledCount > 0 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-zinc-100 text-zinc-500 border-zinc-200'
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div 
            key={idx} 
            className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">{card.title}</span>
              <div className={`p-1.5 rounded-lg border text-xs ${card.badge}`}>
                <Icon className={`w-4 h-4 ${card.color}`} />
              </div>
            </div>
            <div className="text-2xl font-bold text-zinc-900 tracking-tight">{card.value}</div>
          </div>
        );
      })}
    </div>
  );
}