import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  ShieldCheck, 
  Key, 
  Activity, 
  Send, 
  Clock, 
  Trash2, 
  Copy, 
  Check, 
  RefreshCw, 
  LogOut,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Layers
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://pulsegate-29ys.onrender.com';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [userEmail, setUserEmail] = useState(localStorage.getItem('user_email') || '');
  
  // Auth State
  const [isAuthMode, setIsAuthMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // App Data
  const [apiKeys, setApiKeys] = useState([]);
  const [selectedKey, setSelectedKey] = useState(null);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyRpm, setNewKeyRpm] = useState(60);
  const [keyModalData, setKeyModalData] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Testing Panels
  const [proxyLoading, setProxyLoading] = useState(false);
  const [proxyResponse, setProxyResponse] = useState(null);

  const [webhookUrl, setWebhookUrl] = useState('https://httpbin.org/post');
  const [webhookLoading, setWebhookLoading] = useState(false);
  const [webhookResponse, setWebhookResponse] = useState(null);

  // Metrics
  const [metrics, setMetrics] = useState({
    totalRequests: 0,
    rateLimitHits: 0,
    webhooksSent: 0
  });

  // Recent Logs
  const [logs, setLogs] = useState([]);
  const [copySuccess, setCopySuccess] = useState('');

  // Handle Authentication
  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      const endpoint = isAuthMode === 'signup' ? '/v1/auth/signup' : '/v1/auth/login';
      const res = await axios.post(`${API_BASE_URL}${endpoint}`, { email, password });
      
      const accessToken = res.data.access_token;
      const returnedEmail = res.data.email || email;
      
      setToken(accessToken);
      setUserEmail(returnedEmail);
      localStorage.setItem('token', accessToken);
      localStorage.setItem('user_email', returnedEmail);
    } catch (err) {
      setAuthError(err.response?.data?.detail || 'Authentication failed. Please verify credentials.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setToken('');
    setUserEmail('');
    localStorage.removeItem('token');
    localStorage.removeItem('user_email');
  };

  // Fetch API Keys
  const fetchDashboardData = async () => {
    if (!token) return;
    setIsRefreshing(true);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get(`${API_BASE_URL}/v1/api-keys`, config);
      const keys = res.data || [];
      setApiKeys(keys);
      if (keys.length > 0 && !selectedKey) {
        setSelectedKey(keys[0]);
      }
    } catch (err) {
      console.error('Failed to fetch API keys:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchDashboardData();
    }
  }, [token]);

  // Create API Key
  const handleCreateKey = async (e) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.post(
        `${API_BASE_URL}/v1/api-keys`,
        { name: newKeyName, rate_limit_rpm: Number(newKeyRpm) },
        config
      );
      setKeyModalData(res.data);
      setNewKeyName('');
      setNewKeyRpm(60);
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to create API key');
    }
  };

  // Delete API Key
  const handleDeleteKey = async (keyId) => {
    if (!confirm('Are you sure you want to revoke this API key?')) return;
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.delete(`${API_BASE_URL}/v1/api-keys/${keyId}`, config);
      fetchDashboardData();
      if (selectedKey?.id === keyId) setSelectedKey(null);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete key');
    }
  };

  // Test Rate Limiter (GET /v1/proxy/get)
  const handleTestProxy = async () => {
    const rawKey = keyModalData?.raw_api_key || prompt('Enter your raw API key (pg_live_...) to send request:');
    if (!rawKey) return;

    setProxyLoading(true);
    setProxyResponse(null);
    const start = performance.now();

    try {
      const res = await axios.get(`${API_BASE_URL}/v1/proxy/get`, {
        headers: { 'x-api-key': rawKey }
      });
      const latency = Math.round(performance.now() - start);

      setProxyResponse({ status: res.status, data: res.data });
      setMetrics(prev => ({ ...prev, totalRequests: prev.totalRequests + 1 }));
      setLogs(prev => [
        {
          timestamp: new Date().toLocaleTimeString(),
          keyName: selectedKey?.name || 'Live Key',
          endpoint: '/v1/proxy/get',
          status: res.status,
          latency: `${latency}ms`
        },
        ...prev.slice(0, 9)
      ]);
    } catch (err) {
      const status = err.response?.status || 500;
      const latency = Math.round(performance.now() - start);
      setProxyResponse({ status, data: err.response?.data || { error: err.message } });

      if (status === 429) {
        setMetrics(prev => ({ ...prev, rateLimitHits: prev.rateLimitHits + 1, totalRequests: prev.totalRequests + 1 }));
      } else {
        setMetrics(prev => ({ ...prev, totalRequests: prev.totalRequests + 1 }));
      }

      setLogs(prev => [
        {
          timestamp: new Date().toLocaleTimeString(),
          keyName: selectedKey?.name || 'Live Key',
          endpoint: '/v1/proxy/get',
          status,
          latency: `${latency}ms`
        },
        ...prev.slice(0, 9)
      ]);
    } finally {
      setProxyLoading(false);
    }
  };

  // Dispatch Webhook (POST /v1/webhooks/dispatch)
  const handleDispatchWebhook = async () => {
    const rawKey = keyModalData?.raw_api_key || prompt('Enter your raw API key (pg_live_...) to dispatch webhook:');
    if (!rawKey) return;

    setWebhookLoading(true);
    setWebhookResponse(null);

    try {
      const res = await axios.post(
        `${API_BASE_URL}/v1/webhooks/dispatch`,
        {
          target_url: webhookUrl,
          event_type: 'payment.success',
          payload: { amount: 2500, currency: 'USD', customer_id: 'cust_9812' }
        },
        { headers: { 'x-api-key': rawKey } }
      );
      setWebhookResponse({ status: res.status, data: res.data });
      setMetrics(prev => ({ ...prev, webhooksSent: prev.webhooksSent + 1 }));
      setLogs(prev => [
        {
          timestamp: new Date().toLocaleTimeString(),
          keyName: selectedKey?.name || 'Live Key',
          endpoint: '/v1/webhooks/dispatch',
          status: res.status,
          latency: 'Async Enqueued'
        },
        ...prev.slice(0, 9)
      ]);
    } catch (err) {
      setWebhookResponse({
        status: err.response?.status || 500,
        data: err.response?.data || { error: err.message }
      });
    } finally {
      setWebhookLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopySuccess('Copied!');
    setTimeout(() => setCopySuccess(''), 2000);
  };

  // -------------------------------------------------------------
  // AUTHENTICATION SCREEN
  // -------------------------------------------------------------
  if (!token) {
    return (
      <div className="min-h-screen bg-[#f3f4f6] flex flex-col justify-center items-center px-4 py-8 font-sans">
        <div className="w-full max-w-md bg-white border border-gray-200 rounded-xl p-6 sm:p-8 shadow-sm">
          
          <div className="flex items-center gap-3 mb-6">
            <div className="h-9 w-9 rounded-lg bg-gray-900 flex items-center justify-center text-white font-bold">
              ⚡
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">PulseGate</h1>
              <p className="text-xs text-gray-500">API Gateway Authentication</p>
            </div>
          </div>

          <div className="flex border-b border-gray-200 mb-6">
            <button
              onClick={() => { setIsAuthMode('login'); setAuthError(''); }}
              className={`flex-1 pb-2.5 text-sm font-medium text-center transition ${
                isAuthMode === 'login' 
                  ? 'text-gray-900 border-b-2 border-gray-900' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setIsAuthMode('signup'); setAuthError(''); }}
              className={`flex-1 pb-2.5 text-sm font-medium text-center transition ${
                isAuthMode === 'signup' 
                  ? 'text-gray-900 border-b-2 border-gray-900' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Create Account
            </button>
          </div>

          {authError && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
              {authError}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="developer@pulsegate.dev"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:bg-white focus:border-gray-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:bg-white focus:border-gray-900"
              />
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-2.5 bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow-sm transition"
            >
              {authLoading ? 'Verifying...' : isAuthMode === 'login' ? 'Sign In' : 'Sign Up'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // MAIN PULSEGATE DASHBOARD (Matching Pulsegate7.png Exactly)
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#f3f4f6] text-gray-900 font-sans antialiased flex flex-col">
      
      {/* Top Header Bar */}
      <header className="w-full bg-gray-900 text-white px-4 sm:px-8 py-4 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center text-white font-bold text-sm">
            ⚡
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight">PulseGate</h1>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-medium">
                Live
              </span>
            </div>
            <p className="text-xs text-gray-400 hidden sm:block">
              High-Performance API Gateway with Rate Limiting & Async Webhooks
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 hidden md:inline">{userEmail}</span>
          <button
            onClick={fetchDashboardData}
            disabled={isRefreshing}
            className="flex items-center gap-1 text-xs text-gray-300 hover:text-white px-2.5 py-1.5 rounded bg-gray-800 border border-gray-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 px-2.5 py-1.5 rounded bg-gray-800 border border-gray-700"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-6">

        {/* 4 Metric Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">API Keys</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{apiKeys.length}</h3>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Requests</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{metrics.totalRequests}</h3>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Rate Limit Hits</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{metrics.rateLimitHits}</h3>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Webhooks Sent</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{metrics.webhooksSent}</h3>
          </div>
        </section>

        {/* 2-Column Work Area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Left Column: API Keys Provisioning & Table */}
          <div className="space-y-6">

            {/* Provision Card */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <h2 className="text-sm font-bold text-gray-900 mb-1">Provision API Key</h2>
              <p className="text-xs text-gray-500 mb-4">Create a new key with custom rate limits</p>

              <form onSubmit={handleCreateKey} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Key Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mobile App"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs focus:outline-none focus:bg-white focus:border-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Rate Limit (req/min)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newKeyRpm}
                    onChange={(e) => setNewKeyRpm(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs focus:outline-none focus:bg-white focus:border-gray-900"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-gray-900 hover:bg-gray-800 text-white font-semibold text-xs rounded-lg transition"
                >
                  Create API Key
                </button>
              </form>

              {/* Newly Created Key Display */}
              {keyModalData && (
                <div className="mt-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                      Save Your Key
                    </span>
                    <button 
                      onClick={() => setKeyModalData(null)}
                      className="text-xs text-emerald-700 hover:text-emerald-900"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="text-xs font-mono font-bold text-emerald-700 select-all break-all flex-1">
                      {keyModalData.raw_api_key}
                    </code>
                    <button
                      onClick={() => copyToClipboard(keyModalData.raw_api_key)}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold"
                    >
                      {copySuccess || 'Copy'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Active Keys Table */}
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
                          onClick={() => setSelectedKey(k)}
                          className={`hover:bg-gray-50 cursor-pointer ${
                            selectedKey?.id === k.id ? 'bg-gray-50' : ''
                          }`}
                        >
                          <td className="px-3 py-2.5 font-medium text-gray-900">{k.name}</td>
                          <td className="px-3 py-2.5 font-mono text-gray-500">{k.id.slice(0, 8)}...</td>
                          <td className="px-3 py-2.5 font-mono text-gray-700">{k.rate_limit_rpm} req/m</td>
                          <td className="px-3 py-2.5 text-gray-400">{new Date(k.created_at).toLocaleDateString()}</td>
                          <td className="px-3 py-2.5">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeleteKey(k.id); }}
                              className="text-red-500 hover:text-red-700"
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

          {/* Right Column: Interactive Testers */}
          <div className="space-y-6">

            {/* Test Rate Limiter */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <h2 className="text-sm font-bold text-gray-900 mb-1">Test Rate Limiter</h2>
              <p className="text-xs text-gray-500 mb-4">Send requests through the reverse proxy to test limits</p>

              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  readOnly
                  value="GET /v1/proxy/get"
                  className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs font-mono text-gray-700"
                />
                <button
                  onClick={handleTestProxy}
                  disabled={proxyLoading}
                  className="px-4 py-2 bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white font-semibold text-xs rounded-lg transition whitespace-nowrap"
                >
                  {proxyLoading ? 'Sending...' : 'Send Request'}
                </button>
              </div>

              {proxyResponse && (
                <div className="p-3 bg-gray-900 rounded-lg font-mono text-xs text-white overflow-hidden">
                  <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-800">
                    <span className={`font-bold ${proxyResponse.status === 200 ? 'text-emerald-400' : 'text-red-400'}`}>
                      HTTP {proxyResponse.status}
                    </span>
                  </div>
                  <pre className="text-[11px] text-gray-300 overflow-x-auto max-h-36">
                    {JSON.stringify(proxyResponse.data, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Trigger Webhook */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <h2 className="text-sm font-bold text-gray-900 mb-1">Trigger Async Webhook</h2>
              <p className="text-xs text-gray-500 mb-4">Enqueue a webhook delivery task processed by Redis + ARQ</p>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Target URL</label>
                  <input
                    type="text"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://httpbin.org/post"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs font-mono focus:outline-none focus:bg-white focus:border-gray-900"
                  />
                </div>

                <button
                  onClick={handleDispatchWebhook}
                  disabled={webhookLoading}
                  className="w-full py-2 bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white font-semibold text-xs rounded-lg transition"
                >
                  {webhookLoading ? 'Enqueuing...' : 'Enqueue Webhook'}
                </button>
              </div>

              {webhookResponse && (
                <div className="mt-4 p-3 bg-gray-900 rounded-lg font-mono text-xs text-white overflow-hidden">
                  <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-800">
                    <span className="font-bold text-emerald-400">
                      HTTP {webhookResponse.status} (Task Enqueued)
                    </span>
                  </div>
                  <pre className="text-[11px] text-gray-300 overflow-x-auto max-h-36">
                    {JSON.stringify(webhookResponse.data, null, 2)}
                  </pre>
                </div>
              )}
            </div>

          </div>

        </div>

        {/* Bottom Panel: Recent Gateway Logs */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h2 className="text-sm font-bold text-gray-900 mb-1">Recent Gateway Logs</h2>
          <p className="text-xs text-gray-500 mb-4">Real-time log stream from reverse proxy and webhooks</p>

          <div className="w-full overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-left text-xs min-w-[550px]">
              <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] font-semibold border-b border-gray-200">
                <tr>
                  <th className="px-4 py-2.5">Time</th>
                  <th className="px-4 py-2.5">Key Name</th>
                  <th className="px-4 py-2.5">Endpoint</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5">Latency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white font-mono">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-6 text-center text-gray-400 font-sans">
                      No logs captured yet. Send a request to see live telemetry.
                    </td>
                  </tr>
                ) : (
                  logs.map((log, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-gray-400 text-[11px]">{log.timestamp}</td>
                      <td className="px-4 py-2 font-sans font-medium text-gray-800">{log.keyName}</td>
                      <td className="px-4 py-2 text-gray-600">{log.endpoint}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.status === 200 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-gray-500">{log.latency}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="w-full border-t border-gray-200 py-4 text-center text-xs text-gray-400 bg-white mt-auto">
        PulseGate • High-Performance API Gateway with Rate Limiting & Async Webhooks
      </footer>
    </div>
  );
}