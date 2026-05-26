import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Shield, Download, LogOut } from 'lucide-react';
import StatCards from './components/StatCards';
import ThreatChart from './components/ThreatChart';
import RecentAlerts from './components/RecentAlerts';
import Login from './components/Login';
import Signup from './components/Signup';
import { fetchSummary, fetchTrends, fetchRecentAlerts, fetchExtensionStatus } from './api';

function DownloadExtension({ isActive }) {
  const [showInstructions, setShowInstructions] = React.useState(!isActive);

  React.useEffect(() => {
    setShowInstructions(!isActive);
  }, [isActive]);

  return (
    <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 shadow-2xl backdrop-blur-md mb-8">
      <div className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-xl font-bold text-white">Browser Protection</h2>
            <div className="flex items-center">
              {isActive ? (
                <span className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  Extension Active
                </span>
              ) : (
                <span className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                  <span className="relative flex h-2 w-2">
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                  Not Connected
                </span>
              )}
            </div>
          </div>
          <p className="text-slate-400 text-sm max-w-2xl">
            {isActive 
              ? "Your browser is fully secured. The CyberShield AI extension is actively scanning URLs and DOM forms in real-time, preventing access to phishing domains."
              : "Install the CyberShield AI extension in your browser to enable real-time analysis, form spoofing alerts, and automated warning overlays."
            }
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <a
            href="/CyberShieldExtension.zip"
            download
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-2.5 px-5 rounded-xl transition-all duration-300 shadow-lg shadow-blue-500/10 text-sm cursor-pointer whitespace-nowrap"
          >
            <Download className="w-4 h-4" />
            Download Extension ZIP
          </a>
          <button
            onClick={() => setShowInstructions(!showInstructions)}
            className="flex items-center justify-center gap-2 border border-slate-700 hover:bg-slate-800 text-slate-300 font-semibold py-2.5 px-5 rounded-xl transition-all text-sm cursor-pointer whitespace-nowrap"
          >
            {showInstructions ? "Hide Guide" : "Show Setup Guide"}
          </button>
        </div>
      </div>

      {showInstructions && (
        <div className="mt-6 pt-6 border-t border-slate-700/50">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">How to Install:</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-850/50 flex flex-col gap-2">
              <div className="w-7 h-7 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-sm">1</div>
              <p className="text-xs font-semibold text-slate-300">Download ZIP</p>
              <p className="text-[11px] text-slate-500 leading-relaxed">Click the download button to retrieve the extension package archive.</p>
            </div>
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-850/50 flex flex-col gap-2">
              <div className="w-7 h-7 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-sm">2</div>
              <p className="text-xs font-semibold text-slate-300">Extract Archive</p>
              <p className="text-[11px] text-slate-500 leading-relaxed">Extract the `CyberShieldExtension.zip` file onto your local drive.</p>
            </div>
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-850/50 flex flex-col gap-2">
              <div className="w-7 h-7 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-sm">3</div>
              <p className="text-xs font-semibold text-slate-300">Open Extensions</p>
              <p className="text-[11px] text-slate-500 leading-relaxed">Navigate to <code className="bg-slate-950 px-1 py-0.5 rounded text-[10px] text-purple-400 font-mono">chrome://extensions/</code> in your browser.</p>
            </div>
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-850/50 flex flex-col gap-2">
              <div className="w-7 h-7 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-sm">4</div>
              <p className="text-xs font-semibold text-slate-300">Developer Mode</p>
              <p className="text-[11px] text-slate-500 leading-relaxed">Turn on the **Developer mode** toggle in the top-right corner of the page.</p>
            </div>
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-850/50 flex flex-col gap-2">
              <div className="w-7 h-7 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-sm">5</div>
              <p className="text-xs font-semibold text-slate-300">Load Unpacked</p>
              <p className="text-[11px] text-slate-500 leading-relaxed">Click **Load unpacked** and select the unzipped `extension` directory.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Dashboard({ setToken }) {
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState(null);
  const [alerts, setAlerts] = useState(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    window.postMessage({ type: 'CYBERSHIELD_LOGOUT' }, '*');
    navigate('/login');
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const [sumData, trendData, alertData, status] = await Promise.all([
          fetchSummary(),
          fetchTrends(),
          fetchRecentAlerts(),
          fetchExtensionStatus()
        ]);
        setSummary(sumData);
        setTrends(trendData);
        setAlerts(alertData);
        setIsActive(status);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
        if (err.message === 'Network response was not ok' || err.response?.status === 401) {
          handleLogout();
        } else {
          setError("Unable to connect to CyberShield AI API. Is the backend running?");
        }
      }
    };

    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#020817] text-slate-200 font-sans selection:bg-blue-500/30">
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 blur-[120px] rounded-full"></div>
      </div>

      <header className="border-b border-slate-800/50 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-lg shadow-lg shadow-blue-500/20">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              CyberShield AI <span className="font-light text-slate-500">SOC Dashboard</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {isActive ? (
              <span className="flex items-center gap-2 text-sm text-slate-400">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                System Active
              </span>
            ) : (
              <span className="flex items-center gap-2 text-sm text-red-400 font-medium">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                </span>
                System Inactive
              </span>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 ml-4 px-3 py-1.5 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6 flex items-center gap-3">
            <Shield className="w-5 h-5" />
            {error}
          </div>
        )}

        <StatCards summary={summary} />
        
        <DownloadExtension isActive={isActive} />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ThreatChart data={trends} />
          </div>
          <div>
            <RecentAlerts alerts={alerts} />
          </div>
        </div>
      </main>
    </div>
  );
}

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Listen for login/logout messages (just in case they happen in other tabs, though rare for extension dashboard sync)
  useEffect(() => {
    if (token) {
      window.postMessage({ type: 'CYBERSHIELD_LOGIN', token: token }, '*');
    }
  }, [token]);

  return (
    <Routes>
      <Route 
        path="/login" 
        element={token ? <Navigate to="/" /> : <Login setToken={setToken} />} 
      />
      <Route 
        path="/signup" 
        element={token ? <Navigate to="/" /> : <Signup />} 
      />
      <Route 
        path="/" 
        element={token ? <Dashboard setToken={setToken} /> : <Navigate to="/login" />} 
      />
    </Routes>
  );
}

export default App;
