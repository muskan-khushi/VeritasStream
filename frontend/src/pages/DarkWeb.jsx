import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Globe, ShieldAlert, Terminal, Eye, Wifi } from 'lucide-react';

const DarkWeb = () => {
  const [logs, setLogs] = useState([]);

  // Fake "Live Hacking" Log Generator
  useEffect(() => {
    const interval = setInterval(() => {
      const ips = ["192.168.0.1", "10.0.0.55", "172.16.0.4", "89.201.3.44"];
      const threats = ["SQL Injection", "Brute Force", "XSS Payload", "Tor Exit Node"];
      const newLog = `[WARN] INTERCEPTED: ${threats[Math.floor(Math.random()*threats.length)]} FROM ${ips[Math.floor(Math.random()*ips.length)]}`;
      
      setLogs(prev => [newLog, ...prev].slice(0, 15)); // Keep last 15 lines
    }, 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-8 h-screen bg-[#0a0a0a] text-green-500 font-mono overflow-hidden flex flex-col relative">
      {/* CRT Monitor Scanline Effect */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-50 pointer-events-none bg-[length:100%_4px,3px_100%]" />

      <header className="mb-8 flex justify-between border-b border-green-900/50 pb-4">
         <div className="flex items-center gap-4">
            <Eye className="animate-pulse" />
            <h1 className="text-2xl font-bold tracking-widest">DARK_WEB_MONITOR_v9.0</h1>
         </div>
         <div className="flex items-center gap-2 text-red-500 font-bold animate-pulse">
            <Wifi size={18} /> LIVE CONNECTION
         </div>
      </header>

      <div className="grid grid-cols-3 gap-8 flex-1">
         {/* Column 1: The Matrix Log */}
         <div className="col-span-2 bg-black border border-green-800/50 p-4 rounded-xl overflow-hidden relative">
            <div className="absolute top-2 right-2 text-xs text-green-800">packet_sniffer.exe</div>
            <div className="space-y-2 mt-4">
               {logs.map((log, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ opacity: 0, x: -20 }} 
                    animate={{ opacity: 1 - (i * 0.05), x: 0 }} 
                    className="text-sm border-l-2 border-green-900 pl-2"
                  >
                     <span className="text-green-700">{new Date().toISOString().split('T')[1]}</span> {log}
                  </motion.div>
               ))}
            </div>
         </div>

         {/* Column 2: Threat Visuals */}
         <div className="space-y-6">
            <div className="bg-red-950/20 border border-red-900/50 p-6 rounded-xl text-center">
               <ShieldAlert className="mx-auto text-red-600 mb-2 animate-bounce" size={48} />
               <h3 className="text-red-500 font-bold text-xl">CRITICAL THREATS</h3>
               <div className="text-4xl font-black text-red-600 mt-2">03</div>
            </div>

            <div className="bg-green-950/10 border border-green-900/30 p-4 rounded-xl flex-1 h-64 flex items-center justify-center relative overflow-hidden">
               <Globe size={180} className="text-green-900/50 animate-spin-slow" />
               <div className="absolute inset-0 flex items-center justify-center text-xs text-green-400 tracking-widest">
                  SCANNING GLOBAL NODES...
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default DarkWeb;