import React from 'react';
import { 
  LayoutDashboard, 
  Key, 
  Zap, 
  Clock, 
  RefreshCw, 
  LogOut, 
  ExternalLink 
} from 'lucide-react';

export default function Sidebar({ 
  userEmail, 
  onSync, 
  onLogout, 
  isSyncing,
  apiBaseUrl 
}) {
  return (
    <aside className="w-full md:w-64 bg-gray-900 text-white flex flex-col justify-between border-r border-gray-800 shrink-0 min-h-full p-4 sm:p-5">
      <div>
        {/* Brand with ECG Heartbeat Pulse Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="h-9 w-9 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center text-white shadow-inner shrink-0">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="w-5 h-5 text-white"
            >
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-white">PulseGate</h1>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded font-semibold">
                Live
              </span>
            </div>
            <p className="text-[11px] text-gray-400">Gateway Console</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold bg-indigo-600 text-white">
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </button>
          <a
            href={`${apiBaseUrl}/docs`}
            target="_blank"
            rel="noreferrer"
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-gray-400 hover:bg-gray-800 hover:text-gray-200 transition"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Swagger Docs</span>
          </a>
        </nav>

        {/* Operational Status */}
        <div className="my-6 p-3 bg-gray-800/60 border border-gray-800 rounded-xl">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] text-gray-400 font-medium">Gateway Core</span>
            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Operational
            </span>
          </div>
          <p className="text-[10px] text-gray-500">FastAPI • Redis Token Bucket</p>
        </div>
      </div>

      {/* User Session and Controls */}
      <div className="pt-4 border-t border-gray-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-300 truncate max-w-[140px]">
            {userEmail || 'Developer'}
          </span>
          <button
            onClick={onSync}
            disabled={isSyncing}
            title="Sync Status"
            className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>

        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-semibold transition"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}