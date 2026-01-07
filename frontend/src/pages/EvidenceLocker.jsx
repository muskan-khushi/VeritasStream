import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, FolderOpen, Filter, AlertTriangle, FileAudio } from 'lucide-react';
import api from '../api';

const EvidenceLocker = () => {
  const [cases, setCases] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Fetch all historical data
    api.get('/reports').then(res => setCases(res.data));
  }, []);

  const filteredCases = cases.filter(c => 
    c.case_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.file_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 min-h-screen bg-[#020617] text-slate-200">
      <header className="flex justify-between items-end mb-10">
        <div>
           <h1 className="text-4xl font-black text-white tracking-tighter">Evidence Locker</h1>
           <p className="text-slate-500 font-mono text-sm mt-2">SECURE ARCHIVE // RETENTION POLICY: PERMANENT</p>
        </div>
        
        {/* Search Bar */}
        <div className="relative group w-96">
           <Search className="absolute left-4 top-3.5 text-slate-500 group-focus-within:text-cyan-400" size={20} />
           <input 
             type="text" 
             placeholder="Search Case ID or Filename..." 
             className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-cyan-500/50 transition-all"
             onChange={(e) => setSearchTerm(e.target.value)}
           />
        </div>
      </header>

      {/* Grid of Evidence "Cards" */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredCases.map((item, i) => (
          <motion.div 
            key={item._id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className="group relative bg-slate-900/40 border border-white/5 hover:border-cyan-500/30 rounded-2xl p-6 transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-cyan-900/20 cursor-pointer overflow-hidden"
          >
            {/* Status Indicator Line */}
            <div className={`absolute top-0 left-0 w-full h-1 ${item.risk_score > 50 ? 'bg-red-500' : 'bg-emerald-500'}`} />

            <div className="flex justify-between items-start mb-4">
               <div className="p-3 bg-white/5 rounded-lg text-cyan-400 group-hover:bg-cyan-500/10 group-hover:text-cyan-300 transition-colors">
                  <FolderOpen size={24} />
               </div>
               <span className="font-mono text-xs text-slate-600">{new Date(item.upload_timestamp).toLocaleDateString()}</span>
            </div>

            <h3 className="text-lg font-bold text-white mb-1">{item.case_id}</h3>
            <p className="text-xs text-slate-500 truncate mb-4">{item.file_name}</p>

            <div className="space-y-2">
               <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Threat Level</span>
                  <span className={item.risk_score > 50 ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
                    {item.risk_score}%
                  </span>
               </div>
               
               {/* Mini Tags */}
               <div className="flex gap-2 mt-4">
                  {item.audio_url && (
                    <div className="px-2 py-1 bg-indigo-500/10 text-indigo-400 text-[10px] rounded border border-indigo-500/20 flex items-center gap-1">
                       <FileAudio size={10} /> Voice
                    </div>
                  )}
                  {item.risk_score > 80 && (
                    <div className="px-2 py-1 bg-red-500/10 text-red-400 text-[10px] rounded border border-red-500/20 flex items-center gap-1">
                       <AlertTriangle size={10} /> Critical
                    </div>
                  )}
               </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default EvidenceLocker;