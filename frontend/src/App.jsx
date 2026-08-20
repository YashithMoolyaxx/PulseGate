import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from './components/Sidebar';
import AuthModal from './components/AuthModal';
import MetricsCards from './components/MetricsCards';
import ApiKeyTable from './components/ApiKeyTable';
import ProxyTester from './components/ProxyTester';
import WebhookTester from './components/WebhookTester';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://pulsegate-29ys.onrender.com';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('pulsegate_token') || '');
  const [userEmail, setUserEmail] = useState(localStorage.getItem('pulsegate_email') || '');
  
  // App State
  const [apiKeys, setApiKeys] = useState([]);
  const [selectedKey, setSelectedKey] = useState(null);
  const [lastRawKey, setLastRawKey] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  // Metrics
  const [totalRequests, setTotalRequests] = useState(0);
  const [rateLimitHits, setRateLimitHits] = useState(0);
  const [webhooksSent, setWebhooksSent] = useState(0);
  const [logs, setLogs] = useState([]);

  // Auth Handler
  const handleAuthSuccess = (accessToken, email) => {
    setToken(accessToken);
    setUserEmail(email);
    localStorage.setItem('pulsegate_token', accessToken);
    localStorage.setItem('pulsegate_email', email);
  };

  const handleLogout = () => {
    setToken('');
    setUserEmail('');
    localStorage.removeItem('pulsegate_token');
    localStorage.removeItem('pulsegate_email');
  };

  // Fetch API Keys
  const fetchKeys = async () => {
    if (!token) return;
    setIsSyncing(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/v1/api-keys`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setApiKeys(res.data || []);
    } catch (err) {
      console.error('Failed to load keys:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchKeys();
    }
  }, [token]);

  // Handlers from components
  const handleKeyCreated = (keyData) => {
    setLastRawKey(keyData.raw_api_key);
    fetchKeys();
  };

  const handleKeyDeleted = () => {
    fetchKeys();
  };

  const handleLogGenerated = (logEntry) => {
    setTotalRequests((prev) => prev + 1);
    if (logEntry.isRateLimit) {
      setRateLimitHits((prev) => prev + 1);
    }
    setLogs((prev) => [logEntry, ...prev.slice(0, 9)]);
  };

  const handleWebhookDispatched = (logEntry) => {
    setWebhooksSent((prev) => prev + 1);
    setLogs((prev) => [logEntry, ...prev.slice(0, 9)]);
  };

  // Show Auth View if not logged in
  if (!token) {
    return (
      <AuthModal
        apiBaseUrl={API_BASE_URL}
        onAuthSuccess={handleAuthSuccess}
      />
    );
  }

  // Dashboard Layout
  return (
    <div className="min-h-screen bg-[#f3f4f6] text-gray-900 font-sans antialiased flex flex-col md:flex-row">
      <Sidebar
        userEmail={userEmail}
        onSync={fetchKeys}
        onLogout={handleLogout}
        isSyncing={isSyncing}
        apiBaseUrl={API_BASE_URL}
      />

      <main className="flex-1 p-4 sm:p-8 space-y-6 max-w-7xl overflow-x-hidden">
        {/* Metric Cards */}
        <MetricsCards
          apiKeysCount={apiKeys.length}
          totalRequests={totalRequests}
          rateLimitHits={rateLimitHits}
          webhooksSent={webhooksSent}
        />

        {/* Workspace 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ApiKeyTable
            apiBaseUrl={API_BASE_URL}
            token={token}
            apiKeys={apiKeys}
            onKeyCreated={handleKeyCreated}
            onKeyDeleted={handleKeyDeleted}
            selectedKey={selectedKey}
            onSelectKey={setSelectedKey}
          />

          <div className="space-y-6">
            <ProxyTester
              apiBaseUrl={API_BASE_URL}
              lastCreatedRawKey={lastRawKey}
              onLogGenerated={handleLogGenerated}
            />
            <WebhookTester
              apiBaseUrl={API_BASE_URL}
              lastCreatedRawKey={lastRawKey}
              onWebhookDispatched={handleWebhookDispatched}
            />
          </div>
        </div>

        {/* Live Logs Table */}
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
    </div>
  );
}