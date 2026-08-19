import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import MetricsCards from './components/MetricsCards';
import ProxyTester from './components/ProxyTester';
import WebhookTester from './components/WebhookTester';
import AuthModal from './components/AuthModal';
import { Shield } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export default function App() {
  const [user, setUser] = useState(null);
  const [healthStatus, setHealthStatus] = useState(false);
  const [keysList, setKeysList] = useState([]);
  const [selectedKey, setSelectedKey] = useState(null);
  const [totalRequests, setTotalRequests] = useState(0);
  const [throttledCount, setThrottledCount] = useState(0);

  useEffect(() => {
    const savedUser = localStorage.getItem('pulsegate_user');
    const token = localStorage.getItem('pulsegate_token');
    if (savedUser && token) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const fetchDashboardData = useCallback(async () => {
    const token = localStorage.getItem('pulsegate_token');
    if (!token) return;

    try {
      // 1. Health Probe
      const healthRes = await fetch(`${API_BASE_URL}/v1/health`);
      setHealthStatus(healthRes.ok);

      // 2. Project Keys
      const keysRes = await fetch(`${API_BASE_URL}/v1/api-keys`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (keysRes.ok) {
        const keys = await keysRes.json();
        setKeysList(keys);
        if (keys.length > 0 && !selectedKey) {
          setSelectedKey(keys[0]);
        }
      }

      // 3. Live Prometheus Metrics
      const metricsRes = await fetch(`${API_BASE_URL}/metrics`);
      if (metricsRes.ok) {
        const metricsText = await metricsRes.text();
        
        let reqSum = 0;
        const reqMatches = metricsText.matchAll(/pulsegate_http_requests_total\{[^}]*endpoint="\/v1\/proxy[^"]*"[^}]*\}\s+([\d.]+)/g);
        for (const match of reqMatches) {
          reqSum += parseFloat(match[1]);
        }
        setTotalRequests(Math.round(reqSum));

        let rateLimitSum = 0;
        const rateLimitMatches = metricsText.matchAll(/pulsegate_rate_limit_exceeded_total\{[^}]*\}\s+([\d.]+)/g);
        for (const match of rateLimitMatches) {
          rateLimitSum += parseFloat(match[1]);
        }
        setThrottledCount(Math.round(rateLimitSum));
      }
    } catch {
      setHealthStatus(false);
    }
  }, [selectedKey]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
      const interval = setInterval(fetchDashboardData, 3000);
      return () => clearInterval(interval);
    }
  }, [user, fetchDashboardData]);

  const handleLogout = () => {
    localStorage.removeItem('pulsegate_token');
    localStorage.removeItem('pulsegate_user');
    setUser(null);
    setKeysList([]);
    setSelectedKey(null);
  };

  return (
    <div className="flex h-screen bg-[#f4f4f5] text-zinc-900 overflow-hidden font-sans">
      {!user && <AuthModal apiBaseUrl={API_BASE_URL} onAuthSuccess={(userData) => setUser(userData)} />}

      {user && (
        <>
          <Sidebar
            apiBaseUrl={API_BASE_URL}
            user={user}
            onLogout={handleLogout}
            keysList={keysList}
            selectedKey={selectedKey}
            onSelectKey={(k) => setSelectedKey(k)}
            onKeyCreated={(newKey) => {
              setSelectedKey(newKey);
              fetchDashboardData();
            }}
          />

          <main className="flex-1 overflow-y-auto p-8">
            <div className="flex items-center justify-between border-b border-zinc-200/90 pb-4 mb-6">
              <div>
                <div className="text-[11px] uppercase font-bold text-zinc-400 tracking-wider">Active Workspace</div>
                <h2 className="text-xl font-extrabold text-zinc-900 tracking-tight">
                  {selectedKey ? selectedKey.name : 'Select or Create a Project'}
                </h2>
              </div>
              {selectedKey && (
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2.5 py-1 bg-white border border-zinc-200/80 rounded-lg font-mono text-zinc-500 shadow-xs">
                    ID: {selectedKey.id.slice(0, 8)}...
                  </span>
                  <span className="text-xs px-2.5 py-1 bg-zinc-900 text-white rounded-lg font-medium flex items-center gap-1.5 shadow-xs">
                    <Shield className="w-3.5 h-3.5 text-blue-400" /> Quota: {selectedKey.rate_limit_rpm} RPM
                  </span>
                </div>
              )}
            </div>

            <MetricsCards
              healthStatus={healthStatus}
              activeKeysCount={keysList.length}
              totalRequests={totalRequests}
              throttledCount={throttledCount}
            />

            <ProxyTester
              apiBaseUrl={API_BASE_URL}
              defaultApiKey={selectedKey?.raw_api_key || ''}
              onProxyFired={fetchDashboardData}
            />

            <WebhookTester
              apiBaseUrl={API_BASE_URL}
              defaultApiKey={selectedKey?.raw_api_key || ''}
              onWebhookFired={fetchDashboardData}
            />
          </main>
        </>
      )}
    </div>
  );
}