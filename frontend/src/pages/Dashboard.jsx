import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, AlertOctagon, CheckCircle2, Shield, Activity, X, BarChart3, Fingerprint, Volume2, ChevronRight, Zap, AlertTriangle } from 'lucide-react';
import { io } from "socket.io-client";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

// Mock API functions (replace with your actual API)
const uploadFile = async (formData) => {
  const response = await fetch('http://localhost:5000/api/upload', {
    method: 'POST',
    body: formData
  });
  return response.json();
};

const getReports = async () => {
  const response = await fetch('http://localhost:5000/api/reports');
  return { data: await response.json() };
};

// --- Glass UI Components ---
const GlassCard = ({ children, className = "", delay = 0 }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay: delay, ease: "easeOut" }}
    className={`relative overflow-hidden backdrop-blur-xl bg-slate-900/60 border border-white/10 shadow-2xl rounded-3xl ${className}`}
  >
    {children}
  </motion.div>
);

const NeonBadge = ({ active }) => (
  <div className={`flex items-center gap-2 px-3 py-1 rounded-full border backdrop-blur-md ${
    active 
      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]' 
      : 'bg-red-500/10 border-red-500/30 text-red-400'
  }`}>
    <div className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
    <span className="text-[10px] font-bold tracking-widest uppercase">
      {active ? 'Neural Engine Online' : 'System Offline'}
    </span>
  </div>
);

// --- MAIN DASHBOARD ---
const Dashboard = () => {
  const [reports, setReports] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [systemStatus, setSystemStatus] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  // --- DATA FETCHING ---
  const fetchReports = async () => {
    try {
      const { data } = await getReports();
      setReports(data);
      setSystemStatus(true);
    } catch (err) {
      console.error("Fetch error:", err);
      setSystemStatus(false);
    }
  };

  // --- SOCKET CONNECTION ---
  useEffect(() => {
    fetchReports();

    const socket = io("http://localhost:5000", {
      transports: ['websocket'],
      reconnection: true
    });
    
    socket.on("connect", () => {
      console.log("⚡ Live Stream Connected");
      setSystemStatus(true);
    });

    socket.on("report_update", (data) => {
      console.log("📥 Real-time Update:", data);
      fetchReports(); 
    });

    socket.on("disconnect", () => {
      console.log("❌ Stream Disconnected");
      setSystemStatus(false);
    });

    return () => socket.disconnect();
  }, []);

  // --- LIVE MODAL SYNC ---
  useEffect(() => {
    if (selectedReport) {
      const updatedData = reports.find(r => r._id === selectedReport._id);
      if (updatedData && JSON.stringify(updatedData) !== JSON.stringify(selectedReport)) {
        console.log("🔄 Modal data refreshed");
        setSelectedReport(updatedData);
      }
    }
  }, [reports, selectedReport]);
  
  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('case_id', `CS-${Math.floor(Math.random() * 9000) + 1000}`);

    try {
      await uploadFile(formData);
      setSelectedFile(null);
      setTimeout(fetchReports, 800);
    } catch (err) {
      alert("Upload Failed: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans selection:bg-cyan-500/30">
      {/* Background Effects */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-6 lg:p-10">
        
        {/* --- HEADER --- */}
        <header className="flex justify-between items-end mb-12">
          <div>
            <h1 className="text-6xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-slate-400">
              Veritas
            </h1>
            <p className="text-cyan-200/50 text-sm flex items-center gap-2 mt-2 font-mono uppercase tracking-wider">
              <Shield size={14} />
              Forensic Intelligence Stream v2.1
            </p>
          </div>
          <NeonBadge active={systemStatus} />
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* --- LEFT: UPLOAD STATION --- */}
          <div className="lg:col-span-4 space-y-6">
            <GlassCard className="p-8 h-full">
              <div className="flex items-center gap-3 mb-8 text-cyan-400">
                <Activity size={20} />
                <h2 className="text-sm font-bold uppercase tracking-widest">Evidence Ingestion</h2>
              </div>

              <div className="relative group">
                <input type="file" onChange={(e) => setSelectedFile(e.target.files[0])} className="hidden" id="file" />
                <label 
                  htmlFor="file" 
                  className={`flex flex-col items-center justify-center h-64 border border-dashed rounded-2xl cursor-pointer transition-all duration-300
                    ${selectedFile 
                      ? 'border-cyan-500/50 bg-cyan-500/5' 
                      : 'border-white/10 hover:border-white/30 hover:bg-white/5'}
                  `}
                >
                  <div className={`p-4 rounded-full mb-4 transition-all duration-500 ${selectedFile ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30' : 'bg-white/5 text-white/30'}`}>
                    {selectedFile ? <FileText size={32} /> : <Upload size={32} />}
                  </div>
                  <span className="text-xs font-bold text-white/50 uppercase tracking-widest">
                    {selectedFile ? selectedFile.name : "Drop Logs Here"}
                  </span>
                </label>
              </div>

              <button
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                className="w-full mt-6 py-4 rounded-xl font-bold text-xs uppercase tracking-widest transition-all duration-300
                  bg-cyan-600 hover:bg-cyan-500 text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-900/20"
              >
                {uploading ? "Encrypting & Uploading..." : "Initiate Analysis"}
              </button>
            </GlassCard>
          </div>

          {/* --- RIGHT: LIVE FEED --- */}
          <div className="lg:col-span-8">
            <GlassCard className="h-[600px] flex flex-col">
              <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                <h2 className="text-xs font-bold text-white/50 uppercase tracking-widest">Live Case Feed</h2>
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_emerald]" />
              </div>

              <div className="p-6 overflow-y-auto space-y-3 flex-1" style={{
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(148, 163, 184, 0.3) transparent'
              }}>
                {reports.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-slate-500 text-sm">Waiting for evidence...</p>
                  </div>
                ) : (
                  reports.map((report, i) => {
                    const isCritical = report.risk_score > 50;
                    const isProcessing = report.status === "PROCESSING";
                    
                    return (
                      <motion.div
                        key={report._id || i}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        onClick={() => setSelectedReport(report)}
                        className={`group relative p-5 rounded-xl border cursor-pointer transition-all duration-300 hover:scale-[1.02]
                          ${isCritical 
                            ? 'bg-red-500/5 border-red-500/30 hover:border-red-500/60 hover:shadow-lg hover:shadow-red-500/10' 
                            : 'bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/50'}
                          ${isProcessing ? 'animate-pulse' : ''}
                        `}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-lg ${isCritical ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                              {isCritical ? <AlertOctagon size={22} /> : <CheckCircle2 size={22} />}
                            </div>
                            <div>
                              <h3 className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">
                                {report.file_name}
                              </h3>
                              <div className="flex items-center gap-3 mt-1.5">
                                <span className="text-[10px] font-mono text-slate-500">{report.case_id}</span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${isCritical ? 'bg-red-500/30 text-red-200' : 'bg-emerald-500/30 text-emerald-200'}`}>
                                  RISK: {report.risk_score}%
                                </span>
                                {report.attack_type && (
                                  <span className="text-[9px] text-slate-400 uppercase tracking-wider">
                                    {report.attack_type}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            {report.audio_url && (
                              <div className="p-2 rounded-full bg-cyan-500/20 text-cyan-400">
                                <Volume2 size={16} />
                              </div>
                            )}
                            <span className={`text-[10px] font-bold tracking-wider uppercase ${report.status === 'COMPLETED' ? 'text-white/40' : 'text-yellow-400'}`}>
                              {report.status}
                            </span>
                            <ChevronRight size={16} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </GlassCard>
          </div>
        </div>
      </div>

      {/* --- MODAL: DETAILED ANALYSIS --- */}
      <AnimatePresence>
        {selectedReport && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedReport(null);
            }}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0f172a] border border-white/10 w-full max-w-5xl h-[85vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">Case Analysis: {selectedReport.case_id}</h2>
                  <p className="text-xs text-slate-400 font-mono mt-1">{selectedReport.file_name}</p>
                </div>
                <button 
                  onClick={() => setSelectedReport(null)} 
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-8" style={{
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(148, 163, 184, 0.3) transparent'
              }}>
                
                {/* Top Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  
                  {/* Risk Meter */}
                  <div className="flex items-center justify-center p-6 rounded-2xl bg-white/5 border border-white/5 relative overflow-hidden">
                    <div className="text-center z-10">
                      <div className={`text-6xl font-black mb-2 ${selectedReport.risk_score > 50 ? 'text-red-500' : 'text-emerald-500'}`}>
                        {selectedReport.risk_score}
                      </div>
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">Threat Score</div>
                    </div>
                    <div className={`absolute inset-0 opacity-20 blur-3xl ${selectedReport.risk_score > 50 ? 'bg-red-600' : 'bg-emerald-600'}`} />
                  </div>

                  {/* Attack Type */}
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/5 flex flex-col justify-center">
                    <div className="flex items-center gap-2 text-cyan-400 mb-3">
                      <AlertTriangle size={18} />
                      <span className="text-xs font-bold uppercase tracking-widest">Attack Vector</span>
                    </div>
                    <p className="text-2xl font-bold text-white mb-1">
                      {selectedReport.attack_type || "Analyzing..."}
                    </p>
                    {selectedReport.confidence && (
                      <p className="text-xs text-slate-500">
                        Confidence: {selectedReport.confidence}%
                      </p>
                    )}
                  </div>

                  {/* Anomalies */}
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/5 flex flex-col justify-center">
                    <div className="flex items-center gap-2 text-orange-400 mb-3">
                      <Zap size={18} />
                      <span className="text-xs font-bold uppercase tracking-widest">Anomalies</span>
                    </div>
                    <p className="text-4xl font-black text-white">
                      {selectedReport.anomalies_found || 0}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Behavioral deviations
                    </p>
                  </div>
                </div>

                {/* AI Verdict Panel */}
                <div className="p-6 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 mb-8">
                  <div className="flex items-center gap-3 text-cyan-400 mb-4">
                    <Fingerprint size={20} />
                    <h3 className="text-sm font-bold uppercase tracking-widest">AI Intelligence Report</h3>
                  </div>
                  <p className="text-base leading-relaxed text-slate-200 mb-4">
                    {selectedReport.ai_summary || "Analysis in progress..."}
                  </p>
                  
                  {selectedReport.recommended_action && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <p className="text-xs text-slate-500 uppercase tracking-widest mb-2">Recommended Action</p>
                      <p className="text-sm text-yellow-300 font-semibold">
                        ⚡ {selectedReport.recommended_action}
                      </p>
                    </div>
                  )}

                  {/* Audio Player */}
                  {selectedReport.audio_url && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-slate-500 uppercase tracking-widest">Voice Briefing</p>
                        <Volume2 size={14} className="text-cyan-400" />
                      </div>
                      <audio 
                        controls 
                        className="w-full h-10 rounded-lg"
                        style={{
                          filter: 'brightness(0.8) contrast(1.2)'
                        }}
                      >
                        <source src={`http://localhost:5000/api/evidence/${selectedReport.audio_url}`} type="audio/mpeg" />
                      </audio>
                    </div>
                  )}
                </div>

                {/* Timeline Graph */}
                {selectedReport.plot_data && selectedReport.plot_data.length > 0 && (
                  <div className="h-72 w-full p-6 rounded-2xl bg-white/5 border border-white/5">
                    <div className="flex items-center gap-2 mb-4 text-slate-400">
                      <BarChart3 size={18} />
                      <span className="text-xs font-bold uppercase tracking-widest">Risk Timeline Analysis</span>
                    </div>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={selectedReport.plot_data}>
                        <defs>
                          <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis 
                          dataKey="line" 
                          stroke="#64748b" 
                          tick={{ fontSize: 11 }}
                          label={{ value: 'Log Line', position: 'insideBottom', offset: -5, fill: '#64748b' }}
                        />
                        <YAxis 
                          stroke="#64748b" 
                          tick={{ fontSize: 11 }}
                          label={{ value: 'Risk Level', angle: -90, position: 'insideLeft', fill: '#64748b' }}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#0f172a', 
                            borderColor: '#334155',
                            borderRadius: '8px'
                          }}
                          itemStyle={{ color: '#cbd5e1' }}
                          labelStyle={{ color: '#94a3b8' }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="risk" 
                          stroke="#ef4444" 
                          strokeWidth={2}
                          fillOpacity={1} 
                          fill="url(#colorRisk)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;