import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';
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
  
  // Real API Keys State (Only holds real keys from backend)
  const [apiKeys, setApiKeys] = useState([]);
  const [selectedKey, setSelectedKey] = useState(null);
  const [rawKeysMap, setRawKeysMap] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('pulsegate_raw_keys')) || {};
    } catch {
      return {};
    }
  });
  const [isSyncing, setIsSyncing] = useState(false);

  // Toast Notification State
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Metrics & Logs State
  const [totalRequests, setTotalRequests] = useState(0);
  const [rateLimitHits, setRateLimitHits] = useState(0);
  const [webhooksSent, setWebhooksSent] = useState(0);
  const [logs, setLogs] = useState([]);

  // Toast Trigger Helper
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 3500);
  };

  // Auth Handlers
  const handleAuthSuccess = (accessToken, email) => {
    setToken(accessToken);
    setUserEmail(email);
    localStorage.setItem('pulsegate_token', accessToken);
    localStorage.setItem('pulsegate_email', email);
    showToast(`Welcome back, ${email}!`, 'success');
  };

  const handleLogout = () => {
    setToken('');
    setUserEmail('');
    setApiKeys([]);
    setSelectedKey(null);
    localStorage.removeItem('pulsegate_token');
    localStorage.removeItem('pulsegate_email');
    showToast('Signed out successfully.', 'success');
  };

  // Save Raw Key Secret to Local Storage
  const saveRawKey = (keyId, rawKey) => {
    if (!keyId || !rawKey) return;
    const updated = { ...rawKeysMap, [keyId]: rawKey };
    setRawKeysMap(updated);
    localStorage.setItem('pulsegate_raw_keys', JSON.stringify(updated));
  };

  // Fetch API Keys from Backend
  const fetchKeys = async () => {
    if (!token) return;
    setIsSyncing(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/v1/api-keys`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const fetchedKeys = res.data || [];
      setApiKeys(fetchedKeys);
      
      // Auto-select first key if none currently selected
      if (fetchedKeys.length > 0 && !selectedKey) {
        setSelectedKey(fetchedKeys[0]);
      } else if (fetchedKeys.length === 0) {
        setSelectedKey(null);
      }
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

  // Key Created Handler
  const handleKeyCreated = (keyData) => {
    saveRawKey(keyData.id, keyData.raw_api_key);
    fetchKeys();
    setSelectedKey(keyData);
    showToast(`API Key "${keyData.name}" created successfully!`, 'success');
  };

  // Delete API Key Handler (Calls backend DELETE and clears cache)
  const handleDeleteKey = async (keyId, keyName) => {
    if (!confirm(`Are you sure you want to revoke API key "${keyName || 'this key'}"?`)) {
      return;
    }

    try {
      await axios.delete(`${API_BASE_URL}/v1/api-keys/${keyId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update local keys list immediately
      const remainingKeys = apiKeys.filter((k) => k.id !== keyId);
      setApiKeys(remainingKeys);

      // Clean up cached raw key in local storage
      const updatedRawMap = { ...rawKeysMap };
      delete updatedRawMap[keyId];
      setRawKeysMap(updatedRawMap);
      localStorage.setItem('pulsegate_raw_keys', JSON.stringify(updatedRawMap));

      // Handle active key selection fallback
      if (selectedKey?.id === keyId) {
        setSelectedKey(remainingKeys.length > 0 ? remainingKeys[0] : null);
      }

      showToast(`API Key "${keyName || 'Key'}" deleted successfully.`, 'success');
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to delete API key', 'error');
    }
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

  // Active raw key for the selected key
  const activeRawKey = selectedKey ? (rawKeysMap[selectedKey.id] || '') : '';

  // Auth Screen
  if (!token) {
    return (
      <AuthModal
        apiBaseUrl={API_BASE_URL}
        onAuthSuccess={handleAuthSuccess}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f3f4f6] text-gray-900 font-sans antialiased flex flex-col md:flex-row relative">
      
      {/* Toast Notification Banner */}
      {toast.show && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border bg-white animate-in slide-in-from-top-2 duration-200">
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span className="text-xs font-semibold text-gray-800">{toast.message}</span>
          <button 
            onClick={() => setToast({ show: false, message: '', type: 'success' })}
            className="ml-2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Sidebar with Key Switching & Delete Action */}
      <Sidebar
        userEmail={userEmail}
        apiKeys={apiKeys}
        selectedKey={selectedKey}
        onSelectKey={setSelectedKey}
        onDeleteKey={handleDeleteKey}
        onSync={fetchKeys}
        onLogout={handleLogout}
        isSyncing={isSyncing}
        apiBaseUrl={API_BASE_URL}
      />

      {/* Main Workspace */}
      <main className="flex-1 p-4 sm:p-8 space-y-6 max-w-7xl overflow-x-hidden">
        <MetricsCards
          apiKeysCount={apiKeys.length}
          totalRequests={totalRequests}
          rateLimitHits={rateLimitHits}
          webhooksSent={webhooksSent}
        />

        {/* 2-Column Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ApiKeyTable
            apiBaseUrl={API_BASE_URL}
            token={token}
            apiKeys={apiKeys}
            selectedKey={selectedKey}
            onSelectKey={setSelectedKey}
            onKeyCreated={handleKeyCreated}
            onDeleteKey={handleDeleteKey}
          />

          <div className="space-y-6">
            <ProxyTester
              apiBaseUrl={API_BASE_URL}
              selectedKey={selectedKey}
              rawKey={activeRawKey}
              onSaveRawKey={saveRawKey}
              onLogGenerated={handleLogGenerated}
            />
            <WebhookTester
              apiBaseUrl={API_BASE_URL}
              selectedKey={selectedKey}
              rawKey={activeRawKey}
              onSaveRawKey={saveRawKey}
              onWebhookDispatched={handleWebhookDispatched}
            />
          </div>
        </div>

        {/* Live Logs Table */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h2 className="text-sm font-bold text-gray-900 mb-1">Recent Gateway Logs</h2>
          <p className="text-xs text-gray-500 mb-4">Real-time telemetry stream from reverse proxy and webhooks</p>

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
                      No logs captured yet. Fire a request to stream live telemetry.
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