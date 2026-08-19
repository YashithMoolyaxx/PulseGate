import React, { useState } from 'react';
import { Send, Clock, CheckCircle2, XCircle } from 'lucide-react';

export default function ProxyTester({ apiBaseUrl = 'http://localhost:8000', defaultApiKey, onProxyFired }) {
  const [apiKey, setApiKey] = useState(defaultApiKey || '');
  const [path, setPath] = useState('get');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [latency, setLatency] = useState(null);

  React.useEffect(() => {
    if (defaultApiKey) setApiKey(defaultApiKey);
  }, [defaultApiKey]);

  const handleTest = async () => {
    setLoading(true);
    setResponse(null);
    const start = performance.now();

    try {
      const res = await fetch(`${apiBaseUrl}/v1/proxy/${path}`, {
        method: 'GET',
        headers: { 'x-api-key': apiKey },
      });
      const duration = Math.round(performance.now() - start);
      setLatency(duration);
      const data = await res.json();
      setResponse({ status: res.status, ok: res.ok, data });
      if (onProxyFired) onProxyFired();
    } catch (err) {
      setResponse({ status: 500, ok: false, data: { error: err.message } });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 mb-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
            <Send className="w-4 h-4 text-blue-600" /> Gateway Proxy & Rate Limit Tester
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">Test real-time reverse proxy routing and sliding-window limits</p>
        </div>
        <span className="text-xs text-zinc-500 font-mono bg-zinc-100 px-2.5 py-1 rounded-lg border border-zinc-200">
          GET /v1/proxy/{'{path}'}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mb-4">
        <div className="sm:col-span-6">
          <input
            type="text"
            placeholder="X-API-Key (pg_live_...)"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:bg-white focus:border-zinc-900 font-mono"
          />
        </div>
        <div className="sm:col-span-3">
          <input
            type="text"
            placeholder="Path (e.g. get)"
            value={path}
            onChange={(e) => setPath(e.target.value)}
            className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:bg-white focus:border-zinc-900 font-mono"
          />
        </div>
        <div className="sm:col-span-3">
          <button
            onClick={handleTest}
            disabled={loading || !apiKey}
            className="w-full h-full bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs transition shadow-sm"
          >
            {loading ? 'Proxying...' : 'Fire Request'}
          </button>
        </div>
      </div>

      {response && (
        <div className="bg-[#18181b] border border-zinc-800 rounded-xl p-4 font-mono text-xs text-zinc-200 shadow-inner">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              {response.ok ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <XCircle className="w-4 h-4 text-rose-400" />
              )}
              <span className={response.ok ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                HTTP {response.status}
              </span>
            </div>
            {latency !== null && (
              <div className="flex items-center gap-1 text-zinc-400 text-xs">
                <Clock className="w-3.5 h-3.5" /> {latency} ms
              </div>
            )}
          </div>
          <pre className="text-zinc-300 text-xs overflow-x-auto">{JSON.stringify(response.data, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}