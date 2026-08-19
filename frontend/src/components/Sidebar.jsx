import React, { useState } from 'react';
import { Network, Plus, KeyRound, Check, Copy, LogOut, User, AlertCircle } from 'lucide-react';

export default function Sidebar({ apiBaseUrl = 'http://localhost:8000', user, onLogout, keysList, selectedKey, onSelectKey, onKeyCreated }) {
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [rpm, setRpm] = useState(60);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdSecret, setCreatedSecret] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const token = localStorage.getItem('pulsegate_token');
    if (!token) {
      setError('Session expired. Please sign in again.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${apiBaseUrl}/v1/api-keys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, rate_limit_rpm: Number(rpm) }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to create key');

      setCreatedSecret(data);
      setName('');
      if (onKeyCreated) onKeyCreated(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToken = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <aside className="w-72 bg-[#18181b] text-zinc-100 flex flex-col h-screen p-4 select-none border-r border-zinc-800">
      <div className="flex items-center gap-3 px-2 py-3 border-b border-zinc-800 mb-5">
        <div className="bg-zinc-800 p-2 rounded-xl text-zinc-200 border border-zinc-700">
          <Network className="w-4 h-4" />
        </div>
        <div>
          <h1 className="font-bold text-white tracking-tight flex items-center gap-1.5 text-sm">
            PulseGate <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">v1.0</span>
          </h1>
          <p className="text-[11px] text-zinc-400">Developer Platform</p>
        </div>
      </div>

      <button
        onClick={() => { setCreatedSecret(null); setError(''); setShowModal(true); }}
        className="w-full bg-white hover:bg-zinc-100 text-zinc-900 font-semibold py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 text-xs transition mb-4 shadow-sm"
      >
        <Plus className="w-4 h-4" /> Provision New Key
      </button>

      <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 px-2 mb-2">
        Active Projects ({keysList.length})
      </div>

      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
        {keysList.length === 0 ? (
          <div className="p-4 text-center text-xs text-zinc-400 border border-dashed border-zinc-800 rounded-xl">
            No keys created yet. Click above to add one.
          </div>
        ) : (
          keysList.map((k) => {
            const isSelected = selectedKey?.id === k.id;
            return (
              <div
                key={k.id}
                onClick={() => onSelectKey(k)}
                className={`p-3 rounded-xl cursor-pointer transition flex flex-col gap-1 border ${
                  isSelected
                    ? 'bg-zinc-800 border-zinc-700 text-white shadow-sm'
                    : 'bg-zinc-900/40 border-transparent text-zinc-400 hover:bg-zinc-850 hover:text-zinc-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs truncate flex items-center gap-1.5 text-zinc-200">
                    <KeyRound className={`w-3.5 h-3.5 ${isSelected ? 'text-blue-400' : 'text-zinc-500'}`} />
                    {k.name}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-950 text-zinc-300 border border-zinc-800">
                    {k.rate_limit_rpm} RPM
                  </span>
                </div>
                <div className="text-[10px] text-zinc-400 font-mono truncate">
                  ID: {k.id.slice(0, 8)}...
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="pt-3 mt-auto border-t border-zinc-800 flex items-center justify-between px-1">
        <div className="flex items-center gap-2 truncate">
          <div className="p-1.5 rounded-full bg-zinc-800 text-zinc-300">
            <User className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs text-zinc-300 truncate max-w-[125px] font-medium">{user?.email}</span>
        </div>
        <button
          onClick={onLogout}
          className="text-zinc-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-zinc-800 transition"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-zinc-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 w-full max-w-md shadow-2xl text-zinc-900">
            <h3 className="text-sm font-bold text-zinc-900 mb-1 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-blue-600" /> Provision API Key
            </h3>
            <p className="text-xs text-zinc-500 mb-4">Create a new secret credential scoped to your account.</p>

            {error && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
              </div>
            )}

            {!createdSecret ? (
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Service / Microservice Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Stripe Checkout Service"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:bg-white focus:border-zinc-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Rate Limit Quota (RPM)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={rpm}
                    onChange={(e) => setRpm(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:bg-white focus:border-zinc-900"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-3.5 py-2 text-xs text-zinc-600 hover:text-zinc-900 transition font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-zinc-900 hover:bg-zinc-800 text-white font-semibold px-4 py-2 rounded-xl text-xs transition shadow-sm"
                  >
                    {loading ? 'Creating...' : 'Provision Key'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-3">
                <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 p-3 rounded-xl font-medium">
                  Key generated successfully.
                </div>
                <div className="text-xs text-zinc-600">Save this raw secret key now. It will not be displayed again:</div>
                <div className="flex items-center justify-between bg-zinc-100 border border-zinc-200 p-3 rounded-xl font-mono text-xs text-zinc-900">
                  <span className="truncate mr-2 font-medium">{createdSecret.raw_api_key}</span>
                  <button
                    onClick={() => copyToken(createdSecret.raw_api_key)}
                    className="px-2.5 py-1 bg-white border border-zinc-300 hover:bg-zinc-50 rounded-lg text-xs text-zinc-700 flex items-center gap-1.5 transition shadow-xs"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-full bg-zinc-900 hover:bg-zinc-800 text-white text-xs py-2.5 rounded-xl font-semibold transition mt-3"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}