import React from 'react';
import ThreatMap from '../components/ThreatMap';
import { Activity } from 'lucide-react';

const GlobalIntel = () => {
  return (
    <div className="p-8 h-screen flex flex-col">
      <header className="mb-6 flex justify-between items-end">
         <div>
            <h1 className="text-3xl font-bold text-white">Global Threat Intelligence</h1>
            <p className="text-slate-500 text-sm font-mono mt-1">REAL-TIME ATTACK VECTORS</p>
         </div>
         <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-full">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-red-400 text-xs font-bold uppercase tracking-widest">Live Telemetry</span>
         </div>
      </header>

      <div className="flex-1 bg-slate-900/50 border border-white/5 rounded-3xl overflow-hidden relative">
        {/* Full Screen Map */}
        <ThreatMap active={true} />

        {/* Overlay Stats */}
        <div className="absolute top-6 left-6 w-64 space-y-4">
           <div className="p-4 bg-black/80 backdrop-blur border border-white/10 rounded-xl">
              <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">Active Threats</div>
              <div className="text-3xl font-mono text-cyan-400">142</div>
           </div>
           <div className="p-4 bg-black/80 backdrop-blur border border-white/10 rounded-xl">
              <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">Network Load</div>
              <div className="text-3xl font-mono text-emerald-400 flex items-center gap-2">
                 45% <Activity size={16} />
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalIntel;