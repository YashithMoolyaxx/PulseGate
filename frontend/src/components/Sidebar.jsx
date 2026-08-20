import React from 'react';
import { 
  Key, 
  RefreshCw, 
  LogOut, 
  Trash2,
  X
} from 'lucide-react';

export default function Sidebar({ 
  userEmail, 
  apiKeys = [], 
  selectedKey, 
  onSelectKey, 
  onDeleteKey, 
  onSync, 
  onLogout, 
  isSyncing,
  isOpenMobile,
  onCloseMobile
}) {
  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpenMobile && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container (Responsive Drawer on Mobile, Static on Desktop) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 md:static md:w-64 bg-gray-900 text-white flex flex-col justify-between border-r border-gray-800 shrink-0 min-h-screen p-4 sm:p-5 transition-transform duration-300 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex flex-col flex-1 overflow-hidden">
          
          {/* Header with ECG Pulse Logo & Mobile Close Button */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
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

            {/* Close Button on Mobile */}
            <button
              onClick={onCloseMobile}
              className="p-1.5 text-gray-400 hover:text-white rounded-lg md:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* API Key Project Switcher (Real User Keys Only) */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between px-1 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                API Keys ({apiKeys.length})
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
              {apiKeys.length === 0 ? (
                <div className="p-3 text-center rounded-lg bg-gray-800/40 border border-gray-800 text-xs text-gray-500">
                  No active keys provisioned.
                </div>
              ) : (
                apiKeys.map((key) => {
                  const isSelected = selectedKey?.id === key.id;
                  return (
                    <div
                      key={key.id}
                      onClick={() => {
                        onSelectKey(key);
                        onCloseMobile();
                      }}
                      className={`group w-full flex items-center justify-between p-2.5 rounded-lg text-xs cursor-pointer transition border ${
                        isSelected
                          ? 'bg-gray-800 border-gray-600 text-white shadow-sm font-semibold'
                          : 'text-gray-400 hover:bg-gray-800/60 hover:text-gray-200 border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Key className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-emerald-400' : 'text-gray-500'}`} />
                        <div className="truncate text-left">
                          <div className="truncate font-medium">{key.name}</div>
                          <div className="text-[10px] text-gray-500 font-mono">
                            {key.rate_limit_rpm} req/min
                          </div>
                        </div>
                      </div>

                      {/* Always visible on mobile, hover-revealed on desktop */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteKey(key.id, key.name);
                        }}
                        title="Delete API Key"
                        className="p-1 text-red-400 sm:text-gray-500 sm:opacity-0 sm:group-hover:opacity-100 hover:text-red-400 transition shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* User Session & Sync Actions */}
        <div className="pt-4 border-t border-gray-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-300 truncate max-w-[140px]" title={userEmail}>
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
    </>
  );
}