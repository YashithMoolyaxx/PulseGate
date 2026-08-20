import React, { useState } from 'react';
import axios from 'axios';

export default function ProxyTester({ apiBaseUrl, lastCreatedRawKey, onLogGenerated }) {
  const [path, setPath] = useState('get');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);

  const handleTest = async () => {
    const rawKey = lastCreatedRawKey || prompt('Enter your raw API key (pg_live_...) to send request:');
    if (!rawKey) return;

    setLoading(true);
    setResponse(null);
    const start = performance.now();

    try {
      const res = await axios.get(`${apiBaseUrl}/v1/proxy/${path}`, {
        headers: { 'x-api-key': rawKey }
      });
      const latency = Math.round(performance.now() - start);
      setResponse({ status: res.status, data: res.data });
      onLogGenerated && onLogGenerated({
        timestamp: new Date().toLocaleTimeString(),
        keyName: 'Active Key',
        endpoint: `/v1/proxy/${path}`,
        status: res.status,
        latency: `${latency}ms`,
        isRateLimit: false,
      });
    } catch (err) {
      const status = err.response?.status || 500;
      const latency = Math.round(performance.now() - start);
      setResponse({ status, data: err.response?.data || { error: err.message } });
      onLogGenerated && onLogGenerated({
        timestamp: new Date().toLocaleTimeString(),
        keyName: 'Active Key',
        endpoint: `/v1/proxy/${path}`,
        status,
        latency: `${latency}ms`,
        isRateLimit: status === 429,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <h2 className="text-sm font-bold text-gray-900 mb-1">Test Rate Limiter</h2>
      <p className="text-xs text-gray-500 mb-4">Send requests through the reverse proxy to test limits</p>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          readOnly
          value={`GET /v1/proxy/${path}`}
          className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs font-mono text-gray-700"
        />
        <button
          onClick={handleTest}
          disabled={loading}
          className="px-4 py-2 bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white font-semibold text-xs rounded-lg transition whitespace-nowrap"
        >
          {loading ? 'Sending...' : 'Send Request'}
        </button>
      </div>

      {response && (
        <div className="p-3 bg-gray-900 rounded-lg font-mono text-xs text-white overflow-hidden">
          <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-800">
            <span className={`font-bold ${response.status === 200 ? 'text-emerald-400' : 'text-red-400'}`}>
              HTTP {response.status}
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