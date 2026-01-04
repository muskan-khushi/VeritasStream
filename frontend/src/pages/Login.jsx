import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Shield, ChevronRight, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api'; // <--- Now using your central API handler

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    console.log("🚀 Attempting Login..."); // Debug Log 1

    try {
      // Use the central API (automatically handles withCredentials)
      const response = await api.post('/auth/login', { username, password });
      
      console.log("✅ Login Success:", response.data); // Debug Log 2

      // 🎟️ Create Ticket Stub
      localStorage.setItem('isAuthenticated', 'true');
      
      // Redirect
      navigate('/dashboard');

    } catch (err) {
      console.error("❌ Login Failed:", err); // Debug Log 3
      
      if (!err.response) {
        setError('Server Unreachable. Is the Backend running?');
      } else if (err.response.status === 401) {
        setError('Access Denied: Invalid Credentials');
      } else {
        setError('Login Failed: ' + (err.response.data.message || err.message));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden text-slate-200 font-sans">
      
      <div className="fixed inset-0 bg-[#050505] z-0" />
      <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] rounded-full bg-indigo-600/10 blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-cyan-600/10 blur-[120px]" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="z-10 w-full max-w-md p-8 m-4 rounded-3xl backdrop-blur-2xl bg-white/5 border border-white/10 shadow-2xl relative"
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50" />

        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500/20 to-cyan-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/10 shadow-[0_0_30px_rgba(6,182,212,0.1)]">
            <Shield size={32} className="text-cyan-400" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60">
            VeritasStream
          </h1>
          <p className="text-slate-500 text-xs uppercase tracking-[0.2em] mt-3">Secure Forensic Environment</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle size={14} /> {error}
            </motion.div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-slate-500 pl-1">Identity</label>
            <div className="relative group">
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl p-4 pl-12 text-sm focus:outline-none focus:border-cyan-500/50 focus:bg-white/5 transition-all"
                placeholder="Agent ID"
              />
              <Shield size={16} className="absolute left-4 top-4 text-slate-600 group-focus-within:text-cyan-500 transition-colors" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-slate-500 pl-1">Passcode</label>
            <div className="relative group">
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl p-4 pl-12 text-sm focus:outline-none focus:border-cyan-500/50 focus:bg-white/5 transition-all"
                placeholder="••••••••••••"
              />
              <Lock size={16} className="absolute left-4 top-4 text-slate-600 group-focus-within:text-cyan-500 transition-colors" />
            </div>
          </div>

          <button 
            disabled={loading}
            className="w-full py-4 mt-2 bg-gradient-to-r from-indigo-600 to-cyan-600 rounded-xl font-bold text-sm tracking-widest hover:shadow-[0_0_40px_rgba(6,182,212,0.3)] transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Access System'} 
            {!loading && <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />}
          </button>
        </form>
      </motion.div>

      <div className="absolute bottom-8 text-[10px] text-slate-600 tracking-widest">
        ENCRYPTED CONNECTION ESTABLISHED
      </div>
    </div>
  );
};

export default Login;