import React from 'react';
import { AlertTriangle, Globe } from 'lucide-react';

const RecentAlerts = ({ alerts }) => {
  if (!alerts) return <div className="bg-slate-800/40 rounded-2xl h-96 animate-pulse"></div>;

  return (
    <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 shadow-2xl backdrop-blur-md h-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <AlertTriangle className="text-red-500 w-5 h-5" />
            Recent Threats
          </h2>
          <p className="text-slate-400 text-sm">Latest intercepted malicious activity</p>
        </div>
      </div>
      
      <div className="overflow-hidden">
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500">
            <Globe className="w-12 h-12 mb-3 opacity-20" />
            <p>No recent threats detected</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {alerts.map((alert) => (
              <li key={alert.id} className="p-4 rounded-xl bg-slate-800 border border-slate-700/50 hover:bg-slate-700/50 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-medium text-white truncate pr-4 max-w-[70%]">
                    {alert.url.replace(/^https?:\/\//, '').split('/')[0]}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-md font-bold uppercase tracking-wider ${
                    alert.classification === 'phishing' 
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                      : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                  }`}>
                    {alert.classification}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-400">
                  <span>Risk Score: <span className={alert.risk_score > 60 ? "text-red-400 font-bold" : "text-yellow-400 font-bold"}>{alert.risk_score.toFixed(1)}</span></span>
                  <span>{new Date(alert.timestamp + 'Z').toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default RecentAlerts;
