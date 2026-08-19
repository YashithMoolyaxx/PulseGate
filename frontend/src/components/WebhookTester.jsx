import React, { useState } from 'react';
import { Radio, CheckCircle2 } from 'lucide-react';

export default function WebhookTester({ defaultApiKey, onWebhookFired }) {
  const [apiKey, setApiKey] = useState(defaultApiKey || '');
  const [targetUrl, setTargetUrl] = useState('https://httpbin.org/post');
  const [eventType, setEventType] = useState('rate_limit.warning');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  React.useEffect(() => {
    if (defaultApiKey) setApiKey(defaultApiKey);
  }, [defaultApiKey]);

  const handleDispatch = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('http://localhost:8000/v1/webhooks/dispatch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: JSON.stringify({
          target_url: targetUrl,
          event_type: eventType,
          payload: { alert: 'Triggered from PulseGate Console', timestamp: new Date().toISOString() },
        }),
      });
      const data = await res.json();
      setResult({ status: res.status, data });
      if (onWebhookFired) onWebhookFired();
    } catch (err) {
      setResult({ status: 500, data: { error: err.message } });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
            <Radio className="w-4 h-4 text-purple-600" /> Webhook Task Queue Dispatcher
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">Enqueue non-blocking HTTP jobs to ARQ & Redis worker</p>
        </div>
        <span className="text-xs text-zinc-500 font-mono bg-zinc-100 px-2.5 py-1 rounded-lg border border-zinc-200">
          POST /v1/webhooks/dispatch
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mb-4">
        <div className="sm:col-span-5">
          <input
            type="text"
            placeholder="X-API-Key (pg_live_...)"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:bg-white focus:border-zinc-900 font-mono"
          />
        </div>
        <div className="sm:col-span-4">
          <input
            type="text"
            placeholder="Target URL"
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
            className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:bg-white focus:border-zinc-900 font-mono"
          />
        </div>
        <div className="sm:col-span-3">
          <button
            onClick={handleDispatch}
            disabled={loading || !apiKey}
            className="w-full h-full bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs transition shadow-sm"
          >
            {loading ? 'Enqueuing...' : 'Dispatch (202)'}
          </button>
        </div>
      </div>

      {result && (
        <div className="p-4 bg-[#18181b] border border-zinc-800 rounded-xl font-mono text-xs text-zinc-200 shadow-inner">
          <div className="font-semibold mb-1 flex items-center gap-2 text-emerald-400">
            <CheckCircle2 className="w-4 h-4" /> HTTP {result.status} (Task Enqueued in Redis)
          </div>
          <pre className="text-zinc-300 text-xs overflow-x-auto">{JSON.stringify(result.data, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}