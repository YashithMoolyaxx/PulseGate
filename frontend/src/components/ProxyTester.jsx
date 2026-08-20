import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Zap, Clock, Terminal } from 'lucide-react';

export default function ProxyTester({
  apiBaseUrl,
  selectedKey,
  rawKey,
  onSaveRawKey,
  onLogGenerated,
}) {
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [proxyPath, setProxyPath] = useState('get');
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

  const handleTest = async () => {
    if (!apiKeyInput.trim()) {
      alert('Please provide an API Key (pg_live_...) to test the proxy gateway.');
      return;
    }

    setLoading(true);
    setResponse(null);
    const start = performance.now();
    const cleanPath = proxyPath.trim().replace(/^\/+/, '') || 'get';

    try {
      const res = await axios.get(`${apiBaseUrl}/v1/proxy/${cleanPath}`, {
        headers: { 'x-api-key': apiKeyInput.trim() },
      });
      const latency = Math.round(performance.now() - start);

      setResponse({
        status: res.status,
        latency,
        data: res.data,
      });

      if (selectedKey && onSaveRawKey) {
        onSaveRawKey(selectedKey.id, apiKeyInput.trim());
      }

      onLogGenerated &&
        onLogGenerated({
          timestamp: new Date().toLocaleTimeString(),
          keyName: selectedKey?.name || 'Manual Key',
          endpoint: `/v1/proxy/${cleanPath}`,
          status: res.status,
          latency: `${latency}ms`,
          isRateLimit: false,
        });
    } catch (err) {
      const status = err.response?.status || 500;
      const latency = Math.round(performance.now() - start);

      setResponse({
        status,
        latency,
        data: err.response?.data || { error: err.message },
      });

      onLogGenerated &&
        onLogGenerated({
          timestamp: new Date().toLocaleTimeString(),
          keyName: selectedKey?.name || 'Manual Key',
          endpoint: `/v1/proxy/${cleanPath}`,
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
      {/* Header & Endpoint Pill */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
        <h2 className="text-sm font-bold text-gray-900">
          Gateway Proxy & Rate Limit Tester
        </h2>
        <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200">
          GET /v1/proxy/{'{path}'}
        </span>
      </div>
      <p className="text-xs text-gray-500 mb-4">
        Test real-time reverse proxy routing and sliding-window limits
      </p>

      {/* Input Controls */}
      <div className="space-y-3 mb-4">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold text-gray-700">
              API Key
            </label>
            {selectedKey && (
              <span className="text-[10px] text-indigo-600 font-mono">
                Active: {selectedKey.name} ({selectedKey.rate_limit_rpm} req/m)
              </span>
            )}
          </div>
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
            Path
          </label>
          <div className="flex gap-2">
            <div className="flex-1 flex items-center bg-gray-50 border border-gray-300 rounded-lg overflow-hidden px-3 py-2">
              <span className="text-xs text-gray-400 font-mono select-none">
                /v1/proxy/
              </span>
              <input
                type="text"
                value={proxyPath}
                onChange={(e) => setProxyPath(e.target.value)}
                placeholder="get"
                className="flex-1 bg-transparent text-xs font-mono text-gray-900 focus:outline-none ml-1"
              />
            </div>
            <button
              onClick={handleTest}
              disabled={loading}
              className="px-4 py-2 bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white font-semibold text-xs rounded-lg transition whitespace-nowrap flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>{loading ? 'Firing...' : 'Fire Request'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Response Terminal */}
      {response && (
        <div className="p-3.5 bg-gray-900 rounded-lg font-mono text-xs text-white overflow-hidden shadow-inner">
          <div className="flex justify-between items-center mb-2.5 pb-2 border-b border-gray-800">
            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  response.status === 200
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : response.status === 429
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}
              >
                HTTP {response.status}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-gray-400">
              <Clock className="w-3 h-3 text-gray-400" />
              <span>{response.latency} ms</span>
            </div>
          </div>
          <pre className="text-[11px] text-gray-300 overflow-x-auto max-h-48 leading-relaxed">
            {JSON.stringify(response.data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}