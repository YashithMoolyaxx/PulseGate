import React, { useState } from 'react';
import axios from 'axios';
import { Zap } from 'lucide-react';

export default function ProxyTester({ apiBaseUrl, selectedKey, rawKey, onLogGenerated, onSaveRawKey }) {
  const [path, setPath] = useState('get');
  const [customKeyInput, setCustomKeyInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);

  const activeKey = rawKey || customKeyInput;

  const handleTest = async () => {
    if (!activeKey) {
      alert('Please enter or save the raw API key (pg_live_...) to send a request.');
      return;
    }

    setLoading(true);
    setResponse(null);
    const start = performance.now();

    try {
      const res = await axios.get(`${apiBaseUrl}/v1/proxy/${path}`, {
        headers: { 'x-api-key': activeKey }
      });
      const latency = Math.round(performance.now() - start);
      setResponse({ status: res.status, data: res.data });
      
      onLogGenerated && onLogGenerated({
        timestamp: new Date().toLocaleTimeString(),
        keyName: selectedKey?.name || 'Active Key',
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
        keyName: selectedKey?.name || 'Active Key',
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
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-sm font-bold text-gray-900">Test Rate Limiter</h2>
        {selectedKey && (
          <span className="text-[11px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded font-mono font-semibold">
            {selectedKey.name} ({selectedKey.rate_limit_rpm} req/m)
          </span>
        )}
      </div>
      <p className="text-xs text-gray-500 mb-4">Send requests through the reverse proxy to test token bucket limits</p>

      {/* If raw key is not cached in browser, provide inline input */}
      {!rawKey && selectedKey && (
        <div className="mb-3 p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
          <label className="block text-[11px] font-semibold text-amber-800 mb-1">
            Raw Key Required for "{selectedKey.name}":
          </label>
          <div className="flex gap-2">
            <input
              type="password"
              placeholder="pg_live_..."
              value={customKeyInput}
              onChange={(e) => setCustomKeyInput(e.target.value)}
              className="flex-1 px-2.5 py-1 text-xs font-mono bg-white border border-amber-300 rounded focus:outline-none"
            />
            {customKeyInput && (
              <button
                type="button"
                onClick={() => onSaveRawKey(selectedKey.id, customKeyInput)}
                className="px-2.5 py-1 bg-amber-600 text-white rounded text-xs font-semibold hover:bg-amber-700"
              >
                Save
              </button>
            )}
          </div>
        </div>
      )}

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          readOnly
          value={`GET /v1/proxy/${path}`}
          className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs font-mono text-gray-700"
        />
        <button
          onClick={handleTest}
          disabled={loading || !selectedKey}
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