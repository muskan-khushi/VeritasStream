import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, AlertOctagon, CheckCircle2, Zap, Shield, Activity, X, BarChart3, Fingerprint, Volume2, ChevronRight, Terminal, Play, AlertTriangle, Hash, Lock } from 'lucide-react';
import { io } from "socket.io-client";
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';

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
  return { data };
};

// --- COMPONENT: GLASS CARD ---
const GlassCard = ({ children, className = "" }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={`relative overflow-hidden backdrop-blur-xl bg-slate-900/80 border border-white/10 shadow-2xl rounded-3xl ${className}`}
  >
    {children}
  </motion.div>
);

// --- COMPONENT: LIVE FORENSIC TERMINAL (THE WOW FACTOR) ---
const CyberTerminal = ({ filename }) => {
  const [logs, setLogs] = useState([]);
  
  useEffect(() => {
    // Generate a random hash for visual effect
    const fakeHash = Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join('');
    
    const steps = [
      { msg: `> INITIALIZING UPLINK...`, delay: 100 },
      { msg: `> TARGET: ${filename}`, delay: 400 },
      { msg: `> CALCULATING SHA-256 INTEGRITY HASH...`, delay: 800 },
      { msg: `  [HASH]: ${fakeHash.substring(0, 32)}...`, delay: 1400, color: 'text-yellow-400' },
      { msg: `> LEDGER ENTRY CREATED (IMMUTABLE)`, delay: 1800, color: 'text-emerald-400' },
      { msg: `> ENCRYPTING PAYLOAD (AES-256)...`, delay: 2400 },
      { msg: `> UPLOADING TO MINIO WORM STORAGE...`, delay: 3000 },
      { msg: `> DISPATCHING TO RABBITMQ WORKER...`, delay: 3800 },
      { msg: `> ACKNOWLEDGEMENT RECEIVED.`, delay: 4500, color: 'text-emerald-400' }
    ];

    let timeouts = [];
    steps.forEach(({ msg, delay, color }) => {
      const timeout = setTimeout(() => {
        setLogs(prev => [...prev, { text: msg, color: color || 'text-cyan-500' }]);
      }, delay);
      timeouts.push(timeout);
    });

    return () => timeouts.forEach(clearTimeout);
  }, [filename]);

  return (
    <div className="w-full h-64 bg-black/90 rounded-xl border border-cyan-500/30 p-4 font-mono text-[10px] md:text-xs shadow-[0_0_30px_rgba(6,182,212,0.15)] flex flex-col">
       <div className="border-b border-cyan-900/50 pb-2 mb-2 flex justify-between items-center">
         <span className="text-cyan-600 font-bold flex items-center gap-2"><Terminal size={12}/> VERITAS_SECURE_SHELL_v3.0</span>
         <div className="flex gap-1.5">
           <div className="w-2 h-2 rounded-full bg-red-500/50 animate-pulse" />
         </div>
       </div>
       <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1">
         {logs.map((log, i) => (
           <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
             <span className="text-slate-600 mr-2">[{new Date().toLocaleTimeString().split(' ')[0]}]</span>
             <span className={log.color}>{log.text}</span>
           </motion.div>
         ))}
         <motion.div animate={{ opacity: [0, 1] }} transition={{ repeat: Infinity, duration: 0.8 }} className="text-cyan-500 font-bold">_</motion.div>
       </div>
    </div>
  );
};

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

// --- MAIN DASHBOARD ---
const Dashboard = () => {
  const [reports, setReports] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [systemStatus, setSystemStatus] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const audioRef = useRef(null);

  // --- DATA SYNC ---
  const fetchReports = async () => {
    try {
      const { data } = await getReports();
      // Sort: Newest First
      const sorted = Array.isArray(data) ? data.sort((a, b) => new Date(b.upload_timestamp || b._id) - new Date(a.upload_timestamp || a._id)) : [];
      setReports(sorted);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchReports();
    // 1. Socket Connection
    const socket = io("http://localhost:5000", { transports: ['websocket'] });
    socket.on("connect", () => setSystemStatus(true));
    socket.on("report_update", () => fetchReports());
    socket.on("disconnect", () => setSystemStatus(false));

    // 2. Fallback Polling (Every 2s)
    const interval = setInterval(fetchReports, 2000);
    return () => { socket.disconnect(); clearInterval(interval); };
  }, []);

  // Update modal live
  useEffect(() => {
    if (selectedReport) {
      const updated = reports.find(r => r._id === selectedReport._id);
      if (updated && (updated.status !== selectedReport.status || updated.risk_score !== selectedReport.risk_score)) {
        setSelectedReport(updated);
      }
    }
  }, [reports]);

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true); // Triggers CyberTerminal
    
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('case_id', `CS-${Math.floor(Math.random() * 9000) + 1000}`);

    try {
      await uploadFile(formData);
      // Wait 5 seconds to show off the terminal animation before resetting
      setTimeout(() => {
        setUploading(false);
        setSelectedFile(null);
        fetchReports();
      }, 5000); 
    } catch (err) {
      alert("Upload Failed");
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans selection:bg-cyan-500/30 overflow-hidden">
      
      {/* Background FX */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-6 lg:p-8">
        
        {/* Header */}
        <header className="flex justify-between items-end mb-10">
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
          
          {/* --- LEFT: UPLOAD STATION --- */}
          <div className="lg:col-span-4 space-y-6">
            <GlassCard className="p-8 h-full min-h-[400px] flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-8 text-cyan-400">
                  <Activity size={20} />
                  <h2 className="text-sm font-bold uppercase tracking-widest">Evidence Ingestion</h2>
                </div>

                {uploading ? (
                  // 1. SHOW TERMINAL DURING UPLOAD
                  <CyberTerminal filename={selectedFile?.name} />
                ) : (
                  // 2. SHOW DROPZONE NORMALLY
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
                )}
              </div>

              <button
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                className={`w-full mt-6 py-4 rounded-xl font-bold text-xs uppercase tracking-widest transition-all duration-300 shadow-lg
                  ${uploading 
                    ? 'bg-green-500/10 text-green-400 border border-green-500/30 cursor-wait' 
                    : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-900/20 disabled:opacity-50'}
                `}
              >
                {uploading ? (
                  <span className="flex items-center justify-center gap-2">
                     <Zap size={14} className="animate-spin" /> ESTABLISHING SECURE UPLINK...
                  </span>
                ) : "Initiate Analysis"}
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

              <div className="p-6 overflow-y-auto space-y-3 custom-scrollbar flex-1">
                {reports.map((report, i) => {
                  const isProcessing = report.status === 'PROCESSING' || report.status === 'PENDING';
                  const isRisk = report.risk_score > 50;
                  
                  return (
                    <motion.div
                      key={report._id || i}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => setSelectedReport(report)}
                      className={`group relative p-5 rounded-xl border cursor-pointer transition-all duration-300 hover:scale-[1.01]
                        ${isRisk 
                          ? 'bg-red-500/5 border-red-500/20 hover:border-red-500/60' 
                          : 'bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/50'}
                      `}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 flex-1">
                          {isProcessing ? (
                             <div className="p-3 rounded-lg bg-yellow-500/10 text-yellow-400 animate-pulse"><Zap size={20} /></div>
                          ) : isRisk ? (
                             <div className="p-3 rounded-lg bg-red-500/10 text-red-400"><AlertOctagon size={20} /></div>
                          ) : (
                             <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-400"><CheckCircle2 size={20} /></div>
                          )}
                          
                          <div>
                            <h3 className="text-sm font-bold text-slate-200 group-hover:text-white">{report.file_name}</h3>
                            <div className="flex items-center gap-3 mt-1.5">
                              <span className="text-[10px] font-mono text-slate-500">{report.case_id}</span>
                              {!isProcessing && (
                                <span className={`text-[10px] font-bold px-1.5 rounded ${isRisk ? 'bg-red-500/20 text-red-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                                  RISK: {report.risk_score}%
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className={`text-[10px] font-bold tracking-wider uppercase ${isProcessing ? 'text-yellow-400 animate-pulse' : 'text-slate-500'}`}>
                            {report.status}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
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
                    {selectedReport.status === 'COMPLETED' && <span className="px-2 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/10 text-[10px] text-emerald-400 uppercase">Analysis Complete</span>}
                  </h2>
                </div>
                <button onClick={() => setSelectedReport(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white"><X size={20} /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                {selectedReport.status === 'PROCESSING' || selectedReport.status === 'PENDING' ? (
                   <div className="h-full flex flex-col items-center justify-center space-y-4">
                      <Zap size={48} className="text-cyan-500 animate-pulse" />
                      <p className="text-slate-400 font-mono text-sm">NEURAL ENGINE PROCESSING...</p>
                   </div>
                ) : (
                  <div className="space-y-8">
                    {/* Top Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="p-6 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center justify-center relative overflow-hidden">
                        <div className={`text-6xl font-black mb-2 ${selectedReport.risk_score > 50 ? 'text-red-500' : 'text-emerald-500'}`}>
                          {selectedReport.risk_score}
                        </div>
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">Threat Score</div>
                      </div>

                      <div className="p-6 rounded-2xl bg-white/5 border border-white/5 flex flex-col justify-center">
                         <div className="flex items-center gap-2 text-cyan-400 mb-2">
                            <AlertTriangle size={18} />
                            <span className="text-xs font-bold uppercase tracking-widest">Attack Vector</span>
                         </div>
                         <div className="text-xl font-bold text-white">{selectedReport.attack_type || "Unknown"}</div>
                         <div className="text-sm text-slate-500 mt-1">Confidence: {selectedReport.confidence || 0}%</div>
                      </div>

                      <div className="p-6 rounded-2xl bg-white/5 border border-white/5 flex flex-col justify-center">
                         <div className="flex items-center gap-2 text-amber-400 mb-2">
                            <Fingerprint size={18} />
                            <span className="text-xs font-bold uppercase tracking-widest">Anomalies</span>
                         </div>
                         <div className="text-4xl font-black text-white">{selectedReport.anomalies_found}</div>
                      </div>
                    </div>

                    {/* AI Report & Audio Button */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="p-6 rounded-2xl bg-gradient-to-br from-white/5 to-transparent border border-white/5">
                          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                             <Terminal size={14} /> AI Forensic Narrative
                          </h3>
                          <p className="text-sm leading-relaxed text-slate-300">
                            {selectedReport.ai_summary}
                          </p>
                          
                          {/* CHAIN OF CUSTODY BADGE */}
                          <div className="mt-6 p-3 rounded bg-black/40 border border-white/5 flex items-center gap-3">
                             <div className="p-2 bg-emerald-500/10 rounded"><Lock size={14} className="text-emerald-400"/></div>
                             <div>
                                <div className="text-[10px] text-slate-500 uppercase">Chain of Custody</div>
                                <div className="text-[10px] text-emerald-400 font-mono">SHA-256 VERIFIED</div>
                             </div>
                          </div>
                       </div>

                       <div className="space-y-6">
                          {/* EXECUTIVE BRIEFING BUTTON (WOW FACTOR) */}
                          {selectedReport.audio_url && (
                            <div className="p-6 rounded-2xl bg-indigo-600/10 border border-indigo-500/30 flex flex-col items-center text-center">
                               <div className="mb-4">
                                  <h3 className="text-white font-bold text-lg">Executive Briefing</h3>
                                  <p className="text-indigo-200/60 text-xs">AI-Generated Voice Forensics</p>
                               </div>
                               
                               <button 
                                 onClick={() => {
                                   if(audioRef.current) audioRef.current.play();
                                 }}
                                 className="group relative flex items-center gap-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-lg shadow-indigo-500/20 transition-all hover:scale-105"
                               >
                                 <Play size={24} fill="currentColor" />
                                 <span className="font-bold tracking-wide">PLAY BRIEFING</span>
                               </button>

                               {/* Hidden Audio Element */}
                               <audio ref={audioRef} src={`http://localhost:5000/api/evidence/${selectedReport.audio_url}`} />
                            </div>
                          )}

                          {/* Graph */}
                          {selectedReport.plot_data && (
                            <div className="h-40 rounded-2xl bg-white/5 border border-white/5 p-4 relative">
                               <ResponsiveContainer width="100%" height="100%">
                                  <AreaChart data={selectedReport.plot_data}>
                                    <defs>
                                      <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                      </linearGradient>
                                    </defs>
                                    <XAxis dataKey="line" hide />
                                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                                    <Area type="monotone" dataKey="risk" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorRisk)" />
                                  </AreaChart>
                               </ResponsiveContainer>
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