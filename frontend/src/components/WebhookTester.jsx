import React, { useState } from 'react';
import axios from 'axios';

export default function WebhookTester({ apiBaseUrl, lastCreatedRawKey, onWebhookDispatched }) {
  const [targetUrl, setTargetUrl] = useState('https://httpbin.org/post');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);

  const handleDispatch = async () => {
    const rawKey = lastCreatedRawKey || prompt('Enter your raw API key (pg_live_...) to dispatch webhook:');
    if (!rawKey) return;

    setLoading(true);
    setResponse(null);

    try {
      const payload = {
        target_url: targetUrl,
        event_type: 'payment.success',
        payload: { amount: 2500, currency: 'USD', customer_id: 'cust_9812' },
      };
      const res = await axios.post(`${apiBaseUrl}/v1/webhooks/dispatch`, payload, {
        headers: { 'x-api-key': rawKey }
      });
      setResponse({ status: res.status, data: res.data });
      onWebhookDispatched && onWebhookDispatched({
        timestamp: new Date().toLocaleTimeString(),
        keyName: 'Active Key',
        endpoint: '/v1/webhooks/dispatch',
        status: res.status,
        latency: 'Async Enqueued',
      });
    } catch (err) {
      const status = err.response?.status || 500;
      setResponse({ status, data: err.response?.data || { error: err.message } });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <h2 className="text-sm font-bold text-gray-900 mb-1">Trigger Async Webhook</h2>
      <p className="text-xs text-gray-500 mb-4">Enqueue a webhook delivery task processed by Redis + ARQ</p>

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Target URL</label>
          <input
            type="text"
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
            placeholder="https://httpbin.org/post"
            className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs font-mono focus:outline-none focus:bg-white focus:border-gray-900"
          />
        </div>

        <button
          onClick={handleDispatch}
          disabled={loading}
          className="w-full py-2 bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white font-semibold text-xs rounded-lg transition"
        >
          {loading ? 'Enqueuing...' : 'Enqueue Webhook'}
        </button>
      </div>

      {response && (
        <div className="mt-4 p-3 bg-gray-900 rounded-lg font-mono text-xs text-white overflow-hidden">
          <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-800">
            <span className="font-bold text-emerald-400">
              HTTP {response.status} (Task Enqueued)
            </span>
          </div>
          <pre className="text-[11px] text-gray-300 overflow-x-auto max-h-36">
            {JSON.stringify(response.data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}