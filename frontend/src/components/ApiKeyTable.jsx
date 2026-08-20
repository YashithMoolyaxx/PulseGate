import React, { useState } from 'react';
import axios from 'axios';
import { Trash2 } from 'lucide-react';

export default function ApiKeyTable({ 
  apiBaseUrl, 
  token, 
  apiKeys = [], 
  onKeyCreated, 
  onKeyDeleted, 
  selectedKey, 
  onSelectKey 
}) {
  const [name, setName] = useState('');
  const [rpm, setRpm] = useState(60);
  const [createdKey, setCreatedKey] = useState(null);
  const [copyStatus, setCopyStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      const res = await axios.post(
        `${apiBaseUrl}/v1/api-keys`,
        { name, rate_limit_rpm: Number(rpm) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCreatedKey(res.data);
      setName('');
      setRpm(60);
      onKeyCreated(res.data);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to create API key');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to revoke this API key?')) return;
    try {
      await axios.delete(`${apiBaseUrl}/v1/api-keys/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      onKeyDeleted(id);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete API key');
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopyStatus('Copied!');
    setTimeout(() => setCopyStatus(''), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Provision API Key Form */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <h2 className="text-sm font-bold text-gray-900 mb-1">Provision API Key</h2>
        <p className="text-xs text-gray-500 mb-4">Create a new key with custom rate limits</p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Key Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Mobile App"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs focus:outline-none focus:bg-white focus:border-gray-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Rate Limit (req/min)</label>
            <input
              type="number"
              min="1"
              required
              value={rpm}
              onChange={(e) => setRpm(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs focus:outline-none focus:bg-white focus:border-gray-900"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white font-semibold text-xs rounded-lg transition"
          >
            {loading ? 'Creating...' : 'Create API Key'}
          </button>
        </form>

        {/* Newly Generated Key Banner */}
        {createdKey && (
          <div className="mt-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                Save Your Key
              </span>
              <button 
                onClick={() => setCreatedKey(null)}
                className="text-xs text-emerald-700 hover:text-emerald-900"
              >
                ✕
              </button>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <code className="text-xs font-mono font-bold text-emerald-700 select-all break-all flex-1">
                {createdKey.raw_api_key}
              </code>
              <button
                onClick={() => handleCopy(createdKey.raw_api_key)}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold shrink-0"
              >
                {copyStatus || 'Copy'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Active API Keys Table */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <h2 className="text-sm font-bold text-gray-900 mb-1">Active API Keys</h2>
        <p className="text-xs text-gray-500 mb-4">Keys associated with your account</p>

        <div className="w-full overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-left text-xs min-w-[450px]">
            <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] font-semibold border-b border-gray-200">
              <tr>
                <th className="px-3 py-2.5">Name</th>
                <th className="px-3 py-2.5">Key</th>
                <th className="px-3 py-2.5">Rate Limit</th>
                <th className="px-3 py-2.5">Created</th>
                <th className="px-3 py-2.5">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {apiKeys.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-3 py-6 text-center text-gray-400">
                    No active keys found.
                  </td>
                </tr>
              ) : (
                apiKeys.map((k) => (
                  <tr 
                    key={k.id}
                    onClick={() => onSelectKey && onSelectKey(k)}
                    className={`hover:bg-gray-50 cursor-pointer ${
                      selectedKey?.id === k.id ? 'bg-gray-50 font-medium' : ''
                    }`}
                  >
                    <td className="px-3 py-2.5 font-medium text-gray-900">{k.name}</td>
                    <td className="px-3 py-2.5 font-mono text-gray-500">{k.id.slice(0, 8)}...</td>
                    <td className="px-3 py-2.5 font-mono text-gray-700">{k.rate_limit_rpm} req/m</td>
                    <td className="px-3 py-2.5 text-gray-400">{new Date(k.created_at).toLocaleDateString()}</td>
                    <td className="px-3 py-2.5">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(k.id); }}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}