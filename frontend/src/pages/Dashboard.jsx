import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, AlertOctagon, CheckCircle2, Zap, Shield, Activity, Lock, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { uploadFile, getReports } from '../api'; // Note the '../' to go up one folder!

// --- Glass Component ---
const GlassCard = ({ children, className = "", delay = 0 }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay: delay, ease: "easeOut" }}
    className={`relative overflow-hidden backdrop-blur-2xl bg-white/5 border border-white/10 shadow-2xl rounded-3xl ${className}`}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
    {children}
  </motion.div>
);

const NeonBadge = ({ active }) => (
  <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full border backdrop-blur-md ${
    active 
      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
      : 'bg-red-500/10 border-red-500/30 text-red-400'
  }`}>
    <div className={`w-2 h-2 rounded-full ${active ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
    <span className="text-[10px] font-bold tracking-widest uppercase">
      {active ? 'Neural Engine Online' : 'System Offline'}
    </span>
  </div>
);

const Dashboard = () => {
  const [reports, setReports] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [systemStatus, setSystemStatus] = useState(false);
  const navigate = useNavigate();

  // Poll Backend
  const fetchReports = async () => {
    try {
      const { data } = await getReports();
      setReports(data);
      setSystemStatus(true);
    } catch (err) {
      setSystemStatus(false);
    }
  };

  useEffect(() => {
    fetchReports();
    const interval = setInterval(fetchReports, 3000);
    return () => clearInterval(interval);
  }, []);

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
      alert("Transmission Interrupted");
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post('http://localhost:5000/api/auth/logout');
      navigate('/login');
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  return (
    <div className="min-h-screen text-slate-200 font-sans">
      {/* Background is now global in index.css, or we can keep local orbs here if you prefer */}
      
      <div className="relative z-10 max-w-7xl mx-auto p-6 lg:p-12">
        
        {/* Header */}
        <header className="flex justify-between items-end mb-16">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
            <h1 className="text-7xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 via-cyan-100 to-white drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]">
              Veritas
            </h1>
            <p className="text-cyan-200/60 text-lg flex items-center gap-2 mt-2 font-light">
              <Shield size={18} />
              Forensic Intelligence Stream v2.0
            </p>
          </motion.div>
          
          <div className="flex flex-col items-end gap-3">
             <NeonBadge active={systemStatus} />
             <button onClick={handleLogout} className="flex items-center gap-2 text-xs text-slate-500 hover:text-red-400 transition-colors">
                <LogOut size={12} /> TERMINATE SESSION
             </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Input Station */}
          <div className="lg:col-span-4 space-y-8">
            <GlassCard className="p-8" delay={0.2}>
              <div className="flex items-center gap-3 mb-8 text-cyan-300">
                <Activity size={24} />
                <h2 className="text-xl font-medium tracking-wide">Data Ingestion</h2>
              </div>

              <div className="relative group">
                <input type="file" onChange={(e) => setSelectedFile(e.target.files[0])} className="hidden" id="file" />
                <label 
                  htmlFor="file" 
                  className={`flex flex-col items-center justify-center h-56 border border-dashed rounded-2xl cursor-pointer transition-all duration-500
                    ${selectedFile 
                      ? 'border-cyan-500/50 bg-cyan-500/10 shadow-[0_0_30px_rgba(6,182,212,0.15)]' 
                      : 'border-white/10 hover:border-white/30 hover:bg-white/5'}
                  `}
                >
                  <div className={`p-4 rounded-full mb-4 transition-all duration-500 ${selectedFile ? 'bg-cyan-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.6)]' : 'bg-white/5 text-white/40'}`}>
                    {selectedFile ? <FileText size={32} /> : <Upload size={32} />}
                  </div>
                  <span className="text-sm font-medium text-white/70 tracking-wide">
                    {selectedFile ? selectedFile.name : "Drag & Drop Evidence"}
                  </span>
                </label>
              </div>

              <button
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                className="w-full mt-6 py-4 rounded-xl font-bold text-sm uppercase tracking-widest transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed
                  bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 bg-[length:200%_auto] hover:bg-right shadow-lg shadow-indigo-500/20 border border-white/10"
              >
                {uploading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Zap className="animate-spin" size={16} /> Encrypting...
                  </span>
                ) : (
                  "Initiate Analysis"
                )}
              </button>
            </GlassCard>
          </div>

          {/* Live Feed */}
          <div className="lg:col-span-8">
            <GlassCard className="h-full min-h-[600px] flex flex-col" delay={0.3}>
              <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/5 backdrop-blur-md">
                <h2 className="text-lg font-light text-white/90">Anomaly Detection Feed</h2>
                <div className="flex items-center gap-2 text-[10px] text-white/30 uppercase tracking-widest">
                  <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse"></span>
                  Live Websocket
                </div>
              </div>

              <div className="p-8 overflow-y-auto space-y-4 max-h-[600px] pr-4 custom-scrollbar">
                <AnimatePresence>
                  {reports.length === 0 ? (
                    <motion.div 
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="text-center text-white/20 py-24"
                    >
                      <AlertOctagon size={64} className="mx-auto mb-6 opacity-20" />
                      <p className="text-sm tracking-widest uppercase">Waiting for Input Stream...</p>
                    </motion.div>
                  ) : (
                    reports.map((report, i) => (
                      <motion.div
                        key={report._id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="group relative p-5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all duration-300 hover:scale-[1.01] hover:shadow-2xl"
                      >
                        <div className={`absolute left-0 top-6 w-1 h-8 rounded-r-full ${report.anomalies_found > 0 ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.6)]' : 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.6)]'}`} />

                        <div className="flex items-center justify-between pl-4">
                          <div className="flex items-center gap-5">
                            <div className={`p-3 rounded-xl ${report.anomalies_found > 0 ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                              {report.anomalies_found > 0 ? <AlertOctagon size={24} /> : <CheckCircle2 size={24} />}
                            </div>
                            <div>
                              <h3 className="text-lg font-medium text-white group-hover:text-cyan-300 transition-colors">
                                {report.file_name}
                              </h3>
                              <p className="text-xs text-white/40 font-mono mt-1">
                                {report.case_id}
                              </p>
                            </div>
                          </div>

                          <div className="text-right">
                             <div className={`text-2xl font-bold ${report.anomalies_found > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                {report.anomalies_found}
                             </div>
                             <div className="text-[9px] text-white/30 uppercase tracking-widest mt-1">Anomalies</div>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </GlassCard>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;