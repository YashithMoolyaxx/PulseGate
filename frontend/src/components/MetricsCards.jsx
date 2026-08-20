import React from 'react';

export default function MetricsCards({ 
  apiKeysCount = 0, 
  totalRequests = 0, 
  rateLimitHits = 0, 
  webhooksSent = 0 
}) {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">API Keys</p>
        <h3 className="text-2xl font-bold text-gray-900 mt-1">{apiKeysCount}</h3>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Requests</p>
        <h3 className="text-2xl font-bold text-gray-900 mt-1">{totalRequests}</h3>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Rate Limit Hits</p>
        <h3 className="text-2xl font-bold text-gray-900 mt-1">{rateLimitHits}</h3>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Webhooks Sent</p>
        <h3 className="text-2xl font-bold text-gray-900 mt-1">{webhooksSent}</h3>
      </div>
    </section>
  );
}