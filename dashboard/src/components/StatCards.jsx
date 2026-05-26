import React, { useState } from 'react';
import { ShieldAlert, ShieldCheck, Mail, Activity, X } from 'lucide-react';
import { fetchUrlHistory, fetchEmailHistory } from '../api';

const StatCards = ({ summary }) => {
  const [modalData, setModalData] = useState(null);
  const [modalTitle, setModalTitle] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!summary) return <div className="grid grid-cols-4 gap-4 animate-pulse h-32 bg-slate-800 rounded-xl"></div>;

  const handleCardClick = async (title) => {
    setModalTitle(title);
    setModalData([]);
    setIsLoading(true);
    
    try {
      let data = [];
      if (title === "URLs Scanned") {
        data = await fetchUrlHistory();
      } else if (title === "Phishing Blocked") {
        data = await fetchUrlHistory('phishing');
      } else if (title === "Suspicious Domains") {
        data = await fetchUrlHistory('suspicious');
      } else if (title === "Emails Scanned") {
        data = await fetchEmailHistory();
      }
      setModalData(data);
    } catch (error) {
      console.error("Failed to fetch history", error);
    } finally {
      setIsLoading(false);
    }
  };

  const cards = [
    {
      title: "URLs Scanned",
      value: summary.total_urls,
      icon: <Activity className="w-8 h-8 text-blue-400" />,
      bgColor: "bg-blue-400/10",
      borderColor: "border-blue-400/20"
    },
    {
      title: "Phishing Blocked",
      value: summary.phishing_blocked,
      icon: <ShieldAlert className="w-8 h-8 text-red-500" />,
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/20"
    },
    {
      title: "Suspicious Domains",
      value: summary.suspicious_domains,
      icon: <ShieldCheck className="w-8 h-8 text-yellow-400" />,
      bgColor: "bg-yellow-400/10",
      borderColor: "border-yellow-400/20"
    },
    {
      title: "Emails Scanned",
      value: summary.total_emails,
      icon: <Mail className="w-8 h-8 text-purple-400" />,
      bgColor: "bg-purple-400/10",
      borderColor: "border-purple-400/20"
    }
  ];

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {cards.map((card, index) => (
          <div 
            key={index} 
            onClick={() => handleCardClick(card.title)}
            className={`p-6 rounded-2xl border ${card.borderColor} ${card.bgColor} backdrop-blur-sm shadow-xl flex items-center justify-between transition-transform hover:scale-105 duration-300 cursor-pointer`}
          >
            <div>
              <p className="text-slate-400 text-sm font-medium mb-1">{card.title}</p>
              <h3 className="text-3xl font-bold text-white">{card.value}</h3>
            </div>
            <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
              {card.icon}
            </div>
          </div>
        ))}
      </div>

      {modalData !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-6 flex justify-between items-center border-b border-slate-800">
              <h2 className="text-xl font-bold text-white">{modalTitle} History</h2>
              <button onClick={() => setModalData(null)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-6">
              {isLoading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : modalData.length === 0 ? (
                <div className="text-center text-slate-500 py-10">No history found.</div>
              ) : (
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="text-xs text-slate-400 uppercase bg-slate-800/50">
                    <tr>
                      <th className="px-4 py-3 rounded-tl-lg">Target</th>
                      <th className="px-4 py-3">Classification</th>
                      <th className="px-4 py-3">Risk Score</th>
                      <th className="px-4 py-3 rounded-tr-lg">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modalData.map((item, i) => (
                      <tr key={i} className="border-b border-slate-800 hover:bg-slate-800/30">
                        <td className="px-4 py-3 max-w-[200px] truncate" title={item.url || `Email ID: ${item.id}`}>
                          {item.url || `Email Scan #${item.id}`}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
                            item.classification === 'phishing' 
                              ? 'bg-red-500/20 text-red-400' 
                              : item.classification === 'suspicious' 
                                ? 'bg-yellow-500/20 text-yellow-400' 
                                : 'bg-emerald-500/20 text-emerald-400'
                          }`}>
                            {item.classification}
                          </span>
                        </td>
                        <td className="px-4 py-3">{item.risk_score.toFixed(1)}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {new Date(item.timestamp + 'Z').toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default StatCards;
