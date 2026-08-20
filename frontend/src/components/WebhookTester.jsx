import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Send, CheckCircle2 } from 'lucide-react';

export default function WebhookTester({
  apiBaseUrl,
  selectedKey,
  rawKey,
  onSaveRawKey,
  onWebhookDispatched,
}) {
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [targetUrl, setTargetUrl] = useState('https://httpbin.org/post');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);

  // Sync API key input whenever rawKey or selectedKey changes
  useEffect(() => {
    if (rawKey) {
      setApiKeyInput(rawKey);
    } else {
      setApiKeyInput('');
    }
  }, [rawKey, selectedKey]);

  const handleDispatch = async () => {
    if (!apiKeyInput.trim()) {
      alert('Please provide an API Key (pg_live_...) to dispatch webhook tasks.');
      return;
    }

    setLoading(true);
    setResponse(null);

    try {
      const payload = {
        target_url: targetUrl.trim(),
        event_type: 'payment.success',
        payload: {
          amount: 2500,
          currency: 'USD',
          customer_id: 'cust_9812',
          timestamp: new Date().toISOString(),
        },
      };

      const res = await axios.post(`${apiBaseUrl}/v1/webhooks/dispatch`, payload, {
        headers: { 'x-api-key': apiKeyInput.trim() },
      });

      setResponse({
        status: res.status,
        data: res.data,
      });

      if (selectedKey && onSaveRawKey) {
        onSaveRawKey(selectedKey.id, apiKeyInput.trim());
      }

      onWebhookDispatched &&
        onWebhookDispatched({
          timestamp: new Date().toLocaleTimeString(),
          keyName: selectedKey?.name || 'Manual Key',
          endpoint: '/v1/webhooks/dispatch',
          status: res.status,
          latency: 'Async Enqueued',
        });
    } catch (err) {
      const status = err.response?.status || 500;
      setResponse({
        status,
        data: err.response?.data || { error: err.message },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      {/* Header & Endpoint Pill */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
        <h2 className="text-sm font-bold text-gray-900">
          Webhook Task Queue Dispatcher
        </h2>
        <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200">
          POST /v1/webhooks/dispatch
        </span>
      </div>
      <p className="text-xs text-gray-500 mb-4">
        Enqueue non-blocking HTTP jobs to ARQ & Redis worker
      </p>

      {/* Input Controls */}
      <div className="space-y-3 mb-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            API Key
          </label>
          <input
            type="text"
            placeholder="Paste raw key (pg_live_...)"
            value={apiKeyInput}
            onChange={(e) => setApiKeyInput(e.target.value)}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs font-mono text-gray-900 focus:outline-none focus:bg-white focus:border-gray-900"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Target URL
          </label>
          <input
            type="text"
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
            placeholder="https://httpbin.org/post"
            className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs font-mono text-gray-900 focus:outline-none focus:bg-white focus:border-gray-900"
          />
        </div>

        <button
          onClick={handleDispatch}
          disabled={loading}
          className="w-full py-2 bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white font-semibold text-xs rounded-lg transition flex items-center justify-center gap-1.5"
        >
          <Send className="w-3.5 h-3.5" />
          <span>{loading ? 'Enqueuing...' : 'Dispatch (202)'}</span>
        </button>
      </div>

      {/* Response Terminal */}
      {response && (
        <div className="p-3.5 bg-gray-900 rounded-lg font-mono text-xs text-white overflow-hidden shadow-inner">
          <div className="flex justify-between items-center mb-2.5 pb-2 border-b border-gray-800">
            <div className="flex items-center gap-1.5">
              <CheckCircle2
                className={`w-3.5 h-3.5 ${
                  response.status === 202 || response.status === 200
                    ? 'text-emerald-400'
                    : 'text-red-400'
                }`}
              />
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  response.status === 202 || response.status === 200
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}
              >
                HTTP {response.status}{' '}
                {response.status === 202
                  ? 'Accepted'
                  : response.status === 200
                  ? 'OK'
                  : ''}
              </span>
            </div>
            <span className="text-[10px] text-gray-400">Queue Task Response</span>
          </div>
          <pre className="text-[11px] text-gray-300 overflow-x-auto max-h-48 leading-relaxed">
            {JSON.stringify(response.data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}