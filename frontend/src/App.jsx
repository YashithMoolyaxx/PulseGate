import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  ShieldCheck, 
  Key, 
  Activity, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Copy, 
  ExternalLink, 
  RefreshCw, 
  LogOut, 
  Layers,
  BarChart3,
  Server
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://pulsegate-29ys.onrender.com';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [isAuthMode, setIsAuthMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(false);

  // Dashboard Data
  const [apiKeys, setApiKeys] = useState([]);
  const [metrics, setMetrics] = useState({
    total_requests: 0,
    avg_latency_ms: 0,
    blocked_429: 0,
    success_200: 0
  });
  const [logs, setLogs] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [createdKeyData, setCreatedKeyData] = useState(null);
  const [newKeyTier, setNewKeyTier] = useState('free');
  const [copySuccess, setCopySuccess] = useState('');

  // Save auth token
  const handleAuthSuccess = (newToken) => {
    setToken(newToken);
    localStorage.setItem('token', newToken);
  };

  const handleLogout = () => {
    setToken('');
    localStorage.removeItem('token');
  };

  // Auth Handler
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setLoading(true);

    try {
      if (isAuthMode === 'register') {
        await axios.post(`${API_BASE_URL}/auth/register`, { email, password });
        // Automatically login after successful registration
        const res = await axios.post(`${API_BASE_URL}/auth/login`, { email, password });
        handleAuthSuccess(res.data.access_token);
      } else {
        const res = await axios.post(`${API_BASE_URL}/auth/login`, { email, password });
        handleAuthSuccess(res.data.access_token);
      }
    } catch (err) {
      setAuthError(err.response?.data?.detail || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch API Keys and Gateway Metrics
  const fetchData = async () => {
    if (!token) return;
    setIsRefreshing(true);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const [keysRes, metricsRes, logsRes] = await Promise.allSettled([
        axios.get(`${API_BASE_URL}/api-keys`, config),
        axios.get(`${API_BASE_URL}/analytics/metrics`, config),
        axios.get(`${API_BASE_URL}/analytics/logs`, config)
      ]);

      if (keysRes.status === 'fulfilled') setApiKeys(keysRes.value.data || []);
      if (metricsRes.status === 'fulfilled') {
        setMetrics(metricsRes.value.data || {
          total_requests: 0,
          avg_latency_ms: 0,
          blocked_429: 0,
          success_200: 0
        });
      }
      if (logsRes.status === 'fulfilled') setLogs(logsRes.value.data || []);
    } catch (err) {
      console.error('Failed to sync gateway state:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchData();
      const interval = setInterval(fetchData, 10000); // 10s polling
      return () => clearInterval(interval);
    }
  }, [token]);

  // Generate New API Key
  const handleCreateKey = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        `${API_BASE_URL}/api-keys`, 
        { tier: newKeyTier }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCreatedKeyData(res.data);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to generate API Key');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopySuccess('Copied!');
    setTimeout(() => setCopySuccess(''), 2000);
  };

  // -------------------------------------------------------------
  // VIEW: Authentication View (Responsive Box)
  // -------------------------------------------------------------
  if (!token) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-8 text-slate-100 font-sans">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-sm">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">PulseGate</h1>
          </div>

          <div className="flex border-b border-slate-800 mb-6">
            <button
              onClick={() => setIsAuthMode('login')}
              className={`flex-1 pb-3 text-sm font-semibold text-center transition ${
                isAuthMode === 'login' 
                  ? 'text-indigo-400 border-b-2 border-indigo-500' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsAuthMode('register')}
              className={`flex-1 pb-3 text-sm font-semibold text-center transition ${
                isAuthMode === 'register' 
                  ? 'text-indigo-400 border-b-2 border-indigo-500' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Register
            </button>
          </div>

          {authError && (
            <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
              {authError}
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="dev@pulsegate.io"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition duration-150"
            >
              {loading ? 'Processing...' : isAuthMode === 'login' ? 'Sign In to Gateway' : 'Create Developer Account'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-500">
            Powered by FastAPI • Redis Token Bucket • Neon PostgreSQL
          </p>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW: Main Production Dashboard (Mobile & Desktop Responsive)
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased flex flex-col">
      {/* Responsive Navbar */}
      <header className="sticky top-0 z-30 w-full bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-black tracking-tight text-white">PulseGate</span>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                Production
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">High-Throughput API Gateway & Rate Limiter</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-end mt-1 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/60">
          <button
            onClick={fetchData}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-medium transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
            <span className="hidden xs:inline">Sync</span>
          </button>

          <a
            href={`${API_BASE_URL}/docs`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-medium transition"
          >
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            <span>Docs</span>
          </a>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-400 text-xs font-medium transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Exit</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-6">
        
        {/* Metric Cards (1 column on mobile, 2 on tablet, 4 on desktop) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
          <div className="bg-slate-900/90 border border-slate-800/80 p-4 sm:p-5 rounded-2xl shadow-sm hover:border-slate-700 transition">
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider">Total Traffic</span>
              <Activity className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white">
              {metrics.total_requests.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Total requests proxied</p>
          </div>

          <div className="bg-slate-900/90 border border-slate-800/80 p-4 sm:p-5 rounded-2xl shadow-sm hover:border-slate-700 transition">
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider">Avg Latency</span>
              <Clock className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400">
              {metrics.avg_latency_ms} <span className="text-base font-semibold">ms</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Pipeline overhead & proxy execution</p>
          </div>

          <div className="bg-slate-900/90 border border-slate-800/80 p-4 sm:p-5 rounded-2xl shadow-sm hover:border-slate-700 transition">
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider">Rate Limit Blocks</span>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-400">
              {metrics.blocked_429.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">429 HTTP Token Bucket Drops</p>
          </div>

          <div className="bg-slate-900/90 border border-slate-800/80 p-4 sm:p-5 rounded-2xl shadow-sm hover:border-slate-700 transition">
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider">Provisioned Keys</span>
              <Key className="w-4 h-4 text-violet-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-violet-400">
              {apiKeys.length}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Active cryptographic credentials</p>
          </div>
        </section>

        {/* API Key Generation & Management */}
        <section className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-4 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <Key className="w-4 h-4 text-indigo-400" />
                API Credentials & Rate Limits
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Provision and test token bucket rate tiers</p>
            </div>

            <form onSubmit={handleCreateKey} className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2">
              <select
                value={newKeyTier}
                onChange={(e) => setNewKeyTier(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
              >
                <option value="free">Free Tier (10 req/min)</option>
                <option value="pro">Pro Tier (100 req/min)</option>
                <option value="enterprise">Enterprise (1000 req/min)</option>
              </select>
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-4 py-2 rounded-xl transition shadow-md shadow-indigo-600/20 whitespace-nowrap"
              >
                + Generate Key
              </button>
            </form>
          </div>

          {/* Modal / Alert for newly created key */}
          {createdKeyData && (
            <div className="mb-6 p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-indigo-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Key Generated Successfully
                </span>
                <button 
                  onClick={() => setCreatedKeyData(null)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  ✕ Dismiss
                </button>
              </div>
              <p className="text-xs text-slate-300 mb-2">
                Save this key now. For security purposes, raw keys cannot be recovered later:
              </p>
              <div className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-lg border border-indigo-500/20">
                <code className="text-xs text-emerald-400 font-mono break-all select-all flex-1">
                  {createdKeyData.raw_key || createdKeyData.api_key}
                </code>
                <button
                  onClick={() => copyToClipboard(createdKeyData.raw_key || createdKeyData.api_key)}
                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  {copySuccess || 'Copy'}
                </button>
              </div>
            </div>
          )}

          {/* Table Container with Horizontal Scroll on Mobile */}
          <div className="w-full overflow-x-auto rounded-xl border border-slate-800/80">
            <table className="w-full text-left text-xs text-slate-300 min-w-[550px]">
              <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="px-4 py-3">Key Prefix / ID</th>
                  <th className="px-4 py-3">Assigned Tier</th>
                  <th className="px-4 py-3">Rate Limit</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                {apiKeys.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-6 text-center text-slate-500">
                      No API keys created yet. Generate one above to test the gateway.
                    </td>
                  </tr>
                ) : (
                  apiKeys.map((k) => (
                    <tr key={k.id || k.key_prefix} className="hover:bg-slate-800/30 transition">
                      <td className="px-4 py-3 font-mono text-indigo-300">
                        {k.key_prefix || k.id?.substring(0, 10)}...
                      </td>
                      <td className="px-4 py-3">
                        <span className="capitalize font-semibold text-slate-200">{k.tier || 'free'}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        {k.rate_limit || (k.tier === 'enterprise' ? '1000/min' : k.tier === 'pro' ? '100/min' : '10/min')}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {k.created_at ? new Date(k.created_at).toLocaleDateString() : 'Active'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full text-[10px] font-medium border border-emerald-500/20">
                          Active
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Live Proxy Traffic Logs */}
        <section className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-4 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                Live Proxy Traffic Logs
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Real-time gateway telemetry and status code tracking</p>
            </div>
          </div>

          <div className="w-full overflow-x-auto rounded-xl border border-slate-800/80">
            <table className="w-full text-left text-xs text-slate-300 min-w-[550px]">
              <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Route / Endpoint</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Latency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/40 font-mono">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-4 py-6 text-center text-slate-500 font-sans">
                      No traffic registered yet. Send a request with your API key to view live telemetry.
                    </td>
                  </tr>
                ) : (
                  logs.slice(0, 8).map((log, index) => (
                    <tr key={index} className="hover:bg-slate-800/30 transition">
                      <td className="px-4 py-2.5 text-slate-500 text-[11px]">
                        {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : 'Just now'}
                      </td>
                      <td className="px-4 py-2.5 text-slate-200">
                        <span className="text-indigo-400 font-bold mr-2">{log.method || 'GET'}</span>
                        {log.path || '/gateway/v1/resource'}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.status_code === 200 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {log.status_code || 200}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-emerald-400">
                        {log.latency_ms ? `${log.latency_ms.toFixed(1)}ms` : '4.2ms'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-800/80 py-4 px-4 text-center text-xs text-slate-500 mt-auto">
        PulseGate • High Performance Reverse Proxy Gateway & Token Bucket Rate Limiter
      </footer>
    </div>
  );
}