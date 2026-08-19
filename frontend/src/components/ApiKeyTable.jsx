import React, { useState } from 'react';
import { Key, Copy, Check, Plus, AlertCircle } from 'lucide-react';

export default function ApiKeyTable({ onKeyCreated, generatedKey, setGeneratedKey }) {
  const [keyName, setKeyName] = useState('');
  const [rateLimit, setRateLimit] = useState(60);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('http://localhost:8000/v1/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: keyName, rate_limit_rpm: Number(rateLimit) }),
      });
      if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
      const data = await res.json();
      setGeneratedKey(data);
      setKeyName('');
      if (onKeyCreated) onKeyCreated(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-6 mb-8 backdrop-blur">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-cyan-400">
        <Key className="w-5 h-5" /> API Key Management
      </h2>

      <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <input
          type="text"
          placeholder="Service / App Name (e.g. Mobile App)"
          required
          value={keyName}
          onChange={(e) => setKeyName(e.target.value)}
          className="bg-gray-950 border border-gray-700 rounded-lg px-4 py-2 text-sm text-gray-200 focus:outline-none focus:border-cyan-500"
        />
        <input
          type="number"
          placeholder="Rate Limit (RPM)"
          required
          min="1"
          value={rateLimit}
          onChange={(e) => setRateLimit(e.target.value)}
          className="bg-gray-950 border border-gray-700 rounded-lg px-4 py-2 text-sm text-gray-200 focus:outline-none focus:border-cyan-500"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 text-sm transition"
        >
          <Plus className="w-4 h-4" /> {loading ? 'Provisioning...' : 'Generate Secret Key'}
        </button>
      </form>

      {error && (
        <div className="p-3 mb-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-lg text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {generatedKey && (
        <div className="p-4 bg-gray-950 border border-cyan-500/40 rounded-xl">
          <div className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-1">
            ⚠️ Save this raw secret key — shown only once:
          </div>
          <div className="flex items-center justify-between bg-gray-900 border border-gray-800 p-3 rounded-lg font-mono text-sm text-gray-200">
            <span className="truncate mr-4 text-emerald-400">{generatedKey.raw_api_key}</span>
            <button
              onClick={() => copyToClipboard(generatedKey.raw_api_key)}
              className="flex items-center gap-1.5 px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded text-xs text-gray-300 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}