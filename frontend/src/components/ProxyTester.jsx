import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function ProxyTester({ 
  apiBaseUrl, 
  selectedKey, 
  rawKey, 
  onSaveRawKey, 
  onLogGenerated 
}) {
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [proxyPath, setProxyPath] = useState('get');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);

  // Sync apiKeyInput whenever rawKey or selectedKey changes
  useEffect(() => {
    if (rawKey) {
      setApiKeyInput(rawKey);
    } else {
      setApiKeyInput('');
    }
  }, [rawKey, selectedKey]);

  const handleTest = async () => {
    if (!apiKeyInput.trim()) {
      alert('Please enter or paste your API key (pg_live_...) to send a request.');
      return;
    }

    setLoading(true);
    setResponse(null);
    const start = performance.now();

    // Clean up proxy path (remove leading slash if user added it)
    const cleanPath = proxyPath.replace(/^\/+/, '');

    try {
      const res = await axios.get(`${apiBaseUrl}/v1/proxy/${cleanPath}`, {
        headers: { 'x-api-key': apiKeyInput.trim() }
      });
      const latency = Math.round(performance.now() - start);

      setResponse({ status: res.status, data: res.data });

      // Save key into browser storage if it was manually entered
      if (selectedKey && onSaveRawKey) {
        onSaveRawKey(selectedKey.id, apiKeyInput.trim());
      }

      onLogGenerated && onLogGenerated({
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
        data: err.response?.data || { error: err.message } 
      });

      onLogGenerated && onLogGenerated({
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
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-sm font-bold text-gray-900">Test Rate Limiter</h2>
        {selectedKey && (
          <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded font-mono font-semibold">
            {selectedKey.name} ({selectedKey.rate_limit_rpm} req/m)
          </span>
        )}
      </div>
      <p className="text-xs text-gray-500 mb-4">
        Send requests through the reverse proxy to test token bucket limits
      </p>

      {/* API Key Input Field */}
      <div className="space-y-3 mb-4">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold text-gray-700">
              API Key
            </label>
            {selectedKey && !rawKey && (
              <span className="text-[10px] text-amber-600 font-medium">
                Enter key to test "{selectedKey.name}"
              </span>
            )}
          </div>
          <input
            type="text"
            placeholder="Paste your raw key (pg_live_...)"
            value={apiKeyInput}
            onChange={(e) => setApiKeyInput(e.target.value)}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs font-mono focus:outline-none focus:bg-white focus:border-gray-900"
          />
        </div>

        {/* Endpoint Path & Send Action */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Proxy Path
          </label>
          <div className="flex gap-2">
            <div className="flex-1 flex items-center bg-gray-50 border border-gray-300 rounded-lg overflow-hidden px-3 py-2">
              <span className="text-xs text-gray-400 font-mono select-none">GET /v1/proxy/</span>
              <input
                type="text"
                value={proxyPath}
                onChange={(e) => setProxyPath(e.target.value)}
                placeholder="get"
                className="flex-1 bg-transparent text-xs font-mono text-gray-800 focus:outline-none ml-1"
              />
            </div>
            <button
              onClick={handleTest}
              disabled={loading}
              className="px-4 py-2 bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white font-semibold text-xs rounded-lg transition whitespace-nowrap"
            >
              {loading ? 'Sending...' : 'Send Request'}
            </button>
          </div>
        </div>
      </div>

      {/* Terminal Response Output */}
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