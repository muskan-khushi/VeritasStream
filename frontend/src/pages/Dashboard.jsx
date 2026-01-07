import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, AlertOctagon, CheckCircle2, Zap, Shield, Activity, X, BarChart3, Fingerprint, Volume2, ChevronRight, Terminal, Play, AlertTriangle } from 'lucide-react';
import { io } from "socket.io-client";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// --- API HELPERS ---
const uploadFile = async (formData) => {
  const response = await fetch('http://localhost:5000/api/upload', {
    method: 'POST',
    body: formData
  });
  return response.json();
};

const getReports = async () => {
  const response = await fetch('http://localhost:5000/api/reports');
  const data = await response.json();
  return { data }; // Normalize to match your old structure
};

// --- COMPONENT: GLASS CARD ---
const GlassCard = ({ children, className = "", delay = 0 }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay: delay, ease: "easeOut" }}
    className={`relative overflow-hidden backdrop-blur-xl bg-slate-900/80 border border-white/10 shadow-2xl rounded-3xl ${className}`}
  >
    {children}
  </motion.div>
);

// --- COMPONENT: STATUS BADGE ---
const NeonBadge = ({ active }) => (
  <div className={`flex items-center gap-2 px-3 py-1 rounded-full border backdrop-blur-md transition-all duration-500 ${
    active 
      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]' 
      : 'bg-red-500/10 border-red-500/30 text-red-400'
  }`}>
    <div className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
    <span className="text-[10px] font-bold tracking-widest uppercase">
      {active ? 'Neural Engine Online' : 'System Offline'}
    </span>
  </div>
);

// --- COMPONENT: CYBERPUNK PROGRESS BAR ---
const AnalysisProgress = () => {
  const [step, setStep] = useState(0);
  const steps = [
    "Ingesting Stream...",
    "Extracting Features...",
    "Running Isolation Forest...",
    "Matching Signatures...",
    "Synthesizing Voice..."
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => (prev < steps.length - 1 ? prev + 1 : 0));
    }, 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full space-y-1.5">
      <div className="flex justify-between text-[9px] uppercase tracking-widest text-cyan-400 font-mono">
        <span>Processing</span>
        <span>{steps[step]}</span>
      </div>
      <div className="h-1 bg-white/10 rounded-full overflow-hidden">
        <motion.div 
          initial={{ x: "-100%" }}
          animate={{ x: "100%" }}
          transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
          className="h-full w-1/2 bg-cyan-500 blur-[1px]"
        />
      </div>
    </div>
  );
};

// --- MAIN DASHBOARD ---
const Dashboard = () => {
  const [reports, setReports] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [systemStatus, setSystemStatus] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  // --- 1. ROBUST DATA FETCHING ---
  const fetchReports = async () => {
    try {
      const { data } = await getReports();
      // Sort by newest first
      const sorted = Array.isArray(data) ? data.sort((a, b) => new Date(b.upload_timestamp) - new Date(a.upload_timestamp)) : [];
      setReports(sorted);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  // --- 2. SOCKETS + AUTO-POLLING (The Fix) ---
  useEffect(() => {
    fetchReports(); // Initial load

    // A. Connect to Socket (Instant updates)
    const socket = io("http://localhost:5000", { transports: ['websocket'] });
    
    socket.on("connect", () => {
      console.log("⚡ Live Stream Connected");
      setSystemStatus(true);
    });

    socket.on("report_update", () => {
      console.log("📥 Socket Triggered Refresh");
      fetchReports(); 
    });

    socket.on("disconnect", () => setSystemStatus(false));

    // B. Auto-Poll (Backup for Python Worker latency)
    const pollInterval = setInterval(fetchReports, 2000); // Check every 2s

    return () => {
      socket.disconnect();
      clearInterval(pollInterval);
    };
  }, []);

  // --- 3. LIVE MODAL SYNC ---
  // If the modal is open, force it to update when the background data changes
  useEffect(() => {
    if (selectedReport) {
      const updatedData = reports.find(r => r._id === selectedReport._id);
      if (updatedData) {
        // Only update if something meaningful changed
        if (updatedData.status !== selectedReport.status || 
            updatedData.risk_score !== selectedReport.risk_score) {
          setSelectedReport(updatedData);
        }
      }
    }
  }, [reports]); // Run whenever 'reports' list updates

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('case_id', `CS-${Math.floor(Math.random() * 9000) + 1000}`);

    try {
      await uploadFile(formData);
      setSelectedFile(null);
      fetchReports(); // Instant optimistic update
    } catch (err) {
      alert("Upload Failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans selection:bg-cyan-500/30 overflow-hidden">
      
      {/* Background FX */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-6 lg:p-10">
        
        {/* Header */}
        <header className="flex justify-between items-end mb-12">
          <div>
            <h1 className="text-6xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-slate-400">
              Veritas
            </h1>
            <p className="text-cyan-200/50 text-sm flex items-center gap-2 mt-2 font-mono uppercase tracking-wider">
              <Shield size={14} /> Forensic Intelligence Stream v3.0
            </p>
          </div>
          <NeonBadge active={systemStatus} />
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT: Upload */}
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
                      ? 'border-cyan-500/50 bg-cyan-500/5 shadow-[inset_0_0_20px_rgba(6,182,212,0.1)]' 
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
                {uploading ? (
                  <span className="flex items-center justify-center gap-2">
                     <Zap size={14} className="animate-spin" /> Encrypting...
                  </span>
                ) : "Initiate Analysis"}
              </button>
            </GlassCard>
          </div>

          {/* RIGHT: Live Feed */}
          <div className="lg:col-span-8">
            <GlassCard className="h-[600px] flex flex-col">
              <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Live Case Feed</h2>
                <div className="flex items-center gap-2">
                   <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_emerald]" />
                   <span className="text-[9px] text-emerald-500/50 font-mono">WS_CONNECTED</span>
                </div>
              </div>

              <div className="p-6 overflow-y-auto space-y-3 custom-scrollbar flex-1">
                {reports.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-600">
                     <Terminal size={48} className="mb-4 opacity-20" />
                     <p className="text-sm">Awaiting neural input stream...</p>
                  </div>
                ) : (
                  reports.map((report, i) => {
                    const isProcessing = report.status === 'PROCESSING' || report.status === 'PENDING';
                    const isRisk = report.risk_score > 50;
                    
                    return (
                      <motion.div
                        key={report._id || i}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        onClick={() => setSelectedReport(report)}
                        className={`relative p-5 rounded-xl border cursor-pointer transition-all duration-300 hover:scale-[1.01]
                          ${isRisk 
                            ? 'bg-red-500/5 border-red-500/20 hover:border-red-500/40' 
                            : 'bg-slate-800/40 border-white/5 hover:border-cyan-500/30'}
                        `}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4 flex-1">
                            {/* Icon Logic */}
                            {isProcessing ? (
                               <div className="p-3 rounded-lg bg-yellow-500/10 text-yellow-400 animate-pulse"><Zap size={20} /></div>
                            ) : isRisk ? (
                               <div className="p-3 rounded-lg bg-red-500/10 text-red-400"><AlertOctagon size={20} /></div>
                            ) : (
                               <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-400"><CheckCircle2 size={20} /></div>
                            )}
                            
                            <div className="flex-1">
                              <h3 className="text-sm font-bold text-slate-200">{report.file_name}</h3>
                              <div className="flex items-center gap-3 mt-1.5">
                                <span className="text-[10px] font-mono text-slate-500">{report.case_id}</span>
                                {!isProcessing && (
                                  <>
                                    <span className={`text-[10px] font-bold px-1.5 rounded ${isRisk ? 'bg-red-500/20 text-red-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                                      RISK: {report.risk_score}%
                                    </span>
                                    {report.attack_type && (
                                      <span className="text-[9px] text-slate-400 uppercase tracking-wider truncate max-w-[150px]">
                                        {report.attack_type}
                                      </span>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Status / Progress */}
                          <div className="w-1/3 min-w-[140px] text-right">
                            {isProcessing ? (
                              <AnalysisProgress />
                            ) : (
                              <div className="flex items-center justify-end gap-2">
                                {report.audio_url && <Volume2 size={14} className="text-cyan-400" />}
                                <span className={`text-[10px] font-bold tracking-wider uppercase ${report.status === 'FAILED' ? 'text-red-400' : 'text-slate-500'}`}>
                                  {report.status}
                                </span>
                                <ChevronRight size={14} className="text-slate-700" />
                              </div>
                            )}
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

      {/* --- MODAL --- */}
      <AnimatePresence>
        {selectedReport && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={(e) => e.target === e.currentTarget && setSelectedReport(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0f172a] border border-white/10 w-full max-w-5xl max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-3">
                    {selectedReport.case_id}
                    <span className="px-2 py-1 rounded-md bg-white/10 text-xs font-normal text-slate-400">{selectedReport.file_name}</span>
                  </h2>
                </div>
                <button onClick={() => setSelectedReport(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                {selectedReport.status === 'PROCESSING' || selectedReport.status === 'PENDING' ? (
                   <div className="h-full flex flex-col items-center justify-center space-y-8">
                      <div className="w-full max-w-md"><AnalysisProgress /></div>
                      <p className="text-slate-500 animate-pulse text-sm">Waiting for Neural Engine...</p>
                   </div>
                ) : (
                  <div className="space-y-8">
                    {/* Top Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Risk Score */}
                      <div className="p-6 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center justify-center relative overflow-hidden">
                        <div className={`text-6xl font-black ${selectedReport.risk_score > 50 ? 'text-red-500' : 'text-emerald-500'}`}>
                          {selectedReport.risk_score}
                        </div>
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mt-2">Threat Score</div>
                        <div className={`absolute inset-0 opacity-10 blur-3xl ${selectedReport.risk_score > 50 ? 'bg-red-600' : 'bg-emerald-600'}`} />
                      </div>

                      {/* Attack Type */}
                      <div className="p-6 rounded-2xl bg-white/5 border border-white/5 flex flex-col justify-center">
                         <div className="flex items-center gap-2 text-cyan-400 mb-2">
                            <AlertTriangle size={18} />
                            <span className="text-xs font-bold uppercase tracking-widest">Attack Vector</span>
                         </div>
                         <div className="text-xl font-bold text-white">{selectedReport.attack_type}</div>
                         <div className="text-sm text-slate-500 mt-1">Confidence: {selectedReport.confidence || 0}%</div>
                      </div>

                      {/* Anomalies */}
                      <div className="p-6 rounded-2xl bg-white/5 border border-white/5 flex flex-col justify-center">
                         <div className="flex items-center gap-2 text-amber-400 mb-2">
                            <Fingerprint size={18} />
                            <span className="text-xs font-bold uppercase tracking-widest">Behavioral Events</span>
                         </div>
                         <div className="text-4xl font-black text-white">{selectedReport.anomalies_found}</div>
                         <div className="text-sm text-slate-500 mt-1">Deviations from baseline</div>
                      </div>
                    </div>

                    {/* AI Narrative & Graph */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       {/* Left: Narrative */}
                       <div className="p-6 rounded-2xl bg-gradient-to-br from-white/5 to-transparent border border-white/5">
                          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                             <Terminal size={14} /> AI Forensic Report
                          </h3>
                          <p className="text-sm leading-relaxed text-slate-300">
                            {selectedReport.ai_summary}
                          </p>
                          {selectedReport.recommended_action && (
                            <div className="mt-6 pt-4 border-t border-white/10">
                              <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Recommended Action</p>
                              <p className="text-sm font-semibold text-yellow-300">⚡ {selectedReport.recommended_action}</p>
                            </div>
                          )}
                       </div>

                       {/* Right: Audio & Graph */}
                       <div className="space-y-6">
                          {selectedReport.audio_url && (
                            <div className="p-5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
                               <div className="flex items-center justify-between mb-4">
                                  <span className="text-xs font-bold text-indigo-300 uppercase tracking-widest flex items-center gap-2">
                                     <Play size={14} /> Voice Briefing
                                  </span>
                                  <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-500/20 text-indigo-300 font-mono">EN-UK</span>
                               </div>
                               <audio controls className="w-full h-8 opacity-90 hover:opacity-100 transition-opacity" src={`http://localhost:5000/api/evidence/${selectedReport.audio_url}`} />
                            </div>
                          )}

                          {selectedReport.plot_data && (
                            <div className="h-48 rounded-2xl bg-white/5 border border-white/5 p-4 relative">
                               <ResponsiveContainer width="100%" height="100%">
                                  <AreaChart data={selectedReport.plot_data}>
                                    <defs>
                                      <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                      </linearGradient>
                                    </defs>
                                    <XAxis dataKey="line" hide />
                                    <Tooltip 
                                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }}
                                      itemStyle={{ color: '#cbd5e1' }}
                                    />
                                    <Area type="monotone" dataKey="risk" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorRisk)" />
                                  </AreaChart>
                               </ResponsiveContainer>
                               <div className="absolute top-3 left-4 text-[10px] font-bold text-slate-600 uppercase tracking-widest">Anomaly Timeline</div>
                            </div>
                          )}
                       </div>
                    </div>
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